import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

/** Read-only site map — real OpenStreetMap tiles with a site pin. */
export function SiteMiniMap({ name, lat, lng, pin = '#0B3D2C' }: { name: string; lat: number; lng: number; pin?: string }) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    }).setView([lat, lng], 15)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    L.marker([lat, lng], {
      interactive: false,
      icon: L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:${pin};border:4px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    }).addTo(map)
    mapRef.current = map
    const raf = requestAnimationFrame(() => map.invalidateSize())
    return () => {
      cancelAnimationFrame(raf)
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, pin])

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-xl border border-hairline">
      <div ref={elRef} className="h-full w-full" aria-label={`Map showing ${name}`} role="img" />
      <div className="absolute bottom-2 left-2 z-[500] rounded border border-hairline bg-paper/95 px-2 py-1 font-mono text-xs text-ink">
        {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
      </div>
      <div className="absolute bottom-2 right-2 z-[500] rounded bg-paper/95 px-2 py-1 text-[10px] text-ink-soft">
        © OpenStreetMap contributors
      </div>
    </div>
  )
}
