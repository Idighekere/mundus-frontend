import { useIdentify } from '@watchupltd/react'
import { useSession } from '@/lib/session'
import { useContractorSession } from '@/lib/contractor-session'

/** Attaches signed-in identity to every WatchUp event, error, and flag check. */
export function Identify() {
  const { session } = useSession()
  const { session: contractor } = useContractorSession()
  const user = contractor
    ? { id: contractor.email ?? contractor.contractorId, email: contractor.email, name: contractor.name, role: 'contractor' }
    : session
      ? { id: session.email, email: session.email, name: session.name, role: session.isAdmin ? 'admin' : 'staff' }
      : null
  useIdentify(user)
  return null
}
