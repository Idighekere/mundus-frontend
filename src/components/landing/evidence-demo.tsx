import { Link } from '@tanstack/react-router'
import { ArrowRight } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Eyebrow, MAXW } from './shared'
import { cn } from '@/lib/utils'

export function Evidence() {
  return (
    <section id="evidence" className="scroll-mt-24 bg-paper py-14 md:py-20 lg:py-28">
      <div className={MAXW}>
        <Eyebrow>Evidence</Eyebrow>
        <h2 className="mt-2 max-w-2xl font-display text-4xl text-ink md:text-[48px]">What the agency actually sees</h2>
        <div className="mt-8 overflow-hidden rounded-2xl border border-hairline bg-paper shadow-card">
          <div className="grid sm:grid-cols-2">
            <figure className="relative">
              <img src="/evidence/before.jpg" alt="Overflowing roadside dump before evacuation" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <figcaption className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 font-mono text-[11px] font-bold text-white">BEFORE · 10:42</figcaption>
            </figure>
            <figure className="relative">
              <img src="/evidence/after.jpg" alt="Same roadside point cleared and swept" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <figcaption className="absolute left-3 top-3 rounded-full bg-[#1d6f42] px-3 py-1 font-mono text-[11px] font-bold text-white">AFTER · 12:15</figcaption>
            </figure>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-4 md:p-5">
            <Badge variant="on-schedule">Within 100 m · hash unseen · → 0d</Badge>
            <span className="font-mono text-xs text-[#be3b3b]">240 m → flagged</span>
            <span className="font-mono text-xs text-[#be3b3b]">SHA-256 match → flagged</span>
          </div>
          <p className="border-t border-hairline px-4 py-2 text-[11px] text-ink-soft md:px-5">
            Same Uyo roadside bin, before and after evacuation · concept pair
          </p>
        </div>
      </div>
    </section>
  )
}

const DEMO_ROLES = [
  { role: 'Agency portal', body: 'Overdue ranking, timelines, contractors, reporters.', to: '/agency/dashboard' as const, params: undefined },
  { role: 'Field app', body: 'Supervisor sign-in and before/after check-in.', to: '/contractor/sign-in' as const, params: undefined },
  { role: 'Reporter link', body: 'Single-tap “site full” from an approved link.', to: '/r/$token' as const, params: { token: 'demo-nwaniba-reporter-link' } },
]

export function Demo() {
  return (
    <section id="demo" className="scroll-mt-24 py-14 md:py-20 lg:py-28">
      <div className={cn(MAXW, 'grid gap-8 lg:grid-cols-2')}>
        <div>
          <Eyebrow>Walk the demo</Eyebrow>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Every role, one tap away</h2>
          <p className="mt-3 max-w-md leading-relaxed">Real dump points. Real check-in flow. Real-time dashboard. Seeded demo data throughout.</p>
        </div>
        <div className="space-y-3">
          {DEMO_ROLES.map((r) => (
            <Link
              key={r.role}
              to={r.to}
              params={r.params}
              className="flex min-h-[44px] items-center justify-between gap-4 rounded-2xl border border-hairline bg-paper px-5 py-4 shadow-card hover:border-primary"
            >
              <span>
                <span className="block font-semibold text-ink">{r.role}</span>
                <span className="block text-sm">{r.body}</span>
              </span>
              <ArrowRight size={20} className="shrink-0 text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
