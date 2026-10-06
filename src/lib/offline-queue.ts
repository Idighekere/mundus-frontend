/** Offline outbox for field check-ins. Photos captured without connectivity
 * wait here (cap ~5, localStorage is small) and upload when back online. */

export interface QueuedShot {
  id: string
  siteId: string
  siteName: string
  type: 'before' | 'after'
  dataUrl: string
  lat: number
  lng: number
  accuracyM: number | null
  atIso: string
}

const KEY = 'mundus-offline-queue'
const MAX_ITEMS = 5

function read(): QueuedShot[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as QueuedShot[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(items: QueuedShot[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // Storage full — keep whatever fit (oldest dropped first).
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_ITEMS)))
    } catch {
      // ignore
    }
  }
}

export function listQueued(): QueuedShot[] {
  return read()
}

/** Returns false when the outbox is full. */
export function enqueueShot(shot: Omit<QueuedShot, 'id'>): boolean {
  const items = read()
  if (items.length >= MAX_ITEMS) return false
  items.push({ ...shot, id: `q-${Date.now().toString(36)}` })
  write(items)
  return true
}

export function dequeueShot(id: string): void {
  write(read().filter((q) => q.id !== id))
}
