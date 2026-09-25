import { useSyncExternalStore } from 'react'
import { contractors as seedContractors } from '@/mocks/data'

export interface DirectoryContractor {
  id: string
  name: string
  supervisor: string
  email: string
  password: string
}

export interface Submission {
  id: string
  siteId: string
  supervisor: string
  type: 'before' | 'after'
  photo: string
  lat: number
  lng: number
  accuracyM: number | null
  simulated: boolean
  distanceM: number
  flagged: boolean
  flagReason?: 'location' | 'duplicate'
  hash?: string
  atIso: string
}

// ---- Contractor directory (agency-created contractors appear everywhere) ----
let directory: DirectoryContractor[] = [
  { ...seedContractors[0], email: 'emmanuel.udo@cleancity.ng', password: 'supervisor123' },
  { ...seedContractors[1], email: 'blessing.akpan@greenpath.ng', password: 'supervisor123' },
]
const dirListeners = new Set<() => void>()

function emitDir() {
  dirListeners.forEach((fn) => fn())
}

function subscribeDir(fn: () => void): () => void {
  dirListeners.add(fn)
  return () => { dirListeners.delete(fn) }
}

function getDirectory(): DirectoryContractor[] {
  return directory
}

export function addContractor(name: string, supervisor: string, email: string, password: string): DirectoryContractor {
  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`
  const entry = { id, name: name.trim(), supervisor: supervisor.trim(), email: email.trim().toLowerCase(), password }
  directory = [...directory, entry]
  emitDir()
  return entry
}

export function verifySupervisor(email: string, password: string): DirectoryContractor | undefined {
  const normalized = email.trim().toLowerCase()
  return getDirectory().find((c) => c.email.toLowerCase() === normalized && c.password === password)
}

export function updateSupervisorPassword(contractorId: string, newPassword: string): void {
  directory = directory.map((c) => (c.id === contractorId ? { ...c, password: newPassword } : c))
  emitDir()
}

export function useContractorDirectory(): DirectoryContractor[] {
  return useSyncExternalStore(subscribeDir, getDirectory)
}

export function supervisorContractorId(supervisor: string): string | null {
  const found = getDirectory().find((c) => c.supervisor === supervisor)
  return found ? found.id : null
}

// ---- Field submissions (persisted locally for the demo) ----
const SUB_KEY = 'mundus-submissions'

function loadSubs(): Submission[] {
  try {
    const raw = localStorage.getItem(SUB_KEY)
    return raw ? (JSON.parse(raw) as Submission[]) : []
  } catch {
    return []
  }
}

let submissions: Submission[] = typeof localStorage === 'undefined' ? [] : loadSubs()
const subListeners = new Set<() => void>()

function persistSubs() {
  try {
    localStorage.setItem(SUB_KEY, JSON.stringify(submissions))
  } catch {
    // storage full (photos) — keep in-memory only
  }
  subListeners.forEach((fn) => fn())
}

function subscribeSubs(fn: () => void): () => void {
  subListeners.add(fn)
  return () => { subListeners.delete(fn) }
}

function getSubmissions(): Submission[] {
  return submissions
}

export function recordSubmission(s: Omit<Submission, 'id' | 'atIso'>): Submission {
  const entry: Submission = { ...s, id: `sub-${Date.now().toString(36)}`, atIso: new Date().toISOString() }
  // Cap history so stored photos can't freeze low-end devices.
  submissions = [entry, ...submissions].slice(0, 30)
  persistSubs()
  return entry
}

export function useSubmissions(): Submission[] {
  return useSyncExternalStore(subscribeSubs, getSubmissions)
}

export function todaySubmissions(siteId: string, supervisor: string): { before?: Submission; after?: Submission } {
  const day = new Date().toDateString()
  const mine = submissions.filter(
    (s) => s.siteId === siteId && s.supervisor === supervisor && new Date(s.atIso).toDateString() === day,
  )
  return {
    before: mine.find((s) => s.type === 'before'),
    after: mine.find((s) => s.type === 'after'),
  }
}
