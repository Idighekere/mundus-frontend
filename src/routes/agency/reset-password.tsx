import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input, PasswordInput } from '@/components/ui/input'
import { authApi } from '@/lib/api'

export const Route = createFileRoute('/agency/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
  }),
  component: AgencyResetPassword,
})

function AgencyResetPassword() {
  const { email: prefill } = Route.useSearch()
  const navigate = useNavigate()
  const [email, setEmail] = useState(prefill)
  const [code, setCode] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter the email the code was sent to.')
      return
    }
    if (code.trim().length < 4) {
      setError('Enter the 6-digit code from your email.')
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
    setError('')
    setSaving(true)
    try {
      // Live backend verifies a 6-digit OTP (15-min expiry) — no link token.
      await authApi.resetPassword(email.trim(), code.trim(), next)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This code is invalid or expired. Request a new one.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-canvas font-body text-ink-soft md:grid-cols-2">
      {/* dark panel */}
      <div className="grain relative overflow-hidden bg-primary-deep text-white">
        <div aria-hidden="true" className="dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_70%_70%_at_30%_30%,black,transparent)]" />
        <div className="relative flex min-h-full flex-col p-6 md:p-10">
          <p className="flex items-center gap-2 font-display text-xl tracking-wide"><Link to="/" aria-label="Mundus home" className="flex items-center gap-2"><LogoMark variant="mono" className="h-7 w-7" />MUNDUS</Link></p>
          <div className="my-auto py-8">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">Almost there</p>
            <p className="mt-2 max-w-sm leading-relaxed text-white/80">Set a fresh password and get back to the dashboard.</p>
          </div>
          <p className="hidden font-mono text-[11px] tracking-wider text-white/60 md:block">RESET · MUNDUS AGENCY</p>
        </div>
      </div>

      {/* form column */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">
          <button onClick={() => navigate({ to: '/agency/sign-in' })} className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} /> Back to sign in
          </button>
          {done ? (
            <div className="mt-4 rounded-2xl border border-hairline bg-paper p-6 text-center shadow-card">
              <CheckCircle size={44} weight="fill" className="mx-auto text-[#1d6f42]" />
              <h1 className="mt-2 font-display text-3xl text-ink">Password updated</h1>
              <p className="mt-2 leading-relaxed">Sign in with your new password to open the dashboard.</p>
              <Button asChild className="mt-4 w-full">
                <Link to="/agency/sign-in">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-primary">Set a new password</p>
              <h1 className="mt-1 font-display text-4xl text-ink">Choose a password</h1>
              <form className="mt-6 space-y-4" onSubmit={submit}>
                <div>
                  <label htmlFor="arp-email" className="mb-1 block text-sm font-semibold text-ink">Work email</label>
                  <Input id="arp-email" type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="adaeze@aksepwma.gov" />
                </div>
                <div>
                  <label htmlFor="arp-code" className="mb-1 block text-sm font-semibold text-ink">6-digit code</label>
                  <Input id="arp-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }} placeholder="123456" />
                </div>
                <div>
                  <label htmlFor="arp-new" className="mb-1 block text-sm font-semibold text-ink">New password</label>
                  <PasswordInput id="arp-new" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError('') }} placeholder="At least 6 characters" />
                </div>
                <div>
                  <label htmlFor="arp-confirm" className="mb-1 block text-sm font-semibold text-ink">Confirm new password</label>
                  <PasswordInput id="arp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError('') }} placeholder="Repeat it" />
                </div>
                {error ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
                <Button type="submit" disabled={saving} loading={saving} className="w-full">
                  {saving ? 'Saving…' : 'Save new password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
