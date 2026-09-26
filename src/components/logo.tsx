import { cn } from '@/lib/utils'

/**
 * Mundus brand mark — recycle loop + verification check.
 * `color`: full-color mark for light surfaces. `mono`: white knocked-out
 * mark for dark surfaces (primary / primary-deep panels).
 */
export function LogoMark({ variant = 'color', className }: { variant?: 'color' | 'mono'; className?: string }) {
  return (
    <img
      src={variant === 'mono' ? '/logos/logo-mono-light.svg' : '/logos/logo-icon.svg'}
      alt="Mundus logo"
      draggable={false}
      className={cn('h-8 w-8 shrink-0', className)}
    />
  )
}
