# AGENTS.md — mundus-frontend

## Stack (do not deviate)

- **Package manager: `bun` only.** Never use npm/pnpm/yarn. Install: `bun add <pkg>`, dev: `bun add -d <pkg>`, run: `bun dev`, `bun run build`.
- **Vite + React + TS** (`react-ts` template).
- **Routing: TanStack Router, file-based.** Plugin `TanStackRouterVite({ target: 'react', autoCodeSplitting: true })` in `vite.config.ts`. Routes live in `src/routes/` (`__root.tsx`, `index.tsx`, `agency/*`). Never use `react-router-dom`.
- **UI: shadcn-style primitives only** (copy into `src/components/ui/`): `button, table, input, badge, sheet, dialog, dropdown-menu, select, skeleton, sonner, avatar, separator, tabs`. Tailwind v4 (`@tailwindcss/vite`). Tokens in `src/index.css` via `@theme` — see `DESIGN.md`.
- **Icons: `@phosphor-icons/react` only. `lucide-react` is banned.** Import like `import { MagnifyingGlass, FunnelSimple } from '@phosphor-icons/react'`.
- **Tables: `@tanstack/react-table`.** Every list table needs search + column filters + sorting. Desktop row action → `Dialog`; mobile → bottom `Sheet`/`Drawer` (`vaul`).
- **Utils:** `clsx` + `tailwind-merge` (`src/lib/utils.ts` `cn()`), `class-variance-authority` for variants.

## Theme

- Source of truth: `DESIGN.md` + `src/index.css` `@theme`.
- Deep green: `primary #0B3D2C`, `primary-bright #14573F`, `primary-deep #072A1F`. Canvas `#F4F6F3`, paper `#fff`, cloud `#E3ECE4`, ink `#06170F`, ink-soft `#2E3A34`.
- Fonts: `Bebas Neue` (headings), `Inter` (body), `Sora` (buttons). Never swap.
- No new colors, no raw hex in components, no arbitrary spacing — use tokens / Tailwind theme classes (`bg-primary`, `bg-cloud`, `text-ink`, `border-hairline`).

## Project structure

```
mundus-frontend/
  DESIGN.md            # design tokens (tweaked Cable → Mundus deep green)
  AGENTS.md            # this file
  src/
    routes/            # file-based: __root.tsx, index.tsx (landing), agency/route.tsx (dashboard shell + session guard),
                     # agency/dashboard.tsx, agency/sites/$siteId.tsx (profile + timeline),
                     # agency/sites/$siteId/visits/$visitId.tsx (before/after), agency/contractors.tsx,
                     # agency/manage-dump-points.tsx, agency/sign-in.tsx (unlisted staff-only)
    components/ui/     # shadcn primitives
    components/data-table/  # reusable DataTable + filters + mobile sheet wrapper
    mocks/             # demo data only (Phase 1): dump-points.ts, contractors.ts, checkins.ts
    lib/               # utils.ts (cn), overdue.ts (now - lastClearance), haversine.ts
    index.css          # tailwind + @theme tokens
```

## Data & roles

- **Phase 1 (current): Agency only, mock data.** 6 sites (Nwaniba, IBB Way, Itam Junction, Akpan Andem, Abak Road +1), 2 contractors, overdue = `now - lastClearance > 7d`, critical > 10d. No backend client yet.
- **Later:** Contractor/supervisor mobile XP (`contractor/*`), then Reporter. One role at a time.
- Reference `../stitch-screens/<dir>/screenshot.*` for layout (don't replicate exactly) and `Mundus_Technical_Documentation.pdf` §§3–4 for MVP scope.

## Patterns to follow

- Tables: controlled `sorting/columnFilters/globalFilter`, default sort `daysOverdue desc`; `Sheet` for filters + row detail on `<md`, `Dialog` on `≥md`. Share one content component.
- Status: `Badge` variants `on-schedule` (success tint), `overdue` (amber), `critical` (error). Days-count in error color when overdue.
- Forms (add/edit dump point): shadcn `input/select` + inline validation, in `Dialog` (desktop) / `Sheet` (mobile).
- States for every view: `Skeleton` loading, filter-empty, load-error with retry.
- Touch targets ≥44px; mobile-first contractor screens.

## Commands

```bash
cd mundus-frontend
bun install
bun dev        # start
bun run build  # tsc -b && vite build
```

## Don'ts

- No `lucide-react`, no `react-router-dom`, no npm/pnpm.
- No gallery upload in future camera flow (in-app capture only — doc §5).
- Don't add backend/auth until Agency Phase 1 is done and approved.
