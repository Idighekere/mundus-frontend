export type SiteStatus = 'on-schedule' | 'overdue' | 'critical'

export const OVERDUE_AFTER_DAYS = 7
export const CRITICAL_AFTER_DAYS = 10

export function daysSince(dateIso: string, now = new Date()): number {
  const then = new Date(dateIso).getTime()
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000))
}

export function statusFor(days: number): SiteStatus {
  if (days > CRITICAL_AFTER_DAYS) return 'critical'
  if (days > OVERDUE_AFTER_DAYS) return 'overdue'
  return 'on-schedule'
}
