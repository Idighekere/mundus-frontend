import { createContext, useContext, useState, type ReactNode } from 'react'

interface ContractorSession {
  supervisor: string
  contractorId: string
  contractorName: string
}

interface Ctx {
  session: ContractorSession | null
  signIn: (s: ContractorSession) => void
  signOut: () => void
}

const KEY = 'mundus-contractor-session'
const C = createContext<Ctx | null>(null)

function load(): ContractorSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ContractorSession) : null
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
        signIn: (s) => { localStorage.setItem(KEY, JSON.stringify(s)); setSession(s) },
        signOut: () => { localStorage.removeItem(KEY); setSession(null) },
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
