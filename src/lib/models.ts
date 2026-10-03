/** Shared domain models. These describe backend shapes after mapping —
no seed data, no mock stores. */

export interface Contractor {
  id: string
  /** Person or trade name — the individual who signs in and checks in. */
  name: string
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
  contractor: string
  status: VisitStatus
  note: string
  before?: VisitPhoto
  after?: VisitPhoto
  ticket?: string
}
