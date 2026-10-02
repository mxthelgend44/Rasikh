# Typography measurement: OpenAI Platform (Apr 2026) and ChatGPT (Mar 2026)

Topic key: `typography`. All sizes are CSS px unless marked `[px]` (screenshot pixels). Every figure below was read from pixels (cap-height, x-height, baseline pitch, string width, stem thickness, darkest/core ink) with PIL/numpy on the cropped viewports. Anything inferred is marked **est.** Nothing under `.reference` was modified. Scratch crops and scripts live outside the repo.

## 0. Headline numbers

| Fact | Platform (desktop dashboards) | ChatGPT (mobile-first app) |
|---|---|---|
| Face | one neutral grotesque ("OpenAI Sans"-like) + a Menlo-like mono | same grotesque, no mono seen |
| Base text | 14px / 21px, 400 | 16px / 28px (prose), 14px / 20px (UI), 400 |
| Page title | 20px 500 (settings shell: 18px 500) | 30px 400 (display, tracking about -0.025em) |
| Section / modal title | 18px 600 | modal title 18px 400; markdown h2 20px 600, h3 18px 600 |
| Helper / caption | 12px / 16px, secondary grey | 12px / 16px, tertiary grey |
| Weights in use | 400, 500 (labels, buttons, titles), 600 (h2, uppercase headers, modal title) | 400 almost everywhere, 500 buttons and selected tab, 600 markdown headings and table headers |
| Cap-height / x-height | 0.70em / 0.50em | 0.70em / 0.51em (see 2.2) |
| Width vs Inter 400 (same px size) | 0.923x | 0.949x |
| Letter-spacing | 0 everywhere measured | 0 for text, about -0.025em for display (30px and up) |
| Primary ink | #000000 darkest, core #03-#0e | same |

Best free match by measured metrics: **Hanken Grotesk** (cap 0.697, x 0.493, avg advance 0.450 versus reference 0.70 / 0.50 / 0.434-0.448). Arabic companion: **IBM Plex Sans Arabic** (Latin metrics cap 0.698, avg 0.451, same as Hanken within 0.3%).

## 1. Scale, crop and method

- Crop: Mobbin footer (bottom 120px) removed. Platform viewport 1920x1205, ChatGPT 1920x1200.
- **Scale assumed and re-verified: 1.27 screenshot px per CSS px** (1920 px = 1512 css wide, a 14-inch laptop default). Independent checks I ran on this task:
  - Platform modal card widths: 660 px (p39, p40, p127), 634 px (p52, p63), 570/569 px (p100, p140, p227) give 519.7, 499.2 and 448.8/448.0 css, i.e. 520, 500 and 448 (28rem). At 1.25 or 1.333 none of the three is round.
  - Platform avatar (p249 top-left) 30.5 px = 24.0 css.
  - Nav row pitch 45.5-45.9 px in 15 Platform screens and 45.8 px in ChatGPT = 36.0-36.1 css.
  - ChatGPT prose baseline pitch 35.5 px = 28.0 css (98 samples); Platform paragraph pitch 26.7 px = 21.0 css (79 samples).
  - Error: +/-1.5%. A competing 1.333 fit (survey 280-359) is rejected; 1.25 (survey 360-416) is also rejected.
- Size derivation. Dimension used: **cap-height** (flat capitals B, M, L, P, I, T and the ascender of l/d/h, which equals cap-height in this face to within 0.05 px). Cap-height was measured sub-pixel (coverage-weighted edge, bg-normalised). I then:
  1. fit raw cap px against nominal css size per pack (Platform: 12->10.6, 13->11.4, 14->12.34, 16->14.3, 18->15.72, 20->17.8, 24->21.5, 32->28.5 px; ChatGPT: 14->12.9, 16->15.0, 18->16.8, 30->27.2, 32->29.0, 64->57.7 px). Slope gives cap = **0.704em (Platform)** and **0.698em (ChatGPT, +0.95 px blur offset)**;
  2. snapped to the Tailwind-style ladder (12, 13, 14, 16, 18, 20, 24, 28, 30, 32, 64);
  3. cross-checked every size against baseline pitch (14/21, 12/16, 16/28 ...) and against string width (section 2.3). Inter's cap ratio 0.727 would imply 13.4px for the Platform 14px text; that is not used, because Inter is simply bigger than the reference face.
