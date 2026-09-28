import { Drawer } from 'vaul'
import { X } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

export function BottomSheet({
  open, onOpenChange, children, title, footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
  footer?: ReactNode
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/50" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] max-h-[92dvh] flex-col rounded-t-[20px] bg-paper outline-none">
          <div className="shrink-0 px-6 pt-3">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-hairline" />
            <div className="flex items-start justify-between gap-4 py-3">
              {title ? <h3 className="font-display text-[28px] leading-tight text-ink">{title}</h3> : <span />}
              <button
                aria-label="Close sheet"
                onClick={() => onOpenChange(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-soft hover:bg-cloud cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-hairline bg-paper px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
              {footer}
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
