import { useCallback, useEffect, useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import {
  nominateReporter, reportersForSite, reporterLink, reporterMessage, reporterWhatsappUrl, useReporters,
  type Reporter,
} from '@/mocks/reporter-store'
import { reportersApi, type ReporterDto } from '@/lib/api'
import { siteById } from '@/mocks/data'

const statusLabel: Record<string, string> = {
  pending: 'Pending agency review',
  approved: 'Approved',
  rejected: 'Rejected',
}

function elevenDigits(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11)
}

export function ReporterCard({ siteId, contractorId, siteName: siteNameProp, live }: { siteId: string; contractorId: string; siteName?: string; live?: boolean }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [liveList, setLiveList] = useState<ReporterDto[] | null>(null)
  useReporters()
  const siteName = siteNameProp ?? siteById(siteId)?.name ?? siteId

  const loadLive = useCallback(async () => {
    try {
      setLiveList(await reportersApi.list(Number(siteId)))
    } catch {
      // Keep the previous list — the nominate action surfaces errors.
    }
  }, [siteId])

  useEffect(() => {
    if (live) void loadLive()
  }, [live, loadLive])

  const list: Reporter[] = live && liveList
    ? liveList.map((r) => ({
      id: String(r.id),
      name: r.name,
      phone: r.phone,
      siteId: String(r.site_id),
      contractorId: r.contractor_id !== null && r.contractor_id !== undefined ? String(r.contractor_id) : '',
      status: (r.status === 'approved' || r.status === 'rejected' || r.status === 'revoked' ? r.status : 'pending') as Reporter['status'],
      token: r.token ?? null,
      reason: r.rejection_reason ?? undefined,
      updatedAt: r.updated_at,
      whatsappLink: r.whatsapp_link ?? undefined,
    }))
    : reportersForSite(siteId)

  const nominate = async () => {
    if (live) {
      const trimmed = name.trim()
      const digits = phone.replace(/\D/g, '')
      if (trimmed.length < 2) {
        setError('Reporter name needs at least 2 characters.')
        return
      }
      if (digits.length !== 11) {
        setError('Phone number must be exactly 11 digits.')
        return
      }
      try {
        const cid = Number(contractorId)
        await reportersApi.nominate({
          site_id: Number(siteId),
          contractor_id: Number.isFinite(cid) ? cid : undefined,
          name: trimmed,
          phone: digits,
        })
        setError('')
        setName('')
        setPhone('')
        setDone(true)
        await loadLive()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nomination failed. Try again.')
      }
      return
    }
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

  const copyText = async (reporterId: string, text: string) => {
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
              {reporter.status === 'approved' && (reporter.token || reporter.whatsappLink) ? (
                <div className="mt-2">
                  <a
                    href={reporter.token ? reporterLink(reporter.token) : (reporter.whatsappLink ?? '#')}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all rounded-lg bg-paper px-2.5 py-2 font-mono text-[11px] leading-relaxed text-primary hover:underline"
                  >
                    {reporter.token ? reporterMessage(siteName, reporter.token) : reporter.whatsappLink}
                  </a>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => void copyText(
                        reporter.id,
                        reporter.token ? reporterMessage(siteName, reporter.token as string) : (reporter.whatsappLink ?? ''),
                      )}
                      className="flex-1"
                    >
                      {copiedId === reporter.id ? <Check size={16} /> : <Copy size={16} />} {copiedId === reporter.id ? 'Copied' : 'Copy SMS'}
                    </Button>
                    <Button asChild className="flex-1 bg-[#1faa55] hover:bg-[#178a44]">
                      <a
                        href={reporter.token ? reporterWhatsappUrl(reporter.phone, siteName, reporter.token) : (reporter.whatsappLink ?? '#')}
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
          {error ? <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#be3b3b]">{error}</p> : null}
          {done ? <p className="rounded-lg bg-[#e6f5ee] px-3 py-2 text-sm text-primary">Nomination sent for agency review.</p> : null}
          <Button onClick={nominate} className="w-full">Nominate reporter</Button>
        </div>
      </div>
    </Card>
  )
}
