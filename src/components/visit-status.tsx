import { Badge } from '@/components/ui/badge'
import type { VisitStatus } from '@/lib/models'

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
    case 'complete': return '#1d6f42'
    case 'incomplete': return '#c08014'
    case 'reported-full': return '#3f559e'
    default: return '#be3b3b'
  }
}

export function photoCount(status: VisitStatus, hasBefore: boolean, hasAfter: boolean): number {
  if (status === 'reported-full') return 0
  return (hasBefore ? 1 : 0) + (hasAfter ? 1 : 0)
}
