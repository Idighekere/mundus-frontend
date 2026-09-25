import { useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import {
  nominateReporter, reporterForSite, reporterMessage, reporterWhatsappUrl, useReporters,
} from '@/mocks/reporter-store'
import { siteById } from '@/mocks/data'

const statusLabel: Record<string, string> = {
  pending: 'Pending agency review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export function ReporterCard({ siteId, contractorId }: { siteId: string; contractorId: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  useReporters()
  const reporter = reporterForSite(siteId)
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

  const copyMessage = async () => {
    if (!reporter?.token) return
    const text = reporterMessage(siteName, reporter.token)
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
    setCopied(true)
  }

  return (
    <Card className="mt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-ink">Site reporter</p>
        {reporter ? (
          <Badge variant={reporter.status === 'approved' ? 'on-schedule' : reporter.status === 'rejected' ? 'critical' : 'neutral'}>
            {statusLabel[reporter.status]}
          </Badge>
        ) : (
          <Badge variant="neutral">None yet</Badge>
        )}
      </div>

      {reporter ? (
        <div className="mt-2 text-sm">
          <p className="font-semibold text-ink">{reporter.name} · {reporter.phone}</p>
          {reporter.status === 'pending' ? (
            <p className="mt-1 text-ink-soft">Waiting for agency approval. Once approved, you send them their personal reporting link below.</p>
          ) : reporter.status === 'approved' && reporter.token ? (
            <div className="mt-2 rounded-xl bg-canvas p-3">
              <p className="text-sm font-semibold text-ink">Send the reporter their link</p>
              <p className="mt-1 rounded-lg bg-paper px-2.5 py-2 font-mono text-[11px] leading-relaxed text-ink">
                {reporterMessage(siteName, reporter.token)}
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" onClick={copyMessage} className="flex-1">
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy SMS'}
                </Button>
                <Button
                  asChild
                  className="flex-1 bg-[#1faa55] hover:bg-[#178a44]"
                >
                  <a
                    href={reporterWhatsappUrl(reporter.phone, siteName, reporter.token)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Send via WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          ) : reporter.status === 'approved' ? (
            <p className="mt-1 text-ink-soft">Approved — they can report this site as full from their personal link.</p>
          ) : (
            <p className="mt-1 text-ink-soft">
              Rejected{reporter.reason ? `: ${reporter.reason}` : ''}. You may nominate someone else below.
            </p>
          )}
          {reporter.status === 'rejected' ? (
            <div className="mt-3 space-y-2 border-t border-hairline pt-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reporter name" aria-label="Reporter name" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" aria-label="Phone number" />
              {error ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#b42323]">{error}</p> : null}
              <Button onClick={nominate} className="w-full">Nominate reporter</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-ink-soft">
            Nominate someone nearby (shop owner, stage operator) to flag this site as full. One reporter per site — the agency approves.
          </p>
          <div className="mt-3 space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reporter name" aria-label="Reporter name" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" aria-label="Phone number" />
            {error ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#b42323]">{error}</p> : null}
            {done ? <p className="rounded-lg bg-[#e3f4ea] px-3 py-2 text-sm text-primary">Nomination sent for agency review.</p> : null}
            <Button onClick={nominate} className="w-full">Nominate reporter</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
