import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, EnvelopeSimple, Key } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input, PasswordInput } from '@/components/ui/input'
import { apiEnabled, authApi } from '@/lib/api'
import { updateContractorPassword, useContractorDirectory } from '@/mocks/contractor-store'

export const Route = createFileRoute('/contractor/forgot-password')({
  component: ContractorForgotPassword,
})

function ContractorForgotPassword() {
  const directory = useContractorDirectory()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    if (!apiEnabled) {
      // Demo mode: registered emails reset right here, unknown ones get
      // the same generic message (no account enumeration).
      const entry = directory.find((c) => c.email.toLowerCase() === email.trim().toLowerCase())
      if (entry) setResetting(true)
      else setSent(true)
      return
    }
    setSending(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset link.')
    } finally {
      setSending(false)
    }
  }

  const resetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    const entry = directory.find((c) => c.email.toLowerCase() === email.trim().toLowerCase())
    if (!entry) {
      setError('This email is not registered.')
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
    updateContractorPassword(entry.id, next)
    setError('')
    setDone(true)
  }

  return (
    <div className="grid min-h-screen bg-canvas font-body text-ink-soft md:grid-cols-2">
      {/* dark panel */}
      <div className="grain relative overflow-hidden bg-primary-deep text-white">
        <div aria-hidden="true" className="dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_70%_70%_at_30%_30%,black,transparent)]" />
        <div className="relative flex min-h-full flex-col p-6 md:p-10">
          <p className="flex items-center gap-2 font-display text-xl tracking-wide"><Link to="/" aria-label="Mundus home" className="flex items-center gap-2"><LogoMark variant="mono" className="h-7 w-7" />MUNDUS</Link></p>
          <div className="my-auto py-8">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">Locked out?</p>
            <div className="mt-4 hidden rounded-2xl bg-white/10 p-5 backdrop-blur md:block">
              <div className="flex items-center gap-3">
                <Key size={24} className="shrink-0 text-white/80" />
                <p className="leading-relaxed text-white/80">Enter your email and follow the reset link. Back on round in a minute.</p>
              </div>
            </div>
          </div>
          <p className="hidden font-mono text-[11px] tracking-wider text-white/60 md:block">RESET · MUNDUS FIELD</p>
        </div>
      </div>

      {/* form column */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">
          <Link to="/contractor/sign-in" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
          {done ? (
            <div className="mt-4 rounded-2xl border border-hairline bg-paper p-6 text-center shadow-card">
              <CheckCircle size={44} weight="fill" className="mx-auto text-[#1d6f42]" />
              <h1 className="mt-2 font-display text-3xl text-ink">Password updated</h1>
              <p className="mt-2 leading-relaxed">Sign in with your new password to start your round.</p>
              <Button asChild className="mt-4 w-full">
                <Link to="/contractor/sign-in">Back to sign in</Link>
              </Button>
            </div>
          ) : sent ? (
            <div className="mt-4 rounded-2xl border border-hairline bg-paper p-6 text-center shadow-card">
              <EnvelopeSimple size={44} className="mx-auto text-primary" />
              <h1 className="mt-2 font-display text-3xl text-ink">Check your email</h1>
              <p className="mt-2 leading-relaxed">If <span className="font-mono text-sm">{email}</span> is registered, a reset link is on its way.</p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link to="/contractor/sign-in">Back to sign in</Link>
              </Button>
            </div>
          ) : resetting ? (
            <>
              <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-primary">Set a new password</p>
              <h1 className="mt-1 font-display text-4xl text-ink">Choose a password</h1>
              <p className="mt-2 leading-relaxed">For <span className="font-mono text-sm">{email}</span>.</p>
              <form className="mt-6 space-y-4" onSubmit={resetPassword}>
                <div>
                  <label htmlFor="fp-new" className="mb-1 block text-sm font-semibold text-ink">New password</label>
                  <PasswordInput id="fp-new" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError('') }} placeholder="At least 6 characters" />
                </div>
                <div>
                  <label htmlFor="fp-confirm" className="mb-1 block text-sm font-semibold text-ink">Confirm new password</label>
                  <PasswordInput id="fp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError('') }} placeholder="Repeat it" />
                </div>
                {error ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
                <Button type="submit" className="w-full">Save new password</Button>
              </form>
            </>
          ) : (
            <>
              <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-primary">Reset password</p>
              <h1 className="mt-1 font-display text-4xl text-ink md:text-[48px]">Forgot password?</h1>
              <p className="mt-2 leading-relaxed">Enter the email the agency registered for you and we'll send a reset link.</p>
              <form className="mt-6 space-y-4" onSubmit={requestLink}>
                <div>
                  <label htmlFor="fp-email" className="mb-1 block text-sm font-semibold text-ink">Email</label>
                  <Input id="fp-email" type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="you@contractor.ng" />
                </div>
                {error ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
                <Button type="submit" disabled={sending} loading={sending} className="w-full">
                  {sending ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
