import { createFileRoute, Link, Navigate, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Buildings, ListChecks, MagnifyingGlass, Megaphone, Recycle, SignOut, SquaresFour, X } from '@phosphor-icons/react'
import { GlobalSearch } from '@/components/global-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession } from '@/lib/session'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/agency')({
  component: AgencyShell,
})

// Unlisted: reachable by direct URL for agency staff only — never linked publicly.
const links = [
  { to: '/agency/dashboard' as const, label: 'Dashboard', icon: SquaresFour },
  { to: '/agency/contractors' as const, label: 'Contractors', icon: Buildings },
  { to: '/agency/reporters' as const, label: 'Reporters', icon: Megaphone },
  { to: '/agency/dump-points' as const, label: 'Manage Dump Points', mobileLabel: 'Dump points', icon: ListChecks },
]

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

function AgencyShell() {
  const { pathname } = useLocation()
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  const [mobileSearch, setMobileSearch] = useState(false)

  if (pathname === '/agency/sign-in') return <Outlet />

  if (!session) return <Navigate to="/agency/sign-in" />

  const logout = () => {
    signOut()
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen bg-canvas font-body text-ink-soft">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-hairline bg-primary text-white md:flex">
        <Link to="/" aria-label="Mundus home" className="flex h-16 items-center gap-2 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
            <Recycle size={20} weight="bold" />
          </span>
          <span className="font-display text-2xl tracking-wide">MUNDUS</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white',
                pathname.startsWith(l.to) && 'bg-white/15 text-white',
              )}
            >
              <l.icon size={20} /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/15 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 font-semibold text-white">
              {initials(session.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{session.name}</p>
              <p className="truncate text-xs text-white/70">{session.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            <SignOut size={18} /> Log out
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-hairline bg-paper/95 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4">
            <div className="hidden min-w-0 flex-1 md:block">
              <GlobalSearch compact />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setMobileSearch((v) => !v)}
                aria-label={mobileSearch ? 'Close search' : 'Open search'}
                aria-expanded={mobileSearch}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full text-ink hover:bg-cloud md:hidden"
              >
                {mobileSearch ? <X size={20} /> : <MagnifyingGlass size={20} />}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Open profile menu"
                    className="flex cursor-pointer items-center gap-2 rounded-xl p-1 hover:bg-cloud"
                  >
                    <span className="hidden text-right sm:block">
                      <span className="block text-[13px] font-semibold leading-tight text-ink">{session.name}</span>
                      <span className="block max-w-40 truncate text-[11px] text-ink-soft">{session.email}</span>
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                      {initials(session.name)}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <p className="truncate text-sm font-semibold text-ink">{session.name}</p>
                    <p className="truncate text-xs text-ink-soft">{session.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={logout}>
                    <SignOut size={18} /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {mobileSearch ? (
            <div className="px-4 pb-3 md:hidden">
              <GlobalSearch compact />
            </div>
          ) : null}
        </header>

        <main className="mx-auto max-w-[1100px] px-4 py-6 pb-24 md:py-8 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile floating tab bar */}
        <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-hairline bg-paper px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.16)] md:hidden">
          <div className="grid grid-cols-3 gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-ink-soft',
                  pathname.startsWith(l.to) && 'bg-cloud text-primary',
                )}
              >
                <l.icon size={20} /> {'mobileLabel' in l ? l.mobileLabel : l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
