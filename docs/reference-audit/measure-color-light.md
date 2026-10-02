# Measure: colour system, light theme (key: color-light)

Packs: "OpenAI Platform web Apr 2026" (417 screens, 0..416, 1920x1325) and "ChatGPT web Mar 2026" (0..244, 1920x1320). Everything below is read from pixels. Nothing under `.reference` was modified. Scratch scripts and crops live in the session scratchpad (`.../scratchpad/color-light/`).

Legend: **measured** = read from a flat region or an edge run, on at least 4 screens unless the row says "single screen". **estimated** = inferred (hairline integrals, shadow fits, thin-glyph colours, chroma-noisy saturated edges) - always labelled and given with a tolerance.

## 1. Scale, crop, and method

- **Crop.** Bottom 120 px (Mobbin bar) removed on every image before measuring: Platform viewport 1920x1205, ChatGPT 1920x1200.
- **Scale assumed: 1.27 screenshot px per CSS px** (a ~1512 CSS px viewport scaled to 1920). Re-verified here from round CSS values: ChatGPT sidebar 330 px (border column x=329) = 260 css; ChatGPT plus-menu 292 px = 230 css; ChatGPT simple dialogs 568 px = 447-448 css; ChatGPT composer 977 px = 769 css (768 max-width); Platform modals 570 / 634 px = 449 / 499 css (450 / 500); Platform org menu 330 px = 260 css. Colours are scale independent; the scale only matters for hairline integrals, shadow offsets/blurs and ring widths (all flagged estimated).
- **Flat colours** (surfaces, buttons, pills, toasts, scrims): most common colour of a flat region, >= 4 screens.
- **Hairlines.** Every 1 css px line is smeared over 2-3 image px (1.27 px wide, soft resampling), so the peak pixel is lighter than the real stroke. Estimate used: `stroke = bg - sum(deficit) / 1.27`. Peak and integral are both reported where they differ.
- **Text colours.** Darkest-pixel and 1st-percentile of glyph pixels inside the text bounding box. Thin 14 px glyphs are biased in both directions (partial coverage lightens, resampling overshoot darkens), so text values carry about +/-6 levels.
- **Shadows.** Outward luminance profiles from a flat element edge (bottom/top/left/right, middle half of each side), least-squares fit of `A * Q((d - Y)/s)` (single Gaussian layer, black). Reported as offset-y, blur (= 2 sigma) and alpha, in css px.
- **Scrim.** Linear fit of observed vs underlying flat colours.
- **Image quality caveat.** The source PNGs carry JPEG-style chroma artefacts (tinted pixels next to saturated edges, e.g. `#fffeff`, `#e8f5ff`). Saturated thin features (links, focus borders, thin red text) therefore have unreliable chroma; luma is trustworthy. Saturated flat areas (toasts, tiles, pills, buttons) are exact.
- Colour profile of the captures is unknown. Neutral greys are unaffected by a Display-P3 vs sRGB mismatch; saturated colours could be off by a few levels.

## 2. Two capture groups (important for anyone re-measuring)

Both packs contain two capture sessions whose light neutrals differ by a small tone-curve shift. I call the majority group **M** (used as canonical) and the minority **D** (darker).

| Token | Platform M | Platform D | ChatGPT M | ChatGPT D |
|---|---|---|---|---|
| shell / sidebar bg | #f3f3f3 (193 screens) | #f1f1f1 (31: 21,23,46-49,84,85,146-154,159-162,166,167,170,171,177,183,185,186,210,211) | #f9f9f9 (59 screens) | #f8f8f8 (about 19: 22-25,38,40,41,44,50-52,55,58,59,114-117,238) |
| selected nav row | #e0e0e0 | #dbdbdb | #eaeaea | #e8e8e8 |
| sidebar/card edge | #ececec | - | #ebebeb | #e9e9e9 |
| user bubble | - | - | #f5f5f5 | #f2f2f2 |
| success toast | #49b880 | #3eae72 (47,49) | #008635 | (same) |
| modal scrim over white | #b2b2b2 (30%) | #a9a9a9 (33.7%) | - | - |