- Weight: no CSS weight is readable from pixels. I used **stem-thickness ratio against same-size regular text** (first-run stroke width at x-height mid rows, 30th percentile). Anchor: ChatGPT markdown `<strong>` (assumed 600) measured 2.51 px vs 1.72 px regular on the same line = 1.46x. Classes: ratio <=1.15 -> 400, 1.2-1.4 -> 500, >=1.40-1.45 -> 600. All weights are therefore **est.**

## 2. Font family

### 2.1 Distinguishing letterforms (zoomed crops at 4-8x, both packs identical)

- `a` double-storey with a straight stem and no tail; `g` single-storey with an open hooked tail; `y` straight diagonal tail, no curl; `t` has a slanted cut at the top of the stem, curved foot, crossbar overhangs the left; `f` narrow with a short hook; `r` short arm; `l`, `I` plain bars (no slab, no tail); `i`/`j` round dots.
- `R` straight diagonal leg; `G` grotesque bar with vertical stem and no spur; `Q` short tail; `1` has a flag and no foot; `4` closed; `7` plain; `0` plain oval (no slash, no dot); `$` has a full-height bar through the S.
- Apertures open and wide (`e`, `c`, `s`), terminals cut close to perpendicular to the stroke; counters moderately large.
- Ascender height equals cap-height; x-height is low-to-moderate (x/cap 0.71, Inter is 0.75).
- Numerals are **proportional by default** (digit `1` advance about 0.31em, other digits about 0.55em; measured in `Feb 25, 11:58 PM`, p249). No tabular figures in the screenshots.
- Tracking: default spacing for text; display type is tightened (see 4).
- Mono (Platform only, IDs, params, JSON): Menlo / DejaVu-like, advance 0.6em (7.2 css/char at 12px in p194; 8.2 css/char, about 13.7px, in table ID cells p329). Not present in ChatGPT.

### 2.2 Reference metrics (measured) versus candidate fonts (Next.js capsize table, read locally, not measured by me)

| Face | cap | x-height | x/cap | avg advance (em) | Notes |
|---|---|---|---|---|---|
| **Reference (Platform)** | 0.70 | 0.50 | 0.71 | 0.434 | measured |
| **Reference (ChatGPT)** | 0.70 | 0.51 | 0.72 | 0.448 | measured |
| Hanken Grotesk | 0.697 | 0.493 | 0.707 | 0.450 | closest on all three metrics |
| Figtree | 0.700 | 0.500 | 0.714 | 0.449 | metrics equal, shapes rounder / geometric |
| Instrument Sans | 0.720 | 0.510 | 0.708 | 0.458 | cap 3% large, slightly quirky `a`, `t` |
| Albert Sans | 0.700 | 0.500 | 0.714 | 0.463 | more geometric, 4-7% wide |
| DM Sans | 0.700 | 0.504 | 0.720 | 0.466 | circular bowls (Poppins-like) |
| Public Sans | 0.723 | 0.517 | 0.715 | 0.468 | American gothic feel |
| Geist | 0.710 | 0.530 | 0.746 | 0.467 | right style, x-height 5% high, 4-7% wide |
| Inter | 0.728 | 0.546 | 0.750 | 0.478 | x-height 9% high; 5-8% wider than reference |
| Onest / Schibsted / Manrope | 0.70-0.72 | 0.527-0.540 | 0.745-0.750 | 0.460-0.469 | x-height high |
| Plus Jakarta Sans | 0.745 | 0.536 | 0.719 | 0.468 | cap 6% large |

### 2.3 Width cross-check against Inter 400 (advance sum, no kerning, same nominal size)

| Pack | Strings | ref / Inter |
|---|---|---|
| Platform 14px | 2 long paragraph lines (68 and 199 chars), `What should I do in a day in Tokyo?`, `Please critique this screen...`, tooltip `Clear conversation on each run` | 0.924, 0.923, 0.918, 0.927, 0.923 -> **0.923** |
| ChatGPT 16px | `Sift into a bowl...`, `Comparing the top picks...`, `give me the best matcha latte recipe` | 0.949, 0.949, 0.953 -> **0.950** |
| ChatGPT 14px | `Search chats`, `New chat` | 0.955, 0.940 |
| Uppercase (ink width) | `AM`/`PM` Platform 14px; `GPT` ChatGPT 18px | 1.02x; 0.98x (capitals are relatively wide, lowercase narrow) |

