import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Bell, CheckCircle, Flag, Megaphone, UserPlus, Warning } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { ListSkeleton } from '@/components/skeletons'
import { buildNotices, markAllNoticesRead, markNoticeRead, unreadIds, useNoticesInput, type Notice } from '@/lib/notifications'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/agency/notifications')({
  component: NotificationsPage,
})

const kindIcon = {
  report: <Megaphone size={20} className="text-primary" />,
  flag: <Warning size={20} weight="fill" className="text-[#be3b3b]" />,
  nomination: <UserPlus size={20} className="text-[#c08014]" />,
  overdue: <Flag size={20} weight="fill" className="text-[#be3b3b]" />,
}

function dayGroup(iso: string): string {
  return new Date(iso).toDateString() === new Date().toDateString() ? 'Today' : 'Earlier'
}

function NotificationsPage() {
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const input = useNoticesInput()

  const loading = !input.sites
  const notices = useMemo(
    () =>
      buildNotices(
        { reports: input.reports, flagged: input.flagged, nominations: input.nominations },
        { sites: input.sites ?? [] },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, tick],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const unread = useMemo(() => new Set(unreadIds(notices)), [notices, tick])

  const groups = useMemo(() => {
    const map = new Map<string, Notice[]>()
    for (const n of notices) {
      const g = dayGroup(n.atIso)
      map.set(g, [...(map.get(g) ?? []), n])
    }
    return [...map.entries()].sort((a, b) => (a[0] === 'Today' ? -1 : b[0] === 'Today' ? 1 : 0))
  }, [notices])

  const openNotice = (n: Notice) => {
    markNoticeRead(n.id)
    setTick((t) => t + 1)
    if (n.params) navigate({ to: n.to, params: n.params })
    else navigate({ to: n.to })
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl text-ink">Notifications</h2>
          <p className="mt-1 text-ink-soft">
            {unread.size === 0 ? 'All caught up.' : `${unread.size} unread — reports, flags, nominations, red flags.`}
          </p>
        </div>
        {unread.size > 0 ? (
          <Button
            variant="secondary"
            onClick={() => {
              markAllNoticesRead(notices.map((n) => n.id))
              setTick((t) => t + 1)
            }}
          >
            <CheckCircle size={18} weight="fill" /> Mark all read
          </Button>
        ) : null}
      </div>

      {loading ? (
        <ListSkeleton columns={['w-48', 'w-20']} rows={4} />
      ) : input.liveError ? (
        <Card className="mt-4 text-center">
          <p className="mt-2 font-display text-[28px] text-ink">Could not load notifications</p>
          <p className="mt-1">{input.liveError}</p>
          <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      ) : notices.length === 0 ? (
        <Card className="mt-4 text-center">
          <Bell size={32} className="mx-auto text-ink-soft" />
          <p className="mt-2 font-display text-[28px] text-ink">Nothing to review</p>
          <p className="mt-1">Reports, flags, and nominations will land here.</p>
        </Card>
      ) : (
        <div className="mt-4 space-y-6">
          {groups.map(([group, items]) => (
            <section key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">{group}</h3>
              <div className="mt-2 space-y-2">
                {items.map((n) => {
                  const fresh = unread.has(n.id)
                  return (
                    <button
                      key={n.id}
                      onClick={() => openNotice(n)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-hairline bg-paper p-3 text-left',
                        fresh && 'border-primary/40 bg-cloud/40',
                      )}
                    >
                      {n.photo ? (
                        <img src={n.photo} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-canvas">
                          {kindIcon[n.kind]}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={cn('block truncate text-sm', fresh ? 'font-bold text-ink' : 'font-medium text-ink')}>
                          {n.title}
                        </span>
                        <span className="block truncate text-xs text-ink-soft">{n.body}</span>
                        <span className="block text-[11px] text-ink-soft">
                          {new Date(n.atIso).toLocaleString()}
                        </span>
                      </span>
                      {fresh ? <Badge variant="neutral">New</Badge> : null}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
