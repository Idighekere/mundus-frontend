import { useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import {
  nominateReporter, reportersForSite, reporterMessage, reporterWhatsappUrl, useReporters,
} from '@/mocks/reporter-store'
import { siteById } from '@/mocks/data'

const statusLabel: Record<string, string> = {
  pending: 'Pending agency review',
  approved: 'Approved',
  rejected: 'Rejected',
}

function elevenDigits(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11)
}

export function ReporterCard({ siteId, contractorId }: { siteId: string; contractorId: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  useReporters()
  const list = reportersForSite(siteId)
  const siteName = siteById(siteId)?.name ?? siteId

  const nominate = () => {
    const res = nominateReporter({ name, phone, siteId, contractorId })
    if (!res.ok) {
      setError(res.error)
      return
    }
    setError('')
    setName('')
    setPhone('')
    setDone(true)
  }

  const copyMessage = async (reporterId: string, token: string) => {
    const text = reporterMessage(siteName, token)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopiedId(reporterId)
  }

  return (
    <Card className="mt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-ink">Site reporters</p>
        <Badge variant="neutral">{list.length === 0 ? 'None yet' : `${list.length} reporter${list.length > 1 ? 's' : ''}`}</Badge>
      </div>

      {list.length > 0 ? (
        <div className="mt-2 space-y-3">
          {list.map((reporter) => (
            <div key={reporter.id} className="rounded-xl bg-canvas p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{reporter.name} · {reporter.phone}</p>
                <Badge variant={reporter.status === 'approved' ? 'on-schedule' : reporter.status === 'rejected' ? 'critical' : 'neutral'}>
                  {statusLabel[reporter.status]}
                </Badge>
              </div>
              {reporter.status === 'pending' ? (
                <p className="mt-1 text-xs text-ink-soft">Waiting for agency approval.</p>
              ) : null}
              {reporter.status === 'rejected' ? (
                <p className="mt-1 text-xs text-ink-soft">
                  Rejected{reporter.reason ? `: ${reporter.reason}` : ''}.
                </p>
              ) : null}
              {reporter.status === 'approved' && reporter.token ? (
                <div className="mt-2">
                  <p className="rounded-lg bg-paper px-2.5 py-2 font-mono text-[11px] leading-relaxed text-ink">
                    {reporterMessage(siteName, reporter.token)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="secondary" onClick={() => copyMessage(reporter.id, reporter.token as string)} className="flex-1">
                      {copiedId === reporter.id ? <Check size={16} /> : <Copy size={16} />} {copiedId === reporter.id ? 'Copied' : 'Copy SMS'}
                    </Button>
                    <Button asChild className="flex-1 bg-[#1faa55] hover:bg-[#178a44]">
                      <a
                        href={reporterWhatsappUrl(reporter.phone, siteName, reporter.token)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 border-t border-hairline pt-3">
        <p className="text-sm text-ink-soft">
          Nominate someone nearby to flag this site as full. You can add more than one reporter per site — but once one reports, the site is locked for 12 hours for everyone.
        </p>
        <div className="mt-2 space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reporter name" aria-label="Reporter name" />
          <Input
            value={phone}
            onChange={(e) => setPhone(elevenDigits(e.target.value))}
            placeholder="Phone number (11 digits)"
            inputMode="numeric"
            maxLength={11}
            aria-label="Phone number"
          />
          {error ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#b42323]">{error}</p> : null}
          {done ? <p className="rounded-lg bg-[#e3f4ea] px-3 py-2 text-sm text-primary">Nomination sent for agency review.</p> : null}
          <Button onClick={nominate} className="w-full">Nominate reporter</Button>
        </div>
      </div>
    </Card>
  )
}
