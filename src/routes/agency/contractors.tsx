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
import { ArrowDownIcon, ArrowUpIcon, ArrowsDownUpIcon, CaretDownIcon, FunnelSimpleIcon, MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input, PasswordInput } from '@/components/ui/input'
import { RightSheet } from '@/components/ui/right-sheet'
import { BottomSheet } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TBody } from '@/components/ui/table'
import { StatCardsSkeleton, ListSkeleton } from '@/components/skeletons'
import type { DumpPoint } from '@/lib/models'
import { contractorsApi } from '@/lib/api'
import { qk, useContractorsPage, useInvalidate } from '@/lib/live-queries'
import { mapDumpPoint } from '@/lib/backend-map'
import { useMediaQuery } from '@/lib/use-media-query'
import { daysSince, statusFor, type SiteStatus } from '@/lib/overdue'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/agency/contractors')({
  component: ContractorsPage,
})

interface Row {
  id: string
  name: string
  email: string
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [saving, setSaving] = useState(false)
  const invalidate = useInvalidate()
  const { data, isPending, isError, error, refetch } = useContractorsPage()

  const liveContractors = data?.contractors
  const liveSites = data?.sites
  const liveLoading = isPending
  const liveError = isError ? (error instanceof Error ? error.message : 'Could not load contractors.') : ''

  const directory = (liveContractors ?? []).map((c) => ({ id: String(c.id), name: c.name, email: c.supervisor_email }))
  const allSites: DumpPoint[] = useMemo(
    () => (liveSites ?? []).map(mapDumpPoint),
    [liveSites],
  )

