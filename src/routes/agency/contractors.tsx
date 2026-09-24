import { createFileRoute, Link } from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Fragment, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowsDownUp, CaretDown, FunnelSimple, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { RightSheet } from '@/components/ui/right-sheet'
import { BottomSheet } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TBody } from '@/components/ui/table'
import { dumpPoints } from '@/mocks/data'
import { addContractor, useContractorDirectory, type DirectoryContractor } from '@/mocks/contractor-store'
import { useMediaQuery } from '@/lib/use-media-query'
import { daysSince, statusFor, type SiteStatus } from '@/lib/overdue'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/agency/contractors')({
  component: ContractorsPage,
})

interface Row extends DirectoryContractor {
  siteCount: number
  overdue: number
  critical: number
  onSchedule: number
  worst: SiteStatus
}

function ContractorsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [needsAttentionOnly, setNeedsAttentionOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'critical', desc: true }])
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [formError, setFormError] = useState('')
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const directory = useContractorDirectory()

  const allRows: Row[] = useMemo(
    () =>
      directory.map((c) => {
        const sites = dumpPoints.filter((s) => s.contractorId === c.id)
        const statuses = sites.map((s) => statusFor(daysSince(s.lastClearanceIso)))
        const critical = statuses.filter((s) => s === 'critical').length
        const overdue = statuses.filter((s) => s === 'overdue').length
        return {
          ...c,
          siteCount: sites.length,
          overdue,
          critical,
          onSchedule: sites.length - overdue - critical,
          worst: critical > 0 ? 'critical' : overdue > 0 ? 'overdue' : 'on-schedule',
        }
      }),
    [directory],
  )

  const rows = useMemo(
    () =>
      allRows.filter((r) => {
        if (status !== 'all' && r.worst !== status) return false
        if (needsAttentionOnly && r.overdue + r.critical === 0) return false
        return true
      }),
    [allRows, status, needsAttentionOnly],
  )

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Contractor',
        cell: ({ row }) => <p className="font-semibold">{row.original.name}</p>,
      },
      {
        accessorKey: 'supervisor',
        header: 'Supervisor',
        cell: ({ getValue }) => <span className="text-ink-soft">{getValue<string>()}</span>,
      },
      { accessorKey: 'siteCount', header: 'Sites' },
      {
        accessorKey: 'overdue',
        header: 'Overdue',
        cell: ({ getValue }) => {
          const v = getValue<number>()
          return <span className={cn('font-semibold', v > 0 && 'text-[#b45309]')}>{v}</span>
        },
      },
      {
        accessorKey: 'critical',
        header: 'Critical',
        cell: ({ getValue }) => {
          const v = getValue<number>()
          return <span className={cn('font-semibold', v > 0 && 'text-[#b42323]')}>{v}</span>
        },
      },
      {
        accessorKey: 'worst',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.worst} />,
      },
    ],
    [],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const visible = table.getRowModel().rows
  const totalSites = rows.reduce((n, r) => n + r.siteCount, 0)

  const saveContractor = () => {
    if (name.trim().length < 2) {
      setFormError('Contractor name needs at least 2 characters.')
      return
    }
    if (supervisor.trim().length < 2) {
      setFormError('Supervisor name needs at least 2 characters.')
      return
    }
    if (directory.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setFormError('A contractor with this name already exists.')
      return
    }
    addContractor(name, supervisor)
    setName('')
    setSupervisor('')
    setFormError('')
    setFormOpen(false)
  }

  const contractorForm = (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        The new contractor appears immediately in site assignment and supervisor sign-in. Assign them to dump points from Manage Dump Points.
      </p>
      <div>
        <label htmlFor="contractor-name" className="mb-1 block text-sm font-semibold text-ink">Contractor name</label>
        <Input id="contractor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="CleanCity Services" />
      </div>
      <div>
        <label htmlFor="contractor-supervisor" className="mb-1 block text-sm font-semibold text-ink">Field supervisor</label>
        <Input id="contractor-supervisor" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} placeholder="Emmanuel Udo" />
      </div>
      {formError ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#b42323]">{formError}</p> : null}
      <div className="flex gap-2">
        <Button onClick={saveContractor} className="flex-1">Add contractor</Button>
        <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl text-ink">Contractors</h2>
          <p className="mt-1 text-ink-soft">Registered waste evacuation contractors. Expand a row to see assigned dump points.</p>
        </div>
        <Button onClick={() => { setName(''); setSupervisor(''); setFormError(''); setFormOpen(true) }}>
          <Plus size={18} /> Add contractor
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Contractors', value: String(rows.length) },
          { label: 'Dump points', value: String(totalSites) },
          { label: 'Need attention', value: String(rows.reduce((n, r) => n + r.overdue + r.critical, 0)) },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{s.label}</p>
            <p className="mt-1 font-display text-4xl text-ink">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contractors or supervisors…"
            className="pl-10"
            aria-label="Search contractors"
          />
        </div>
        <Button variant="secondary" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
          <FunnelSimple size={18} /> <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {filtersOpen ? (
        <Card className="mt-3 flex flex-wrap items-end gap-3 p-4">
          <div className="text-sm">
            <span className="mb-1 block font-semibold text-ink">Status</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="on-schedule">On schedule</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={needsAttentionOnly}
              onChange={(e) => setNeedsAttentionOnly(e.target.checked)}
              className="h-5 w-5 accent-[#0B3D2C]"
            />
            Needs attention only
          </label>
          {(status !== 'all' || needsAttentionOnly || search) ? (
            <Button variant="ghost" onClick={() => { setStatus('all'); setNeedsAttentionOnly(false); setSearch('') }}>
              Clear all
            </Button>
          ) : null}
        </Card>
      ) : null}

      {visible.length === 0 ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">No contractors match “{search}”</p>
          <p className="mt-1">Try a different name.</p>
        </Card>
      ) : (
        <>
          <div className="mt-4 hidden md:block">
            <Table>
              <THead>
                {table.getHeaderGroups().map((hg) => (
                  <TR key={hg.id} className="hover:bg-transparent">
                    <TH />
                    {hg.headers.map((h) => (
                      <TH key={h.id}>
                        <button onClick={h.column.getToggleSortingHandler()} className="inline-flex cursor-pointer items-center gap-1 uppercase">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === 'desc' ? <ArrowDown size={14} /> : h.column.getIsSorted() === 'asc' ? <ArrowUp size={14} /> : <ArrowsDownUp size={14} className="opacity-40" />}
                        </button>
                      </TH>
                    ))}
                  </TR>
                ))}
              </THead>
              <TBody>
                {visible.map((r) => {
                  const sites = dumpPoints.filter((s) => s.contractorId === r.original.id)
                  return (
                    <Fragment key={r.id}>
                      <TR key={r.id} className="cursor-pointer" onClick={() => r.toggleExpanded()}>
                        <TD>
                          <CaretDown size={18} className={cn('text-ink-soft transition-transform', r.getIsExpanded() && 'rotate-180')} />
                        </TD>
                        {r.getVisibleCells().map((cell) => (
                          <TD key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TD>
                        ))}
                      </TR>
                      {r.getIsExpanded() ? (
                        <TR key={`${r.id}-sites`} className="bg-canvas/60 hover:bg-canvas/60">
                          <TD />
                          <TD colSpan={6}>
                            <div className="flex flex-col gap-1 py-1">
                              {sites.map((s) => {
                                const st = statusFor(daysSince(s.lastClearanceIso))
                                return (
                                  <Link
                                    key={s.id}
                                    to="/agency/sites/$siteId"
                                    params={{ siteId: s.id }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2 hover:bg-cloud"
                                  >
                                    <span>
                                      <span className="font-semibold text-ink">{s.name}</span>
                                      <span className="ml-2 text-xs text-ink-soft">{daysSince(s.lastClearanceIso)}d since clearance</span>
                                    </span>
                                    <StatusBadge status={st} />
                                  </Link>
                                )
                              })}
                            </div>
                          </TD>
                        </TR>
                      ) : null}
                    </Fragment>
                  )
                })}
              </TBody>
            </Table>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {visible.map((r) => {
              const sites = dumpPoints.filter((s) => s.contractorId === r.original.id)
              const open = r.getIsExpanded()
              return (
                <div key={r.id} className="rounded-2xl border border-hairline bg-paper p-4 shadow-[0px_4px_32px_0px_rgba(0,0,0,0.08)]">
                  <button onClick={() => r.toggleExpanded()} aria-expanded={open} className="flex w-full cursor-pointer items-center justify-between gap-2 text-left">
                    <span>
                      <span className="block font-semibold text-ink">{r.original.name}</span>
                      <span className="block text-xs text-ink-soft">{r.original.supervisor} · {r.original.siteCount} sites</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={r.original.worst} />
                      <CaretDown size={18} className={cn('text-ink-soft transition-transform', open && 'rotate-180')} />
                    </span>
                  </button>
                  {open ? (
                    <div className="mt-3 flex flex-col gap-1 border-t border-hairline pt-3">
                      {sites.map((s) => (
                        <Link
                          key={s.id}
                          to="/agency/sites/$siteId"
                          params={{ siteId: s.id }}
                          className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2"
                        >
                          <span className="font-medium text-ink">{s.name}</span>
                          <StatusBadge status={statusFor(daysSince(s.lastClearanceIso))} />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </>
      )}

      {isDesktop ? (
        <RightSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          title="Add contractor"
          description="Register a waste evacuation contractor and their field supervisor."
        >
          {contractorForm}
        </RightSheet>
      ) : (
        <BottomSheet open={formOpen} onOpenChange={setFormOpen} title="Add contractor">
          {contractorForm}
        </BottomSheet>
      )}
    </div>
  )
}
