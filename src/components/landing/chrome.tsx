import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { List, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo'
import { NAV_LINKS, useScrolled } from './shared'
import { cn } from '@/lib/utils'

export function SiteHeader({ activeSection }: { activeSection: string }) {
  const scrolled = useScrolled()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
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
          {NAV_LINKS.map((l) => {
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
            <Link to="/agency/sign-in">Agency sign in</Link>
          </Button>
          <Button asChild className="hidden min-h-[40px] py-2 md:inline-flex">
            <a href="#demo">Live demo</a>
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
          {NAV_LINKS.map((l) => (
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
            <Button asChild variant="secondary"><Link to="/agency/sign-in">Agency sign in</Link></Button>
            <Button asChild><a href="#demo" onClick={() => setMenuOpen(false)}>Live demo</a></Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-paper">
      <div className={cn('mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8 lg:px-12 xl:px-20')}>
        <p className="flex items-center gap-2 font-display text-xl tracking-wide text-ink"><a href="/" aria-label="Mundus home" className="flex items-center gap-2"><LogoMark className="h-7 w-7" />MUNDUS</a></p>
        <nav className="flex flex-wrap gap-1 text-sm" aria-label="Footer">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 font-medium text-ink-soft hover:text-ink">{l.label}</a>
          ))}
          <Link to="/agency/sign-in" className="rounded-md px-3 py-2 font-medium text-ink-soft hover:text-ink">Staff sign in</Link>
        </nav>
        <p className="text-xs text-ink-soft">Seeded demo data · Pilot build — no live government integration.</p>
      </div>
    </footer>
  )
}
