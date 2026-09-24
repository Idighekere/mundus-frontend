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
    <div className={cn('rounded-2xl bg-paper p-6 shadow-[0px_4px_32px_0px_rgba(0,0,0,0.08)]', className)} {...props} />
  )
}
