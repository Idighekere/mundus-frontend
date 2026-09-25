import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { SiteStatus } from '@/lib/overdue'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm whitespace-nowrap',
  {
    variants: {
      variant: {
        'on-schedule': 'bg-[#e6f5ee] text-[#1d6f42]',
        overdue: 'bg-[#fdf3c4] text-[#c08014]',
        critical: 'bg-[#fde8e8] text-[#be3b3b]',
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
