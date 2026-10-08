// Central HTTP client for the Mundus backend, grouped by resource.
// VITE_API_URL points at the live backend — see `.env.example`. Every
// wrapper below mirrors the backend OpenAPI spec. Failures surface as
// errors; screens never fall back to local data.

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '')

/** True when a backend URL is configured — screens use live data then. */
export const apiEnabled = BASE.length > 0

export type UserRole = 'contractor' | 'agency' | 'reporter'

export interface UserDto {
  id: number
  email: string
  full_name?: string | null
  role: UserRole
  is_active: boolean
  /** Contractor record linked at login (contractor logins only). */
  contractor_id?: string | null
  contractor_name?: string | null
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
  id: string
  name: string
  latitude: number
  longitude: number
  code?: string | null
  sector?: string | null
  assigned_contractor_id?: string | null
  assigned_contractor_name?: string | null
  assigned_contractor_email?: string | null
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
  site_id: string
  user_id: number
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
  site_id: string
  site_name?: string | null
  contractor_id?: string | null
  status: string
  token?: string | null
  rejection_reason?: string | null
  created_at: string
  updated_at: string
  whatsapp_link?: string | null
}

export interface ReporterFlagDto {
  id: number
  site_id: string
  reporter_id?: number | null
  reporter_name?: string | null
  timestamp: string
  note?: string | null
  photo_url?: string | null
}

export interface ContractorDto {
  id: string
  name: string
  email: string
  site_count: number
  overdue: number
  critical: number
  created_at?: string | null
}

export interface SubmissionPairDto {
  date: string
  site_id: string
  site_name: string
  before?: CheckInDto | null
  after?: CheckInDto | null
  status: string
}