Consequence: at the same nominal px size Hanken Grotesk (avg advance 0.450) lands within +3.7% (Platform) and +0.5% (ChatGPT) of the reference line length; Inter is +8% / +5% wide, so Inter must run at about 13px where the reference says 14px (15px where it says 16px).

### 2.4 Ranked recommendation (Latin)

1. **Hanken Grotesk** (`@fontsource-variable/hanken-grotesk`, wght 100-900). Matches cap, x-height and width within 1-4%; neutral grotesque with double-storey `a`, single-storey `g`, straight `y`, straight-leg `R`. Use the same px sizes as the reference.
2. **Figtree** (`@fontsource-variable/figtree`). Metrics equal, but circular bowls read friendlier; good if Rasikh brand wants warmth.
3. **Instrument Sans** (`@fontsource-variable/instrument-sans`, wght + wdth). Close grotesque, scale cap down about 3%.
4. **Geist** (`@fontsource-variable/geist`). Closest Swiss-neutral drawing but 5% tall x-height and 4-7% wider; run it about 0.95x.
5. **Inter** (`@fontsource-variable/inter`). Safe fallback; set sizes to 0.93x (13px for 14px, 15px for 16px) and accept 9% taller x-height.

Package names follow the fontsource naming convention; not verified against the registry (no network used). Metrics for ranks 2-5 come from the capsize table bundled with Next.js in this repo's `node_modules`, not from rendering.

### 2.5 Arabic companion (ranked)

The packs contain no Arabic UI; the only Arabic glyphs are the `العربية` entry in the ChatGPT language menu (c188, macOS system fallback, 14px) and a Bengali / Bulgarian neighbour. So the Arabic ranking uses the fonts' documented metrics, not pixels.

1. **IBM Plex Sans Arabic** (`@fontsource/ibm-plex-sans-arabic`, static 100-700). Latin side has cap 0.698 and avg advance 0.451, equal to Hanken (0.697 / 0.450): same px size works for both scripts. Contemporary grotesque Arabic with flat terminals and even stroke colour; has 400/500/600. Line box ascent 1.085 + descent 0.415 = 1.5: keep line-height >= 1.5 for Arabic helper text.
2. **Noto Sans Arabic** (`@fontsource-variable/noto-sans-arabic`, wght 100-900 and wdth). Widest coverage and shaping safety, slightly lighter colour; its own Latin is tiny (capsize cap 0.416), so always list the Latin primary first. Needs explicit line-height (ascent 1.374 + descent 0.738).
3. **Readex Pro** (`@fontsource-variable/readex-pro`, wght 160-700). Friendly and wide (avg 0.483, +7%), x-height 0.525; too loose for dense tables; use at about 0.93x.
4. Almarai (weights 300/400/700/800, no 500/600), Tajawal (no 600, cap 0.633 small), Cairo (calligraphic-geometric, ascent 1.303 + descent 0.571): fallbacks only; the missing weights break the 400/500/600 ladder.

## 3. Type scale

Line-heights are **measured** where a multi-line sample exists (pitch table in section 5) and **est.** for single-line roles. Colour roles refer to section 6.

### 3.1 Platform (desktop dashboards, light)

