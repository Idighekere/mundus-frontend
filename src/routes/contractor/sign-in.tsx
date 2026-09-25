import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { useContractorSession } from '@/lib/contractor-session'
import { verifySupervisor } from '@/mocks/contractor-store'

export const Route = createFileRoute('/contractor/sign-in')({
  component: ContractorSignIn,
})

function ContractorSignIn() {
  const { session, signIn } = useContractorSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (session) return <Navigate to="/contractor/sites" />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const entry = verifySupervisor(email, password)
    if (!entry) {
      setError('Email or password is incorrect. Use the details the agency gave you.')
      return
    }
    setError('')
    signIn({ supervisor: entry.supervisor, contractorId: entry.id, contractorName: entry.name })
    navigate({ to: '/contractor/sites' })
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-10">
      <Card>
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Supervisor sign in</p>
        <h2 className="mt-1 text-3xl font-bold text-ink">Start your round</h2>
        <p className="mt-2 text-sm text-ink-soft">Sign in with the email and password the agency registered for you. You will only see your own contractor's sites.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label htmlFor="supervisor-email" className="mb-1 block text-sm font-semibold text-ink">Email</label>
            <Input
              id="supervisor-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="you@contractor.ng"
            />
          </div>
          <div>
            <label htmlFor="supervisor-password" className="mb-1 block text-sm font-semibold text-ink">Password</label>
            <Input
              id="supervisor-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
            />
          </div>
          {error ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#b42323]">{error}</p> : null}
          <Button type="submit" className="w-full">Start shift</Button>
        </form>
      </Card>
    </div>
  )
}
