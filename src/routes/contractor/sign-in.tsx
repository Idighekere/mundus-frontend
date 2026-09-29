import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { useContractorSession } from '@/lib/contractor-session'
import { apiEnabled } from '@/lib/api'
import { useContractorDirectory, verifySupervisor } from '@/mocks/contractor-store'

export const Route = createFileRoute('/contractor/sign-in')({
  component: ContractorSignIn,
})

function ContractorSignIn() {
  const { session, signIn, signInLive } = useContractorSession()
  const directory = useContractorDirectory()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (session) return <Navigate to="/contractor/sites" />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter any email and password to continue the demo.')
      return
    }
    if (apiEnabled) {
      setError('')
      try {
        await signInLive(email, password)
        navigate({ to: '/contractor/sites' })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign in failed. Try again.')
      }
      return
    }
    // Demo mode: registered credentials sign in as that supervisor,
    // anything else signs in as the first supervisor.
    const entry = verifySupervisor(email, password) ?? directory[0]
    if (!entry) {
      setError('No contractors exist yet — ask the agency to register one.')
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
        <p className="mt-1 text-xs text-ink-soft">Demo mode: any email + password works.</p>
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
          {error ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
          <Button type="submit" className="w-full">Start shift</Button>
        </form>
      </Card>
    </div>
  )
}
