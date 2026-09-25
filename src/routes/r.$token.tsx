import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle, MapPin, Megaphone } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { siteById } from '@/mocks/data'
import {
  latestReportForSite, reportGate, reportsForReporter, resolveToken, submitSiteReport,
} from '@/mocks/reporter-store'

export const Route = createFileRoute('/r/$token')({
  component: ReporterPage,
})

function timeAgo(iso: string): string {
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000
  if (h < 1) return 'less than an hour ago'
  if (h < 24) return `${Math.floor(h)} hours ago`
  return `${Math.floor(h / 24)} days ago`
}

function ReporterPage() {
  const { token } = Route.useParams()
  const [confirming, setConfirming] = useState(false)
  const [justReportedAt, setJustReportedAt] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  void tick

  const reporter = resolveToken(token)

  if (!reporter) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-16 text-center">
        <MapPin size={44} className="mx-auto text-[#b42323]" weight="fill" />
        <h1 className="mt-3 text-2xl font-bold text-ink">This reporting link is not valid</h1>
        <p className="mt-2 text-ink-soft">
          It may have been revoked or replaced. Contact the agency for a new link.
        </p>
      </main>
    )
  }

  const site = siteById(reporter.siteId)
  if (!site) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-16 text-center">
        <h1 className="mt-3 text-2xl font-bold text-ink">Site no longer exists</h1>
        <p className="mt-2 text-ink-soft">Contact the agency for a new reporting link.</p>
      </main>
    )
  }

  const gate = reportGate(site.id)
  const last = latestReportForSite(site.id)
  const mine = reportsForReporter(reporter.id)

  const submit = () => {
    const res = submitSiteReport(site.id, reporter.id)
    if (res.ok) {
      setJustReportedAt(new Date().toISOString())
      setConfirming(false)
      setTick((t) => t + 1)
    } else {
      setConfirming(false)
      setTick((t) => t + 1)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-8 pb-16">
      <p className="font-display text-xl tracking-wide text-ink">MUNDUS</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-soft">Reporter access · {reporter.name}</p>

      {justReportedAt ? (
        <Card className="mt-6 text-center">
          <CheckCircle size={44} weight="fill" className="mx-auto text-[#00a35c]" />
          <h1 className="mt-2 text-2xl font-bold text-ink">Thank you. The agency has been told.</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Reported at {new Date(justReportedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
          <Button variant="secondary" onClick={() => setJustReportedAt(null)} className="mt-4 w-full">
            Done
          </Button>
        </Card>
      ) : confirming ? (
        <Card className="mt-6">
          <h1 className="text-2xl font-bold text-ink">Report {site.name} as full?</h1>
          <p className="mt-1 text-ink-soft">The agency will be told this site is full.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setConfirming(false)} className="flex-1">Cancel</Button>
            <Button onClick={submit} className="flex-1">Yes, report</Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-6">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
            <MapPin size={16} /> Assigned waste site
          </p>
          <h1 className="mt-1 text-3xl font-bold text-ink">{site.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {last ? `Last report: ${timeAgo(last.atIso)}` : 'No reports yet'}
          </p>
          {gate.open ? (
            <Button onClick={() => setConfirming(true)} className="mt-4 w-full py-4 text-base">
              <Megaphone size={20} /> This site is full
            </Button>
          ) : (
            <div className="mt-4">
              <Button disabled className="w-full py-4 text-base opacity-60">
                <Megaphone size={20} /> This site is full
              </Button>
              <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-sm text-ink">
                You already reported this site. You can report again in {gate.retryIn}.
              </p>
            </div>
          )}
          <p className="mt-3 text-xs text-ink-soft">This link is personal to you and only works for {site.name}.</p>
        </Card>
      )}

      {mine.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-ink">Your reports</h2>
          <div className="mt-2 space-y-2">
            {mine.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-paper px-4 py-3 text-sm">
                <span className="font-medium text-ink">{new Date(r.atIso).toLocaleString()}</span>
                <Badge variant="on-schedule">Dispatched</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  )
}
