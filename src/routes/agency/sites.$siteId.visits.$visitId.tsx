import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Camera, CheckCircle, XCircle } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VisitSkeleton } from '@/components/skeletons'
import { Card } from '@/components/ui/misc'
import { VisitStatusBadge } from '@/components/visit-status'
import { contractorById, siteById, visitById, type Visit, type VisitPhoto } from '@/mocks/data'
import { hasLiveSession } from '@/lib/api'
import { fetchLiveSiteDetail, type LiveSiteDetail } from '@/lib/live-timeline'

export const Route = createFileRoute('/agency/sites/$siteId/visits/$visitId')({
  component: VisitPage,
})

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
}

function PhotoPanel({ label, photo, siteLat, siteLng }: { label: 'Before' | 'After'; photo?: VisitPhoto; siteLat: number; siteLng: number }) {
  void siteLat
  void siteLng
  if (!photo) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-canvas p-6 text-center text-ink-soft">
        <Camera size={28} />
        <p className="text-sm font-semibold">No {label.toLowerCase()} photo recorded</p>
      </div>
    )
  }
  const within = photo.distanceM <= 100
  return (
    <div>
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl bg-cloud p-6 text-center text-ink-soft">
        <Camera size={32} />
        <p className="text-sm">{label} photo — GPS locked</p>
        <p className="font-mono text-xs">{photo.lat.toFixed(4)}° N, {photo.lng.toFixed(4)}° E</p>
      </div>
      <div className="mt-2 space-y-1.5 rounded-xl bg-paper p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-ink-soft">Timestamp</span>
          <span className="font-mono font-semibold text-ink">{fmtDateTime(photo.atIso)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-ink-soft">Coordinates</span>
          <span className="font-mono font-semibold text-ink">{photo.lat.toFixed(4)}° N, {photo.lng.toFixed(4)}° E</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-ink-soft">Distance from site</span>
          <span className={`font-semibold ${within ? 'text-[#1d6f42]' : 'text-[#be3b3b]'}`}>{photo.distanceM} m from site</span>
        </div>
      </div>
    </div>
  )
}

function VisitPage() {
  const { siteId, visitId } = Route.useParams()
  const numericId = Number(siteId)
  const liveMode = hasLiveSession() && Number.isFinite(numericId)
  const [liveDetail, setLiveDetail] = useState<LiveSiteDetail | null>(null)
  const [liveError, setLiveError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!liveMode) return
    fetchLiveSiteDetail(numericId).then(
      (d) => setLiveDetail(d),
      (err) => setLiveError(err instanceof Error ? err.message : 'Could not load this visit.'),
    )
  }, [liveMode, numericId, siteId, attempt])

  const site = liveMode ? liveDetail?.site : siteById(siteId)
  const visit: Visit | undefined = liveMode
    ? liveDetail?.timeline.find((v) => v.id === visitId)
    : visitById(siteId, visitId)
  if (liveMode && !liveDetail) {
    return liveError ? (
      <div>
        <p className="font-display text-4xl text-ink">Could not load this visit</p>
        <p className="mt-1 text-ink-soft">{liveError}</p>
        <Button variant="secondary" className="mt-4" onClick={() => { setLiveError(''); setAttempt((a) => a + 1) }}>
          Retry
        </Button>
      </div>
    ) : (
      <VisitSkeleton />
    )
  }
  if (!site || !visit) throw notFound()
  const contractorName = liveDetail ? liveDetail.contractorName : contractorById(site.contractorId).name

  const geofencePass = visit.before && visit.after
    ? visit.before.distanceM <= 100 && visit.after.distanceM <= 100
    : visit.before ? visit.before.distanceM <= 100 : null
  const duplicatePass = visit.status === 'duplicate-photo' ? false : null
  const checks: { label: string; state: 'pass' | 'fail' | 'pending' }[] = [
    { label: 'Within 100 m of the site', state: geofencePass === null ? 'pending' : geofencePass ? 'pass' : 'fail' },
    { label: 'Timestamp matches server time', state: visit.status === 'reported-full' ? 'pending' : 'pass' },
    { label: 'Photo not used before', state: duplicatePass === false ? 'fail' : 'pass' },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-medium text-ink-soft">
        <Link to="/agency/dashboard" className="inline-flex items-center gap-1 hover:text-primary">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <span>/</span>
        <Link to="/agency/sites/$siteId" params={{ siteId }} className="hover:text-primary">{site.name}</Link>
        <span>/</span>
        <span className="font-semibold text-ink">Visit: {fmtDateTime(visit.dateIso)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-4xl text-ink">{site.name}</h2>
        <VisitStatusBadge status={visit.status} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-canvas p-4 sm:grid-cols-3">
        <div><p className="text-xs uppercase tracking-wide text-ink-soft">Visit date</p><p className="font-semibold text-ink">{fmtDateTime(visit.dateIso)}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-ink-soft">Contractor</p><p className="font-semibold text-ink">{visit.contractor}</p></div>
        <div><p className="text-xs uppercase tracking-wide text-ink-soft">Contractor</p><p className="font-semibold text-ink">{contractorName}</p></div>
      </div>

      {visit.status === 'reported-full' ? (
        <Card className="mt-4">
          <h3 className="font-display text-[28px] text-ink">Community report</h3>
          <p className="mt-1 text-ink-soft">{visit.note}</p>
          {visit.ticket ? <Badge variant="neutral" className="mt-3">Ticket #{visit.ticket}</Badge> : null}
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <h3 className="mb-3 font-display text-[28px] text-ink">Before</h3>
            <PhotoPanel label="Before" photo={visit.before} siteLat={site.lat} siteLng={site.lng} />
          </Card>
          <Card>
            <h3 className="mb-3 font-display text-[28px] text-ink">After</h3>
            <PhotoPanel label="After" photo={visit.after} siteLat={site.lat} siteLng={site.lng} />
          </Card>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-display text-[28px] text-ink">Checks</h3>
        <div className="mt-2 space-y-2">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center justify-between rounded-xl bg-canvas p-4">
              <span className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold text-ink">
                {c.state === 'pass' ? <CheckCircle size={22} weight="fill" className="shrink-0 text-[#1d6f42]" />
                  : c.state === 'fail' ? <XCircle size={22} weight="fill" className="shrink-0 text-[#be3b3b]" />
                  : <span className="h-5 w-5 shrink-0 rounded-full border-2 border-hairline" />}
                {c.label}
              </span>
              <span className={`shrink-0 text-sm font-semibold ${c.state === 'pass' ? 'text-[#1d6f42]' : c.state === 'fail' ? 'text-[#be3b3b]' : 'text-ink-soft'}`}>
                {c.state === 'pass' ? 'Passed' : c.state === 'fail' ? 'Flagged' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
