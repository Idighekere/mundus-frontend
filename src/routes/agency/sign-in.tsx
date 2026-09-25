import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { useSession } from '@/lib/session'

// Unlisted staff-only route — never linked from public pages.
export const Route = createFileRoute('/agency/sign-in')({
  component: AgencySignIn,
})

function AgencySignIn() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { session, signIn } = useSession()
  const navigate = useNavigate()

  if (session) return <Navigate to="/agency/dashboard" />

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Agency access only</p>
        <h2 className="mt-1 font-display text-4xl text-ink">Sign in</h2>
        <p className="mt-2">Restricted to agency staff. Supervisors and reporters use the field app.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!email.includes('@')) {
              setError('Enter your agency email to continue.')
              return
            }
            setError('')
            signIn(email)
            navigate({ to: '/agency/dashboard' })
          }}
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink">Work email</label>
            <Input id="email" type="email" placeholder="adaeze@aksepwma.gov" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ink">Password</label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          {error ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
          <Button type="submit" className="w-full">Sign in</Button>
        </form>
      </Card>
    </div>
  )
}
