# Design system

Rasikh matches the design language of two references and uses its own name, mark, accent and copy.

- **Dashboards** (employer, landlord, bank, expansion): the OpenAI Platform pack. Dense, left-aligned, sidebar-driven, one white sheet on a grey frame.
- **Newcomer app and agent feed**: the ChatGPT pack. Conversational, one centred 768px column, pill controls. Built in Session 3 from the same tokens.

The system in code: `apps/web/src/app/globals.css` (tokens), `apps/web/tailwind.config.ts` (scale), `apps/web/src/components/ui` (primitives), `apps/web/src/components/shell` (shell). The live specimen is `/design-system`. Evidence and measurements are in `docs/reference-audit/`.

## Principles

1. **Chrome is neutral, signal is coloured.** Every control, row, border and header is grey or near-black. Colour appears only as status, data, focus and one accent.
2. **One accent, used sparingly.** Petrol `#0b6b78` (dark `#62c1ce`). It marks focus, links, "employer backed", the current roadmap step and data series. Never a nav row, a primary button or a tab.
3. **One emphasis per screen.** The near-black primary button is the only strong fill.
4. **Space and hairlines, not cards.** Sections are separated by whitespace and 1px rules. A bordered box groups rows or small metrics and is never filled or shadowed.
5. **Sentence case everywhere.** Short, specific, functional copy. No marketing language in the product.

## Reference scale

The reference captures are a 1512px viewport resized to 1920px, so **1 CSS px = 1.27 screenshot px**. This was fixed by two known ChatGPT constants (260px sidebar = 330px, 768px thread column = 974px) and confirmed by clean Platform values (45px table rows, 36px nav pitch, 32px controls). Every number here is CSS px. Geometry tokens are written in `rem` so one root `font-size` rescales the UI.

`node scripts/capture.mjs --path <route>` reproduces a reference-sized capture (1512x949 at 1.27x = 1920x1205) in light or dark, LTR or RTL, for side-by-side comparison.

## Colour

Tokens are RGB channels, so Tailwind alpha works (`bg-fg/10`). Dark is a tonal ladder, not an inversion. All values below were measured from the references except where marked.

