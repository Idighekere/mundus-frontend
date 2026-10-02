import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useContractorSession } from '@/lib/contractor-session'
import { dumpPoints, siteById } from '@/mocks/data'
import { useSubmissions, type Submission } from '@/mocks/contractor-store'
import { contractorsApi, type CheckInDto, type DumpPointDto, type SubmissionPairDto } from '@/lib/api'
import { mapDumpPoint } from '@/lib/backend-map'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/contractor/history')({
  component: ContractorHistory,
})

interface Visit {
  key: string
  siteId: string
  day: string
  before?: Submission
  after?: Submission
}

function groupVisits(subs: Submission[]): Visit[] {
  const map = new Map<string, Visit>()
  for (const s of subs) {
    const day = new Date(s.atIso).toDateString()
    const key = `${s.siteId}|${day}`
    let visit = map.get(key)
    if (!visit) {
      visit = { key, siteId: s.siteId, day }
      map.set(key, visit)
    }
    if (s.type === 'before' && !visit.before) visit.before = s
    if (s.type === 'after' && !visit.after) visit.after = s
  }
  return [...map.values()].sort((a, b) => {
    const ta = Math.max(+new Date(a.before?.atIso ?? 0), +new Date(a.after?.atIso ?? 0))
    const tb = Math.max(+new Date(b.before?.atIso ?? 0), +new Date(b.after?.atIso ?? 0))
    return tb - ta
  })
}

