/** Post-login redirect: carry the user's intended URL across the sign-in boundary. */

/** Capture the attempted URL (path + query) for the `redirect` search param. */
export function buildIntent(pathname: string, searchStr?: string): string {
  if (!searchStr) return pathname
  return `${pathname}${searchStr.startsWith('?') ? searchStr : `?${searchStr}`}`
}

/**
 * Validate a `redirect` value before navigating: must stay inside the
 * section and must never point at a public auth page (loop protection).
 * Falls back to the section home for anything else (open-redirect safe).
 */
export function safeRedirect(raw: unknown, section: '/agency' | '/contractor', fallback: string): string {
  if (typeof raw !== 'string' || !raw) return fallback
  if (raw !== section && raw !== `${section}/` && !raw.startsWith(`${section}/`)) return fallback
  const pathOnly = raw.split('?')[0].split('#')[0]
  if (
    pathOnly === `${section}/sign-in` ||
    pathOnly === `${section}/forgot-password` ||
    pathOnly === `${section}/reset-password`
  )
    return fallback
  return raw
}
