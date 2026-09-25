import { useSyncExternalStore } from 'react'

export type ReporterStatus = 'pending' | 'approved' | 'rejected' | 'revoked'

export interface Reporter {
  id: string
  name: string
  phone: string
  siteId: string
  contractorId: string
  status: ReporterStatus
  token: string | null
  reason?: string
  updatedAt: string
}

export interface SiteReport {
  id: string
  siteId: string
  reporterId: string
  atIso: string
}

// One report per site per window (doc §4.2 rate limiting).
export const REPORT_WINDOW_HOURS = 12

const REPORTERS_KEY = 'mundus-reporters'
const REPORTS_KEY = 'mundus-reports'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

let reporters: Reporter[] = typeof localStorage === 'undefined' ? [] : read<Reporter[]>(REPORTERS_KEY, [])
let reports: SiteReport[] = typeof localStorage === 'undefined' ? [] : read<SiteReport[]>(REPORTS_KEY, [])

const demoReporters: Reporter[] = [
  {
    id: 'rep-seed-approved',
    name: 'Adaeze Okoro',
    phone: '08031234567',
    siteId: 'nwaniba-road',
    contractorId: 'cleancity',
    status: 'approved',
    token: 'demo-nwaniba-reporter-link',
    updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: 'rep-seed-pending',
    name: 'Emeka Bassey',
    phone: '08039876543',
    siteId: 'itam-junction',
    contractorId: 'greenpath',
    status: 'pending',
    token: null,
    updatedAt: new Date(Date.now() - 5 * 3_600_000).toISOString(),
  },
]

// Seed two example nominations so the queue, contractor card, and reporter
// link are all demonstrable on first run. Cleared once the agency acts.
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(REPORTERS_KEY, JSON.stringify(reporters))
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
  } catch {
    // private mode — in-memory only
  }
  listeners.forEach((fn) => fn())
}

if (typeof localStorage !== 'undefined' && reporters.length === 0 && !localStorage.getItem('mundus-reporters-seeded')) {
  reporters = [...demoReporters]
  localStorage.setItem('mundus-reporters-seeded', '1')
  persist()
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function nominateReporter(input: {
  name: string
  phone: string
  siteId: string
  contractorId: string
}): { ok: true; reporter: Reporter } | { ok: false; error: string } {
  const name = input.name.trim()
  const phone = digitsOnly(input.phone)
  if (name.length < 2) return { ok: false, error: 'Reporter name needs at least 2 characters.' }
  if (phone.length < 7 || phone.length > 15) return { ok: false, error: 'Enter a valid phone number.' }
  const activeForSite = reporters.find(
    (r) => r.siteId === input.siteId && (r.status === 'pending' || r.status === 'approved'),
  )
  if (activeForSite) return { ok: false, error: 'This site already has an active reporter.' }
  const activeForPhone = reporters.find(
    (r) => digitsOnly(r.phone) === phone && (r.status === 'pending' || r.status === 'approved'),
  )
  if (activeForPhone) return { ok: false, error: 'This number already reports for another site.' }
  const reporter: Reporter = {
    id: `rep-${Date.now().toString(36)}`,
    name,
    phone,
    siteId: input.siteId,
    contractorId: input.contractorId,
    status: 'pending',
    token: null,
    updatedAt: new Date().toISOString(),
  }
  reporters = [reporter, ...reporters]
  persist()
  return { ok: true, reporter }
}

export function approveReporter(id: string): Reporter | undefined {
  const reporter = reporters.find((r) => r.id === id)
  if (!reporter || (reporter.status !== 'pending' && reporter.status !== 'rejected')) return undefined
  const next: Reporter = {
    ...reporter,
    status: 'approved',
    reason: undefined,
    token: reporter.token ?? crypto.randomUUID().replace(/-/g, ''),
    updatedAt: new Date().toISOString(),
  }
  reporters = reporters.map((r) => (r.id === id ? next : r))
  persist()
  return next
}

export function rejectReporter(id: string, reason?: string): void {
  reporters = reporters.map((r) =>
    r.id === id
      ? { ...r, status: 'rejected' as const, reason: reason?.trim() || undefined, updatedAt: new Date().toISOString() }
      : r,
  )
  persist()
}

export function revokeReporter(id: string): void {
  reporters = reporters.map((r) =>
    r.id === id ? { ...r, status: 'revoked' as const, token: null, updatedAt: new Date().toISOString() } : r,
  )
  persist()
}

// On-demand examples for the empty queue (works even if auto-seed was missed).
// Also repairs the approved demo link if it was revoked or rejected.
export function seedDemoReporters(): void {
  let changed = false
  const next = [...reporters]
  for (const demo of demoReporters) {
    const i = next.findIndex((r) => r.id === demo.id)
    if (i === -1) {
      next.unshift({ ...demo })
      changed = true
    } else if (demo.id === 'rep-seed-approved' && (next[i].status !== 'approved' || !next[i].token)) {
      next[i] = { ...demo }
      changed = true
    }
  }
  if (!changed) return
  reporters = next
  persist()
}

export function reporterForSite(siteId: string): Reporter | undefined {
  return reporters.find((r) => r.siteId === siteId && r.status !== 'revoked')
}

export function resolveToken(token: string): Reporter | undefined {
  return reporters.find((r) => r.token === token && r.status === 'approved')
}

export function reporterLink(token: string): string {
  return `${window.location.origin}/r/${token}`
}

export function reporterMessage(siteName: string, token: string): string {
  return `Mundus: you've been approved as reporter for ${siteName}. Report a full site here: ${reporterLink(token)}`
}

// Normalize an NG phone number for wa.me (0803… → 234803…).
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return `234${digits.slice(1)}`
  return digits
}

export function reporterWhatsappUrl(phone: string, siteName: string, token: string): string {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(reporterMessage(siteName, token))}`
}

export function submitSiteReport(siteId: string, reporterId: string): { ok: true } | { ok: false; retryIn: string } {
  const gate = reportGate(siteId)
  if (!gate.open) return { ok: false, retryIn: gate.retryIn }
  reports = [{ id: `sr-${Date.now().toString(36)}`, siteId, reporterId, atIso: new Date().toISOString() }, ...reports]
  persist()
  return { ok: true }
}

export function reportGate(siteId: string): { open: true } | { open: false; retryIn: string } {
  const last = reports.filter((r) => r.siteId === siteId).sort((a, b) => +new Date(b.atIso) - +new Date(a.atIso))[0]
  if (!last) return { open: true }
  const elapsedH = (Date.now() - new Date(last.atIso).getTime()) / 3_600_000
  if (elapsedH >= REPORT_WINDOW_HOURS) return { open: true }
  const remainingH = Math.ceil(REPORT_WINDOW_HOURS - elapsedH)
  return { open: false, retryIn: remainingH <= 1 ? 'under an hour' : `${remainingH} hours` }
}

export function latestReportForSite(siteId: string): SiteReport | undefined {
  return reports.filter((r) => r.siteId === siteId).sort((a, b) => +new Date(b.atIso) - +new Date(a.atIso))[0]
}

export function reportsForReporter(reporterId: string): SiteReport[] {
  return reports.filter((r) => r.reporterId === reporterId).sort((a, b) => +new Date(b.atIso) - +new Date(a.atIso))
}

export function allReports(): SiteReport[] {
  return reports
}

function getReporters(): Reporter[] {
  return reporters
}

export function useReporters(): Reporter[] {
  return useSyncExternalStore(subscribe, getReporters)
}

function getReports(): SiteReport[] {
  return reports
}

export function useReports(): SiteReport[] {
  return useSyncExternalStore(subscribe, getReports)
}