| Role | size / line-height | weight | tracking | colour role | Evidence screens |
|---|---|---|---|---|---|
| h1 page title (dashboard shell) | 20px / 28px est. | 500 | 0 | primary | p212, p225, p249, p260, p271, p329, p369, p20, p29, p53, p254, p263 (cap 17.65-18.04 px) |
| h1 page title (settings shell) | 18px / 26px est. | 500 | 0 | primary | p328, p361, p374, p385, p396 (cap 15.71-15.73 px) |
| auth / onboarding h1 | 32px / 38px est. (auth), 20px 600 (onboarding step) | 400-500 (auth ratio 1.18-1.22), 600 (onboarding 1.41) | 0 | primary | p2, p3, p5, p7; p13, p15, p17, p18 |
| empty-state hero | 24px / 32px est. | 500-600 | 0 | primary | p20 (1.34), p141 (1.48) |
| hero metric numeral | 32px `$5.00` (ratio 1.05 -> 400); 20px `$2.01`, `$1.97` (ratio 1.37-1.40 -> 500-600); 20px `$0.00 / $10.00` (ratio 1.08 -> 400) | 400 / 500-600 / 400 | 0 | primary | p385; p214, p322; p391 |
| h2 section / modal title | 18px / 26px est. | 600 | 0 | primary | p385, p391, p133, p94, p63, p100 (modal 18.2-18.6, ratio 1.42-1.49) |
| h3 content heading | 16px / 24px | 600 (card title 14-16px: 500) | 0 | primary | p29, p53, p57, p111, p328 (600); p20, p385 (500) |
| body | 14px / 21px (20px in compact blocks) | 400 | 0 | primary | p225, p249, p374, p385, p94, p194 (cap 12.2-12.5 px) |
| body large (chat transcript, onboarding and auth description, modal prose) | 16px / 24px (transcript 25.5) | 400 | 0 | primary / secondary (#404040 in onboarding) | p147, p163, p254; p13, p15, p17, p18; p2, p5 |
| body small / sidebar group label | 13px / 18px est. | 400 | 0 | tertiary | 15 screens (p20, p29, p53, p225, p249, p260, p271, p194, p361, p374, p385, p391, p396, p328) cap 11.3-11.6 px |
| label (form field) | 14px / 20px | 500 | 0 | primary | p374 (5 labels, ratio 1.31-1.37), p194, p385 |
| caption / helper | 12px / 16px | 400 | 0 | secondary | p374 (3 samples, pitch 16.0 css), p194, p214, p26, p318 |
| table header (uppercase variant) | 12px / 16px | 600 | about +0.01em (range -0.02..+0.03) | primary | p225, p329, p369, p391 |
| table header (sentence variant) | 12px / 16px | 400 | 0 | primary | p249 |
| table cell | 14px / 21px | 400 (name column 600) | 0 | primary; meta cells secondary | p249, p225, p329, p369, p391 |
| button md | 14px / 20px | 500 | 0 | on-primary white on #181818, or primary on grey | p225, p249, p385, p94 (ratio 1.23-1.29) |
| button sm | 12px / 16px | 500 | 0 | primary | p194 (`+ Files`, `+ Functions`) |
| input text | 14px / 20px (16px on auth and onboarding) | 400 | 0 | primary | p374, p194; p2, p3, p13 |
| input label | 14px / 20px | 500 | 0 | primary | p374, p194 |
| sidebar item | 14px / 20px, 36px row pitch | 400 (selected still 400) | 0 | primary | p249, p385, p318 |
| sidebar section label | 13px | 400 | 0 | tertiary #808080 | as body small |
| tab label, segmented | 14px | 500 inactive (#3f3f3f), 600 active (#000) | 0 | secondary / primary | p249 |
| tab label, underline | 14px | 400 inactive (#434343-#494949), 600 active | 0 | secondary / primary | p385, p322 |
| top bar | 14px; org / project names 500, `Dashboard` 600, `API Docs` 400 #4c4c4c | | 0 | | p249 |
| badge / pill | 12px / 16px est. (13px `Draft`) | 500 est. | 0 | status text on tint (`Live` #074b1f) | p133, p26 |
| tooltip | 14px / 20px est. | 400 | 0 | white on #313131 | p82 (width ratio 0.923 pins 14px) |
| menu item | 14px / 20px, 32px pitch | 400 | 0 | primary | p133, p26 |
| menu group label | 11px / 16px | 600 uppercase | about +0.03em | secondary #414141-#454545 | p26 (`GPT-4.1`, `REASONING`) |
| detail-pane micro-label | 12px / 16px | 600 uppercase | about 0 (-0.005..+0.018) | secondary #454545 | p194 (`ASSISTANT`, `TOOLS`, `MODEL CONFIGURATION`) |
| modal title | 18px / 26px est. | 600 | 0 | primary | p94, p63, p100 |
| modal body | 14px / 21px | 400 | 0 | secondary #3c3c3c-#464646 | p63, p100, p94, p39 |
| mono / code | 12px (ID lines, #7a7a7a), 13-14px (table ID column) | 400 | 0 | tertiary / primary | p194, p329, p53 |

### 3.2 ChatGPT (newcomer app, light)

| Role | size / line-height | weight | tracking | colour role | Evidence screens |
|---|---|---|---|---|---|
| display (marketing) | 64px / 64px (pitch 64.5 css) | 400 | about -0.027em (est.) | primary | c0 |
| h1 auth | 32px | 400 | about -0.024em est. | primary | c1 |
| h1 page / project title | 30px / 36px est. | 400 | about -0.027em est. | primary | c128, c129, c145, c152, c154, c160, c163, c187 |
| h1 pricing / plan | 28px est. | 400 | 0 est. | primary | c81 |
| report title (card) | 24px | 600 | 0 | primary | c39, c45, c56, c63, c76 |
| markdown h2 | 20px | 600 | 0 (-0.003..-0.005em) | primary | c24, c25, c56, c57, c63, c72, c73, c184 |
| markdown h3 | 18px | 600 | 0 | primary | c24 (`Sift the matcha`, `Whisk with hot water`) |
| top bar title | 18px | 400 | 0 | primary | c57, c184, c181 |
| body, prose / user bubble | 16px / 28px (24px in narrow panels) | 400 | 0 | primary | c24, c45, c53, c57, c0, c184 |
| body UI (sidebar, table, rows, modals) | 14px / 20px (24px in tables) | 400 | 0 | primary | c57, c98, c65, c181, c120, c145, c128 |
| composer text / placeholder | 16px | 400 | 0 | placeholder #777 | c57, c24, c22 |
| label (modal field) | 14px | 400 | 0 | primary | c98, c65 |
| caption / helper | 12px / 16px (pitch 16.0 css) | 400 | 0 | tertiary #7d7d7d-#808080 | c98, c181, c65, c128, c163 |
| disclaimer | 12px / 16px | 400 | 0 | secondary #494949 | c57, c24, c184 |
| table header | 14px / 20px | 600 | 0 | primary | c57 (`Attribute`, product names) |
| table cell | 14px / 24px | 400 | 0 | primary; meta 12px tertiary | c57 |
| list-row title / meta | 14px 500 / 12px 400 | | 0 | primary / tertiary | c128, c145, c163 |
| button md | 14px | 500 | 0 | primary / white on black | c57 `Share`, c98 `Cancel`/`Save`, c0 `Log in` (ratio 1.17-1.29) |
| button sm | 12px | 500 | 0 | primary | c57 `Upgrade` |
| auth controls | 15-16px (cap says 15, width says 16) | 400 | 0 | primary | c1 |
| sidebar item | 14px, 36px pitch | 400 | 0 | primary | c57, c184, c181 |
| sidebar section label | 14px | 400 | 0 | tertiary #797979-#818181 | c57, c184 |
| tab | 14px | 400 inactive (#7b7b7b), 500 active (#000) | 0 | tertiary / primary | c145, c163 |
| chip | 14px | 400 | 0 | primary | c120, c65 |
| badge | 12px 500 (`Open`, `Fix`, `1 bug`); 10-11px uppercase 600 (`POPULAR`, est.) | | 0 to +0.04em | status colour | c145, c81 |
| modal title | 18px | 400 | 0 | primary | c98, c65, c181 |
| menu item | 14px | 400 | 0 | primary | c181, c188 |
| settings row | 14px label, 12px / 16px description #808080-#838383 | 400 | 0 | | c181 |
| tooltip, mono | not present in the ChatGPT pack | | | | |

### 3.3 Where the packs differ and what Rasikh should use

| Role | Platform | ChatGPT | Rasikh desktop dashboards | Rasikh newcomer app |
|---|---|---|---|---|
| Base | 14/21 | 16/28 prose, 14/20 UI | 14/21 | 16/24 UI, 16/28 agent messages |
| Page title | 20/500 | 30/400 | 20/28 500 | 28/34 500 (est., see recs) |
| Section / modal title | 18/600 | 18/400 (modal) | 18/26 600 | 18/24 500 |
| Helper | 12/16 secondary | 12/16 tertiary | 12/16 secondary | 12/16 tertiary |
| Label | 14/500 | 14/400 | 14/20 500 | 14/20 500 |
| Table | th 12 caps 600, td 14/21 | th 14/600, td 14/24 | Platform | n/a (cards) |
| Button | 14/500 | 14/500 | 14/500, sm 12/500 | 16/500 (touch) |

## 4. Letter-spacing

- Text 12-24px: **0** in both packs (Platform `Welcome back` 32px ratio 0.922 = same as body; 20px titles +0.004..+0.023em within noise).
- ChatGPT display (30, 32, 64px): ref width / (0.95 x Inter) gives -0.027, -0.024, -0.027em -> about **-0.025em** (est., range -0.02..-0.035 depending on assumed weight). 20px semibold headings: -0.003..-0.005 (0).
- Uppercase labels. Uppercase glyphs in this face are wide (1.02x Inter, 0.98x in ChatGPT) so comparing uppercase words to the lowercase-calibrated 0.923 factor falsely suggests 0.09em tracking. With the uppercase factor, Platform table headers give mean 0.00-0.004em (per word -0.06..+0.03), p194 micro-labels -0.005..+0.018em, p26 11px menu group labels about +0.03em, ChatGPT `LAST 7 DAYS` 0.00em, `POPULAR` +0.04em. **Conclusion: uppercase labels are effectively untracked to +0.03em; the survey figure of 0.04em is not supported.** (est., +/-0.02em)

## 5. Line-height evidence (in-paragraph baseline pitch, css px)

| Pack | Size | Pitch (n) |
|---|---|---|
| Platform | 14px | **21.0 (79)**, 20.0 (7), 20.5 (3); p385 auto-recharge box 20.0, p94 modal 20.9 |
| Platform | 12px | 16.0 (3 + p374 helper 16.0 x3) |
| Platform | 16px | 25.5 (9), 24.0 (4) |
| ChatGPT | 16px | **28.0 (98)**, 24.0 (16, narrow panels), 27.5 (13) |
| ChatGPT | 14px | 20.0 (9), 22.0 (5); c57 table cells 23.8 |
| ChatGPT | 12px | 16.0 (3, plus c98 helper 16.0) |
| ChatGPT | 18px / 64px | 28.0 (3) / 64.5 (2 lines of c0 hero) |

Sidebar and menu rows are 36 and 32 css pitch regardless of text size.

## 6. Text colours (hex)

Method: darkest 4 px of the glyph run (light theme) or lightest (dark theme) = "ink"; "core" = median of pixels with >=85% coverage. Thin 12-14px strokes reach full coverage only at the stem centre, so the darkest value is the better estimate of the true colour for small text.

| Role | Platform light | ChatGPT light | Platform dark | ChatGPT dark |
|---|---|---|---|---|
| primary | #000000 darkest; core #050505-#101010 on 18-32px (p225, p2, p94, p385, p249) | #000000 darkest; core #030303-#0e0e0e (c0, c1, c145, c57, c45) | #ffffff (core #e4-#fd) p318, p322 | #ffffff (core #f8-#fc) c184 |
| secondary | #3e3e3e-#4b4b4b (tabs #3f3f3f, meta #444444/#474747, helper #464646, micro-label #454545, `API Docs` #4c4c4c, modal body #3c-#46) | #424242-#474747 (c1 sub), disclaimer #494949 | not sampled | not sampled |
| tertiary | #7a7a7a-#848484 (group labels #7f-#83, mono IDs #7a-#7d, caption #808080) | #737373-#818181 (section labels #797979/#818181, muted line #737373, meta #808080-#868686) | #9c9c9c-#9e9e9e (group labels, meta); chart axis #797980 | core #b1b1b1-#b7b7b7 (lightest #c2-#cb) |
| placeholder | #7b7b7b-#7e7e7e (inputs, search p26, p374); #a3a3a3-#a9a9a9 (auth inputs p2, p3, p5, p7) | #777777 composer, #888888 input (c65), #a5a5a5 modal textarea (c97) | not sampled | #c7c7c7 lightest (composer c184) |
| disabled | #7f7f7f-#838383 text on grey (p133 `Evaluate`, `Deploy`) | button fill #c4c4c4 with white text (c65 `Submit`) | n/a | n/a |
| link | #3554af darkest, core #4963be (p2 `Sign up`); in-prose links are black underlined (p225 `Usage page`) | #15456f darkest, core #1d4c71-#2f557f (c45); `Cookie Preferences` black underlined | n/a | n/a |
| status text | success #074b1f (`Live`), red delete #953631 darkest (p133) | `Open` #1f6f34, diff green #19833f, accent chip `Get Plus` #514c8d, `POPULAR` #554faf | | |

Dark-theme surfaces for reference (ChatGPT): main #222222, sidebar #181818, selected row #212121.

## 7. Case and truncation

- **Sentence case everywhere** (nav `Agent Builder`, `ChatGPT Apps` are product names; `Fine-tuning`, `API keys`, `Service health` sentence case). Buttons are short verb phrases (`Create`, `Save and Leave`, `Continue with Google`). Dates are `Feb 26, 10:51 AM`.
- **Uppercase labels exist only as 11-12px (10-11px for badges) semibold micro-labels**: Platform table headers in some tables (p225, p329, p369, p391: NAME, STATUS, SECRET KEY, PERMISSIONS), detail-pane section labels (p194), menu group heads (p26 `REASONING`), history date head (p79, from the survey, not re-measured); ChatGPT `LAST 7 DAYS`, `TODAY`, `POPULAR`, `BETA`. Sentence-case headers also occur (Platform p249, ChatGPT c57).
- **Truncation**: single-line `text-overflow: ellipsis` (U+2026) in table cells (p249 Input / Output columns), sidebar rows (ChatGPT `Matcha Industry and Globaliz...`, `Branch · Best Matcha Latte R...`), IDs and names in cards; two-line clamp with trailing ellipsis for product names (c57 `Tezumi Kanoyama – Uji Okumidori Matcha (2...`). Table cells wrap rather than truncate in ChatGPT c57. Numerals are proportional (use tabular-nums deliberately in Rasikh tables).

## 8. Crop and screen notes

- Screens opened and measured: Platform p2, p3, p5, p7, p13, p15, p17, p18, p20, p26, p29, p39, p53, p57, p63, p82, p94, p100, p133, p140, p141, p147, p163, p194, p212, p214, p225, p249, p254, p260, p263, p271, p318, p322, p328, p329, p361, p369, p372, p374, p385, p391, p396 (+ a 57-screen bulk scan of canonical picks). ChatGPT c0, c1, c22, c24, c25, c39, c45, c53, c56, c57, c63, c65, c66, c72, c73, c81, c97, c98, c120, c128, c129, c145, c152, c160, c163, c181, c184, c188 (+ a 54-screen bulk scan).
- Blur: screenshots are resampled; ChatGPT raw cap px carry about +0.95 px (small text more inflated). Grey text measured with the wrong ink assumption under-reads cap-height by 0.3-0.6 px; I re-measured grey lines with a local-min ink reference.
- Emoji, icons and parentheses inside a heading inflate its measured cap-height (ChatGPT c24 emoji headings); only text-only runs were used.
- Light-on-dark (white button text, tooltip, dark theme) reads about 10-20% heavier in stem ratio than the same weight on light; I did not downgrade weights for it, except the tooltip (1.17, taken as 400 against white buttons at 1.29 = 500).

## 9. Open questions and not measurable

- Exact font family and CSS weights (inferred from stem ratios, anchor assumes ChatGPT markdown bold = 600).
- Single-line roles (h1, h2, modal title, badge, tooltip): line-height is estimated, not measured.
- Auth page body: cap says 15px, width says 16px; recommended 16px.
- ChatGPT 12px roles: cap under-reads (8.1 css where 12px at 0.70em predicts 8.4); confirmed 12px only by 16px line pitch and Tailwind ladder.
- The Platform "14px" text is 3% smaller than ChatGPT "14px" text (cap 12.34 vs 12.6-12.9 px, width 0.923 vs 0.95 of Inter) at an equal scale; cause unknown (font build or capture zoom).
- Arabic: no Arabic UI in either pack; fallback glyphs only. RTL mirroring, Arabic line-height and size-adjust are recommendations, not measurements.
- Mobile type sizes: both packs are desktop captures; mobile values are scaled recommendations.
- No hover, focus or pressed typography (weight changes on state) beyond selected tab and active nav.

## 10. Files

- This report: `docs/reference-audit/measure-typography.md`.
- Scratch (outside repo): `C:/Users/maalh/AppData/Local/Temp/claude/C--Users-maalh-Desktop-HUB71-COM/23b9bac2-96de-46f1-ba41-33d7ab3aceb9/scratchpad/typography/` (lib.py measurement helpers, bulk JSON, crops).
