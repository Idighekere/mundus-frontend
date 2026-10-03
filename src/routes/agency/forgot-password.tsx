import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, Key } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input, PasswordInput } from '@/components/ui/input'
import { apiEnabled, authApi } from '@/lib/api'

export const Route = createFileRoute('/agency/forgot-password')({
  component: AgencyForgotPassword,
})

function AgencyForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid work email address.')
      return
    }
    setError('')
    if (!apiEnabled) {
      // Demo mode: no backend to send a code — same generic screen, no enumeration.
      setSent(true)
      return
    }
    setSending(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset code.')
    } finally {
      setSending(false)
    }
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim().length < 4) {
      setError('Enter the code from your email.')
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
    setVerifying(true)
    try {
      // Live backend issues a 6-digit OTP (15-min expiry) — no link token.
      await authApi.resetPassword(email.trim(), code.trim(), next)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This code is invalid or expired. Request a new one.')
    } finally {
      setVerifying(false)
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
            <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">Locked out?</p>
            <div className="mt-4 hidden rounded-2xl bg-white/10 p-5 backdrop-blur md:block">
              <div className="flex items-center gap-3">
                <Key size={24} className="shrink-0 text-white/80" />
                <p className="leading-relaxed text-white/80">Enter your work email and the 6-digit code. Back to the dashboard in a minute.</p>
              </div>
            </div>
          </div>
          <p className="hidden font-mono text-[11px] tracking-wider text-white/60 md:block">RESET · MUNDUS AGENCY</p>
        </div>
      </div>

      {/* form column */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">
          <Link to="/agency/sign-in" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
          {done ? (
            <div className="mt-4 rounded-2xl border border-hairline bg-paper p-6 text-center shadow-card">
              <CheckCircle size={44} weight="fill" className="mx-auto text-[#1d6f42]" />
              <h1 className="mt-2 font-display text-3xl text-ink">Password updated</h1>
              <p className="mt-2 leading-relaxed">Sign in with your new password to open the dashboard.</p>
              <Button asChild className="mt-4 w-full">
                <Link to="/agency/sign-in">Back to sign in</Link>
              </Button>
            </div>
          ) : sent ? (
            apiEnabled ? (
              <>
                <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-primary">Check your email</p>
                <h1 className="mt-1 font-display text-4xl text-ink">Enter the code</h1>
                <p className="mt-2 leading-relaxed">If <span className="font-mono text-sm">{email}</span> belongs to an agency account, a 6-digit code is on its way (expires in 15 minutes).</p>
                <form className="mt-6 space-y-4" onSubmit={verifyCode}>
                  <div>
                    <label htmlFor="afp-code" className="mb-1 block text-sm font-semibold text-ink">6-digit code</label>
                    <Input id="afp-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }} placeholder="123456" />
                  </div>
                  <div>
                    <label htmlFor="afp-new" className="mb-1 block text-sm font-semibold text-ink">New password</label>
                    <PasswordInput id="afp-new" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError('') }} placeholder="At least 6 characters" />
                  </div>
                  <div>
                    <label htmlFor="afp-confirm" className="mb-1 block text-sm font-semibold text-ink">Confirm new password</label>
                    <PasswordInput id="afp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError('') }} placeholder="Repeat it" />
                  </div>
                  {error ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
                  <Button type="submit" disabled={verifying} loading={verifying} className="w-full">
                    {verifying ? 'Verifying…' : 'Verify code & save password'}
                  </Button>
                  <Button type="button" variant="secondary" className="w-full" onClick={() => { setSent(false); setCode(''); setError('') }}>
                    Resend a new code
                  </Button>
                </form>
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-hairline bg-paper p-6 text-center shadow-card">
                <h1 className="font-display text-3xl text-ink">Demo mode</h1>
                <p className="mt-2 leading-relaxed">Password reset needs the live backend. Ask your agency admin to reset it, or sign in with a demo account.</p>
                <Button asChild className="mt-4 w-full">
                  <Link to="/agency/sign-in">Back to sign in</Link>
                </Button>
              </div>
            )
          ) : (
            <>
              <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-primary">Reset password</p>
              <h1 className="mt-1 font-display text-4xl text-ink md:text-[48px]">Forgot password?</h1>
              <p className="mt-2 leading-relaxed">Enter your agency work email and we'll send a 6-digit code.</p>
              <form className="mt-6 space-y-4" onSubmit={requestCode}>
                <div>
                  <label htmlFor="afp-email" className="mb-1 block text-sm font-semibold text-ink">Work email</label>
                  <Input id="afp-email" type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="adaeze@aksepwma.gov" />
                </div>
                {error ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
                <Button type="submit" disabled={sending} loading={sending} className="w-full">
                  {sending ? 'Sending…' : 'Send reset code'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
