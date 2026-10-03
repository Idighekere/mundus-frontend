// Central HTTP client for the Mundus backend, grouped by resource.
//
// The app runs on local mocks by default (demo-safe). Set VITE_API_URL to
// talk to the live backend — see `.env.example`. Every wrapper below
// mirrors the backend OpenAPI spec.

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '')

/** True when a backend URL is configured — screens use live data then. */
export const apiEnabled = BASE.length > 0

export type UserRole = 'supervisor' | 'agency' | 'reporter'

export interface UserDto {
  id: number
  email: string
  full_name?: string | null
  role: UserRole
  is_active: boolean
  /** Agency admins can invite and deactivate staff. Absent = non-admin. */
  is_admin?: boolean | null
  is_agency_staff?: boolean | null
  created_at: string
}

export interface TokenDto {
  access_token: string
  refresh_token: string
  token_type: string
  user: UserDto
}

export interface DumpPointDto {
  id: number
  name: string
  latitude: number
  longitude: number
  code?: string | null
  sector?: string | null
  assigned_contractor_id?: string | null
  assigned_supervisor_id?: number | null
  assigned_contractor_name?: string | null
  assigned_supervisor_name?: string | null
  interval_days: number
  last_clearance_timestamp?: string | null
  created_at: string
  formatted_last_cleared?: string | null
  days_since_last_clearance?: number | null
  is_overdue: boolean
  status: string
  flags: string[]
}

export interface DashboardStatsDto {
  total_sites: number
  on_schedule_count: number
  overdue_count: number
  critical_count: number
  flagged_count: number
}

export interface DashboardSummaryDto extends DashboardStatsDto {
  total_contractors?: number
  sites: DumpPointDto[]
}

export interface CheckInDto {
  id: number
  site_id: number
  supervisor_id: number
  type: 'before' | 'after'
  photo_url: string
  photo_hash: string
  latitude: number
  longitude: number
  distance_from_site_meters: number
  device_timestamp: string
  server_timestamp: string
  status: string
  flags?: string[]
}

export interface ReporterDto {
  id: number
  name: string
  phone: string
  site_id: number
  site_name?: string | null
  contractor_id?: number | null
  status: string
  token?: string | null
  rejection_reason?: string | null
  created_at: string
  updated_at: string
  whatsapp_link?: string | null
}

export interface ReporterFlagDto {
  id: number
  site_id: number
  reporter_id?: number | null
  reporter_name?: string | null
  timestamp: string
  note?: string | null
  photo_url?: string | null
}

export interface ContractorDto {
  id: number
  name: string
  supervisor_name: string
  supervisor_email: string
  site_count: number
  overdue: number
  critical: number
  created_at?: string | null
}

export interface SubmissionPairDto {
  date: string
  site_id: number
  site_name: string
  before?: CheckInDto | null
  after?: CheckInDto | null
  status: string
}

export interface ContractorAlertDto {
  id: number
  site_id: number
  site_name?: string | null
  message: string
  is_seen: boolean
  created_at: string
}

export interface MediaUploadDto {
  photo_url: string
  photo_hash: string
}

export interface PublicReporterSiteDto {
  reporter: Record<string, unknown>
  site: DumpPointDto
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ---- token storage ----

interface Tokens {
  access_token: string
  refresh_token: string
}

const TOKEN_KEY = 'mundus-tokens'

export function getTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

export function setTokens(t: Tokens): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t))
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** Live session = backend configured + tokens stored. Screens use this to pick data source. */
export function hasLiveSession(): boolean {
  return apiEnabled && getTokens() !== null
}

// ---- core request ----

interface RequestOptions {
  method?: string
  body?: unknown
  form?: FormData
  auth?: boolean
}

function errorMessage(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const d = (payload as { detail: unknown }).detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) {
      const first = d[0] as { msg?: string } | undefined
      if (first?.msg) return first.msg
    }
  }
  if (status === 401) return 'Session expired — sign in again.'
  if (status === 429) return 'Too many requests — try again shortly.'
  if (status >= 500) return 'Server error — try again shortly.'
  return `Request failed (${status}).`
}

