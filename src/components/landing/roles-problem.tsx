import { Eyebrow, MAXW, Reveal } from './shared'

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
