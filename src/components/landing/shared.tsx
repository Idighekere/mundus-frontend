import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const MAXW = 'mx-auto w-full max-w-[1400px] px-4 md:px-8 lg:px-12 xl:px-20'

export function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

export function Reveal({
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

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={cn(
      'font-display text-sm uppercase tracking-[0.2em]',
      light ? 'text-[#ffa034]' : 'text-primary',
    )}>
      {children}
    </p>
  )
}

export interface ChainStep {
  name: string
  title: string
  line: string
  body: string
  figure: string
  caption: string
}

export const CHAIN_STEPS: ChainStep[] = [
  {
    name: 'Check-in', title: 'Live photo, before and after', line: 'Step 01 · GPS-tagged, timestamped',
    body: 'Contractors check in at assigned dump points with a live, GPS-tagged, timestamped photo — before and after clearance.',
    figure: 'BEFORE → AFTER', caption: 'Same site · same visit · paired',
  },
  {
    name: 'Ranking', title: 'Overdue, ranked automatically', line: 'Step 02 · most overdue first',
    body: 'The dashboard tracks every site, ranked by days since last clearance, flagging anything overdue automatically.',
    figure: 'NOW − LAST = 12D', caption: 'Nwaniba Road · critical',
  },
  {
    name: 'Reporter', title: 'Flags it early', line: 'Step 03 · optional, never required',
    body: 'A local reporter can flag a site early — a shop owner or keke stage operator already stationed nearby — speeding up response without ever being required.',
    figure: 'SITE FULL → CREW PINGED', caption: 'Reporter · 3h ago · crew notified',
  },
]

export const NAV_LINKS = [
  { href: '#how-it-works', id: 'how-it-works', label: 'How it works' },
  { href: '#why-mundus', id: 'why-mundus', label: 'Why Mundus' },
  { href: '#solution', id: 'solution', label: 'Solution' },
  { href: '#demo', id: 'demo', label: 'Demo' },
  { href: '#faq', id: 'faq', label: 'FAQ' },
]
