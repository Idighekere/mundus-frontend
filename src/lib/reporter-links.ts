/** Share-link helpers for approved reporters. Pure URL builders — no state. */

export function reporterLink(token: string): string {
  return `${window.location.origin}/r/${token}`
}

export function reporterMessage(siteName: string, token: string): string {
  return `Mundus: you've been approved as reporter for ${siteName}. Report a full site here: ${reporterLink(token)}`
}

// Normalize an NG phone number for wa.me (0803… → 234803…).
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return `234${digits.slice(1)}`
  return digits
}

export function reporterWhatsappUrl(phone: string, siteName: string, token: string): string {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(reporterMessage(siteName, token))}`
}
