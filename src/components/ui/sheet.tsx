import { Drawer } from 'vaul'
import { X } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

export function BottomSheet({
  open, onOpenChange, children, title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/50" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-[20px] bg-paper p-6 outline-none">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-hairline" />
          <div className="mb-4 flex items-start justify-between gap-4">
            {title ? <h3 className="font-display text-[28px] leading-tight text-ink">{title}</h3> : <span />}
            <button
              aria-label="Close sheet"
              onClick={() => onOpenChange(false)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-soft hover:bg-cloud cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
