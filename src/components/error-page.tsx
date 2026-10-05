import { Link, useRouter } from '@tanstack/react-router'
import { ArrowCounterClockwiseIcon, HouseIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo'

/** Last-resort crash page for render errors anywhere in the app. */
export function ErrorPage({ onReset }: { onReset?: () => void }) {
  const router = useRouter()
  const retry = () => {
    if (onReset) onReset()
    else router.invalidate()
  }
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4 py-16 font-body text-ink-soft">
      <div className="w-full max-w-md text-center">
        <Link to="/" aria-label="Mundus home" className="inline-flex items-center gap-2">
          <LogoMark className="h-10 w-10" />
          <span className="font-display text-2xl tracking-wide text-ink">MUNDUS</span>
        </Link>
        <h1 className="mt-8 font-display text-3xl text-ink">Something went wrong</h1>
        <p className="mt-2 leading-relaxed">
          This screen ran into a problem. Your data is safe — try again, or head home.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={retry}>
            <ArrowCounterClockwiseIcon size={18} /> Try again
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">
              <HouseIcon size={18} /> Back home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
