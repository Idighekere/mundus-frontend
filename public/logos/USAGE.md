# Mundus Logo

Single final mark: recycle loop + verification check (`logo-*`).
Retired concepts 1–3 (globe, pin, M) were deleted.

## Files

- `logo-horizontal.svg` — icon + `MUNDUS` wordmark (DM Sans 700, ink).
- `logo-icon.svg` — symbol only. Default UI mark.
- `logo-mono-dark.svg` — single-color ink. Light-background print/docs.
- `logo-mono-light.svg` — single-color white, knocked-out check.
  Dark surfaces (`primary`, `primary-deep`).

## Wiring (`src/components/logo.tsx` → `LogoMark`)

| Surface | Usage |
|---|---|
| Landing nav + footer (`routes/index.tsx`) | color mark + DM Sans text |
| Fallback shell (`routes/__root.tsx`) | color mark + text |
| Agency sidebar dark (`routes/agency/route.tsx`) | mono mark + text |
| Agency mobile header, paper (`routes/agency/route.tsx`) | color mark + text |
| Contractor mobile header, dark (`routes/contractor/route.tsx`) | mono mark + text |
| Contractor desktop header, paper (`routes/contractor/route.tsx`) | color mark + text |
| Reporter page (`routes/r.$token.tsx`) | color mark + text |
| Sign-in / request-access dark panels | mono mark + text |

`public/favicon.svg` = copy of `logo-icon.svg`. `index.html` already
points at `/favicon.svg`.

## Artwork provenance

Recycle + check artwork: Phosphor Icons (MIT License, © 2020 Phosphor
Icons), `Recycle` fill + `CheckFat` fill from the
`@phosphor-icons/react` dependency, recolored to Mundus tokens.
Recycle stems boldened with a same-color stroke; badge centered on the
loop incenter (measured equal clearance all sides).

## Rules (from DESIGN.md)

- Wordmark uses DM Sans (loaded via Google Fonts in `src/index.css`).
- Clear space = check height on all sides. Minimums: icon 16px,
  horizontal lockup 120px wide.
- Never stretch, recolor, add shadows, or place on busy photos without
  the mono treatment. Status colors are for badges, never the logo.
