import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Camera, CheckCircle } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Unlisted staff-only route — reached only from the sign-in screen.
export const Route = createFileRoute('/agency/request-access')({
  component: RequestAccess,
})

function RequestAccess() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) {
      setError('Enter your full name.')
      return
    }
    if (!email.includes('@')) {
      setError('Enter a valid work email.')
      return
    }
    setError('')
    setSent(true)
  }

  return (
    <div className="grid min-h-screen bg-canvas font-body text-ink-soft md:grid-cols-2">
      {/* dark panel */}
      <div className="grain relative overflow-hidden bg-primary-deep text-white">
        <div aria-hidden="true" className="dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_70%_70%_at_30%_30%,black,transparent)]" />
        <div className="relative flex min-h-full flex-col p-6 md:p-10">
          <p className="flex items-center gap-2 font-display text-xl tracking-wide"><Link to="/" aria-label="Mundus home" className="flex items-center gap-2"><LogoMark variant="mono" className="h-7 w-7" />MUNDUS</Link></p>
          <div className="my-auto py-8">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">What access unlocks</p>
            <p className="mt-2 max-w-sm leading-relaxed text-white/80 md:hidden">
              Verified before/after pairs, geofence flags, and the live overdue ranking.
            </p>
            <div className="mt-4 hidden rounded-2xl bg-white/10 p-5 backdrop-blur md:block">
              <div className="grid grid-cols-2 gap-3">
                {['BEFORE · 10:42', 'AFTER · 12:15'].map((t) => (
                  <div key={t} className="rounded-xl bg-white/10 p-4 text-center">
                    <Camera size={22} className="mx-auto text-white/80" />
                    <p className="mt-2 font-mono text-xs text-white">{t}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1d6f42] px-3 py-1.5 text-xs font-bold text-white">
                <CheckCircle size={14} weight="fill" /> Pair verified · counter reset to 0
              </p>
            </div>
          </div>
          <p className="hidden font-mono text-[11px] tracking-wider text-white/60 md:block">BEFORE → AFTER · MUNDUS V1</p>
        </div>
      </div>

      {/* form column */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">
          <Link to="/" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} /> Back home
          </Link>
          {sent ? (
            <div className="mt-4 rounded-2xl border border-hairline bg-paper p-6 text-center shadow-card">
              <CheckCircle size={44} weight="fill" className="mx-auto text-[#1d6f42]" />
              <h1 className="mt-2 font-display text-3xl text-ink">Request received</h1>
              <p className="mt-2 leading-relaxed">The agency admin reviews access requests weekly. Watch <span className="font-mono text-sm">{email}</span> for approval.</p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link to="/agency/sign-in">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-4 font-display text-sm uppercase tracking-[0.2em] text-primary">For agency staff</p>
              <h1 className="mt-1 font-display text-4xl text-ink md:text-[48px]">Request access</h1>
              <p className="mt-2 leading-relaxed">Accounts are issued by the agency admin — tell us who you are and where you work.</p>
              <form className="mt-6 space-y-4" onSubmit={submit}>
                <div>
                  <label htmlFor="req-name" className="mb-1 block text-sm font-semibold text-ink">Full name</label>
                  <Input id="req-name" placeholder="Adaeze Ekong" value={name} onChange={(e) => { setName(e.target.value); setError('') }} />
                </div>
                <div>
                  <label htmlFor="req-email" className="mb-1 block text-sm font-semibold text-ink">Work email</label>
                  <Input id="req-email" type="email" placeholder="adaeze@aksepwma.gov" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} />
                </div>
                {error ? <p role="alert" className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
                <Button type="submit" className="w-full">Request access</Button>
              </form>
              <p className="mt-4 text-center text-sm">
                Already approved? <Link to="/agency/sign-in" className="font-semibold text-primary hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
