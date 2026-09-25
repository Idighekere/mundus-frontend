import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/misc'
import { useContractorSession } from '@/lib/contractor-session'
import { siteById } from '@/mocks/data'
import { useSubmissions, type Submission } from '@/mocks/contractor-store'

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

function ContractorHistory() {
  const { session } = useContractorSession()
  const all = useSubmissions()
  const visits = useMemo(
    () => groupVisits(all.filter((s) => s.supervisor === session?.supervisor)),
    [all, session?.supervisor],
  )

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold text-ink">My submissions</h2>
      <p className="text-sm text-ink-soft">One card per site visit — before and after together.</p>
      {visits.length === 0 ? (
        <Card className="mt-3 text-center">
          <p className="text-lg text-ink">Nothing logged yet</p>
          <p className="mt-1 text-sm text-ink-soft">Check in at an assigned site to start.</p>
        </Card>
      ) : (
        <div className="mt-3 space-y-3">
          {visits.map((v) => {
            const complete = !!(v.before && v.after)
            const flagged = v.before?.flagged || v.after?.flagged
            return (
              <Link
                key={v.key}
                to="/contractor/sites/$siteId"
                params={{ siteId: v.siteId }}
                className="block rounded-2xl border border-hairline bg-paper p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{siteById(v.siteId)?.name ?? v.siteId}</p>
                    <p className="text-xs text-ink-soft">
                      {new Date(v.day).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="flex flex-wrap justify-end gap-1">
                    {complete ? <Badge variant="on-schedule">Complete</Badge> : <Badge variant="overdue">After pending</Badge>}
                    {flagged ? <Badge variant="critical">Flagged</Badge> : null}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {v.before ? (
                    <div>
                      <img src={v.before.photo} alt="Before" className="aspect-[4/3] w-full rounded-xl object-cover" />
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Before</p>
                    </div>
                  ) : null}
                  {v.after ? (
                    <div>
                      <img src={v.after.photo} alt="After" className="aspect-[4/3] w-full rounded-xl object-cover" />
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">After</p>
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-hairline p-2 text-center text-xs text-ink-soft">
                      After photo pending — tap to continue
                    </div>
                  )}
                </div>
                {!complete ? (
                  <span className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-primary">
                    Continue to after photo <ArrowRight size={16} />
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
