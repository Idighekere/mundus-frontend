import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Crosshair } from '@phosphor-icons/react'
import { currentPosition } from '@/lib/geocode'

const UYO = { lat: 5.042, lng: 7.957 }

export function MapPicker({
  lat, lng, onChange, onLocateError,
}: {
  lat: number | null
  lng: number | null
  onChange: (pos: { lat: number; lng: number }) => void
  onLocateError: (message: string) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [locating, setLocating] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)

  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current).setView([UYO.lat, UYO.lng], 13)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    const marker = L.marker([UYO.lat, UYO.lng], {
      draggable: true,
      icon: L.divIcon({
        className: '',
        html: '<div style="width:28px;height:28px;border-radius:50%;background:#0B3D2C;border:4px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    }).addTo(map)
    marker.on('dragend', () => {
      const p = marker.getLatLng()
      setAccuracy(null)
      onChangeRef.current({ lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) })
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      setAccuracy(null)
      onChangeRef.current({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) })
    })
    mapRef.current = map
    markerRef.current = marker
    // The sheet can still be settling when the map mounts — re-check size.
    const raf = requestAnimationFrame(() => map.invalidateSize())
    const timer = setTimeout(() => map.invalidateSize(), 350)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Reflect external lat/lng (typing, current-location) on the map.
  useEffect(() => {
    if (lat === null || lng === null || !mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng([lat, lng])
    mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 14))
  }, [lat, lng])

  const locate = async () => {
    setLocating(true)
    onLocateError('')
    try {
      const fix = await currentPosition()
      setAccuracy(fix.accuracyM)
      onChange({ lat: Number(fix.lat.toFixed(6)), lng: Number(fix.lng.toFixed(6)) })
    } catch (err) {
      onLocateError(err instanceof Error ? err.message : 'Could not read current location.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <div>
      <div ref={elRef} className="z-0 h-56 w-full overflow-hidden rounded-xl border border-hairline" />
      <p className="mt-1 text-xs text-ink-soft">Tap the map or drag the pin to set coordinates.</p>
      <Button variant="secondary" onClick={locate} disabled={locating} className="mt-2 w-full">
        <Crosshair size={18} /> {locating ? 'Reading GPS — up to 12s for a precise fix…' : 'Use my current location'}
      </Button>
      {accuracy !== null ? (
        <p className={`mt-1 text-xs ${accuracy <= 100 ? 'text-ink-soft' : 'text-[#be3b3b]'}`}>
          Fix accurate to ±{accuracy} m
          {accuracy > 100 ? ' — likely network location. Move outdoors with GPS on and retry, or drag the pin.' : '.'}
        </p>
      ) : null}
    </div>
  )
}
