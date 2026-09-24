# Mundus Design System

Adapted from the Cable skill for Mundus, a waste-evacuation verification platform.
Brand retinted to **deep green**. All token names and structure preserved so
Stitch-screen layouts and Traka-inspired mobile XP map 1:1.

```yaml
brand: Mundus
mood: Trusted, civic, and field-ready technology for waste evacuation verification.
scheme: light

colors:
  primary: "#0B3D2C"
  primary-bright: "#14573F" # Derived for hover
  primary-deep: "#072A1F" # Derived for pressed
  on-primary: "#ffffff"
  ink: "#06170F"
  ink-soft: "#2E3A34"
  on-ink: "#ffffff"
  canvas: "#F4F6F3"
  paper: "#ffffff"
  cloud: "#E3ECE4"
  hairline: "#DFE5DE"
  link: "#0B3D2C"
  link-pressed: "#072A1F"
  accent-highlight: "#ffa034"
  success: "#00C46A"
  error: "#E5484D"

typography:
  display-xl: { fontFamily: "Bebas Neue", fontSize: 83px, fontWeight: 400, lineHeight: 1.1, textTransform: "capitalize" }
  display-lg: { fontFamily: "Bebas Neue", fontSize: 40px, fontWeight: 400, lineHeight: 1.2 }
  display-md: { fontFamily: "Bebas Neue", fontSize: 28px, fontWeight: 400, lineHeight: 1.2 }
  display-sm: { fontFamily: "Bebas Neue", fontSize: 14px, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0.5px, textTransform: "uppercase" }
  body-lg: { fontFamily: "Inter", fontSize: 23px, fontWeight: 400, lineHeight: 1.5 }
  body-md: { fontFamily: "Inter", fontSize: 16px, fontWeight: 400, lineHeight: 1.6 }
  body-emphasis: { fontFamily: "Inter", fontSize: 16px, fontWeight: 600, lineHeight: 1.5 }
  caption-md: { fontFamily: "Inter", fontSize: 14px, fontWeight: 500, lineHeight: 1.5 }
  button-md: { fontFamily: "Sora", fontSize: 14px, fontWeight: 700, lineHeight: 1 }

rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 20px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 40px
  section: 96px

shadows:
  none: "none"
  soft-lift: "0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)"
  card: "0px 4px 32px 0px rgba(0, 0, 0, 0.08)"
  button: "0px 4.6px 18.5px 0px rgba(0, 0, 0, 0.16)"

motion:
  duration-fast: "150ms"
  duration-base: "300ms"
  ease-standard: "cubic-bezier(0.4, 0, 0.2, 1)"
  transition-fast: "all {motion.duration-fast} {motion.ease-standard}"
  transition-transform: "transform {motion.duration-base} {motion.ease-standard}"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    color: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
    shadow: "{shadows.button}"
    cursor: "pointer"
  button-primary-hover:
    backgroundColor: "{colors.primary-bright}"
  button-secondary:
    backgroundColor: "{colors.cloud}"
    color: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
    shadow: "{shadows.none}"
    cursor: "pointer"
  button-secondary-hover:
    backgroundColor: "#cfdccf" # Slightly darker cloud
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    shadow: "{shadows.card}"
  navigation-link:
    color: "{colors.ink-soft}"
    typography: "{typography.caption-md}"
    padding: "{spacing.xs} {spacing.sm}"
    cursor: "pointer"
  navigation-link-hover:
    color: "{colors.ink}"
  input:
    backgroundColor: "{colors.paper}"
    color: "{colors.ink}"
    typography: "{typography.body-md}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    cursor: "text"
  input-focus:
    border: "1px solid {colors.primary}"
    boxShadow: "0 0 0 2px rgba(11, 61, 44, 0.2)"
```

## Tailwind mapping (Tailwind v4 `@theme`)

Implemented in `src/index.css`:

- `--color-primary: #0B3D2C`, `--color-primary-bright: #14573F`, `--color-primary-deep: #072A1F`
- `--color-canvas: #F4F6F3`, `--color-paper: #fff`, `--color-cloud: #E3ECE4`, `--color-hairline: #DFE5DE`
- `--color-ink: #06170F`, `--color-ink-soft: #2E3A34`
- `--font-display: Bebas Neue`, `--font-body: Inter`, `--font-action: Sora`
- Usage: `bg-primary text-on-primary`, `bg-canvas`, `bg-paper`, `bg-cloud`, `text-ink`, `border-hairline`, `font-display`, etc.

## Visual Theme & Atmosphere

Mundus keeps Cable's reliable, organic efficiency but shifts it civic: deep-green
surfaces for agency trust, off-white canvas for readability in bright field
conditions, Traka-like generous cards for contractor mobile XP.

