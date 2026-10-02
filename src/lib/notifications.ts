import { useEffect, useState } from 'react'
import { dumpPoints, siteById } from '@/mocks/data'
import { allReports } from '@/mocks/reporter-store'
import { useSubmissions, useContractorDirectory } from '@/mocks/contractor-store'
import { useReporters, useReports } from '@/mocks/reporter-store'
import { contractorsApi, dashboardApi, hasLiveSession, reportersApi, type DumpPointDto, type ReporterDto } from '@/lib/api'
import { mapDumpPoint } from '@/lib/backend-map'
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
  contractor: string
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
// Pass `sites` in live mode so names and red-flags resolve against the
// backend registry instead of the mock seed data.
export function buildNotices(
  input: {
    reports: { id: string; siteId: string; reporterId: string; reporterName?: string; photo?: string; atIso: string }[]
    flagged: FlaggedSubmission[]
    nominations: PendingNomination[]
  },
  opts?: { sites?: { id: string; name: string; lastClearanceIso: string }[] },
) {
  const notices: Notice[] = []
  const sites = opts?.sites
  const siteName = (id: string) =>
    sites?.find((s) => s.id === id)?.name ?? siteById(id)?.name ?? 'A site'

  for (const r of input.reports.slice(0, 20)) {
    notices.push({
      id: `report-${r.id}`,
      kind: 'report',
      title: `${siteName(r.siteId)} reported full`,
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
      body: `${siteName(s.siteId)} · ${s.type} by ${s.contractor}${s.flagReason === 'location' ? ` · ${s.distanceM} m off-target` : ''}`,
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
      body: `${siteName(n.siteId) === 'A site' ? 'Unknown site' : siteName(n.siteId)} · ${n.contractorName} · ${n.phone}`,
      atIso: n.updatedAt,
      to: '/agency/reporters',
    })
  }

  for (const s of sites ?? dumpPoints) {
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

export interface NoticesInput {
  reports: { id: string; siteId: string; reporterId: string; reporterName?: string; photo?: string; atIso: string }[]
  flagged: FlaggedSubmission[]
  nominations: PendingNomination[]
  sites?: { id: string; name: string; lastClearanceIso: string }[]
}

/**
 * Single source for agency notices. Mock stores in demo mode; backend
 * registry + reporter roster when signed in live. Both consumers (shell
 * badge, notifications page) share this so they can never disagree.
 */
export function useNoticesInput(): NoticesInput {
  const live = hasLiveSession()
  const mockReports = useReports()
  const mockSubmissions = useSubmissions()
  const mockReporters = useReporters()
  const mockDirectory = useContractorDirectory()
  const [liveReporters, setLiveReporters] = useState<ReporterDto[] | null>(null)
  const [liveSites, setLiveSites] = useState<DumpPointDto[] | null>(null)
  const [liveContractors, setLiveContractors] = useState<{ id: string; name: string }[] | null>(null)

  useEffect(() => {
    if (!live) return
    let cancelled = false
    void (async () => {
      try {
        const [reporters, sites, contractors] = await Promise.all([
          reportersApi.list(),
          dashboardApi.sites(),
          contractorsApi.list(),
        ])
        if (cancelled) return
        setLiveReporters(reporters)
        setLiveSites(sites.sites)
        setLiveContractors(contractors.map((c) => ({ id: String(c.id), name: c.name })))
      } catch {
        // Notices stay empty rather than loud — pages show their own errors.
      }
    })()
    return () => { cancelled = true }
  }, [live])

  if (!live) {
    return {
      reports: mockReports.map((r) => ({
        ...r,
        reporterName: mockReporters.find((x) => x.id === r.reporterId)?.name,
      })),
      flagged: mockSubmissions
        .filter((s) => s.flagged)
        .map((s) => ({
          id: s.id, siteId: s.siteId, contractor: s.contractor,
          type: s.type, flagReason: s.flagReason, distanceM: s.distanceM, atIso: s.atIso,
        })),
      nominations: mockReporters
        .filter((r) => r.status === 'pending')
        .map((r) => ({
          id: r.id, name: r.name, phone: r.phone, siteId: r.siteId,
          contractorName: mockDirectory.find((c) => c.id === r.contractorId)?.name ?? 'Unknown',
          updatedAt: r.updatedAt,
        })),
    }
  }

  const sites = (liveSites ?? []).map((d) => {
    const s = mapDumpPoint(d)
    return { id: s.id, name: s.name, lastClearanceIso: s.lastClearanceIso }
  })
  return {
    reports: [],
    flagged: (liveSites ?? [])
      .filter((d) => d.status === 'flagged')
      .map((d) => {
        const s = mapDumpPoint(d)
        return {
          id: `flag-${d.id}`, siteId: s.id, contractor: d.assigned_contractor_name ?? '',
          type: 'before' as const, flagReason: undefined, distanceM: 0, atIso: d.created_at,
        }
      }),
    nominations: (liveReporters ?? [])
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        id: String(r.id), name: r.name, phone: r.phone, siteId: String(r.site_id),
        contractorName: liveContractors?.find((c) => c.id === String(r.contractor_id))?.name ?? 'Unknown',
        updatedAt: r.updated_at,
      })),
    sites,
  }
}
