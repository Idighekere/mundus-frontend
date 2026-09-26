import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle, MapPin, Megaphone } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { siteById } from '@/mocks/data'
import { useContractorDirectory } from '@/mocks/contractor-store'
import {
  latestReportForSite, reportGate, reportsForReporter, resolveToken, seedDemoReporters, submitSiteReport,
} from '@/mocks/reporter-store'

export const Route = createFileRoute('/r/$token')({
  component: ReporterPage,
})

function timeAgo(iso: string): string {
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000
  if (h < 1) return 'less than an hour ago'
  if (h < 24) return `${Math.floor(h)} hours ago`
  return `${Math.floor(h / 24)} days ago`
}

function ReporterPhotoStep({ onPhoto, onSkip }: { onPhoto: (dataUrl: string) => void; onSkip: () => void }) {
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
      <p className="mt-1 text-sm text-ink-soft">Show the contractor exactly what you are reporting. Optional.</p>
      {blocked ? (
        <div className="mt-3 rounded-xl bg-canvas p-4 text-center text-sm text-ink-soft">
          <Camera size={28} className="mx-auto" />
          <p className="mt-2">Camera unavailable — you can still report without a photo.</p>
        </div>
      ) : (
        <div className="relative mt-3 overflow-hidden rounded-xl bg-ink">
          <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
          {!live ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">Starting camera…</div>
          ) : null}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={onSkip} className="flex-1">Skip photo</Button>
        <Button onClick={capture} disabled={!live} className="flex-1"><Camera size={18} /> Capture</Button>
      </div>
    </Card>
  )
}

function ReporterPage() {
  const { token } = Route.useParams()
  const [stage, setStage] = useState<'home' | 'photo' | 'confirm' | 'done'>('home')
  const [photo, setPhoto] = useState<string | null>(null)
  const [justReportedAt, setJustReportedAt] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  void tick

  const reporter = resolveToken(token)
  const directory = useContractorDirectory()

  if (!reporter) {
    const isDemoLink = token === 'demo-nwaniba-reporter-link'
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-16 text-center">
        <MapPin size={44} className="mx-auto text-[#be3b3b]" weight="fill" />
        <h1 className="mt-3 text-2xl font-bold text-ink">This reporting link is not valid</h1>
        <p className="mt-2 text-ink-soft">
          It may have been revoked or replaced. Contact the agency for a new link.
        </p>
        {isDemoLink ? (
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              seedDemoReporters()
              window.location.reload()
            }}
          >
            Restore example link
          </Button>
        ) : null}
      </main>
    )
  }

  const site = siteById(reporter.siteId)
  if (!site) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-16 text-center">
        <h1 className="mt-3 text-2xl font-bold text-ink">Site no longer exists</h1>
        <p className="mt-2 text-ink-soft">Contact the agency for a new reporting link.</p>
      </main>
    )
  }

  const gate = reportGate(site.id)
  const last = latestReportForSite(site.id)
  const mine = reportsForReporter(reporter.id)
  const contractorName = directory.find((c) => c.id === reporter.contractorId)?.name ?? 'Your contractor'

  const submit = () => {
    const res = submitSiteReport(site.id, reporter.id, photo ?? undefined)
    if (res.ok) {
      setJustReportedAt(new Date().toISOString())
      setStage('done')
      setTick((t) => t + 1)
    } else {
      setStage('home')
      setTick((t) => t + 1)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-8 pb-16">
      <Link to="/" aria-label="Mundus home" className="flex items-center gap-2 font-display text-xl tracking-wide text-ink"><LogoMark className="h-7 w-7" />MUNDUS</Link>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-soft">Reporter access · {reporter.name}</p>

      {stage === 'done' && justReportedAt ? (
        <Card className="mt-6 text-center">
          <CheckCircle size={44} weight="fill" className="mx-auto text-[#1d6f42]" />
          <h1 className="mt-2 text-2xl font-bold text-ink">Thank you. {contractorName} has been told.</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Reported at {new Date(justReportedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
          <Button variant="secondary" onClick={() => { setStage('home'); setPhoto(null) }} className="mt-4 w-full">
            Done
          </Button>
        </Card>
      ) : stage === 'photo' ? (
        <ReporterPhotoStep
          onPhoto={(dataUrl) => { setPhoto(dataUrl); setStage('confirm') }}
          onSkip={() => { setPhoto(null); setStage('confirm') }}
        />
      ) : stage === 'confirm' ? (
        <Card className="mt-6">
          <h1 className="text-2xl font-bold text-ink">Report {site.name} as full?</h1>
          <p className="mt-1 text-ink-soft">{contractorName} will be told this site is full.</p>
          {photo ? (
            <img src={photo} alt="Report preview" className="mt-3 aspect-[4/3] w-full rounded-xl object-cover" />
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setStage('photo')} className="flex-1">Back</Button>
            <Button onClick={submit} className="flex-1">Yes, report</Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
            <MapPin size={16} /> Assigned waste site
          </p>
          <h1 className="mt-1 text-3xl font-bold text-ink">{site.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {last ? `Last report: ${timeAgo(last.atIso)}` : 'No reports yet'}
          </p>
          {gate.open ? (
            <Button onClick={() => setStage('photo')} className="mt-4 w-full py-4 text-base">
              <Megaphone size={20} /> This site is full
            </Button>
          ) : (
            <div className="mt-4">
              <Button disabled className="w-full py-4 text-base opacity-60">
                <Megaphone size={20} /> This site is full
              </Button>
              <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-sm text-ink">
                You already reported this site. You can report again in {gate.retryIn}.
              </p>
            </div>
          )}
          <p className="mt-3 text-xs text-ink-soft">This link is personal to you and only works for {site.name}.</p>
        </Card>
      )}

      {mine.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-ink">Your reports</h2>
          <div className="mt-2 space-y-2">
            {mine.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-paper px-4 py-3 text-sm">
                {r.photo ? (
                  <img src={r.photo} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : null}
                <span className="min-w-0 flex-1 font-medium text-ink">{new Date(r.atIso).toLocaleString()}</span>
                <Badge variant="on-schedule">Dispatched</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  )
}
