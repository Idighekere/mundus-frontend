import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { SiteStatus } from '@/lib/overdue'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        'on-schedule': 'bg-[#e3f4ea] text-primary',
        overdue: 'bg-[#fdf0d5] text-[#8a5a00]',
        critical: 'bg-[#fde8e8] text-[#b42323]',
        neutral: 'bg-cloud text-ink-soft',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export function StatusBadge({ status }: { status: SiteStatus }) {
  const label = status === 'on-schedule' ? 'On schedule' : status === 'overdue' ? 'Overdue' : 'Critical'
  return <Badge variant={status}>{label}</Badge>
}
