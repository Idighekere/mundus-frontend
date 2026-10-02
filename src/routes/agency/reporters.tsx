import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, FunnelSimple, MagnifyingGlass, Megaphone, X } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { ListSkeleton } from '@/components/skeletons'
import { Input } from '@/components/ui/input'
import { RightSheet } from '@/components/ui/right-sheet'
import { BottomSheet } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TBody } from '@/components/ui/table'
import { useMediaQuery } from '@/lib/use-media-query'
import { siteById } from '@/mocks/data'
import { useContractorDirectory } from '@/mocks/contractor-store'
import { reportersApi, contractorsApi, dumpPointsApi, hasLiveSession, type ContractorDto, type DumpPointDto, type ReporterDto } from '@/lib/api'
import { mapDumpPoint } from '@/lib/backend-map'
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

function toLocalReporter(r: ReporterDto): Reporter {
  const status: Reporter['status'] =
    r.status === 'approved' || r.status === 'rejected' || r.status === 'revoked' ? r.status : 'pending'
  return {
    id: String(r.id),
    name: r.name,
    phone: r.phone,
    siteId: String(r.site_id),
    contractorId: r.contractor_id !== null && r.contractor_id !== undefined ? String(r.contractor_id) : '',
    status,
    token: r.token ?? null,
    reason: r.rejection_reason ?? undefined,
    updatedAt: r.updated_at,
  }
}

function ReportersPage() {
  const mockReporters = useReporters()
  const directory = useContractorDirectory()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [justApproved, setJustApproved] = useState<string | null>(null)
  const [liveReporters, setLiveReporters] = useState<ReporterDto[] | null>(null)
  const [liveContractors, setLiveContractors] = useState<ContractorDto[] | null>(null)
  const [liveSites, setLiveSites] = useState<DumpPointDto[] | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState('')
  const [acting, setActing] = useState(false)
  const live = hasLiveSession()

  const loadLive = useCallback(async () => {
    setLiveLoading(true)
    setLiveError('')
    try {
      const [reporters, contractors, sites] = await Promise.all([
        reportersApi.list(),
        contractorsApi.list(),
        dumpPointsApi.all(),
      ])
      setLiveReporters(reporters)
      setLiveContractors(contractors)
      setLiveSites(sites)
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Could not load reporters.')
    } finally {
      setLiveLoading(false)
    }
  }, [])

  useEffect(() => {
    if (live) void loadLive()
  }, [live, loadLive])

  const reporters: Reporter[] = liveReporters ? liveReporters.map(toLocalReporter) : mockReporters

  const contractorName = (id: string) => {
    if (liveContractors) return liveContractors.find((c) => String(c.id) === id)?.name ?? 'Unknown contractor'
    return directory.find((c) => c.id === id)?.name ?? 'Unknown contractor'
  }

  const siteName = (id: string) => {
    if (liveSites) {
      const found = liveSites.find((s) => String(s.id) === id)
      return found ? mapDumpPoint(found).name : id
    }
    return siteById(id)?.name ?? id
  }

  const filtered = useMemo(
    () =>
      reporters.filter((r) => {
        if (status !== 'all' && r.status !== status) return false
        const q = search.toLowerCase().trim()
        if (!q) return true
        return `${r.name} ${r.phone} ${siteName(r.siteId)} ${contractorName(r.contractorId)}`.toLowerCase().includes(q)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reporters, search, status, directory, liveSites, liveContractors],
  )

  const pendingCount = reporters.filter((r) => r.status === 'pending').length

  const approve = async (id: string) => {
    if (!live) {
      const next = approveReporter(id)
      if (next) setJustApproved(next.name)
      return
    }
    setActing(true)
    try {
      const res = await reportersApi.approve(Number(id))
      setJustApproved(res.reporter.name)
      await loadLive()
    } catch (err) {
      setJustApproved(null)
      setLiveError(err instanceof Error ? err.message : 'Could not approve the reporter.')
    } finally {
      setActing(false)
    }
  }

  const doReject = async () => {
    if (!rejectId) return
    if (!live) {
      rejectReporter(rejectId, reason)
      setRejectId(null)
      setReason('')
      return
    }
    setActing(true)
    try {
      await reportersApi.reject(Number(rejectId), reason || undefined)
      await loadLive()
      setRejectId(null)
      setReason('')
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Could not reject the nomination.')
    } finally {
      setActing(false)
    }
  }

  const doRevoke = async (id: string) => {
    if (!live) {
      revokeReporter(id)
      return
    }
    setActing(true)
    try {
      await reportersApi.revoke(Number(id))
      await loadLive()
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Could not revoke the reporter.')
    } finally {
      setActing(false)
    }
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
        <Button variant="danger" onClick={() => void doReject()} disabled={acting} className="flex-1">
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
        <Card className="mt-4 border-[#1d6f42]">
          <p className="flex items-center gap-2 font-semibold text-ink"><Check size={18} className="text-[#1d6f42]" /> {justApproved} approved</p>
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

      {liveLoading && !liveReporters ? (
        <ListSkeleton columns={['w-40', 'w-28', 'w-28', 'w-20']} rows={3} />
      ) : liveError && !liveReporters ? (
        <Card className="mt-4 text-center">
          <p className="mt-2 font-display text-[28px] text-ink">Could not load reporters</p>
          <p className="mt-1">{liveError}</p>
          <Button variant="secondary" onClick={() => void loadLive()} className="mt-4">
            Retry
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="mt-4 text-center">
          <Megaphone size={32} className="mx-auto text-ink-soft" />
          <p className="mt-2 font-display text-[28px] text-ink">
            {reporters.length === 0 ? 'No nominations yet' : 'No reporters match these filters'}
          </p>
          <p className="mt-1">Contractors nominate a reporter from each assigned site.</p>
          {!live ? (
            <Button variant="secondary" onClick={seedDemoReporters} className="mt-4">
              Load example requests
            </Button>
          ) : null}
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
                    <TD className="text-ink-soft">{siteName(r.siteId)}</TD>
                    <TD className="text-ink-soft">{contractorName(r.contractorId)}</TD>
                    <TD><Badge variant={statusVariant[r.status]}>{r.status}</Badge></TD>
                    <TD>
                      <div className="flex flex-wrap gap-2">
                        {r.status === 'pending' || r.status === 'rejected' ? (
                          <Button variant="secondary" onClick={() => void approve(r.id)} disabled={acting}><Check size={16} /> Approve</Button>
                        ) : null}
                        {r.status === 'pending' ? (
                          <Button variant="ghost" onClick={() => { setRejectId(r.id); setReason('') }}><X size={16} /> Reject</Button>
                        ) : null}
                        {r.status === 'approved' ? (
                          <Button variant="danger" onClick={() => void doRevoke(r.id)} disabled={acting}>Revoke</Button>
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
                    <p className="text-xs text-ink-soft">{r.phone} · {siteName(r.siteId)}</p>
                  </div>
                  <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(r.status === 'pending' || r.status === 'rejected') ? (
                    <Button variant="secondary" onClick={() => void approve(r.id)} disabled={acting}><Check size={16} /> Approve</Button>
                  ) : null}
                  {r.status === 'pending' ? (
                    <Button variant="ghost" onClick={() => { setRejectId(r.id); setReason('') }}><X size={16} /> Reject</Button>
                  ) : null}
                  {r.status === 'approved' ? (
                    <Button variant="danger" onClick={() => void doRevoke(r.id)} disabled={acting}>Revoke</Button>
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
