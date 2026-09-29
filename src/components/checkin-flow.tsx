import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Camera, CheckCircle, CloudSlash, Crosshair, Info,
  MapPin, VideoCameraSlash, Warning,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { currentPosition, type GeoFix } from '@/lib/geocode'
import { haversineMeters } from '@/lib/haversine'
import { sha256Hex } from '@/lib/photo-hash'
import { checkInsApi, mediaApi } from '@/lib/api'
import { recordSubmission, useSubmissions, type Submission } from '@/mocks/contractor-store'
import { contractorById, type DumpPoint } from '@/mocks/data'

type Stage =
  | 'primer' | 'live' | 'review' | 'uploading'
  | 'denied-camera' | 'denied-location' | 'unsupported'
  | 'offline' | 'server-error'
  | 'success-before' | 'success-complete' | 'flagged-location' | 'flagged-duplicate'

interface Shot {
  dataUrl: string
  lat: number
  lng: number
  accuracyM: number | null
  simulated: boolean
  atIso: string
}

const WEAK_AFTER_M = 50

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

export function CheckinFlow({
  type, site, supervisor, simulateGps, live, onDone,
}: {
  type: 'before' | 'after'
  site: DumpPoint
  supervisor: string
  simulateGps: boolean
  live?: boolean
  onDone: (next?: 'after' | 'sites') => void
}) {
  const [stage, setStage] = useState<Stage>('primer')
  const [shot, setShot] = useState<Shot | null>(null)
  const [fix, setFix] = useState<GeoFix | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Submission | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const submissions = useSubmissions()
  const label = type === 'before' ? 'Before' : 'After'

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  useEffect(() => stopStream, [])

  // Live GPS watch (real mode only) for the weak/locked chip.
  useEffect(() => {
    if (stage !== 'live' || simulateGps || !navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      (pos) => setFix({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null,
      }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 0 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [stage, simulateGps])

  const startCamera = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setStage('unsupported')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      stopStream()
      streamRef.current = stream
      setStage('live')
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      setStage('denied-camera')
    }
  }

  const locate = async (): Promise<GeoFix & { simulated: boolean }> => {
    if (simulateGps) {
      await new Promise((r) => setTimeout(r, 500))
      const j = (v: number) => v + ((Math.random() - 0.5) * 20) / 111_320
      return { lat: j(site.lat), lng: j(site.lng), accuracyM: 12, simulated: true }
    }
    try {
      const f = await currentPosition()
      return { ...f, simulated: false }
    } catch (err) {
      if (err instanceof Error && /denied|permission/i.test(err.message)) setStage('denied-location')
      throw err
    }
  }

  const capture = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    try {
      const f = await locate()
      const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
      setShot({
        dataUrl: canvas.toDataURL('image/jpeg', 0.75),
        lat: f.lat, lng: f.lng, accuracyM: f.accuracyM, simulated: f.simulated,
        atIso: new Date().toISOString(),
      })
      setStage('review')
    } catch {
      if (stage === 'live') setError('Could not read location. Try again.')
    }
  }

  // Live upload: photo → media service → check-in record. The result is
  // also stored locally so today's flow state and history keep working.
  const uploadLive = async (shot: Shot) => {
    const siteId = Number(site.id)
    if (!Number.isFinite(siteId)) {
      setStage('server-error')
      return
    }
    try {
      setProgress(96)
      const blob = await (await fetch(shot.dataUrl)).blob()
      const up = await mediaApi.uploadPhoto(blob, `${type}-${Date.now()}.jpg`)
      const res = await checkInsApi.submit({
        site_id: siteId,
        type,
        photo_url: up.photo_url,
        photo_hash: up.photo_hash,
        latitude: shot.lat,
        longitude: shot.lng,
        device_timestamp: shot.atIso,
      })
      const serverDistance = Math.round(res.distance_from_site_meters)
      const isDuplicate = res.status === 'flagged'
      const isOffTarget = res.status === 'location_mismatch' || serverDistance > 100
      const entry = recordSubmission({
        siteId: site.id,
        supervisor,
        type,
        photo: shot.dataUrl,
        lat: shot.lat, lng: shot.lng,
        accuracyM: shot.accuracyM,
        simulated: shot.simulated,
        distanceM: serverDistance,
        flagged: isDuplicate || isOffTarget,
        flagReason: isDuplicate ? 'duplicate' : isOffTarget ? 'location' : undefined,
        hash: up.photo_hash,
      })
      setProgress(100)
      await new Promise((r) => setTimeout(r, 250))
      stopStream()
      setResult(entry)
      if (isDuplicate) setStage('flagged-duplicate')
      else if (isOffTarget) setStage('flagged-location')
      else setStage(type === 'before' ? 'success-before' : 'success-complete')
    } catch {
      setStage('server-error')
    }
  }

  const upload = async () => {
    if (!shot) return
    setStage('uploading')
    setProgress(0)
    setError('')
    try {
      if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
        setStage('offline')
        return
      }
      // Staged progress while the photo leaves the device.
      for (const p of [12, 34, 58, 79, 92]) {
        await new Promise((r) => setTimeout(r, 320))
        setProgress(p)
      }
      const hash = await sha256Hex(shot.dataUrl)
      if (live) {
        await uploadLive(shot)
        return
      }
      const duplicate = hash ? submissions.find((s) => s.hash === hash) : undefined
      const distanceM = Math.round(haversineMeters({ lat: site.lat, lng: site.lng }, { lat: shot.lat, lng: shot.lng }))
      const entry = recordSubmission({
        siteId: site.id,
        supervisor,
        type,
        photo: shot.dataUrl,
        lat: shot.lat, lng: shot.lng,
        accuracyM: shot.accuracyM,
        simulated: shot.simulated,
        distanceM,
        flagged: !!duplicate || distanceM > 100,
        flagReason: duplicate ? 'duplicate' : distanceM > 100 ? 'location' : undefined,
        hash: hash ?? undefined,
      })
      setProgress(100)
      await new Promise((r) => setTimeout(r, 250))
      stopStream()
      setResult(entry)
      if (duplicate) setStage('flagged-duplicate')
      else if (distanceM > 100) setStage('flagged-location')
      else setStage(type === 'before' ? 'success-before' : 'success-complete')
    } catch {
      setStage('server-error')
    }
  }

  const backHeader = (title: string) => (
    <button onClick={() => { stopStream(); onDone() }} className="mb-3 inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink">
      <ArrowLeft size={18} /> {title}
    </button>
  )

  /* ---------- stages ---------- */

  if (stage === 'primer') {
    return (
      <div className="mt-4">
        {backHeader(site.name)}
        <Card>
          <p className="text-sm text-ink-soft">Mundus needs your camera and location to confirm you are at the dump point. Photos must be taken with the in-app camera.</p>
          <div className="mt-4 space-y-3">
            <div className="flex gap-3 rounded-xl bg-canvas p-4">
              <Camera size={24} className="shrink-0 text-primary" />
              <div><p className="font-semibold text-ink">Camera</p><p className="text-sm text-ink-soft">To take the before and after photos</p></div>
            </div>
            <div className="flex gap-3 rounded-xl bg-canvas p-4">
              <MapPin size={24} className="shrink-0 text-primary" />
              <div><p className="font-semibold text-ink">Location</p><p className="text-sm text-ink-soft">To confirm you are at the dump point</p></div>
            </div>
          </div>
          <Button onClick={startCamera} className="mt-4 w-full">
            Grant permissions & continue <ArrowRight size={18} />
          </Button>
        </Card>
      </div>
    )
  }

  if (stage === 'denied-camera' || stage === 'denied-location' || stage === 'unsupported') {
    const isCam = stage === 'denied-camera'
    return (
      <div className="mt-4">
        {backHeader(site.name)}
        <Card className="text-center">
          {isCam ? <VideoCameraSlash size={40} className="mx-auto text-[#be3b3b]" />
            : <Crosshair size={40} className="mx-auto text-[#be3b3b]" />}
          <h2 className="mt-2 text-xl font-bold text-ink">
            {stage === 'unsupported' ? 'In-app capture not supported here'
              : isCam ? 'Camera permission is required' : 'Location permission is required'}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {stage === 'unsupported'
              ? 'This browser cannot open the camera. Use a phone with camera access over HTTPS.'
              : isCam
                ? 'Mundus cannot take photos without access to your phone camera. Visits must be documented live on site.'
                : `Mundus cannot confirm your presence at ${site.name} without location access. GPS coordinates must be attached to every photo.`}
          </p>
          {stage !== 'unsupported' ? (
            <div className="mt-4 rounded-xl bg-canvas p-4 text-left text-sm">
              <p className="font-semibold text-ink">How to enable {isCam ? 'camera' : 'location'} access:</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-ink-soft">
                <li>Open phone Settings</li>
                <li>Tap Apps{isCam ? '' : ' / Location'} or Site Settings</li>
                <li>Select Mundus (or your browser)</li>
                <li>Set {isCam ? 'Camera' : 'Location'} permission to Allow{isCam ? '' : ' — with Precise Location ON'}</li>
              </ol>
            </div>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => onDone()} className="flex-1">Return to site</Button>
            {stage !== 'unsupported' ? <Button onClick={startCamera} className="flex-1">Try again</Button> : null}
          </div>
        </Card>
      </div>
    )
  }

  if (stage === 'live') {
    const weak = !simulateGps && (fix === null || (fix.accuracyM !== null && fix.accuracyM > WEAK_AFTER_M))
    return (
      <div className="mt-4">
        {backHeader(`${label} photo · ${site.name}`)}
        <div className="relative overflow-hidden rounded-2xl bg-ink">
          <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
          <div className="absolute inset-x-3 top-3">
            {simulateGps ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-semibold text-white">
                <Info size={14} /> Demo GPS · simulated fix
              </span>
            ) : fix && !weak ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d6f42] px-3 py-1.5 text-xs font-semibold text-white">
                <CheckCircle size={14} weight="fill" /> GPS locked · ±{fix.accuracyM ?? '?'} m
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c08014] px-3 py-1.5 text-xs font-semibold text-white">
                <Warning size={14} weight="fill" /> Weak GPS signal{fix?.accuracyM ? ` (accuracy ${fix.accuracyM} m)` : ''}. Move to an open area.
              </span>
            )}
          </div>
        </div>
        {error ? <p className="mt-2 rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
        <div className="mt-4 flex items-center gap-3">
          <Button variant="ghost" onClick={() => { stopStream(); onDone() }}>Cancel</Button>
          <button
            onClick={capture}
            aria-label={`Capture ${label} photo`}
            className="mx-auto flex h-[72px] w-[72px] cursor-pointer items-center justify-center rounded-full border-4 border-primary bg-paper shadow-xl"
          >
            <span className="h-12 w-12 rounded-full bg-primary" />
          </button>
          <span className="w-16" />
        </div>
      </div>
    )
  }

  if (stage === 'review' && shot) {
    return (
      <div className="mt-4">
        {backHeader(site.name.toUpperCase())}
        <p className="text-lg font-semibold text-ink">Step {type === 'before' ? 1 : 2}: {label}</p>
        <img src={shot.dataUrl} alt={`${label} preview`} className="mt-2 aspect-[4/3] w-full rounded-2xl object-cover" />
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#e6f5ee] px-3 py-1.5 text-xs font-semibold text-primary">
          <CheckCircle size={14} weight="fill" /> Location recorded{shot.accuracyM !== null ? `, accuracy ${shot.accuracyM} m` : ''}
        </p>
        <Card className="mt-2 space-y-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-xs uppercase tracking-wide text-ink-soft">Captured time</span>
            <span className="font-mono font-semibold text-ink">{fmtDateTime(shot.atIso)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-xs uppercase tracking-wide text-ink-soft">GPS coordinates</span>
            <span className="font-mono font-semibold text-ink">{shot.lat.toFixed(4)}° N, {shot.lng.toFixed(4)}° E</span>
          </div>
        </Card>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => setStage('live')} className="flex-1">Retake</Button>
          <Button onClick={upload} className="flex-1">Submit <ArrowRight size={18} /></Button>
        </div>
      </div>
    )
  }

  if (stage === 'uploading') {
    return (
      <div className="mt-4">
        {backHeader(site.name)}
        <Card className="text-center">
          <p className="text-lg font-semibold text-ink">Uploading photo…</p>
          <p className="text-sm text-ink-soft">Do not close the app.</p>
          <p className="mt-4 font-display text-5xl text-ink">{progress}%</p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-cloud">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-xs text-ink-soft">{progress > 85 ? 'Finalizing state registry sync…' : 'Sending capture + GPS fix…'}</p>
        </Card>
      </div>
    )
  }

  if (stage === 'offline' || stage === 'server-error') {
    const offline = stage === 'offline'
    return (
      <div className="mt-4">
        {backHeader(site.name)}
        <Card className="text-center">
          <CloudSlash size={40} className="mx-auto text-[#c08014]" />
          <h2 className="mt-2 text-xl font-bold text-ink">{offline ? 'No connection' : 'Submission failed'}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {offline
              ? 'Your photo is kept on this screen. Reconnect and retry — nothing is lost.'
              : 'The server could not save your photo. Your capture is kept on this screen.'}
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => onDone()} className="flex-1">Back to site</Button>
            <Button onClick={() => (shot ? upload() : setStage('live'))} className="flex-1">Retry upload</Button>
          </div>
        </Card>
      </div>
    )
  }

  if ((stage === 'flagged-location' || stage === 'flagged-duplicate') && result) {
    const dup = stage === 'flagged-duplicate'
    return (
      <div className="mt-4">
        {backHeader(site.name)}
        <Card className="border-[#be3b3b]">
          <div className="flex items-center gap-2">
            <Warning size={28} weight="fill" className="shrink-0 text-[#be3b3b]" />
            <div>
              <h2 className="text-xl font-bold text-ink">{dup ? 'Duplicate photo' : 'Location mismatch'}</h2>
              <p className="text-sm font-semibold text-[#be3b3b]">{dup ? 'Photo already submitted' : `${result.distanceM} m off-target`}</p>
            </div>
          </div>
          <p className="mt-1 inline-block rounded-full bg-[#fde8e8] px-2.5 py-1 text-xs font-semibold text-[#be3b3b]">Submitted, but flagged</p>
          <p className="mt-2 text-sm text-ink-soft">
            {dup
              ? 'This exact photo was submitted before. The agency will see this flag.'
              : `Your photo was taken ${result.distanceM} m from ${site.name}. The agency will see this flag. If you were at the site, wait for GPS to settle and retake.`}
          </p>
          {!dup ? (
            <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs text-ink-soft">
              Stand in an open area clear of tall roofs or tree cover for 10–15 seconds to ensure satellite fix accuracy before snapping.
            </p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setStage('live')} className="flex-1">Retake photo</Button>
            <Button onClick={() => onDone()} className="flex-1">Keep submission</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (stage === 'success-before') {
    return (
      <div className="mt-4">
        {backHeader(site.name)}
        <Card className="text-center">
          <CheckCircle size={44} weight="fill" className="mx-auto text-[#1d6f42]" />
          <h2 className="mt-2 text-xl font-bold text-ink">Before photo submitted</h2>
          <p className="text-sm text-ink-soft">Submitted {fmtDateTime(result?.atIso ?? new Date().toISOString())}</p>
          <p className="mx-auto mt-3 max-w-sm rounded-xl bg-canvas px-3 py-2 text-sm text-ink">Step 1 complete. Take the after photo once clearance is finished.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => onDone()} className="flex-1">Back to site</Button>
            <Button onClick={() => onDone('after')} className="flex-1">Continue to after photo <ArrowRight size={18} /></Button>
          </div>
        </Card>
      </div>
    )
  }

  if (stage === 'success-complete' && result) {
    const contractor = contractorById(site.contractorId)
    return (
      <div className="mt-4">
        {backHeader(site.name)}
        <Card className="text-center">
          <CheckCircle size={44} weight="fill" className="mx-auto text-[#1d6f42]" />
          <h2 className="mt-2 text-xl font-bold text-ink">Visit complete. {site.name} cleared.</h2>
          <p className="mt-2 inline-block rounded-full bg-[#e6f5ee] px-3 py-1 font-display text-2xl text-primary">0 DAYS</p>
          <p className="mt-1 text-xs text-ink-soft">Days since clearance reset to 0.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-left">
            {(['before', 'after'] as const).map((k) => (
              <div key={k} className="rounded-xl bg-canvas p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink">{k}</p>
                <p className="mt-1 font-mono text-[11px] text-ink-soft">{result.lat.toFixed(4)}° N, {result.lng.toFixed(4)}° E</p>
              </div>
            ))}
          </div>
          <div className="mt-2 space-y-1.5 text-left text-sm">
            <div className="flex justify-between"><span className="text-ink-soft">Contractor</span><span className="font-semibold text-ink">{contractor.name}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Time</span><span className="font-semibold text-ink">{fmtDateTime(result.atIso)}</span></div>
          </div>
          <Button onClick={() => onDone('sites')} className="mt-4 w-full">Back to my sites</Button>
        </Card>
      </div>
    )
  }

  return null
}
