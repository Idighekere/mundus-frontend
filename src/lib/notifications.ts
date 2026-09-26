import { dumpPoints, siteById } from '@/mocks/data'
import { allReports } from '@/mocks/reporter-store'
import { daysSince } from '@/lib/overdue'

export interface Notice {
  id: string
  kind: 'report' | 'flag' | 'nomination' | 'overdue'
  title: string
  body: string
  atIso: string
  to: string
  params?: Record<string, string>
  photo?: string
}

export interface FlaggedSubmission {
  id: string
  siteId: string
  supervisor: string
  type: 'before' | 'after'
  flagReason?: 'location' | 'duplicate'
  distanceM: number
  atIso: string
}

export interface PendingNomination {
  id: string
  name: string
  phone: string
  siteId: string
  contractorName: string
  updatedAt: string
}

// Assembled by the page/shell from live stores (passed in to stay reactive).
export function buildNotices(input: {
  reports: { id: string; siteId: string; reporterId: string; reporterName?: string; photo?: string; atIso: string }[]
  flagged: FlaggedSubmission[]
  nominations: PendingNomination[]
}): Notice[] {
  const notices: Notice[] = []

  for (const r of input.reports.slice(0, 20)) {
    notices.push({
      id: `report-${r.id}`,
      kind: 'report',
      title: `${siteById(r.siteId)?.name ?? 'A site'} reported full`,
      body: r.reporterName ? `Reported by ${r.reporterName}` : 'Reporter flag received',
      atIso: r.atIso,
      to: '/agency/sites/$siteId',
      params: { siteId: r.siteId },
      photo: r.photo,
    })
  }

  for (const s of input.flagged.slice(0, 20)) {
    notices.push({
      id: `flag-${s.id}`,
      kind: 'flag',
      title: s.flagReason === 'duplicate' ? 'Duplicate photo flagged' : 'Location mismatch flagged',
      body: `${siteById(s.siteId)?.name ?? 'A site'} · ${s.type} by ${s.supervisor}${s.flagReason === 'location' ? ` · ${s.distanceM} m off-target` : ''}`,
      atIso: s.atIso,
      to: '/agency/sites/$siteId',
      params: { siteId: s.siteId },
    })
  }

  for (const n of input.nominations) {
    notices.push({
      id: `nom-${n.id}`,
      kind: 'nomination',
      title: `Reporter nomination: ${n.name}`,
      body: `${siteById(n.siteId)?.name ?? 'Unknown site'} · ${n.contractorName} · ${n.phone}`,
      atIso: n.updatedAt,
      to: '/agency/reporters',
    })
  }

  for (const s of dumpPoints) {
    const days = daysSince(s.lastClearanceIso)
    if (days > 10) {
      notices.push({
        id: `overdue-${s.id}`,
        kind: 'overdue',
        title: `${s.name} is critical`,
        body: `${days} days since last clearance — past the 10-day red flag`,
        atIso: s.lastClearanceIso,
        to: '/agency/sites/$siteId',
        params: { siteId: s.id },
      })
    }
  }

  return notices.sort((a, b) => +new Date(b.atIso) - +new Date(a.atIso))
}

const READ_KEY = 'mundus-notifs-read'

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function unreadIds(notices: Notice[]): string[] {
  const read = new Set(readIds())
  return notices.filter((n) => !read.has(n.id)).map((n) => n.id)
}

export function markNoticeRead(id: string): void {
  const read = new Set(readIds())
  read.add(id)
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...read]))
  } catch {
    // ignore
  }
}

export function markAllNoticesRead(ids: string[]): void {
  const read = new Set([...readIds(), ...ids])
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...read]))
  } catch {
    // ignore
  }
}

// Re-export a reactive trigger: pages subscribe to the underlying stores.
export { allReports }
