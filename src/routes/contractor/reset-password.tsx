import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/input'
import { apiEnabled, authApi } from '@/lib/api'

export const Route = createFileRoute('/contractor/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ContractorResetPassword,
})

function ContractorResetPassword() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      await authApi.resetPassword(token, next)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This link is invalid or expired. Request a new one.')
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
            <p className="mt-2 max-w-sm leading-relaxed text-white/80">Set a fresh password and get back on round.</p>
          </div>
          <p className="hidden font-mono text-[11px] tracking-wider text-white/60 md:block">RESET · MUNDUS FIELD</p>
        </div>
      </div>

      {/* form column */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">
          <button onClick={() => navigate({ to: '/contractor/sign-in' })} className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} /> Back to sign in
          </button>
          {!apiEnabled || !token ? (
            <div className="mt-4 rounded-2xl border border-hairline bg-paper p-6 text-center shadow-card">
              <h1 className="font-display text-3xl text-ink">Reset links come by email</h1>
              <p className="mt-2 leading-relaxed">Start from the forgot-password page and follow the link we send you.</p>
              <Button asChild className="mt-4 w-full">
                <Link to="/contractor/forgot-password">Request a link</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="mt-4 rounded-2xl border border-hairline bg-paper p-6 text-center shadow-card">
              <CheckCircle size={44} weight="fill" className="mx-auto text-[#1d6f42]" />
              <h1 className="mt-2 font-display text-3xl text-ink">Password updated</h1>
              <p className="mt-2 leading-relaxed">Sign in with your new password to start your round.</p>
              <Button asChild className="mt-4 w-full">
                <Link to="/contractor/sign-in">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-primary">Set a new password</p>
              <h1 className="mt-1 font-display text-4xl text-ink">Choose a password</h1>
              <form className="mt-6 space-y-4" onSubmit={submit}>
                <div>
                  <label htmlFor="rp-new" className="mb-1 block text-sm font-semibold text-ink">New password</label>
                  <PasswordInput id="rp-new" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError('') }} placeholder="At least 6 characters" />
                </div>
                <div>
                  <label htmlFor="rp-confirm" className="mb-1 block text-sm font-semibold text-ink">Confirm new password</label>
                  <PasswordInput id="rp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError('') }} placeholder="Repeat it" />
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
