import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Buildings, FileText, MagnifyingGlass, MapPin } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { globalSearch, type SearchIndex, type SearchResult } from '@/lib/search'
import { contractorsApi, dashboardApi } from '@/lib/api'
import { mapDumpPoint, mapDaysSince } from '@/lib/backend-map'

const icons = {
  page: <FileText size={18} className="shrink-0 text-primary" />,
  site: <MapPin size={18} className="shrink-0 text-primary" />,
  contractor: <Buildings size={18} className="shrink-0 text-primary" />,
}

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState<SearchIndex>({ sites: [], contractors: [] })
  const results = globalSearch(query, index)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [sites, contractors] = await Promise.all([dashboardApi.sites(), contractorsApi.list()])
        if (cancelled) return
        setIndex({
          sites: sites.sites.map((d) => {
            const s = mapDumpPoint(d)
            const days = mapDaysSince(d, s.lastClearanceIso)
            return { id: s.id, name: s.name, hint: `${d.assigned_contractor_name ?? 'Unassigned'} · ${days}d since clearance` }
          }),
          contractors: contractors.map((c) => ({ id: String(c.id), name: c.name })),
        })
      } catch {
        // Search stays page-only rather than loud.
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  const go = (r: SearchResult) => {
    setOpen(false)
    setQuery('')
    if (r.kind === 'site') navigate({ to: r.to, params: r.params })
    else navigate({ to: r.to })
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
          if (e.key === 'Enter' && results[active]) go(results[active])
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Search pages, dump points, contractors…"
        className={compact ? 'min-h-[38px] bg-canvas pl-9 text-[13px]' : 'bg-canvas pl-10'}
        aria-label="Global search"
        role="combobox"
        aria-expanded={open && query.trim().length > 0}
      />
      {open && query.trim().length > 0 ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-hairline bg-paper shadow-xl" role="listbox">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm">No matches for “{query}”.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => go(r)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm ${i === active ? 'bg-cloud' : ''}`}
                role="option"
                aria-selected={i === active}
              >
                {icons[r.kind]}
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{r.title}</span>
                  <span className="block truncate text-xs text-ink-soft">{r.hint}</span>
                </span>
                <span className="ml-auto shrink-0 text-[11px] uppercase tracking-wide text-ink-soft">{r.kind}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
