import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPinIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { RightSheet } from '@/components/ui/right-sheet'
import { BottomSheet } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TD, TH, THead, TR, Table, TBody } from '@/components/ui/table'
import { ListSkeleton } from '@/components/skeletons'
import { MapPicker } from '@/components/map-picker'
import { PlaceSearch } from '@/components/place-search'
import { useMediaQuery } from '@/lib/use-media-query'
import { reverseGeocode } from '@/lib/geocode'
import type { DumpPoint } from '@/lib/models'
import { dumpPointsApi } from '@/lib/api'
import { qk, useDumpPointsPage, useInvalidate } from '@/lib/live-queries'
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

const empty: FormState = { name: '', contractorId: '', lat: '', lng: '' }

function ManageDumpPointsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [address, setAddress] = useState<string | null>(null)
  const [locateError, setLocateError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const invalidate = useInvalidate()
  const { data, isPending, isError, error, refetch } = useDumpPointsPage()

  const liveSites = data?.sites
  const liveDirectory = data?.contractors
  const liveLoading = isPending
  const liveError = isError ? (error instanceof Error ? error.message : 'Could not load dump points.') : ''
  const [removeError, setRemoveError] = useState('')
  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const displaySites: DumpPoint[] = useMemo(
    () => (liveSites ?? []).map(mapDumpPoint),
    [liveSites],
  )
  // Backend stores the contractor NAME on the site — the form works in
  // names end to end, with directory ids for React keys only.
  const directory = (liveDirectory ?? []).map((c) => ({ id: String(c.id), name: c.name, email: c.supervisor_email }))

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
    if (!validCoords) next.lat = 'Pin the location on the map or search for it above.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
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
      await invalidate(qk.dumpPoints, qk.dashboard, qk.contractors, qk.searchIndex)
      setFormOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save the dump point.')
    } finally {
      setSaving(false)
    }
  }

  const removeSite = async (id: string) => {
    setRemoveError('')
    try {
      await dumpPointsApi.remove(Number(id))
      await invalidate(qk.dumpPoints, qk.dashboard, qk.contractors, qk.searchIndex)
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Could not remove the dump point.')
    }
  }

  const formActions = (
    <div className="flex gap-2">
      <Button onClick={() => void save()} disabled={saving} loading={saving} className="flex-1">
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
            {directory.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            {[...new Set(displaySites.map((s) => s.contractorId))]
              .filter((n): n is string => !!n && !directory.some((c) => c.name === n))
              .map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.contractorId ? <p className="mt-1 text-sm text-[#be3b3b]">{errors.contractorId}</p> : null}
        <p className="mt-1.5 rounded-xl bg-canvas px-3 py-2 text-sm text-ink">
          Contact: <span className="font-semibold">{directory.find((c) => c.name === form.contractorId)?.email ?? '—'}</span>
        </p>
      </div>
      <span className="mb-1 block text-sm font-semibold text-ink">Location</span>
      <PlaceSearch
        onPick={(pos) => { setLocateError(''); setForm((f) => ({ ...f, lat: String(pos.lat), lng: String(pos.lng) })) }}
      />

      <MapPicker
        lat={validCoords ? latNum : null}
        lng={validCoords ? lngNum : null}
        onChange={(pos) => { setLocateError(''); setForm((f) => ({ ...f, lat: String(pos.lat), lng: String(pos.lng) })) }}
        onLocateError={setLocateError}
      />
      {errors.lat ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{errors.lat}</p> : null}
      {locateError ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{locateError}</p> : null}
      {address ? (
        <p className="flex items-start gap-2 rounded-xl bg-canvas px-3 py-2 text-sm text-ink">
          <MapPinIcon size={18} className="mt-0.5 shrink-0 text-primary" /> {address}
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
            Live registry of municipal disposal locations.
          </p>
        </div>
        <Button onClick={openAdd}><PlusIcon size={18} /> Add dump point</Button>
      </div>

      {liveLoading && !liveSites ? (
        <ListSkeleton columns={['w-40', 'w-32']} rows={5} search={false} />
      ) : liveError && !liveSites ? (
        <Card className="mt-4 text-center">
          <p className="font-display text-[28px] text-ink">Could not load dump points</p>
          <p className="mt-1">{liveError}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          {removeError ? (
            <p role="alert" className="mt-4 rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{removeError}</p>
          ) : null}
          <div className="mt-4 hidden md:block">
            <Table>
              <THead><TR className="hover:bg-transparent"><TH>Site name</TH><TH>Contractor</TH><TH>Actions</TH></TR></THead>
              <TBody>
                {displaySites.map((s) => (
                  <TR key={s.id}>
                    <TD className="font-semibold">{s.name}</TD>
                    <TD className="text-ink-soft">{s.contractorId || 'Unassigned'}</TD>
                    <TD>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => openEdit(s.id)}><PencilSimpleIcon size={16} /> Edit</Button>
                        <Button variant="danger" onClick={() => void removeSite(s.id)}><TrashIcon size={16} /> Remove</Button>
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
                  <p className="text-xs text-ink-soft">{s.contractorId || 'Unassigned'}</p>
                </div>
                <Button variant="secondary" onClick={() => openEdit(s.id)}><PencilSimpleIcon size={16} /> Edit</Button>
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
