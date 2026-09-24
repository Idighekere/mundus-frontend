// Exact-duplicate detection (doc §4 nice-to-have #7): SHA-256 over the
// captured bytes. Catches byte-identical resubmissions only — not edits.
export async function sha256Hex(dataUrl: string): Promise<string | null> {
  try {
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0))
    const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return null
  }
}
