import { useState } from 'react'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Eyebrow, MAXW, Reveal } from './shared'
import { cn } from '@/lib/utils'

const FAQS: [string, string][] = [
  [
    'How is this different from a reporting app?',
    'Mundus is a service-verification platform, not a complaint box. Proof of delivery — the way a delivery app tracks a driver. It treats waste evacuation as work to be proven, not complaints to be collected.',
  ],
  [
    'Does it require citizens to participate?',
    'No. The system runs on the contractor schedule — check-ins, geofence validation, overdue ranking. A designated local reporter can flag a full site early, but that is an accelerant, optional and never required.',
  ],
  [
    'What happens to a photo taken outside the geofence?',
    'It is kept and flagged "location mismatch" with the recorded distance. The agency sees the flag; nothing is silently dropped or auto-rejected.',
  ],
  [
    'Has "no pay without proof" been tried before?',
    'Yes — Edo State already runs a "no verified service, no pay" policy, enforced manually through resident complaints. Mundus makes that verification automatic, photo-evidenced, and immediate — not dependent on someone filing a complaint after the fact.',
  ],
  [
    'Who pays for this?',
    'AKSEPWMA and similar municipal agencies — B2G, inside the existing sanitation operations budget, not a new spending category. Mundus doesn\u2019t ask government to spend more. It shows them what they\u2019re already paying for.',
  ],
  [
    'Does Mundus hold money or pay crews?',
    'No. It verifies work so the agency can tie payroll to proof — the payment itself is policy, outside the software.',
  ],
]

export function Faq() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <section id="faq" className="scroll-mt-24 bg-paper py-14 md:py-20 lg:py-28">
      <div className={cn(MAXW, 'max-w-[900px]')}>
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Six questions, straight answers</h2>
        <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-canvas px-6">
          {FAQS.map(([q, a], i) => (
            <div key={q} className="py-2">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="flex min-h-[44px] w-full cursor-pointer items-center gap-4 py-3 text-left"
              >
                <span className="font-mono text-sm text-ink-soft">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1 font-semibold text-ink">{q}</span>
                <span className={cn('text-xl text-ink-soft transition-transform', openFaq === i && 'rotate-45')}>+</span>
              </button>
              {openFaq === i ? <p className="pb-4 pl-10 pr-4 leading-relaxed">{a}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BuiltForUyo() {
  return (
    <section className="py-14 md:py-20 lg:py-28">
      <div className={MAXW}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Built for Uyo</Eyebrow>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Our city, our record</h2>
          <p className="mt-3 leading-relaxed">
            Every dump point, every contractor, every check-in in this demo reflects real locations
            across the city — Nwaniba, IBB Way — built by students who live here, for the agency
            that serves it.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="grain relative overflow-hidden bg-primary-deep">
      <div aria-hidden="true" className="dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full border border-white/15" />
      <div className={cn(MAXW, 'relative grid gap-8 py-16 md:grid-cols-2 md:py-24')}>
        <div>
          <Eyebrow light>See for yourself</Eyebrow>
          <h2 className="mt-3 font-display text-4xl leading-tight text-white md:text-[48px]">
            Mundus doesn't ask government to spend more. It shows them what they're already paying for.
          </h2>
          <div className="mt-8">
            <Button asChild className="bg-white text-primary hover:bg-cloud">
              <a href="#demo">Try the live demo <ArrowRight size={18} /></a>
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-modal md:p-8">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Live demo checklist</p>
          <ul className="mt-4 space-y-2.5">
            {[
              '6 real site names, seeded and ranked',
              '2 sites left overdue — watch them flag',
              'One full check-in cycle, walked through live — not pre-seeded',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[15px] font-medium text-ink">
                <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-[#1d6f42]" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
