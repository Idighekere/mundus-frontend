export interface Contractor {
  id: string
  name: string
  supervisor: string
}

export interface DumpPoint {
  id: string
  code: string
  sector: string
  name: string
  lat: number
  lng: number
  contractorId: string
  supervisorId: string
  supervisorName: string
  lastClearanceIso: string
  reporterFlagIso?: string
}

export type VisitStatus =
  | 'complete'
  | 'incomplete'
  | 'location-mismatch'
  | 'duplicate-photo'
  | 'reported-full'

export interface VisitPhoto {
  atIso: string
  lat: number
  lng: number
  distanceM: number
}

export interface Visit {
  id: string
  siteId: string
  dateIso: string
  supervisor: string
  status: VisitStatus
  note: string
  before?: VisitPhoto
  after?: VisitPhoto
  ticket?: string
}

const now = Date.now()
const daysAgo = (d: number, h = 9) => {
  const dt = new Date(now - d * 86_400_000)
  dt.setHours(h, 15, 0, 0)
  return dt.toISOString()
}

export const contractors: Contractor[] = [
  { id: 'cleancity', name: 'CleanCity Services', supervisor: 'Emmanuel Udo' },
  { id: 'greenpath', name: 'GreenPath Ltd', supervisor: 'Blessing Akpan' },
]

export const dumpPoints: DumpPoint[] = [
  {
    id: 'nwaniba-road', code: 'AK-UYO-NWN-04', sector: 'Sector 4 · Uyo Urban Core',
    name: 'Nwaniba Road', lat: 5.045, lng: 7.962,
    contractorId: 'cleancity', supervisorId: 'emmanuel-udo', supervisorName: 'Emmanuel Udo',
    lastClearanceIso: daysAgo(12), reporterFlagIso: daysAgo(1),
  },
  {
    id: 'ibb-way', code: 'AK-UYO-IBB-02', sector: 'Sector 2 · Uyo Urban Core',
    name: 'IBB Way', lat: 5.038, lng: 7.95,
    contractorId: 'cleancity', supervisorId: 'emmanuel-udo', supervisorName: 'Emmanuel Udo',
    lastClearanceIso: daysAgo(9),
  },
  {
    id: 'itam-junction', code: 'AK-UYO-ITM-07', sector: 'Sector 7 · Itam District',
    name: 'Itam Junction', lat: 5.052, lng: 7.968,
    contractorId: 'greenpath', supervisorId: 'blessing-akpan', supervisorName: 'Blessing Akpan',
    lastClearanceIso: daysAgo(8), reporterFlagIso: daysAgo(3),
  },
  {
    id: 'akpan-andem-market', code: 'AK-UYO-AAM-03', sector: 'Sector 3 · Market District',
    name: 'Akpan Andem Market', lat: 5.03, lng: 7.955,
    contractorId: 'greenpath', supervisorId: 'blessing-akpan', supervisorName: 'Blessing Akpan',
    lastClearanceIso: daysAgo(4),
  },
  {
    id: 'abak-road', code: 'AK-UYO-ABK-05', sector: 'Sector 5 · Abak Corridor',
    name: 'Abak Road', lat: 5.025, lng: 7.94,
    contractorId: 'cleancity', supervisorId: 'emmanuel-udo', supervisorName: 'Emmanuel Udo',
    lastClearanceIso: daysAgo(3),
  },
  {
    id: 'oran-road', code: 'AK-UYO-ORN-06', sector: 'Sector 6 · Oran District',
    name: 'Oran Road', lat: 5.058, lng: 7.945,
    contractorId: 'greenpath', supervisorId: 'blessing-akpan', supervisorName: 'Blessing Akpan',
    lastClearanceIso: daysAgo(1),
  },
]