function dayLabel(day: string): string {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86_400_000).toDateString()
  if (day === today) return 'Today'
  if (day === yesterday) return 'Yesterday'
  return new Date(day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

type StatusFilter = 'all' | 'complete' | 'pending' | 'flagged'

function pairToSubmissions(pair: SubmissionPairDto, contractor: string): Submission[] {
  const out: Submission[] = []
  const push = (c: CheckInDto | null | undefined) => {
    if (!c) return
    out.push({
      id: `srv-${c.id}`,
      siteId: String(pair.site_id),
      contractor,
      type: c.type,
      photo: c.photo_url,
      lat: c.latitude,
      lng: c.longitude,
      accuracyM: null,
      simulated: false,
      distanceM: Math.round(c.distance_from_site_meters),
      flagged: c.status !== 'valid',
      flagReason: c.status === 'flagged' ? 'duplicate' : c.status === 'location_mismatch' ? 'location' : undefined,
      hash: c.photo_hash,
      atIso: c.server_timestamp,
    })
  }
  push(pair.before)
  push(pair.after)
  return out
}

function ContractorHistory() {
  const { session } = useContractorSession()
  const mockAll = useSubmissions()
  const [search, setSearch] = useState('')
  const [site, setSite] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const live = session?.live ?? false
  const [livePairs, setLivePairs] = useState<SubmissionPairDto[] | null>(null)
  const [liveSites, setLiveSites] = useState<DumpPointDto[] | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState('')

  const loadHistory = useCallback(async () => {
    setLiveLoading(true)
    setLiveError('')
    try {
      const [pairs, sites] = await Promise.all([contractorsApi.submissions(), contractorsApi.sites()])
      setLivePairs(pairs)
      setLiveSites(sites)
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Could not load submissions.')
    } finally {
      setLiveLoading(false)
    }
  }, [])

  useEffect(() => {
    if (live) void loadHistory()
  }, [live, loadHistory])

  const all = useMemo<Submission[]>(() => {
    if (livePairs && session) return livePairs.flatMap((p) => pairToSubmissions(p, session.name))
    return mockAll.filter((s) => s.contractor === session?.name)
  }, [livePairs, mockAll, session])

  const siteNameOf = (siteId: string): string => {
    if (liveSites) {
      const found = liveSites.find((s) => String(s.id) === siteId)
      if (found) return mapDumpPoint(found).name
    }
    return siteById(siteId)?.name ?? siteId
  }

  const mySites = useMemo(
    () => {
      if (liveSites) return liveSites.map((d) => {
        const s = mapDumpPoint(d)
        return { id: s.id, name: s.name }
      })
      return dumpPoints.filter((s) => s.contractorId === session?.contractorId)
    },
    [session?.contractorId, liveSites],
  )

  const visits = useMemo(() => {
    const grouped = groupVisits(all)
    return grouped.filter((v) => {
      if (site !== 'all' && v.siteId !== site) return false
      const complete = !!(v.before && v.after)
      const flagged = v.before?.flagged || v.after?.flagged
      if (status === 'complete' && !complete) return false
      if (status === 'pending' && complete) return false
      if (status === 'flagged' && !flagged) return false
      const q = search.toLowerCase().trim()
      if (q && !siteNameOf(v.siteId).toLowerCase().includes(q)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, site, status, search, liveSites])

  const days = useMemo(() => {
    const map = new Map<string, Visit[]>()
    for (const v of visits) {
      const list = map.get(v.day) ?? []
      list.push(v)
      map.set(v.day, list)
    }
    return [...map.entries()]
  }, [visits])

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold text-ink">My submissions</h2>

      <div className="relative mt-3">
        <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sites…"
          className="pl-10"
          aria-label="Search submissions"
        />
      </div>

      <div className="mt-2 flex gap-2">
        <div className="min-w-0 flex-1 text-sm">
          <Select value={site} onValueChange={setSite}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sites</SelectItem>
              {mySites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm">
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="pending">After pending</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {liveLoading && !livePairs ? (
        <Card className="mt-3 text-center">
          <p className="text-lg text-ink">Loading submissions…</p>
          <p className="mt-1 text-sm text-ink-soft">Fetching your history from the server.</p>
        </Card>
      ) : liveError && !livePairs ? (
        <Card className="mt-3 text-center">
          <p className="text-lg text-ink">Could not load submissions</p>
          <p className="mt-1 text-sm text-ink-soft">{liveError}</p>
          <Button variant="secondary" onClick={() => void loadHistory()} className="mt-3">
            Retry
          </Button>
        </Card>
      ) : visits.length === 0 ? (
        <Card className="mt-3 text-center">
          <p className="text-lg text-ink">{all.length === 0 ? 'Nothing logged yet' : 'No visits match these filters'}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {all.length === 0 ? 'Check in at an assigned site to start.' : 'Try widening the filters.'}
          </p>
        </Card>
      ) : (
        <div className="mt-4 space-y-5">
          {days.map(([day, group]) => (
            <section key={day}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">{dayLabel(day)}</h3>
              <div className="mt-2 space-y-2">
                {group.map((v) => {
                  const complete = !!(v.before && v.after)
                  const flagged = v.before?.flagged || v.after?.flagged
                  return (
                    <Link
                      key={v.key}
                      to="/contractor/sites/$siteId"
                      params={{ siteId: v.siteId }}
                      className="flex items-center gap-3 rounded-2xl border border-hairline bg-paper p-3"
                    >
                      <span className="flex shrink-0 -space-x-3">
                        {v.before ? (
                          <img src={v.before.photo} alt="" className="h-14 w-14 rounded-xl border-2 border-paper object-cover" />
                        ) : null}
                        {v.after ? (
                          <img src={v.after.photo} alt="" className="h-14 w-14 rounded-xl border-2 border-paper object-cover" />
                        ) : (
                          <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-hairline bg-canvas text-[10px] font-semibold text-ink-soft">
                            After?
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{siteNameOf(v.siteId)}</span>
                        <span className="mt-0.5 block text-xs text-ink-soft">
                          {v.before ? new Date(v.before.atIso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                          {v.after ? ` → ${new Date(v.after.atIso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : ' · after pending'}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant={complete ? 'on-schedule' : 'overdue'}>{complete ? 'Done' : 'Pending'}</Badge>
                        {flagged ? <Badge variant="critical">Flagged</Badge> : null}
                      </span>
                      <ArrowRight size={16} className={cn('shrink-0 text-ink-soft')} />
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
