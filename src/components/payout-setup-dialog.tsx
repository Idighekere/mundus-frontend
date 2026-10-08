import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { payoutsApi } from '@/lib/api'
import { PayoutAccountForm } from '@/components/payout-account-form'

/** Agency sets a contractor's stipend + bank details once. Saving registers
the transfer recipient with the provider (sandbox) and reuses it monthly. */
export function PayoutSetupDialog({
  contractorId,
  contractorName,
  open,
  onOpenChange,
  onSaved,
}: {
  contractorId: string
  contractorName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle>Payment setup — {contractorName}</DialogTitle>
      <p className="mt-1 text-sm text-ink-soft">
        Stipend and bank details are entered once. Saving registers the transfer recipient (sandbox) for every monthly payout.
      </p>
      <div className="mt-4">
        <PayoutAccountForm
          idPrefix="ps"
          allowStipend
          save={(body) => payoutsApi.savePayoutDetails(contractorId, body)}
          onSaved={() => onSaved()}
        />
      </div>
    </Dialog>
  )
}
