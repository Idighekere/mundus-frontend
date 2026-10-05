import { useEffect, type ReactNode } from 'react'
import { XIcon } from '@phosphor-icons/react'

export function RightSheet({
  open, onOpenChange, title, description, children, footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close panel" className="absolute inset-0 cursor-pointer bg-ink/50" onClick={() => onOpenChange(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-hairline p-6">
          <div>
            <h3 className="font-display text-[28px] leading-tight text-ink">{title}</h3>
            {description ? <p className="mt-1 text-base text-ink-soft">{description}</p> : null}
          </div>
          <button
            aria-label="Close panel"
            onClick={() => onOpenChange(false)}
            className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full text-ink-soft hover:bg-cloud"
          >
            <XIcon size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-hairline bg-paper p-6 pt-4">{footer}</div>
        ) : null}
      </aside>
    </div>
  )
}
