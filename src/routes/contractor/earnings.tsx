import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { BankIcon, CheckCircleIcon } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { RefreshButton } from '@/components/refresh-button'
import { ListSkeleton } from '@/components/skeletons'
import { useContractorSession } from '@/lib/contractor-session'
import { qk, useInvalidate, useMyEarnings, useMyPayouts } from '@/lib/live-queries'
import { currentPeriod, formatNGN, formatPeriod, payoutStatusLabel, payoutStatusTone } from '@/lib/money'
import { PayoutAccountForm } from '@/components/payout-account-form'
import { payoutsApi } from '@/lib/api'

export const Route = createFileRoute('/contractor/earnings')({
  component: ContractorEarnings,
})

function ContractorEarnings() {
  const { session } = useContractorSession()
  const invalidate = useInvalidate()
  const [period, setPeriod] = useState(currentPeriod())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const earningsQuery = useMyEarnings(period || undefined)
  const payoutsQuery = useMyPayouts()
  const e = earningsQuery.data
  const loading = earningsQuery.isPending || payoutsQuery.isPending
  const loadError = earningsQuery.isError || payoutsQuery.isError

  if (!session) return null

  const refreshAll = () => {
    void Promise.all([earningsQuery.refetch(), payoutsQuery.refetch(), invalidate(qk.earnings(), qk.myPayouts)])
  }

  const progress = Math.max(0, Math.min(100, e?.progress_percent ?? 0))

  return (
    <div className="mt-4 space-y-3 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Earnings</h1>
          <p className="mt-1 text-sm text-ink-soft">Your stipend earned through verified clearances. Paid monthly after agency approval.</p>
        </div>
        <RefreshButton loading={earningsQuery.isFetching || payoutsQuery.isFetching} onRefresh={refreshAll} />
      </div>
      <p className="flex items-center gap-2 rounded-xl bg-cloud px-3 py-2 text-sm text-ink-soft">
        <BankIcon size={18} aria-hidden="true" />
        Test mode — figures are calculated live, no real money moves.
      </p>

      <div className="flex items-end gap-3">
        <div>
          <label htmlFor="earn-period" className="mb-1 block text-sm font-semibold text-ink">Period</label>
          <Input id="earn-period" type="month" value={period} onChange={(ev) => setPeriod(ev.target.value)} className="w-44" />
        </div>
      </div>

      {loading ? (
        <ListSkeleton columns={['w-40', 'w-20']} rows={4} />
      ) : loadError || !e ? (
        <Card className="text-center">
          <p className="font-semibold text-ink">Could not load earnings.</p>
          <Button variant="secondary" className="mt-3" onClick={refreshAll}>Try again</Button>
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-soft">Earned so far · {formatPeriod(e.period)}</p>
                <p className="mt-1 font-display text-4xl text-ink">{formatNGN(e.earned_so_far)}</p>
                <p className="mt-1 text-sm text-ink-soft">of {formatNGN(e.monthly_stipend)} monthly stipend</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-ink">{e.verified_clearances} of {e.expected_clearances} verified</p>
                {e.held_clearances > 0 ? <p className="font-semibold text-[#c08014]">{e.held_clearances} held for review</p> : null}
              </div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cloud" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Stipend earned">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-soft">Held visits do not count until the agency clears them. Earnings never trigger a payment by themselves.</p>
          </Card>

          {e.sites_breakdown.length ? (
            <Card>
              <h2 className="text-base font-semibold text-ink">Per-site progress</h2>
              <ul className="mt-2 divide-y divide-hairline">
                {e.sites_breakdown.map((s) => (
                  <li key={s.site_id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      <span className="block font-semibold text-ink">{s.site_name}</span>
                      <span className="block text-xs text-ink-soft">Every {s.interval_days} day{s.interval_days === 1 ? '' : 's'} · expected {s.expected_clearances}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold text-ink">{s.verified_clearances} verified</span>
                      {s.held_clearances > 0 ? <span className="block text-xs font-semibold text-[#c08014]">{s.held_clearances} held</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-base font-semibold text-ink">Payout account</h2>
            <p className="mt-1 text-sm text-ink-soft">The bank account your stipend is paid to. Verified instantly, saved once.</p>
            <div className="mt-3">
              <PayoutAccountForm
                idPrefix="ce"
                allowStipend={false}
                fixedStipend={e.monthly_stipend}
                save={(body) => payoutsApi.saveMyPayoutDetails({
                  monthly_stipend: body.monthly_stipend,
                  bank_account_number: body.bank_account_number,
                  bank_code: body.bank_code,
                  bank_name: body.bank_name,
                  bank_account_name: body.bank_account_name,
                })}
                onSaved={() => undefined}
              />
            </div>
          </Card>

          <h2 className="pt-2 font-display text-2xl text-ink">Payout history</h2>          {(payoutsQuery.data ?? []).length === 0 ? (
            <Card><p className="text-sm text-ink-soft">No payouts yet. Statements appear here after the agency generates the month.</p></Card>
          ) : (
            <div className="space-y-2">
              {(payoutsQuery.data ?? []).map((p) => {
                const open = expandedId === p.id
                return (
                  <Card key={p.id}>
                    <button onClick={() => setExpandedId(open ? null : p.id)} aria-expanded={open} className="flex w-full cursor-pointer items-center justify-between gap-2 text-left">
                      <span>
                        <span className="block font-semibold text-ink">{formatPeriod(p.period)} · {formatNGN(p.calculated_payout_amount)}</span>
                        <span className="block font-mono text-xs text-ink-soft">{p.unique_payout_reference}</span>
                      </span>
                      <Badge variant={payoutStatusTone(p.status)}>{payoutStatusLabel(p.status)}</Badge>
                    </button>
                    {open ? (
                      <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-hairline pt-3 text-sm">
                        <div className="flex justify-between gap-2"><dt className="text-ink-soft">Verified</dt><dd className="font-semibold text-ink">{p.verified_clearances} of {p.expected_clearances}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-ink-soft">Held</dt><dd className="font-semibold text-ink">{p.held_clearances}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-ink-soft">Transfer code</dt><dd className="font-mono text-ink">{p.transfer_code ?? '—'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-ink-soft">Approved</dt><dd className="text-ink">{p.approved_by_name ?? '—'}{p.approved_at ? ` · ${new Date(p.approved_at).toLocaleDateString()}` : ''}</dd></div>
                        {p.failure_reason ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{p.failure_reason}</p> : null}
                        {p.status === 'SUCCESS' ? (
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary"><CheckCircleIcon size={16} weight="fill" /> Paid to your registered bank account (sandbox).</p>
                        ) : null}
                      </dl>
                    ) : null}
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
