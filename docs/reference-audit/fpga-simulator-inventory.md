# Reference audit: fpga-simulator ("Forge") UI layer, for Rasikh

- Source root: `C:/Users/maalh/Desktop/Sandboxes/FPGA Sandbox/fpga-simulator` (all paths below are relative to it unless marked `[rasikh]`).
- Audited read-only on 2026-10-02. Every primitive recommended for porting was read in full; the rest were skimmed and are marked as such.
- Purpose: let a later session port UI into Rasikh without reopening the old repo. Section 7 contains copy-paste-ready excerpts.

## 0. TL;DR

1. **The source design language IS already OpenAI Platform + ChatGPT.** The repo was re-skinned against measured captures of both (control height 40px, radius 8px, 15px body, `#FCFCFC` content ground, near-black primary, neutral chrome, violet used only for data). The token names are `bench-*`. Port the token layer verbatim; it is the single most valuable asset (section 2).
2. **Same stack pins as the Rasikh scaffold.** Verified against the source `node_modules`: Next 15.5.25, React 19.2.7, Tailwind 3.4.19, tailwind-merge 3.5.0, lucide-react 1.7.0, clsx 2.1.1, TypeScript 5.9.3, Prettier 3.8.1. `cn()` and the icon scale therefore port without version friction.
3. **No third-party UI library anywhere** (no Radix, Headless UI, cva, framer-motion, react-aria). Everything is hand-rolled on native elements (`<dialog>`, `role="switch"`, `role="tablist"`, `inert`). Small, dependency-free, easy to lift.
4. **Hazards that matter for Rasikh:** (a) CSS-module-vs-Tailwind specificity tie (section 5.1); (b) zero i18n and zero RTL support: physical `left/right/ml/mr` everywhere, hard-coded English strings; (c) desktop-first shell, `body{overflow:hidden}`, no bottom tab bar, no safe-area handling; (d) the shell (`ForgeShell`) is wired to Firebase and an FPGA-LMS role model and must be re-parameterised, not copied.
5. `docs/design-system.md` and `docs/design-system-components.md` in the source are **stale** (they describe the withdrawn Claude-warm palette: terracotta, serif, 10px radius). Trust `src/app/globals.css`, `tailwind.config.ts` and `src/components/sim/design-system/tokens.test.ts` only.

---

## 1. Stack

