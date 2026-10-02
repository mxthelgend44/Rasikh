# Measurement: tables, lists, status pills and feedback states (key: tables-feedback)

Packs: "OpenAI Platform web Apr 2026" (dense desktop dashboards, Rasikh employer / landlord / bank) and "ChatGPT web Mar 2026" (Rasikh newcomer app, agent feed).
All numbers come from pixels (PIL + numpy on the images with the 120 px Mobbin footer cropped off). `px` = screenshot pixels, `css` = px / 1.27. Colours are flat-region samples; text colours are the mean of the darkest glyph pixels (a lower bound on darkness; red/orange glyphs are chroma-softened, see Uncertainties).

## 1. Scale and crop

- Crop: platform viewport = 1920 x 1205, chatgpt viewport = 1920 x 1200 (bottom 120 px removed). Nothing under `.reference` was modified. Scratch crops live in the session scratchpad only.
- Assumed scale: **1.27 screenshot px per css px** (a ~1512 css px wide viewport resized to 1920).
- Anchors that fix it for the ChatGPT pack (known web constants): sidebar border at x = 329 -> 330 px = **260 css**; composer pill 636..1613 -> 978 px = **768 css (48rem)**; header rule at y = 66 -> **52 css**; "Archived chats" modal 1300 px = 1024 css. All land within 0.5 percent of whole css values.
- Anchors for the Platform pack (no known web constant, so +/-3 percent): 13 Logs-table row rules at 57.14 px pitch -> **45.0 css**; modals 570/634/660 px -> 449/499/520 css; dataset-grid pitch 45.7 px -> 36.0 css; sidebar item 41 px -> 32 css; avatar 30.5 px -> 24 css; cap height of nav text (13 rows) matches ChatGPT 14 css text (13 rows), so both packs use the same CSS-px scale. If the true scale were 1.33 every Platform css figure would be ~4 percent smaller.
- Hairlines: a 1 css px line is 1.27 px wide and renders over 2 rows. Hairline colours below are **integrated** estimates (sum of deviation from background / 1.27); the single darkest pixel is lighter or darker than the true colour depending on sub-pixel phase.
- Cap-height to font-size calibration: 14 css text = 13 rows, 16 css = 15-16 rows, 12 css = 11-12 rows (checked in sidebar and composer text of both packs). Font sizes below are therefore +/-1 css.

## 2. What exists and what does not (be honest)

Present in the packs: dense static tables (Platform Logs, API keys, Projects, Limits, Billing, dataset grid), master-detail lists, two-line list rows (ChatGPT), a modal table, a comparison table inside a chat reply, status pills, toasts, callouts, empty states, skeletons, spinners, one progress card, budget / credit meters, usage charts (light + dark), a service-health area chart.

NOT present, so NOT measurable (do not invent): sortable-header carets or active-sort state; sticky header behaviour; row hover background (only a revealed kebab on ChatGPT 208 with no fill change); bulk-selection bar and header "select all"; numeric pagination (only a "Load more" button on Platform 329/369); keyboard focus rings on rows; animation timing and shimmer speed; any mobile or narrow layout in either pack (both are 1920 px desktop captures); any Arabic / RTL screen; any confidence meter; any ChatGPT-pack chart.

## 3. Tables and lists

### 3.1 Platform (desktop dashboards)

