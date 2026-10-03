// Maps backend DTOs onto the app's local models.

import type { DumpPointDto } from './api'
import type { DumpPoint } from '@/lib/models'
import { daysSince, type SiteStatus } from './overdue'

/** Backend uses snake_case + an extra `flagged` state — normalize to app statuses. */
export function mapSiteStatus(raw: string): SiteStatus {
  if (raw === 'critical') return 'critical'
  if (raw === 'overdue' || raw === 'flagged') return 'overdue'
  return 'on-schedule'
}

export function mapDumpPoint(d: DumpPointDto): DumpPoint {
  const fallbackIso = d.last_clearance_timestamp ?? d.created_at
  return {
    id: String(d.id),
    code: d.code ?? `AK-UYO-${String(d.id).padStart(3, '0')}`,
    sector: d.sector ?? 'Unassigned sector',
    name: d.name,
    lat: d.latitude,
    lng: d.longitude,
    contractorId: d.assigned_contractor_id ?? '',
    supervisorId: d.assigned_supervisor_id !== null && d.assigned_supervisor_id !== undefined
      ? String(d.assigned_supervisor_id)
      : 'unassigned',
    supervisorName: d.assigned_supervisor_name ?? 'Unassigned',
    lastClearanceIso: fallbackIso,
    reporterFlagIso: undefined,
  }
}

/** Prefer server-computed days, fall back to local calc for safety. */
export function mapDaysSince(d: DumpPointDto, iso: string): number {
  return d.days_since_last_clearance !== null && d.days_since_last_clearance !== undefined
    ? Math.max(0, Math.floor(d.days_since_last_clearance))
    : daysSince(iso)
}

/** A site counts as reporter-flagged when the backend says so. */
export function hasReporterFlag(d: DumpPointDto): boolean {
  return d.status === 'flagged' || (d.flags?.length ?? 0) > 0
}

export function displayName(email: string, fullName?: string | null): string {
  if (fullName && fullName.trim()) return fullName.trim()
  return email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Agency Admin'
}