| Concern | What the source does | Port note |
| --- | --- | --- |
| Framework | Next 15.5.25 App Router, React 19.2.7, TS 5.9.3 `strict` + `noUncheckedIndexedAccess`. `next.config.mjs` sets `output: 'export'` (static export) and `trailingSlash: true`. Heavy webpack config (WASM, Cesium, node-builtin stubs) | None of the next.config is relevant. Static export drove several hydration-safety patterns that are still good practice (read storage in an effect, no `Math.random`/`toLocaleString` in render). `trailingSlash` drove `routeIsActive()`; keep that function regardless. |
| Tailwind | 3.4.19. `darkMode: 'class'`. PostCSS = `tailwindcss` only (no autoprefixer entry). `content: ['./src/**/*.{ts,tsx}']` | Rasikh scaffold already matches. |
| Tailwind config structure | One `theme.extend`. **Semantic colours via CSS variables as space-separated RGB triplets**: `bench: { bg: 'rgb(var(--bench-bg) / <alpha-value>)', ... }`. Nested `DEFAULT`/`soft` for status (`bench-success`, `bench-success-soft`), `accent {DEFAULT,strong,soft,fg}`, `solid {DEFAULT,fg}`. Extra: `fontSize` rungs (`bench-caption/label/body/title/section/page`), `size/width/height` icon rungs (`icon-xs/sm/md/lg`), `borderRadius` (`bench-sm/bench/bench-card/bench-lg/bench-pill/bench-panel`), `boxShadow` (`bench`, `bench-pop`), `maxWidth.bench` (768px reading column). Also ~100 lines of LEGACY static colours (`primary` teal, `toolbar`, `editor`, `console`, `sim`, `board`, `waveform`, `surface`, `sidebar`) | Port only the `bench` colour block, `fontSize`, icon `size/width/height`, `borderRadius`, `boxShadow`, `maxWidth`. Drop every static legacy colour. Optional mechanical rename of the `bench` prefix (it leaks the FPGA "workbench" domain); see section 5.9. |
| Token source of truth | `src/app/globals.css` `:root` and `.dark` blocks (lines 71-391). `tailwind.config.ts` only references `var(--bench-*)` | Full value table in section 2. |
| Theming | **Class strategy**: `.dark` on `<html>`. Stored choice `light \| dark \| system` in `localStorage['forge-theme']`; **default is light, deliberately not OS** (comment explains: a dark-OS first-time visitor would otherwise get a dark address bar over a light page). No-flash: inline `<script dangerouslySetInnerHTML>` in `<head>` (src/app/layout.tsx lines 87-126) reads storage, adds `.dark`, and re-points `<meta name="theme-color">`. `<html suppressHydrationWarning>` and `<body suppressHydrationWarning>`. Runtime: `src/lib/theme.ts` = `useSyncExternalStore` hook with in-tab CustomEvent + `storage` event + `matchMedia` change, in-memory fallback if storage throws | **Already ported**: `[rasikh] src/lib/theme.ts` is a cleaned version of this (keys `rasikh-theme`). Still missing in Rasikh: the inline boot script and the theme-color meta handling (excerpt E). |
| Fonts | `@import url('https://fonts.googleapis.com/css2?family=Inter...&family=JetBrains+Mono...')` at the top of globals.css (render-blocking runtime import, no `next/font`). `tailwind.config` `fontFamily.sans = Inter, system-ui, sans-serif`; `mono = JetBrains Mono, Fira Code, Consolas, monospace`. `src/app/fonts/GeistVF.woff` + `GeistMonoVF.woff` exist but are **unused** (zero references). `font-display` / `font-serif` are legacy aliases that both resolve to Inter | Rasikh already uses `@fontsource-variable/inter` (better: self-hosted, no third-party request). For Arabic add a second family (e.g. IBM Plex Sans Arabic / Noto Sans Arabic / Cairo) and a `:lang(ar)` or `[dir=rtl]` font stack. Do not port the Google `@import` or the Geist files. |
| Icons | `lucide-react` 1.7.0 only. **Convention: 4 size rungs + 1 stroke weight.** `size-icon-xs/sm/md/lg` = 12/14/16/20px (Tailwind `size-*`), default 16px (md). Stroke weight 1.75 applied **globally** via `:where(svg.lucide){stroke-width:var(--bench-icon-stroke)}` (CSS beats lucide's presentation attribute, specificity 0). Rule: an icon beside text takes the rung its text names and is never smaller than it (caption 12 -> xs, label/meta 13 -> sm, body 15 -> md, title/section/page -> lg). Icons passed to `BenchButton` are `aria-hidden` and sized by the stylesheet, so callers pass bare `<Plus />` | Port the `:where(svg.lucide)` rule + 4 rungs. In RTL, directional icons (`PanelLeftClose`, `ChevronRight`, `›`) must mirror. |
| State management | **zustand 5** (11 non-test files import it; `src/store/app.store.ts` is the app-level one). React Context only for the signed-in user (`src/context/UserContext.tsx`). Local UI state is `useState`; persistence is hand-written `localStorage` with `try/catch` and effect-time reads. No React Query, no Redux | Rasikh scaffold has no zustand yet; add only when needed. Do not port `app.store.ts` (it is a view-router for the FPGA LMS: `AppView`, `dashboardTab`, collab presence). |
| Class util | `src/lib/cn.ts`: `twMerge(clsx(...))` with `extendTailwindMerge` that teaches tailwind-merge that `text-bench-{caption,meta,label,body,title,section,page}` are font SIZES and every other `text-bench-*` is a COLOUR. Without it, `cn('text-bench-solid-fg text-bench-body')` silently drops the ink class (black on black). Guarded by `src/lib/cn.test.ts` (asserts the size list equals the Tailwind config) | Port with its test (excerpt A). I verified plain twMerge also fails to dedupe `rounded-bench` vs `rounded-bench-pill` and `size-icon-md` vs `size-icon-lg` (both survive); extend those groups too if you rely on overriding them. |
| Testing | **vitest 4.1.11** + jsdom 29 + `@testing-library/react` 16.3 + `@testing-library/jest-dom` 6.9 (`tests/setup.ts` is one line: `import '@testing-library/jest-dom/vitest'`). `globals: true`, `include: ['src/**/*.test.{ts,tsx}']`, `@vitejs/plugin-react`, alias `@ -> ./src`. **Tests are colocated** next to the component. a11y: `axe-core` 4.11.1 called directly in jsdom (`axe.run(view.container)` then assert `violations` is `[]`; see `src/sims/herald/panels/a11y.test.tsx`). E2E: `@playwright/test` in `tests/*.spec.ts`. The vitest config's worker/timeout tuning is for the FPGA engine and is not relevant | Minimal Rasikh config: jsdom, globals, setup file, alias. |
| Lint / format | ESLint 8 `next/core-web-vitals` + `next/typescript`; Prettier `semi:true, singleQuote, tabWidth 2, trailingComma all, printWidth 100` | Rasikh `.prettierrc.json` already approximates this. |
| Strictness conventions | `noUncheckedIndexedAccess` forces `array[i]!`/guards; every `localStorage` and `matchMedia` access is wrapped | Worth keeping on. |

---

## 2. Token layer (port this first)

All values are space-separated RGB triplets in `:root` (light) and `.dark` (dark), consumed as `rgb(var(--bench-x))` or `rgb(var(--bench-x) / 0.5)`. **THE RULE that the whole file is built around: CHROME IS NEUTRAL, DATA IS COLOURED.** Every control, row, border and header is greyscale or near-black; the violet accent appears only on charts, sparklines, legend dots and meters. Never put `bench-accent` on a nav row, primary button or tab.

### 2.1 Colour ladder

| Token (`--bench-*`) | Light | Dark | Role |
| --- | --- | --- | --- |
| `bg` | `252 252 252` #FCFCFC | `28 28 28` #1C1C1C | Content ground, cards, table bodies, dialog sheet |
| `panel` | `241 241 241` #F1F1F1 | `20 20 20` #141414 | Chrome: sidebar, top bar, status strip. `body` paints this so route gaps stay chrome |
| `raised` | `247 247 247` | `36 36 36` | Toolbars, tab strips |
| `subtle` | `232 232 232` | `46 46 46` | Hover plate, ACTIVE NAV ROW, segmented track, skeleton plate |
| `border` | `230 230 230` | `50 50 50` | Hairlines for cards/tables (decorative) |
| `control-border` | `118 118 118` | `119 119 119` | Border of an interactive field (needs >= 3:1) |
| `text` (alias `fg`) | `13 13 13` | `236 236 236` | Body ink |
| `muted` | `93 93 93` | `168 168 168` | Labels, secondary copy |
| `faint` | `104 104 104` | `154 154 154` | Quiet but readable small text, placeholders |
| `focus` | `124 92 255` | `124 92 255` | Focus ring (same in both themes; passes 3:1 on every surface) |
| `plane` | `241 241 241` | `20 20 20` | Artwork surround (domain; skip) |
| `accent` | `124 92 255` | `167 139 250` | DATA series colour only |
| `accent-strong` | `91 63 217` | `185 165 252` | Text-safe accent |
| `accent-fg` | `255 255 255` | `28 28 28` | Ink on accent-strong |
| `accent-soft` | `240 237 255` | `42 36 64` | Tint under a data row |
| `solid` | `13 13 13` | `236 236 236` | THE one emphatic fill (primary button, switch-on, count badge). **Inverts in dark** (was a bug when it didn't) |
| `solid-fg` | `255 255 255` | `28 28 28` | Ink on `solid` |
| `success` / `-soft` | `20 108 62` / `232 245 238` | `95 211 155` / `27 50 39` | Status |
| `warning` / `-soft` | `139 83 16` / `250 241 220` | `229 184 107` / `52 43 30` | Status |
| `danger` / `-soft` | `185 51 38` / `252 235 233` | `241 153 146` / `58 36 34` | Status |
| `info` / `-soft` | `42 92 170` / `233 240 251` | `147 186 238` / `33 42 56` | Status |
| `sheen`, `sheen-a`, `gloss-a` | white; 0.85 / 0.55 | white; 0.07 / 0.045 | Decorative card art (skip) |
| `terminal*` | fixed in both themes | | Device surface for the FPGA console (skip) |

Gotcha baked into the dark values: status tokens FLIP to pale tints in dark, so ink on a status FILL must be `text-bench-bg` (white in light, near-black in dark), never literal white (`BenchButton` destructive and `Toast` do this). `inkOnFill.test.ts` enforces it.

### 2.2 Type, icon, shape, spacing tokens (`:root`)

```css
--bench-text-caption: 12px;  /* badges, helper text, timestamps; NOTHING in the language is below 12px */
--bench-text-label: 13px;    /* uppercase-tracked captions and table headers */
--bench-text-meta: var(--bench-text-label); /* 13px sentence case; hand-written class .text-bench-meta (not a Tailwind fontSize entry) */
--bench-text-body: 15px;     /* DEFAULT body, sidebar rows, controls */
--bench-text-title: 17px;    /* card / panel / dialog titles */
--bench-text-section: 20px;
--bench-text-page: 28px;
--bench-tracking-label: 0.04em;
--bench-icon-xs: 12px; --bench-icon-sm: 14px; --bench-icon-md: 16px; --bench-icon-lg: 20px;
--bench-icon-stroke: 1.75;
--bench-radius-sm: 2px;      /* swatches, left-ruled notice strips */
--bench-radius: 6px;         /* controls */
--bench-radius-card: 8px;    /* console cards */
--bench-radius-lg: 16px;     /* dialogs, menus, content cards, catalogue cards */
--bench-radius-pill: 999px;
--bench-panel-radius: 12px;  /* the floating content sheet and metric cards */
--bench-panel-inset: 12px;   /* inset of the floating sheet from the right/bottom */
--bench-topbar-height: 70px; /* measured; the top bar is the gap above the sheet */
--bench-read-width: 768px;   /* ChatGPT-style reading column */
--bench-space-1..6: 4 8 12 16 24 32px;
--bench-shadow: 0 1px 2px rgb(13 13 13 / 0.04);
--bench-shadow-pop: 0 12px 32px rgb(13 13 13 / 0.12), 0 2px 6px rgb(13 13 13 / 0.06);
/* .dark: --bench-shadow 0 1px 2px rgb(0 0 0 / 0.40); --bench-shadow-pop 0 12px 32px rgb(0 0 0 / 0.55), 0 2px 6px rgb(0 0 0 / 0.35) */
```

Note `--bench-control-height: 32px` and `--bench-control-compact: 24px` exist in `:root` but are NOT what the primitives use. The measured control sizes are **literals in the CSS module: 40px normal, 32px compact** (and 36px segmented track). Use 40/32.

Two registers share one palette: **CONSOLE** (dense: 13-15px, 6-8px radii, tables, hairlines; for the employer/landlord/bank dashboards) and **CONTENT** (ChatGPT: 15-16px, 16px radii, pill composer with black circular send button, 768px reading column; for the newcomer app and AI chat). Pick by surface, not preference.

### 2.3 Which parts of `globals.css` are portable

| Lines | Content | Verdict |
| --- | --- | --- |
| 17-36 | box-sizing reset, `html,body{height:100%;overflow:hidden}`, body font/colour | Port, but REMOVE `overflow: hidden` (see 5.3) |
| 71-391 | `:root` + `.dark` token blocks | Port (trim `terminal*`, `plane`, `sheen`, `gloss`) |
| 428-431 | `.bench-display` | Skip (no-op weight/tracking shim) |
| 468-493 | `:where(svg.lucide)` stroke rule, `.text-bench-meta` | Port |
| 495-579 | `.bench-eyebrow`, `.bench-chip`, `.bench-field` | Port chip/field if you want CSS-class forms; otherwise rely on the primitives |
| 589-591 | `input,select,textarea{color-scheme:light}` | **Do not port** (see 5.4) |
| 613-615, 641-673 | `shimmer` keyframes, global `*:focus-visible{outline:2px solid rgb(var(--bench-focus));outline-offset:2px}`, `.forge-lift/.forge-fade-in/.forge-pop-in` | Port (rename `forge-` prefix) |
| 676-713 | 6px scrollbar, `::selection` (accent 18%), `.sr-only` | Port scrollbar + selection (`.sr-only` already in Tailwind) |
| 715-754 | `prefers-reduced-motion` block, with busy indicators kept alive as an opacity pulse (`bench-busy-pulse`) | Port (good a11y nuance) |
| 877-890 | `.forge-auth-input:-webkit-autofill` neutraliser (inset box-shadow trick + `-webkit-text-fill-color`, so Chromium's yellow/blue autofill plate follows the theme) | Port if Rasikh builds its own sign-in/phone-number form (sits in the middle of the Blockly block, easy to miss) |
| 393-400, 600-611, 756-876, 892-931, 933-1027, 1029-1387 | AI composer highlight, board SVG, react-flow, Blockly, MIZAN, sandbox card art (`sbx-*`, `sbn-*`, `hero-wash`) | **Skip: ~900 lines of domain CSS** |

---

## 3. Primitive inventory

Verdict legend: **port-as-is** = copy the code, it only needs the token layer + `cn`; **port-restyled** = copy but change visuals/structure/strings (RTL logical props, domain stripping, layout); **pattern-only** = re-implement from the pattern; **skip** = domain-coupled or irrelevant.

"i18n/RTL" notes flag the work needed for EN/AR; unless stated, all strings are hard-coded English and positioning uses physical properties.

### 3.1 Controls and form primitives

Everything in this table lives in **one file**: `src/components/sim/BenchPrimitives.tsx` (1047 lines) + `src/components/sim/benchPrimitives.module.css` (1091 lines) + test `BenchPrimitives.test.tsx` (333 lines). Port as one file per primitive.

| Primitive | Exports | Props API (one line) | Deps | Verdict | Reason |
| --- | --- | --- | --- | --- | --- |
| Button / IconButton | `BenchButton`, `benchControlProps`, `BenchControlIcon`, types `BenchButtonProps/Variant/Density/Shape` | `variant: primary\|secondary\|quiet\|soft\|ghost\|destructive`, `density: normal(40px)\|compact(32px)`, `shape: rounded(8px)\|pill`, `fullWidth`, `icon`, `iconOnly` (square, needs `aria-label`), `tone: default\|danger\|success`, `align: center\|start`; `forwardRef`, defaults `type="button"` | cn, CSS module | **port-as-is** (re-express as Tailwind, see 5.1) | The best asset in the repo. Variants selected by `data-*` attributes; `benchControlProps()` can be spread onto a `<Link>` so a link wears the same look. IconButton == `iconOnly`. i18n: none. RTL: none (symmetric) |
| Input | `BenchInput`, `BenchInputProps` | Wraps native `<input>` in a labelled field: `label`, `hint` (inline "Optional"), `description`, `error`, `density`, `shape: rounded\|pill`, `required`; auto `id`/`aria-describedby`/`aria-invalid`; `forwardRef` | cn, CSS module, `useId` | **port-as-is** | Correct a11y wiring (error is `role="alert"`; label gets a real text node for the hint). Hard-coded `" (required)"` string needs i18n |
| Select | `BenchSelect` | Same field props over a native `<select>`; `appearance:none` + a `ChevronsUpDown` glyph in a shell | lucide | **port-restyled** | Native select (good on mobile). Glyph is `right:12px`, padding-right 38px: switch to logical (`inset-inline-end`, `padding-inline-end`) |
| Textarea | `BenchTextarea` | Same field props over `<textarea>`, `resize: vertical` | cn | **port-as-is** | Shares `.input` class |
| Slider | `BenchSlider` | Native `<input type=range>` with label row; `valueLabel`, `unit`, `description`, `error`; fill via `--bench-slider-fill` % gradient | cn | **port-restyled** | Native a11y (arrow/Home/End). The gradient is `to right`: must flip in RTL. 24px hit area trick (`margin:-3px 0`) is worth keeping |
| Switch | `BenchSwitch` | `label`, `description`, `checked`, `onChange(next)`; `role="switch"` + `aria-labelledby` (a `<label for>` cannot name a button) | cn | **port-restyled** | 40x24 track, near-black when on. Knob uses `translate: 16px 0` + `left:4px`: flip for RTL |
| Segmented control | `BenchSegmented<Value>` | `label` (group name), `value`, `onChange`, `options[{value,label,title}]`, `density`; `role="radiogroup"` of `role="radio"`, one tab stop, arrows select | `useRovingTabs` | **port-restyled** | Grey `subtle` track + white selected pill + weight step (3 non-colour signals). `useRovingTabs` maps ArrowRight = next: swap in RTL |
| Tabs | `BenchTabs` | `tabs: BottomTab[]` (`id,label,title?,badge?,badgeTone?,icon?,body,actions?`), `activeId`, `onChange`, `label` | `useRovingTabs`, **type import from `./BottomPanel`** | **port-restyled** | Pill tabs (selected = grey rounded-full plate; NO underline anywhere in the reference). Decouple the `BottomTab` type. Same arrow-key RTL caveat |
| Badge | `BenchBadge` | `tone: neutral\|success\|warning\|danger\|info`, children | CSS module | **port-as-is** | 26px pill, fill only |
| Dialog / Modal | `BenchDialog`, `BenchDialogProps` | `open`, `onClose`, `title`, `description?`, `children`, `footer?`, `initialFocusRef?`, `size: default(520px)\|wide(860px)` | native `<dialog>`, lucide `X` | **port-as-is** | Real `showModal()`, own Tab trap that skips hidden/inert nodes, Escape, focus restore to opener, initial-focus ref. `Close ${title}` string needs i18n. Close button margin is physical (`-4px -6px 0 0`) |
| Section | `BenchSection` | `title`, `description?`, `actions?`, `size: page(28)\|section(20)\|rail(15)`; `<section aria-labelledby>` + h2 | CSS module | **port-as-is** | No hairline under header by design (space separates) |
| Card (titled) | `BenchCard` | `title`, `href?` (title gets "›" and whole card is the link via stretched `::after`), `action?` | `next/link` | **port-restyled** | Hard-coded `›` char must mirror in RTL. 12px radius, hairline, faint shadow |
| Card (catalogue) | `benchCardProps` | Spread onto any element: `interactive`, `pad`; `:where()` defaults so utilities can override; locked radius 16px | CSS module | **port-restyled** | Good for list/grid tiles that are buttons or links |
| Table | `BenchTable<Row>`, `BenchRowActions`, `BenchTableColumn` | `caption` (required), `columns[{key,header,cell,rowHeader?,align?,actions?}]`, `rows`, `rowKey`, `empty?`; scroll region is focusable with a label | cn | **port-restyled** | Quiet sentence-case header, hairlines between rows. `align:'left'\|'right'` must become `'start'\|'end'`; default empty string needs i18n |

`IconButton`: no separate component; use `BenchButton iconOnly`. `Spinner`: **none exists**; the repo uses `<Loader2 className="animate-spin"/>` inline (reduced-motion block turns the spin into an opacity pulse). `Tooltip`: **none exists**; the convention is the native `title` attribute (the sidebar sets `title` only when collapsed). `Kbd`: **none exists**; `<kbd>` is hand-styled in `CommandPalette` and `ShortcutsOverlay` (`rounded-bench border border-bench-border bg-bench-panel px-2 py-1 text-bench-caption font-medium uppercase tracking-wide text-bench-muted`). `Avatar`: inline (`h-8 w-8 rounded-bench-pill bg-bench-subtle` + initial). Build these four fresh, tiny.

### 3.2 Feedback, overlays, menus

| Primitive | Path | Exports | Props API (one line) | Deps | Verdict | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Toast | `src/components/ui/Toast.tsx` (203 lines, test alongside) | `ToastProvider`, `useToast()`, type `ToastKind` | `useToast()` -> `{toast(kind,title,{description,durationMs}), success, error, info}`; kinds `success\|error\|info`; 3.2s (6s error); top-centre, drops in from above; filled slab (green / danger / near-black); pauses on hover AND keyboard focus; dismiss returns focus | lucide, cn | **port-restyled** | No deps, well built. Re-skin: ink must be `text-bench-bg` on status fills (already). `role="status"` per card; `Dismiss ${title}` needs i18n; `left-1/2 -translate-x-1/2` is RTL-safe (centred) |
| Skeleton | `src/components/ui/Skeleton.tsx` (37 lines) | `Skeleton` | `className` only; `subtle` plate + moving `bench-bg` sweep (needs `shimmer` keyframe from globals.css) | cn | **port-as-is** | Excerpt C. Decorative, motion-reduce safe. RTL: sweep direction is `translate-x-full` (LTR); flip with `rtl:` variants |
| EmptyState | `src/components/sim/EmptyState.tsx` (91 lines) | `EmptyState` | `icon: LucideIcon`, `title`, `description?`, `action?` (ONE primary button), `compact?`; `tone` prop is a vestigial no-op | lucide, cn | **port-as-is** | Restrained by design: small line icon, one sentence, one button; title stays a heading. Drop the dead `tone` prop |
| ErrorBoundary | `src/components/ui/PanelBoundary.tsx` (123 lines) | `PanelBoundary` (class) | `label`, `onHome?`, `onRetry?`; renders `role="alert"` card with danger-soft header and primary/ghost buttons; logs the real error, shows a chosen sentence | **`@/lib/safeError` (`userMessage`), `@/lib/stale-chunk-recovery`, `BenchButton`**, lucide | **port-restyled** | Strip the two lib imports and the hard-coded "The rest of Forge is fine" copy. In the Next App Router also add `error.tsx`/`global-error.tsx`. The "never forward `err.message` to the UI" rule in `src/lib/safeError.ts` is worth copying |
| Command palette | `src/components/sim/CommandPalette.tsx` (312 lines) | `CommandPalette`, `useCommandPaletteShortcut`, `PaletteAction` | `open`, `onClose`, `actions[{id,title,subtitle?,section,icon?,shortcut?,keywords?,run}]`; filter by title+subtitle+section+keywords; grouped; combobox/listbox with `aria-activedescendant`; Tab trapped to the input; focus restored to opener; hook binds Ctrl/Cmd+K | lucide, cn | **port-as-is** | Fully generic, already in OpenAI overlay style (white sheet, 16px radius, 46px rows). i18n: placeholder, "No matches", footer hints. Not needed for the mobile newcomer app; useful on dashboards |
| Shortcuts overlay | `src/components/sim/ShortcutsOverlay.tsx` (234 lines) | `ShortcutsOverlay`, `useShortcutsShortcut`, `ShortcutGroup` | `open`, `onClose`, `groups[{title,items[{keys,description}]}]`; modal with Tab cycle, Escape, focus restore; `?` hook skips typing targets and Monaco | lucide | **port-restyled** | Generic. Contains Monaco-specific guard (replace with `isTypingTarget`). Only for desktop dashboards |
| Menubar + dropdown | `src/components/sim/MenuBar.tsx` (305 lines) | `MenuBar`, `MenuItem`, `MenuDef` | `menus[{label,items[{label,shortcut,onClick,divider,disabled,section,checked}]}]`, `right?`; roving across triggers, arrows/Home/End in menu, Esc returns to trigger, outside-click closes | cn | **pattern-only** | IDE File/Edit/View bar; not a Rasikh surface. The dropdown panel and its keyboard model are the reusable bit; for a generic menu use the gallery's `MenuButton` (next row) |
| Menu / Popover | `src/components/sim/DesignSystemGallery.tsx` lines 316-456 | (not exported) `useDismiss`, `MenuPanel`, `MenuButton` | `MenuButton({ariaLabel, triggerLabel?, triggerIcon?, value?, options, onSelect, align})`; `role=menu` / `menuitemradio`; `useDismiss(open, close, regionRef)` = Escape + outside mousedown with a latest-ref callback; focus returns to the trigger | `BenchButton`, lucide | **port-restyled** | The only generic popover in the repo and it is hidden inside the gallery. Extract `useDismiss` + `Menu`. It lacks arrow-key navigation (MenuBar's dropdown has it): merge the two |
| Popover (bell) | `src/components/notifications/NotificationBell.tsx` (178 lines) | `NotificationBell` | Bell `BenchButton` + count badge + `role=dialog` panel (360px wide, full-width on phone via `max-md:fixed ... top-[var(--bench-topbar-height)]`) | **Firebase/LMS inbox libs, `useProfile`, `useAppStore`**, next/navigation | **pattern-only** | Domain-coupled. Copy the badge (`h-[18px] min-w-[18px] rounded-bench-pill bg-bench-solid ... tabular-nums`, `9+` cap, `aria-label="Notifications, N new"`), the phone-sheet breakpoint trick and the 60s visibility refresh pattern |
| LoadingOverlay | `src/components/sim/LoadingOverlay.tsx` | `LoadingOverlay` | `title`, `description?`, `tip?`, `accent` (6 colour names) | lucide | **skip** | Uses raw Tailwind palette colours (emerald/amber/...) and an emoji, contradicting the neutral-chrome rule. Build a 10-line spinner overlay instead |
| Bottom dock | `src/components/sim/BottomPanel.tsx` | `BottomPanel`, `BottomTab` | tab strip in a `subtle` track + panel with maximise/close buttons | `useRovingTabs` | **pattern-only** | IDE bottom dock; `BenchTabs` is the generic version (and imports `BottomTab` from here, so extract that type) |
| Resizable panels | `src/components/sim/HSplit.tsx` (199 lines) | `HSplit` | `storageKey`, `initial/minLeft/maxLeft` (%), `left`, `right`, `leftCollapsed` (keeps the pane mounted but `inert`); pointer capture on `window`, double-click/Enter resets, arrows/Home/End/Shift-arrows, full ARIA splitter (`aria-valuenow/min/max`), persists to `forge-hsplit:<key>` | cn | **port-restyled** | Dependency-free, accessible, leak-free pointer handling. Only needed if a dashboard has a master/detail split. Pointer maths and `ArrowLeft/Right` are LTR-only. (`react-resizable-panels` is used elsewhere in `SimulatorLayout`; do NOT bring it) |
| Editor shell (IDE) | `src/components/sim/EditorShell.tsx` (29 KB) | `EditorShell` | IDE shell: header, activity bar, side panel, editor, bottom panel, status bar; Ctrl+B / Ctrl+J | HSplit-like logic, isTypingTarget | **skip** | IDE-specific. Its "floating rounded white sheet inset on a grey chrome ground" idiom is already captured by `ForgeShell` below |

### 3.3 Navigation and app shell

| Piece | Path | Exports | Props / API | Deps | Verdict | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| **App shell frame** | `src/components/shell/ForgeShell.tsx` lines 446-580 | `ForgeShell` | `({ children, sidebar?, fill? })`. Grey `panel` ground, top bar floating on it, optional sidebar `<aside>`, content in a rounded `bench-bg` sheet (`rounded-bench-panel`, inset 12px right/bottom, no divider lines). Rail width animates 264/240px <-> 68px (`transition-[width] duration-300`). **Below `md` the rail becomes an off-canvas drawer**: `fixed`, `translate-x`, `inert` when closed, backdrop, Escape closes, closes on route change, focus moves into drawer and back to the menu button. `fill` switches `<main>` to `overflow-hidden` for chat | `usePathname`, lucide, `BenchButton`, `useNavCollapseState`/`useNarrowViewport` (local) | **port-restyled** | The best structural asset for the desktop dashboards. Strip: `useProfile`, `useRoleAtLeast`, `signOut` (Firebase), `useAppStore.dashboardTab`, `NotificationBell`, the F/Forge/Eduverse wordmark. Re-parameterise with `nav: NavGroup[]`, `topBarSlots`. RTL: rail is `left-0 -translate-x-full`, `mr-[inset]`/`ml-[inset]`, `max-md:ml-` are physical |
| Nav rail contents | same file, lines 589-838 | `ForgeNav`, `NAV_ROW`, `NAV_ROW_IDLE`, `NavSection`, `NavLink`, `NavButton`, `NavHeading`, `routeIsActive`, `NAV_GROUPS` | Data-driven groups -> rows. Row = 46px pitch, 10px-radius plate inset by `px-2`, 20px icon, 15px label, active = `bg-bench-subtle font-medium`, never accent. Group headings are 13px muted sentence case; when collapsed they turn into a hairline but the group keeps `role="group" aria-label`. `aria-label` always set, `title` only when collapsed. `routeIsActive(pathname, {href, match})` handles trailing slash + subtree | `useRouter`, `useAppStore`, `useRoleAtLeast`, `signOut` | **port-restyled** | Take the row classes, `NavHeading`, collapse/drawer logic, `routeIsActive` (pure, tested in `ForgeShell.adminRow.test.tsx`). Replace the data (`NAV_GROUPS`, tabs, roles) with a prop |
| Collapse preference | same file, lines 348-445 | `useNavCollapseState`, `NAV_COLLAPSE_KEY` | Hydration-safe: first render ALWAYS the default, stored value applied in `useEffect`; read and write both `try/catch` | none | **port-as-is** | A pattern worth copying verbatim (explains the hydration trap) |
| Top bar | same file, lines 840-924 | `TopBar` (not exported) | `height: var(--bench-topbar-height)` (70px), menu button visible `<md`, logo tile + wordmark + `/` + org breadcrumb, spacer, bell, theme toggle, identity button | `useProfile`, `useAppStore`, `NotificationBell` | **pattern-only** | Layout is the reusable part: `shrink-0 flex items-center gap-3 px-4 sm:px-5`. Everything else is domain |
| Theme toggle | same file, lines 926-953 | `ThemeToggle` (not exported) | `BenchButton variant=ghost density=compact shape=pill iconOnly`, cycles light -> dark -> system, icon Sun/Moon/Monitor, `aria-label` states the current theme | `useTheme`, `BenchButton` | **port-as-is** | Excerpt E. i18n: labels. For a Settings page also offer `BenchSegmented` (the gallery does) |
| Generic sidebar rail | `src/components/sim/ActivityBar.tsx` | `ActivityBar`, `ActivityItem`, `ActivityGroup` | `items?` or `groups?`, `activeId`, `expanded`/`defaultExpanded`/`onExpandedChange`, `collapsible`; badge with `badgeTone` and `badgeAriaLabel`; `position: top\|bottom`; controlled-or-uncontrolled | lucide, cn | **port-restyled** | No domain coupling; a cleaner data-driven sidebar than `ForgeNav`, but 48px icon rail default with literal widths. Use it as the starting point for the generic `Sidebar` and graft `ForgeShell`'s drawer behaviour on |
| Title bar | `src/components/sim/TitleBar.tsx` | `TitleBar` | appName, subtitle, `onRun/onStop/running`, accent palettes (14 raw hexes) | lucide | **skip** | Simulator Run/Stop bar with 14 per-sim hexes |
| Status bar | `src/components/sim/StatusBar.tsx` | `StatusBar` | `left/right` items with tone | cn | **skip** | IDE strip (declares an unused `accent` prop with 14 colour names) |
| Breadcrumbs | `src/components/sim/Breadcrumbs.tsx` | `Breadcrumbs` | `crumbs[{id,label,icon,onClick,hint}]`, `right?` | lucide | **port-restyled** | 28px strip; generic. RTL: `ChevronRight` separator must mirror |
| ViewModeToggle | `src/components/sim/ViewModeToggle.tsx` | `ViewModeToggle` | Icon+label pill tablist | `useRovingTabs` | **pattern-only** | Superseded by `BenchSegmented`/`BenchTabs` |
| WorkbenchPhoneGate | `src/components/sim/WorkbenchPhoneGate.tsx` | `WorkbenchPhoneGate` | "needs a larger screen" notice with `md:hidden`/`max-md:hidden` + `contents` wrapper, "Continue anyway" in `sessionStorage` | next/navigation, `useAppStore` | **pattern-only** | CSS decides width (no JS measurement) so server and client agree |
| SaveStatus | `src/components/sim/SaveStatus.tsx` | `SaveStatus` | `state: saved\|dirty\|saving\|offline`, `lastSavedAt` | lucide | **pattern-only** | Small `role=status` autosave pill |
| WelcomeHint | `src/components/sim/WelcomeHint.tsx` | `WelcomeHint` | dismissible first-run banner persisted in localStorage | lucide | **pattern-only** | Good first-run pattern; uses per-sim storage key |
| SidePanelView | `src/components/sim/SidePanelView.tsx` | `SidePanelView` | Titled panel with actions | cn | **skip** | Trivial |
| File explorer, tabs, trees | `src/components/sidebar/FileExplorer.tsx`, `src/components/sim/SimFileTree.tsx`, `SimEditorTabs.tsx`, `EditorSettings.tsx` | | | Monaco/IDE | **skip** | IDE furniture (skimmed only) |
| Console / dock / layout | `src/components/ui/ConsolePanel.tsx`, `ConsolePlaceholder.tsx`, `DockablePanel.tsx`, `SimulatorLayout.tsx` (38 KB), `src/components/sim/SimConsole.tsx` | | | `simulator.store`, waveform, board | **skip** | FPGA domain |
| Dashboard art | `src/components/dashboard/{SandboxArt,SandboxBanner,SheetStack,HeroWash,sandboxGlyphs}.tsx` + `sbx-*` CSS | | | | **skip** | Generated card art for 67 sims; decorative, ~900 lines of CSS |
| Sign-in / gate | `src/components/auth/SignInPage.tsx`, `src/components/app/AppGate.tsx`, `Providers.tsx`, `src/context/UserContext.tsx` | | | Firebase | **skip** | Auth. `Providers.tsx` shows the nesting pattern (`ThemeSync` + `ToastProvider`) |
| StaleChunkRecovery | `src/components/app/StaleChunkRecovery.tsx` + `src/lib/stale-chunk-recovery.ts` | | | | **pattern-only** | Reload once on "Loading chunk failed". Only relevant if deploying a static export |

### 3.4 Data display (dashboard-relevant)

| Primitive | Path | Exports | Props API (one line) | Deps | Verdict | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Data vocabulary | `src/components/sim/BenchData.tsx` (470 lines) + `benchData.module.css` (12 KB) + test (330 lines) | `Sparkline`, `BarSeries`, `MetricCard`, `StatRail`, `BudgetMeter`, `FilterChip`, type `SeriesColor` | `Sparkline({values,color,width=72,height=20,label?})`; `BarSeries({values,color,height=160,from,to,label})`; `MetricCard({title,href?,legend?,from,to,children})`; `StatRail({items[{id,label,value,values?,color}]})` (a `<dl>`); `BudgetMeter({used,total,label,segments=20,format})` (`role=progressbar`, unknown total handled); `FilterChip({label,onClear?,onOpen?,expanded?})`. Series colours are NAMED TOKENS (`accent\|danger\|success\|warning\|info\|neutral`), never hex; all inputs sanitised (`NaN`, empty, negative) | lucide, cn, CSS module; **no chart library** | **port-restyled** | Exactly the Platform "Usage" dashboard vocabulary; pure SVG, no `window`, deterministic (hydration-safe), robust to bad data. Good for the employer/landlord/bank dashboards. `MetricCard` uses plain `<a>` so it needs no router; `to`/`from` axis captions are LTR. `BudgetMeter` shows `used / total` as text (RTL: use `dir=ltr` span for numerals). `recharts` is in the source deps but is not used by these |
| Markdown | `src/components/ui/Markdown.tsx` (+ test) | `Markdown` | `children: string`, `className`; no-dep renderer: h1-h4, bold/italic/code, links (only `https?:`, `mailto:`, `/`; `rel="noopener noreferrer"`), lists, fenced code, `---`, GFM tables | none | **port-as-is** | Useful for the AI chat bubbles. Safe link allow-list. No nested lists; escape/XSS-safe because it builds React nodes. Add `dir="auto"` per block for Arabic |

### 3.4b Chat surface (the ChatGPT register; directly relevant to Rasikh's AI assistant)

| Piece | Path | Exports | Props API (one line) | Deps | Verdict | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Chat composer | `src/components/ai/AIComposer.tsx` (501 lines; hydration test alongside) | `AIComposer`, types `ComposerCommand/ContextItem/SendOpts` | `onSend(text, opts)`, `busy`, `placeholder`, `commands`, `contextItems`, `onAttach(FileList)`, `onStop`, `seed`; auto-growing textarea (max 160px), Enter sends / Shift+Enter newline, leading "+" and tools glyph, mode pill, attach, Web-Speech mic, **send = solid circle with `ArrowUp` (near-black in light, near-white in dark via `solid`/`solidFg`), becomes a square Stop glyph while busy**, disabled at 0.35 opacity when empty | lucide, `./content/theme` (`ctok`), `./content/ActionCard` (Spinner) | **pattern-only** | The visual idiom is exactly what Rasikh needs (hairline container at 28px radius, black circular send, 16px-radius menus), but the file is **inline-style based** (`style={{...}}` fed by `ctok()` CSS-variable strings), 33 KB, with domain features (@file chips with a transparent-textarea highlight layer, Claude-Code edit modes, a 2 KB hexagon SVG path, Web Speech typings). Rebuild in ~100 lines of Tailwind. Note the radius gap it documents: the scale has nothing between 16px and the pill, so add `--bench-radius-xl: 28px` |
| Chat panel | `src/components/ai/AIChatPanel.tsx` (421 lines) | `AIChatPanel`, `AIChatMessage`, `ChatStep`, `MessageVersion` | `messages`, `onSend`, `busy`, `onRegenerate`, `onSwitchVersion`, `onEditMessage`, `onStop`, `emptyState`, `animateLast`, `onFeedback`; centred column `maxWidth: var(--bench-read-width)` (768px) shared by turns AND composer; **user turn = right-aligned bubble on the neutral `subtle` plate (max 82% width); assistant turn = NO plate, flat on the ground beside a small avatar**; per-message action row (copy, regenerate, like/dislike, edit), step list with running/done/failed icons, "Thinking..." bubble, typed-out streaming effect (`useTypingEffect`, chars per frame), regenerate version history | lucide, `ctok`, `ForgeContentView` (quiz/flashcard widgets), `@/lib/ai-content/schema`, `@/lib/chat/versionStack` | **pattern-only** | Layout and tone are the reference; the code is entangled with the tutor's rich content widgets and retry versioning. Copy the structure (column, bubble rules, action row, step list, `role="img" aria-label="AI"` avatar) and rebuild. `ForgeShell` takes `fill` so a chat page can own its own scroller |
| Content tokens as inline styles | `src/components/ai/content/theme.ts` | `ctok()`, `R`, `CTok` | Returns an object of `var(--bench-*)` strings (`panel, sub, subtle, border, text, muted, faint, solid, solidFg, data, good, bad, warn, ...`) for inline styles | none | **skip** | A shim that exists because the chat code predates the Tailwind tokens. Use Tailwind `bench-*` classes instead |

### 3.5 Hooks and libs worth lifting

| Item | Path | Exports | API | Verdict | Reason |
| --- | --- | --- | --- | --- | --- |
| Roving tabindex | `src/components/sim/useRovingTabs.ts` (39 lines, test `useRovingTabs.test.tsx`) | `useRovingTabs` | `useRovingTabs(count, selected, select)` -> `{ onKeyDown, props(index) -> {ref, tabIndex, onKeyDown} }`; ArrowLeft/Right wrap, Home/End; exactly one Tab stop (clamped at both ends) | **port-as-is** | Excerpt B. Add `dir` awareness for RTL |
| Typing target guard | `src/lib/keyboard/typingTarget.ts` | `isTypingTarget(target)`, `CODE_EDITOR_SELECTOR` | True for input/textarea/select/contenteditable (and Monaco) so window shortcuts leave typing alone | **port-as-is** | Drop the Monaco selector. Use in every global shortcut handler |
| Theme hook | `src/lib/theme.ts` | `useTheme`, `applyTheme`, `getInitialTheme`, `useEffectiveTheme`, `adoptAccountTheme` | see section 1 | **already ported** | `adoptAccountTheme` (server-saved preference fills the gap only when the browser has no local choice) is a nice extra if Rasikh stores a profile |
| cn | `src/lib/cn.ts` | `cn`, `BENCH_TEXT_SIZES` | see section 1 | **port-as-is** | Excerpt A |
| Safe user errors | `src/lib/safeError.ts` | `userMessage(err, fallback)` | Maps errors to chosen sentences, never forwards `err.message` | **pattern-only** | Backend-leak rule is good; the implementation is Firebase-specific |

---

## 4. Patterns worth copying

1. **Folder conventions.** `src/app/` routes + `globals.css` + `layout.tsx` only; `src/components/<feature>/` with the test colocated as `X.test.tsx`; `src/lib/` for pure logic and hooks (tests colocated); `src/store/` zustand; `src/context/`; `src/types/`. The shared primitives are oddly filed under `components/sim/` and `components/ui/`. For Rasikh use `src/components/ui/` (primitives), `src/components/shell/`, `src/components/data/` (charts/meters), `src/lib/`.
2. **File-size discipline: the source is NOT a model here.** `BenchPrimitives.tsx` is 1047 lines (14 components), `ForgeShell.tsx` 953 lines (about two-thirds comments), `DesignSystemGallery.tsx` 76 KB, `SimulatorLayout.tsx` 38 KB. Port one component per file, and keep the one-line "why" from each comment but not the multi-paragraph essays.
3. **Variants via `data-*` attributes + one CSS layer**, not conditional class soup: `data-variant`, `data-density`, `data-shape`, `data-icon-only`, `data-tone`, `data-align`. Style hooks are attribute selectors (specificity 0-2-0), so they win ties deterministically. Props objects (`benchControlProps`, `benchCardProps`) are spreadable on `<Link>`/`<button>`/`<div>` so a link is a first-class button.
4. **`:where()` for defaults a caller may override, locked rules for the system.** A property a caller legitimately varies (card `display`, text colour) sits inside `:where(.cardSurface){...}` (specificity 0) so any utility beats it; a property that IS the system (radius, control fill) stays locked. `cascadeOrder.test.ts` is the guard.
5. **Theming tokens.** RGB triplets in CSS variables, `rgb(var(--x) / <alpha-value>)` in Tailwind; dark = a second block re-pointing the same names; roles not shades (the near-black `solid` is a role and inverts in dark); status colours flip, so ink on status fills is `text-bench-bg`; scrims are literal `bg-black/40` (a token would lighten the page in dark).
6. **Contrast is a unit test, not a review comment.** `src/components/sim/design-system/tokens.test.ts` parses `globals.css`, computes WCAG ratios for every text/surface pair in both themes (4.5:1 text, 3:1 control border/focus/solid fill), and adds "TEETH" (re-point `solid` at `subtle` and assert it fails) and "VACUITY" (assert the parse found something) cases. `tokenTruth.test.ts` asserts every `/* #RRGGBB */` comment equals the triplet beside it. Port both (minus the KL25Z artwork-coupling test).
7. **Source-policy "ratchet" tests** that scan `.tsx` and fail on drift: `typeScale.test.ts` (no sub-12px, no raw `text-xs/sm`), `containerTokens.test.ts` (no raw `rounded-lg`/`shadow-2xl`), `iconScale.test.ts`, `inkOnFill.test.ts`, `controlSprawl.test.ts` (cap on hand-rolled button shapes that may fall but not rise). Valuable if Rasikh will be built by multiple agents; the FOCUS lists and caps are repo-specific.
8. **A design-system page** (`src/app/design-system/page.tsx` -> `DesignSystemGallery`) with `robots: { index: false }`, laid out AS the real shell (top bar + grouped sidebar + content), one `BenchSection` per primitive family, working state (a real form that validates, toasts and opens a dialog), and "Do / Do not" specimens made of non-interactive spans so they add no tab stops. Copy the structure, not the 76 KB.
9. **Accessibility practices** (asserted in `ShellAccessibility.test.tsx`, `BenchPrimitives.test.tsx`): one Tab stop per tab strip / segmented control / splitter; `role=tablist/tab/tabpanel` with `aria-controls/aria-labelledby` and unique ids via `useId`; segmented = `radiogroup`; switch = `role=switch` named by `aria-labelledby`; combobox + `aria-activedescendant`; splitter with `aria-valuenow/min/max`; icon-only buttons require `aria-label`; collapsed nav keeps `role=group aria-label` and `aria-label` on rows, `title` only when collapsed; status messages are `role=status`/`alert`; a table needs a caption and a focusable labelled scroll region; selected state is never colour-only (white plate + shadow + weight step).
10. **Focus management.** Overlays store `document.activeElement` on open and restore it on close only if `isConnected`; menus return focus to the trigger on Escape; dialogs use native `showModal()` plus an explicit Tab trap that ignores hidden/inert nodes; toasts pause on focus and return focus to the previous element on dismiss; the phone drawer moves focus in and back to the menu button; closed drawers and collapsed split panes are `inert` but stay mounted (state preserved). Global `*:focus-visible{outline:2px solid rgb(var(--bench-focus));outline-offset:2px}`; rings inside clipped scrollers are `outline-offset:-2px`.
11. **Keyboard handling.** Global shortcuts (Ctrl/Cmd+K palette, `?` cheat sheet, Ctrl+B/J panels) always check `isTypingTarget`; roving tabindex hook; splitter arrows/Home/End/Enter; menu arrows/Home/End/Esc/Tab-closes.
12. **Hydration-safe client state.** First render is always the default; stored values applied in `useEffect`; every `localStorage`/`sessionStorage`/`matchMedia` call is `try/catch`ed or feature-checked; no `Math.random`, `Date.now()` in render, or locale-dependent `toLocaleString` in render; CSS (not JS) decides responsive layout (`md:hidden`/`max-md:hidden`) so server and client markup agree.
13. **Reduced motion done properly.** A global block shortens all animation, but spinners/`[data-bench-busy]` keep running as an opacity pulse because a frozen spinner is worse than the spin the user opted out of; components additionally use `motion-reduce:` variants.
14. **Control geometry is measured and written down.** Each rule in the CSS module cites the reference capture it came from (control 40/32, track 36, switch 40x24, thumb 18, card radius 12, dialog 16). When restyling, change values deliberately and keep the comment trail.
15. **One emphasis per screen.** The near-black primary button / selected chip is the only strong fill; everything else is a hairline or grey plate. Group labels are muted sentence case 13px (not small caps); uppercase+tracking is reserved for role labels and table captions.

---

## 5. Gotchas

1. **CSS Modules lose specificity ties to Tailwind utilities (silent no-ops).** `.button{justify-content:center}` and `.justify-start` are both 0-1-0; the module is emitted AFTER utilities, so the module wins and `className="justify-start"` (or `flex`, `text-teal-500`) on a primitive does nothing. The source hit this three times and added `data-align`, `:where()` defaults, and `cascadeOrder.test.ts`. **For Rasikh, avoid the trap: re-express the primitives as Tailwind class maps (e.g. a `variants` object keyed by `variant`, merged by `cn`) or use `data-[variant=primary]:...` arbitrary-variant classes, so `cn`/tailwind-merge resolves overrides.** Do not use `@layer components` inside a CSS module (Tailwind 3 rejects it without `@tailwind components` in the same file).
2. **No i18n and no RTL anywhere.** `<html lang="en">` with no `dir`; every string is English and hard-coded, including `aria-label`/`title` (`Close navigation`, `Dismiss ${title}`, `No rows to display.`, ` (required)`, `Type a command or file name…`). There is no i18n library. Physical properties dominate: `left-/right-/ml-/mr-/pl-/pr-/text-left/rounded-l`, `translate-x`, `to right` gradients, `margin: -4px -6px 0 0`, `translate: 16px 0` (switch knob), `padding-right: 38px` (select), the drawer (`left-0 -translate-x-full`), the rail inset (`mr-[…]`/`ml-[…]`), `HSplit` pointer maths, `useRovingTabs` (ArrowRight=next), the literal `›` card chevron, `ChevronRight` breadcrumb separators, directional icons (`PanelLeftClose/Open`), `Sparkline`/`BarSeries` x-direction, `BenchTable` `align:'left'|'right'`. **Port with Tailwind logical utilities (`ms-/me-/ps-/pe-/start-/end-/text-start/text-end/rounded-s/e`), `rtl:` variants for the few that need mirroring, and pass strings in or use a message catalogue.** The one plus: ~80% of layout is flex/gap, which mirrors for free once `dir="rtl"` is set.
3. **Desktop-first and page-scroll-locked.** `html,body{height:100%;overflow:hidden}` and `<body class="h-screen overflow-hidden">`: the app scrolls inside `<main>`. That breaks mobile browser chrome collapse, pull-to-refresh and anchor scrolling, and makes marketing/landing pages impossible. `h-screen` should be `h-dvh`. There is **no bottom tab bar, no safe-area (`env(safe-area-inset-*)`) handling, no tap-highlight/overscroll rules** in the shared UI. Compact controls are 32px (below the 44px touch guideline): use `density="normal"` (40px) or add a larger rung on mobile. The newcomer mobile app needs a bottom-nav primitive that does not exist in this repo.
4. **`input, select, textarea { color-scheme: light }` in globals.css** pins native widgets to light for ~240 legacy sim forms. Bench fields opt back in with `color-scheme: inherit`. Do not port the global rule; set `color-scheme` on `:root` and `.dark` only.
5. **`ForgeShell` is wired to Firebase and the LMS role model:** `useProfile`, `useRoleAtLeast` (student/faculty/institutionAdmin/admin/superAdmin), `signOut()`, `useAppStore.dashboardTab` (a store-driven "tab" navigation model for a static export), `NotificationBell` (Firestore inbox). Role gating in the nav is client convenience only. Re-parameterise instead of copying; the three Rasikh dashboards (employer/landlord/bank) each need a different nav config.
6. **Stale design values and docs.** `docs/design-system.md` + `design-system-components.md` describe the withdrawn warm palette; `THEME_COLOR_LIGHT/DARK` in `layout.tsx` (`#F7F7F8`/`#1E1E1E`) and `PLATFORM.ground` in the source `src/lib/theme.ts` no longer equal `--bench-panel` (now `#F1F1F1`/`#141414`); `--bench-control-height` (32px) disagrees with the measured 40px literals; the stale docs say 10px corners and `EditorShell`'s comment says the sheet corner is "~10px" while the token is 12px. `StatusBar` and `LoadingOverlay` still carry raw colour palettes. Verify any number against `globals.css` and the CSS module, not prose.
7. **Heavy dependencies that must NOT come across** (all in the source `package.json`): three/r3f/drei/postprocessing, cesium, molstar, monaco-editor + `@monaco-editor/react`, blockly, firebase, digitaljs/yosys/nextpnr (WASM), pyodide, quickjs, replicad/opencascade, yjs/y-webrtc/y-monaco, `@xyflow/react`, katex, recharts, `react-resizable-panels`, satellite.js, web-tree-sitter. The UI layer itself needs only `clsx`, `tailwind-merge`, `lucide-react` (+ optional `zustand`). `layout.tsx` imports `molstar` and `katex` CSS globally; drop those.
8. **Domain-coupled globals and tests.** ~900 lines of `globals.css` are sandbox/React-Flow/Blockly/MIZAN CSS. `tokens.test.ts` has one test coupled to a KL25Z artwork script (`scripts/kl25z/art-edges.mjs`); `typeScale/iconScale/controlSprawl` FOCUS lists name FPGA directories and sims. `vitest.config.ts` has three.js aliases and 60s timeouts for engine tests. Copy only the generic parts.
9. **Naming leaks the FPGA domain.** The prefix `bench` ("workbench"), the `src/components/sim/` folder name, `forge-*` storage keys/classes (`forge-theme`, `forge-pop-in`, `forge-hsplit:`) and `PanelBoundary` copy ("The rest of Forge"). Decide on a prefix once (the lead may keep `bench-*` for max reuse or run a mechanical rename). The rename touches: `--bench-*` vars, `tailwind.config` key `bench`, classes `text-bench-*|bg-bench-*|rounded-bench*|shadow-bench*|font-bench*`, `BENCH_TEXT_SIZES` in `cn.ts` and `cn.test.ts`, and the regexes in `tokens.test.ts`.
10. **tailwind-merge 3.5 is built for Tailwind 4 class names but is used here with Tailwind 3.4.19.** It works in the source (the same pinned pair is in the Rasikh scaffold) because custom tokens are registered by hand, but unknown class families are treated as "never conflicts": `rounded-bench` + `rounded-bench-pill` both survive, `size-icon-md` + `size-icon-lg` both survive (verified). If you need overrides on those, extend `rounded` and `size` groups in `cn.ts`, or pass classes that tailwind-merge already knows.
11. **Google Fonts `@import`** is a render-blocking third-party request, and the repo ships two unused Geist `.woff` files. Rasikh already self-hosts Inter via fontsource: keep that.
12. **Comment essays inside code.** Several files carry 40-100 lines of history ("the previous cut did X") above the component. They contain real rationale but will bloat a small demo repo and rot (see item 6). Keep a one-line why.
13. **Behavioural traps documented in the source worth remembering:** `fixed`-position popovers inside `overflow:hidden` or transformed ancestors; `title` tooltips are not accessible on touch; `ActivityBar` collapse control is opt-in because a hidden width change broke a shell that measured the bar in pixels; `<dialog>` + `aria-modal` must really trap focus (the source's `ShortcutsOverlay` once did not); `focus:` not `focus-visible:` is intentionally used on programmatically focused menu items.
14. **Static-export assumptions.** `trailingSlash:true` (so `usePathname()` returns `/ai/`), no `useSearchParams`, no server components for state. Rasikh (normal Next) can use cookies/headers for theme SSR instead of a localStorage-only boot script; but the inline boot script is still the simplest no-flash approach.

---

## 6. Recommended port list (ordered)

"Rasikh target" paths are suggestions that fit the scaffold's `@/*` alias.

### Phase 1: foundation
1. **Token layer.** Source: `src/app/globals.css` lines 71-391 (token blocks), 468-493 (`svg.lucide` stroke, `.text-bench-meta`), 613-615 + 641-673 (shimmer keyframe, global focus ring, pop-in/fade-in), 676-713 (scrollbar, selection), 715-754 (reduced-motion). Source: `tailwind.config.ts` (the `bench` colour block, `fontSize`, `size/width/height` icon rungs, `borderRadius`, `boxShadow`, `maxWidth.bench`). Target `[rasikh] src/app/globals.css` + `tailwind.config.ts`. Drop `overflow:hidden` and the global `color-scheme: light` on fields (gotchas 3-4).
2. **`cn`.** Source `src/lib/cn.ts` + `src/lib/cn.test.ts`. Target `[rasikh] src/lib/cn.ts`.
3. **Theme boot + meta theme-color.** Source `src/app/layout.tsx` lines 58-126 and 128-158 (`THEME_COLOR_*`, `viewport`, `THEME_BOOT`, `suppressHydrationWarning`). Target `[rasikh] src/app/layout.tsx`, keyed to `rasikh-theme` (excerpt E). `[rasikh] src/lib/theme.ts` already exists.
4. **Contrast guard tests.** Source `src/components/sim/design-system/tokens.test.ts` + `tokenTruth.test.ts` (drop the KL25Z test and the static-scale test). Target `[rasikh] src/styles/tokens.test.ts`.
5. **Interaction hooks.** Source `src/components/sim/useRovingTabs.ts` (+ test), `src/lib/keyboard/typingTarget.ts`. Target `[rasikh] src/lib/use-roving-tabs.ts`, `src/lib/typing-target.ts`.

### Phase 2: base primitive set (one file each, from `src/components/sim/BenchPrimitives.tsx` + `benchPrimitives.module.css`)
6. `Button` (+ `benchControlProps`) lines 25-239 / css 45-218 (excerpt D).
7. `Field` + `Input` + `Textarea` + `Select` lines 306-474 / css 292-433.
8. `Switch` lines 582-638 / css 537-598.
9. `Badge` lines 891-903 / css 959-992.
10. `Segmented` lines 241-304 / css 220-290.
11. `Dialog` lines 905-1047 / css 994-1073.
12. `Section` + `Card` lines 640-722 / css 600-704, then `Tabs` 816-889 / css 869-957 (replace `BottomTab` with a local `TabItem`), `Table` 724-814 / css 802-867, `Slider` 476-580 / css 435-535.
13. `Skeleton` `src/components/ui/Skeleton.tsx` (excerpt C), `EmptyState` `src/components/sim/EmptyState.tsx`, `Toast` `src/components/ui/Toast.tsx`.
14. Build fresh (not in source): `Spinner`, `Tooltip`, `Kbd`, `Avatar`, `Menu/Popover` (extract `useDismiss` + `MenuPanel/MenuButton` from `src/components/sim/DesignSystemGallery.tsx` lines 316-456 and add MenuBar's arrow-key handling from `src/components/sim/MenuBar.tsx` lines 165-305).

### Phase 3: app shell (desktop dashboards)
15. **Shell frame + nav**: `src/components/shell/ForgeShell.tsx`: `ForgeShell` (446-580), `NAV_ROW*` (280-304), `routeIsActive` (145-148), `useNarrowViewport` (404-415), `useNavCollapseState` (417-445), `NavHeading`/`NavSection`/`NavLink`/`NavButton` (736-838). Strip Firebase/role/store; take `nav` and top-bar slots as props. Optionally start from `src/components/sim/ActivityBar.tsx` for the data-driven rows.
16. **Top bar** layout from `ForgeShell.tsx` lines 840-924 (menu button `<md`, brand, spacer, actions slot).
17. **Theme toggle** from `ForgeShell.tsx` lines 926-953 (excerpt E).
18. `ErrorBoundary` from `src/components/ui/PanelBoundary.tsx` (strip libs), `CommandPalette` from `src/components/sim/CommandPalette.tsx` (dashboards only).

### Phase 4: dashboards and chat
19. `BenchData` (Sparkline, BarSeries, MetricCard, StatRail, BudgetMeter, FilterChip) from `src/components/sim/BenchData.tsx` + `benchData.module.css` (convert to Tailwind per gotcha 1).
20. `Markdown` from `src/components/ui/Markdown.tsx` for AI answers. Chat composer + chat column rebuilt in Tailwind from the idiom in `src/components/ai/AIComposer.tsx` (pill/28px container, solid circular `ArrowUp` send, Stop while busy, Enter/Shift+Enter) and `src/components/ai/AIChatPanel.tsx` (768px centred column, subtle-plate user bubble, flat assistant turn, action row); add `--bench-radius-xl: 28px`.
21. `/design-system` page structure from `src/app/design-system/page.tsx` + `src/components/sim/DesignSystemGallery.tsx` (structure only).

### Not available, must be designed new
Mobile bottom tab bar + safe-area handling, RTL/i18n layer, stepper/progress for the relocation journey, document upload/dropzone, avatar, tooltip, spinner. (A chat composer + chat panel DO exist in the source, but as inline-style pattern references only: see 3.4b.)

---

## 7. Code excerpts (originals, comments trimmed)

Names are the source's (`bench-*`). Port deltas are listed after each block.

### A. `cn` with the bench-aware tailwind-merge (src/lib/cn.ts)

```ts
import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// `text-bench-*` shares the `text-` prefix between SIZES and COLOURS. Plain twMerge files both
// under one group and silently drops one (black label on black fill). Name the sizes explicitly.
export const BENCH_TEXT_SIZES = [
  'bench-caption', 'bench-meta', 'bench-label', 'bench-body', 'bench-title', 'bench-section', 'bench-page',
] as const;

const SIZES = new Set<string>(BENCH_TEXT_SIZES);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [(value: string) => SIZES.has(value)] }],                       // sizes
      'text-color': [{ text: [(value: string) => value.startsWith('bench-') && !SIZES.has(value)] }], // ink
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Port deltas: keep `BENCH_TEXT_SIZES` in lockstep with `fontSize` keys in `tailwind.config.ts` (the source test reads the config and fails if they drift; `bench-meta` is the one hand-written class that is not a config key). Optionally add `rounded` (`bench-sm|bench|bench-card|bench-lg|bench-pill|bench-panel`) and `size` (`icon-*`) groups so overrides merge. Tests to copy: `cn('text-bench-solid-fg text-bench-body')` keeps both, in either order; `cn('text-bench-body text-bench-title')` -> `'text-bench-title'`; `cn('text-sm text-bench-body')` -> `'text-bench-body'`.

### B. Roving tabindex hook (src/components/sim/useRovingTabs.ts)

```tsx
'use client';

import { useRef, type KeyboardEvent } from 'react';

/** One Tab stop per strip; arrow keys select and focus the adjacent view. */
export function useRovingTabs(count: number, selected: number, select: (index: number) => void) {
  const refs = useRef<Array<HTMLElement | null>>([]);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    if (!count) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % count; break;
      case 'ArrowLeft': next = (index + count - 1) % count; break;
      case 'Home': next = 0; break;
      case 'End': next = count - 1; break;
      default: return;
    }
    event.preventDefault();
    select(next);
    refs.current[next]?.focus();
  };
  return {
    onKeyDown,
    props: (index: number) => ({
      ref: (node: HTMLElement | null) => { refs.current[index] = node; },
      // Exactly one item carries the Tab stop. Clamp BOTH ends: a findIndex miss arrives as -1 and
      // a stale index arrives too large when the list shrinks; unclamped, no item matched and the
      // whole strip fell out of the tab order.
      tabIndex: index === Math.min(count - 1, Math.max(0, selected)) ? 0 : -1,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => onKeyDown(event, index),
    }),
  };
}
```

Usage: `const nav = useRovingTabs(tabs.length, activeIndex, (i) => onChange(tabs[i].id));` then `<button role="tab" {...nav.props(index)} aria-selected=... />`. Port deltas: add an optional `dir: 'ltr' | 'rtl'` argument and swap Left/Right when `rtl` (or read `document.dir`); add `ArrowUp/ArrowDown` for vertical lists.

### C. Skeleton (src/components/ui/Skeleton.tsx) + required keyframe

```tsx
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-bench bg-bench-subtle',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-bench-bg/70 before:to-transparent',
        'motion-reduce:before:animate-none',
        className,
      )}
    />
  );
}
```

```css
/* globals.css */
@keyframes shimmer { 100% { transform: translateX(100%); } }
```

Port deltas: for RTL add `rtl:before:translate-x-full rtl:before:bg-gradient-to-l` and a mirrored keyframe (or use `animation-direction`); mark skeleton wrappers `aria-hidden` and put `aria-busy="true"` on the region being loaded.

### D. Button (src/components/sim/BenchPrimitives.tsx lines 25-239 + benchPrimitives.module.css lines 45-218)

```tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './benchPrimitives.module.css'; // see Gotcha 1: prefer Tailwind classes keyed on these data-attributes

