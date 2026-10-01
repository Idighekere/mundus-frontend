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
    name: 'Registry', title: 'Every dump point, written down', line: 'Node 01 · one record for the whole operation',
    body: 'Name, coordinates, assigned contractor and supervisor. No parallel paper lists — every later step reads from this record.',
    figure: '5.0450°N 7.9620°E', caption: 'Nwaniba Road · CleanCity Services',
  },
  {
    name: 'Check-in', title: 'Camera only, on site', line: 'Node 02 · before + after, one visit',
    body: 'Supervisors check in with a live, GPS-tagged, timestamped photo — before and after clearance. No gallery, no backdating.',
    figure: 'BEFORE → AFTER', caption: 'Same site · same visit · paired',
  },
  {
    name: 'Validation', title: 'Checked server-side, 100 m', line: 'Node 03 · kept and flagged, never dropped',
    body: 'Geofence validation runs against the registry record. Outside the radius, the photo stays in the record with a location-mismatch flag for agency review.',
    figure: '240 m → FLAGGED', caption: 'Distance recorded · agency sees it',
  },
  {
    name: 'Ranking', title: 'Overdue computed at load', line: 'Node 04 · most overdue first',
    body: 'The dashboard ranks every site by days since last clearance and flags anything overdue automatically. A designated reporter can flag a full site early — an accelerant, never a requirement.',
    figure: 'NOW − LAST = 12D', caption: 'Nwaniba Road · critical',
  },
]

export const NAV_LINKS = [
  { href: '#how-it-works', id: 'how-it-works', label: 'How it works' },
  { href: '#evidence', id: 'evidence', label: 'Evidence' },
  { href: '#demo', id: 'demo', label: 'Demo' },
  { href: '#faq', id: 'faq', label: 'FAQ' },
]
