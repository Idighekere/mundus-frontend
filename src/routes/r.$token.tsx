import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle, MapPin, Megaphone } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { ApiError, reportersApi } from '@/lib/api'
import { mapDumpPoint } from '@/lib/backend-map'
import type { DumpPoint } from '@/lib/models'

export const Route = createFileRoute('/r/$token')({
  component: ReporterPage,
})

function ReporterPhotoStep({ onPhoto, onBack }: { onPhoto: (dataUrl: string) => void; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [live, setLive] = useState(false)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    if (!navigator.mediaDevices?.getUserMedia) {
      setBlocked(true)
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play().catch(() => {})
        }
        setLive(true)
      })
      .catch(() => {
        if (!cancelled) setBlocked(true)
      })
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    onPhoto(canvas.toDataURL('image/jpeg', 0.75))
  }

  return (
    <Card className="mt-6">
      <h1 className="text-2xl font-bold text-ink">Snap the pile</h1>
      <p className="mt-1 text-sm text-ink-soft">A photo is required — show the contractor exactly what you are reporting.</p>
      {blocked ? (
        <div className="mt-3 rounded-xl bg-canvas p-4 text-center text-sm text-ink-soft">
          <Camera size={28} className="mx-auto" />
          <p className="mt-2 font-semibold text-ink">Camera access is required to report.</p>
          <p className="mt-1">Allow camera access for this page in your browser settings, then try again.</p>
          <Button variant="secondary" onClick={onBack} className="mt-3 w-full">Back</Button>
        </div>
      ) : (
        <>
          <div className="relative mt-3 overflow-hidden rounded-xl bg-ink">
            <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
            {!live ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">Starting camera…</div>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={onBack} className="flex-1">Back</Button>
            <Button onClick={capture} disabled={!live} className="flex-1"><Camera size={18} /> Capture</Button>
          </div>
        </>
      )}
    </Card>
  )
}

function ReporterPage() {
  const { token } = Route.useParams()
  const [stage, setStage] = useState<'home' | 'photo' | 'confirm' | 'done'>('home')
  const [photo, setPhoto] = useState<string | null>(null)
  const [justReportedAt, setJustReportedAt] = useState<string | null>(null)
  const [justPhoto, setJustPhoto] = useState<string | null>(null)
  const [flagError, setFlagError] = useState('')
  const [liveResolve, setLiveResolve] = useState<{
    reporterName: string
    site: DumpPoint
    siteId: number
    contractorName: string
  } | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveInvalid, setLiveInvalid] = useState(false)

  useEffect(() => {
    setLiveLoading(true)
    setLiveInvalid(false)
    reportersApi.resolveToken(token).then(
      (res) => {
        const raw = res.reporter as { name?: unknown }
        const siteDto = res.site
        setLiveResolve({
          reporterName: typeof raw.name === 'string' && raw.name ? raw.name : 'Reporter',
          site: mapDumpPoint(siteDto),
          siteId: siteDto.id,
          contractorName: siteDto.assigned_contractor_name ?? 'Your contractor',
        })
        setLiveLoading(false)
      },
      () => {
        setLiveInvalid(true)
        setLiveLoading(false)
      },
    )
  }, [token])

  if (liveLoading) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-16 text-center">
        <p className="font-display text-xl tracking-wide text-ink">MUNDUS</p>
        <p className="mt-4 text-ink-soft">Checking your reporting link…</p>
      </main>
    )
  }

  if (liveInvalid) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-16 text-center">
        <MapPin size={44} className="mx-auto text-[#be3b3b]" weight="fill" />
        <h1 className="mt-3 text-2xl font-bold text-ink">This reporting link is not valid</h1>
        <p className="mt-2 text-ink-soft">
          It may have been revoked or replaced. Contact the agency for a new link.
        </p>
      </main>
    )
  }

  const site = liveResolve?.site
  if (!site) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-16 text-center">
        <h1 className="mt-3 text-2xl font-bold text-ink">Site no longer exists</h1>
        <p className="mt-2 text-ink-soft">Contact the agency for a new reporting link.</p>
      </main>
    )
  }

  const contractorName = liveResolve?.contractorName ?? 'Your contractor'

  const submit = async () => {
    if (liveResolve) {
      if (!photo) return
      setFlagError('')
      const base = { site_id: liveResolve.siteId, reporter_token: token }
      try {
        // photo_url is not accepted by the backend yet — it is sent so
        // the photo starts persisting with zero frontend changes once added.
        await reportersApi.flag({ ...base, photo_url: photo })
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          try {
            await reportersApi.flag(base)
          } catch (fallbackErr) {
            setFlagError(fallbackErr instanceof Error ? fallbackErr.message : 'Could not send the report.')
            return
          }
        } else {
          setFlagError(err instanceof Error ? err.message : 'Could not send the report.')
          if (err instanceof ApiError && err.status === 429) setStage('home')
          return
        }
      }
      setJustReportedAt(new Date().toISOString())
      setJustPhoto(photo)
      setStage('done')
    }
  }

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-8 pb-16">
      <Link to="/" aria-label="Mundus home" className="flex items-center gap-2 font-display text-xl tracking-wide text-ink"><LogoMark className="h-7 w-7" />MUNDUS</Link>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-soft">Reporter access · {liveResolve?.reporterName ?? 'Reporter'}</p>

      {stage === 'done' && justReportedAt ? (
        <Card className="mt-6 text-center">
          <CheckCircle size={44} weight="fill" className="mx-auto text-[#1d6f42]" />
          <h1 className="mt-2 text-2xl font-bold text-ink">Thank you. {contractorName} has been told.</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Reported at {new Date(justReportedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
          {justPhoto ? (
            <img src={justPhoto} alt="Submitted report photo" className="mt-3 aspect-[4/3] w-full rounded-xl object-cover" />
          ) : null}
          <Button variant="secondary" onClick={() => { setStage('home'); setPhoto(null) }} className="mt-4 w-full">
            Done
          </Button>
        </Card>
      ) : stage === 'photo' ? (
        <ReporterPhotoStep
          onPhoto={(dataUrl) => { setPhoto(dataUrl); setStage('confirm') }}
          onBack={() => setStage('home')}
        />
      ) : stage === 'confirm' ? (
        <Card className="mt-6">
          <h1 className="text-2xl font-bold text-ink">Report {site.name} as full?</h1>
          <p className="mt-1 text-ink-soft">{contractorName} will be told this site is full.</p>
          {photo ? (
            <img src={photo} alt="Report preview" className="mt-3 aspect-[4/3] w-full rounded-xl object-cover" />
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setStage('photo')} className="flex-1">Retake</Button>
            <Button onClick={submit} disabled={!photo} className="flex-1">Yes, report</Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
            <MapPin size={16} /> Assigned waste site
          </p>
          <h1 className="mt-1 text-3xl font-bold text-ink">{site.name}</h1>
          <Button onClick={() => setStage('photo')} className="mt-4 w-full py-4 text-base">
            <Megaphone size={20} /> This site is full
          </Button>
          <p className="mt-3 text-xs text-ink-soft">This link is personal to you and only works for {site.name}.</p>
          {flagError ? (
            <p role="alert" className="mt-3 rounded-xl bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{flagError}</p>
          ) : null}
        </Card>
      )}

    </main>
  )
}
