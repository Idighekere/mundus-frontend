# Mundus Design System

Tezera-based system adapted for Mundus, a waste-evacuation verification platform.
**Brand greens stay constant** — primary, ink, and surfaces remain Mundus deep
green. Everything else (type duet, radii, spacing, shadows, component patterns,
status colors) follows Tezera.

```yaml
brand: Mundus
mood: Calm, professional verification — human warmth with streamlined efficiency.
scheme: light

colors:
  primary: "#0B3D2C" # constant — Mundus deep green, primary CTAs only
  primary-bright: "#14573F" # hover
  primary-deep: "#072A1F" # pressed
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
  accent-highlight: "#ffa034" # eyebrow text only, never buttons
  success: "#1D6F42"
  success-surface: "#E6F5EE"
  warning: "#C08014"
  warning-surface: "#FDF3C4"
  error: "#BE3B3B"

typography:
  display-xl: { fontFamily: "DM Sans", fontSize: 68px, fontWeight: 700, lineHeight: 1.1 }
  display-lg: { fontFamily: "DM Sans", fontSize: 48px, fontWeight: 700, lineHeight: 1.2 }
  display-md: { fontFamily: "DM Sans", fontSize: 32px, fontWeight: 700, lineHeight: 1.25 }
  body-lg: { fontFamily: "DM Sans", fontSize: 20px, fontWeight: 400, lineHeight: 1.5 }
  body-md: { fontFamily: "DM Sans", fontSize: 16px, fontWeight: 400, lineHeight: 1.6 }
  body-sm: { fontFamily: "DM Sans", fontSize: 14px, fontWeight: 400, lineHeight: 1.5 }
  caption-md: { fontFamily: "DM Sans", fontSize: 11px, fontWeight: 500, lineHeight: 1, letterSpacing: "0.5px", textTransform: "uppercase" }
  button-md: { fontFamily: "DM Sans", fontSize: 14px, fontWeight: 500, lineHeight: 1.6 }
  link-md: { fontFamily: "DM Sans", fontSize: 16px, fontWeight: 500, lineHeight: 1 }

rounded:
  sm: 4px
  md: 8px
  lg: 14px
  xl: 24px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

shadows:
  none: "none"
  soft-lift: "rgba(13, 12, 35, 0.06) 0px 2px 6px 0px"
  card: "rgba(13, 12, 35, 0.18) 0px 10px 30px -22px"
  modal: "rgba(13, 12, 35, 0.35) 0px 18px 50px -28px"

motion:
  duration-fast: 150ms
  duration-base: 300ms
  ease-standard: "cubic-bezier(0.4, 0, 0.2, 1)"
  transition-fast: "all {motion.duration-fast} {motion.ease-standard}"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    color: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
    typography: "{typography.button-md}"
    shadow: "{shadows.none}"
    cursor: "pointer"
  button-primary-hover:
    backgroundColor: "{colors.primary-bright}"
    shadow: "{shadows.soft-lift}"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    shadow: "{shadows.card}"
    border: "1px solid {colors.hairline}"
  badge-success:
    backgroundColor: "{colors.success-surface}"
    color: "{colors.success}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    typography: "{typography.body-sm}"
  badge-warning:
    backgroundColor: "{colors.warning-surface}"
    color: "{colors.warning}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    typography: "{typography.body-sm}"
  badge-error:
    backgroundColor: "#FDE8E8"
    color: "{colors.error}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    typography: "{typography.body-sm}"
```

## Tailwind mapping (Tailwind v4 `@theme`)

Implemented in `src/index.css`:

- Brand (constant): `--color-primary: #0B3D2C`, `--color-primary-bright: #14573F`, `--color-primary-deep: #072A1F`, `--color-canvas: #F4F6F3`, `--color-paper: #fff`, `--color-cloud: #E3ECE4`, `--color-hairline: #DFE5DE`, `--color-ink: #06170F`, `--color-ink-soft: #2E3A34`
- Status: `--color-success: #1D6F42`, `--color-success-surface: #E6F5EE`, `--color-warning: #C08014`, `--color-warning-surface: #FDF3C4`, `--color-error: #BE3B3B`
- Fonts: `--font-display/--font-body/--font-action: DM Sans` (single typeface)
- Radii: `--radius-sm/md/lg/xl/2xl: 4/8/14/24/24px`

## Rules (Tezera, Mundus-tinted)

- DM Sans for everything, including `display-*`. No exceptions.
- `{colors.primary}` for the single most important CTA per view; hover `{colors.primary-bright}` + `{shadows.soft-lift}`.
- Status always via badge pairs (success/warning/error) — never raw color alone.
- All surfaces from canvas/paper/cloud; all spacing from `{spacing.*}`; shadows only from `{shadows.*}`; `cursor: pointer` on every interactive element; 44px minimum touch targets.
- Never introduce a new color.
