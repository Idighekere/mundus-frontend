import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useContractorSession } from '@/lib/contractor-session'
import { useContractorDirectory } from '@/mocks/contractor-store'

export const Route = createFileRoute('/contractor/sign-in')({
  component: ContractorSignIn,
})

function ContractorSignIn() {
  const directory = useContractorDirectory()
  const { session, signIn } = useContractorSession()
  const navigate = useNavigate()
  const [supervisor, setSupervisor] = useState('')
  const [error, setError] = useState('')

  if (session) return <Navigate to="/contractor/sites" />

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-10">
      <Card>
        <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Supervisor sign in</p>
        <h2 className="mt-1 text-3xl font-bold text-ink">Start your round</h2>
        <p className="mt-2">Choose your supervisor profile. You will only see sites assigned to your contractor.</p>
        <div className="mt-6 space-y-4">
          <div className="text-sm">
            <span className="mb-1 block font-semibold text-ink">Supervisor</span>
            <Select value={supervisor} onValueChange={(v) => { setSupervisor(v); setError('') }}>
              <SelectTrigger><SelectValue placeholder="Select supervisor" /></SelectTrigger>
              <SelectContent>
                {directory.map((c) => (
                  <SelectItem key={c.id} value={c.supervisor}>
                    {c.supervisor} · {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#b42323]">{error}</p> : null}
          <Button
            className="w-full"
            onClick={() => {
              const entry = directory.find((c) => c.supervisor === supervisor)
              if (!entry) {
                setError('Select your supervisor profile to continue.')
                return
              }
              signIn({ supervisor: entry.supervisor, contractorId: entry.id, contractorName: entry.name })
              navigate({ to: '/contractor/sites' })
            }}
          >
            Start shift
          </Button>
        </div>
      </Card>
    </div>
  )
}