**Key Characteristics:**
*   **Deep-green & civic palette:** dark green `{colors.primary}` + off-whites (`{colors.canvas}`, `{colors.paper}`) + green-tinted grey (`{colors.cloud}`).
*   **High-contrast typography:** `Bebas Neue` headlines + `Inter` body + `Sora` buttons. Never swap roles.
*   **Generous whitespace:** `{spacing.section}` between bands; cards breathe.
*   **Soft elevation:** `{shadows.card}` on `paper` surfaces only.
*   **Status colors:** `success`/`error` reserved for overdue/critical badges; `accent-highlight` only for small eyebrow text.

## Color Usage Rules

*   `{colors.primary}` for primary CTAs only (1–2 per viewport). Dark bands use `{colors.on-primary}` text.
*   `{colors.ink}` headlines only; `{colors.ink-soft}` body/nav.
*   `{colors.canvas}` default page bg; `{colors.paper}` elevated cards/dialogs; `{colors.cloud}` alternate bands + secondary buttons.
*   `{colors.accent-highlight}` pre-header eyebrow only. Never buttons.
*   Borders always `{colors.hairline}`.
*   **Never introduce a new color.** Reuse tokens.

## Typography Hierarchy

| Role | Token | Use |
| ---- | ----- | --- |
| Extra Large Display | `{typography.display-xl}` | Landing H1, once |
| Large Display | `{typography.display-lg}` | Section H2 |
| Medium Display | `{typography.display-md}` | H3 / card titles |
| Small Display | `{typography.display-sm}` | Eyebrow, uppercase |
| Large Body | `{typography.body-lg}` | Intro / lede |
| Medium Body | `{typography.body-md}` | Default paragraph |
| Emphasized Body | `{typography.body-emphasis}` | Strong labels |
| Medium Caption | `{typography.caption-md}` | Nav, metadata |
| Medium Button | `{typography.button-md}` | All buttons (`Sora`) |

## Component Patterns

**Primary Button** — `{colors.primary}` bg, `on-primary` `Sora` text, `{rounded.lg}`, `20px 24px`, `{shadows.button}`, hover `{colors.primary-bright}`.

**Secondary Button** — `{colors.cloud}` bg, `{colors.primary}` text, same shape, no shadow, hover darker cloud.

**Card** — `{colors.paper}`, `{rounded.xl}`, `{spacing.lg}`, `{shadows.card}`.

**Navigation Link** — `{typography.caption-md}`, `{colors.ink-soft}` → `{colors.ink}` hover.

**Input** — paper bg, hairline border, `{rounded.md}`, focus border primary + `rgba(11,61,44,0.2)` ring.

**Data table (Mundus addition):** shadcn `Table` on `paper` card; header `caption-md` uppercase ink-soft; row hover `cloud/50`; status `Badge`; overdue rows get `error` text for days-count only.

**Drawer / Sheet / Dialog (Mundus addition):** desktop uses `Dialog` (add/edit dump point, quick view); mobile uses bottom `Sheet`/`Drawer` (vaul) for filters + row detail. Same content component, different wrapper by breakpoint.

## Layout & Spacing

Bands alternate `canvas` / `cloud`, CTA band `primary`. Max width 1200px centered.
Grid gaps `{spacing.xl}`–`{spacing.xxl}`. All padding/margins from `{spacing.*}`.

## Do's and Don'ts

Do: compose from canvas/cloud/paper; enforce Bebas/Inter/Sora roles; use spacing tokens; one primary CTA per view; `cursor: pointer` on interactive, `text` on inputs; card shadow only on paper; Sora in buttons; alternate bands.

Don't: arbitrary shadows/colors/fonts/spacing; raw hex; Bebas body / Inter headline; default cursors; overuse primary; shadows on non-elevated elements; skip hover/focus.

## Responsive Behavior

| Breakpoint | Range | Behavior |
| ---------- | ----- | -------- |
| Mobile | < 768px | Single column, hamburger/bottom-nav, display-xl scaled down, tables → cards + bottom sheet detail, min touch 44px |
| Tablet | 768–1023px | 2-col grids, collapsed nav |
| Desktop | 1024–1279px | Full nav, 2–3 col, constrained 1200px |
| Desktop-Large | ≥1280px | Same + more whitespace |

## Iteration Guide

1. Foundation: `canvas` base, bands separated by `{spacing.section}`.
2. Rhythm: alternate `cloud`; CTA band `primary` + `on-primary`.
3. Type: H1 display-xl, sections display-lg, body body-md.
4. Actions: one primary, rest secondary/link.
5. Cards for grouped content.
6. Tables: search + filters + sorting; mobile sheet, desktop dialog.
7. Hover/focus + `transition-fast`.
8. Cursors explicit.
9. Final check: no raw hex/spacing, no lucide, tokens only.
