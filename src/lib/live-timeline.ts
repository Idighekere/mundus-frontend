// Live site-detail data composed client-side from typed endpoints.
// (The backend history endpoint is still untyped, so the timeline is
// built from per-site check-ins + reporter flags instead.)

import { checkInsApi, dumpPointsApi, reportersApi, type CheckInDto, type ReporterFlagDto } from './api'
import { mapDaysSince, mapDumpPoint, mapSiteStatus } from './backend-map'
import type { SiteStatus } from './overdue'
import type { DumpPoint, Visit, VisitPhoto } from '@/mocks/data'

export interface LiveSiteDetail {
  site: DumpPoint
  contractorName: string
  days: number
  status: SiteStatus
  intervalDays: number
  timeline: Visit[]
}

function toPhoto(c: CheckInDto): VisitPhoto {
  return {
    atIso: c.device_timestamp,
    lat: c.latitude,
    lng: c.longitude,
    distanceM: Math.round(c.distance_from_site_meters),
  }
}

function dayKey(iso: string): string {
  return new Date(iso).toDateString()
}

/** Groups a day's check-ins into one timeline visit. */
function pairVisit(siteId: number, day: string, items: CheckInDto[]): Visit {
  const before = items.find((c) => c.type === 'before')
  const after = items.find((c) => c.type === 'after')
  const all = [before, after].filter((c) => c !== undefined)
  const supervisorId = before?.supervisor_id ?? after?.supervisor_id ?? 0
  const atIso = all.map((c) => +new Date(c.server_timestamp)).reduce((a, b) => Math.max(a, b), 0)
  const offTarget = all.some(
    (c) => c.status === 'location_mismatch' || c.distance_from_site_meters > 100,
  )
  const duplicate = all.some((c) => c.status === 'flagged')
  let status: Visit['status'] = 'complete'
  let note = 'Before and after clearance verified.'
  if (!before || !after) {
    status = 'incomplete'
    note = 'Before photo submitted. No after clearance photo recorded.'
  } else if (duplicate) {
    status = 'duplicate-photo'
    note = 'Submitted photo matched an earlier submission.'
  } else if (offTarget) {
    status = 'location-mismatch'
    const far = Math.max(...all.map((c) => Math.round(c.distance_from_site_meters)))
    note = `Capture radius discrepancy — ${far} m from site (100 m threshold).`
  }
  return {
    id: `live-${siteId}-${new Date(day).getTime()}`,
    siteId: String(siteId),
    dateIso: new Date(atIso).toISOString(),
    contractor: `Contractor #${supervisorId}`,
    status,
    note,
    before: before ? toPhoto(before) : undefined,
    after: after ? toPhoto(after) : undefined,
  }
}

function flagVisit(siteId: number, f: ReporterFlagDto): Visit {
  return {
    id: `flag-${f.id}`,
    siteId: String(siteId),
    dateIso: f.timestamp,
    contractor: f.reporter_name ?? 'Community report',
    status: 'reported-full',
    note: f.note?.trim() ? f.note : 'Dump point reported overflowing.',
  }
}

export function buildLiveTimeline(siteId: number, checkins: CheckInDto[], flags: ReporterFlagDto[]): Visit[] {
  const byDay = new Map<string, CheckInDto[]>()
  for (const c of checkins) {
    const key = dayKey(c.server_timestamp)
    byDay.set(key, [...(byDay.get(key) ?? []), c])
  }
  const visits = [...byDay.entries()].map(([day, items]) => pairVisit(siteId, day, items))
  for (const f of flags) visits.push(flagVisit(siteId, f))
  return visits.sort((a, b) => +new Date(b.dateIso) - +new Date(a.dateIso))
}

export async function fetchLiveSiteDetail(siteId: number): Promise<LiveSiteDetail> {
  const [detail, checkins, flags] = await Promise.all([
    dumpPointsApi.detail(siteId),
    checkInsApi.siteList(siteId),
    reportersApi.siteFlags(siteId),
  ])
  const site = mapDumpPoint(detail)
  return {
    site,
    contractorName: detail.assigned_contractor_name ?? 'Unassigned',
    days: mapDaysSince(detail, site.lastClearanceIso),
    status: mapSiteStatus(detail.status),
    intervalDays: detail.interval_days,
    timeline: buildLiveTimeline(siteId, checkins, flags),
  }
}
