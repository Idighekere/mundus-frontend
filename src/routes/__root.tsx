import {
  createRootRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { LogoMark } from "@/components/logo";
import { NotFoundPage } from "@/components/not-found";
import { ErrorPage } from "@/components/error-page";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ reset }) => <ErrorPage onReset={reset} />,
});

function RootLayout() {
  const { pathname } = useLocation();
  // App sections + bespoke landing + reporter links render their own shells — no public chrome there.
  if (
    pathname === "/" ||
    pathname.startsWith("/agency") ||
    pathname.startsWith("/contractor") ||
    pathname.startsWith("/r/")
  )
    return <Outlet />;

  return (
    <div className="min-h-screen bg-canvas font-body text-ink-soft">
      <header className="border-b border-hairline bg-paper">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark className="h-9 w-9" />
            <span className="font-display text-2xl tracking-wide text-ink">
              MUNDUS
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            <Link
              to="/agency/dashboard"
              className="rounded-lg px-3 py-2 hover:bg-cloud hover:text-ink [&.active]:bg-cloud [&.active]:text-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/agency/contractors"
              className="rounded-lg px-3 py-2 hover:bg-cloud hover:text-ink [&.active]:bg-cloud [&.active]:text-primary"
            >
              Contractors
            </Link>
            <Link
              to="/agency/dump-points"
              className="rounded-lg px-3 py-2 hover:bg-cloud hover:text-ink [&.active]:bg-cloud [&.active]:text-primary"
            >
              {" "}
              Dump Points
            </Link>
            <Link
              to="/agency/dashboard"
              className="ml-2 rounded-xl bg-primary px-5 py-2.5 font-action text-sm font-bold text-on-primary hover:bg-primary-bright"
            >
              Open dashboard
            </Link>
          </nav>
          <Link
            to="/agency/dashboard"
            className="rounded-xl bg-primary px-5 py-2.5 font-action text-sm font-bold text-on-primary md:hidden"
          >
            Open dashboard
          </Link>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-hairline bg-paper">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-ink">Mundus — waste evacuation verification</p>
          <p>Seeded demo data. No live government integration.</p>
        </div>
      </footer>
    </div>
  );
}
