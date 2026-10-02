import { createFileRoute, Link, Navigate, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Camera, MapPin, CheckCircle } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input, PasswordInput } from '@/components/ui/input'
import { useContractorSession } from '@/lib/contractor-session'
import { apiEnabled } from '@/lib/api'
import { useContractorDirectory, verifyContractor } from '@/mocks/contractor-store'

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

  if (session) return <Navigate to="/contractor/sites" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError(apiEnabled ? 'Enter your email and password to continue.' : 'Enter any email and password to continue the demo.')
      return
    }
    if (apiEnabled) {
      setError('')
      try {
        await signInLive(email, password)
        navigate({ to: '/contractor/sites', replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign in failed. Try again.')
      }
      return
    }
    // Demo mode: registered credentials sign in as that contractor,
    // anything else signs in as the first contractor.
    const entry = verifyContractor(email, password) ?? directory[0]
    if (!entry) {
      setError('No contractors exist yet — ask the agency to register one.')
      return
    }
    setError('')
    signIn({ name: entry.name, contractorId: entry.id, contractorName: entry.name, email: entry.email })
    navigate({ to: '/contractor/sites', replace: true })
  }

  return (
    <div className="grid min-h-screen bg-canvas font-body text-ink-soft md:grid-cols-2">
      {/* dark panel */}
      <div className="grain relative overflow-hidden bg-primary-deep text-white">
        <div aria-hidden="true" className="dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_70%_70%_at_30%_30%,black,transparent)]" />
        <div className="relative flex min-h-full flex-col p-6 md:p-10">
          <p className="flex items-center gap-2 font-display text-xl tracking-wide"><Link to="/" aria-label="Mundus home" className="flex items-center gap-2"><LogoMark variant="mono" className="h-7 w-7" />MUNDUS</Link></p>
          <div className="my-auto py-8">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">Today's round</p>
            <p className="mt-2 max-w-sm leading-relaxed text-white/80 md:hidden">
              Before and after photos, GPS locked at capture — proof for every site on your round.
            </p>
            <div className="mt-4 hidden rounded-2xl bg-white/10 p-5 backdrop-blur md:block">
              <div className="space-y-2">
                {[
                  { icon: <Camera size={20} className="text-white/80" />, t: 'Before photo', d: 'Snap the pile on arrival' },
                  { icon: <MapPin size={20} className="text-white/80" />, t: 'Clear the site', d: 'Evacuate and sweep' },
                  { icon: <CheckCircle size={20} className="text-white/80" />, t: 'After photo', d: 'Proof — counter resets to 0d' },
                ].map((s) => (
                  <div key={s.t} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                    {s.icon}
                    <span>
                      <span className="block font-semibold text-white">{s.t}</span>
                      <span className="block text-xs text-white/70">{s.d}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1d6f42] px-3 py-1.5 text-xs font-bold text-white">
                <CheckCircle size={14} weight="fill" /> In-app camera only — no gallery
              </p>
            </div>
          </div>
          <p className="hidden font-mono text-[11px] tracking-wider text-white/60 md:block">BEFORE → AFTER · MUNDUS FIELD</p>
        </div>
      </div>

      {/* form column */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">
          <Link to="/" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} /> Back home
          </Link>
          <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-primary">Contractor sign in</p>
          <h1 className="mt-1 font-display text-4xl text-ink md:text-[48px]">Start your round</h1>
          <p className="mt-2 leading-relaxed">Sign in with the email and password the agency registered for you. You will only see your own contractor's sites.</p>
          {!apiEnabled ? (
            <p className="mt-1 text-xs text-ink-soft">Demo mode: any email + password works.</p>
          ) : null}
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="contractor-email" className="mb-1 block text-sm font-semibold text-ink">Email</label>
              <Input
                id="contractor-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor="contractor-password" className="text-sm font-semibold text-ink">Password</label>
                <Link to="/contractor/forgot-password" className="min-h-[44px] py-2 text-sm font-semibold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="contractor-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
              />
            </div>
            {error ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
            <Button type="submit" className="w-full">Start shift <ArrowRight size={18} /></Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Trouble signing in? Contact your agency admin.
          </p>
        </div>
      </div>
    </div>
  )
}
