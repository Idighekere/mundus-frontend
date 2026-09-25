import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Check, FunnelSimple, MagnifyingGlass, Megaphone, X } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { RightSheet } from '@/components/ui/right-sheet'
import { BottomSheet } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TBody } from '@/components/ui/table'
import { useMediaQuery } from '@/lib/use-media-query'
import { siteById } from '@/mocks/data'
import { useContractorDirectory } from '@/mocks/contractor-store'
import {
  approveReporter, rejectReporter, revokeReporter, seedDemoReporters,
  useReporters, type Reporter,
} from '@/mocks/reporter-store'

export const Route = createFileRoute('/agency/reporters')({
  component: ReportersPage,
})

const statusVariant: Record<Reporter['status'], 'on-schedule' | 'overdue' | 'critical' | 'neutral'> = {
  approved: 'on-schedule',
  pending: 'overdue',
  rejected: 'critical',
  revoked: 'neutral',
}

function ReportersPage() {
  const reporters = useReporters()
  const directory = useContractorDirectory()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [justApproved, setJustApproved] = useState<string | null>(null)

  const contractorName = (id: string) => directory.find((c) => c.id === id)?.name ?? 'Unknown contractor'

  const filtered = useMemo(
    () =>
      reporters.filter((r) => {
        if (status !== 'all' && r.status !== status) return false
        const q = search.toLowerCase().trim()
        if (!q) return true
        return `${r.name} ${r.phone} ${siteById(r.siteId)?.name ?? ''} ${contractorName(r.contractorId)}`.toLowerCase().includes(q)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reporters, search, status, directory],
  )

  const pendingCount = reporters.filter((r) => r.status === 'pending').length

  const approve = (id: string) => {
    const next = approveReporter(id)
    if (next) setJustApproved(next.name)
  }

  const rejectBody = (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">The contractor will see this reason and may nominate someone else.</p>
      <div>
        <label htmlFor="reject-reason" className="mb-1 block text-sm font-semibold text-ink">Reason (optional)</label>
        <Input
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Number not reachable"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="danger" onClick={() => { if (rejectId) rejectReporter(rejectId, reason); setRejectId(null); setReason('') }} className="flex-1">
          Reject nomination
        </Button>
        <Button variant="secondary" onClick={() => { setRejectId(null); setReason('') }}>Cancel</Button>
      </div>
    </div>
  )

  return (
    <div>
      <h2 className="font-display text-4xl text-ink">Reporters</h2>
      <p className="mt-1 text-ink-soft">Approve contractor-nominated reporters. Approved reporters get a personal single-site link by message.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Awaiting review</p>
          <p className="mt-1 font-display text-4xl text-ink">{pendingCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Approved</p>
          <p className="mt-1 font-display text-4xl text-ink">{reporters.filter((r) => r.status === 'approved').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Total nominated</p>
          <p className="mt-1 font-display text-4xl text-ink">{reporters.length}</p>
        </Card>
      </div>

      {justApproved ? (
        <Card className="mt-4 border-[#00a35c]">
          <p className="flex items-center gap-2 font-semibold text-ink"><Check size={18} className="text-[#00a35c]" /> {justApproved} approved</p>
          <p className="mt-1 text-sm text-ink-soft">The contractor can now send them their personal reporting link by SMS or WhatsApp.</p>
          <div className="mt-3">
            <Button variant="secondary" onClick={() => setJustApproved(null)}>Dismiss</Button>
          </div>
        </Card>
      ) : null}

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, site…"
            className="pl-10"
            aria-label="Search reporters"
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
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status !== 'all' || search ? (
            <Button variant="ghost" onClick={() => { setStatus('all'); setSearch('') }}>Clear all</Button>
          ) : null}
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="mt-4 text-center">
          <Megaphone size={32} className="mx-auto text-ink-soft" />
          <p className="mt-2 font-display text-[28px] text-ink">
            {reporters.length === 0 ? 'No nominations yet' : 'No reporters match these filters'}
          </p>
          <p className="mt-1">Contractors nominate a reporter from each assigned site.</p>
          <Button variant="secondary" onClick={seedDemoReporters} className="mt-4">
            Load example requests
          </Button>
        </Card>
      ) : (
        <>
          <div className="mt-4 hidden md:block">
            <Table>
              <THead>
                <TR className="hover:bg-transparent"><TH>Reporter</TH><TH>Site</TH><TH>Contractor</TH><TH>Status</TH><TH>Actions</TH></TR>
              </THead>
              <TBody>
                {filtered.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-ink-soft">{r.phone}</p>
                    </TD>
                    <TD className="text-ink-soft">{siteById(r.siteId)?.name ?? r.siteId}</TD>
                    <TD className="text-ink-soft">{contractorName(r.contractorId)}</TD>
                    <TD><Badge variant={statusVariant[r.status]}>{r.status}</Badge></TD>
                    <TD>
                      <div className="flex flex-wrap gap-2">
                        {(r.status === 'pending' || r.status === 'rejected') ? (
                          <Button variant="secondary" onClick={() => approve(r.id)}><Check size={16} /> Approve</Button>
                        ) : null}
                        {r.status === 'pending' ? (
                          <Button variant="ghost" onClick={() => { setRejectId(r.id); setReason('') }}><X size={16} /> Reject</Button>
                        ) : null}
                        {r.status === 'approved' ? (
                          <Button variant="danger" onClick={() => revokeReporter(r.id)}>Revoke</Button>
                        ) : null}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {filtered.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{r.name}</p>
                    <p className="text-xs text-ink-soft">{r.phone} · {siteById(r.siteId)?.name}</p>
                  </div>
                  <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(r.status === 'pending' || r.status === 'rejected') ? (
                    <Button variant="secondary" onClick={() => approve(r.id)}><Check size={16} /> Approve</Button>
                  ) : null}
                  {r.status === 'pending' ? (
                    <Button variant="ghost" onClick={() => { setRejectId(r.id); setReason('') }}><X size={16} /> Reject</Button>
                  ) : null}
                  {r.status === 'approved' ? (
                    <Button variant="danger" onClick={() => revokeReporter(r.id)}>Revoke</Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {isDesktop ? (
        <RightSheet open={rejectId !== null} onOpenChange={(o) => !o && setRejectId(null)} title="Reject nomination" description="Optionally tell the contractor why.">
          {rejectBody}
        </RightSheet>
      ) : (
        <BottomSheet open={rejectId !== null} onOpenChange={(o) => !o && setRejectId(null)} title="Reject nomination">
          {rejectBody}
        </BottomSheet>
      )}
    </div>
  )
}
