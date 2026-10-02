export interface DemoAccount {
  email: string
  name: string
  role: string
}

/** Guild-style demo account picker. Tapping a row fills the email field —
 * passwords are never displayed. */
export function DemoAccounts({ accounts, onPick }: { accounts: DemoAccount[]; onPick: (email: string) => void }) {
  return (
    <div className="mt-4 rounded-2xl border border-hairline bg-paper p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-xs font-semibold text-ink">Demo accounts</p>
        <p className="font-mono text-[11px] text-ink-soft">Tap to fill email</p>
      </div>
      <div className="space-y-1.5">
        {accounts.map((a) => (
          <button
            key={a.email}
            type="button"
            onClick={() => onPick(a.email)}
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2 text-left hover:bg-cloud"
          >
            <span className="min-w-0">
              <span className="block truncate font-mono text-xs text-ink">{a.email}</span>
              <span className="block truncate text-xs text-ink-soft">{a.name}</span>
            </span>
            <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              {a.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
