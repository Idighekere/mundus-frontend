import {
  createFileRoute,
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BellIcon,
  BuildingsIcon,
  CaretDoubleLeftIcon,
  CaretDoubleRight,
  GearSix,
  ListChecks,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  SignOutIcon,
  SquaresFour,
  XIcon,
} from "@phosphor-icons/react";
import { LogoMark } from "@/components/logo";
import { GlobalSearch } from "@/components/global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/session";
import { buildIntent } from "@/lib/redirect-intent";
import { buildNotices, unreadIds, useNoticesInput } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agency")({
  component: AgencyShell,
});

// Unlisted: reachable by direct URL for agency staff only — never linked publicly.
const links = [
  { to: "/agency/dashboard" as const, label: "Dashboard", icon: SquaresFour },
  {
    to: "/agency/dump-points" as const,
    label: "Dump points",
    icon: ListChecks,
  },
  {
    to: "/agency/contractors" as const,
    label: "Contractors",
    icon: BuildingsIcon,
  },
  { to: "/agency/reporters" as const, label: "Reporters", icon: MegaphoneIcon },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AgencyShell() {
  const { pathname, searchStr } = useLocation();
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  const input = useNoticesInput();
  const notices = buildNotices(
    {
      reports: input.reports,
      flagged: input.flagged,
      nominations: input.nominations,
    },
    { sites: input.sites ?? [] },
  );
  const unreadCount = unreadIds(notices).length;
  const [mobileSearch, setMobileSearch] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("mundus-sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("mundus-sidebar-collapsed", collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  if (
    pathname === "/agency/sign-in" ||
    pathname === "/agency/forgot-password" ||
    pathname === "/agency/reset-password"
  )
    return <Outlet />;

  if (!session) {
    // Same as contractor shell: only redirect inside this section; render
    // nothing during a transition away so the navigation can complete.
    if (pathname.startsWith("/agency"))
      return (
        <Navigate
          to="/agency/sign-in"
          replace
          search={{ redirect: buildIntent(pathname, searchStr) }}
        />
      );
    return null;
  }

  const logout = () => {
    signOut();
    navigate({ to: "/agency/sign-in" });
  };

  return (
    <div className="min-h-screen bg-canvas font-body text-ink-soft">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 hidden flex-col border-r border-hairline bg-primary text-white md:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-2",
            collapsed ? "justify-center px-0" : "px-5",
          )}
        >
          <Link
            to="/"
            aria-label="Mundus home"
            className="flex items-center gap-2"
          >
            <LogoMark variant="mono" className="h-9 w-9" />
            {collapsed ? null : (
              <span className="font-display text-2xl tracking-wide">
                MUNDUS
              </span>
            )}
          </Link>
          {collapsed ? null : (
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="ml-auto flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            >
              <CaretDoubleLeftIcon size={18} />
            </button>
          )}
        </div>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="mx-auto mb-1 flex min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          >
            <CaretDoubleRight size={18} />
          </button>
        ) : null}
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              title={collapsed ? l.label : undefined}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-0",
                pathname.startsWith(l.to) && "bg-white/15 text-white",
              )}
            >
              <l.icon size={20} /> {collapsed ? null : l.label}
            </Link>
          ))}
        </nav>
        <div
          className={cn("border-t border-white/15", collapsed ? "p-2" : "p-4")}
        >
          {collapsed ? (
            <Link
              to="/agency/settings"
              aria-label="Settings"
              title="Settings"
              className={cn(
                "mb-1 flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border text-white/75 hover:bg-white/10 hover:text-white",
                pathname.startsWith("/agency/settings")
                  ? "border-white/50 bg-white/10 text-white"
                  : "border-transparent",
              )}
            >
              <GearSix size={18} />
            </Link>
          ) : (
            <Link
              to="/agency/settings"
              className={cn(
                "mb-1 flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white",
                pathname.startsWith("/agency/settings")
                  ? "border-white/50 bg-white/10 font-semibold text-white"
                  : "border-transparent",
              )}
            >
              <GearSix size={18} /> Settings
            </Link>
          )}
          {collapsed ? (
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <SignOutIcon size={18} />
            </button>
          ) : (
            <button
              onClick={logout}
              className="flex min-h-[44px] w-full cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              <SignOutIcon size={18} /> Log out
            </button>
          )}
        </div>
      </aside>

      <div className={cn(collapsed ? "md:pl-[76px]" : "md:pl-64")}>
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-hairline bg-paper/95 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4">
            <Link
              to="/"
              aria-label="Mundus home"
              className="flex items-center gap-2 md:hidden"
            >
              <LogoMark className="h-7 w-7" />
              <span className="font-display text-lg tracking-wide text-ink">
                MUNDUS
              </span>
            </Link>
            <div className="hidden min-w-0 flex-1 md:block">
              <GlobalSearch compact />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setMobileSearch((v) => !v)}
                aria-label={mobileSearch ? "Close search" : "Open search"}
                aria-expanded={mobileSearch}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full text-ink hover:bg-cloud md:hidden"
              >
                {mobileSearch ? <XIcon size={20} /> : <MagnifyingGlassIcon size={20} />}
              </button>
              <Link
                to="/agency/notifications"
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} unread`
                    : "Notifications"
                }
                className="relative flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full text-ink hover:bg-cloud"
              >
                <BellIcon size={20} />
                {unreadCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#be3b3b] px-1 text-[11px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Open profile menu"
                    className="flex cursor-pointer items-center rounded-full hover:bg-cloud"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                      {initials(session.name)}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <p className="truncate text-sm font-semibold text-ink">
                      {session.name}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {session.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => navigate({ to: "/agency/settings" })}
                  >
                    <GearSix size={18} /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={logout}>
                    <SignOutIcon size={18} /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {mobileSearch ? (
            <div className="px-4 pb-3 md:hidden">
              <GlobalSearch compact />
            </div>
          ) : null}
        </header>

        <main className="mx-auto max-w-[1100px] px-4 py-6 pb-24 md:py-8 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile bottom bar — docked, rounded top corners */}
        <nav className="fixed inset-x-0 bottom-0 z-40 overflow-hidden border-t border-hairline bg-paper px-2 pb-[env(safe-area-inset-bottom)] pt-2 [border-radius:24px_24px_0_0] md:hidden">
          <div className="grid grid-cols-4 gap-1">
            {links.map((l) => {
              const active = pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] text-ink-soft",
                    active ? "font-bold text-primary" : "font-medium",
                  )}
                >
                  <l.icon size={22} weight={active ? "fill" : "regular"} />{" "}
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
