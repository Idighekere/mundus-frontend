import { createContext, useContext, useState, type ReactNode } from 'react'

interface Session {
  email: string
  name: string
}

interface SessionCtx {
  session: Session | null
  signIn: (email: string) => void
  signOut: () => void
}

const KEY = 'mundus-agency-session'
const Ctx = createContext<SessionCtx | null>(null)

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
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
        signIn: (email: string) => {
          const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Agency Admin'
          const next = { email, name }
          localStorage.setItem(KEY, JSON.stringify(next))
          setSession(next)
        },
        signOut: () => {
          localStorage.removeItem(KEY)
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
