import { Badge } from '@/components/ui/badge'
import { Eyebrow, MAXW } from './shared'
import { cn } from '@/lib/utils'

export function Solution() {
  return (
    <section id="solution" className="scroll-mt-24 bg-paper py-14 md:py-20 lg:py-28">
      <div className={MAXW}>
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <Eyebrow>The solution</Eyebrow>
            <h2 className="mt-2 font-display text-4xl leading-tight text-ink md:text-[48px]">Proof of delivery,<br />for waste evacuation</h2>
          </div>
          <div className="space-y-4 leading-relaxed">
            <p>A lightweight verification platform, not a reporting app. The way a delivery app tracks a driver — every clearance travels the same four nodes, each handing a verifiable record to the next.</p>
            <p>A break at any node is flagged in the open. Nothing is silently dropped, nothing is taken on trust.</p>
          </div>
        </div>
        <div className={cn('mt-8 overflow-hidden rounded-2xl border border-hairline bg-paper shadow-card')}>
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
