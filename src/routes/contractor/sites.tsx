import { createFileRoute, Link, Outlet, useMatch, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, X } from '@phosphor-icons/react'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { useContractorSession } from '@/lib/contractor-session'
import { dumpPoints, siteById } from '@/mocks/data'
import { markSiteReportsSeen, unseenReports, useReports } from '@/mocks/reporter-store'
import { contractorsApi, type ContractorAlertDto, type DumpPointDto } from '@/lib/api'
import { mapDaysSince, mapDumpPoint, mapSiteStatus } from '@/lib/backend-map'
import { daysSince, statusFor } from '@/lib/overdue'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/contractor/sites')({
  component: ContractorHome,
})

function ContractorHome() {
  const { session } = useContractorSession()
  const reportsState = useReports()
  const navigate = useNavigate()
  const live = session?.live ?? false
  const [liveSites, setLiveSites] = useState<DumpPointDto[] | null>(null)
  const [liveAlerts, setLiveAlerts] = useState<ContractorAlertDto[] | null>(null)
  const [liveError, setLiveError] = useState('')
  // Site detail is a nested route — render it in place of the list.
  const siteMatch = useMatch({ from: '/contractor/sites/$siteId', shouldThrow: false })

  const loadField = useCallback(async () => {
    try {
      const [sites, alerts] = await Promise.all([contractorsApi.sites(), contractorsApi.alerts()])
      setLiveSites(sites)
      setLiveAlerts(alerts)
      setLiveError('')
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Could not load your sites.')
    }
  }, [])

  useEffect(() => {
    if (live) void loadField()
  }, [live, loadField])

  const sites = useMemo(() => {
    if (liveSites) {
      return liveSites
        .map((d) => {
          const s = mapDumpPoint(d)
          const days = mapDaysSince(d, s.lastClearanceIso)
          return { ...s, days, status: mapSiteStatus(d.status) }
        })
        .sort((a, b) => b.days - a.days)
    }
    return dumpPoints
      .filter((s) => s.contractorId === session?.contractorId)
      .map((s) => {
        const days = daysSince(s.lastClearanceIso)
        return { ...s, days, status: statusFor(days) }
      })
      .sort((a, b) => b.days - a.days)
  }, [session?.contractorId, liveSites])

  const overdue = sites.filter((s) => s.days > 7).length

  interface AlertVM {
    key: string
    siteId: string
    title: string
    atIso: string
    photo?: string
  }

  const alerts: AlertVM[] = useMemo(() => {
    if (liveAlerts) {
      return liveAlerts
        .filter((a) => !a.is_seen)
        .map((a) => ({
          key: `alert-${a.id}`,
          siteId: String(a.site_id),
          title: a.site_name ? `${a.site_name} reported full` : a.message,
          atIso: a.created_at,
        }))
    }
    if (!session) return []
    return unseenReports(sites.map((s) => s.id)).map((r) => ({
      key: r.id,
      siteId: r.siteId,
      title: `${siteById(r.siteId)?.name ?? 'A site'} reported full`,
      atIso: r.atIso,
      photo: r.photo ?? undefined,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.contractorId, sites, reportsState, liveAlerts])

  const refreshAlerts = useCallback(async () => {
    try {
      setLiveAlerts(await contractorsApi.alerts())
    } catch {
      // Keep the previous alerts.
    }
  }, [])

  const openAlert = async (a: AlertVM) => {
    if (live) {
      try {
        await contractorsApi.markAlertSeen(Number(a.siteId))
      } catch {
        // Best-effort — still navigate.
      }
      await refreshAlerts()
    } else {
      markSiteReportsSeen(a.siteId)
    }
    navigate({ to: '/contractor/sites/$siteId', params: { siteId: a.siteId } })
  }

  const dismissAlert = async (a: AlertVM) => {
    if (live) {
      try {
        await contractorsApi.markAlertSeen(Number(a.siteId))
      } catch {
        // Best-effort.
      }
      await refreshAlerts()
    } else {
      markSiteReportsSeen(a.siteId)
    }
  }

  if (!session) return null
  // Site detail is a nested route — render it in place of the list.
  if (siteMatch) return <Outlet />
  if (live && liveError && !liveSites) {
    return (
      <div className="mt-4">
        <Card className="text-center">
          <p className="font-display text-[28px] text-ink">Could not load your sites</p>
          <p className="mt-1 text-sm text-ink-soft">{liveError}</p>
          <Button variant="secondary" onClick={() => void loadField()} className="mt-4 w-full">
            Retry
          </Button>
        </Card>
      </div>
    )
  }
  if (live && !liveSites) {
    return (
      <div className="mt-4">
        <Card className="text-center">
          <p className="font-display text-[28px] text-ink">Loading your sites…</p>
          <p className="mt-1 text-sm text-ink-soft">Fetching your assigned dump points.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-ink-soft">{session.contractorName}</p>
      <h1 className="text-xl font-normal text-ink">Hello, {session.supervisor.split(' ')[0]}</h1>
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
                <p className="text-xs text-ink-soft">{new Date(r.atIso).toLocaleString()}</p>
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
                <X size={18} />
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
                Check in <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
