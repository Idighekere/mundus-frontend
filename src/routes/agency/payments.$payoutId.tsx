import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeftIcon, BankIcon, CheckCircleIcon, DownloadIcon } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { ListSkeleton } from '@/components/skeletons'
import { payoutsApi, type PayoutReceiptDto } from '@/lib/api'

import { qk, useInvalidate, usePayoutDetail } from '@/lib/live-queries'
import { formatNGN, formatNGNExact, formatPeriod, payoutStatusLabel, payoutStatusTone } from '@/lib/money'

export const Route = createFileRoute('/agency/payments/$payoutId')({
  component: PayoutDetailPage,
})

function PayoutDetailPage() {
  const { payoutId } = Route.useParams()
  const navigate = useNavigate()
  const invalidate = useInvalidate()
  const { data: s, isPending, isError, refetch } = usePayoutDetail(payoutId)
  const [notes, setNotes] = useState('')
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<PayoutReceiptDto | null>(null)

  const approve = async () => {
    if (!armed) {
      setArmed(true)
      return
    }
    setArmed(false)
    setBusy(true)
    setError('')
    try {
      // Server-side idempotent: retries and double-clicks return the same record.
      await payoutsApi.approve(payoutId, notes.trim() || undefined)
      await invalidate(qk.payouts(), qk.payoutDetail(payoutId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed. It is safe to retry — approved payouts never pay twice.')
    } finally {
      setBusy(false)
    }
  }

  const loadReceipt = async () => {
    setError('')
    try {
      setReceipt(await payoutsApi.receipt(payoutId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the receipt.')
    }
  }

  return (
    <div>
      <button onClick={() => navigate({ to: '/agency/payments' })} className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeftIcon size={16} /> Back to payments
      </button>

      {isPending ? (
        <div className="mt-4"><ListSkeleton columns={['w-48', 'w-20']} rows={5} /></div>
      ) : isError || !s ? (
        <Card className="mt-4 text-center">
          <p className="font-semibold text-ink">Could not load this statement.</p>
          <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>Try again</Button>
        </Card>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-4xl text-ink">{s.contractor_name ?? 'Contractor'}</h2>
              <p className="mt-1 text-ink-soft">{formatPeriod(s.period)} · Ref <span className="font-mono text-sm">{s.unique_payout_reference}</span></p>
            </div>
            <Badge variant={payoutStatusTone(s.status)}>{payoutStatusLabel(s.status)}</Badge>
          </div>
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-cloud px-3 py-2 text-sm text-ink-soft">
            <BankIcon size={18} aria-hidden="true" />
            Test mode — approval sends a sandbox transfer. No real money moves.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Monthly stipend', value: formatNGN(s.monthly_stipend) },
              { label: 'Earned', value: formatNGN(s.calculated_payout_amount) },
              { label: 'Verified / Expected', value: `${s.verified_clearances} / ${s.expected_clearances}` },
              { label: 'Held', value: String(s.held_clearances) },
            ].map((c) => (
              <Card key={c.label}>
                <p className="text-xs uppercase tracking-wider text-ink-soft">{c.label}</p>
                <p className="mt-1 font-display text-2xl text-ink">{c.value}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <h3 className="font-semibold text-ink">Calculation snapshot</h3>
            <p className="mt-1 text-sm text-ink-soft">Frozen at generation — later stipend or site changes cannot alter this statement.</p>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2"><dt className="text-ink-soft">Stipend</dt><dd className="font-semibold text-ink">{formatNGNExact(s.monthly_stipend)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-soft">Verified clearances</dt><dd className="font-semibold text-ink">{s.verified_clearances}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-soft">Expected clearances</dt><dd className="font-semibold text-ink">{s.expected_clearances}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-soft">Held clearances</dt><dd className="font-semibold text-ink">{s.held_clearances}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-soft">Transfer code</dt><dd className="font-mono text-ink">{s.transfer_code ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-soft">Provider</dt><dd className="text-ink">{s.payment_provider}{s.payment_provider_status ? ` · ${s.payment_provider_status}` : ''}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-soft">Approved by</dt><dd className="text-ink">{s.approved_by_name ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-ink-soft">Approved at</dt><dd className="text-ink">{s.approved_at ? new Date(s.approved_at).toLocaleString() : '—'}</dd></div>
            </dl>
            {s.failure_reason ? <p role="alert" className="mt-3 rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">Provider failure: {s.failure_reason}</p> : null}
          </Card>

          {s.status === 'PENDING_APPROVAL' || s.status === 'DRAFT' ? (
            <Card className="mt-4">
              <h3 className="font-semibold text-ink">Approve payout</h3>
              <p className="mt-1 text-sm text-ink-soft">Validates payment details, initiates the sandbox transfer, and waits for the provider webhook. Safe to retry — double approval never pays twice.</p>
              <label htmlFor="approve-notes" className="mb-1 mt-3 block text-sm font-semibold text-ink">Approval notes (optional)</label>
              <Input id="approve-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Month-end sign-off note" />
              {error ? <p role="alert" className="mt-3 rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
              <Button loading={busy} onClick={() => void approve()} className="mt-3 w-full">
                <CheckCircleIcon size={18} weight="fill" /> {armed ? 'Confirm approval' : 'Approve payout'}
              </Button>
            </Card>
          ) : null}

          <Card className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-ink">Receipt</h3>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => void loadReceipt()}>
                  <DownloadIcon size={18} /> View receipt
                </Button>
              </div>
            </div>
            {receipt ? (
              <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-2"><dt className="text-ink-soft">Receipt</dt><dd className="font-mono text-ink">{receipt.receipt_id}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-soft">Amount paid</dt><dd className="font-semibold text-ink">{formatNGNExact(receipt.amount_paid)} {receipt.currency}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-soft">Transfer code</dt><dd className="font-mono text-ink">{receipt.transfer_code ?? '—'}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-ink-soft">Environment</dt><dd className="text-ink">{receipt.environment}</dd></div>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Receipts are available once the payout exists. Sandbox receipts state no real money moved.</p>
            )}
          </Card>

          <p className="mt-4 text-center text-sm">
            <Link to="/agency/payments" className="font-semibold text-primary hover:underline">Back to all statements</Link>
          </p>
        </>
      )}
    </div>
  )
}