export const visits: Visit[] = [
  // Nwaniba Road — mirrors the Stitch audit log
  {
    id: 'nwn-today', siteId: 'nwaniba-road', dateIso: daysAgo(0, 10), supervisor: 'Emmanuel Udo',
    status: 'incomplete', note: 'Before photo submitted. No after clearance photo recorded within the 6-hour operational window.',
    before: { atIso: daysAgo(0, 10), lat: 5.0451, lng: 7.9622, distanceM: 18 },
  },
  {
    id: 'nwn-mismatch', siteId: 'nwaniba-road', dateIso: daysAgo(5, 14), supervisor: 'Emmanuel Udo',
    status: 'location-mismatch', note: 'Before and after clearance photos submitted. GPS telemetry detected capture radius discrepancy exceeding the 100 m threshold.',
    before: { atIso: daysAgo(5, 13), lat: 5.0471, lng: 7.9642, distanceM: 240 },
    after: { atIso: daysAgo(5, 14), lat: 5.047, lng: 7.9641, distanceM: 232 },
  },
  {
    id: 'nwn-report', siteId: 'nwaniba-road', dateIso: daysAgo(8, 8), supervisor: 'Community report',
    status: 'reported-full', note: 'Dump point reported overflowing past curb onto roadway. Pedestrian walkway fully obstructed.',
    ticket: 'CR-8831',
  },
  {
    id: 'nwn-duplicate', siteId: 'nwaniba-road', dateIso: daysAgo(12, 9), supervisor: 'Blessing Akpan',
    status: 'duplicate-photo', note: 'Submitted before photo was identical to an earlier submission. Clearance verified by subsequent after photo.',
    before: { atIso: daysAgo(12, 9), lat: 5.045, lng: 7.962, distanceM: 12 },
    after: { atIso: daysAgo(12, 11), lat: 5.045, lng: 7.9619, distanceM: 14 },
  },
  {
    id: 'nwn-complete', siteId: 'nwaniba-road', dateIso: daysAgo(19, 11), supervisor: 'Emmanuel Udo',
    status: 'complete', note: 'Before and after clearance verified on schedule. Waste fully evacuated and swept.',
    before: { atIso: daysAgo(19, 10), lat: 5.0451, lng: 7.9622, distanceM: 18 },
    after: { atIso: daysAgo(19, 11), lat: 5.0451, lng: 7.9619, distanceM: 14 },
  },
  // IBB Way
  {
    id: 'ibb-complete', siteId: 'ibb-way', dateIso: daysAgo(9, 10), supervisor: 'Emmanuel Udo',
    status: 'complete', note: 'Before and after clearance verified on schedule.',
    before: { atIso: daysAgo(9, 9), lat: 5.0381, lng: 7.9501, distanceM: 22 },
    after: { atIso: daysAgo(9, 10), lat: 5.038, lng: 7.95, distanceM: 9 },
  },
  {
    id: 'ibb-mismatch', siteId: 'ibb-way', dateIso: daysAgo(16, 15), supervisor: 'Emmanuel Udo',
    status: 'location-mismatch', note: 'Capture radius discrepancy exceeding the 100 m threshold.',
    before: { atIso: daysAgo(16, 14), lat: 5.0395, lng: 7.952, distanceM: 310 },
    after: { atIso: daysAgo(16, 15), lat: 5.0394, lng: 7.9519, distanceM: 295 },
  },
  // Itam Junction
  {
    id: 'itm-report', siteId: 'itam-junction', dateIso: daysAgo(3, 8), supervisor: 'Community report',
    status: 'reported-full', note: 'Site flagged as full ahead of schedule by designated reporter.',
    ticket: 'CR-8844',
  },
  {
    id: 'itm-complete', siteId: 'itam-junction', dateIso: daysAgo(8, 11), supervisor: 'Blessing Akpan',
    status: 'complete', note: 'Before and after clearance verified on schedule.',
    before: { atIso: daysAgo(8, 10), lat: 5.0521, lng: 7.9681, distanceM: 16 },
    after: { atIso: daysAgo(8, 11), lat: 5.052, lng: 7.968, distanceM: 8 },
  },
  // Akpan Andem Market
  {
    id: 'aam-complete', siteId: 'akpan-andem-market', dateIso: daysAgo(4, 12), supervisor: 'Blessing Akpan',
    status: 'complete', note: 'Market close-down clearance verified. Area swept.',
    before: { atIso: daysAgo(4, 11), lat: 5.0301, lng: 7.9551, distanceM: 20 },
    after: { atIso: daysAgo(4, 12), lat: 5.03, lng: 7.955, distanceM: 11 },
  },
  // Abak Road
  {
    id: 'abk-complete', siteId: 'abak-road', dateIso: daysAgo(3, 10), supervisor: 'Emmanuel Udo',
    status: 'complete', note: 'Before and after clearance verified on schedule.',
    before: { atIso: daysAgo(3, 9), lat: 5.0251, lng: 7.9401, distanceM: 19 },
    after: { atIso: daysAgo(3, 10), lat: 5.025, lng: 7.94, distanceM: 10 },
  },
  {
    id: 'abk-incomplete', siteId: 'abak-road', dateIso: daysAgo(10, 13), supervisor: 'Emmanuel Udo',
    status: 'incomplete', note: 'Before photo submitted. After photo never recorded.',
    before: { atIso: daysAgo(10, 13), lat: 5.025, lng: 7.9402, distanceM: 24 },
  },
  // Oran Road
  {
    id: 'orn-complete', siteId: 'oran-road', dateIso: daysAgo(1, 9), supervisor: 'Blessing Akpan',
    status: 'complete', note: 'Before and after clearance verified on schedule.',
    before: { atIso: daysAgo(1, 8), lat: 5.0581, lng: 7.9451, distanceM: 17 },
    after: { atIso: daysAgo(1, 9), lat: 5.058, lng: 7.945, distanceM: 7 },
  },
]

export function contractorById(id: string): Contractor {
  return contractors.find((c) => c.id === id) ?? contractors[0]
}

export function siteById(id: string): DumpPoint | undefined {
  return dumpPoints.find((s) => s.id === id)
}

export function visitsForSite(siteId: string): Visit[] {
  return visits
    .filter((v) => v.siteId === siteId)
    .sort((a, b) => +new Date(b.dateIso) - +new Date(a.dateIso))
}

export function visitById(siteId: string, visitId: string): Visit | undefined {
  return visits.find((v) => v.siteId === siteId && v.id === visitId)
}
