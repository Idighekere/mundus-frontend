import { createFileRoute, Link, Outlet, useMatch, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useTrack } from '@watchupltd/react'
import { ArrowRightIcon, XIcon } from '@phosphor-icons/react'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { ContractorHomeSkeleton } from '@/components/skeletons'
import { useContractorSession } from '@/lib/contractor-session'
import { qk, useField, useInvalidate } from '@/lib/live-queries'
import { checkInsApi, contractorsApi, mediaApi } from '@/lib/api'
import { dequeueShot, listQueued, type QueuedShot } from '@/lib/offline-queue'
import { mapDaysSince, mapDumpPoint, mapSiteStatus } from '@/lib/backend-map'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/datetime'

export const Route = createFileRoute('/contractor/sites')({
  component: ContractorHome,
})

function ContractorHome() {
  const { session } = useContractorSession()
  const navigate = useNavigate()
  const invalidate = useInvalidate()
  const { data, isError, error, refetch } = useField()
  const track = useTrack()
  const [queue, setQueue] = useState<QueuedShot[]>(() => listQueued())
  const [draining, setDraining] = useState(false)
  const [drainError, setDrainError] = useState('')

  const drainQueue = async () => {
    const items = listQueued()
    if (items.length === 0 || draining) return
    setDraining(true)
    setDrainError('')
    for (const q of items) {
      try {
        const blob = await (await fetch(q.dataUrl)).blob()
        const up = await mediaApi.uploadPhoto(blob, `${q.type}-${Date.now()}.jpg`)
        await checkInsApi.submit({
          site_id: q.siteId,
          type: q.type,
          photo_url: up.photo_url,
          photo_hash: up.photo_hash,
          latitude: q.lat,
          longitude: q.lng,
          device_timestamp: q.atIso,
        })
        dequeueShot(q.id)
        track('checkin.offline_uploaded', { type: q.type, siteId: q.siteId })
      } catch {
        setDrainError('Some queued photos failed — staying offline? They remain queued.')
        break
      }
    }
    setQueue(listQueued())
    setDraining(false)
    await invalidate(qk.field, qk.history)
  }

  useEffect(() => {
    const onOnline = () => void drainQueue()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setQueue(listQueued())
  }, [])
  const liveSites = data?.sites
  const liveAlerts = data?.alerts
  const liveError = isError ? (error instanceof Error ? error.message : 'Could not load your sites.') : ''
  // Site detail is a nested route — render it in place of the list.
  const siteMatch = useMatch({ from: '/contractor/sites/$siteId', shouldThrow: false })

  const sites = useMemo(() => {
    return (liveSites ?? [])
      .map((d) => {
        const s = mapDumpPoint(d)
        const days = mapDaysSince(d, s.lastClearanceIso)
        return { ...s, days, status: mapSiteStatus(d.status) }
      })
      .sort((a, b) => b.days - a.days)
  }, [liveSites])

  const overdue = sites.filter((s) => s.days > 7).length

  interface AlertVM {
    key: string
    siteId: string
    title: string
    atIso: string
    photo?: string
  }

  const alerts: AlertVM[] = useMemo(() => {
    return (liveAlerts ?? [])
      .filter((a) => !a.is_seen)
      .map((a) => ({
        key: `alert-${a.id}`,
        siteId: String(a.site_id),
        title: a.site_name ? `${a.site_name} reported full` : a.message,
        atIso: a.created_at,
      }))
  }, [liveAlerts])

  const openAlert = async (a: AlertVM) => {
    try {
      await contractorsApi.markAlertSeen(a.siteId)
    } catch {
      // Best-effort — still navigate.
    }
    await invalidate(qk.field)
    navigate({ to: '/contractor/sites/$siteId', params: { siteId: a.siteId } })
  }

  const dismissAlert = async (a: AlertVM) => {
    try {
      await contractorsApi.markAlertSeen(a.siteId)
    } catch {
      // Best-effort.
    }
    await invalidate(qk.field)
  }

  if (!session) return null
  // Site detail is a nested route — render it in place of the list.
  if (siteMatch) return <Outlet />
  if (liveError && !liveSites) {
    return (
      <div className="mt-4">
        <Card className="text-center">
          <p className="font-display text-[28px] text-ink">Could not load your sites</p>
          <p className="mt-1 text-sm text-ink-soft">{liveError}</p>
          <Button variant="secondary" onClick={() => void refetch()} className="mt-4 w-full">
            Retry
          </Button>
        </Card>
      </div>
    )
  }
  if (!liveSites) {
    return (
      <div className="mt-4">
        <ContractorHomeSkeleton />
      </div>
    )
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-ink-soft">{session.contractorName}</p>
      <h1 className="text-xl font-normal text-ink">Hello, {session.name.split(' ')[0]}</h1>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Assigned</p>
          <p className="mt-1 font-display text-4xl text-ink">{sites.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Overdue</p>
          <p className={cn('mt-1 font-display text-4xl', overdue > 0 ? 'text-[#be3b3b]' : 'text-ink')}>{overdue}</p>
        </Card>
      </div>

      {queue.length > 0 ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-hairline bg-paper p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              {queue.length} photo{queue.length > 1 ? 's' : ''} queued offline
            </p>
            <p className="text-xs text-ink-soft">Reconnect to upload automatically, or upload now.</p>
          </div>
          <Button onClick={() => void drainQueue()} disabled={draining} loading={draining} className="shrink-0">
            {draining ? 'Uploading…' : 'Upload now'}
          </Button>
        </div>
      ) : null}
      {drainError ? (
        <p role="alert" className="mt-2 rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{drainError}</p>
      ) : null}

      <h2 className="mt-6 text-base font-normal text-ink-soft">Your dump points</h2>
      <p className="text-sm text-ink-soft">Most overdue first.</p>

      {alerts.length > 0 ? (
        <div className="mt-3 space-y-2" role="alert">
          {alerts.map((r) => (
            <div key={r.key} className="flex items-center gap-3 rounded-2xl border border-[#c08014] bg-[#FDF3C4] p-3">
              {r.photo ? (
                <img src={r.photo} alt="Reported site" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{r.title}</p>
                <p className="text-xs text-ink-soft">{formatDateTime(r.atIso)}</p>
              </div>
              <button
                onClick={() => void openAlert(r)}
                className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center rounded-xl bg-primary px-4 font-action text-sm font-medium text-white"
              >
                View
              </button>
              <button
                onClick={() => void dismissAlert(r)}
                aria-label="Dismiss alert"
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-white/50"
              >
                <XIcon size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {sites.length === 0 ? (
        <Card className="mt-3 text-center">
          <p className="font-display text-[28px] text-ink">No sites assigned yet</p>
          <p className="mt-1">Ask the agency to assign your contractor to dump points.</p>
        </Card>
      ) : (
        <div className="mt-3 space-y-3">
          {sites.map((s) => (
            <Link
              key={s.id}
              to="/contractor/sites/$siteId"
              params={{ siteId: s.id }}
              className="block rounded-2xl border border-hairline bg-paper p-4 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{s.name}</p>
                  <p className={cn('text-sm font-medium', s.days > 7 ? 'text-[#be3b3b]' : 'text-ink-soft')}>
                    {s.days === 0 ? 'Cleared today' : `${s.days} days since clearance`}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <span className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 font-action text-sm font-bold text-on-primary">
                Check in <ArrowRightIcon size={16} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
