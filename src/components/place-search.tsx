import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlass, MapPin } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { searchPlaces, type PlaceResult } from '@/lib/geocode'

// Forward place search so the agency can pin a site by name
// without standing on it.
export function PlaceSearch({ onPick }: { onPick: (pos: { lat: number; lng: number }) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.trim().length < 3) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    timer.current = setTimeout(async () => {
      const found = await searchPlaces(query)
      setResults(found)
      setSearching(false)
      setOpen(true)
    }, 500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query])

  return (
    <div ref={boxRef} className="relative">
      <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search for the place by name…"
        className="pl-10"
        aria-label="Search for a place"
      />
      {open && query.trim().length >= 3 ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-hairline bg-paper shadow-xl">
          {searching ? (
            <p className="px-4 py-3 text-sm text-ink-soft">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-soft">No matches — tap the map or use current location.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.lat}-${r.lng}-${i}`}
                onClick={() => {
                  onPick({ lat: Number(r.lat.toFixed(6)), lng: Number(r.lng.toFixed(6)) })
                  setOpen(false)
                  setQuery(r.label.split(',')[0])
                }}
                className="flex w-full cursor-pointer items-start gap-2 px-4 py-2.5 text-left text-sm hover:bg-cloud"
              >
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                <span className="text-ink">{r.label}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
