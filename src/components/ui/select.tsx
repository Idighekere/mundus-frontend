import * as SelectPrimitive from '@radix-ui/react-select'
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root

export function SelectTrigger({ className, children, ...props }: SelectPrimitive.SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-primary data-[placeholder]:text-ink-soft/60',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <CaretDownIcon size={16} className="shrink-0 text-ink-soft" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectValue(props: SelectPrimitive.SelectValueProps) {
  return <SelectPrimitive.Value {...props} />
}

export function SelectContent({ className, children, ...props }: SelectPrimitive.SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        className={cn(
          'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-xl border border-hairline bg-paper p-1 shadow-xl',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({ className, children, ...props }: SelectPrimitive.SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-cloud data-[state=checked]:font-semibold data-[state=checked]:text-primary',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex-1">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <CheckIcon size={16} className="text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
