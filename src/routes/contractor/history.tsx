import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { HistorySkeleton } from '@/components/skeletons'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHistory } from '@/lib/live-queries'
import { mapDumpPoint } from '@/lib/backend-map'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/contractor/history')({
  component: ContractorHistory,
})

interface Shot {
  photo: string
  atIso: string
  flagged: boolean
}

interface Visit {
  key: string
  siteId: string
  day: string
  before?: Shot
  after?: Shot
}

function toShot(c: { photo_url: string; server_timestamp: string; status: string } | null | undefined): Shot | undefined {
  if (!c) return undefined
  return { photo: c.photo_url, atIso: c.server_timestamp, flagged: c.status !== 'valid' }
}

function dayLabel(day: string): string {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86_400_000).toDateString()
  if (day === today) return 'Today'
  if (day === yesterday) return 'Yesterday'
  return new Date(day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

type StatusFilter = 'all' | 'complete' | 'pending' | 'flagged'

function ContractorHistory() {
  const [search, setSearch] = useState('')
  const [site, setSite] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const { data, isPending, isError, error, refetch } = useHistory()
  const livePairs = data?.pairs
  const liveSites = data?.sites
  const liveLoading = isPending
  const liveError = isError ? (error instanceof Error ? error.message : 'Could not load submissions.') : ''

  const all = useMemo<Visit[]>(() => {
    return (livePairs ?? []).map((p) => {
      const day = new Date(p.date).toDateString()
      return {
        key: `${p.site_id}|${p.date}`,
        siteId: String(p.site_id),
        day,
        before: toShot(p.before),
        after: toShot(p.after),
      }
    })
  }, [livePairs])

  const siteNameOf = (siteId: string): string => {
    const found = liveSites?.find((s) => String(s.id) === siteId)
    return found ? mapDumpPoint(found).name : siteId
  }

  const mySites = useMemo(
    () =>
      (liveSites ?? []).map((d) => {
        const s = mapDumpPoint(d)
        return { id: s.id, name: s.name }
      }),
    [liveSites],
  )

  const visits = useMemo(() => {
    return all.filter((v) => {
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
        <HistorySkeleton />
      ) : liveError && !livePairs ? (
        <Card className="mt-3 text-center">
          <p className="text-lg text-ink">Could not load submissions</p>
          <p className="mt-1 text-sm text-ink-soft">{liveError}</p>
          <Button variant="secondary" onClick={() => void refetch()} className="mt-3">
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
