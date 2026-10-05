import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, MapPinIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4 py-16 font-body text-ink-soft">
      <div className="w-full max-w-md text-center">
        <Link to="/" aria-label="Mundus home" className="inline-flex items-center gap-2">
          <LogoMark className="h-10 w-10" />
          <span className="font-display text-2xl tracking-wide text-ink">MUNDUS</span>
        </Link>
        <p className="mt-8 font-display text-7xl text-primary">404</p>
        <h1 className="mt-2 font-display text-3xl text-ink">This page isn't on the record</h1>
        <p className="mt-2 leading-relaxed">
          The address may be mistyped, or the site or visit was removed. Nothing was lost —
          pick up where you left off.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link to="/">
              <ArrowLeftIcon size={18} /> Back home
            </Link>
          </Button>
          <Button asChild>
            <Link to="/agency/dashboard">
              <MapPinIcon size={18} /> Open dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
