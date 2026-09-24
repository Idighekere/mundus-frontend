import { Badge } from '@/components/ui/badge'
import type { VisitStatus } from '@/mocks/data'

const labels: Record<VisitStatus, string> = {
  complete: 'Complete visit',
  incomplete: 'Incomplete, no after photo',
  'location-mismatch': 'Location mismatch',
  'duplicate-photo': 'Duplicate photo',
  'reported-full': 'Reported full',
}

const variants: Record<VisitStatus, 'on-schedule' | 'overdue' | 'critical' | 'neutral'> = {
  complete: 'on-schedule',
  incomplete: 'overdue',
  'location-mismatch': 'critical',
  'duplicate-photo': 'critical',
  'reported-full': 'neutral',
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

export function visitNodeColor(status: VisitStatus): string {
  switch (status) {
    case 'complete': return '#00C46A'
    case 'incomplete': return '#B45309'
    case 'reported-full': return '#1D4ED8'
    default: return '#B42323'
  }
}

export function photoCount(status: VisitStatus, hasBefore: boolean, hasAfter: boolean): number {
  if (status === 'reported-full') return 0
  return (hasBefore ? 1 : 0) + (hasAfter ? 1 : 0)
}
