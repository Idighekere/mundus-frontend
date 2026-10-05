import { createFileRoute, Link, Outlet, notFound, useMatch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Camera, CaretDown, Images } from '@phosphor-icons/react'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { SiteDetailSkeleton } from '@/components/skeletons'
import { SiteMiniMap } from '@/components/site-mini-map'
import { VisitStatusBadge, photoCount, visitNodeColor } from '@/components/visit-status'
import type { Visit } from '@/lib/models'
import { useSiteDetail } from '@/lib/live-queries'
import { cn } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/datetime'

export const Route = createFileRoute('/agency/sites/$siteId')({
  component: SiteDetailPage,
})

const PAGE_SIZE = 3

function SiteDetailPage() {
  const { siteId } = Route.useParams()
  const visitMatch = useMatch({ from: '/agency/sites/$siteId/visits/$visitId', shouldThrow: false })
  const numericId = Number(siteId)
  if (!Number.isFinite(numericId)) throw notFound()
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const { data: liveDetail, isPending, isError, error, refetch } = useSiteDetail(numericId)
  const liveLoading = isPending
  const liveError = isError ? (error instanceof Error ? error.message : 'Could not load this site.') : ''
    const site = liveDetail?.site
  const timeline: Visit[] = liveDetail ? liveDetail.timeline : []
  const pageCount = Math.max(1, Math.ceil(timeline.length / PAGE_SIZE))
  const visible = timeline.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    setPage(0)
    setExpanded(new Set(timeline.slice(0, 1).map((v) => v.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, timeline.length])

  if (visitMatch) return <Outlet />
  if (liveLoading || !liveDetail) {
    return (
      <div>
        <Link to="/agency/dashboard" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-ink-soft hover:text-primary">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="mt-2">
          <SiteDetailSkeleton />
        </div>
      </div>
    )
  }
  if (liveError) {
    return (
      <div>
        <Link to="/agency/dashboard" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-ink-soft hover:text-primary">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">Could not load this site</p>
          <p className="mt-1">{liveError}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }
  if (!site) throw notFound()
  const days = liveDetail.days
  const status = liveDetail.status
  const contractorName = liveDetail.contractorName
  const intervalLabel = `${liveDetail.intervalDays} days`

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-ink-soft">
        <Link to="/agency/dashboard" className="inline-flex min-h-[44px] items-center gap-1 hover:text-primary">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">{site.name}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-hairline pb-4">
        <h2 className="font-display text-4xl text-ink md:text-[40px]">{site.name}</h2>
        <p className="text-sm text-ink-soft">{site.sector} <span className="mx-1">|</span> <span className="font-mono font-semibold text-ink">{site.code}</span></p>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* LEFT: profile */}
        <div className="lg:col-span-4">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={status} />
              <p className={cn('text-sm font-semibold', days > 7 ? 'text-[#be3b3b]' : 'text-ink')}>
                {days} days since clearance
              </p>
            </div>

            <SiteMiniMap name={site.name} lat={site.lat} lng={site.lng} pin={status === 'critical' ? '#be3b3b' : '#0B3D2C'} />

            <div className="divide-y divide-hairline border-y border-hairline">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-ink-soft">Contractor</span>
                <span className="font-semibold text-ink">{contractorName}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-ink-soft">Clearance interval</span>
                <span className="font-semibold text-ink">{intervalLabel}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: timeline */}
        <div className="lg:col-span-8">
          <Card className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-[28px] text-ink">Clearance timeline</h3>
              <p className="text-ink-soft">Newest first — expand an entry to inspect its photos.</p>
            </div>
            <Badge variant="neutral" className="self-start md:self-auto">{timeline.length} events</Badge>
          </Card>

          <div className="relative mt-4 pl-8 before:absolute before:bottom-6 before:left-[11px] before:top-4 before:w-0.5 before:bg-ink">
            <div className="flex flex-col gap-4">
              {visible.map((v) => {
                const color = visitNodeColor(v.status)
                const count = photoCount(v.status, !!v.before, !!v.after)
                const isOpen = expanded.has(v.id)
                const to = { to: '/agency/sites/$siteId/visits/$visitId' as const, params: { siteId: site.id, visitId: v.id } }
                return (
                  <div key={v.id} className="relative">
                    <div
                      className="absolute -left-8 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white"
                      style={{ borderColor: color }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    </div>
                    <Card className="p-0">
                      <button
                        onClick={() => toggle(v.id)}
                        aria-expanded={isOpen}
                        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-ink">
                            {formatDate(v.dateIso)}
                            <span className="ml-2 font-mono text-sm font-medium text-ink-soft">
                              {formatTime(v.dateIso)}
                            </span>
                          </span>
                          <span className="mt-1 flex flex-wrap gap-1.5">
                            <VisitStatusBadge status={v.status} />
                            {count > 0 ? <Badge variant="neutral">{count} photo{count > 1 ? 's' : ''}</Badge> : null}
                          </span>
                        </span>
                        <CaretDown size={20} className={cn('shrink-0 text-ink-soft transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      {isOpen ? (
                        <div className="border-t border-hairline p-4 pt-3">
                          {v.status === 'reported-full' ? (
                            <p className="text-sm text-ink">
                              Reporter: <span className="font-semibold">{v.contractor}</span>
                            </p>
                          ) : null}
                          <p className="mt-1 text-ink-soft">{v.note}</p>
                          {count > 0 && (v.before || v.after) ? (
                            <Link {...to} className="mt-3 grid grid-cols-2 gap-2" aria-label={`View photos for visit on ${formatDate(v.dateIso)}`}>
                              {[v.before, v.after].map((p, i) =>
                                p ? (
                                  <span key={i} className="group relative flex aspect-[16/10] flex-col items-center justify-center gap-1 overflow-hidden rounded-xl bg-cloud text-ink-soft">
                                    <Camera size={24} />
                                    <span className="text-[11px] font-semibold uppercase tracking-wide">{i === 0 ? 'Before' : 'After'}</span>
                                    <span className="absolute inset-x-0 bottom-0 bg-ink/60 py-1 text-center text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                      View comparison →
                                    </span>
                                  </span>
                                ) : (
                                  <span key={i} className="flex aspect-[16/10] items-center justify-center rounded-xl border border-dashed border-hairline text-xs text-ink-soft">
                                    No {i === 0 ? 'before' : 'after'} photo
                                  </span>
                                ),
                              )}
                            </Link>
                          ) : null}
                          <div className="mt-3 flex items-center justify-between">
                            {count > 0 ? (
                              <Link {...to} className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-ink underline underline-offset-4 hover:text-primary">
                                <Images size={18} /> Open comparison <ArrowRight size={16} />
                              </Link>
                            ) : (
                              <span className="text-sm text-ink-soft">No contractor photos{v.ticket ? ` · Ticket #${v.ticket}` : ''}</span>
                            )}
                            {v.status === 'location-mismatch' && v.before ? (
                              <span className="font-mono text-xs text-[#be3b3b]">{v.before.distanceM} m from site</span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>

          {pageCount > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-ink-soft">Page {page + 1} of {pageCount}</p>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="secondary" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          ) : null}

          <Button variant="secondary" asChild className="mt-4 md:hidden">
            <Link to="/agency/dashboard"><ArrowLeft size={18} /> Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
