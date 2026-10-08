import { useState } from 'react'
import { BankIcon, CaretDownIcon, CheckCircleIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { payoutsApi, type ContractorPayoutDetailsDto } from '@/lib/api'
import { NIGERIAN_BANKS, type NigerianBank } from '@/lib/nigerian-banks'
import { formatNGN } from '@/lib/money'
import { cn } from '@/lib/utils'

/** Bank dropdown with type-to-filter search (163 banks — a plain select
is unusable). Self-contained: no portal, closes on outside tap / Escape. */
function BankPicker({
  banks,
  value,
  onChange,
  inputId,
}: {
  banks: NigerianBank[]
  value: string
  onChange: (code: string) => void
  inputId: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = banks.find((b) => b.code === value)
  const q = query.trim().toLowerCase()
  const digits = q.replace(/\D/g, '')
  const filtered = q
    ? banks.filter((b) => b.name.toLowerCase().includes(q) || (digits !== '' && b.code.includes(digits)))
    : banks

  const pick = (code: string) => {
    onChange(code)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-primary"
      >
        <span className={selected ? '' : 'text-ink-soft/60'}>
          {selected ? `${selected.name} · ${selected.code}` : 'Choose a bank'}
        </span>
        <CaretDownIcon size={16} className="shrink-0 text-ink-soft" aria-hidden="true" />
      </button>
      {open ? (
        <>
          <button aria-label="Close bank list" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-hairline bg-paper shadow-xl">
            <div className="border-b border-hairline p-2">
              <Input
                id={inputId}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
                placeholder="Search banks…"
                aria-label="Search banks"
              />
            </div>
            <ul role="listbox" aria-label="Banks" className="max-h-60 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-3 text-sm text-ink-soft">No banks match “{query.trim()}”.</li>
              ) : (
                filtered.map((b) => (
                  <li key={b.code} role="option" aria-selected={b.code === value}>
                    <button
                      type="button"
                      onClick={() => pick(b.code)}
                      className={cn(
                        'flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-cloud',
                        b.code === value && 'font-semibold text-primary',
                      )}
                    >
                      <span>{b.name}</span>
                      <span className="font-mono text-xs text-ink-soft">{b.code}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <p className="border-t border-hairline px-3 py-1.5 text-xs text-ink-soft">
              {q ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}` : `${banks.length} banks`}
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}

export interface PayoutAccountBody {
  monthly_stipend?: number
  bank_account_number: string
  bank_code: string
  bank_name?: string
  bank_account_name?: string
}

/** Stipend + bank form shared by the agency setup dialog and the
contractor self-service card. Saving registers (or reuses) the provider
recipient; `save` decides which endpoint is called. */
export function PayoutAccountForm({
  idPrefix,
  allowStipend,
  fixedStipend,
  initialStipend,
  save,
  onSaved,
}: {
  idPrefix: string
  allowStipend: boolean
  /** Sent through untouched when the caller may not set it (contractor self-service preserves current pay). */
  fixedStipend?: number
  initialStipend?: string
  save: (body: PayoutAccountBody & { monthly_stipend: number }) => Promise<ContractorPayoutDetailsDto>
  onSaved: (details: ContractorPayoutDetailsDto) => void
}) {
  const [banks] = useState(NIGERIAN_BANKS)
  const [stipend, setStipend] = useState(initialStipend ?? '')
  const [bankCode, setBankCode] = useState('')
  const [account, setAccount] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [saved, setSaved] = useState<ContractorPayoutDetailsDto | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'resolve' | 'save' | null>(null)

  const bankName = banks.find((b) => b.code === bankCode)?.name ?? ''

  const resolve = async () => {
    const digits = account.replace(/\D/g, '')
    if (!bankCode) {
      setError('Choose the bank first.')
      return
    }
    if (digits.length !== 10) {
      setError('Account number must be exactly 10 digits.')
      return
    }
    setError('')
    setBusy('resolve')
    try {
      const res = await payoutsApi.resolveAccount(digits, bankCode)
      setResolvedName(res.account_name)
    } catch (err) {
      setResolvedName('')
      setError(err instanceof Error ? err.message : 'Could not verify this account.')
    } finally {
      setBusy(null)
    }
  }

  const submit = async () => {
    const digits = account.replace(/\D/g, '')
    if (!bankCode || digits.length !== 10) {
      setError('Choose the bank and enter the 10-digit account number.')
      return
    }
    let amount = fixedStipend ?? 0
    if (allowStipend) {
      amount = Number(stipend)
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Enter the monthly stipend in naira.')
        return
      }
    }
    setError('')
    setBusy('save')
    try {
      const res = await save({
        monthly_stipend: amount,
        bank_account_number: digits,
        bank_code: bankCode,
        bank_name: bankName || undefined,
        bank_account_name: resolvedName || undefined,
      })
      setSaved(res)
      onSaved(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save payout details.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      {saved ? (
        <div className="rounded-xl bg-[#e6f5ee] p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-primary">
            <CheckCircleIcon size={18} weight="fill" /> Payout-ready
          </p>
          <p className="mt-2 text-ink">
            {saved.monthly_stipend > 0 ? `Stipend ${formatNGN(saved.monthly_stipend)} · ` : ''}{saved.bank_name} · {saved.bank_account_number}
            {saved.bank_account_name ? ` · ${saved.bank_account_name}` : ''}
          </p>
          {saved.payment_provider_recipient_id ? (
            <p className="mt-1 font-mono text-xs text-ink-soft">Recipient {saved.payment_provider_recipient_id}</p>
          ) : null}
        </div>
      ) : null}

      {allowStipend ? (
        <div>
          <label htmlFor={`${idPrefix}-stipend`} className="mb-1 block text-sm font-semibold text-ink">Monthly stipend (₦)</label>
          <Input id={`${idPrefix}-stipend`} inputMode="decimal" value={stipend} onChange={(e) => { setStipend(e.target.value); setError('') }} placeholder="50000" />
        </div>
      ) : null}
      <div>
        <span id={`${idPrefix}-bank-label`} className="mb-1 block text-sm font-semibold text-ink">Bank</span>
        <BankPicker
          banks={banks}
          value={bankCode}
          inputId={`${idPrefix}-bank-search`}
          onChange={(code) => { setBankCode(code); setResolvedName(''); setError('') }}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-account`} className="mb-1 block text-sm font-semibold text-ink">Account number</label>
        <div className="flex gap-2">
          <Input id={`${idPrefix}-account`} inputMode="numeric" value={account} onChange={(e) => { setAccount(e.target.value.replace(/\D/g, '').slice(0, 10)); setResolvedName(''); setError('') }} placeholder="10-digit NUBAN" className="flex-1" />
          <Button variant="secondary" loading={busy === 'resolve'} onClick={() => void resolve()}>Verify</Button>
        </div>
        {resolvedName ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
            <BankIcon size={16} aria-hidden="true" /> {resolvedName}
          </p>
        ) : null}
      </div>
      {error ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
      <Button loading={busy === 'save'} onClick={() => void submit()} className="w-full">Save payout details</Button>
    </div>
  )
}
