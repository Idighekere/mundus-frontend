import type { ReactNode } from 'react'
import { useMediaQuery } from '@/lib/use-media-query'
import { Dialog, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { BottomSheet } from '@/components/ui/sheet'

export function ResponsiveDetail({
  open, onOpenChange, title, description, children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
        <div className="mt-4">{children}</div>
      </Dialog>
    )
  }
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
      {description ? <p className="mb-4 text-base text-ink-soft">{description}</p> : null}
      {children}
    </BottomSheet>
  )
}
