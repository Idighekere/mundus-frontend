import { Badge } from '@/components/ui/badge'
import { Eyebrow, MAXW, Reveal } from './shared'
import { cn } from '@/lib/utils'

const SOLUTION_ROWS: [string, string, string][] = [
  ['01', 'Live check-in, before and after', 'Contractors check in at assigned sites with a live, GPS-tagged, timestamped photo.'],
  ['02', 'Overdue, ranked automatically', 'The dashboard ranks every site by days-since-last-clearance, flagging overdue ones.'],
  ['03', 'Early flags, never required', 'A designated local reporter can flag a full site early — optional, never required.'],
]

export function Solution() {
  return (
    <section id="solution" className="scroll-mt-24 bg-paper py-14 md:py-20 lg:py-28">
      <div className={MAXW}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>The solution</Eyebrow>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">A lightweight verification platform, not a reporting app</h2>
        </Reveal>
        <ol className="mx-auto mt-8 max-w-3xl divide-y divide-hairline border-y border-hairline">
          {SOLUTION_ROWS.map(([n, title, body], i) => (
            <Reveal key={n} delay={i * 80}>
              <li className="grid gap-1 py-5 sm:grid-cols-12 sm:items-baseline sm:gap-4">
                <span className="font-mono text-sm text-primary sm:col-span-1">{n}</span>
                <p className="leading-relaxed sm:col-span-11">
                  <span className="font-semibold text-ink">{title} — </span>{body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
        <div className={cn('mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-hairline bg-paper shadow-card')}>
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
