import { useEffect, useRef, useState } from 'react'
import { CHAIN_STEPS, Eyebrow, MAXW, Reveal } from './shared'

export function HowItWorks() {
  const [chainStep, setChainStep] = useState(0)
  const chainRef = useRef<HTMLDivElement>(null)

  // Scroll drives the active step: progression starts as the
  // section arrives (not after the header scrolls away) and walks 1 → 4.
  useEffect(() => {
    const onScroll = () => {
      const el = chainRef.current
      if (!el) return
      const total = el.offsetHeight - window.innerHeight
      if (total <= 0) return
      const anchor = window.innerHeight * 0.65 - el.getBoundingClientRect().top
      const p = Math.min(1, Math.max(0, anchor / total))
      setChainStep(Math.min(3, Math.floor(p * 4)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section id="how-it-works" className="scroll-mt-24 bg-paper py-14 md:py-20 lg:py-28">
      <div className={MAXW}>
        <div className="grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-2 font-display text-4xl leading-tight text-ink md:text-[48px]">One pipeline,<br />claim to proof</h2>
          </div>
          <div className="space-y-4 leading-relaxed">
            <p>Every clearance travels the same four nodes — registry, check-in, validation, ranking. Each node does one job, and each hands a verifiable record to the next.</p>
          </div>
        </div>

        <div ref={chainRef} className="mt-8 md:h-[220vh]">
        {/* mobile: steps stack over each other inside one card */}
        <div className="rounded-2xl bg-primary-deep shadow-modal md:hidden">
            {CHAIN_STEPS.map((st, i) => (
              <div
                key={st.name}
                className="sticky border-t border-white/10 bg-primary-deep px-6 py-5 first:rounded-t-2xl first:border-t-0 last:rounded-b-2xl last:min-h-[46vh]"
                style={{ top: `${84 + i * 14}px` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 font-display text-xl text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{st.name}</p>
                    <p className="text-xs text-[#ffa034]">{st.line}</p>
                  </div>
                </div>
                <p className="mt-3 font-display text-2xl leading-tight text-white">{st.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/80">{st.body}</p>
                <div className="mt-3 rounded-xl bg-white/10 p-4">
                  <p className="font-mono text-lg text-white">{st.figure}</p>
                  <p className="mt-1 text-xs text-white/70">{st.caption}</p>
                </div>
              </div>
            ))}
          </div>
          {/* desktop: expanding columns */}
          <div className="hidden overflow-hidden rounded-2xl bg-primary-deep text-white md:sticky md:top-[92px] md:block md:min-h-[480px]">
          <div className="flex min-h-[480px] flex-row items-stretch" role="tablist" aria-label="Pipeline steps">
            {CHAIN_STEPS.map((st, i) => {
              const active = chainStep === i
              const done = i < chainStep
              return (
                <button
                  key={st.name}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setChainStep(i)}
                  onMouseEnter={() => {
                    if (window.innerWidth >= 768) setChainStep(i)
                  }}
                  className="flex min-h-[44px] cursor-pointer flex-col border-white/10 px-4 py-3 text-left transition-[flex-grow,background-color] duration-500 max-md:border-t max-md:first:border-t-0 md:border-l md:first:border-l-0 md:px-6 md:py-8"
                  style={{
                    flexGrow: active ? 4 : 1,
                    flexBasis: 0,
                    backgroundColor: active ? 'rgba(255,255,255,0.10)' : done ? 'rgba(255,255,255,0.05)' : 'transparent',
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={
                        active
                          ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white font-display text-2xl text-white'
                          : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-display text-xl text-white/50'
                      }
                      style={{ borderColor: active ? undefined : 'rgba(255,255,255,0.3)' }}
                    >
                      {i + 1}
                    </span>
                    <span className={active ? 'text-sm font-semibold text-white' : 'text-sm text-white/50'}>{st.name}</span>
                  </span>
                  <span
                    className="grid transition-all duration-500"
                    style={{ gridTemplateRows: active ? '1fr' : '0fr', opacity: active ? 1 : 0 }}
                  >
                    <span className="overflow-hidden max-md:max-h-[44vh] max-md:overflow-y-auto">
                      <span className="mt-4 block font-display text-2xl leading-tight text-white md:text-[28px]">{st.title}</span>
                      <span className="mt-1 block text-sm font-medium text-[#ffa034]">{st.line}</span>
                      <span className="mt-2 block max-w-md text-sm leading-relaxed text-white/80">{st.body}</span>
                      <span className="mt-4 block rounded-xl bg-white/10 p-4">
                        <span className="block font-mono text-lg text-white">{st.figure}</span>
                        <span className="mt-1 block text-xs text-white/70">{st.caption}</span>
                      </span>
                    </span>
                  </span>
                  <span className={active ? 'mb-1 mt-5 h-1 w-10 rounded-full bg-[#ffa034]' : 'mb-1 mt-5 hidden h-1 w-6 rounded-full bg-white/20 md:block'} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
        <Reveal>
          <p className="mx-auto mt-8 max-w-2xl text-center leading-relaxed text-ink">
            No new infrastructure. No new staff. Just proof of what's already being paid for.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

const WHY_ITEMS: [string, string, string, string][] = [
  ['01', 'Invisible work, visible record', 'Turns invisible, occasional evacuation into a visible, dated record the agency can plan around.', 'dated record · not claims'],
  ['02', 'Protection for good contractors', 'Gives contractors evidence protecting them from unfair blame when a site they cleared fills again.', 'proof against unfair blame'],
  ['03', 'Data the agency has no other way to see', 'Clearance dates, overdue streaks, flag history — operational data the agency currently has no way to see.', 'seen nowhere else today'],
  ['04', 'Runs on its own schedule', "Works with zero citizen participation required — it doesn't ask residents to discover what they already know.", 'zero citizen input needed'],
]

export function WhyItMatters() {
  return (
    <section id="why-mundus" className="scroll-mt-24 py-14 md:py-20 lg:py-28">
      <div className={MAXW}>
        <Reveal className="max-w-2xl">
          <Eyebrow>Why it matters</Eyebrow>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Not another reporting app</h2>
          <p className="mt-3 leading-relaxed">Mundus treats waste evacuation as a service-verification problem, not a complaint box.</p>
        </Reveal>
        <ol className="mt-8 divide-y divide-hairline border-y border-hairline">
          {WHY_ITEMS.map(([n, title, body, proof], i) => (
            <Reveal key={n} delay={i * 80}>
              <li className="grid gap-2 py-6 md:grid-cols-12 md:items-baseline md:gap-6 md:py-8">
                <span className="font-display text-5xl text-primary/25 md:col-span-2 md:text-6xl">{n}</span>
                <div className="md:col-span-6">
                  <h3 className="font-display text-2xl text-ink md:text-[28px]">{title}</h3>
                  <p className="mt-1 max-w-lg leading-relaxed">{body}</p>
                </div>
                <p className="font-mono text-sm text-primary md:col-span-4 md:text-right">{proof}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
