import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { useContractorSession } from '@/lib/contractor-session'
import { updateSupervisorPassword, useContractorDirectory } from '@/mocks/contractor-store'

export const Route = createFileRoute('/contractor/account')({
  component: ContractorAccount,
})

function ContractorAccount() {
  const { session } = useContractorSession()
  const directory = useContractorDirectory()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  if (!session) return null
  const entry = directory.find((c) => c.id === session.contractorId)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!entry || current !== entry.password) {
      setError('Current password is incorrect.')
      return
    }
    if (next.length < 6) {
      setError('New password needs at least 6 characters.')
      return
    }
    if (next !== confirm) {
      setError('New passwords do not match.')
      return
    }
    updateSupervisorPassword(entry.id, next)
    setCurrent('')
    setNext('')
    setConfirm('')
    setError('')
    setSaved(true)
  }

  return (
    <div className="mt-4 space-y-3">
      <Card>
        <p className="text-sm text-ink-soft">{session.contractorName}</p>
        <p className="text-lg font-semibold text-ink">{session.supervisor}</p>
        <p className="text-sm text-ink-soft">{entry?.email}</p>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-ink">Change password</h2>
        <form className="mt-3 space-y-3" onSubmit={save}>
          <div>
            <label htmlFor="pw-current" className="mb-1 block text-sm font-semibold text-ink">Current password</label>
            <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); setError(''); setSaved(false) }} />
          </div>
          <div>
            <label htmlFor="pw-new" className="mb-1 block text-sm font-semibold text-ink">New password</label>
            <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError(''); setSaved(false) }} />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="mb-1 block text-sm font-semibold text-ink">Confirm new password</label>
            <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); setSaved(false) }} />
          </div>
          {error ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
          {saved ? (
            <p className="flex items-center gap-2 rounded-lg bg-[#e6f5ee] px-3 py-2 text-sm text-primary">
              <CheckCircle size={18} weight="fill" /> Password updated.
            </p>
          ) : null}
          <Button type="submit" className="w-full">Save new password</Button>
        </form>
      </Card>
    </div>
  )
}
