/** NGN currency + payout-period helpers. */

const ngn = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

const ngnKobo = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatNGN(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '₦0'
  return ngn.format(n)
}

export function formatNGNExact(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '₦0.00'
  return ngnKobo.format(n)
}

/** Current month as 'YYYY-MM' (backend period format). */
export function currentPeriod(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${m}`
}

/** '2026-10' -> 'October 2026'. Falls back to the raw string. */
export function formatPeriod(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period.trim())
  if (!m) return period
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${names[Number(m[2]) - 1] ?? m[2]} ${m[1]}`
}

const STATUS_TONE: Record<string, 'on-schedule' | 'overdue' | 'critical' | 'neutral'> = {
  SUCCESS: 'on-schedule',
  APPROVED: 'on-schedule',
  PROCESSING: 'neutral',
  PENDING_APPROVAL: 'overdue',
  DRAFT: 'neutral',
  FAILED: 'critical',
  CANCELLED: 'critical',
}

export function payoutStatusTone(status: string): 'on-schedule' | 'overdue' | 'critical' | 'neutral' {
  return STATUS_TONE[status] ?? 'neutral'
}

export function payoutStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}
