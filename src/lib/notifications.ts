import { useEffect, useState } from 'react'
import { contractorsApi, dashboardApi, reportersApi, type DumpPointDto, type ReporterDto } from '@/lib/api'
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
  opts: { sites: { id: string; name: string; lastClearanceIso: string }[] },
) {
  const notices: Notice[] = []
  const sites = opts.sites
  const siteName = (id: string) =>
    sites.find((s) => s.id === id)?.name ?? 'A site'

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

  for (const s of sites) {
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

export interface NoticesInput {
  reports: { id: string; siteId: string; reporterId: string; reporterName?: string; photo?: string; atIso: string }[]
  flagged: FlaggedSubmission[]
  nominations: PendingNomination[]
  sites?: { id: string; name: string; lastClearanceIso: string }[]
}


export interface NoticesInput {
  reports: { id: string; siteId: string; reporterId: string; reporterName?: string; photo?: string; atIso: string }[]
  flagged: FlaggedSubmission[]
  nominations: PendingNomination[]
  sites?: { id: string; name: string; lastClearanceIso: string }[]
  liveError?: string
  loading: boolean
  reload: () => void
}

/**
 * Single source for agency notices, loaded from the backend registry and
 * reporter roster. Failures surface as liveError — never mock data.
 */
export function useNoticesInput(): NoticesInput {
  const [liveReporters, setLiveReporters] = useState<ReporterDto[] | null>(null)
  const [liveSites, setLiveSites] = useState<DumpPointDto[] | null>(null)
  const [liveContractors, setLiveContractors] = useState<{ id: string; name: string }[] | null>(null)
  const [liveError, setLiveError] = useState('')
  const [nonce, setNonce] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
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
        setLiveError('')
      } catch (err) {
        if (!cancelled) setLiveError(err instanceof Error ? err.message : 'Could not load notifications.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [nonce])

  if (!liveSites || !liveReporters) {
    return { reports: [], flagged: [], nominations: [], sites: [], liveError, loading, reload: () => setNonce((n) => n + 1) }
  }
  const sites = liveSites.map((d) => {
    const s = mapDumpPoint(d)
    return { id: s.id, name: s.name, lastClearanceIso: s.lastClearanceIso }
  })
  return {
    reports: [],
    flagged: liveSites
      .filter((d) => d.status === 'flagged')
      .map((d) => {
        const s = mapDumpPoint(d)
        return {
          id: `flag-${d.id}`, siteId: s.id, contractor: d.assigned_contractor_name ?? '',
          type: 'before' as const, flagReason: undefined, distanceM: 0, atIso: d.created_at,
        }
      }),
    nominations: liveReporters
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        id: String(r.id), name: r.name, phone: r.phone, siteId: String(r.site_id),
        contractorName: liveContractors?.find((c) => c.id === String(r.contractor_id))?.name ?? 'Unknown',
        updatedAt: r.updated_at,
      })),
    sites,
    liveError,
    loading,
    reload: () => setNonce((n) => n + 1),
  }
}
