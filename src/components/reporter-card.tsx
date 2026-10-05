import { useCallback, useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { reporterLink, reporterMessage, reporterWhatsappUrl } from '@/lib/reporter-links'
import { reportersApi, type ReporterDto } from '@/lib/api'

const statusLabel: Record<string, string> = {
  pending: 'Pending agency review',
  approved: 'Approved',
  rejected: 'Rejected',
}

function elevenDigits(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11)
}

interface ReporterVM {
  id: string
  name: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
  token: string | null
  reason?: string
  whatsappLink?: string
}

export function ReporterCard({ siteId, contractorId, siteName }: { siteId: string; contractorId: string; siteName: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [liveList, setLiveList] = useState<ReporterDto[] | null>(null)

  const loadLive = useCallback(async () => {
    try {
      setLiveList(await reportersApi.list(siteId))
    } catch {
      // Keep the previous list — the nominate action surfaces errors.
    }
  }, [siteId])

  useEffect(() => {
    void loadLive()
  }, [loadLive])

  const list: ReporterVM[] = (liveList ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    phone: r.phone,
    status: (r.status === 'approved' || r.status === 'rejected' ? r.status : 'pending'),
    token: r.token ?? null,
    reason: r.rejection_reason ?? undefined,
    whatsappLink: r.whatsapp_link ?? undefined,
  }))

  const nominate = async () => {
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
      // Session id falls back to `user-<id>` when no contractor row links
      // the login — the backend only accepts real contractor UUIDs.
      await reportersApi.nominate({
        site_id: siteId,
        contractor_id: /^[0-9a-f-]{32,36}$/i.test(contractorId) ? contractorId : undefined,
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
                      {copiedId === reporter.id ? <CheckIcon size={16} /> : <CopyIcon size={16} />} {copiedId === reporter.id ? 'Copied' : 'Copy SMS'}
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
