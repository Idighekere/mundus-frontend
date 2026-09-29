import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowRight, CheckCircle, Flag,
  List, X,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogoMark } from '@/components/logo'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

/* ---------- scroll + reveal helpers ---------- */

function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

function Reveal({
  dir = 'up', delay = 0, className, children,
}: {
  dir?: 'left' | 'right' | 'up'
  delay?: number
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const from =
    dir === 'left' ? 'translateX(-48px) rotate(-1.5deg)'
    : dir === 'right' ? 'translateX(48px) rotate(1.5deg)'
    : 'translateY(28px)'
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : from,
        transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const MAXW = 'mx-auto w-full max-w-[1400px] px-4 md:px-8 lg:px-12 xl:px-20'

const CHAIN_STEPS = [
  {
    name: 'Registry', title: 'Every dump point, written down', line: 'Node 01 · one record for the whole operation',
    body: 'Name, coordinates, assigned contractor and supervisor. No parallel paper lists — every later step reads from this record.',
    figure: '5.0450°N 7.9620°E', caption: 'Nwaniba Road · CleanCity Services',
  },
  {
    name: 'Capture', title: 'Camera only, on site', line: 'Node 02 · before + after, one visit',
    body: 'In-app camera only — no gallery. GPS and timestamp auto-lock at the exact moment of capture.',
    figure: 'BEFORE → AFTER', caption: 'Same site · same visit · paired',
  },
  {
    name: 'Geofence', title: 'Checked server-side, 100 m', line: 'Node 03 · kept and flagged, never dropped',
    body: 'Outside the radius, the photo stays in the record with a location-mismatch flag for agency review.',
    figure: '240 m → FLAGGED', caption: 'Distance recorded · agency sees it',
  },
  {
    name: 'Ranking', title: 'Overdue computed at load', line: 'Node 04 · most overdue first',
    body: 'Now minus last clearance, every time the dashboard loads. Anything past 10 days is red-flagged.',
    figure: 'NOW − LAST = 12D', caption: 'Nwaniba Road · critical',
  },
]

/* ---------- page ---------- */

function LandingPage() {
  const scrolled = useScrolled()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [chainStep, setChainStep] = useState(0)
  const [activeSection, setActiveSection] = useState('how-it-works')
  const chainRef = useRef<HTMLDivElement>(null)

  // Scroll-spy for the pill nav.
  useEffect(() => {
    const ids = ['how-it-works', 'evidence', 'demo', 'faq']
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id)
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

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

  const navLinks = [
    { href: '#how-it-works', id: 'how-it-works', label: 'How it works' },
    { href: '#evidence', id: 'evidence', label: 'Evidence' },
    { href: '#demo', id: 'demo', label: 'Demo' },
    { href: '#faq', id: 'faq', label: 'FAQ' },
  ]

  return (
    <div className="bg-canvas font-body text-ink-soft">
      {/* ---------- floating pill nav ---------- */}
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
        <nav
          aria-label="Primary"
          className={cn(
            'mx-auto flex h-14 w-full max-w-[1100px] items-center gap-2 rounded-full px-4 transition-all duration-300',
            scrolled ? 'border border-hairline bg-paper/90 shadow-card backdrop-blur' : 'border border-transparent bg-transparent',
          )}
        >
          <a href="/" aria-label="Mundus home" className="flex items-center gap-2 font-display text-xl tracking-wide text-ink"><LogoMark className="h-8 w-8" />MUNDUS</a>
          <div className="ml-4 hidden items-center gap-1 md:flex">
            {navLinks.map((l) => {
              const active = activeSection === l.id
              return (
                <a
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'rounded-full px-3 py-2 text-sm text-ink-soft hover:bg-cloud hover:text-ink',
                    active && 'font-bold text-ink',
                  )}
                >
                  {l.label}
                </a>
              )
            })}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="secondary" className="hidden min-h-[40px] py-2 md:inline-flex">
              <Link to="/agency/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="hidden min-h-[40px] py-2 md:inline-flex">
              <Link to="/agency/request-access">Agency access</Link>
            </Button>
            <button
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full text-ink hover:bg-cloud md:hidden"
            >
              {menuOpen ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </nav>
        {menuOpen ? (
          <div className="mx-auto mt-2 w-full max-w-[1100px] rounded-2xl border border-hairline bg-paper p-2 shadow-modal md:hidden">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block min-h-[44px] rounded-xl px-4 py-3 text-base font-medium text-ink hover:bg-cloud"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-1 grid grid-cols-2 gap-2 border-t border-hairline p-2">
              <Button asChild variant="secondary"><Link to="/agency/sign-in">Sign in</Link></Button>
              <Button asChild><Link to="/agency/request-access">Agency access</Link></Button>
            </div>
          </div>
        ) : null}
      </header>

      <main id="top">
        {/* ---------- hero ---------- */}
        <section className="grain relative overflow-hidden">
          <div aria-hidden="true" className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
          <div aria-hidden="true" className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div aria-hidden="true" className="absolute left-1/2 top-24 hidden h-[560px] w-[560px] -translate-x-1/2 rounded-full border border-ink/10 lg:block" />
          <div aria-hidden="true" className="absolute left-1/2 top-40 hidden h-[400px] w-[400px] -translate-x-1/2 rounded-full border border-ink/10 lg:block" />

          <div className={cn(MAXW, 'relative px-4 pb-20 pt-32 text-center md:px-8 md:pb-28 md:pt-44 lg:px-12 lg:pb-36 lg:pt-56')}>
            <p className="anim-fade-up font-display text-sm uppercase tracking-[0.2em] text-primary">
              Waste evacuation, verified
            </p>
            <h1 className="anim-fade-up mx-auto mt-4 max-w-2xl font-display text-5xl leading-[1.05] text-ink md:text-[68px]" style={{ animationDelay: '90ms' }}>
              Every dump point, accounted for.
            </h1>
            <p className="anim-fade-up mx-auto mt-5 max-w-xl text-lg leading-relaxed" style={{ animationDelay: '180ms' }}>
              Before-and-after photo proof, GPS locked at capture, overdue ranked daily — the agency sees what was cleared, not what was claimed.
            </p>
            <div className="anim-fade-up mt-8 flex justify-center" style={{ animationDelay: '270ms' }}>
              <Button asChild>
                <a href="#evidence">See the evidence <ArrowRight size={18} /></a>
              </Button>
            </div>

            {/* hero visual: console mock with flanking status cards (Cable-style) */}
            <div className="anim-fade-up relative mx-auto mt-12 max-w-4xl" style={{ animationDelay: '360ms' }}>
              <div className="relative z-10 mx-auto max-w-md rounded-2xl border border-hairline bg-paper p-5 text-left shadow-modal">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">Uyo Urban · ranked now</p>
                <ul className="mt-3 space-y-2">
                  {(
                    [
                      ['Nwaniba Road', '12d', true],
                      ['IBB Way', '11d', true],
                      ['Itam Junction', '8d · flagged', true],
                      ['Akpan Andem', '4d', false],
                    ] as [string, string, boolean][]
                  ).map(([name, days, hot]) => (
                    <li key={name} className="flex items-center justify-between rounded-xl bg-canvas px-4 py-2.5">
                      <span className="text-sm font-semibold text-ink">{name}</span>
                      <span className={cn('font-mono text-xs font-bold', hot ? 'text-[#be3b3b]' : 'text-ink')}>{days}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
                <div className="anim-float absolute -left-2 top-6 w-56 rounded-2xl border border-hairline bg-paper p-4 text-left shadow-card" style={{ animationDuration: '7s' }}>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink"><CheckCircle size={16} weight="fill" className="text-[#1d6f42]" /> Nwaniba cleared</p>
                  <p className="mt-1 font-mono text-[11px] text-ink-soft">pair verified · 2d ago</p>
                </div>
                <div className="anim-float absolute -right-2 bottom-6 w-56 rounded-2xl border border-hairline bg-paper p-4 text-left shadow-card" style={{ animationDuration: '5.6s' }}>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink"><Flag size={16} weight="fill" className="text-[#c08014]" /> Itam flagged full</p>
                  <p className="mt-1 font-mono text-[11px] text-ink-soft">reporter · 3h ago · crew pinged</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-left sm:grid-cols-2 md:hidden">
                <div className="rounded-2xl border border-hairline bg-paper p-4 shadow-card">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink"><CheckCircle size={16} weight="fill" className="text-[#1d6f42]" /> Nwaniba cleared</p>
                  <p className="mt-1 font-mono text-[11px] text-ink-soft">pair verified · 2d ago</p>
                </div>
                <div className="rounded-2xl border border-hairline bg-paper p-4 shadow-card">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink"><Flag size={16} weight="fill" className="text-[#c08014]" /> Itam flagged full</p>
                  <p className="mt-1 font-mono text-[11px] text-ink-soft">reporter · 3h ago · crew pinged</p>
                </div>
              </div>
            </div>

            {/* ---------- roles ---------- */}
          </div>
        </section>

        {/* ---------- infrastructure band ---------- */}
        <section className="border-y border-hairline bg-canvas py-10 md:py-14">
          <div className={cn(MAXW, 'text-center')}>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
                What runs Mundus
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed">
                Hosted on Pxxl. Every field action and failure traced with WatchUp —
                the same verification discipline we ask of contractors.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <div className="mt-6 flex items-center justify-center gap-8">
                <a href="https://pxxl.app" target="_blank" rel="noreferrer noopener" aria-label="Pxxl" className="rounded-full bg-ink px-4 py-2 transition-opacity hover:opacity-90">
                  <img src="/logos/pxxl-app.avif" alt="Pxxl" className="h-6 w-auto" loading="lazy" />
                </a>
                <span aria-hidden="true" className="h-6 w-px bg-hairline" />
                <a href="https://watchup.site" target="_blank" rel="noreferrer noopener" aria-label="WatchUp">
                  <img src="/logos/watchup_logo.webp" alt="WatchUp" className="h-5 w-auto opacity-80 transition-opacity hover:opacity-100" loading="lazy" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- roles: Guild-style, one card per role ---------- */}
        <section className="bg-paper py-14 md:py-20 lg:py-28">
          <div className={MAXW}>
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Who it's for</p>
              <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Made for three kinds of people</h2>
              <p className="mt-3 leading-relaxed">Each role sees only what it needs — nothing more to learn, nowhere to get lost.</p>
            </Reveal>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <Reveal>
                <article className="flex h-full flex-col rounded-2xl border border-hairline bg-canvas p-6">
                  <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Agency</p>
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
                  <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Supervisor</p>
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
                  <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Reporter</p>
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

        {/* ---------- problem ledger ---------- */}
        <section className="py-10 md:py-16 lg:py-24">
          <div className={MAXW}>
            <Reveal className="max-w-2xl">
              <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Why this exists</p>
              <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Three ways clearance goes unproven</h2>
            </Reveal>
            <ol className="mt-8 divide-y divide-hairline border-y border-hairline">
              {[
                ['01', 'Crews go out. Nobody writes it down.', 'Paper trip sheets get lost, and the agency plans the next week blind.', 'IBB Way · 11 days unserved'],
                ['02', 'A photo proves nothing without place and time.', 'Gallery uploads can come from anywhere, on any day.', 'No trip record found'],
                ['03', 'The same photo clears two streets.', 'Reused pictures pass when nobody compares file hashes.', 'Same photo submitted twice'],
              ].map(([n, title, body, proof], i) => (
                <Reveal key={n} delay={i * 80}>
                  <li className="grid gap-2 py-6 md:grid-cols-12 md:items-baseline md:gap-6 md:py-8">
                    <span className="font-display text-5xl text-primary/25 md:col-span-2 md:text-6xl">{n}</span>
                    <div className="md:col-span-6">
                      <h3 className="font-display text-2xl text-ink md:text-[28px]">{title}</h3>
                      <p className="mt-1 max-w-lg leading-relaxed">{body}</p>
                    </div>
                    <p className="font-mono text-sm text-[#be3b3b] md:col-span-4 md:text-right">{proof}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- verification chain : opl-style stepper ---------- */}
        <section id="how-it-works" className="scroll-mt-24 bg-paper py-14 md:py-20 lg:py-28">
          <div className={MAXW}>
            <div className="grid gap-6 md:grid-cols-2 md:items-end">
              <div>
                <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">How it works</p>
                <h2 className="mt-2 font-display text-4xl leading-tight text-ink md:text-[48px]">One pipeline,<br />claim to proof</h2>
              </div>
              <div className="space-y-4 leading-relaxed">
                <p>Every clearance travels the same four nodes — registry, capture, geofence, ranking. Each node does one job, and each hands a verifiable record to the next.</p>
                <p>A break at any node is flagged in the open. Nothing is silently dropped, nothing is taken on trust.</p>
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
          </div>
        </section>

{/* ---------- evidence ---------- */}
        <section id="evidence" className="scroll-mt-24 py-14 md:py-20 lg:py-28">
          <div className={MAXW}>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Evidence</p>
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

        {/* ---------- demo access ---------- */}
        <section id="demo" className="scroll-mt-24 py-14 md:py-20 lg:py-28">
          <div className={cn(MAXW, 'grid gap-8 lg:grid-cols-2')}>
            <div>
              <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Walk the demo</p>
              <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Every role, one tap away</h2>
              <p className="mt-3 max-w-md leading-relaxed">Seeded demo data throughout. Start as the agency, check in as a supervisor, or report from an approved link.</p>
            </div>
            <div className="space-y-3">
              {[
                { role: 'Agency portal', body: 'Overdue ranking, timelines, contractors, reporters.', to: '/agency/dashboard' as const, params: undefined },
                { role: 'Field app', body: 'Supervisor sign-in and before/after check-in.', to: '/contractor/sign-in' as const, params: undefined },
                { role: 'Reporter link', body: 'Single-tap “site full” from an approved link.', to: '/r/$token' as const, params: { token: 'demo-nwaniba-reporter-link' } },
              ].map((r) => (
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

        {/* ---------- faq ---------- */}
        <section id="faq" className="scroll-mt-24 bg-paper py-14 md:py-20 lg:py-28">
          <div className={cn(MAXW, 'max-w-[900px]')}>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">FAQ</p>
            <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">Six questions, straight answers</h2>
            <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-canvas px-6">
              {[
                ['What happens to a photo taken outside the geofence?', 'It is kept and flagged "location mismatch" with the recorded distance. The agency sees the flag; nothing is silently dropped or auto-rejected.'],
                ['Who can submit evidence?', 'Assigned supervisors submit before/after pairs. Designated reporters flag a site as full. Nobody else writes to the record.'],
                ['How often can a reporter flag a site?', 'Once per 12 hours per site. Repeat taps inside the window are refused with a countdown.'],
                ['How is photo reuse detected?', 'Every upload is SHA-256 hashed and compared against all previous hashes. An exact match is flagged automatically.'],
                ['Does Mundus hold money or pay crews?', 'No. It verifies work so the agency can tie payroll to proof — the payment itself is policy, outside the software.'],
                ['Do supervisors need a special phone?', 'Any smartphone with a camera and GPS. The agency dashboard runs in any modern browser.'],
              ].map(([q, a], i) => (
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

        {/* ---------- final cta ---------- */}
        <section className="grain relative overflow-hidden bg-primary-deep">
          <div aria-hidden="true" className="dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />
          <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full border border-white/15" />
          <div className={cn(MAXW, 'relative grid gap-8 py-16 md:grid-cols-2 md:py-24')}>
            <div>
              <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">See for yourself</p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-white md:text-[48px]">Every claim, checked.</h2>
              <div className="mt-8">
                <Button asChild className="bg-white text-primary hover:bg-cloud">
                  <Link to="/agency/request-access">Request agency access <ArrowRight size={18} /></Link>
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

        {/* ---------- footer ---------- */}
        <footer className="border-t border-hairline bg-paper">
          <div className={cn(MAXW, 'flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between')}>
            <p className="flex items-center gap-2 font-display text-xl tracking-wide text-ink"><a href="/" aria-label="Mundus home" className="flex items-center gap-2"><LogoMark className="h-7 w-7" />MUNDUS</a></p>
            <nav className="flex flex-wrap gap-1 text-sm" aria-label="Footer">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="rounded-md px-3 py-2 font-medium text-ink-soft hover:text-ink">{l.label}</a>
              ))}
              <Link to="/agency/sign-in" className="rounded-md px-3 py-2 font-medium text-ink-soft hover:text-ink">Staff sign in</Link>
            </nav>
            <p className="text-xs text-ink-soft">Seeded demo data · Pilot build — no live government integration.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
