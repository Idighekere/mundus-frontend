import { createFileRoute, Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/misc'
import { useContractorSession } from '@/lib/contractor-session'
import { siteById } from '@/mocks/data'
import { useSubmissions } from '@/mocks/contractor-store'

export const Route = createFileRoute('/contractor/history')({
  component: ContractorHistory,
})

function ContractorHistory() {
  const { session } = useContractorSession()
  const all = useSubmissions()
  const mine = all.filter((s) => s.supervisor === session?.supervisor)

  return (
    <div className="mt-4">
      <h2 className="mt-4 text-xl font-bold text-ink">My submissions</h2>
      <p className="text-sm text-ink-soft">Every photo you have logged from this device.</p>
      {mine.length === 0 ? (
        <Card className="mt-3 text-center">
          <p className="font-display text-[28px] text-ink">Nothing logged yet</p>
          <p className="mt-1">Check in at an assigned site to start.</p>
        </Card>
      ) : (
        <div className="mt-3 space-y-3">
          {mine.map((s) => (
            <Link
              key={s.id}
              to="/contractor/sites/$siteId"
              params={{ siteId: s.siteId }}
              className="flex gap-3 rounded-2xl border border-hairline bg-paper p-3"
            >
              <img src={s.photo} alt={`${s.type} at ${siteById(s.siteId)?.name ?? s.siteId}`} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{siteById(s.siteId)?.name ?? s.siteId}</p>
                <p className="text-xs text-ink-soft">
                  {s.type === 'before' ? 'Before' : 'After'} · {new Date(s.atIso).toLocaleString()}
                </p>
                <p className="mt-1 flex flex-wrap gap-1">
                  {s.flagged ? <Badge variant="critical">Location flagged</Badge> : <Badge variant="on-schedule">Verified</Badge>}
                  {s.simulated ? <Badge variant="neutral">Demo GPS</Badge> : null}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
