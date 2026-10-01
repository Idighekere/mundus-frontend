import { Link } from '@tanstack/react-router'
import { Flag } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Eyebrow, MAXW, Reveal } from './shared'
import { cn } from '@/lib/utils'

export function Roles() {
  return (
    <section className="bg-paper py-14 md:py-20 lg:py-28">
      <div className={MAXW}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Who it's for</Eyebrow>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Made for three kinds of people</h2>
          <p className="mt-3 leading-relaxed">Each role sees only what it needs — nothing more to learn, nowhere to get lost.</p>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Reveal>
            <article className="flex h-full flex-col rounded-2xl border border-hairline bg-canvas p-6">
              <Eyebrow>Agency</Eyebrow>
              <h3 className="mt-1 font-display text-2xl text-ink">Reads the ranking</h3>
              <p className="mt-1 text-sm leading-relaxed">Overdue first, flags in the open, timelines per site.</p>
              <div className="mt-4 space-y-1.5 rounded-xl bg-paper p-3">
                {(
                  [
                    ['Nwaniba', '12d', true],
                    ['IBB Way', '11d', true],
                    ['Oran', '1d', false],
                  ] as [string, string, boolean][]
                ).map(([n, d, hot]) => (
                  <div key={n} className="flex items-center justify-between rounded-lg bg-canvas px-3 py-1.5 text-xs">
                    <span className="font-semibold text-ink">{n}</span>
                    <span className={cn('font-mono font-bold', hot ? 'text-[#be3b3b]' : 'text-ink')}>{d}</span>
                  </div>
                ))}
              </div>
              <Button asChild variant="secondary" className="mt-4 w-full"><Link to="/agency/dashboard">Open dashboard</Link></Button>
            </article>
          </Reveal>
          <Reveal delay={100}>
            <article className="flex h-full flex-col rounded-2xl border border-hairline bg-canvas p-6">
              <Eyebrow>Supervisor</Eyebrow>
              <h3 className="mt-1 font-display text-2xl text-ink">Proves it on site</h3>
              <p className="mt-1 text-sm leading-relaxed">In-app camera, GPS locked at capture, before → after.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <img src="/evidence/before.jpg" alt="Before clearance" className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
                <img src="/evidence/after.jpg" alt="After clearance" className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
              </div>
              <Button asChild variant="secondary" className="mt-4 w-full"><Link to="/contractor/sign-in">Field app</Link></Button>
            </article>
          </Reveal>
          <Reveal delay={200}>
            <article className="flex h-full flex-col rounded-2xl border border-hairline bg-canvas p-6">
              <Eyebrow>Reporter</Eyebrow>
              <h3 className="mt-1 font-display text-2xl text-ink">Flags it early</h3>
              <p className="mt-1 text-sm leading-relaxed">One tap, one site, one personal link. Photo attached.</p>
              <div className="mt-4 rounded-xl bg-paper p-3 text-center">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-action text-sm font-medium text-white">
                  <Flag size={16} weight="fill" /> This site is full
                </p>
                <p className="mt-2 font-mono text-[11px] text-ink-soft">12h limit · photo attached</p>
              </div>
              <Button asChild variant="secondary" className="mt-4 w-full"><Link to="/r/$token" params={{ token: 'demo-nwaniba-reporter-link' }}>Example report link</Link></Button>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export function Problem() {
  return (
    <section className="py-10 md:py-16 lg:py-24">
      <div className={MAXW}>
        <Reveal className="max-w-2xl">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Paid for, but never proven</h2>
        </Reveal>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-4 leading-relaxed">
              <p>
                The government pays for waste evacuation across Akwa Ibom's dump points. But there's
                no way to confirm the work actually happened — collection is "occasional," and failures
                surface only after they've caused damage.
              </p>
              <p>
                The standard is daily evacuation. The reality is undefined and unverified — caught by
                chance inspection, not by any system.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                ['68.8%', 'of 9,000+ residents report real waste disposal problems'],
                ['#1', 'complaint is distance to collection points'],
                ['62.5%', 'say they would pay for reliable service'],
              ].map(([stat, label]) => (
                <div key={label} className="rounded-2xl border border-hairline bg-paper p-5 shadow-card">
                  <p className="font-display text-4xl text-primary">{stat}</p>
                  <p className="mt-1 text-sm leading-relaxed">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-soft">
              2024 landfill study · AKSEPWMA public reports. The same failure pattern is documented
              in Lagos, Nasarawa and the FCT — structural, not local.
            </p>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <p className="mx-auto mt-10 max-w-2xl text-center font-display text-2xl leading-snug text-ink md:text-[28px]">
            Government pays for evacuation. Government has no way to confirm evacuation happens.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
