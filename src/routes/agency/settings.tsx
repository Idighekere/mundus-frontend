import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { EnvelopeSimple, MagnifyingGlass, PauseCircle, PlayCircle, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input, PasswordInput } from '@/components/ui/input'
import { RightSheet } from '@/components/ui/right-sheet'
import { BottomSheet } from '@/components/ui/sheet'
import { TD, TH, THead, TR, Table, TBody } from '@/components/ui/table'
import { addStaff, deactivateStaff, reactivateStaff, updateStaffPassword, useStaff, type StaffMember } from '@/mocks/staff-store'
import { hasLiveSession, staffApi, usersApi, type UserDto } from '@/lib/api'
import { useSession } from '@/lib/session'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/agency/settings')({
  component: SettingsPage,
})

function toMember(u: UserDto): StaffMember {
  return {
    id: String(u.id),
    name: u.full_name ?? u.email,
    email: u.email,
    password: '',
    isAdmin: u.is_admin === true,
    isActive: u.is_active,
    createdAt: u.created_at,
  }
}

function SettingsPage() {
  const { session } = useSession()
  const isAdmin = session?.isAdmin === true
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [makeAdmin, setMakeAdmin] = useState(false)
  const [formError, setFormError] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const mockStaff = useStaff()
  const [liveStaff, setLiveStaff] = useState<UserDto[] | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwOk, setPwOk] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const live = hasLiveSession()

  const loadLive = useCallback(async () => {
    setLiveLoading(true)
    setLiveError('')
    try {
      setLiveStaff(await staffApi.list())
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Could not load staff.')
    } finally {
      setLiveLoading(false)
    }
  }, [])

  useEffect(() => {
    if (live) void loadLive()
  }, [live, loadLive])

  const members: StaffMember[] = liveStaff ? liveStaff.map(toMember) : mockStaff
  const q = search.trim().toLowerCase()
  const rows = members.filter(
    (m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
  )

  const resetForm = () => {
    setName('')
    setEmail('')
    setMakeAdmin(false)
    setFormError('')
  }

  const invite = async () => {
    if (name.trim().length < 2) {
      setFormError('Full name needs at least 2 characters.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter a valid work email.')
      return
    }
    if (members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) {
      setFormError('This email is already on the team.')
      return
    }
    if (!live) {
      addStaff(name, email, 'staff123', makeAdmin)
      setSentTo(null)
      resetForm()
      setFormOpen(false)
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const created = await staffApi.invite({
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        make_admin: makeAdmin,
      })
      await loadLive()
      setSentTo(created.email)
      resetForm()
      setFormOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not send the invite.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    setPwError('')
    setPwOk(false)
    if (newPw.length < 6) {
      setPwError('New password needs at least 6 characters.')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.')
      return
    }
    if (!live) {
      const me = members.find((m) => m.email.toLowerCase() === session?.email.toLowerCase())
      if (!me || me.password !== currentPw) {
        setPwError('Current password is incorrect.')
        return
      }
      updateStaffPassword(me.id, newPw)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setPwOk(true)
      return
    }
    setPwSaving(true)
    try {
      await usersApi.changePassword(currentPw, newPw)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setPwOk(true)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not change your password.')
    } finally {
      setPwSaving(false)
    }
  }

  const toggleActive = async (m: StaffMember) => {
    setActionError('')
    if (m.email.toLowerCase() === session?.email.toLowerCase()) {
      setActionError('You cannot deactivate your own account.')
      return
    }
    if (!live) {
      if (m.isActive) {
        const ok = deactivateStaff(m.id)
        if (!ok) setActionError('The last active admin cannot be deactivated.')
      } else {
        reactivateStaff(m.id)
      }
      return
    }
    try {
      if (m.isActive) await staffApi.deactivate(Number(m.id))
      else await staffApi.reactivate(Number(m.id))
      await loadLive()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update this account.')
    }
  }

  const formBody = (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        {live
          ? 'The backend creates the account and emails the login details to this address.'
          : 'Demo mode — the account works immediately here. Email invites send once the backend is connected.'}
      </p>
      <div>
        <label htmlFor="staff-name" className="mb-1 block text-sm font-semibold text-ink">Full name</label>
        <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adaeze Ekong" />
      </div>
      <div>
        <label htmlFor="staff-email" className="mb-1 block text-sm font-semibold text-ink">Work email</label>
        <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="adaeze@aksepwma.gov" />
      </div>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={makeAdmin}
          onChange={(e) => setMakeAdmin(e.target.checked)}
          className="h-5 w-5 accent-[#0B3D2C]"
        />
        Agency admin — can manage staff
      </label>
      {formError ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{formError}</p> : null}
    </div>
  )

  const formActions = (
    <div className="flex gap-2">
      <Button onClick={() => void invite()} disabled={saving} className="flex-1">
        <EnvelopeSimple size={18} /> {saving ? 'Sending…' : live ? 'Send invite' : 'Add staff'}
      </Button>
      <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
    </div>
  )

  return (
    <div>
      <h2 className="font-display text-4xl text-ink">Settings</h2>

      <Card className="mt-4 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Signed in as</p>
        <p className="mt-1 font-semibold text-ink">
          {session?.name ?? '—'}{' '}
          <span className={cn(
            'ml-1 inline-flex rounded-full px-2 py-0.5 align-middle text-[11px] font-bold',
            isAdmin ? 'bg-primary text-white' : 'bg-cloud text-ink',
          )}>
            {isAdmin ? 'Admin' : 'Staff'}
          </span>
        </p>
        <p className="text-sm text-ink-soft">{session?.email ?? '—'}</p>
      </Card>

      <Card className="mt-4 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Security</p>
        <p className="mt-1 font-semibold text-ink">Change password</p>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="pw-current" className="mb-1 block text-sm font-semibold text-ink">Current password</label>
            <PasswordInput id="pw-current" autoComplete="current-password" value={currentPw} onChange={(e) => { setCurrentPw(e.target.value); setPwError(''); setPwOk(false) }} placeholder="••••••••" />
          </div>
          <div>
            <label htmlFor="pw-new" className="mb-1 block text-sm font-semibold text-ink">New password</label>
            <PasswordInput id="pw-new" autoComplete="new-password" value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwError(''); setPwOk(false) }} placeholder="At least 6 characters" />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="mb-1 block text-sm font-semibold text-ink">Confirm new password</label>
            <PasswordInput id="pw-confirm" autoComplete="new-password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setPwError(''); setPwOk(false) }} placeholder="Repeat the new password" />
          </div>
          {pwError ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{pwError}</p> : null}
          {pwOk ? <p role="status" className="rounded-xl bg-[#e6f5ee] px-4 py-3 text-sm font-medium text-[#1d6f42]">Password changed.</p> : null}
          <Button onClick={() => void changePassword()} disabled={pwSaving} className="w-full sm:w-auto">
            {pwSaving ? 'Saving…' : 'Change password'}
          </Button>
        </div>
      </Card>

      {isAdmin ? (
      <>
      <div className="mt-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-ink">Staff</h3>
          <p className="mt-1 text-ink-soft">Agency accounts. New staff sign in with the login details emailed to them.</p>
        </div>
        <Button onClick={() => { resetForm(); setSentTo(null); setFormOpen(true) }}>
          <Plus size={18} /> Invite staff
        </Button>
      </div>

      {sentTo ? (
        <p role="status" className="mt-4 rounded-xl bg-[#e6f5ee] px-4 py-3 text-sm font-medium text-[#1d6f42]">
          Invite sent to {sentTo}. They will receive their login details by email.
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="mt-4 rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{actionError}</p>
      ) : null}

      {liveLoading && !liveStaff ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">Loading staff…</p>
          <p className="mt-1">Fetching the team from the server.</p>
        </Card>
      ) : liveError && !liveStaff ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">Could not load staff</p>
          <p className="mt-1">{liveError}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void loadLive()}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          <div className="relative mt-4">
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="pl-10"
              aria-label="Search staff"
            />
          </div>

          {rows.length === 0 ? (
            <Card className="mt-4 text-center">
              <p className="font-display text-[28px] text-ink">No staff match “{search}”</p>
              <p className="mt-1">Try a different name or email.</p>
            </Card>
          ) : (
            <>
              <div className="mt-4 hidden md:block">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>Name</TH><TH>Role</TH><TH>Status</TH><TH>Actions</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((m) => (
                      <TR key={m.id} className={cn(!m.isActive && 'opacity-60')}>
                        <TD>
                          <span className="block font-semibold text-ink">{m.name}</span>
                          <span className="block text-xs text-ink-soft">{m.email}</span>
                        </TD>
                        <TD>
                          <span className={cn(
                            'inline-flex rounded-full px-3 py-1 text-xs font-bold',
                            m.isAdmin ? 'bg-primary text-white' : 'bg-cloud text-ink',
                          )}>
                            {m.isAdmin ? 'Admin' : 'Staff'}
                          </span>
                        </TD>
                        <TD className="text-ink-soft">{m.isActive ? 'Active' : 'Deactivated'}</TD>
                        <TD>
                          <Button
                            variant="secondary"
                            onClick={() => void toggleActive(m)}
                            disabled={m.email.toLowerCase() === session?.email.toLowerCase()}
                          >
                            {m.isActive ? <><PauseCircle size={16} /> Deactivate</> : <><PlayCircle size={16} /> Reactivate</>}
                          </Button>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>

              <div className="mt-4 space-y-2 md:hidden">
                {rows.map((m) => (
                  <Card key={m.id} className={cn('flex items-center justify-between gap-2 p-4', !m.isActive && 'opacity-60')}>
                    <div>
                      <p className="font-semibold text-ink">
                        {m.name}{' '}
                        <span className={cn(
                          'ml-1 inline-flex rounded-full px-2 py-0.5 align-middle text-[11px] font-bold',
                          m.isAdmin ? 'bg-primary text-white' : 'bg-cloud text-ink',
                        )}>
                          {m.isAdmin ? 'Admin' : 'Staff'}
                        </span>
                      </p>
                      <p className="text-xs text-ink-soft">{m.email} · {m.isActive ? 'Active' : 'Deactivated'}</p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => void toggleActive(m)}
                      disabled={m.email.toLowerCase() === session?.email.toLowerCase()}
                    >
                      {m.isActive ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                      <span className="sr-only">{m.isActive ? 'Deactivate' : 'Reactivate'}</span>
                    </Button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {isDesktop ? (
        <RightSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          title="Invite staff"
          description="They sign in with the login details emailed to them."
          footer={formActions}
        >
          {formBody}
        </RightSheet>
      ) : (
        <BottomSheet open={formOpen} onOpenChange={setFormOpen} title="Invite staff" footer={formActions}>
          {formBody}
        </BottomSheet>
      )}
      </>
      ) : null}
    </div>
  )
}