export type BenchDensity = 'normal' | 'compact';
export type BenchShape = 'rounded' | 'pill';
export type BenchButtonVariant = 'primary' | 'secondary' | 'quiet' | 'soft' | 'ghost' | 'destructive';

export interface BenchControlLook {
  variant?: BenchButtonVariant; density?: BenchDensity; shape?: BenchShape;
  fullWidth?: boolean; iconOnly?: boolean; tone?: 'default' | 'danger' | 'success';
  align?: 'center' | 'start'; className?: string;
}

/** The look as spreadable props: works on <button>, <Link>, <a>. */
export function benchControlProps({
  variant = 'quiet', density = 'normal', shape = 'rounded',
  fullWidth, iconOnly, tone = 'default', align = 'center', className,
}: BenchControlLook = {}) {
  return {
    'data-variant': variant,
    'data-density': density,
    'data-shape': shape === 'pill' ? ('pill' as const) : undefined,
    'data-full': fullWidth ? ('true' as const) : undefined,
    'data-tone': tone === 'default' ? undefined : tone,
    'data-icon-only': iconOnly ? ('true' as const) : undefined,
    'data-align': align === 'start' ? ('start' as const) : undefined,
    className: cn(styles.button, styles.focus, className),
  };
}

export function BenchControlIcon({ children }: { children: ReactNode }) {
  return <span className={styles.buttonIcon} aria-hidden="true">{children}</span>;
}

