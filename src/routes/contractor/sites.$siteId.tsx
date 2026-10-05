import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Camera, CheckCircle, Warning } from '@phosphor-icons/react'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { CheckinFlow } from '@/components/checkin-flow'
import { ReporterCard } from '@/components/reporter-card'
import { SiteMiniMap } from '@/components/site-mini-map'
import { useContractorSession } from '@/lib/contractor-session'
import { contractorsApi, type ContractorAlertDto, type CheckInDto, type DumpPointDto } from '@/lib/api'
import { mapDaysSince, mapDumpPoint, mapSiteStatus } from '@/lib/backend-map'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/datetime'

export const Route = createFileRoute('/contractor/sites/$siteId')({
  component: ContractorSiteDetail,
})

function ContractorSiteDetail() {
  const { siteId } = Route.useParams()
  const { session } = useContractorSession()
  const [liveSites, setLiveSites] = useState<DumpPointDto[] | null>(null)
  const [liveAlerts, setLiveAlerts] = useState<ContractorAlertDto[] | null>(null)
  const [liveError, setLiveError] = useState('')
  const navigate = useNavigate()
  const [capturing, setCapturing] = useState<'before' | 'after' | null>(null)
  const [simulateGps, setSimulateGps] = useState(true)
  const [tick, setTick] = useState(0)

  const liveDto = liveSites?.find((d) => String(d.id) === siteId)
  const liveSite = liveDto ? mapDumpPoint(liveDto) : undefined

  const loadField = useCallback(async () => {
    try {
      const sites = await contractorsApi.sites()
      setLiveSites(sites)
      setLiveError('')
      let alerts = await contractorsApi.alerts()
      if (alerts.some((a) => String(a.site_id) === siteId && !a.is_seen)) {
        try {
          await contractorsApi.markAlertSeen(Number(siteId))
        } catch {
          // Marking seen is best-effort — the banner still renders.
        }
        try {
          alerts = await contractorsApi.alerts()
        } catch {
          // Keep the previous alerts.
        }
      }
      setLiveAlerts(alerts)
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Could not load this site.')
    }
  }, [siteId])

  useEffect(() => {
    void loadField()
  }, [loadField])
  const [livePairs, setLivePairs] = useState<import('@/lib/api').SubmissionPairDto[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const pairs = await contractorsApi.submissions(Number(siteId))
        if (!cancelled) setLivePairs(pairs)
      } catch {
        if (!cancelled) setLivePairs([])
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, tick])

  const toShot = (c: CheckInDto | null | undefined) =>
    c ? { photo: c.photo_url, flagged: c.status !== 'valid' } : undefined

  const visit = useMemo(() => {
    const today = new Date().toDateString()
    const pair = (livePairs ?? []).find((pl) => new Date(pl.date).toDateString() === today)
    return { before: toShot(pair?.before), after: toShot(pair?.after) }
  }, [livePairs])

  if (liveError && !liveSites) {
    return (
      <div className="mt-4">
        <Card className="text-center">
          <p className="font-display text-[28px] text-ink">Could not load this site</p>
          <p className="mt-1 text-sm text-ink-soft">{liveError}</p>
          <Button variant="secondary" onClick={() => void loadField()} className="mt-4 w-full">
            Retry
          </Button>
        </Card>
      </div>
    )
  }
  if (!liveSites) {
    return (
      <div className="mt-4">
        <Card className="text-center">
          <p className="font-display text-[28px] text-ink">Loading site…</p>
          <p className="mt-1 text-sm text-ink-soft">Fetching the latest from the server.</p>
        </Card>
      </div>
    )
  }
  if (!session || !liveSite) return null
  const site = liveSite
  const days = liveDto ? mapDaysSince(liveDto, site.lastClearanceIso) : 0
  const status = liveDto ? mapSiteStatus(liveDto.status) : 'on-schedule'
  const assigned = !!liveDto
  const complete = !!(visit.before && visit.after)
  const flagged = visit.before?.flagged || visit.after?.flagged
  const liveAlert = liveAlerts
    ?.filter((a) => String(a.site_id) === site.id)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0]

  const flowDone = (next?: 'after' | 'sites') => {
    setTick((t) => t + 1)
    if (next === 'sites') navigate({ to: '/contractor/sites' })
    else setCapturing(next ?? null)
  }

  if (capturing) {
    return (
      <div className="mt-4">
        <CheckinFlow
          key={capturing}
          type={capturing}
          site={site}
          contractor={session.name}
          simulateGps={simulateGps}
          onDone={flowDone}
        />
      </div>
    )
  }

  return (
    <div className="mt-4">
      <Button variant="ghost" onClick={() => navigate({ to: '/contractor/sites' })} className="mb-2 pl-0">
        <ArrowLeft size={18} /> My sites
      </Button>

      {!assigned ? (
        <Card className="border-[#be3b3b] text-center">
          <p className="font-display text-[28px] text-ink">Not assigned to you</p>
          <p className="mt-1">This site belongs to another contractor.</p>
        </Card>
      ) : complete ? (
        <Card className="text-center">
          <CheckCircle size={40} weight="fill" className="mx-auto text-[#1d6f42]" />
          <h2 className="mt-2 text-2xl font-bold text-ink">Visit complete</h2>
          <p className="mt-1 text-ink-soft">{site.name} · before + after logged today.</p>
          {flagged ? (
            <p className="mx-auto mt-3 flex max-w-sm items-start gap-2 rounded-xl bg-[#fde8e8] px-3 py-2 text-left text-sm text-[#be3b3b]">
              <Warning size={18} className="mt-0.5 shrink-0" />
              One photo was captured outside the 100 m geofence and flagged for agency review.
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {visit.before ? <img src={visit.before.photo} alt="Before" className="aspect-[4/3] w-full rounded-xl object-cover" /> : null}
            {visit.after ? <img src={visit.after.photo} alt="After" className="aspect-[4/3] w-full rounded-xl object-cover" /> : null}
          </div>
          <Button variant="secondary" onClick={() => navigate({ to: '/contractor/sites' })} className="mt-4 w-full">
            Back to sites
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-ink">{site.name}</h2>
              <p className={cn('text-sm font-medium', days > 7 ? 'text-[#be3b3b]' : 'text-ink-soft')}>
                {days} days since clearance
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="mt-3">
            <SiteMiniMap name={site.name} lat={site.lat} lng={site.lng} />
          </div>

          {liveAlert ? (
            <div className="mt-3 flex gap-3 rounded-2xl border border-[#c08014] bg-[#FDF3C4] p-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">
                  {liveAlert.site_name ? `${liveAlert.site_name} reported full` : liveAlert.message}
                </p>
                <p className="text-xs text-ink-soft">
                  {formatDateTime(liveAlert.created_at)}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">This is what the reporter saw — verify on your visit.</p>
              </div>
            </div>
          ) : null}

          <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={simulateGps}
              onChange={(e) => setSimulateGps(e.target.checked)}
              className="h-5 w-5 accent-[#0B3D2C]"
            />
            Simulate on-site GPS (demo)
          </label>

          <div className="mt-3 space-y-3">
            <Card className={cn(visit.before && 'border-[#1d6f42]')}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink">Step 1 · Before photo</p>
                {visit.before ? <Badge variant="on-schedule">Done</Badge> : <Badge variant="neutral">Pending</Badge>}
              </div>
              {visit.before ? (
                <img src={visit.before.photo} alt="Before" className="mt-2 aspect-[16/10] w-full rounded-xl object-cover" />
              ) : (
                <Button onClick={() => setCapturing('before')} className="mt-3 w-full">
                  <Camera size={18} /> Take before photo
                </Button>
              )}
            </Card>

            <Card className={cn('relative', !visit.before && 'opacity-70', visit.after && 'border-[#1d6f42]')}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink">Step 2 · After photo</p>
                {visit.after ? <Badge variant="on-schedule">Done</Badge> : <Badge variant="neutral">{visit.before ? 'Pending' : 'Locked'}</Badge>}
              </div>
              {visit.after ? (
                <img src={visit.after.photo} alt="After" className="mt-2 aspect-[16/10] w-full rounded-xl object-cover" />
              ) : (
                <Button onClick={() => setCapturing('after')} disabled={!visit.before} className="mt-3 w-full">
                  <Camera size={18} /> Take after photo
                </Button>
              )}
              {!visit.before ? <p className="mt-2 text-xs text-ink-soft">Available after the before photo.</p> : null}
            </Card>
          </div>

          <p className="mt-3 text-xs text-ink-soft">
            Photos must be taken with the in-app camera — gallery uploads are not allowed. Location locks at capture.
          </p>

          <ReporterCard siteId={site.id} contractorId={session.contractorId} siteName={site.name} />
        </>
      )}

      <Link to="/contractor/history" className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-primary hover:underline">
        View my submission history →
      </Link>
    </div>
  )
}
