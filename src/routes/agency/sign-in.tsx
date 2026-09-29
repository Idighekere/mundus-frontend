import { createFileRoute, Link, Navigate, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Bell, CheckCircle } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSession } from '@/lib/session'
import { apiEnabled } from '@/lib/api'

// Unlisted staff-only route — never linked from public pages except the footer.
export const Route = createFileRoute('/agency/sign-in')({
  component: AgencySignIn,
})

function AgencySignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { session, signIn } = useSession()
  const navigate = useNavigate()

  if (session) return <Navigate to="/agency/dashboard" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Enter your agency email to continue.')
      return
    }
    if (!apiEnabled && password.length < 4) {
      setError('Password needs at least 4 characters.')
      return
    }
    if (apiEnabled && !password) {
      setError('Enter your password to continue.')
      return
    }
    setError('')
    try {
      await signIn(email, password)
      navigate({ to: '/agency/dashboard', replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Try again.')
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
            <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">Today's clearance</p>
            <p className="mt-2 max-w-sm leading-relaxed text-white/80 md:hidden">
              Sign in to see today's overdue ranking, site timelines, and reporter flags.
            </p>
            <div className="mt-4 hidden rounded-2xl bg-white/10 p-5 backdrop-blur md:block">
              <div className="space-y-2">
                {[
                  { n: 'Nwaniba Road', d: 'cleared 2d ago', ok: true },
                  { n: 'IBB Way', d: '11d overdue', ok: false },
                  { n: 'Itam Junction', d: '8d · flagged', ok: false },
                ].map((s) => (
                  <div key={s.n} className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                    <span className="font-semibold text-white">{s.n}</span>
                    <span className="font-mono text-xs text-white/80">{s.d}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#ffa034] px-3 py-1.5 text-xs font-bold text-primary-deep">
                <Bell size={14} weight="fill" /> Itam Junction flagged full
              </p>
            </div>
          </div>
          <p className="hidden font-mono text-[11px] tracking-wider text-white/60 md:block">CLEARED 2D AGO · MUNDUS V1</p>
        </div>
      </div>

      {/* form column */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">
          <Link to="/" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} /> Back home
          </Link>
          <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-primary">Agency access only</p>
          <h1 className="mt-1 font-display text-4xl text-ink md:text-[48px]">Agency sign in</h1>
          <p className="mt-2 leading-relaxed">Restricted to agency staff. Supervisors and reporters use the field app.</p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink">Work email</label>
              <Input id="email" type="email" autoComplete="username" placeholder="adaeze@aksepwma.gov" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ink">Password</label>
              <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} />
            </div>
            {error ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
            <Button type="submit" className="w-full">Sign in <CheckCircle size={18} /></Button>
          </form>
          <p className="mt-4 text-center text-sm">
            New to the agency? <Link to="/agency/request-access" className="font-semibold text-primary hover:underline">Request access</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
