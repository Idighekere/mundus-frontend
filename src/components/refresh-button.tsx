import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

/** Icon button that refetches page data without a full reload. Shows the
built-in spinner (and disables) while the query is in flight. */
export function RefreshButton({
  loading,
  onRefresh,
  label = 'Refresh data',
}: {
  loading?: boolean
  onRefresh: () => void
  label?: string
}) {
  return (
    <Button
      variant="outline"
      loading={loading}
      onClick={onRefresh}
      title={label}
      aria-label={label}
      className="shrink-0 px-3"
    >
      {loading ? null : <ArrowCounterClockwiseIcon size={18} aria-hidden="true" />}
      <span className="hidden sm:inline">Refresh</span>
    </Button>
  )
}
