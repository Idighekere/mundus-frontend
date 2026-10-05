import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { ArrowDownIcon, ArrowUpIcon, ArrowsDownUpIcon, FunnelSimpleIcon, MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TBody } from '@/components/ui/table'
import type { DumpPoint } from '@/lib/models'
import { StatCardsSkeleton, ListSkeleton } from '@/components/skeletons'
import { statusFor } from '@/lib/overdue'
import { useDashboard } from '@/lib/live-queries'
import { hasReporterFlag, mapDaysSince, mapDumpPoint, mapSiteStatus } from '@/lib/backend-map'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/datetime'

export const Route = createFileRoute('/agency/dashboard')({
  component: DashboardPage,
})

interface Row extends DumpPoint {
  days: number
  status: ReturnType<typeof statusFor>
  contractorName: string
  flagged: boolean
}

function DashboardPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [contractor, setContractor] = useState('all')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'days', desc: true }])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const navigate = useNavigate()
  const { data, isPending, isError, error, refetch } = useDashboard()

  const liveSites = data?.sites
  const liveStats = data?.stats
  const liveContractors = data?.contractors
  const liveLoading = isPending
  const liveError = isError ? (error instanceof Error ? error.message : 'Could not load dashboard.') : ''

  const rows: Row[] = useMemo(() => {
    const byId = new Map((liveContractors ?? []).map((c) => [String(c.id), c.name]))
    return (liveSites ?? []).map((d) => {
      const site = mapDumpPoint(d)
      // assigned_contractor_id is a free-text field: usually the contractor
      // name, occasionally a bare numeric id — resolve ids, never print them.
      const raw = d.assigned_contractor_name ?? site.contractorId
      const contractorName = raw && byId.has(raw) ? (byId.get(raw) as string) : (raw || 'Unassigned')
      return {
        ...site,
        days: mapDaysSince(d, site.lastClearanceIso),
        status: mapSiteStatus(d.status),
        contractorName,
        flagged: hasReporterFlag(d),
      }
    })
  }, [liveSites, liveContractors])

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (status !== 'all' && r.status !== status) return false
        if (contractor !== 'all' && r.contractorId !== contractor) return false
        if (overdueOnly && r.days <= 7) return false
        return true
      }),
    [rows, status, contractor, overdueOnly],
  )

  const openSite = (id: string) => navigate({ to: '/agency/sites/$siteId', params: { siteId: id } })

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Site',
        cell: ({ row }) => (
          <p className="font-semibold">{row.original.name}</p>
        ),
      },
      {
        accessorKey: 'contractorName',
        header: 'Contractor',
        cell: ({ getValue }) => <span className="text-ink-soft">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'days',
        header: 'Overdue',
        cell: ({ row }) => (
          <span className={cn('font-semibold', row.original.days > 7 ? 'text-[#be3b3b]' : 'text-ink')}>
            {row.original.days}d
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex flex-wrap items-center gap-1">
            <StatusBadge status={row.original.status} />
            {row.original.flagged ? <Badge variant="neutral">Reporter flag</Badge> : null}
          </span>
        ),
      },
      {
        accessorKey: 'lastClearanceIso',
        header: 'Last cleared',
        cell: ({ getValue }) => (
          <span className="text-ink-soft">{formatDate(getValue<string>())}</span>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _col, value) =>
      `${row.original.name} ${row.original.contractorName}`
        .toLowerCase()
        .includes(String(value).toLowerCase()),
  })

  const visible = table.getRowModel().rows
  const total = liveStats?.total_sites ?? rows.length
  const overdueCount = liveStats?.overdue_count ?? rows.filter((r) => r.days > 7).length
  const criticalCount = liveStats?.critical_count ?? rows.filter((r) => r.status === 'critical').length

  return (
    <div>
      <h2 className="font-display text-4xl text-ink">Dashboard</h2>
      <p className="mt-1 text-ink-soft">All registered dump points, most overdue first. Select a site for its full audit timeline.</p>

      {!liveSites && !liveError ? (
        <div className="mt-4">
          <StatCardsSkeleton />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Dump points', value: String(total) },
            { label: 'Overdue', value: String(overdueCount) },
            { label: 'Critical', value: String(criticalCount) },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{s.label}</p>
              <p className="mt-1 font-display text-4xl text-ink">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by site name…"
            className="pl-10"
            aria-label="Search dump points"
          />
        </div>
        <Button variant="secondary" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
          <FunnelSimpleIcon size={18} /> <span className="hidden sm:inline">Filters</span>
        </Button>
        <Button asChild className="hidden md:inline-flex">
          <Link to="/agency/dump-points"><PlusIcon size={18} /> Add site</Link>
        </Button>
      </div>

      {filtersOpen ? (
        <Card className="mt-3 flex flex-wrap items-end gap-3 p-4">
          <div className="text-sm">
            <span className="mb-1 block font-semibold text-ink">Status</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="on-schedule">On schedule</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm">
            <span className="mb-1 block font-semibold text-ink">Contractor</span>
            <Select value={contractor} onValueChange={setContractor}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contractors</SelectItem>
                {(liveContractors ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
                {[...new Set(rows.map((r) => r.contractorName))]
                  .filter((n) => n !== 'Unassigned' && !(liveContractors ?? []).some((c) => c.name === n))
                  .map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="h-5 w-5 accent-[#0B3D2C]"
            />
            Overdue only (&gt;7d)
          </label>
          {(status !== 'all' || contractor !== 'all' || overdueOnly || search) ? (
            <Button
              variant="ghost"
              onClick={() => { setStatus('all'); setContractor('all'); setOverdueOnly(false); setSearch('') }}
            >
              Clear all
            </Button>
          ) : null}
        </Card>
      ) : null}

      {liveLoading && !liveSites ? (
        <div className="mt-4 space-y-4">
          <StatCardsSkeleton />
          <ListSkeleton columns={['w-32', 'w-24', 'w-16', 'w-20']} rows={5} />
        </div>
      ) : liveError && !liveSites ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">Could not load dashboard</p>
          <p className="mt-1">{liveError}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
            Retry
          </Button>
        </Card>
      ) : visible.length === 0 ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">No dump points match these filters</p>
          <p className="mt-1">Try widening the status or clearing the search.</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => { setStatus('all'); setContractor('all'); setOverdueOnly(false); setSearch('') }}
          >
            Clear filters
          </Button>
        </Card>
      ) : (
        <>
          <div className="mt-4 hidden md:block">
            <Table>
              <THead>
                {table.getHeaderGroups().map((hg) => (
                  <TR key={hg.id} className="hover:bg-transparent">
                    {hg.headers.map((h) => (
                      <TH key={h.id}>
                        {h.column.getCanSort() ? (
                          <button
                            onClick={h.column.getToggleSortingHandler()}
                            className="inline-flex cursor-pointer items-center gap-1 uppercase"
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {h.column.getIsSorted() === 'desc' ? <ArrowDownIcon size={14} /> : h.column.getIsSorted() === 'asc' ? <ArrowUpIcon size={14} /> : <ArrowsDownUpIcon size={14} className="opacity-40" />}
                          </button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                      </TH>
                    ))}
                  </TR>
                ))}
              </THead>
              <TBody>
                {visible.map((r) => (
                  <TR key={r.id} className="cursor-pointer" onClick={() => openSite(r.original.id)}>
                    <TD><p className="font-semibold">{r.original.name}</p></TD>
                    <TD className="text-ink-soft">{r.original.contractorName}</TD>
                    <TD><span className={cn('font-semibold', r.original.days > 7 && 'text-[#be3b3b]')}>{r.original.days}d</span></TD>
                    <TD>
                      <span className="flex flex-wrap gap-1">
                        <StatusBadge status={r.original.status} />
                        {r.original.flagged ? <Badge variant="neutral">Reporter flag</Badge> : null}
                      </span>
                    </TD>
                    <TD className="text-ink-soft">{formatDate(r.original.lastClearanceIso)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {visible.map((r) => (
              <button
                key={r.id}
                onClick={() => openSite(r.original.id)}
                className="w-full cursor-pointer rounded-2xl border border-hairline bg-paper p-4 text-left shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{r.original.name}</p>
                    <p className="text-xs text-ink-soft">{r.original.contractorName}</p>
                  </div>
                  <StatusBadge status={r.original.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className={cn('font-semibold', r.original.days > 7 ? 'text-[#be3b3b]' : 'text-ink')}>
                    {r.original.days} days since clearance
                  </span>
                  <span className="text-ink-soft">View details →</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