  const allRows: Row[] = useMemo(() => {
    return (liveContractors ?? []).map((c) => ({
      id: String(c.id),
      name: c.name,
      email: c.supervisor_email,
      siteCount: c.site_count,
      overdue: c.overdue,
      critical: c.critical,
      onSchedule: Math.max(0, c.site_count - c.overdue - c.critical),
      worst: c.critical > 0 ? 'critical' : c.overdue > 0 ? 'overdue' : 'on-schedule',
    }))
  }, [liveContractors])

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
        cell: ({ row }) => (
          <span>
            <span className="block font-semibold text-ink">{row.original.name}</span>
            <span className="block text-xs text-ink-soft">{row.original.email}</span>
          </span>
        ),
      },
      { accessorKey: 'siteCount', header: 'Sites' },
      {
        accessorKey: 'overdue',
        header: 'Overdue',
        cell: ({ getValue }) => {
          const v = getValue<number>()
          return <span className={cn('font-semibold', v > 0 && 'text-[#c08014]')}>{v}</span>
        },
      },
      {
        accessorKey: 'critical',
        header: 'Critical',
        cell: ({ getValue }) => {
          const v = getValue<number>()
          return <span className={cn('font-semibold', v > 0 && 'text-[#be3b3b]')}>{v}</span>
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

  const saveContractor = async () => {
    if (name.trim().length < 2) {
      setFormError('Contractor name needs at least 2 characters.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter a valid contractor email.')
      return
    }
    if (password.length < 6) {
      setFormError('Password needs at least 6 characters. The contractor can change it later.')
      return
    }
    if (directory.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setFormError('A contractor with this name already exists.')
      return
    }
    if (directory.some((c) => c.email.toLowerCase() === email.trim().toLowerCase())) {
      setFormError('This email is already registered to another contractor.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      // Backend still models the contractor login as a supervisor user —
      // mirror the person's details into those fields. No UI shows them.
      await contractorsApi.create({
        name: name.trim(),
        supervisor_name: name.trim(),
        supervisor_email: email.trim().toLowerCase(),
        password,
      })
      await invalidate(qk.contractors, qk.dashboard, qk.dumpPoints, qk.searchIndex)
      setName('')
      setEmail('')
      setPassword('')
      setFormOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add the contractor.')
    } finally {
      setSaving(false)
    }
  }

  const contractorForm = (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        The new contractor signs in with these details and appears immediately in site assignment. Assign them to dump points from Manage Dump Points.
      </p>
      <div>
        <label htmlFor="contractor-name" className="mb-1 block text-sm font-semibold text-ink">Contractor name</label>
        <Input id="contractor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Idighs Udo — person or trade name" />
      </div>
      <div>
        <label htmlFor="contractor-email" className="mb-1 block text-sm font-semibold text-ink">Contractor email</label>
        <Input id="contractor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contractor@example.com" />
      </div>
      <div>
        <label htmlFor="contractor-password" className="mb-1 block text-sm font-semibold text-ink">Temporary password</label>
        <PasswordInput id="contractor-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        <p className="mt-1 text-xs text-ink-soft">The contractor signs in with these details and can change the password afterwards.</p>
      </div>
      {formError ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{formError}</p> : null}
    </div>
  )

  const contractorActions = (
    <div className="flex gap-2">
      <Button onClick={() => void saveContractor()} disabled={saving} loading={saving} className="flex-1">
        {saving ? 'Adding…' : 'Add contractor'}
      </Button>
      <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
    </div>
  )

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl text-ink">Contractors</h2>
          <p className="mt-1 text-ink-soft">Registered contractors — the individuals who sign in and check in. Expand a row to see assigned dump points.</p>
        </div>
        <Button onClick={() => { setName(''); setEmail(''); setPassword(''); setFormError(''); setFormOpen(true) }}>
          <PlusIcon size={18} /> Add contractor
        </Button>
      </div>

      {liveLoading && !liveContractors ? (
        <div className="mt-4 space-y-4">
          <StatCardsSkeleton />
          <ListSkeleton columns={['w-40', 'w-16', 'w-16', 'w-24']} rows={4} />
        </div>
      ) : liveError && !liveContractors ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">Could not load contractors</p>
          <p className="mt-1">{liveError}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          {!liveContractors && !liveError ? (
            <div className="mt-4">
              <StatCardsSkeleton />
            </div>
          ) : (
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
          )}

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contractors…"
            className="pl-10"
            aria-label="Search contractors"
          />
        </div>
        <Button variant="secondary" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}>
          <FunnelSimpleIcon size={18} /> <span className="hidden sm:inline">Filters</span>
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
                          {h.column.getIsSorted() === 'desc' ? <ArrowDownIcon size={14} /> : h.column.getIsSorted() === 'asc' ? <ArrowUpIcon size={14} /> : <ArrowsDownUpIcon size={14} className="opacity-40" />}
                        </button>
                      </TH>
                    ))}
                  </TR>
                ))}
              </THead>
              <TBody>
                {visible.map((r) => {
                  const sites = allSites.filter((s) => s.contractorId === r.original.id)
                  return (
                    <Fragment key={r.id}>
                      <TR key={r.id} className="cursor-pointer" onClick={() => r.toggleExpanded()}>
                        <TD>
                          <CaretDownIcon size={18} className={cn('text-ink-soft transition-transform', r.getIsExpanded() && 'rotate-180')} />
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
              const sites = allSites.filter((s) => s.contractorId === r.original.id)
              const open = r.getIsExpanded()
              return (
                <div key={r.id} className="rounded-2xl border border-hairline bg-paper p-4 shadow-[rgba(13,12,35,0.18)_0px_10px_30px_-22px]">
                  <button onClick={() => r.toggleExpanded()} aria-expanded={open} className="flex w-full cursor-pointer items-center justify-between gap-2 text-left">
                    <span>
                      <span className="block font-semibold text-ink">{r.original.name}</span>
                      <span className="block text-xs text-ink-soft">{r.original.siteCount} sites</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={r.original.worst} />
                      <CaretDownIcon size={18} className={cn('text-ink-soft transition-transform', open && 'rotate-180')} />
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

        </>
      )}

      {isDesktop ? (
        <RightSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          title="Add contractor"
          description="Register a contractor — the individual who signs in and checks in."
          footer={contractorActions}
        >
          {contractorForm}
        </RightSheet>
      ) : (
        <BottomSheet open={formOpen} onOpenChange={setFormOpen} title="Add contractor" footer={contractorActions}>
          {contractorForm}
        </BottomSheet>
      )}
    </div>
  )
}
