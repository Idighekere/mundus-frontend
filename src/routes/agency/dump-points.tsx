import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { RightSheet } from '@/components/ui/right-sheet'
import { BottomSheet } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TBody } from '@/components/ui/table'
import { MapPicker } from '@/components/map-picker'
import { PlaceSearch } from '@/components/place-search'
import { useMediaQuery } from '@/lib/use-media-query'
import { reverseGeocode } from '@/lib/geocode'
import { dumpPoints as seed, type DumpPoint } from '@/mocks/data'
import { useContractorDirectory } from '@/mocks/contractor-store'
import { contractorsApi, dumpPointsApi, hasLiveSession, type ContractorDto, type DumpPointDto } from '@/lib/api'
import { mapDumpPoint } from '@/lib/backend-map'

export const Route = createFileRoute('/agency/dump-points')({
  component: ManageDumpPointsPage,
})

interface FormState {
  name: string
  contractorId: string
  lat: string
  lng: string
}

const empty: FormState = { name: '', contractorId: 'cleancity', lat: '', lng: '' }

function ManageDumpPointsPage() {
  const [sites, setSites] = useState(seed)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [address, setAddress] = useState<string | null>(null)
  const [locateError, setLocateError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [liveSites, setLiveSites] = useState<DumpPointDto[] | null>(null)
  const [liveDirectory, setLiveDirectory] = useState<ContractorDto[] | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState('')
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const mockDirectory = useContractorDirectory()
  const live = hasLiveSession()
  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadLive = useCallback(async () => {
    setLiveLoading(true)
    setLiveError('')
    try {
      const [sites, directory] = await Promise.all([dumpPointsApi.all(), contractorsApi.list()])
      setLiveSites(sites)
      setLiveDirectory(directory)
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Could not load dump points.')
    } finally {
      setLiveLoading(false)
    }
  }, [])

  useEffect(() => {
    if (live) void loadLive()
  }, [live, loadLive])

  const displaySites: DumpPoint[] = liveSites ? liveSites.map(mapDumpPoint) : sites
  const directory = liveDirectory
    ? liveDirectory.map((c) => ({ id: String(c.id), name: c.name, supervisor: c.supervisor_name }))
    : mockDirectory

  const latNum = Number(form.lat)
  const lngNum = Number(form.lng)
  const validCoords = Number.isFinite(latNum) && Number.isFinite(lngNum)

  // Reverse-geocode whenever coordinates settle (debounced).
  useEffect(() => {
    if (geoTimer.current) clearTimeout(geoTimer.current)
    if (!validCoords) { setAddress(null); return }
    geoTimer.current = setTimeout(async () => {
      setAddress('Looking up address…')
      const found = await reverseGeocode(latNum, lngNum)
      setAddress(found ?? 'Address unavailable for these coordinates.')
    }, 600)
    return () => { if (geoTimer.current) clearTimeout(geoTimer.current) }
  }, [form.lat, form.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => { setEditingId(null); setForm(empty); setErrors({}); setSaveError(''); setAddress(null); setLocateError(''); setFormOpen(true) }
  const openEdit = (id: string) => {
    const s = displaySites.find((x) => x.id === id)
    if (!s) return
    setEditingId(id)
    setForm({ name: s.name, contractorId: s.contractorId, lat: String(s.lat), lng: String(s.lng) })
    setErrors({})
    setSaveError('')
    setLocateError('')
    setFormOpen(true)
  }

  const save = async () => {
    const next: typeof errors = {}
    if (form.name.trim().length < 3) next.name = 'Site name needs at least 3 characters.'
    if (!form.contractorId) next.contractorId = 'Choose a contractor.'
    if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) next.lat = 'Latitude must be between -90 and 90.'
    if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) next.lng = 'Longitude must be between -180 and 180.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    if (!live) {
      if (editingId) {
        setSites((prev) => prev.map((s) => (s.id === editingId ? { ...s, name: form.name.trim(), contractorId: form.contractorId, lat: latNum, lng: lngNum } : s)))
      } else {
        setSites((prev) => [
          ...prev,
          {
            id: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            code: 'AK-UYO-NEW', sector: 'Unassigned sector',
            name: form.name.trim(), lat: latNum, lng: lngNum,
            contractorId: form.contractorId,
            supervisorId: 'unassigned', supervisorName: 'Unassigned',
            lastClearanceIso: new Date().toISOString(),
          },
        ])
      }
      setFormOpen(false)
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      if (editingId) {
        await dumpPointsApi.update(Number(editingId), { name: form.name.trim(), latitude: latNum, longitude: lngNum })
        await dumpPointsApi.assign(Number(editingId), { assigned_contractor_id: form.contractorId || undefined })
      } else {
        await dumpPointsApi.create({
          name: form.name.trim(), latitude: latNum, longitude: lngNum,
          assigned_contractor_id: form.contractorId || undefined,
        })
      }
      await loadLive()
      setFormOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save the dump point.')
    } finally {
      setSaving(false)
    }
  }

  const removeSite = async (id: string) => {
    if (!live) {
      setSites((prev) => prev.filter((x) => x.id !== id))
      return
    }
    try {
      await dumpPointsApi.remove(Number(id))
      await loadLive()
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Could not remove the dump point.')
    }
  }

  const formActions = (
    <div className="flex gap-2">
      <Button onClick={() => void save()} disabled={saving} className="flex-1">
        {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add dump point'}
      </Button>
      <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
    </div>
  )

  const formBody = (
    <div className="space-y-4">
      <div>
        <label htmlFor="site-name" className="mb-1 block text-sm font-semibold text-ink">Site name</label>
        <Input id="site-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nwaniba Road" />
        {errors.name ? <p className="mt-1 text-sm text-[#be3b3b]">{errors.name}</p> : null}
      </div>
      <div>
        <span className="mb-1 block text-sm font-semibold text-ink">Contractor</span>
        <Select value={form.contractorId} onValueChange={(v) => setForm({ ...form, contractorId: v })}>
          <SelectTrigger><SelectValue placeholder="Choose a contractor" /></SelectTrigger>
          <SelectContent>
            {directory.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.contractorId ? <p className="mt-1 text-sm text-[#be3b3b]">{errors.contractorId}</p> : null}
        <p className="mt-1.5 rounded-xl bg-canvas px-3 py-2 text-sm text-ink">
          Supervisor: <span className="font-semibold">{directory.find((c) => c.id === form.contractorId)?.supervisor ?? '—'}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="site-lat" className="mb-1 block text-sm font-semibold text-ink">Latitude</label>
          <Input id="site-lat" inputMode="decimal" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="5.0450" />
          {errors.lat ? <p className="mt-1 text-sm text-[#be3b3b]">{errors.lat}</p> : null}
        </div>
        <div>
          <label htmlFor="site-lng" className="mb-1 block text-sm font-semibold text-ink">Longitude</label>
          <Input id="site-lng" inputMode="decimal" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="7.9620" />
          {errors.lng ? <p className="mt-1 text-sm text-[#be3b3b]">{errors.lng}</p> : null}
        </div>
      </div>

      <PlaceSearch
        onPick={(pos) => { setLocateError(''); setForm((f) => ({ ...f, lat: String(pos.lat), lng: String(pos.lng) })) }}
      />

      <MapPicker
        lat={validCoords ? latNum : null}
        lng={validCoords ? lngNum : null}
        onChange={(pos) => { setLocateError(''); setForm((f) => ({ ...f, lat: String(pos.lat), lng: String(pos.lng) })) }}
        onLocateError={setLocateError}
      />
      {locateError ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{locateError}</p> : null}
      {address ? (
        <p className="flex items-start gap-2 rounded-xl bg-canvas px-3 py-2 text-sm text-ink">
          <MapPin size={18} className="mt-0.5 shrink-0 text-primary" /> {address}
        </p>
      ) : null}

      {saveError ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{saveError}</p> : null}
    </div>
  )

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl text-ink">Manage Dump Points</h2>
          <p className="mt-1 text-ink-soft">
            {live ? 'Live registry of municipal disposal locations.' : 'Active registry of municipal disposal locations. Demo edits stay in memory.'}
          </p>
        </div>
        <Button onClick={openAdd}><Plus size={18} /> Add dump point</Button>
      </div>

      {liveLoading && !liveSites ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">Loading dump points…</p>
          <p className="mt-1">Fetching the live registry from the server.</p>
        </Card>
      ) : liveError && !liveSites ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">Could not load dump points</p>
          <p className="mt-1">{liveError}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void loadLive()}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          <div className="mt-4 hidden md:block">
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>Site name</TH><TH>Contractor</TH><TH>Coordinates</TH><TH>Actions</TH></TR></THead>
              <TBody>
                {displaySites.map((s) => (
                  <TR key={s.id}>
                    <TD className="font-semibold">{s.name}</TD>
                    <TD className="text-ink-soft">{directory.find((c) => c.id === s.contractorId)?.name ?? 'Unassigned'}</TD>
                    <TD className="text-ink-soft">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</TD>
                    <TD>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => openEdit(s.id)}><PencilSimple size={16} /> Edit</Button>
                        <Button variant="danger" onClick={() => void removeSite(s.id)}><Trash size={16} /> Remove</Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          <div className="mt-4 space-y-2 md:hidden">
            {displaySites.map((s) => (
              <Card key={s.id} className="flex items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-semibold text-ink">{s.name}</p>
                  <p className="text-xs text-ink-soft">{directory.find((c) => c.id === s.contractorId)?.name ?? 'Unassigned'}</p>
                </div>
                <Button variant="secondary" onClick={() => openEdit(s.id)}><PencilSimple size={16} /> Edit</Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {isDesktop ? (
        <RightSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          title={editingId ? 'Edit dump point' : 'Add dump point'}
          description="Register a new point for scheduled waste evacuation."
          footer={formActions}
        >
          {formBody}
        </RightSheet>
      ) : (
        <BottomSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          title={editingId ? 'Edit dump point' : 'Add dump point'}
          footer={formActions}
        >
          {formBody}
        </BottomSheet>
      )}
    </div>
  )
}