| Token | Light | Dark | Role |
|---|---|---|---|
| `canvas` | `#f3f3f3` | `#131313` | Frame: sidebar and top bar |
| `surface` | `#ffffff` | `#212121` | The content sheet and cards |
| `raised` | `#ffffff` | `#303030` | Menus, dialogs, popovers |
| `subtle` | `#f9f9f9` | `#262626` | Table header band, row hover (estimated dark) |
| `hover` | `#ebebeb` | `#2a2a2a` | Hover plate (estimated) |
| `selected` | `#e0e0e0` | `#303030` | Active nav row |
| `track` | `#eeeeee` | `#303030` | Segmented track, neutral label fill |
| `line` | `#f0f0f0` | `#3a3a3a` | Dividers, header rule |
| `edge` | `#ececec` | `#1c1c1c` | Sheet and card outline |
| `line-strong` | `#d5d5d5` | `#555555` | Control outline |
| `fg` | `#0d0d0d` | `#ffffff` | Text |
| `fg-secondary` | `#444444` | `#c9c9c9` | Secondary text |
| `fg-tertiary` | `#6e6e6e` | `#9e9e9e` | Group labels, descriptions |
| `fg-placeholder` | `#767676` | `#8c8c8f` | Placeholders |
| `solid` / `solid-fg` | `#171717` / `#ffffff` | `#f3f3f3` / `#000000` | Primary button. Inverts in dark |
| `accent` / `accent-soft` | `#0b6b78` / `#e3f1f3` | `#62c1ce` / `#16313a` | Single accent (Rasikh's own) |

Status, always tint fill with same-hue text and no border:

| Tone | Light fill / text | Dark fill / text |
|---|---|---|
| success | `#e2f3e6` / `#0b672b` | `#1e3528` / `#35c387` |
| warning | `#ffe8c5` / `#7a520f` | `#453823` / `#ffae2d` |
| danger | `#ffe2e3` / `#871d1b` | `#402423` / `#ff6b64` |

Solid fills (destructive button, toasts): danger `#e12e2a`, success `#008735`.

**Deliberate deviations from the references, for accessibility.** Tertiary text is `#6e6e6e`, not the reference `#848484` (3.4:1 on the grey frame). Placeholders are 4.5:1. An axe-core audit of the components page passes WCAG 2.1 AA in both themes.

## Typography

Font: **Geist Variable** (self-hosted via `@fontsource-variable/geist`), mono **Geist Mono Variable**. The reference grotesque is proprietary. Geist was chosen after rendering the leading free candidates beside reference crops at matched size: its widths land within 1% of the reference (Inter ran 3.5% wide) and it has the same neutral letterforms. Arabic companion font is chosen in Session 3.

| Class | Size / line | Use |
|---|---|---|
| `text-caption` | 12 / 16 | Badges, helper text, timestamps |
| `text-label` | 13 / 18 | Group labels, table headers, descriptions |
| `text-body` | 14 / 20 | Default text, nav, controls, table cells |
| `text-title` | 16 / 24 | Dialog and empty-state titles |
| `text-heading` | 20 / 28 | Page titles, weight 500 |
| `text-display` | 24 / 32 | Hero statements, large figures |

Weights: 400 body, 500 titles, active labels and buttons, 600 only for avatars. No uppercase tracked labels except where a reference shows one. The type size names are declared once in `src/design/scale.ts` and shared with `cn()`, because tailwind-merge otherwise treats every unknown `text-*` as a colour and silently drops one of two classes.

## Geometry (CSS px)

| Item | Value |
|---|---|
| Sidebar width | 218 (collapsed rail 56) |
| Top bar height | 54, no border, same colour as the sidebar |
| Content sheet | Flush to the sidebar and top bar, 8 from the right and bottom, radius 8, 1px `edge` border, no shadow |
| Page header | 56 high, 24 side padding, 1px `line` divider full-bleed |
| Nav row | 30 high, 36 pitch, radius 8, 10 side padding, 20px icon box |
| Group label | 13px `fg-tertiary`, 12px above the first row, 20px between groups |
| Controls | 32 high (md), 28 (sm), 40 (lg), radius 8 |
| Table | Header band 30 high `subtle`; rows 45; row rule `edge`; cell inset 20; numbers right-aligned |
| Status label | 20 high, radius 4 (pill in the newcomer app), 12px 500 |
| Avatar | 28 circle, initials 12px 600 |
| Empty state | 40px tile radius 8, 20px glyph, 16px gap to a 16px title, 14px description, one button |
| Page content | 24 padding; forms 600 centred; sections 44-48 apart |
| Spacing scale | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 44 |

Radius scale: 4 label, 6 default, 8 controls and sheet, 12 cards and dialogs, 16 large.

## Components

- **Button.** `primary` near-black (inverts in dark), `secondary` 1px outline, `ghost`, `destructive` solid red. Disabled is 40% opacity. Icon-only needs `aria-label`.
- **Status label (`Badge`).** Tint fill, same-hue dark text, no border, 4px radius. Never saturated fills.
- **Segmented control.** `track` background, white selected plate with a 1px border and a weight step. Arrow keys, one tab stop, RTL-aware.
- **Menu.** White popover, 8px radius, soft shadow, 32px rows, check for the selected row. Arrow keys, Home/End, Escape returns focus.
- **Table.** Band header, 45px rows, sort affordance that appears on hover and when active, sticky header inside the sheet. Rasikh additions beyond the reference: sort carets, row hover fill, sticky header.
- **Empty state.** Icon tile, title, one sentence, at most one button. Titles say what will appear.
- **Loading.** Real labels render at once; only values become skeleton blocks at final geometry.
- **Icons.** lucide-react. 20px box at stroke 1.65 in navigation, 16px in buttons and rows, 14px in menus and inputs. Round caps and joins. Do not lower the stroke in dark mode.
- **Brand mark.** A doorway arch with a figure standing in it, on a solid tile that inverts with the theme. 24px in the top bar.
- **Charts** (Session 4). Single hue, bars from zero, zero values as a 2px dash, first and last axis label only, no gridlines, tooltip with exact values.

## RTL and mobile rules

- Logical properties only: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `border-s`. Physical `left/right` utilities are not used in `apps/web/src`.
- Directional glyphs mirror (`rtl:-scale-x-100`), roving-tab arrow keys follow the element's computed direction.
- Below 768px the sidebar becomes an off-canvas drawer; below 640px the wordmark collapses to the mark so the top bar never overflows.
- Newcomer app (Session 3): ChatGPT ladder, 16px body for inputs, 44px touch targets, bottom navigation, safe-area insets.

## Motion

150ms for colour and opacity transitions, 200ms for the sidebar width and drawer, 150ms ease-out pop-in for menus. No bounce, no scale on hover. `prefers-reduced-motion` shortens everything. Durations are our own choice: the references are stills.

## Banned

Purple or blue gradients, gradient text, glowing borders, glassmorphism, blurred blobs, emoji as icons, hero "Welcome" copy, big shadows with rounded-3xl on everything, grids of identical icon-title-text cards, lorem ipsum and placeholder people, fake round numbers, random accent colours, centred dashboards, Title Case Everywhere, marketing language in product, placeholder charts. Government and free-zone names appear as plain text only, with no logos and no implication of an official integration. The word "mock" never appears in the UI.

## Quality gate

At the end of each UI session, capture the new screens with `scripts/capture.mjs` in both themes and next to the reference screenshots, run axe-core, and write the critique in PROGRESS.md.
