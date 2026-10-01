import { useSyncExternalStore } from 'react'

export interface StaffMember {
  id: string
  name: string
  email: string
  password: string
  isAdmin: boolean
  isActive: boolean
  createdAt: string
}

// Seeded agency team (demo): one admin, one staff. The admin can add and
// deactivate staff from the Staff page. Real teams come from the backend.
let staff: StaffMember[] = [
  {
    id: 'admin-1',
    name: 'Agency Admin',
    email: 'admin@aksepwma.gov',
    password: 'admin123',
    isAdmin: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'staff-1',
    name: 'Adaeze Ekong',
    email: 'adaeze@aksepwma.gov',
    password: 'staff123',
    isAdmin: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

function getStaff(): StaffMember[] {
  return staff
}

export function addStaff(name: string, email: string, password: string, isAdmin: boolean): StaffMember {
  const entry: StaffMember = {
    id: `staff-${Date.now().toString(36)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    isAdmin,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  staff = [...staff, entry]
  emit()
  return entry
}

/** Deactivate keeps the record for audit — never deletes. Returns false when blocked. */
export function deactivateStaff(id: string): boolean {
  const target = staff.find((s) => s.id === id)
  if (!target || !target.isActive) return false
  // Never strand the agency: the last active admin cannot be deactivated.
  if (target.isAdmin && staff.filter((s) => s.isAdmin && s.isActive).length <= 1) return false
  staff = staff.map((s) => (s.id === id ? { ...s, isActive: false } : s))
  emit()
  return true
}

export function reactivateStaff(id: string): void {
  staff = staff.map((s) => (s.id === id ? { ...s, isActive: true } : s))
  emit()
}

/** Mock-mode password change for the signed-in staff member. */
export function updateStaffPassword(id: string, newPassword: string): void {
  staff = staff.map((s) => (s.id === id ? { ...s, password: newPassword } : s))
  emit()
}

/** Mock-mode sign-in check: active staff only, exact password match. */
export function verifyStaff(email: string, password: string): StaffMember | undefined {
  const normalized = email.trim().toLowerCase()
  return getStaff().find((s) => s.isActive && s.email.toLowerCase() === normalized && s.password === password)
}

export function useStaff(): StaffMember[] {
  return useSyncExternalStore(subscribe, getStaff)
}
