import { createContext, useContext, useState, type ReactNode } from 'react'
import { apiEnabled, authApi, clearTokens, hasLiveSession, setTokens } from './api'
import { verifyStaff } from '@/mocks/staff-store'
import { displayName } from './backend-map'

interface Session {
  email: string
  name: string
  isAdmin: boolean
  /** True when authenticated against the live backend (JWT stored). */
  live: boolean
}

interface SessionCtx {
  session: Session | null
  signIn: (email: string, password?: string) => Promise<void>
  signOut: () => void
}

const KEY = 'mundus-agency-session'
const Ctx = createContext<SessionCtx | null>(null)

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Session) : null
    // Drop stale live sessions whose tokens are gone (e.g. after refresh expiry).
    if (parsed?.live && !hasLiveSession()) return null
    if (parsed && typeof parsed.isAdmin !== 'boolean') parsed.isAdmin = false
    return parsed
  } catch {
    return null
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(load)
  return (
    <Ctx.Provider
      value={{
        session,
        signIn: async (email: string, password?: string) => {
          if (!apiEnabled) {
            const member = verifyStaff(email, password ?? '')
            if (!member) throw new Error('Unknown email or wrong password. Ask your agency admin for an account.')
            const next = { email: member.email, name: member.name, isAdmin: member.isAdmin, live: false }
            localStorage.setItem(KEY, JSON.stringify(next))
            setSession(next)
            return
          }
          const token = await authApi.login(email, password ?? '')
          setTokens({ access_token: token.access_token, refresh_token: token.refresh_token })
          const next = {
            email: token.user.email,
            name: displayName(token.user.email, token.user.full_name),
            isAdmin: token.user.is_admin === true,
            live: true,
          }
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
    </Ctx.Provider>
  )
}

export function useSession(): SessionCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
