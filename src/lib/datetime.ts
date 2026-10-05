/** All event timestamps render in West Africa Time, explicitly — never the
 * viewer's default zone handling, which silently shifts UTC strings by an hour. */

const TZ = 'Africa/Lagos'

type Input = string | number | Date

export function formatDate(input: Input): string {
  return new Date(input).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  })
}

export function formatTime(input: Input): string {
  return new Date(input).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  })
}

export function formatDateTime(input: Input): string {
  return `${formatDate(input)}, ${formatTime(input)}`
}

export function formatDayLabel(input: Input): string {
  return new Date(input).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: TZ,
  })
}
