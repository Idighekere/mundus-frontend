import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-6 py-2.5 font-action text-sm font-medium transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary shadow-[rgba(13,12,35,0.06)_0px_2px_6px_0px] hover:bg-primary-bright active:bg-primary-deep',
        secondary: 'bg-cloud text-primary hover:bg-[#cfdccf]',
        outline: 'border border-hairline bg-paper text-ink hover:bg-cloud',
        ghost: 'text-ink-soft hover:text-ink hover:bg-cloud',
        danger: 'text-[#be3b3b] hover:bg-[#fde8e8]',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows a spinner, disables the button, and announces busy state. */
  loading?: boolean
}

export function Button({ className, variant, asChild, loading, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant }), className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && !asChild ? <CircleNotch size={18} weight="bold" className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </Comp>
  )
}