Three header recipes plus one list recipe, all inside the white inset card (card = x 278..1910, y 69..1194, 1 px #ececec edge, 8 css gap right and bottom).

| Recipe | Where | Header | Rows |
|---|---|---|---|
| A. Band table (Logs) | 249, 253, 250, 298, 95 | 30 css tall, fill `#f9f9f9`, 12 css regular labels (near-black `#1b1b1b`), no border | 45 css pitch (57.14 px), 1 px rule integrated `#eaeaea`, no zebra, no column rules, no outer border, single-line ellipsis, 14/21 css cells (`#080808`, secondary `#464646`) |
| B. Plain settings table | 225, 329, 331/391, 373, 369 | no fill, UPPERCASE 12 css weight 500, near-black `#0c0c0c`, letter-spacing ~0.04em (est.) | 41 css pitch (Limits, 331: 52.0 px) or 59 css (Projects, 329: 74.8 px); 1 px rule `#e8e8e8`..`#ededed`; numeric columns right-aligned with right-aligned header; names semibold, IDs mono |
| C. Data grid | 87, 297 (88 same grid) | 36 css, fill `#eeeeee`, 14 css grey `#4b4b4b`, full-bleed | 36 css pitch (45.7 px), 1 px rules `#eaeaea` plus 1 px column rules `#ededed`, trailing narrow icon columns (expand glyph, vertical kebab `#474747`) |
| D. Master-detail list | 260, 271, 305 (266 same layout) | none | 66 css pitch (84 px) two-line rows (mono 14 css title, 12 css meta `#434343`, right-aligned date 12 css `#585858`), selected row `#eeeeee` r ~6 css; hairline `#e9e9e9`; detail pane right |
| E. Card rows | 362, 355 | none | 70 css pitch (88.9 px) inside a 1 px `#e1e1e1` card r ~6-8 css, 38 css round avatar tile `#eeeeee`, name 14 css + 14 css `#505050` description, right-aligned secondary/primary buttons and a horizontal ellipsis action |

Details measured:
- Cell inset: first-column text starts 25 px (19.7 -> 20 css) from the card edge in recipe A; page title and recipe B tables start at 24 css (30 px). Recipe B Limits table has 8 css cell padding with the rules bleeding 8 css past the text on both sides.
- Alignment: numbers right-aligned, header right-aligned over them (329 MEMBERS right edge 1392 vs numbers 1393 px; 331 all three numeric columns). IDs and model names in monospace ~13 css (advance ~7.8 css/char -> 0.6 em at 13 css), no chip.
- Row actions: icon buttons ~16 css glyph at the far end (edit/settings `#4d4d4d`, delete/archive red `#9c2e2d`..`#e12e2a`, 225/329); horizontal ellipsis `#898989` (362); trailing kebab (87).
- Toolbar above a table (249, 329, 369): full-radius filter chips 28 css tall (34.3 px + border), 1 px border ~`#d4d4d4`, label `#828282` 14 css, search pill same height, a plain "N results" in `#505050`, applied filter chip is a white pill with a clear (x) glyph (329 "Active"); Export (`#ececec`) and Create (`#181818`) at the right end, 32-34 css tall.
- Pagination: only "Load more", a centred 91 x 32 css button, fill `#ececec`, 14 css label (329, 369).
- Selection checkbox (355, 139, 140): 18 css square, 1 px border ~`#d0d0d0` (peaks `#cccccc`..`#d6d6d6`), r ~4 css, checked fill `#181818` with white tick.
- Sort: none in this pack. Filters are chips, not column carets.

### 3.2 ChatGPT (mobile-first reference)

Lists, not data tables. No card chrome, no zebra, no column headers except two cases.

| Pattern | Screens | Row pitch | Rule | Text |
|---|---|---|---|---|
| Modal table "Archived chats" | 212, 213 | 40.5 css (51.5 px) | header rule `#e7e7e7`, row rules `#e4e4e4`..`#ececec` | header 14 css semibold black; link-blue names (`#235a90` darkest, ~#0a66c2 family), dates black 14 css, right-aligned gray icon actions |
| Saved memories list (modal) | 208 | 45 css (57.3 px) | `#e0e0e0`..`#e5e5e5` | 14-15 css black; row kebab appears on hover with NO background change |
| Two-line source/file rows | 154 (162 same layout, not measured) | 65 css (82.4 px) | `#f0f0f0`..`#f3f3f3` | 14 css medium title, 14 css meta `#505050`, 40 css coloured file tile (PDF red `#fa433f`, document blue `#0385ff`), r ~6-8 css |
| App directory rows | 120, 121, 186 | 72 css (91.5 px) | none | 14 css title, 14 css `#868686` description, 36 css round logo, right chevron `#7d7d7d` |
| Codex task rows | 129, 145, 187 | 71 css (90.2 px) | `#efefef`..`#f2f2f2` (dark `#2c2c2c`) | title ~14-15 css black, meta ~13 css `#858585`, UPPERCASE 12 css `#7f7f7f` group label (TODAY, LAST 7 DAYS), right-aligned diff stats `+28` green ~`#1a8a45` and `-0` red ~`#c23a3a` as plain text (no pill); pills in-row (145): neutral "1 bug", green "Open", neutral outline "Fix" |
| Comparison table in a chat reply | 57 | 69 css two-line rows (87.5 px) | header rule `#d3d3d3`..`#dbdbdb`, row rules `#f1f1f1` (near invisible) | first column bold/medium, cells 14 css / 24 css line height, column pitch 192 css, product image 163 css square r ~12 css |

Dark (ChatGPT 186, 187): canvas `#212121`, row rule `#2c2c2c`, title `#ffffff`, meta ~`#b7b7b7`, sidebar `#212121`.

### 3.3 Where the packs differ

Platform tables are real tables: 12-14 css type, 36-59 css rows, tint header, hairline `#eaeaea`. ChatGPT has only list rows at 40-72 css with lighter hairlines (`#f0f0f0`) and larger type (14-16 css). Use Platform values for employer/landlord/bank dashboards. Use ChatGPT two-line rows (65-72 css, 40 css leading tile, right-aligned status) for newcomer-app lists (documents, approvals, roadmap items).

## 4. Status pills, chips and ID text

### 4.1 Platform recipe: rounded rectangle, tinted fill, saturated dark text, NO border

| Variant | Fill | Text (darkest cluster) | Evidence |
|---|---|---|---|
| success | `#e2f3e6` (range `#daf5e5`..`#e3f2e6`) | `#0b672b` (samples `#016728`..`#146632`) | Ready 260, Usage tier 1 (331), Preset 362, Available 373, Pass 297, Completed 298 |
| error | `#ffe2e3` | `#871d1b` (darkest `#761715`) | Failed 271 detail; on a `#eee` selected row it composites to `#f1d3d2` |
| info / category | `#e3eeff` | `#0c396a` | Global 329 (this one is a FULL-radius pill) |
| neutral | `#ececec` on white (`#dbdbdb` on `#eee`, i.e. black at ~7.5 percent) | `#000000` | Validating 305; Draft `#eeeeee` / `#4c4c4c` (66) |
| amber (model badge A) | `#ffe8c5` | `#7a520f` | 66 |
| lavender (model badge B) | `#d2cff2` | `#261b5c` | 66 |

Sizes (css): small 19 high (23-24 px), 12 css weight 500-600, padding-x ~6 (Global, Preset, Available); medium 21 high (26-27 px), 14 css weight 500, padding-x ~8 (Pass, Completed, Usage tier 1); large 23 high (28-29 px) with a 16 css leading status icon at ~7 css from the edge (Ready, Failed). Radius ~3-4 css from the corner inset profile (3-5 px); pills never have a leading dot except "Live" (333: `#e7f6ef` fill, `#0d9240` text, 8 css dot, 24 css high, full radius).
Inline key/ID chips (66, 98): `#eeeeee` rounded rect ~22 css high, r ~6 css, 14 css text; IDs in tables are bare mono text.

### 4.2 ChatGPT recipe: FULL-radius pills, 22-25 css high

| Variant | Fill | Text | Evidence |
|---|---|---|---|
| success "Open" | `#e1eee3` | `#1e6f35` | 145 (22 css high, 12-13 css medium, leading git-PR glyph) |
| info "Parent" | `#e5f2ff` | `#2977ba` | 222 (25 css high) |
| brand/lavender "RECOMMENDED" | `#dcdbff` on `#f1f1fe` card | `#5754b4`, UPPERCASE ~11 css, tracked | 82 (25 css high) |
| neutral "1 bug" | `#f3f3f3` | `#4d4d4d`, leading info glyph | 145 (24 css) |
| neutral button pill "Fix" | `#f3f3f3` + 1 px `#e9e9e9` | `#000` | 145 |
| outline "BETA" | white + 1 px `#e0e0e0` | `#8a8a8a` UPPERCASE ~10 css | 121 |
| upsell "Get Plus" | `#f1effb` | `#484377` | 22 (35 css high, a button) |

Unread / live dot (22, sidebar): 8 css circle, `#0662c3` (measured darkest, bright-blue family).

### 4.3 Contrast (computed from the measured pairs)

success text on tint 6.1:1 (Platform) / 5.2:1 (ChatGPT); error 7.8:1; Platform info 9.9:1; ChatGPT blue pill 4.2:1 (below AA for small text, darken to `#1f6aa8`); lavender 4.7:1; amber 5.8:1.

## 5. Feedback states

### 5.1 Empty states

- Platform (276, 235, 224, 338, 257): one centred stack, centred horizontally on the card (cx 1093.5 vs card centre 1094) and vertically in the free area (276: block 569..767, centre 668 vs card centre 667.5). Order: 40 css tile (`#eeeeee`, r ~8 css, 20 css outline glyph) -> 16.5-19 css gap (276: 16.5, 235/224: 18, 338: 19) -> title 16 css/24 semibold `#000` -> 13 css -> description 14 css `#505050` one line -> 18 css -> black CTA 33-36 css high (`#181818`, r ~8 css, 14 css medium white, leading + glyph). Titles say what will appear ("Your evaluations will appear here"); some have no description (235, 224) and keep the 17-19 css gap to the CTA.
- Platform in-pane variant (24, 87): 39 css grey tile + one 16 css semibold sentence, no CTA; data grids show 5 blank rows + "+ Add row" instead of an illustration.
- ChatGPT: three variants, all text-first, no illustration. (A) 144: white 44 css tile with soft shadow and a 20 css glyph, 16 css medium title, 16 css `#4c4c4c`..`#525252` two-line description (max ~245 css wide), black pill CTA 35 css high (219 css wide) `#0d0d0d`; gaps tile->title 9 css, title->desc 20 css, desc->CTA 12 css. (B) 151: text only, title 16 css medium + 16 css grey description, 10 css apart. (C) 153: 1 px dashed rounded container (r ~20 css) holding 3 file glyphs, title, description and a small black "Add" pill 28 css high.

### 5.2 Loading

- Platform skeleton (210, 23): real labels and headings render at once; only values/charts are replaced by blocks at final geometry. Fill is a diagonal gradient `#efefef` -> `#f7f7f7` (210) or horizontal `#e8e8e8` -> `#f3f3f3` on a `#f9f9f9` panel (23); block radius ~8 css; value chip 100 x 24 css; chart block 924 x 280 css; list rows 28 css high on a 36 css pitch (r ~8 css); text bars ~14 css high on a 25.5 css pitch, varied widths, full radius.
- Spinner (98, 245, 16, 47): 20 css ring (24 px), ~2 css stroke, conic fade (dark head `#0d0d0d` fading to transparent over ~270 deg). In a button it replaces the label and keeps the button size; async-in-form check (245) = `#ececec` block 90 x 31.5 css with the ring plus the text "Scanning tools...".
- Progress card (69): 400 x 78 css, white, 1 px `#e2e2e2`, r ~8-10 css, 16 css info glyph, 14 css bold title `#070707`, 14 css sub-line `#707070`.
- ChatGPT: skeleton list in a dialog (115): rows on a 64 css pitch, 14 css circle + two full-radius bars 8 css high (widths 152 and 305 css), all `#e2e2e2`; Codex list skeleton (136): two bars 11 css high, `#f6f6f6` (much fainter). Status text during work: "Analyzing image" 16 css `#4b4b4b` (31), "Reading..." shimmer in the activity log (44). Progress card (44): 416 x 91 css, 1 px `#e1e1e1` + soft shadow, 16 css title, `#386b99` "2 sources" link, a 8 css high full-radius bar (track `#e9e9e9`, fill `#0e0e0e`), 28 css stop button. A "Multitasking" tip card with close x sits above the composer (1 px `#e1e1e1`, 74 css high). Activity log rows (44): 16 css text on a 24 css line height, ~16 css between entries, 16 css leading icon.

### 5.3 Errors and inline validation

- Platform: error toast solid `#e12e2a` (245) paired with 14 css red messages under the offending fields (text glyphs sample `#832e2b`..`#9f3d3a`, true colour est. `#a82a26`) and a 16 css red X icon next to a failed check; error alert (77): white fill, 1 px red outline (peak `#96423f`), r ~10 css, 53 css high, 16 css warning triangle, red 14 css text plus underlined inline link; destructive buttons `#e12e2a` (233, 247, 305) only inside confirm dialogs.
- ChatGPT (234, 225): pill input gets a 1 px red border, the floating label turns red, and a 16 css filled red circle with "!" (measured fill `#c41010`..`#c90e18`) leads a ~12-13 css red message ("Incorrect email address or password") 4 css below the field. 229: red destructive button after typing DELETE.

### 5.4 Toasts and banners

| Property | Platform | ChatGPT |
|---|---|---|
| Position | top centre, 8 css from the top (y 10), overlapping the top bar; centred on the VIEWPORT (cx 959.5-960) | top centre, 12 css from the top (y 15), centred on the viewport (cx 960), overlapping the header |
| Height | 45 css (57 px) | 42 css (53 px) |
| Width | content hugging: 146 css (186 px) .. 505 css (642 px) | content hugging: 162 css (206 px, 69) .. 311 css (395 px, 67) |
| Fill | success `#49b880` (361, 366, 369, 384, 387, 230, 234, 252, 265; earlier build `#3eae72` in 47, 49), error `#e12e2a` (245) | success `#008735` (`#008635`) (67, 69, 125, 133, 136, 144, 201, 204, 218); neutral black `#000` (211) |
| Content | 14 css medium white label + 12 css "x" dismiss, gap ~17 css, no icon | 16 css regular white label, 16 css leading check-circle (outline) then 12 css gap, padding-x ~16 css, no dismiss |
| Radius | ~8 css | ~8-9 css |
| Contrast (white text) | green 2.5:1 (FAILS AA), red 4.5:1 | green 4.65:1, black 19:1 |

Callouts: neutral note (331): white, 1 px `#e3e3e3`, r ~10 css, 51 css high, 900 css wide, 16 css info glyph, bold "Note:" lead. Warning callout (370): white fill, 1 px orange outline (peak `#a26233`, glyph text `#aa4f1f`), r ~10-11 css, 74 css high, 14 css bold title + 14 css body + underlined link, 16 css triangle glyph, 48 css to the text. Neither tints the background.

### 5.5 Progress bars and meters

- Platform: track `#eeeeee`, 16 css high (budget 212/322/331/341: 19-21 px), nearly square ends (r <= 3 css); budget fill `#0e903b` with 2 css black tick marks at alert thresholds (212, 331); credit-grants fill `#8bdfac` (373: 21 px tall, 1000 px track); caption "Resets in 28 days. Edit budget" 14 css `#868686` with underlined link; value `$2.01 / $5.00` 20 css. Dark (322): track `#303030`.
- ChatGPT: 8 css bar (44), track `#e9e9e9`, fill `#0e0e0e`, full radius.

### 5.6 Charts (Platform only; ChatGPT pack has none)

- No gridlines, no y-axis. Single-hue bars `#885be3` (same in dark), bar width 45 css, pitch 57 css (gap 12 css), square tops (r <= 1 css). Zero-value days = a 2 css thick dash `#bfbdc8` (dark `#aaa9ad`) the same width as a bar, sitting on the baseline (never a gap). One dashed 1 css max line (~`#756e96`) with its value in `#735da8` 12-13 css at the left. X axis shows only the first and last label, 12-13 css `#69696f` (dark `#797982`), ~14 css under the baseline.
- Legend: 8 css square swatch (`#725fe1` purple, `#c1c2c7` grey) + 14 css text `#888888` (dark `#9c9c9c`).
- Tooltip (213, 214, 219): white card ~257 x 126 css, hairline `#f0f0f0`, r ~8 css, shadow ~`0 2px 12px rgba(0,0,0,.14)` (est., darkest `#d9d9d9` 2 px under the edge fading to `#f2f2f2` over ~15 px), 14 css `#606060` date, 16-18 css semibold `#181818` figure, 1 px divider, rows with an 8 css swatch (orange `#e27129`, crimson `#d23a6d`), label `#2e2e2e` left, value right-aligned.
- Sparklines: 1.5-2 css strokes, orange `#e27129` and crimson `#bc3965`, final point as a hollow ring.
- Metric block (212 right rail): label 14 css `#303030`, value 18-20 css semibold `#151515` (secondary figure `#828282`), optional sparkline 36 css high, blocks separated by 1 px hairlines, no card chrome. Hero: label 14 css, value ~20 css semibold, optional secondary figure in the accent.
- Area chart (333): 2 css line `#178c45`, fill gradient `#e0f2e4` (top) -> `#ffffff` (~80 percent down), baseline 1.5 css `#535353`, spikes 1 css `#1f2420`, axis labels `#555555`; status rows 57 css high with a 16 css `#008838` check disc; "Live" pill as 4.1.
- Dark mode (322): canvas and chrome `#131313`, card `#212121`, 1 px border `#323232`..`#363636`, primary text `#f1f1f1`..`#f5f5f5`, secondary `#9c9c9c`, axis `#797982`.

## 6. Recommendations for Rasikh (summary; full list in the structured output)

1. Employer / landlord / bank desktop tables: recipe A (band header 30 css `#f9f9f9`, 45 css rows, `#eaeaea` rules, 14/21 css cells, right-aligned numerics, mono IDs, one medium status pill per row, kebab at the end). Use recipe C (36 css, column rules) only for dense extracted-field grids. Add what the reference lacks as clearly marked Rasikh additions: sort caret (12 css chevron, appears on hover and when active), hover fill `#f9f9f9`, sticky header, optional 18 css checkbox column.
2. Newcomer mobile app: ChatGPT two-line rows (65-72 css pitch, 40 css leading tile, `#f0f0f0` hairline, right-aligned pill), 16 css text, no tables. Collapse every desktop table to this row pattern below 768 css.
3. Status pills: Platform recipe on desktop (tint + dark text, 4 css radius, no border), ChatGPT full-radius on mobile. Keep a single accent; all semantic colours stay tinted.
4. Toasts: do not copy Platform's `#49b880` (2.5:1). Success = ChatGPT `#008735`, neutral = black `#0d0d0d`, error = `#e12e2a`; 42-45 css high, top centre, 8-12 css from top, honour `env(safe-area-inset-top)`.
5. Metrics row and charts: no card chrome, hairline dividers, label 14 css over a 20 css value, single accent hue, zero as dashes, first/last axis labels, no gridlines, tooltips with exact values. Bars always start at zero.

## 7. Evidence index

Platform measured on: 249, 253, 250, 298, 95 (band tables); 225, 329, 369, 331, 391, 373 (plain tables); 87, 297 (grids); 260, 271, 305 (master-detail); 362, 355 (card rows, checkbox), 139, 140 (checkbox); 66, 98 (chips); 212, 214, 322, 333 (charts, meters, dark); 210, 23, 98, 245, 69 (loading); 276, 235, 224, 337, 338, 257 (empty); 245, 77, 370, 331 (errors, callouts); 47, 49, 230, 234, 245, 252, 265, 361, 366, 369, 384, 387 (toasts). Looked at but not pixel-measured: 88, 266, 372, 395, 213, 218, 219, 341, 16, 47 spinner, 84 dots.
ChatGPT measured on: 22, 82, 121, 145, 222 (pills, rows); 57, 129, 154, 187, 186, 208, 212 (tables/lists); 144, 151, 153 (empty); 115, 136, 31, 44 (loading, progress, activity); 234 (errors; 225 and 229 viewed only); 67, 69, 88, 90, 125, 133, 136, 144, 201, 204, 211, 218 (toast boxes found by colour; 144, 211, 88 measured in detail). Looked at but not pixel-measured: 116, 162, 163, 213, 38, 52, 55.

## 8. Uncertainties and open questions

- Platform pack scale is inferred (1.27) with no web constant; every Platform css number is +/-3 percent. The three Platform surveys disagree (1.25 / 1.27 / 1.33); 1.27 is used because it makes the ChatGPT constants exact and the Platform values land on round numbers (45, 36, 32, 30, 16, 400, 900).
- Red and orange glyph colours are chroma-subsampled (JPEG-like) in the captures: the real error text and orange outline are probably more saturated and darker than the sampled values. Only flat fills (toast `#e12e2a`, pill tints, icon fill `#c41010`) are exact.
- Pill and toast radii come from corner inset profiles (+/-1 css).
- Hover, focus, pressed, sticky, sort, selection-bar and pagination behaviours are not in the screenshots; Rasikh values for them are design proposals, not measurements.
- ChatGPT pill variants were each captured on one screen; colour values are estimated (marked) except the green toast fills, which repeat on 11 screens.
- Skeleton shimmer is a still frame; gradient direction is read from the pixels only.
- Mobile density for lists was not observable; the 65-72 css pitch is a desktop-viewport value and should be checked against 44 css touch targets (it passes).

## 9. Token table (same data as the structured output)

| token | pack | theme | value | evidence | confidence |
|---|---|---|---|---|---|
| `meta.scale.px-per-css` | both | n/a | 1.27 screenshot px per css px | ChatGPT sidebar 330 px = 260 css, composer 978 px = 768 css, header 66 px = 52 css; Platform rows 57.14 px = 45 css | measured |
| `table.row.height` | platform | light | 45px | Logs 249/253/250: 13 rules at 57.14 px pitch; ChatGPT modal list 208 is also 45 css | measured |
| `table.row.height.compact` | platform | light | 36px | dataset grids 87, 297: rules at 45.7 px pitch | measured |
| `table.row.height.settings` | platform | light | 41px | Limits table 331/391: 52.0 px pitch | measured |
| `table.row.height.roomy` | platform | light | 59px | Projects table 329/369: 74.8 px pitch | measured |
| `list.row.height.two-line` | platform | light | 66px | master list 260/305: 84 px pitch | measured |
| `list.card-row.height` | platform | light | 70px | roles card rows 362: 88.9 px; 355 card row 69 css | estimated |
| `table.header.height` | platform | light | 30px | Logs 249/253/250, Evals 298, Datasets 95: #f9f9f9 band 37-38 px | measured |
| `table.header.height.grid` | platform | light | 36px | grids 87, 297: #eeeeee band 45-46 px | measured |
| `table.header.bg` | platform | light | #f9f9f9 | 249, 253, 250, 298, 95 flat sample | measured |
| `table.header.bg.grid` | platform | light | #eeeeee | 87, 297 flat sample | measured |
| `table.header.border` | platform | light | none (no header rule, no vertical rules) | 249, 298, 95, 225, 329, 331, 373 | measured |
| `table.header.font.band` | platform | light | 12px/16px 400, sentence case, #1b1b1b | 249, 298, 95: cap 12 rows, same as sidebar group label 12 css | estimated |
| `table.header.font.plain` | platform | light | 12px/16px 500 UPPERCASE, letter-spacing ~0.04em (est.), #0c0c0c | 225, 329, 331, 373: cap 11 rows, darkest #0c0c0c/#090909 | estimated |
| `table.header.font.grid` | platform | light | 14px/21px 400 #4b4b4b | 87, 297 header labels | measured |
| `table.cell.font` | platform | light | 14px/21px 400; primary #080808, secondary #464646 | 249, 253, 250, 329, 331: cap 13 rows = nav 14 css | measured |
| `table.cell.font.mono` | platform | light | ~13px/20px monospace #131313 for IDs and model names | 329, 331, 260, 298: ~7.8 css advance per char | estimated |
| `table.cell.padding-x.first` | platform | light | 20px from card edge (24px plain tables, 8px compact Limits) | 249 text at +25 px; 225/329 at +30 px; 331 rules bleed 10 px past text | measured |
| `table.cell.padding-y` | platform | light | 12px (derived: (45 - 21) / 2) | derived from row and line height | estimated |
| `table.row.border` | platform | light | 1px solid #eaeaea | integrated hairline: 249 #e8-#f0, 331 #e8-#ec, 329 #ea-#ed, 87 #e9-#ec, 260 #e9-#ef (peak px #ebebeb-#f2f2f2) | measured |
| `table.row.border.in-card` | platform | light | 1px solid #e2e2e2 (rules inside a bordered card) | 362 rows #e2/#e3, 212 sub-card #e1/#e2, 355 card #ececec | estimated |
| `table.column.rule` | platform | light | 1px solid #ededed (data grid only) | 87 col rule x=884; 297 | measured |
| `table.zebra` | both | n/a | none; no outer table border; no vertical rules outside grids | 249, 329, 331, 225, 57, 154 | measured |
| `table.numeric.align` | platform | light | right-aligned cells with right-aligned header | 329 MEMBERS/MONTHLY SPEND (1392 vs 1393 px), 331 three columns | measured |
| `table.cell.truncate` | platform | light | single line, text-overflow: ellipsis | 249 Input/Output cells, 298 name | measured |
| `table.row.hover` | both | n/a | NOT MEASURABLE: no hover fill captured (ChatGPT 208 only reveals a kebab, row stays white). Proposal #f9f9f9 | 249, 208, 154 | estimated |
| `table.row.selected` | platform | light | fill #eeeeee, radius ~6px (list rows) | 260, 271, 305 | measured |
| `table.row.action.icon` | platform | light | 16px glyph, #4d4d4d; destructive #9c2e2d..#e12e2a; at row end, ~24px inset | 225, 329, 331 | estimated |
| `table.pagination` | platform | light | "Load more" button ~91x32px, fill #ececec, 14px label, centred under table; no numeric pager exists | 329, 369 | estimated |
| `table.sort` | both | n/a | NOT PRESENT: Platform has no sort carets; ChatGPT uses text+chevron triggers ("Newest", 14px #515151) and a sort icon button | 154, 161, 208, 249, 329 | estimated |
| `toolbar.chip` | platform | light | 28px high, full radius, 1px ~#d4d4d4 border, white fill, 14px label #828282 | 249, 329, 369: border 34-35 px incl line | measured |
| `toolbar.count` | platform | light | "N results" 14px #505050 | 249, 253 | estimated |
| `checkbox.size` | platform | light | 18px square, 1px ~#d0d0d0 border, radius ~4px, checked fill #181818 | 355, 139, 140: 23-24 px | estimated |
| `list.cg.row.height.modal` | chatgpt | light | 45px (single line, kebab on hover) | 208: rules 57.3 px apart | estimated |
| `table.cg.row.height` | chatgpt | light | 40.5px | Archived chats modal 212/213: 51.5 px pitch | estimated |
| `list.cg.row.height.file` | chatgpt | light | 65px (two-line, 40px leading tile) | 154: 82.4 px pitch | estimated |
| `list.cg.row.height.task` | chatgpt | light | 71px (two-line, right-aligned stat or pill) | 129, 145, 187: 90.2 px pitch | measured |
| `list.cg.row.height.app` | chatgpt | light | 72px (36px round logo, chevron) | 121, 186: 91.5 px pitch | estimated |
| `table.cg.row.height.chat` | chatgpt | light | 69px (two-line cells, 24px line height) | 57: 87.5 px pitch | estimated |
| `list.cg.row.border` | chatgpt | light | 1px solid #f0f0f0 (range #efefef-#f3f3f3) | 154, 145, 129 integrated | measured |
| `list.cg.row.border.modal` | chatgpt | light | 1px solid #e5e5e5 (range #e0e0e0-#ececec) | 212, 208 | estimated |
| `table.cg.header.rule` | chatgpt | light | 1px #dbdbdb under header, row rules #f1f1f1 (near invisible) | 57: peak #dbdbdb, integrated #d3d3d3 | estimated |
| `table.cg.header.font` | chatgpt | light | 14px semibold #000000 | 212, 57 | estimated |
| `list.cg.title` | chatgpt | light | 14px/20px 500 #000000 | 154, 121, 145, 129: cap 13-14 rows | estimated |
| `list.cg.meta` | chatgpt | light | 13-14px; #505050 (files), #858585 (tasks), #868686 (apps) | 154, 145, 129, 121 | measured |
| `list.cg.group-label` | chatgpt | light | UPPERCASE 12px, #7f7f7f..#818181 | 129, 145 | estimated |
| `list.cg.leading-tile` | chatgpt | light | 40px tile r~7px: PDF #fa433f, document #0385ff; app logo 36px circle | 154, 121 | estimated |
| `list.cg.diff-stat` | chatgpt | light | plain text, +n green ~#1a8a45 and -n red ~#c23a3a (dark #338353 / #b44444) | 129, 145, 187 | estimated |
| `table.cg.link` | chatgpt | light | name link blue, darkest sample #235a90 (family of #0a66c2) | 212 | estimated |
| `surface.cg.dark.canvas` | chatgpt | dark | #212121 | 186, 187, flat | measured |
| `list.cg.dark.row-border` | chatgpt | dark | 1px solid #2c2c2c | 187 | estimated |
| `list.cg.dark.text` | chatgpt | dark | title #ffffff, meta ~#b7b7b7 | 187 | estimated |
| `pill.platform.shape` | platform | light | rounded rectangle, radius 4px, tint fill, no border, no leading dot | 260, 271, 297, 298, 331, 362, 373: corner inset 3-5 px | measured |
| `pill.platform.sm` | platform | light | 19px high, 12px/500-600, padding-x 6px | Global 329, Preset 362, Available 373: 23-24 px | measured |
| `pill.platform.md` | platform | light | 21px high, 14px/500, padding-x 8px | Pass 297, Completed 298, Usage tier 1 331: 26-27 px | measured |
| `pill.platform.lg` | platform | light | 23px high, 14px/500, 16px leading icon | Ready 260, Failed 271: 28-29 px | estimated |
| `pill.platform.success.bg` | platform | light | #e2f3e6 | 6 samples #daf5e5..#e3f2e6 on 260, 331, 362, 373, 297, 298 | measured |
| `pill.platform.success.fg` | platform | light | #0b672b | darkest glyph clusters #016728..#146632 on 5 screens | measured |
| `pill.platform.error.bg` | platform | light | #ffe2e3 | Failed 271 (on #eee row composites to #f1d3d2) | estimated |
| `pill.platform.error.fg` | platform | light | #871d1b | 271 darkest #761715, mean #871d1b | estimated |
| `pill.platform.info.bg` | platform | light | #e3eeff (full-radius category pill) | Global 329 | estimated |
| `pill.platform.info.fg` | platform | light | #0c396a | Global 329 | estimated |
| `pill.platform.neutral.bg` | platform | light | #ececec on white (= black at ~7.5%); #eeeeee for Draft | Validating 305 (#dbdbdb on #eee row), Draft 66 | estimated |
| `pill.platform.neutral.fg` | platform | light | #000000 (status) / #4c4c4c (Draft) | 305, 66 | estimated |
| `pill.platform.warning.bg` | platform | light | #ffe8c5 | model badge A 66 | estimated |
| `pill.platform.warning.fg` | platform | light | #7a520f | model badge A 66 | estimated |
| `pill.platform.live` | platform | light | 24px high full radius, bg #e7f6ef, text #0d9240, 8px dot | Live 333 | estimated |
| `chip.platform.key` | platform | light | fill #eeeeee, 22px high, radius ~6px, 14px text (variable keys, model chips) | 66, 98 | estimated |
| `id.platform.mono` | platform | light | bare monospace text ~13px, no chip fill | 329, 331, 260, 298 | measured |
| `pill.cg.shape` | chatgpt | light | full radius, 22-25px high, padding-x 8-10px, 12-13px/500 text | Open 145 (22), 1 bug 145 (24), Parent 222 (25), RECOMMENDED 82 (25) | estimated |
| `pill.cg.success` | chatgpt | light | bg #e1eee3, fg #1e6f35, leading 12px glyph | Open 145 | estimated |
| `pill.cg.info` | chatgpt | light | bg #e5f2ff, fg #2977ba (use #1f6aa8 for AA) | Parent 222: 4.2:1 | estimated |
| `pill.cg.brand` | chatgpt | light | bg #dcdbff, fg #5754b4, UPPERCASE ~11px tracked | RECOMMENDED 82 | estimated |
| `pill.cg.neutral` | chatgpt | light | bg #f3f3f3, fg #4d4d4d, leading glyph; button variant adds 1px #e9e9e9 | 1 bug / Fix 145 | estimated |
| `pill.cg.outline` | chatgpt | light | white, 1px #e0e0e0, UPPERCASE ~10px #8a8a8a | BETA 121 | estimated |
| `dot.cg.unread` | chatgpt | light | 8px circle #0662c3 | 22, 31, 44 sidebar | estimated |
| `empty.platform.tile` | platform | light | 40px square, #eeeeee, radius ~8px, 20px outline glyph | 276, 235, 224, 338: 51 px | measured |
| `empty.platform.title` | platform | light | 16px/24 600 #000000 | 276, 235, 224, 338 | estimated |
| `empty.platform.desc` | platform | light | 14px/21 #505050, one line | 276, 338 | estimated |
| `empty.platform.cta` | platform | light | 34px high (33-36) black #181818, radius ~8px, 14px/500 white, + glyph | 276 (46 px), 235, 224, 338 (42-44 px) | measured |
| `empty.platform.gap` | platform | light | tile->title 16-19px (18 typical), title->desc 13px, desc->CTA 18px (17-19px when there is no description) | 276 (16.5/13/18), 235 (18/-/17), 224 (18/-/19), 338 (19/13/18) | measured |
| `empty.platform.alignment` | platform | light | stack centred on both axes of the free area of the card | 276: block centre y 668 vs card centre 667.5; cx 1093.5 vs 1094 | measured |
| `empty.cg.tile` | chatgpt | light | white 44px tile, soft shadow, 20px glyph (variant A) | 144 | estimated |
| `empty.cg.title` | chatgpt | light | 16px/24 500 #000000 | 144, 151, 153 | estimated |
| `empty.cg.desc` | chatgpt | light | 16px/24 ~#4c4c4c-#525252, centred, ~245px wide | 144, 151, 153 | estimated |
| `empty.cg.cta` | chatgpt | light | black pill #0d0d0d, 35px high (28px small) | 144 (44 px), 153 (36 px) | estimated |
| `empty.cg.gap` | chatgpt | light | tile->title 9px, title->desc 20px (two-line desc), desc->CTA 12px; text-only title->desc 10px | 144, 151 | estimated |
| `empty.cg.container` | chatgpt | light | 1px dashed rounded container, radius ~20px, dash ~#e3e3e3 | 153 | estimated |
| `skeleton.platform.fill` | platform | light | blocks gradient #efefef -> #f7f7f7 diagonal; text bars #e8e8e8 -> #f3f3f3 horizontal on #f9f9f9 | 210, 23 | measured |
| `skeleton.platform.radius` | platform | light | ~8px blocks; text bars full radius | 210, 23 | estimated |
| `skeleton.platform.geometry` | platform | light | value chip 100x24px, list row 28px high on 36px pitch, text bars 14px high on 25.5px pitch, chart block 923x280px | 210, 23 | measured |
| `skeleton.cg.fill` | chatgpt | light | #e2e2e2 flat (dialog list); #f6f6f6 (Codex list) | 115, 136 | estimated |
| `skeleton.cg.geometry` | chatgpt | light | 14px circle + bars 8px high (152 and 305px wide), 64px row pitch | 115 | estimated |
| `spinner.platform` | platform | light | 20px ring, ~2px stroke, conic fade from #0d0d0d | 98, 245, 69 | estimated |
| `spinner.platform.in-block` | platform | light | #ececec block ~90x32px, ring + 14px text ("Scanning tools...") | 245 | estimated |
| `progress-card.platform` | platform | light | 400x78px, white, 1px #e2e2e2, radius ~8-10px, 14px bold title #070707, 14px sub #707070 | 69 | estimated |
| `progress-card.cg` | chatgpt | light | 416x91px, 1px #e1e1e1 + soft shadow, 16px title, link #386b99, 8px bar, 28px stop button | 44 | estimated |
| `status-text.cg` | chatgpt | light | 16px #4b4b4b working label; activity entries 16px/24 with 16px icon, ~16px between entries | 31, 44 | estimated |
| `error.platform.text` | platform | light | 14px, red ~#a82a26 (est.; glyph samples #832e2b-#9f3d3a), with optional 16px red X | 245 | estimated |
| `error.platform.alert` | platform | light | white fill, 1px red outline (peak #96423f), radius ~10px, 53px high, 16px warning glyph, inline underlined link | 77 | estimated |
| `error.platform.solid` | platform | light | #e12e2a (toast fill, destructive button) | 245, 233, 247, 305 flat | measured |
| `error.cg.input` | chatgpt | light | 1px red border + red label; message ~13px with 16px filled red "!" circle (#c41010), 4px below field | 234, 225 | estimated |
| `callout.warning.platform` | platform | light | white fill, 1px orange outline, text ~#aa4f1f, radius ~10px, 74px high, bold 14px title + 14px body | 370 | estimated |
| `callout.neutral.platform` | platform | light | white, 1px #e3e3e3, radius ~10px, 51px high, 900px wide, bold lead-in, 16px info glyph | 331 | estimated |
| `tip-card.cg` | chatgpt | light | 1px #e1e1e1 card above composer, 74px high, 16px semibold title + 16px #454545, close x | 44 | estimated |
| `toast.platform.position` | platform | light | top centre of VIEWPORT, 8px from top, overlaps top bar | 12 screens: y 10-11, cx 959.5-960 | measured |
| `toast.platform.height` | platform | light | 45px (57 px) | 361, 366, 369, 384, 387, 230, 234, 252, 265, 245 | measured |
| `toast.platform.width` | platform | light | hugs content, 146px to 505px | 186 px (361) to 642 px (245) | measured |
| `toast.platform.fill` | platform | light | success #49b880 (earlier build #3eae72); error #e12e2a | 9 + 2 + 1 screens; white text 2.5:1 on green (fails AA) | measured |
| `toast.platform.content` | platform | light | 14px/500 white label + 12px x dismiss, 17px gap, no icon, radius ~8px | 361, 245 | estimated |
| `toast.cg.position` | chatgpt | light | top centre of VIEWPORT, 12px from top, overlaps header | 11 screens: y 15, cx 960 | measured |
| `toast.cg.height` | chatgpt | light | 42px (53 px) | 67, 69, 125, 133, 136, 144, 201, 204, 218 | measured |
| `toast.cg.fill` | chatgpt | light | success #008735; neutral #000000 | 11 green screens; 211 black; white text 4.65:1 | measured |
| `toast.cg.content` | chatgpt | light | 16px regular white label, 16px leading outline check-circle, 12px gap, padding-x 16px, radius ~8px, no dismiss | 144, 88, 211 | estimated |
| `meter.platform.track` | platform | light | 16px high, #eeeeee, radius <= 3px | 212, 331, 373, 322 | measured |
| `meter.platform.fill` | platform | light | budget #0e903b with 2px black threshold ticks; credits #8bdfac | 212, 331, 373 | measured |
| `meter.cg` | chatgpt | light | 8px high, full radius, track #e9e9e9, fill #0e0e0e | 44 | estimated |
| `meter.platform.dark.track` | platform | dark | #303030 | 322 | estimated |
| `chart.series.primary` | platform | n/a | #885be3 (identical in dark) | 212, 214, 322 flat 11k pixels | measured |
| `chart.bar.geometry` | platform | light | bar 45px wide, 57px pitch (12px gap), square tops | 212, 214, 322 | measured |
| `chart.zero.dash` | platform | n/a | 2px thick dash, #bfbdc8 light / #aaa9ad dark, same width as a bar, on the baseline | 212, 322 | measured |
| `chart.gridlines` | platform | light | none; no y-axis | 212, 214, 322 | measured |
| `chart.maxline` | platform | light | 1px dashed ~#746d98; value label #735da8 12-13px at left | 212 | estimated |
| `chart.axis.label` | platform | n/a | 12-13px, #69696f light / #797982 dark, first and last label only | 212, 214, 322 | measured |
| `chart.legend` | platform | light | 8px square swatch (#725fe1 / #c1c2c7) + 14px #888888 | 212, 322 | estimated |
| `chart.tooltip` | platform | light | white card ~257x126px, hairline #f0f0f0, radius ~8px, shadow ~0 2px 12px rgba(0,0,0,.14) (est.), 14px #606060 date, 16-18px/600 #181818 figure, 1px divider, 8px swatch rows | 214 (213, 219 same) | estimated |
| `chart.series.secondary` | platform | light | orange #e27129, crimson #d23a6d (swatch) / #bc3965 (sparkline); 1.5-2px strokes | 214, 212 | estimated |
| `chart.area.health` | platform | light | 2px line #178c45, fill #e0f2e4 -> #ffffff, baseline 1.5px #535353, spikes #1f2420, 16px check disc #008838 | 333 | estimated |
| `kpi.block` | platform | light | label 14px #303030; value 18-20px/600 #151515; secondary figure #828282; hairline dividers, no card chrome | 212 right rail | estimated |
| `surface.platform.dark` | platform | dark | canvas and chrome #131313, card #212121, border #323232, track #303030 | 322 | estimated |
| `text.platform.dark` | platform | dark | primary #f1f1f1, secondary #9c9c9c | 322 | estimated |

## 10. CSS snippet

```css
/* Rasikh tables + feedback. Measured from Platform (desktop) / ChatGPT (mobile); css px = screenshot px / 1.27. */
:root {
  --hair: #eaeaea; --hair-soft: #f0f0f0; --card-edge: #e1e1e1;
  --surface-band: #f9f9f9; --surface-sunken: #eeeeee;
  --text-1: #0d0d0d; --text-2: #505050; --text-3: #6b6b6b; /* reference meta #858585 is only 3.7:1 */
  --ok-bg: #e2f3e6; --ok-fg: #0b672b;   --err-bg: #ffe2e3; --err-fg: #871d1b;
  --info-bg: #e3eeff; --info-fg: #0c396a; --warn-bg: #ffe8c5; --warn-fg: #7a520f;
  --neutral-bg: #ececec; --neutral-fg: #262626;
  --toast-ok: #008735; --toast-err: #e12e2a; --toast-neutral: #0d0d0d; /* not Platform #49b880 (2.5:1) */
  --chart-1: var(--rasikh-accent); --chart-zero: #bfbdc8; --chart-axis: #69696f;
}
[data-theme="dark"] { --hair: #2c2c2c; --card-edge: #323232; --surface-band: #212121; --surface-sunken: #303030;
  --text-1: #f1f1f1; --text-2: #b7b7b7; --chart-zero: #aaa9ad; --chart-axis: #797982; }

.rk-table { width: 100%; border-collapse: collapse; table-layout: fixed; font: 400 14px/21px var(--font-sans); color: var(--text-1); }
.rk-table th { height: 30px; padding-inline: 8px; background: var(--surface-band); font: 400 12px/16px var(--font-sans); text-align: start; }
.rk-table--plain th { background: none; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; }
.rk-table th:first-child, .rk-table td:first-child { padding-inline-start: 20px; }
.rk-table td { height: 45px; padding: 12px 8px; border-bottom: 1px solid var(--hair); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.rk-table--compact td { height: 36px; padding-block: 7px; }
.rk-table .num { text-align: end; font-variant-numeric: tabular-nums; }
.rk-table tbody tr:hover { background: var(--surface-band); } /* proposal: hover is not in the references */
.rk-id { font: 400 13px/20px var(--font-mono); direction: ltr; unicode-bidi: isolate; }

.rk-pill { display: inline-flex; align-items: center; gap: 4px; height: 21px; padding-inline: 8px; border-radius: 4px;
  font: 500 14px/1 var(--font-sans); background: var(--neutral-bg); color: var(--neutral-fg); }
.rk-pill--sm { height: 19px; padding-inline: 6px; font-size: 12px; }
.rk-pill--round { height: 24px; padding-inline: 10px; border-radius: 999px; font-size: 13px; } /* newcomer app */
.rk-pill--ok { background: var(--ok-bg); color: var(--ok-fg); }   .rk-pill--err { background: var(--err-bg); color: var(--err-fg); }
.rk-pill--info { background: var(--info-bg); color: var(--info-fg); } .rk-pill--warn { background: var(--warn-bg); color: var(--warn-fg); }

.rk-toast { position: fixed; inset-block-start: calc(8px + env(safe-area-inset-top)); inset-inline: 0; margin-inline: auto;
  width: max-content; max-width: calc(100vw - 32px); min-height: 42px; padding: 10px 16px; border-radius: 8px;
  color: #fff; font: 500 14px/21px var(--font-sans); background: var(--toast-neutral); }
.rk-toast--ok { background: var(--toast-ok); } .rk-toast--err { background: var(--toast-err); }

.rk-callout { padding: 14px 16px; border: 1px solid var(--card-edge); border-radius: 10px; background: transparent; font: 400 14px/21px var(--font-sans); }
.rk-callout--warn { border-color: #b4501f; color: #b4501f; } /* orange outline, never a tinted fill (est. colour) */

.rk-empty { display: grid; justify-items: center; gap: 13px; margin: auto; text-align: center; }
.rk-empty__tile { width: 40px; height: 40px; margin-bottom: 4px; border-radius: 8px; background: var(--surface-sunken); }
.rk-empty h3 { margin: 0; font: 600 16px/24px var(--font-sans); } .rk-empty p { margin: 0; color: var(--text-2); }

.rk-skel { border-radius: 8px; background: linear-gradient(115deg, #efefef 0%, #f7f7f7 60%, #efefef 100%); background-size: 200% 100%;
  animation: rk-shimmer 1.6s linear infinite; } /* timing is a proposal, not measured */
.rk-meter { height: 16px; border-radius: 3px; background: var(--surface-sunken); overflow: hidden; }
.rk-meter > i { display: block; height: 100%; background: var(--chart-1); }
.rk-spinner { width: 20px; height: 20px; border: 2px solid transparent; border-top-color: var(--text-1); border-radius: 50%; animation: rk-spin .8s linear infinite; }
@keyframes rk-spin { to { transform: rotate(1turn); } } @keyframes rk-shimmer { to { background-position: -200% 0; } }

.rk-bar { fill: var(--chart-1); } .rk-bar--zero { fill: var(--chart-zero); } /* bar 45px wide, 12px gap, no gridlines */
.rk-axis-label { font: 400 13px/16px var(--font-sans); fill: var(--chart-axis); } /* first and last tick only */
```