The D shift is roughly `v' = 255 * (v/255)^1.17` in the mid/high range (f3 -> f1, e0 -> db, 49b880 -> 3eae72, white scrim 178 -> 169), and barely moves very dark values (#181818 -> #161616). It is a capture artefact, not a redesign: the scrim is 30% black in both. ChatGPT M values (#f9f9f9, #f5f5f5 bubble) also agree with commonly published ChatGPT CSS values, which is the reason M is canonical (inference, not measured). Use M everywhere.

## 3. OpenAI Platform (light) - measured tokens

### 3.1 Surfaces

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.bg.canvas (shell, sidebar, top bar) | #f3f3f3 | 193 screens (19,20,22,24,29,53,95,141,163,194,249,329) | measured |
| color.bg.surface (content card, menus, modal, composer) | #ffffff | 191 screens | measured |
| color.bg.sidebar | #f3f3f3 (same as canvas, no divider) | 20,24,29,53,95,141,163,194,249 | measured |
| color.border.sidebar | none | step #f3f3f3 -> #fff at x 276-279 is the card's own edge only | measured |
| color.border.card (content card) | 1px #ececec | L/T/R/B minima #ececec-#efefef on 20,24,29,53,95,101,141,194,249,260,329; integral about #ebebeb | measured |
| shadow.card.shell | none | no deviation from the step beyond the 1px border (<= 1 level) on the same 11 screens | measured |
| color.bg.canvas.editor (Agent Builder full-bleed) | #eeeeee | 22 screens: 104,106-108,113-117,119,122-126,129-133,137,138 | measured |
| color.bg.panel.floating (editor palette) | #fdfdfd | 121,133,138 (252x750 blob) | measured |
| color.bg.field.filled (prompt/system-message editor) | #fafafa | 24-31,58,74,90,283 (>= 296k px blobs) | measured |
| color.bg.field.filled.alt (agent-builder name field) | #e9e9e9 | 121 only | single screen |
| color.bg.table.header (list tables) | #f9f9f9 | 249 (41k px), 95; dropzone / option card also #f9f9f9 (survey 280-359) | measured |
| color.bg.table.header.grid (dataset grid) | #eeeeee | 87,88,90-93 | measured |
| color.bg.popover (menus) | #ffffff | 311,309,133 | measured |
| color.bg.popover.param (parameter popover, translucent) | #f8f8f8 | 29-32 (36.8k px blob; #f9f9f9 / #f3f3f3 bleed-through below) | measured |
| color.bg.code | #f7f7f7 | 77 (220k px), 100 | measured (2 screens) |
| color.bg.tooltip | #313131, label #ffffff | 82 | single screen |
| color.bg.scrim | rgba(0,0,0,0.30) | #fff -> #b2b2b2 (91 screens), #f3f3f3 -> #aaaaaa (90), #eee -> #a5a5a5 (12): 1 - 178/255 = 0.302, 1 - 170/243 = 0.300, 1 - 165/238 = 0.307. Overlay also covers sidebar and top bar | measured |

### 3.2 Interaction fills

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.bg.nav.selected | #e0e0e0 (no accent bar, label #000) | 187 screens (e.g. 19,20,22,141,194,249); D variant #dbdbdb | measured |
| color.bg.nav.hover | not captured (0 screens show a hovered nav row); borrow #ececec | scan of all 193 M screens | estimated |
| color.bg.hover.menu (menu row hover / selected option) | #ececec | 311 (project switcher), 309, 163, 346, 228, 251 | measured |
| color.bg.selected.row (master-list row) | #eeeeee | 194 (308,311,953,392), 260, 271 | measured |
| color.bg.chip / button.secondary.bg | #ececec | 20 (suggestion chips), 194 (Edit), 144, 145, 255 | measured |
| color.bg.segmented.track | #eeeeee, selected segment #ffffff with hairline | 249, 95, 163 | measured |
| toggle off / on | #e0e0e0 track + white thumb / about #171717 | 194 / 111 (on, under scrim) | measured / estimated |
| checkbox checked | #181818 | 29 | measured |

### 3.3 Borders and dividers (1 css px unless noted)

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.border.hairline (inner pane divider) | #f4f4f4 | 194 (x 975-976: 247/249) integral | estimated |
| color.border.subtle (card edge, table row) | #ececec | table rows 249 (7 rules: integrals 234-241), 329, 87, 88: about #ededed; card edge as above | estimated |
| color.border.default (page-header rule under title row) | #e6e6e6 | 24, 29 (247, 231) integral | estimated |
| color.border.rail (right settings rail) | #e3e3e3 | 163 (233, 242) integral | estimated |
| color.border.input | #d6d6d6 | 194 input (top 233/224, bottom 247/214), 194 select, 249 id pill, 20 generate pill: integrals 213-217 | estimated |
| color.border.chip.filter | #d5d5d5 | 249 Model/Date pills | estimated |
| color.border.auth.input | #d8d8d8 (peak #dbdbdb, #dbdbdb/#f1f1f1 pair) | 3 (single screen; 2,5-8 share the same pill geometry) | estimated |
| color.border.menu | #e9e9e9 | 311 (right edge 234 over 248 shadow) | estimated |
| sidebar divider | none | see 3.1 | measured |

### 3.4 Text

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.text.strong (selected tab, active nav, top-bar "Dashboard") | #000000 | mode #000000 on 249 ("Responses" tab), 9 screens ("Dashboard"), selected nav #000-#030303 on 20,24,29,53 | measured |
| color.text.primary (headings, nav, body, table cells) | #181818 (glyph 1st-percentile #101010-#151515) | unselected nav on 95,141,163,194,249; headings 20,249 (p1 #131313-#141414); same value as the flat primary button | estimated |
| color.text.secondary | #494949 | "API Docs" darkest #484848-#4b4b4b on 9 screens | measured |
| color.text.tertiary (captions, chip/filter text, "14 results") | #808080 | sidebar group captions darkest #818181 on 9 screens; chip text #797979; results #808080 | measured |
| color.text.placeholder | #787878 | 20,21,24,46,47,48 darkest #767676-#7d7d7d | measured |
| color.text.disabled | #7e7e7e on a #e2e2e2 / #f5f5f5 fill | 133 ("Deploy"), 87 ("Generate output") | measured |
| color.text.on.primary | #ffffff | all primary buttons | measured |
| color.text.link | in-app: ink + underline. Auth only: #4267e5 | 2,3,4 saturated pixel (#4267e5 / #4664d3 / #4a65d7) | estimated |

Hairline and link chroma are noisy (see section 1); tertiary / placeholder / disabled are effectively one grey (#787878-#808080); disabled is expressed by the fill, not by a lighter text.

### 3.5 Buttons

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| button.primary.bg / fg | #181818 / #ffffff | 130+ screens (13-19,20,24,25,...,361) | measured |
| button.primary.bg (auth pill) | #141414 (also #131313) | 2,3,5-8 (29 screens) | measured |
| button.secondary | bg #ececec, fg #000000, border none | 194 ("Edit"), 144 / 145 (full-width "Add"), 255 ("Add key"), 251 ("Save"), 20 (chips), 29 (version pill) | measured |
| button.dark.secondary | bg #5d5d5d, fg #ffffff | 330, 384 ("View usage") | measured (2 screens) |
| button.outline (auth pill) | bg #ffffff, 1px #d8d8d8 (taken from the auth input stroke on 3; the pill was not integrated separately), fg #181818 | 3, 8 | estimated |
| button.disabled | bg #e2e2e2 (on #eee) or #f5f5f5 (on white), fg #828282 / #7e7e7e | 133, 87 | measured |
| color.destructive.fill | #e12e2a, fg #ffffff (4.54:1) | 245,260,265,269,274 | measured |
| color.destructive.text (menu "Delete") | about #c8332e (thin-glyph range: darkest #9e3028, most saturated pixel #e55757) | 133 | estimated |

### 3.6 Status colours

Platform status pills are borderless: tinted background + saturated dark text. Banners are borderless too, except the error alert which is a white card with a 1px red outline.

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.success.solid (toast) | #49b880, white 14px medium label (2.48:1, fails AA) | 14 screens: 230,234,252,265,344,348,353,357,361,366,369,384,387,401 | measured |
| color.success.accent (progress fill, uptime line, check) | #06963a (bar), #178c45 (line) | 212 budget fill, 333 / 395 line | measured |
| color.success.pill.bg | #e2f4e1 (observed #dbf5e5-#e7f6ef) | 18, 260, 133, 361, 373, 333, 395 | measured |
| color.success.pill.fg | #0a6a2c (range #016728-#195e2c); strong variant bg #ccf6ca / #d8f4e4 with fg #00411b | same pills | estimated |
| color.info.pill.bg / fg | #e4edff / #06386f | 329 ("Global" x2); editor tiles #e7f0ff on 22 screens | measured / estimated |
| color.info.diff.add | #e5f3fe | 70-73 (81.8k px) | measured |
| color.warning.banner.bg / fg | #fff4f1 / about #6e3113 (darkest #451f11); icon about #813612; no border | 194 (70.8k px) + 2 more | measured / estimated |
| color.warning.tile (editor, amber) | #ffe7c2 | 106,107,119,120,122,... | measured |
| color.error.pill.bg / fg | #ffe2e3 / about #8d1d1b (darkest #761715) | 271 ("Failed") | measured / estimated |
| color.error.diff.del | #ffd9d8, left bar about #e8625f (2 css px) | 72 (36k px) | measured / estimated |
| color.error.alert | white card, 1px about #b0302b, text about #a52a2b | 77 | estimated |
| color.error.toast | #e12e2a, white label | 245 (13.9k px) | measured |

### 3.7 Accent, focus, selection

- **Is there an accent? No chrome accent.** Primary actions, active nav, tabs and toggles are all near-black or grey. Colour appears only as signal: blue tiles (`#0385ff` on the 36 px "prompt" icon tiles, screen 20, measured), success green, red, the editor's pastel icon tiles, one purple data series. Auth pages add a link/focus blue.
- color.accent.blue = #0385ff (icon tile only; ChatGPT uses #0485ff for toggle-on, unread dot, doc tile: same blue).
- color.focus.border.auth = 1px #4267e5 (estimated from the luma integral on 4: pixels #6c7bbb / #b8c2eb over white give Y about 95, consistent with the link blue; 7 and 11 show the same recolour but were not integrated; border recolour only, no glow, no offset).
- color.focus.ring.canvas = 2px about #0b5fb0 (118 only; luma integral gives Y about 72-84; chroma unreliable) - estimated, single screen.
- The "Generate" prompt input (21) shows only a caret on focus: border stays #d6d6d6. No outline ring with offset exists anywhere in the pack.
- color.selection = #007aff background with white text (screen 11, input field text selection; OS accent, not a designed token). Single screen.

### 3.8 Shadows (estimated; fitted)

| Token | Value | Evidence |
|---|---|---|
| shadow.popover (menu, select, project switcher) | `0 8px 12px rgba(0,0,0,0.10)` plus 1px #e9e9e9 | fits: 311 (A 0.088, y 8.6, blur 11.9), 309 (0.095, 8.9, 11.0), 133 (0.115, 7.7, 13.0) |
| shadow.modal | `0 9px 10px rgba(0,0,0,0.09)`, no border | fits on 63, 75, 39, 52, 247, 277: A 0.086-0.112, y 8.1-9.6, blur 9.1-10.8 |
| shadow.card.hairline (home prompt cards) | 1px #eeeeee + `0 2px 6px rgba(0,0,0,0.05)` | 20: left 234, top 241/250, bottom 239/231 then decays to 253 in about 8 px |
| shell card | none | 3.1 |

### 3.9 Data, avatars, tiles

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.chart.series.1 (single-hue bars) | #885be3 | 212,213,214,216,217,218,219 | measured |
| color.chart.zero (zero-day dash) | #bfbdc8 | 212 | measured |
| color.chart.maxline | about #86819f | 212 | estimated |
| color.chart.spark.warm | about #d6733e and #d74257 (most saturated pixels of 1.5 px lines) | 212 | estimated |
| color.chart.uptime | line #178c45, area fill #e2f1e5 fading to #ffffff | 333, 395, 396 | measured |
| color.avatar.org | #181818 circle, white initial | 20,24,29,... (top left, all screens) | measured |
| color.avatar.user | #eeeeee / #efefef circle, ink initial | 20, 249 | measured |
| color.tile.palette (editor / empty-state icon tiles) | blue #e7f0ff, teal #dff5ee, amber #ffe7c2, yellow #fce48a / #fff0a6, purple #ece3ff, neutral #e2e2e2 / #eeeeee | 101, 103-108, 20 | measured |

## 4. ChatGPT (light) - measured tokens

### 4.1 Surfaces and fills

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.bg.canvas | #ffffff, no card/elevation | all 59 M screens | measured |
| color.bg.sidebar | #f9f9f9 (D #f8f8f8) | 59 M screens (26-37,49,53,56,57,60-64,67-77,79,82,85-88,92,96,108,110-112,120-122,125,151-153,156,157,165,169,172,191,192,194) | measured |
| color.border.sidebar | 1px #ebebeb (integral about #ececec) | 26-37,... (profile 246 / 235 / 254) | measured |
| color.bg.nav.selected | #eaeaea (D #e8e8e8) | 85,86,92,96,120,121,194 (35 screens with 6-9k px blobs) | measured |
| color.bg.hover.ghost (icon button hover disc) | #f5f5f5 | 26 composer "+" disc; survey adds #eeeeee for the "..." button | measured (1 screen) |
| color.bg.hover.menu (selected menu option) | #f6f6f6 | 181 | single screen |
| color.bg.bubble.user | #f5f5f5 (D #f2f2f2) | 192 (9.5k px), 63, 73, 32 | measured |
| color.bg.tile / pill.neutral | #f3f3f3 | 56 (2 x 54k px), 53, 57, 145 ("Fix" pill) | measured |
| color.bg.code.inline | #ececec | 138 | measured |
| color.bg.code.block.dark (Codex log) | #171717, text about #f3f3f3 | 139 (306k px) | single screen |
| color.bg.diff.add / gutter | #e6ffee / #cbffd9 | 138,140,141,142 | measured |
| color.bg.veil (modal backdrop) | about `rgb(227 227 227 / 0.5)` plus about 1.5 css px blur (text) | linear fit of 4 flats: #fff -> #f0f0f0, #f9f9f9 -> #eeeeee, #e8e8e8 -> #e7e7e7, black -> #717171; residual <= 1.5 levels; screens 65,66,84,93,210,229 | estimated |

The veil reads as "about 6% dim" on white but is not black alpha: black-alpha would leave pure black at pure black, while here black becomes #717171.

### 4.2 Borders

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.border.composer | 1px #dedede | 22,26,33: top 222/221, bottom 217/212 | estimated |
| color.border.menu | 1px #dcdcdc | 26 (220 / 221 / 226 / 219) | measured |
| color.border.modal | about 1px #d6d6d6 (over the veil) | outward first px 211-217 on 66,78,84,93,210,229 | estimated |
| color.border.input / outline button | 1px #d3d3d3 | 2 social buttons (top 211, bottom 209, left 216) | estimated |
| color.border.card | 1px #e3e3e3 | 54 product card (227 left and right) | estimated |
| color.border.hr (message divider) | 1px about #d0d0d0 | 24 | estimated |
| color.border.header (only when scrolled) | 1px about #f2f2f2 | 44, 57, 75 | estimated |
| color.border.table.header / row | #d4d4d4 / #f2f2f2 | 57 (header 219/236; rows 242, 242, 246) | estimated |

### 4.3 Text

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.text.primary | #0d0d0d (glyph darkest reads #000000) | flat CTA #0d0d0d on 0,66,81,83; glyph darkest/mode #000000 on 26,29,30,33 ("Ready when you are" mode #000000) | estimated |
| color.text.secondary | #5d5d5d | disclaimer p1-p5 #535353-#5d5d5d on 85,86,92,96; plan label darkest #545454 | estimated |
| color.text.tertiary | #808080 | "Your chats" / "Group chats" darkest #7b7b7b-#808080 on 26,29,30,33,85 | measured |
| color.text.placeholder | #7e7e7e | "Ask anything" darkest #7b7b7b-#7e7e7e on 26,85,86,92,96 | measured |
| auth sub-title | about #3d3d3d (p1), darkest #2f2f2f | 2,3,4,5 | estimated |
| color.text.link | about #206eb1 (darkest) / #1677d2 (most saturated) inline; "Activity" links #2d5484 | 54, 44 | estimated |

### 4.4 Buttons

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| button.primary.bg | #0d0d0d (onboarding #0e0e0e), fg #ffffff | 81 (380x52), 66, 83, 0; 13-16 | measured |
| button.primary.bg (auth) | #131313 | 25 screens (1-7,...) | measured |
| button.round.bg (send / voice, 36 css disc) | #000000 / #010101 | 76 screens | measured |
| button.secondary | white, 1px #d3d3d3, fg #0d0d0d | 2, 78 | estimated |
| button.disabled | #c4c4c4 fill, #ffffff label (1.74:1); send disc disabled #a8a8a8 | 97, 100 / 85, 88 | measured |
| color.destructive.fill | #e12e2a (identical to Platform) | 78, 107, 229 | measured |
| color.destructive.text (menu "Delete") | about #c53730 (most saturated pixel; darkest #99322e) | 75 | estimated |

### 4.5 Status and accent

| Token | Value | Evidence | Conf. |
|---|---|---|---|
| color.success.solid (toast) | #008635 (4.71:1 with white) | 12 screens: 67,69,88,90,91,125,133,136,144,201,204,218 | measured |
| color.success.chip (selected onboarding chip) | bg #d3f4e0, fg about #107f3b, 1px green border (about #127e44) | 16 | measured / estimated |
| color.success.pill ("Open") | bg #e1eee3, fg about #1a6d35 | 145 | measured / estimated |
| color.diff.stat.add / del | about #168540 / #b73832 | 138 | estimated |
| color.error.fg / input border | about #c53730 / about #bd352c (luma-derived) | 225 | estimated |
| color.accent.blue | #0487ff (toggle on, 99), #0086ff (unread dot, 60), #0487ff (doc tile, 163), #0585ff (project palette, 147) | 4 screens: one blue, #0285ff-#0585ff | measured |
| toggle off | about #e5e5e5 (veil-corrected from #e4e4e4 on 97) | 97 | estimated |
| color.accent.indigo.pill ("Get Plus") | bg #f1f1fc (D #f1effb), fg about #4e4985, sparkle about #4e51cf (survey) | 26,29,30,33 (+48 screens) | measured / estimated |
| color.accent.indigo.cta (Plus plan) | #605eea | 81 | single screen |
| color.focus.input | 1px about #4163bc (luma integral), label about #4560ac | 2, 4 | estimated |
| spinner arc | about #1f73cd | 44 | estimated |
| color.selection (content) | #bedcff | 60 | single screen |
| project / label palette | black #010101, red #f9413f, orange #fb6b25, yellow #ffc400, green #00b84c, blue #0585ff, purple #9051f8, pink #ff68ad | 147 | measured |
| file tiles | PDF #f9433f, document #0487ff | 163 | measured |
| avatar (user, sidebar footer) | about #319df8 (mode on 26, 80; interior range #2b92ff-#359dff after the letters), white initials | 22,24,26,29,80,92,119 | estimated |

No keyboard focus ring (offset outline) appears in either pack; focus is shown by recolouring the input border (and label), plus a caret.

### 4.6 Shadows (estimated; fitted)

| Token | Value | Evidence |
|---|---|---|
| shadow.popover | `0 8px 11px rgba(0,0,0,0.08)` plus 1px #dcdcdc | 26: A 0.076, y 7.6, blur 10.7 |
| shadow.modal | `0 8px 12px rgba(0,0,0,0.08)` plus 1px about #d6d6d6 | 84 (0.079, 7.7, 12.5), 93 (0.083, 7.3, 12.4), 210 (0.073, 8.3, 12.9), 229 (0.086, 6.5, 13.4) |
| shadow.composer | about `0 2px 6px rgba(0,0,0,0.06)` | 22, 26: bottom falloff 236, 247, 249, 249, 252 over about 8 px |
| shadow.card | border only (about 0 1px 3px rgba(0,0,0,0.04)) | 54 |

## 5. Side-by-side and recommendation

| Role | Platform (use for employer / landlord / bank dashboards) | ChatGPT (use for newcomer app + agent feed) |
|---|---|---|
| page / shell | #f3f3f3 canvas + white card with 1px #ececec, no shadow | #ffffff canvas, #f9f9f9 sidebar, 1px #ebebeb |
| selected row | #e0e0e0 nav, #eeeeee list row | #eaeaea |
| hover | #ececec (menu) | #f5f5f5 (ghost disc), #f6f6f6 (menu) |
| subtle fill | #f9f9f9 / #fafafa | #f5f5f5 bubble, #f3f3f3 tile |
| strong border | #d6d6d6 input | #d3d3d3 input, #dedede composer |
| primary | #181818 | #0d0d0d (auth #131313, round #000) |
| secondary button | #ececec fill, no border | white + 1px #d3d3d3 |
| destructive | #e12e2a | #e12e2a |
| success solid | #49b880 (low contrast) | #008635 |
| text 1 / 2 / 3 | #181818 / #494949 / #808080 | #0d0d0d / #5d5d5d / #808080 |
| scrim | rgba(0,0,0,0.30) | #e3e3e3 at 50% + blur |
| popover shadow | 0 8px 12px /0.10 + #e9e9e9 | 0 8px 11px /0.08 + #dcdcdc |
| selection | #007aff (input) | #bedcff (content) |

### How many distinct greys really exist

- **Platform (M):** about 9 fills (#ffffff, #fafafa family, #f5f5f5, #f3f3f3, #eeeeee, #ececec, #e9e9e9, #e2e2e2, #e0e0e0), 5 line strengths (#f4f4f4, #ececec, #e6e6e6, #e3e3e3, #d6d6d6), 4 text greys (#000 / #181818, #494949, #5d5d5d on the dark-grey button, #808080). The #fefefe / #fdfdfd / #fcfcfc / #f8f8f8 / #f7f7f7 / #f6f6f6 values are translucent surfaces, gradients and codec noise, not tokens (except #f7f7f7 code and #f8f8f8 parameter popover).
- **ChatGPT (M):** about 6 fills (#ffffff, #f9f9f9, #f5f5f5, #f3f3f3, #eaeaea / #ececec, #f6f6f6 menu), 5 line strengths (#f2f2f2, #ebebeb, #e3e3e3, #dedede / #dcdcdc, #d3d3d3), 3 text greys (#0d0d0d, #5d5d5d, #808080) plus disabled #c4c4c4 and #a8a8a8.

## 6. Rules (front-end)

1. Neutral first: every surface is a grey from the ladder; colour is reserved for state, data, and one accent.
2. Platform shell = canvas #f3f3f3 holding one white card with a 1px #ececec edge and no shadow; no divider between sidebar and card.
3. Selected nav = flat #e0e0e0 with black label; no accent bar, no coloured icon.
4. Menu/option hover = #ececec; selected list row = #eeeeee; ChatGPT-style rows use #eaeaea (selected) and #f5f5f5-#f6f6f6 (hover).
5. Primary = near-black fill (#181818 / #0d0d0d) with white label; secondary = #ececec fill without border (dashboards) or white with 1px #d3d3d3 (mobile); destructive = #e12e2a.
6. Status pills are borderless: tint background + dark saturated text of the same hue; never saturated fills (solid fills only for toasts and destructive buttons).
7. Warning banner = #fff4f1 fill, no border, brown text; error alert = white card with a 1px red outline.
8. Inputs: 1px #d6d6d6 (#d3d3d3) at rest; focus = recolour the border to the accent (1px) and the floating label; no glow, no offset ring.
9. Table rows use a 1px #ececec divider (ChatGPT #f2f2f2), no zebra, header band #f9f9f9; header rule in ChatGPT tables is #d4d4d4.
10. Menus: white, 1px hairline (#e9e9e9 / #dcdcdc), shadow about `0 8px 12px rgba(0,0,0,0.10)`; modals: white, no border on dashboards (1px about #d6d6d6 on mobile), shadow about `0 9px 10px rgba(0,0,0,0.09)`.
11. Scrim: black at 30% for desktop dialogs (overlays sidebar and top bar too); ChatGPT-style veil for mobile sheets.
12. Charts are single-hue (one series colour) with neutral zero dashes; success green line with a pale area fill for uptime-style trends.

## 7. CSS variables (also returned in the structured result)

The same block is returned as `css_snippet` in the structured result.

```css
:root {
  /* surfaces (Platform ladder) */
  --color-bg-canvas: #f3f3f3;
  --color-bg-surface: #ffffff;
  --color-bg-subtle: #f9f9f9;       /* table header, dropzone, option card */
  --color-bg-sunken: #fafafa;       /* editor / long-text fields */
  --color-bg-code: #f7f7f7;
  --color-bg-hover: #ececec;        /* menu row, secondary button, chip */
  --color-bg-selected-row: #eeeeee; /* master list row, segmented track */
  --color-bg-selected-nav: #e0e0e0;
  --color-bg-scrim: rgb(0 0 0 / 0.30);
  /* surfaces (ChatGPT ladder, newcomer app) */
  --app-bg-drawer: #f9f9f9;
  --app-bg-bubble: #f5f5f5;
  --app-bg-tile: #f3f3f3;
  --app-bg-selected: #eaeaea;
  --app-bg-veil: rgb(227 227 227 / 0.5);
  /* borders */
  --color-border-hairline: #f4f4f4;
  --color-border-subtle: #ececec;
  --color-border-default: #e6e6e6;
  --color-border-input: #d6d6d6;
  --color-border-menu: #e9e9e9;
  /* text */
  --color-text-strong: #000000;
  --color-text-primary: #181818;
  --color-text-secondary: #494949;
  --color-text-tertiary: #6b6b6b;   /* ref #808080; raised for AA */
  --color-text-placeholder: #767676;/* ref #787878 / #7e7e7e */
  --color-text-on-primary: #ffffff;
  /* actions */
  --color-primary: #181818;
  --color-secondary: #ececec;
  --color-destructive: #e12e2a;
  --color-accent: #0285ff;          /* ref blue; swap for Rasikh brand */
  --color-accent-text: #0b6bcb;
  --color-focus: var(--color-accent);
  /* status: tint bg / fg */
  --color-success-bg: #e2f4e1; --color-success-fg: #0a6a2c; --color-success-solid: #008635;
  --color-info-bg: #e4edff;    --color-info-fg: #06386f;
  --color-warning-bg: #fff4f1; --color-warning-fg: #6e3113;
  --color-error-bg: #ffe2e3;   --color-error-fg: #a52a2b;
  /* elevation */
  --shadow-menu: 0 8px 12px rgb(0 0 0 / 0.10);
  --shadow-modal: 0 9px 10px rgb(0 0 0 / 0.09);
  --shadow-card: 0 2px 6px rgb(0 0 0 / 0.05);
  --color-selection: #bedcff;
}
```

## 8. Rasikh adoption notes

- Desktop dashboards: Platform neutrals and component recipes; accent not used on buttons.
- Newcomer app and agent feed: ChatGPT neutrals (white canvas, drawer #f9f9f9, bubbles #f5f5f5, pill buttons #0d0d0d, 1px #dedede composer, hairline #ebebeb).
- One accent only. Neither pack has a chrome accent (both reserve blue #0285ff for state signals: toggle on, unread dot, doc tile). Rasikh accent should be limited to focus, links, roadmap progress / active step, agent "working" marker and "needs approval" marker; keep primary buttons near-black.
- Deliberate deviations: text.tertiary #6b6b6b (5.33:1) and placeholder #767676 (4.54:1) instead of #808080 (3.95:1) / #787878 (4.42:1); success solid #008635 (white 4.71:1) instead of Platform #49b880 (2.48:1); link text #0b6bcb (5.28:1) instead of raw #0285ff (3.62:1); input border stays #d6d6d6 (1.45:1) for look-and-feel parity, so the 3:1 non-text contrast requirement is met by a 2px accent focus ring plus an error border in #bd352c, not by the resting border; consider #8f8f8f resting borders on newcomer-app forms.
- Trust passport toggles: dashboards use near-black ON / #e0e0e0 OFF (Platform); newcomer app uses accent ON / #e5e5e5 OFF (ChatGPT).
- Risk summaries: low = success tint, medium = amber tile #ffe7c2 with brown text, high = error tint; employer-backing badge = success pill; "needs approval" = info tint pill.

## 9. Evidence index

- Surfaces / canvas groups: all 417 + 245 screens scanned (canvas group tables), flat-blob scans.
- Shadows: platform menus 311, 309, 133; platform modals 63, 75, 39, 52, 247, 277; chatgpt menu 26; chatgpt modals 84, 93, 210, 229 (66, 78, 107, 216 fits rejected as outliers: contents or stacked elements under the edge).
- Hairlines: platform 24, 29, 163, 194, 249, 329, 87, 88; chatgpt 2, 24, 26, 44, 54, 57, 75.
- Pills: platform 18, 133, 260, 271, 329, 333, 361, 372, 373; chatgpt 16, 145.
- Toasts: platform 14 screens listed; chatgpt 12 screens listed.
- Text: platform 20,21,24,29,46-48,53,87,95,133,141,163,194,249; chatgpt 2-5,26,29,30,33,85,86,92,96.

## 10. Open questions / not measurable

1. Hover and pressed states for sidebar items, table rows, primary/secondary buttons are not in the screenshots (only menu-row hover, one ghost disc, and the selected states). Rasikh hover values for those are design decisions.
2. Keyboard focus ring: not present in ChatGPT; one 2px blue ring on Platform 118; auth border recolour only. Exact ring colour and offset unknown.
3. Dark theme intentionally excluded (Platform 318-322, ChatGPT 182-187 are separate work).
4. Capture groups M / D: the true CSS values are not known; M is chosen by majority and by agreement with published ChatGPT values (inference).
5. Shadows are fitted with a single Gaussian layer; real CSS may be two layers (e.g. a tight key shadow plus an ambient shadow).
6. ChatGPT veil: black elements under the veil map to #717171 while text blurs; the fitted flat-colour mapping is the best simple model (alpha 0.5, colour about #e3e3e3).
7. Saturated thin features (links, focus borders, small red text) have unreliable chroma because of codec artefacts; luma-derived values are labelled estimated.
8. Platform chart palette beyond the purple series, the audio waveform mint (about #5bc79d per survey) and syntax-highlight colours were not re-measured.
