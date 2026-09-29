import { createContext, useContext, useState, type ReactNode } from 'react'
import { apiEnabled, authApi, clearTokens, contractorsApi, hasLiveSession, setTokens } from './api'

interface ContractorSession {
  supervisor: string
  contractorId: string
  contractorName: string
  email?: string
  live: boolean
}

interface Ctx {
  session: ContractorSession | null
  signIn: (s: Omit<ContractorSession, 'live'>) => void
  signInLive: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const KEY = 'mundus-contractor-session'
const C = createContext<Ctx | null>(null)

function load(): ContractorSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as ContractorSession) : null
    if (parsed?.live && !hasLiveSession()) return null
    return parsed
  } catch {
    return null
  }
}

export function ContractorSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ContractorSession | null>(load)
  return (
    <C.Provider
      value={{
        session,
        signIn: (s) => {
          const next = { ...s, live: false }
          localStorage.setItem(KEY, JSON.stringify(next))
          setSession(next)
        },
        signInLive: async (email: string, password: string) => {
          if (!apiEnabled) throw new Error('Backend not configured (VITE_API_URL).')
          const token = await authApi.login(email, password)
          if (token.user.role !== 'supervisor') throw new Error('This sign-in is for field supervisors.')
          setTokens({ access_token: token.access_token, refresh_token: token.refresh_token })
          const name = token.user.full_name?.trim() || email.split('@')[0]
          let contractorId = `user-${token.user.id}`
          let contractorName = 'Unassigned contractor'
          try {
            const directory = await contractorsApi.list()
            const match = directory.find((c) => c.supervisor_email.toLowerCase() === email.trim().toLowerCase())
            if (match) {
              contractorId = String(match.id)
              contractorName = match.name
            }
          } catch {
            // Directory lookup is best-effort — login already succeeded.
          }
          const next = { supervisor: name, contractorId, contractorName, email: email.trim().toLowerCase(), live: true }
          localStorage.setItem(KEY, JSON.stringify(next))
          setSession(next)
        },
        signOut: () => {
          localStorage.removeItem(KEY)
          clearTokens()
          setSession(null)
        },
      }}
    >
      {children}
    </C.Provider>
  )
}

export function useContractorSession(): Ctx {
  const ctx = useContext(C)
  if (!ctx) throw new Error('useContractorSession must be used inside ContractorSessionProvider')
  return ctx
}
