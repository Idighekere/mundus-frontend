import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootError,
})

const CHUNK_RETRY_KEY = 'mundus-chunk-retry'

function isChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|module script failed|chunkloaderror|loading chunk|failed to fetch/i.test(message)
}

function RootError({ error, reset }: { error: unknown; reset: () => void }) {
  const chunkFailed = isChunkError(error)
  useEffect(() => {
    // Stale tab + fresh deploy: lazy chunk filenames changed and the old
    // file is gone. Reload once to pick up the new bundle.
    if (chunkFailed && !sessionStorage.getItem(CHUNK_RETRY_KEY)) {
      sessionStorage.setItem(CHUNK_RETRY_KEY, '1')
      window.location.reload()
    }
  }, [chunkFailed])
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-xl tracking-wide text-ink">MUNDUS</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Something went wrong</h1>
      <p className="mt-2 text-ink-soft">
        {chunkFailed
          ? 'This page updated in the background. Reload to get the latest version.'
          : 'An unexpected error stopped this page.'}
      </p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <Button
          onClick={() => {
            sessionStorage.removeItem(CHUNK_RETRY_KEY)
            reset()
            window.location.reload()
          }}
        >
          Reload page
        </Button>
        <Button asChild variant="secondary">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    </div>
  )
}

function RootLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    // A clean render means the bundle is fresh — clear any chunk-retry flag.
    sessionStorage.removeItem(CHUNK_RETRY_KEY)
  }, [pathname])
  // App sections + bespoke landing + reporter links render their own shells — no public chrome there.
  if (pathname === '/' || pathname.startsWith('/agency') || pathname.startsWith('/contractor') || pathname.startsWith('/r/')) return <Outlet />

  return (
    <div className="min-h-screen bg-canvas font-body text-ink-soft">
      <header className="border-b border-hairline bg-paper">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark className="h-9 w-9" />
            <span className="font-display text-2xl tracking-wide text-ink">MUNDUS</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            <Link to="/agency/dashboard" className="rounded-lg px-3 py-2 hover:bg-cloud hover:text-ink [&.active]:bg-cloud [&.active]:text-primary">Dashboard</Link>
            <Link to="/agency/contractors" className="rounded-lg px-3 py-2 hover:bg-cloud hover:text-ink [&.active]:bg-cloud [&.active]:text-primary">Contractors</Link>
            <Link to="/agency/dump-points" className="rounded-lg px-3 py-2 hover:bg-cloud hover:text-ink [&.active]:bg-cloud [&.active]:text-primary">Manage Dump Points</Link>
            <Link to="/agency/dashboard" className="ml-2 rounded-xl bg-primary px-5 py-2.5 font-action text-sm font-bold text-on-primary hover:bg-primary-bright">Open dashboard</Link>
          </nav>
          <Link to="/agency/dashboard" className="rounded-xl bg-primary px-5 py-2.5 font-action text-sm font-bold text-on-primary md:hidden">
            Open dashboard
          </Link>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-hairline bg-paper">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-ink">Mundus — waste evacuation verification</p>
          <p>Seeded demo data. No live government integration.</p>
        </div>
      </footer>
    </div>
  )
}
