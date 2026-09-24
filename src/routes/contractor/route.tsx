import { createFileRoute, Link, Navigate, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { ClockCounterClockwise, MapPin, Recycle, SignOut } from '@phosphor-icons/react'
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
]

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

function ContractorShell() {
  const { pathname } = useLocation()
  const { session, signOut } = useContractorSession()
  const navigate = useNavigate()

  if (pathname === '/contractor/sign-in') return <Outlet />
  if (!session) return <Navigate to="/contractor/sign-in" />

  const logout = () => {
    signOut()
    navigate({ to: '/' })
  }

  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open profile menu"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white hover:bg-white/30"
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
      {/* Desktop sidebar — contractor chrome */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-primary-deep text-white md:flex">
        <Link to="/" aria-label="Mundus home" className="flex h-16 items-center gap-2 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
            <Recycle size={20} weight="bold" />
          </span>
          <span className="font-display text-2xl tracking-wide">MUNDUS</span>
        </Link>
        <p className="px-5 pb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">Field app</p>
        <nav className="flex-1 space-y-1 px-3">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                'flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white',
                pathname.startsWith(t.to) && 'bg-white/15 text-white',
              )}
            >
              <t.icon size={20} /> {t.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/15 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 font-semibold text-white">
              {initials(session.supervisor)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{session.supervisor}</p>
              <p className="truncate text-xs text-white/70">{session.contractorName}</p>
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
        {/* Mobile header — logo left, avatar right */}
        <header className="sticky top-0 z-30 bg-primary-deep text-white md:hidden">
          <div className="flex h-14 items-center gap-2 px-4">
            <Link to="/" aria-label="Mundus home" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white">
                <Recycle size={18} weight="bold" />
              </span>
              <span className="font-display text-xl tracking-wide">MUNDUS</span>
            </Link>
            <div className="ml-auto">{profileMenu}</div>
          </div>
        </header>

        {/* Desktop header */}
        <header className="sticky top-0 z-30 hidden border-b border-hairline bg-paper/95 backdrop-blur md:block">
          <div className="flex h-14 items-center gap-2 px-6">
            <p className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">{session.supervisor}</span> · {session.contractorName}
            </p>
            <div className="ml-auto">{profileMenu}</div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[720px] px-4 py-6 pb-28 md:pb-10">
          <Outlet />
        </main>

        {/* Mobile bottom tabs only */}
        <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-hairline bg-paper px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.16)] md:hidden">
          <div className="grid grid-cols-2 gap-1">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-ink-soft',
                  pathname.startsWith(t.to) && 'bg-cloud text-primary',
                )}
              >
                <t.icon size={20} /> {t.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