async function request<T>(path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  if (!apiEnabled) throw new ApiError(0, 'Backend not configured (VITE_API_URL).')
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.auth) {
    const t = getTokens()
    if (!t) throw new ApiError(401, 'Not signed in.')
    headers.Authorization = `Bearer ${t.access_token}`
  }
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  })
  if (res.status === 401 && opts.auth && !retried) {
    const t = getTokens()
    if (t) {
      try {
        const refreshed = await request<TokenDto>('/auth/refresh', {
          method: 'POST',
          body: { refresh_token: t.refresh_token },
        }, true)
        setTokens({ access_token: refreshed.access_token, refresh_token: refreshed.refresh_token })
        return request<T>(path, opts, true)
      } catch {
        clearTokens()
      }
    }
  }
  if (!res.ok) {
    let payload: unknown = null
    try {
      payload = await res.json()
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, errorMessage(res.status, payload))
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// ---- endpoints, grouped by resource ----

/** POST /auth/* — login, registration, session, password reset. */
export const authApi = {
  login: (email: string, password: string) =>
    request<TokenDto>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (email: string, password: string, full_name?: string, role?: UserRole) =>
    request<TokenDto>('/auth/register', { method: 'POST', body: { email, password, full_name, role } }),
  me: () => request<UserDto>('/auth/me', { auth: true }),
  /** Public — emails a 6-digit OTP (15-min expiry). Always resolves so emails can't be enumerated. */
  forgotPassword: (email: string) =>
    request<void>('/auth/forgot-password', { method: 'POST', body: { email } }),
  /** Public — consumes the emailed OTP code (not a link token). */
  resetPassword: (email: string, otp: string, new_password: string) =>
    request<void>('/auth/reset-password', { method: 'POST', body: { email, otp, new_password } }),
}

/** PATCH /users/* — password management. */
export const usersApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/users/password', {
      method: 'PATCH',
      body: { current_password: currentPassword, new_password: newPassword },
      auth: true,
    }),
}

/** /agency/staff/* — staff management (agency admin JWT).
 *
 * Backend contract: the invite endpoint creates the user, generates a
 * temporary password, and emails the login details. The plaintext password
 * never appears in any response.
 */
export const staffApi = {
  list: () => request<UserDto[]>('/agency/staff', { auth: true }),
  invite: (body: { full_name: string; email: string; make_admin: boolean }) =>
    request<UserDto>('/agency/staff/invite', { method: 'POST', body, auth: true }),
  deactivate: (id: number) =>
    request<UserDto>(`/agency/staff/${id}/deactivate`, { method: 'PATCH', auth: true }),
  reactivate: (id: number) =>
    request<UserDto>(`/agency/staff/${id}/reactivate`, { method: 'PATCH', auth: true }),
}

/** GET /dashboard/* — agency overview (agency JWT). */
export const dashboardApi = {
  stats: () => request<DashboardStatsDto>('/dashboard/stats', { auth: true }),
  sites: (status?: string, search?: string) => {
    const q = new URLSearchParams()
    if (status && status !== 'all') q.set('status', status)
    if (search) q.set('q', search)
    q.set('limit', '100')
    const suffix = `?${q.toString()}`
    return request<DashboardSummaryDto>(`/dashboard/sites${suffix}`, { auth: true })
  },
}

/** /dump-points/* — site registry CRUD + assignment (agency JWT). */
export const dumpPointsApi = {
  all: () => request<DumpPointDto[]>('/dump-points/all?limit=100', { auth: true }),
  detail: (id: number) => request<DumpPointDto>(`/dump-points/detail/${id}`, { auth: true }),
  create: (body: { name: string; latitude: number; longitude: number; code?: string; sector?: string; assigned_contractor_id?: string }) =>
    request<DumpPointDto>('/dump-points/create', { method: 'POST', body, auth: true }),
  update: (id: number, body: { name?: string; latitude?: number; longitude?: number; code?: string; sector?: string }) =>
    request<DumpPointDto>(`/dump-points/update/${id}`, { method: 'PUT', body, auth: true }),
  remove: (id: number) =>
    request<void>(`/dump-points/delete/${id}`, { method: 'DELETE', auth: true }),
  assign: (id: number, body: { assigned_contractor_id?: string; assigned_supervisor_id?: number }) =>
    request<DumpPointDto>(`/dump-points/${id}/assign`, { method: 'PUT', body, auth: true }),
  /** Backend history schema is still untyped — returns raw events, may be an array or object. */
  history: (id: number) => request<unknown>(`/dump-points/${id}/history`, { auth: true }),
}

