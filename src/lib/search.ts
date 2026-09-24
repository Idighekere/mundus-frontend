import { contractors, dumpPoints } from '@/mocks/data'

export type SearchResult =
  | { kind: 'page'; id: string; title: string; hint: string; to: string }
  | { kind: 'site'; id: string; title: string; hint: string; to: string; params: { siteId: string } }
  | { kind: 'contractor'; id: string; title: string; hint: string; to: string }

const pages: Extract<SearchResult, { kind: 'page' }>[] = [
  { kind: 'page', id: 'dashboard', title: 'Dashboard', hint: 'Dump points overview', to: '/agency/dashboard' },
  { kind: 'page', id: 'contractors', title: 'Contractors', hint: 'Contractor coverage', to: '/agency/contractors' },
  { kind: 'page', id: 'manage', title: 'Manage Dump Points', hint: 'Site registry', to: '/agency/dump-points' },
]

// Swap this body for a backend endpoint later — same return shape.
export function globalSearch(query: string): SearchResult[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const matchedPages = pages.filter(
    (p) => p.title.toLowerCase().includes(q) || p.hint.toLowerCase().includes(q),
  )
  const matchedSites: SearchResult[] = dumpPoints
    .filter((s) => s.name.toLowerCase().includes(q))
    .map((s) => ({
      kind: 'site' as const,
      id: `site-${s.id}`,
      title: s.name,
      hint: `${s.supervisorName} · ${daysHint(s.lastClearanceIso)}`,
      to: '/agency/sites/$siteId',
      params: { siteId: s.id },
    }))
  const matchedContractors: SearchResult[] = contractors
    .filter((c) => c.name.toLowerCase().includes(q) || c.supervisor.toLowerCase().includes(q))
    .map((c) => ({
      kind: 'contractor' as const,
      id: `contractor-${c.id}`,
      title: c.name,
      hint: `Supervisor ${c.supervisor}`,
      to: '/agency/contractors',
    }))
  return [...matchedPages, ...matchedSites, ...matchedContractors].slice(0, 12)
}

function daysHint(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return `${d}d since clearance`
}
