import { createFileRoute, Link, Navigate, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { ClockCounterClockwise, MapPin, SignOut, User } from '@phosphor-icons/react'
import { LogoMark } from '@/components/logo'
import { useContractorSession } from '@/lib/contractor-session'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/contractor')({
  component: ContractorShell,
})

const tabs = [
  { to: '/contractor/sites' as const, label: 'Sites', icon: MapPin },
  { to: '/contractor/history' as const, label: 'History', icon: ClockCounterClockwise },
  { to: '/contractor/account' as const, label: 'Account', icon: User },
]

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

function ContractorShell() {
  const { pathname } = useLocation()
  const { session, signOut } = useContractorSession()
  const navigate = useNavigate()

  if (
    pathname === '/contractor/sign-in' ||
    pathname === '/contractor/forgot-password' ||
    pathname === '/contractor/reset-password'
  )
    return <Outlet />
  if (!session) return <Navigate to="/contractor/sign-in" replace />

  const logout = () => {
    signOut()
    navigate({ to: '/' })
  }

  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open profile menu"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
        >
          {initials(session.supervisor)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="truncate text-sm font-semibold text-ink">{session.supervisor}</p>
          <p className="truncate text-xs text-ink-soft">{session.contractorName}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <SignOut size={18} /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="min-h-screen bg-canvas font-body text-ink-soft">
      {/* Mobile header — dark field chrome */}
      <header className="sticky top-0 z-30 bg-primary-deep text-white md:hidden">
        <div className="flex h-20 items-center gap-2 px-4">
          <Link to="/" aria-label="Mundus home" className="flex items-center gap-2">
            <LogoMark variant="mono" className="h-8 w-8" />
            <span className="font-display text-xl tracking-wide">MUNDUS</span>
          </Link>
          <div className="ml-auto">{profileMenu}</div>
        </div>
      </header>

      {/* Desktop header — white with inline links, no sidebar */}
      <header className="sticky top-0 z-30 hidden border-b border-hairline bg-paper/95 backdrop-blur md:block">
        <div className="mx-auto flex h-20 w-full max-w-[1100px] items-center gap-2 px-4">
          <Link to="/" aria-label="Mundus home" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-xl tracking-wide text-ink">MUNDUS</span>
          </Link>
          <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">Field</span>
          <nav className="ml-4 flex items-center gap-1" aria-label="Field">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                aria-current={pathname.startsWith(t.to) ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[36px] items-center px-3 pb-1.5 pt-2 text-sm font-medium text-ink-soft hover:text-ink',
                  pathname.startsWith(t.to) && 'font-semibold text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary',
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-right">
              <span className="block text-[13px] font-semibold leading-tight text-ink">{session.supervisor}</span>
              <span className="block max-w-44 truncate text-[11px] text-ink-soft">{session.contractorName}</span>
            </span>
            {profileMenu}
          </div>
        </div>
      </header>

      <div>
        <main className="mx-auto w-full max-w-[720px] px-4 py-6 pb-28 md:pb-10">
          <Outlet />
        </main>

        {/* Mobile bottom tabs only */}
        <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-hairline bg-paper px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px] md:hidden">
          <div className="grid grid-cols-3 gap-1">
            {tabs.map((t) => {
              const active = pathname.startsWith(t.to)
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] text-ink-soft',
                    active ? 'font-bold text-primary' : 'font-medium',
                  )}
                >
                  <t.icon size={22} weight={active ? 'fill' : 'regular'} /> {t.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