export interface BenchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BenchControlLook {
  icon?: ReactNode; // aria-hidden; an iconOnly button MUST still pass aria-label
}

export const BenchButton = forwardRef<HTMLButtonElement, BenchButtonProps>(function BenchButton(
  { variant, density, shape, fullWidth, icon, iconOnly, tone, align, className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button {...props} ref={ref} type={type}
      {...benchControlProps({ variant, density, shape, fullWidth, iconOnly, tone, align, className })}>
      {icon !== undefined && icon !== null && <BenchControlIcon>{icon}</BenchControlIcon>}
      {children}
    </button>
  );
});
```

```css
/* benchPrimitives.module.css (measured: control 40px / compact 32px, radius 8px, text 15px / 13px) */
.button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px;
  padding:0 16px; border:1px solid transparent; border-radius:8px; font:inherit;
  font-size:var(--bench-text-body,15px); font-weight:500; line-height:1.2; white-space:nowrap; cursor:pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease; }
.button[data-shape='pill'] { border-radius:999px; padding:0 20px; }
.button[data-full='true'] { width:100%; }
.button[data-align='start'] { justify-content:flex-start; }
.button[data-density='compact'] { min-height:32px; padding:0 12px; gap:6px; font-size:var(--bench-text-label,13px); }
.button[data-icon-only='true'] { gap:0; padding:0; width:40px; }
.button[data-icon-only='true'][data-density='compact'] { width:32px; }
.buttonIcon { display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
:where(.buttonIcon) > svg { width:16px; height:16px; stroke-width:1.75; }
:where(.button[data-density='compact'] .buttonIcon) > svg { width:14px; height:14px; }

.button[data-variant='primary'] { background:rgb(var(--bench-solid)); color:rgb(var(--bench-solid-fg)); }
.button[data-variant='quiet'], .button[data-variant='secondary'] {
  background:rgb(var(--bench-bg)); color:rgb(var(--bench-text)); border-color:rgb(var(--bench-control-border)); }
.button[data-variant='ghost'] { background:transparent; color:rgb(var(--bench-muted)); }
.button[data-variant='soft'] { background:rgb(var(--bench-subtle)); color:rgb(var(--bench-text)); }
.button[data-variant='destructive'] { background:rgb(var(--bench-danger)); color:rgb(var(--bench-bg)); } /* bg, NOT white: danger flips pale in dark */

.button[data-variant='primary']:hover:not(:disabled)     { background:rgb(var(--bench-solid) / 0.86); }
.button[data-variant='destructive']:hover:not(:disabled) { background:rgb(var(--bench-danger) / 0.86); }
.button[data-variant='quiet']:hover:not(:disabled), .button[data-variant='secondary']:hover:not(:disabled),
.button[data-variant='ghost']:hover:not(:disabled) { background:rgb(var(--bench-subtle)); color:rgb(var(--bench-text)); }
.button[data-variant='soft']:hover:not(:disabled) { background:rgb(var(--bench-text) / 0.12); }
.button[data-tone='danger'], .button[data-tone='danger']:hover:not(:disabled) { color:rgb(var(--bench-danger)); }
.button[data-variant='ghost'][data-tone='danger']:hover:not(:disabled) { background:rgb(var(--bench-danger-soft)); }
.button[data-tone='success'], .button[data-tone='success']:hover:not(:disabled) {
  background:rgb(var(--bench-success-soft)); color:rgb(var(--bench-success)); }
.button:disabled { cursor:default; opacity:0.55; }
.focus:focus-visible { outline:2px solid rgb(var(--bench-focus)); outline-offset:2px; }
```

Port deltas: (1) to avoid the CSS-module specificity trap, translate each `[data-*]` rule into `data-[variant=primary]:bg-bench-solid ...` Tailwind classes (or a `variantClasses` record) so `cn()` merges caller classes correctly; (2) `data-icon-only` should size to 44px on touch breakpoints; (3) pass visible-text strings in; (4) RTL: nothing to flip (symmetric padding) except icons that are directional; use `gap` not `ml-`.

### E. Theme boot script + toggle (src/app/layout.tsx lines 58-126, ForgeShell.tsx lines 926-953)

```tsx
// [rasikh] src/app/layout.tsx  (keys changed to the existing rasikh-theme)
// Set these to the ACTUAL --bench-panel values (source drifted: it used #F7F7F8 / #1E1E1E, but panel is #F1F1F1 / #141414).
const THEME_COLOR_LIGHT = '#F1F1F1';
const THEME_COLOR_DARK = '#141414';

export const viewport = { themeColor: THEME_COLOR_LIGHT, colorScheme: 'light dark', width: 'device-width', initialScale: 1 };

// Runs before React hydrates: no flash. NOTE default is LIGHT, not the OS (stored 'system' is honoured).
const THEME_BOOT = `
(function(){
  try {
    var LIGHT = ${JSON.stringify(THEME_COLOR_LIGHT)};
    var DARK = ${JSON.stringify(THEME_COLOR_DARK)};
    var saved = localStorage.getItem('rasikh-theme');
    var dark = saved === 'dark' ||
      (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'theme-color'); document.head.appendChild(meta); }
    meta.setAttribute('content', dark ? DARK : LIGHT);
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>   {/* make lang/dir dynamic for EN/AR */}
      <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} /></head>
      <body suppressHydrationWarning className="min-h-dvh bg-bench-bg text-bench-text antialiased">{children}</body>
    </html>
  );
}
```

```tsx
// ThemeToggle (ForgeShell.tsx): icon-only ghost pill that cycles light -> dark -> system.
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemeChoice } from '@/lib/theme';   // [rasikh] useThemeChoice in src/lib/theme.ts
import { BenchButton } from '@/components/ui/button';

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const next: Record<ThemeChoice, ThemeChoice> = { light: 'dark', dark: 'system', system: 'light' };
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const label = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';
  return (
    <BenchButton
      variant="ghost" density="compact" shape="pill" iconOnly
      onClick={() => setTheme(next[theme])}
      title={`Theme: ${label} — click to switch`}
      aria-label={`Theme: ${label}. Click to switch theme.`}
      icon={<Icon />}
    />
  );
}
```

Port deltas: translate `label`/`title`/`aria-label` through i18n; `[rasikh] src/lib/theme.ts` exports `useThemeChoice` and `useResolvedTheme` (renamed from `useTheme` / `useEffectiveTheme`); add `lang` and `dir` to `<html>` from the locale (and set `dir` in the same boot script if the locale is stored client-side).

### F. Sidebar row + active-route helper (ForgeShell.tsx lines 145-148, 284-304; for the shell port)

```tsx
export function routeIsActive(pathname: string, route: { href: string; match?: string }): boolean {
  const base = (route.match ?? route.href).replace(/\/+$/, '');
  return pathname === base || pathname.startsWith(`${base}/`);
}

// 46px pitch, 10px-radius plate inset by the nav's px-2, 20px icon, 15px label. Active = neutral plate, never accent.
export const NAV_ROW =
  'w-full flex items-center gap-3 h-[46px] px-3 mb-1 rounded-[10px] text-bench-body transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bench-focus focus-visible:ring-offset-0';
export const NAV_ROW_IDLE = 'text-bench-text hover:bg-bench-subtle';
export const NAV_ROW_ACTIVE = 'bg-bench-subtle text-bench-text font-medium';
export const NAV_ROW_SHUT = 'justify-center gap-0 px-0'; // appended AFTER NAV_ROW; relies on tailwind-merge so px-0 beats px-3

// Floating-sheet frame (ForgeShell): ground = panel, content = rounded bench-bg sheet inset 12px right/bottom.
//   <div className="h-dvh w-screen bg-bench-panel flex flex-col overflow-hidden">
//     <TopBar/>  {/* height: var(--bench-topbar-height) */}
//     <div className="flex-1 flex min-h-0">
//       <aside className={cn('shrink-0 flex flex-col min-h-0 overflow-hidden transition-[width] duration-300',
//                            collapsed ? 'w-[68px]' : 'w-[240px] md:w-[264px]',
//                            'max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:z-[70] max-md:max-w-[85vw] max-md:bg-bench-panel max-md:shadow-bench-pop',
//                            drawerOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full rtl:max-md:translate-x-full')}
//              inert={drawerShut || undefined}>{sidebar}</aside>
//       <main className="flex-1 min-w-0 bg-bench-bg rounded-bench-panel overflow-auto me-[var(--bench-panel-inset)] mb-[var(--bench-panel-inset)]" />
//     </div>
//   </div>
```

The commented frame already shows the RTL-ready logical-property substitutions (`start-0`, `me-`, `rtl:` translate) the port should use.
