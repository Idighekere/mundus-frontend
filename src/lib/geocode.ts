// Reverse-geocode via OpenStreetMap Nominatim (demo-grade, no key).
// Swap for a paid provider in production — same { address } shape.
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    return typeof data?.display_name === 'string' ? data.display_name : null
  } catch {
    return null
  }
}

export interface GeoFix {
  lat: number
  lng: number
  /** Estimated accuracy radius in metres, when reported. */
  accuracyM: number | null
}

function once(timeoutMs: number): Promise<GeoFix> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null,
        }),
      (err) => reject(new Error(err.message || 'Could not read current location.')),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    )
  })
}

/**
 * Best-effort precise fix. Desktop browsers without GPS fall back to
 * network/ISP location (often wrong city) — so we force a fresh
 * high-accuracy read, then refine with watchPosition for a few seconds,
 * keeping the most accurate fix. Resolves with the best fix found.
 */
export function currentPosition(): Promise<GeoFix> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'))
      return
    }
    let best: GeoFix | null = null
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      navigator.geolocation.clearWatch(watchId)
      if (best) resolve(best)
      else reject(new Error('Could not read current location.'))
    }
    const consider = (fix: GeoFix) => {
      if (!best || (fix.accuracyM !== null && (best.accuracyM === null || fix.accuracyM < best.accuracyM))) {
        best = fix
      }
      // Good enough — stop refining early.
      if (best.accuracyM !== null && best.accuracyM <= 50) finish()
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        consider({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null,
        }),
      () => {
        // Watch errors are non-fatal while we still have time — fall back
        // to a single shot at the end if nothing arrived.
        if (!best) {
          once(8000).then(
            (fix) => { best = fix; finish() },
            (err) => { if (!settled) { settled = true; reject(err) } },
          )
        }
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )
    // Cap the refinement window, then resolve with the best fix seen.
    setTimeout(finish, 12_000)
  })
}
