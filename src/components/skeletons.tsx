import { Skeleton } from '@/components/ui/misc'
import { cn } from '@/lib/utils'

function Shell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  )
}

/** Three stat cards — mirrors dashboard / contractors headers. */
export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Shell label="Loading statistics">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-hairline bg-paper p-4 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-10 w-16" />
          </div>
        ))}
      </div>
    </Shell>
  )
}

/** Desktop table + mobile cards — mirrors registry-style list pages. */
export function ListSkeleton({
  columns,
  rows = 4,
  search = true,
}: {
  /** Skeleton widths per column, e.g. ['w-32','w-24','w-16']. */
  columns: string[]
  rows?: number
  search?: boolean
}) {
  return (
    <Shell label="Loading list">
      {search ? <Skeleton className="mt-4 h-[44px] w-full !rounded-xl" /> : null}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-hairline bg-paper md:block">
        <div className="flex gap-4 border-b border-hairline px-4 py-3">
          {columns.map((w, i) => (
            <Skeleton key={i} className={cn('h-3', w)} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 border-b border-hairline px-4 py-4 last:border-0">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            {columns.slice(1).map((w, i) => (
              <Skeleton key={i} className={cn('hidden h-4 sm:block', w)} />
            ))}
            <Skeleton className="h-9 w-24 !rounded-xl" />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 md:hidden">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between gap-2 rounded-2xl border border-hairline bg-paper p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-20 !rounded-xl" />
          </div>
        ))}
      </div>
    </Shell>
  )
}

/** Site profile + timeline — mirrors agency site detail. */
export function SiteDetailSkeleton() {
  return (
    <Shell label="Loading site">
      <Skeleton className="h-5 w-48" />
      <div className="mt-4 border-b border-hairline pb-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-paper p-6 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24 !rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-44 w-full !rounded-xl" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between border-t border-hairline py-2.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-paper p-6 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="mt-4 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-hairline bg-paper p-4 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-2 h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}

/** Visit compare — mirrors before/after + checks. */
export function VisitSkeleton() {
  return (
    <Shell label="Loading visit">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-2 h-4 w-56" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full !rounded-2xl" />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-hairline bg-paper px-4 py-3">
            <Skeleton className="h-5 w-5 !rounded-full" />
            <Skeleton className="h-4 w-52" />
          </div>
        ))}
      </div>
    </Shell>
  )
}

/** Contractor home — greeting, two stat cards, site cards. */
export function ContractorHomeSkeleton() {
  return (
    <Shell label="Loading your sites">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-1 h-7 w-44" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-hairline bg-paper p-4 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-10 w-12" />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-hairline bg-paper p-4 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 !rounded-full" />
            </div>
            <Skeleton className="mt-3 h-2 w-full !rounded-full" />
          </div>
        ))}
      </div>
    </Shell>
  )
}

/** Grouped history rows — mirrors contractor history. */
export function HistorySkeleton() {
  return (
    <Shell label="Loading submissions">
      <Skeleton className="h-[44px] w-full !rounded-xl" />
      <div className="mt-4 space-y-4">
        {[0, 1].map((g) => (
          <div key={g} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-hairline bg-paper p-4">
                <Skeleton className="h-12 w-12 !rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-20 !rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Shell>
  )
}