export interface ContractorAlertDto {
  id: number
  site_id: string
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

export type PayoutStatus =
  | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING'
  | 'SUCCESS' | 'FAILED' | 'CANCELLED'

export interface PayoutStatementDto {
  id: string
  contractor_id: string
  contractor_name?: string | null
  contractor_email?: string | null
  period: string
  monthly_stipend: number
  expected_clearances: number
  verified_clearances: number
  held_clearances: number
  calculated_payout_amount: number
  status: PayoutStatus
  unique_payout_reference: string
  transfer_code?: string | null
  approved_by_id?: number | null
  approved_by_name?: string | null
  approved_at?: string | null
  payment_provider: string
  payment_provider_status?: string | null
  failure_reason?: string | null
  calculation_breakdown?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface PayoutStatementListDto {
  period?: string | null
  total_stipend_pool: number
  total_earned_amount: number
  total_paid_amount: number
  pending_approval_count: number
  total_count: number
  statements: PayoutStatementDto[]
}

export interface ContractorPayoutDetailsDto {
  contractor_id: string
  name: string
  email: string
  monthly_stipend: number
  bank_name?: string | null
  bank_account_number?: string | null
  bank_account_name?: string | null
  bank_code?: string | null
  payment_provider_recipient_id?: string | null
  is_payout_ready: boolean
}

export interface SiteEarningsBreakdownDto {
  site_id: string
  site_name: string
  code?: string | null
  interval_days: number
  expected_clearances: number
  verified_clearances: number
  held_clearances: number
}

export interface ContractorEarningsDto {
  contractor_id: string
  contractor_name: string
  period: string
  days_in_month: number
  monthly_stipend: number
  expected_clearances: number
  verified_clearances: number
  held_clearances: number
  earned_so_far: number
  progress_percent: number
  sites_breakdown: SiteEarningsBreakdownDto[]
  payout_statement?: PayoutStatementDto | null
}

export interface HeldClearanceDto {
  site_id: string
  site_name: string
  date: string
  contractor_id?: string | null
  contractor_name?: string | null
  before_check_in_id?: number | null
  after_check_in_id?: number | null
  flags: string[]
  reason: string
}

export interface BankDto {
  name: string
  code: string
}

export interface BankResolveDto {
  account_number: string
  account_name: string
  bank_code: string
  bank_name: string
}

export interface AgencyWalletDto {
  balance: number
  currency: string
  last_updated?: string | null
}

export interface WalletTopUpDto {
  checkout_url: string
  reference: string
  amount: number
  currency: string
  session_id?: string | null
  status: string
  created_at?: string | null
}

export interface PayoutReceiptDto {
  receipt_id: string
  reference: string
  transfer_code?: string | null
  payment_provider: string
  period: string
  contractor: { name?: string | null; email?: string | null }
  amount_paid: number
  currency: string
  performance: {
    expected_clearances: number
    verified_clearances: number
    held_clearances: number
    stipend: number
  }
  status: string
  approved_at?: string | null
  approved_by?: string | null
  environment: string
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
    if (typeof d === 'string') {
      if (status === 429) {
        const retry = (payload as { retry_in_seconds?: unknown }).retry_in_seconds
        if (typeof retry === 'number' && Number.isFinite(retry) && retry > 0) {
          const h = Math.floor(retry / 3600)
          const m = Math.ceil((retry % 3600) / 60)
          const when = h > 0 ? `about ${h}h${m > 0 ? ` ${m}m` : ''}` : `about ${m} minute${m === 1 ? '' : 's'}`
          return `${d} Try again in ${when}.`
        }
      }
      return d
    }
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
  detail: (id: string) => request<DumpPointDto>(`/dump-points/detail/${id}`, { auth: true }),
  create: (body: { name: string; latitude: number; longitude: number; code?: string; sector?: string; assigned_contractor_id?: string }) =>
    request<DumpPointDto>('/dump-points/create', { method: 'POST', body, auth: true }),
  update: (id: string, body: { name?: string; latitude?: number; longitude?: number; code?: string; sector?: string }) =>
    request<DumpPointDto>(`/dump-points/update/${id}`, { method: 'PUT', body, auth: true }),
  remove: (id: string) =>
    request<void>(`/dump-points/delete/${id}`, { method: 'DELETE', auth: true }),
  assign: (id: string, body: { assigned_contractor_id?: string }) =>
    request<DumpPointDto>(`/dump-points/${id}/assign`, { method: 'PUT', body, auth: true }),
  /** Backend history schema is still untyped — returns raw events, may be an array or object. */
  history: (id: string) => request<unknown>(`/dump-points/${id}/history`, { auth: true }),
}

/** POST /media/* — photo uploads (contractor JWT; reporter upload is token-validated, no JWT). */
export const mediaApi = {
  uploadPhoto: (file: Blob, filename = 'photo.jpg') => {
    const form = new FormData()
    form.append('file', file, filename)
    return request<MediaUploadDto>('/media/upload', { method: 'POST', form, auth: true })
  },
  /** Public — reporter evidence upload, validated by reporter token instead of JWT. */
  uploadReporterPhoto: (file: Blob, reporter_token: string, filename = 'flag.jpg') => {
    const form = new FormData()
    form.append('file', file, filename)
    form.append('reporter_token', reporter_token)
    return request<MediaUploadDto>('/media/reporter-upload', { method: 'POST', form })
  },
}

/** /check-ins/* — before/after clearance evidence (contractor JWT). */
export const checkInsApi = {
  submit: (body: { site_id: string; type: 'before' | 'after'; photo_url: string; photo_hash: string; latitude: number; longitude: number; device_timestamp: string }) =>
    request<CheckInDto>('/check-ins/new', { method: 'POST', body, auth: true }),
  siteList: (siteId: string) => request<CheckInDto[]>(`/check-ins/site/${siteId}`, { auth: true }),
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
  create: (body: { name: string; email: string; password: string }) =>
    request<ContractorDto>('/contractors/new', { method: 'POST', body, auth: true }),
  /** Assigned sites for the logged-in contractor, most overdue first. */
  sites: () => request<DumpPointDto[]>('/contractor/sites', { auth: true }),
  /** Contractor history grouped into before/after pairs. */
  submissions: (site_id?: string, status?: string) => {
    const p = new URLSearchParams()
    if (site_id !== undefined) p.set('site_id', String(site_id))
    if (status && status !== 'all') p.set('status', status)
    p.set('limit', '100')
    const suffix = `?${p.toString()}`
    return request<SubmissionPairDto[]>(`/contractor/submissions${suffix}`, { auth: true })
  },
  alerts: () => request<ContractorAlertDto[]>('/contractor/alerts', { auth: true }),
  markAlertSeen: (siteId: string) =>
    request<void>(`/contractor/alerts/${siteId}/seen`, { method: 'POST', auth: true }),
}

/** /reporters/* + /r/* — community reporter lifecycle and flags. */
export const reportersApi = {
  nominate: (body: { site_id: string; contractor_id?: string; name: string; phone: string }) =>
    request<ReporterDto>('/reporters/nominate', { method: 'POST', body, auth: true }),
  list: (site_id?: string, status?: string, q?: string) => {
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
  flag: (body: { site_id: string; reporter_token?: string; photo_url?: string; note?: string }) =>
    request<ReporterFlagDto>('/reporters/flag-site', { method: 'POST', body }),
  siteFlags: (siteId: string) => request<ReporterFlagDto[]>(`/reporters/site/${siteId}/flags`, { auth: true }),
}

/** POST /devices/* — push notification registration. */
export const devicesApi = {
  register: (fcm_token: string, role?: string) =>
    request<{ message: string }>('/devices/register', { method: 'POST', body: { fcm_token, role }, auth: true }),
}

/** Download an authed file response (e.g. CSV export) via a blob URL. */
export async function downloadAuthedFile(path: string, filename: string): Promise<void> {
  const t = getTokens()
  if (!t) throw new ApiError(401, 'Not signed in.')
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${t.access_token}` },
  })
  if (!res.ok) throw new ApiError(res.status, `Download failed (${res.status}).`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/** /agency/payouts/* + /contractor/* — monthly stipend payouts (agency JWT unless noted). */
export const payoutsApi = {
  /** Agency: statement table. Response carries pool totals + pending count. */
  list: (period?: string, status?: string, contractor_id?: string) => {
    const p = new URLSearchParams()
    if (period) p.set('period', period)
    if (status && status !== 'all' && status !== 'ALL') p.set('status', status)
    if (contractor_id) p.set('contractor_id', contractor_id)
    p.set('limit', '100')
    return request<PayoutStatementListDto>(`/agency/payouts?${p.toString()}`, { auth: true })
  },
  detail: (id: string) => request<PayoutStatementDto>(`/agency/payouts/${id}`, { auth: true }),
  /** Agency: generate immutable month snapshots (defaults to current month). */
  generate: (period?: string, contractor_id?: string) => {
    const p = new URLSearchParams()
    if (period) p.set('period', period)
    if (contractor_id) p.set('contractor_id', contractor_id)
    const suffix = p.toString() ? `?${p.toString()}` : ''
    return request<PayoutStatementDto[]>(`/agency/payouts/generate${suffix}`, { method: 'POST', auth: true })
  },
  /** Agency: approve + initiate provider transfer. Idempotent server-side. */
  approve: (id: string, notes?: string) =>
    request<PayoutStatementDto>(`/agency/payouts/${id}/approve`, { method: 'POST', body: { notes: notes ?? null }, auth: true }),
  /** Agency: approve many statements for a period in one action. */
  bulkApprove: (period: string, statement_ids?: string[], notes?: string) =>
    request<unknown>(`/agency/payouts/bulk-approve`, { method: 'POST', body: { period, statement_ids: statement_ids ?? null, notes: notes ?? null }, auth: true }),
  receipt: (id: string) => request<PayoutReceiptDto>(`/agency/payouts/${id}/receipt`, { auth: true }),
  /** Agency: set stipend + bank details once; backend registers the provider recipient. */
  savePayoutDetails: (contractorId: string, body: { monthly_stipend: number; bank_account_number: string; bank_code: string; bank_name?: string; bank_account_name?: string }) =>
    request<ContractorPayoutDetailsDto>(`/agency/contractors/${contractorId}/payout-details`, { method: 'PUT', body, auth: true }),
  /** Contractor: own bank details. monthly_stipend echoes the current value
  (contractors can't set their own pay — the backend should ignore it). */
  saveMyPayoutDetails: (body: { monthly_stipend?: number; bank_account_number: string; bank_code: string; bank_name?: string; bank_account_name?: string }) =>
    request<ContractorPayoutDetailsDto>(`/contractor/payout-details`, { method: 'PUT', body, auth: true }),
  /** Agency: platform balance funding payouts (absent until backend ships it — callers must tolerate 404). */
  wallet: () => request<AgencyWalletDto>(`/agency/wallet`, { auth: true }),
  /** Agency: open a hosted checkout to fund the platform wallet. Returns a checkout URL + reference. */
  topup: (amount: number, redirect_url?: string) =>
    request<WalletTopUpDto>(`/agency/wallet/topup`, { method: 'POST', body: { amount, redirect_url: redirect_url ?? null }, auth: true }),
  /** Agency: top-up session history. */
  topups: () => request<WalletTopUpDto[]>(`/agency/wallet/topups`, { auth: true }),
  /** Agency: visits on hold for review. */
  held: (period?: string) => {
    const suffix = period ? `?period=${encodeURIComponent(period)}` : ''
    return request<HeldClearanceDto[]>(`/agency/clearances/held${suffix}`, { auth: true })
  },
  /** Agency: clear a held visit so it counts as verified. */
  clearHeld: (site_id: string, date: string) =>
    request<unknown>(`/agency/clearances/${site_id}/${date}/approve`, { method: 'POST', auth: true }),
  /** Public: supported banks for the payout-setup form. */
  banks: () => request<BankDto[]>(`/payouts/banks`),
  /** Public: verify a NUBAN account number against a bank code. */
  resolveAccount: (account_number: string, bank_code: string) =>
    request<BankResolveDto>(`/payouts/resolve-account`, { method: 'POST', body: { account_number, bank_code } }),
  /** Contractor: live progress for a month (defaults to current). */
  myEarnings: (period?: string) => {
    const suffix = period ? `?period=${encodeURIComponent(period)}` : ''
    return request<ContractorEarningsDto>(`/contractor/earnings${suffix}`, { auth: true })
  },
  /** Contractor: own payout history. */
  myPayouts: () => request<PayoutStatementDto[]>(`/contractor/payouts`, { auth: true }),
  /** Contractor: one own statement (ownership enforced server-side). */
  myPayoutDetail: (id: string) => request<PayoutStatementDto>(`/contractor/payouts/${id}`, { auth: true }),
}
