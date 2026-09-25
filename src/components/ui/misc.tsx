import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-lg bg-cloud', className)} {...props} />
}

export function Separator({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-hairline', className)} />
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-2xl border border-hairline bg-paper p-6 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]', className)} {...props} />
  )
}
