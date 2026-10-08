import { createFileRoute, Outlet, useMatch, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { BankIcon, CheckCircleIcon, DownloadIcon, PlusIcon } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshButton } from '@/components/refresh-button'
import { ListSkeleton, StatCardsSkeleton } from '@/components/skeletons'
import { downloadAuthedFile, payoutsApi, type PayoutStatementDto } from '@/lib/api'
import { qk, useAgencyWallet, useHeldQueue, useInvalidate, usePayoutsPage, useWalletTopups } from '@/lib/live-queries'
import { currentPeriod, formatNGN, formatPeriod, payoutStatusLabel, payoutStatusTone } from '@/lib/money'

export const Route = createFileRoute('/agency/payments')({
  component: AgencyPayments,
})

const STATUSES = ['all', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED'] as const

function SandboxNote() {
  return (
    <p className="mt-3 flex items-center gap-2 rounded-xl bg-cloud px-3 py-2 text-sm text-ink-soft">
      <BankIcon size={18} aria-hidden="true" />
      Test mode — Mundus works out the earned stipend and the agency releases it. No real money moves.
    </p>
  )
}

function AgencyPayments() {
  const navigate = useNavigate()
  const invalidate = useInvalidate()
  const [period, setPeriod] = useState(currentPeriod())
  const [status, setStatus] = useState<string>('all')
  const [busy, setBusy] = useState<'generate' | 'bulk' | 'export' | 'topup' | null>(null)
  const [topupAmount, setTopupAmount] = useState('')
  const [armedBulk, setArmedBulk] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const listQuery = usePayoutsPage(period || undefined, status === 'all' ? undefined : status)
  const heldQuery = useHeldQueue(period || undefined)
  const walletQuery = useAgencyWallet()
  const topupsQuery = useWalletTopups()
  const detailMatch = useMatch({ from: '/agency/payments/$payoutId', shouldThrow: false })
  if (detailMatch) return <Outlet />
  const summary = listQuery.data
  const rows = summary?.statements ?? []
  const wallet = walletQuery.data
  const walletShort = wallet !== undefined && (summary?.total_earned_amount ?? 0) > wallet.balance

  const refreshAll = () => {
    setError('')
    setNotice('')
    void Promise.all([listQuery.refetch(), heldQuery.refetch(), walletQuery.refetch(), topupsQuery.refetch()])
  }

  const topup = async () => {
    const amount = Number(topupAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter the top-up amount in naira.')
      return
    }
    setBusy('topup')
    setError('')
    setNotice('')
    try {
      const session = await payoutsApi.topup(amount, `${window.location.origin}/agency/payments`)
      window.open(session.checkout_url, '_blank', 'noopener')
      setTopupAmount('')
      setNotice(`Checkout opened for ${formatNGN(amount)} (ref ${session.reference}). Complete payment in the new tab — the balance updates after the provider confirms.`)
      void topupsQuery.refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the top-up checkout.')
    } finally {
      setBusy(null)
    }
  }

  const generate = async () => {
    setBusy('generate')
    setError('')
    setNotice('')
    try {
      const made = await payoutsApi.generate(period || undefined)
      await invalidate(qk.payouts(), qk.held())
      setNotice(made.length ? `Generated ${made.length} statement${made.length === 1 ? '' : 's'} for ${formatPeriod(period)}.` : `Statements for ${formatPeriod(period)} are already up to date.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate statements.')
    } finally {
      setBusy(null)
    }
  }

  const bulkApprove = async () => {
    if (!armedBulk) {
      setArmedBulk(true)
      return
    }
    setArmedBulk(false)
    setBusy('bulk')
    setError('')
    setNotice('')
    try {
      const pending = rows.filter((s) => s.status === 'PENDING_APPROVAL').map((s) => s.id)
      await payoutsApi.bulkApprove(period, pending.length ? pending : undefined)
      await invalidate(qk.payouts(), qk.held())
      setNotice('Bulk approval submitted. Transfers initiate per statement; webhooks settle the final status.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk approval failed.')
    } finally {
      setBusy(null)
    }
  }

  const exportCsv = async () => {
    setBusy('export')
    setError('')
    try {
      await downloadAuthedFile(`/agency/payouts/export?period=${encodeURIComponent(period)}`, `mundus_payouts_${period}.csv`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.')
    } finally {
      setBusy(null)
    }
  }

  const clearHeld = async (siteId: string, date: string) => {
    setError('')
    try {
      await payoutsApi.clearHeld(siteId, date)
      await invalidate(qk.payouts(), qk.held())
      setNotice('Held visit cleared — it now counts toward verified clearances.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear the held visit.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl text-ink">Payments</h2>
          <p className="mt-1 text-ink-soft">Monthly stipend earned through verified clearances. Money moves only after agency approval.</p>
        </div>
        <RefreshButton loading={listQuery.isFetching || heldQuery.isFetching} onRefresh={refreshAll} />
      </div>
      <SandboxNote />

      {wallet ? (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-soft">Platform balance · {wallet.currency}</p>
              <p className="mt-1 font-display text-2xl text-ink">{formatNGN(wallet.balance)}</p>
            </div>
            <div className="text-right text-xs text-ink-soft">
              <p>Top up below or by bank transfer to the provider.</p>
              {wallet.last_updated ? <p>Updated {new Date(wallet.last_updated).toLocaleString()}</p> : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="wallet-topup" className="mb-1 block text-sm font-semibold text-ink">Top-up amount (₦)</label>
              <Input id="wallet-topup" inputMode="decimal" value={topupAmount} onChange={(e) => { setTopupAmount(e.target.value); setError('') }} placeholder="100000" className="w-44" />
            </div>
            <Button variant="secondary" loading={busy === 'topup'} onClick={() => void topup()}>
              <PlusIcon size={18} /> Top up
            </Button>
          </div>
          {(topupsQuery.data ?? []).length > 0 ? (
            <ul className="mt-3 divide-y divide-hairline text-sm">
              {(topupsQuery.data ?? []).slice(0, 5).map((t) => (
                <li key={t.reference} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="font-mono text-xs text-ink-soft">{t.reference}</span>
                  <span className="font-semibold text-ink">{formatNGN(t.amount)}</span>
                  <Badge variant={t.status === 'paid' || t.status === 'success' ? 'on-schedule' : t.status === 'failed' ? 'critical' : 'neutral'}>{t.status}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          {walletShort ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#fdf3c4] px-3 py-2 text-sm text-[#7a5c00]">
              Balance is below this period's earned total — top up the platform before approving, or transfers will fail.
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card className="mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="pay-period" className="mb-1 block text-sm font-semibold text-ink">Period</label>
            <Input id="pay-period" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-44" />
          </div>
          <div>
            <span className="mb-1 block text-sm font-semibold text-ink">Status</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : payoutStatusLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" loading={busy === 'generate'} onClick={() => void generate()}>
              <PlusIcon size={18} /> Generate {formatPeriod(period)}
            </Button>
            <Button variant="secondary" loading={busy === 'bulk'} onClick={() => void bulkApprove()}>
              <CheckCircleIcon size={18} weight="fill" /> {armedBulk ? 'Confirm bulk approve' : 'Bulk approve'}
            </Button>
            <Button variant="secondary" loading={busy === 'export'} onClick={() => void exportCsv()}>
              <DownloadIcon size={18} /> Export CSV
            </Button>
          </div>
        </div>
        {error ? <p role="alert" className="mt-3 rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
        {notice ? <p className="mt-3 rounded-lg bg-[#e6f5ee] px-3 py-2 text-sm text-primary">{notice}</p> : null}
      </Card>

      {listQuery.isPending ? (
        <div className="mt-4 space-y-4"><StatCardsSkeleton /><ListSkeleton columns={['w-40', 'w-20', 'w-20', 'w-24']} rows={4} /></div>
      ) : listQuery.isError ? (
        <Card className="mt-4 text-center">
          <p className="font-semibold text-ink">Could not load payout statements.</p>
          <Button variant="secondary" className="mt-3" onClick={refreshAll}>Try again</Button>
        </Card>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Stipend pool', value: formatNGN(summary?.total_stipend_pool) },
              { label: 'Earned', value: formatNGN(summary?.total_earned_amount) },
              { label: 'Paid', value: formatNGN(summary?.total_paid_amount) },
              { label: 'Awaiting approval', value: String(summary?.pending_approval_count ?? 0) },
            ].map((s) => (
              <Card key={s.label}>
                <p className="text-xs uppercase tracking-wider text-ink-soft">{s.label}</p>
                <p className="mt-1 font-display text-2xl text-ink">{s.value}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-4 overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-3">Contractor</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3 text-right">Expected</th>
                  <th className="px-4 py-3 text-right">Verified</th>
                  <th className="px-4 py-3 text-right">Held</th>
                  <th className="px-4 py-3 text-right">Stipend</th>
                  <th className="px-4 py-3 text-right">Earned</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s: PayoutStatementDto) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate({ to: '/agency/payments/$payoutId', params: { payoutId: s.id } })}
                    className="cursor-pointer border-b border-hairline last:border-0 hover:bg-cloud/60"
                  >
                    <td className="px-4 py-3 font-semibold text-ink">{s.contractor_name ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatPeriod(s.period)}</td>
                    <td className="px-4 py-3 text-right">{s.expected_clearances}</td>
                    <td className="px-4 py-3 text-right">{s.verified_clearances}</td>
                    <td className="px-4 py-3 text-right">{s.held_clearances > 0 ? <span className="font-semibold text-[#c08014]">{s.held_clearances}</span> : 0}</td>
                    <td className="px-4 py-3 text-right">{formatNGN(s.monthly_stipend)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{formatNGN(s.calculated_payout_amount)}</td>
                    <td className="px-4 py-3"><Badge variant={payoutStatusTone(s.status)}>{payoutStatusLabel(s.status)}</Badge></td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-soft">No statements for this period yet. Generate {formatPeriod(period)} to begin.</td></tr>
                ) : null}
              </tbody>
            </table>
          </Card>

          <h3 className="mt-8 font-display text-2xl text-ink">Held for review</h3>
          <p className="mt-1 text-sm text-ink-soft">These visits failed geofence or duplicate checks and do not count until cleared.</p>
          {heldQuery.isPending ? (
            <div className="mt-4"><ListSkeleton columns={['w-40', 'w-24', 'w-24']} rows={3} /></div>
          ) : (heldQuery.data ?? []).length === 0 ? (
            <Card className="mt-4"><p className="text-sm text-ink-soft">Nothing on hold for {formatPeriod(period)}.</p></Card>
          ) : (
            <div className="mt-4 space-y-2">
              {(heldQuery.data ?? []).map((h) => (
                <Card key={`${h.site_id}-${h.date}`} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{h.site_name}</p>
                    <p className="text-sm text-ink-soft">{h.date} · {h.contractor_name ?? 'Unassigned'} · {h.reason}</p>
                    {h.flags.length ? <p className="mt-1 text-xs text-ink-soft">{h.flags.join(' · ')}</p> : null}
                  </div>
                  <Button variant="secondary" onClick={() => void clearHeld(h.site_id, h.date)}>
                    <CheckCircleIcon size={18} /> Clear visit
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