/** POST /media/* — photo uploads (contractor JWT). */
export const mediaApi = {
  uploadPhoto: (file: Blob, filename = 'photo.jpg') => {
    const form = new FormData()
    form.append('file', file, filename)
    return request<MediaUploadDto>('/media/upload', { method: 'POST', form, auth: true })
  },
}

/** /check-ins/* — before/after clearance evidence (contractor JWT). */
export const checkInsApi = {
  submit: (body: { site_id: number; type: 'before' | 'after'; photo_url: string; photo_hash: string; latitude: number; longitude: number; device_timestamp: string }) =>
    request<CheckInDto>('/check-ins/new', { method: 'POST', body, auth: true }),
  siteList: (siteId: number) => request<CheckInDto[]>(`/check-ins/site/${siteId}`, { auth: true }),
}

/** /contractors/* + /contractor/* — directory, field app, alerts. */
export const contractorsApi = {
  list: (q?: string, status?: string) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (status && status !== 'all') p.set('status', status)
    p.set('limit', '100')
    const suffix = `?${p.toString()}`
    return request<ContractorDto[]>(`/contractors/all${suffix}`, { auth: true })
  },
  create: (body: { name: string; supervisor_name: string; supervisor_email: string; password: string }) =>
    request<ContractorDto>('/contractors/new', { method: 'POST', body, auth: true }),
  /** Assigned sites for the logged-in contractor, most overdue first. */
  sites: () => request<DumpPointDto[]>('/contractor/sites', { auth: true }),
  /** Contractor history grouped into before/after pairs. */
  submissions: (site_id?: number, status?: string) => {
    const p = new URLSearchParams()
    if (site_id !== undefined) p.set('site_id', String(site_id))
    if (status && status !== 'all') p.set('status', status)
    p.set('limit', '100')
    const suffix = `?${p.toString()}`
    return request<SubmissionPairDto[]>(`/contractor/submissions${suffix}`, { auth: true })
  },
  alerts: () => request<ContractorAlertDto[]>('/contractor/alerts', { auth: true }),
  markAlertSeen: (siteId: number) =>
    request<void>(`/contractor/alerts/${siteId}/seen`, { method: 'POST', auth: true }),
}

/** /reporters/* + /r/* — community reporter lifecycle and flags. */
export const reportersApi = {
  nominate: (body: { site_id: number; contractor_id?: number; name: string; phone: string }) =>
    request<ReporterDto>('/reporters/nominate', { method: 'POST', body, auth: true }),
  list: (site_id?: number, status?: string, q?: string) => {
    const p = new URLSearchParams()
    if (site_id !== undefined) p.set('site_id', String(site_id))
    if (status && status !== 'all') p.set('status', status)
    if (q) p.set('q', q)
    p.set('limit', '100')
    const suffix = `?${p.toString()}`
    return request<ReporterDto[]>(`/reporters${suffix}`, { auth: true })
  },
  approve: (id: number) =>
    request<{ reporter: ReporterDto; token: string; whatsapp_link: string }>(`/reporters/${id}/approve`, { method: 'POST', auth: true }),
  reject: (id: number, reason?: string) =>
    request<ReporterDto>(`/reporters/${id}/reject`, { method: 'POST', body: { reason }, auth: true }),
  revoke: (id: number) =>
    request<ReporterDto>(`/reporters/${id}/revoke`, { method: 'POST', auth: true }),
  /** Public — resolves a personal reporter link. */
  resolveToken: (token: string) => request<PublicReporterSiteDto>(`/r/${token}`),
  /** Public via reporter_token — photo_url is accepted, stored, and returned with the flag. */
  flag: (body: { site_id: number; reporter_token?: string; photo_url?: string; note?: string }) =>
    request<ReporterFlagDto>('/reporters/flag-site', { method: 'POST', body }),
  siteFlags: (siteId: number) => request<ReporterFlagDto[]>(`/reporters/site/${siteId}/flags`, { auth: true }),
}

/** POST /devices/* — push notification registration. */
export const devicesApi = {
  register: (fcm_token: string, role?: string) =>
    request<{ message: string }>('/devices/register', { method: 'POST', body: { fcm_token, role }, auth: true }),
}
