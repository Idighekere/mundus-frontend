import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { ArrowsOut } from '@phosphor-icons/react'
import { Dialog, DialogTitle } from '@/components/ui/dialog'

function pinHtml(pin: string): string {
  // Teardrop location pin: rotated square with round head.
  return `<div style="width:30px;height:30px;position:relative">`
    + `<div style="width:22px;height:22px;margin:0 auto;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:${pin};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`
    + `<div style="width:6px;height:6px;margin:-11px auto 0;background:#fff;border-radius:50%;position:relative"></div>`
    + `</div>`
}

function SiteMapView({ lat, lng, pin, interactive }: { lat: number; lng: number; pin: string; interactive: boolean }) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, {
      zoomControl: interactive,
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: false,
      keyboard: interactive,
      touchZoom: interactive,
    }).setView([lat, lng], interactive ? 16 : 15)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    L.marker([lat, lng], {
      interactive: false,
      draggable: false,
      icon: L.divIcon({
        className: '',
        html: pinHtml(pin),
        iconSize: [30, 30],
        iconAnchor: [15, 27],
      }),
    }).addTo(map)
    mapRef.current = map
    const raf = requestAnimationFrame(() => map.invalidateSize())
    const timer = setTimeout(() => map.invalidateSize(), 350)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, pin, interactive])

  return <div ref={elRef} className="h-full w-full bg-canvas" />
}

/** Site map with a fullscreen-style interactive viewer. The pin never moves. */
export function SiteMiniMap({ name, lat, lng, pin = '#0B3D2C' }: { name: string; lat: number; lng: number; pin?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="relative h-48 w-full overflow-hidden rounded-xl border border-hairline">
        <SiteMapView lat={lat} lng={lng} pin={pin} interactive={false} />
        <span className="sr-only" role="img" aria-label={`Map showing ${name}`} />
        <div className="absolute bottom-2 left-2 z-[500] rounded border border-hairline bg-paper/95 px-2 py-1 font-mono text-xs text-ink">
          {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
        </div>
        <div className="absolute bottom-2 right-2 z-[500] rounded bg-paper/95 px-2 py-1 text-[10px] text-ink-soft">
          © OpenStreetMap contributors
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label={`Open interactive map of ${name}`}
          className="absolute right-2 top-2 z-[500] flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full bg-paper/95 text-ink shadow-card hover:bg-paper"
        >
          <ArrowsOut size={20} />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle>{name}</DialogTitle>
        <p className="mt-1 font-mono text-xs text-ink-soft">
          {lat.toFixed(4)}° N, {lng.toFixed(4)}° E · pin is fixed — pan and zoom to inspect
        </p>
        <div className="mt-3 h-[55vh] overflow-hidden rounded-xl border border-hairline">
          {open ? <SiteMapView lat={lat} lng={lng} pin={pin} interactive /> : null}
        </div>
        <p className="mt-2 text-[10px] text-ink-soft">© OpenStreetMap contributors</p>
      </Dialog>
    </>
  )
}
