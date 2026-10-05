import { useEffect, type ReactNode } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function Dialog({
  open, onOpenChange, children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-ink/50 cursor-pointer" onClick={() => onOpenChange(false)} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-paper p-6 shadow-xl sm:rounded-2xl">
        <button
          aria-label="Close dialog"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-soft hover:bg-cloud cursor-pointer"
        >
          <XIcon size={20} />
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-display text-[28px] leading-tight text-ink', className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-base text-ink-soft', className)} {...props} />
}
