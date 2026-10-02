import { Link } from '@tanstack/react-router'
import { ArrowRight } from '@phosphor-icons/react'
import { Eyebrow, MAXW } from './shared'
import { cn } from '@/lib/utils'

const DEMO_ROLES = [
  { role: 'Agency portal', body: 'Overdue ranking, timelines, contractors, reporters.', to: '/agency/dashboard' as const, params: undefined },
  { role: 'Field app', body: 'Contractor sign-in and before/after check-in.', to: '/contractor/sign-in' as const, params: undefined },
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
