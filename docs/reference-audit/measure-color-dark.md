# Measure: colour system, dark theme (key: color-dark)

Reference packs: "OpenAI Platform web Apr 2026" (Platform) and "ChatGPT web Mar 2026" (ChatGPT). All hex values below were sampled from pixels (flat regions, edge-to-edge profiles, glyph plateaus). Anything inferred is marked **estimated**. Nothing here comes from memory of the real products.

## 0. Summary

1. Dark mode is **tonal, not inverted**: a ladder of near-neutral greys, about +9 to +15 sRGB levels per elevation step, near-white text, no colour in the chrome.
2. Platform dark: shell `#131313` (sidebar + top bar), content card `#212121`, raised `#303030`, chips `#3d3d3d`, inset track `#0d0d0d`. ChatGPT dark: sidebar `#181818`, canvas `#212121`, raised `#303030`, selected pill `#363636`.
3. Text: primary is pure `#ffffff` in both packs (not an off-white). Secondary is about `#c9c9c9`, tertiary `#9e9e9e` (Platform) or `#a9a9a9` (ChatGPT), disabled `#6c6c6c`.
4. The primary button **is inverted**: Platform `#f3f3f3` fill with `#000000` label (this is exactly the light theme's shell colour); ChatGPT `#ffffff` (send circle) or `#f9f9f9` (Codex pills) with `#000000` icon/label.
5. Borders are white-alpha hairlines: about 5% (ChatGPT rows `#2c2c2c`), 10-11% (Platform cards/dividers `#363636`-`#3a3a3a`), 15% (ChatGPT controls `#424242`), 24% (Platform pill/input outlines `#555555`).
6. Shadows do **not** vanish, but they are almost invisible: edge darkening is -2 to -10 levels and fades within about 10-25 raw px. Separation comes from the lighter fill plus a 1 px outline. Modal scrim in dark is **black at 50% plus a light blur** (measured, ChatGPT 182); the light packs use 6% (ChatGPT) and 30-35% (Platform).
7. Semantic colour (green, red, blue) is **theme-invariant for small signals**: the diff `+14`/`-1` counts measure `#0a9646`-`#0fa24c` / `#bf2e29`-`#c9393b` in dark and `#0c9144` / `#ab2c28` in light. There are no pale-tint pills or banners anywhere in the dark screens (see section 7: those are estimated).
8. Not observable in any dark screen: destructive button, error/success/warning/info pill or banner, focus ring, link colour, hover state, toggle ON, toast, table header. Section 7 derives them (estimated) from the observed light/dark pairs.

## 1. Scale and crop

- Every capture was cropped to the app viewport before measuring: Platform `1920x1205`, ChatGPT `1920x1200` (bottom 120 px Mobbin bar removed). No Mobbin pixel was sampled.
- **Scale: 1 CSS px = 1.27 raw px for both packs.** ChatGPT is verified two ways: sidebar 330 raw = 260 CSS, and the thread column 974 raw (x 638..1612) = 768 CSS (ratio 1.268). Platform is inferred: nav labels have the same cap height (12-13 raw) as ChatGPT's 14 px sidebar labels, and the Mobbin pipeline is the same. Note: `survey-platform-280-359.md` used 1.333; `survey-platform-000-099.md` and `100-199.md` used 1.27. I could not prove either for Platform from a known-size element, so **Platform CSS lengths are estimated (1.27 vs 1.333, 5% apart)**. Colours are unaffected by scale.
- Hairlines render across 2 raw rows (1 CSS px = 1.27 raw). I report the **peak** and an **integrated estimate** (sum of the colour delta over the profile, divided by 1.27 raw px).
- The captures are soft and mildly sharpened (JPEG-like): ringing of about +/-2 to 4 levels appears beside edges, e.g. `#1d1d1d`/`#363636` straddling a `#212121`/`#303030` edge. Thin text never fully reaches its CSS colour.

### Confidence rule used

- **measured** = flat fill seen on at least 4 dark screens of that pack, OR at least 3 screens with identical flat samples (+/-1 level); for thin lines and text, at least 4 screens (Platform has only 5 dark screens, ChatGPT has 6).
- **estimated** = fewer screens, anti-aliased glyph/line values, or anything derived from the light/dark relationship. The evidence column always says which screens were sampled.
- Text values are the **glyph ceiling** (brightest 0.5% of the glyph pixels). Because the ceiling repeats to the exact level across screens (for example `#9e9e9e` for the Platform group labels on 318, 320, 321 and 322) it is close to the CSS value. Treat text values as +/-6 levels.

## 2. Dark material that exists

| pack | screen | content | used for |
|---|---|---|---|
| Platform | 318 | Chat prompts home, profile menu open with Light/Dark/System toggle | shell, canvas, raised cards, menu, chips, create button, toggle |
| Platform | 319 | Agent Builder canvas | editor canvas `#0d0d0d`, nodes `#1c1c1c`, tile palette, toolbar |
| Platform | 320 | Audio playground | composer, inputs, slider, segmented control, panel divider |
| Platform | 321 | Images playground | hairline grid, tinted composer (outlier), disabled send |
| Platform | 322 | Usage dashboard | cards with borders, tabs, chart palette, budget meter, dividers |
| ChatGPT | 182 | Settings > General, Appearance = Dark, behind a scrim | modal, scrim, row dividers, toggle |
| ChatGPT | 183 | Dark home | sidebar, canvas, composer, Get Plus chip, Upgrade pill, send |
| ChatGPT | 184 | Dark chat thread | user bubble, rule, active sidebar row, scroll button |
| ChatGPT | 185 | Images gallery | composer, carousel buttons, disabled send |
| ChatGPT | 186 | Apps directory | tabs pill, search field, list rows |
| ChatGPT | 187 | Codex | connect card, white pills, row separators, diff colours |

Also used as evidence (not full dark screens): Platform 239/240 (light page with a dark logo-preview panel and its light twin), ChatGPT 110-112 (dark composer `#303030` on a light page), 139 (terminal block `#171717` on a light page), 211 (black toast on a light page). Light twins for pairing: Platform 329, ChatGPT 238.

A pixel scan of all 417 + 245 screens (fraction of pixels darker than luminance 60) confirms there are exactly 5 full dark Platform screens (318-322) and 6 full dark ChatGPT screens (182-187). No other dark UI exists.

## 3. Platform dark (use for employer, landlord and bank dashboards)

### 3.1 Surfaces

| token | value | light twin | evidence | n | conf |
|---|---|---|---|---|---|
| color.bg.page (shell: sidebar + top bar, no border between them) | `#131313` | `#f3f3f3` | 318, 320, 321, 322 flat | 4 | measured |
| color.bg.content (inset content card, right panels, chart cards, modal-equivalent) | `#212121` | `#ffffff` | 318, 320, 321, 322 | 4 | measured |
| color.bg.raised (prompt cards, profile menu, audio composer, budget track, user row, 1d chip) | `#303030` | white + shadow | 318, 320, 321 (nav), 322 | 4 | measured |
| color.bg.selected (active nav row) | `#303030` | `#e0e0e0` | 318 Chat, 320 Audio, 321 Images, 322 Usage | 4 | measured |
| color.bg.raised.high (suggestion chips) | `#3d3d3d` (`#3b3b3b` edge) | n/a | 318 only | 1 | estimated |
| color.bg.inset (theme toggle track, tab segmented track, agent canvas) | `#0d0d0d` | `#eeeeee` | 318, 320, 319 | 3 flat identical | measured |
| color.bg.node (agent-builder palette and nodes) | `#1c1c1c` | white | 319 | 1 | estimated |
| color.bg.toolbar.floating (bottom canvas toolbar) | `#2c2c2c`, selected tool `#454545` | white | 319 | 1 | estimated |
| color.bg.panel.preview (Dark logo preview panel on a light page) | `#0f0f0f` | `#f7f7f7` | 240 | 1 | estimated |
| color.bg.composer.tinted (Images composer, cool tint, **outlier**) | `#33343c`, disabled send `#393a40` | n/a | 321 only | 1 | estimated |
| color.bg.hover | `#1e1e1e` on shell, `#2a2a2a` on content | `#ececec` | no hover captured; scaled from light hover/selected ratio | 0 | estimated |

Elevation ladder (flat steps): `#0d0d0d` -> `#131313` -> `#212121` -> `#303030` -> `#3d3d3d`, steps of +6, +14, +15, +13. Content card is inset about 9 CSS px from the right and bottom edges and about 55 CSS px from the top; the tint ring is the only separation (no border, no shadow; edge profile at 318 x=278: `#131313` to `#212121` with no highlight line).

### 3.2 Borders

| token | value | alpha-equivalent over `#212121` (estimated) | evidence | n | conf |
|---|---|---|---|---|---|
| color.border.subtle (card outline, cards that share the canvas fill) | `#363636` peak, `#393939` integrated | white 10% | 322 four chart cards (left+top) | 1 | estimated |
| color.border.default (header / column / section dividers) | `#3a3a3a` (peaks `#3b-#3f`, integrated `#3a-#3d`) | white 11% | 322 (header y=141, column x=1501, tabs y=710, sections y=312/475), 320 (panel x=1502, `#393939`), 321 (grid `#414141`) | 3 | estimated |
| color.border.menu-divider (hairline on a `#303030` menu) | `#464646` peak, `#484848` integrated | white 11% over `#303030` (so the hairline is white 10-11% on both bases) | 318 (y=195) | 1 | estimated |
| color.border.input (pill/select/textarea outline) | `#555555` (peaks `#565656`, `#575757`, `#5a5a5a`, `#5d5d5d`; integrated `#545454`) | white 24% | 318 Generate pill, 322 date + project pills, 320 Model/Voice select + Instructions textarea; 240 Remove button `#4d4d4d` | 4 | measured |
| color.border.strong | `#5d5d5d` | white 27% | 320 select | 1 | estimated |
| color.border.node (agent node outline) | `#444444`-`#474747` | n/a | 319 | 1 | estimated |
| color.tab.underline (active tab, 1-2 raw px) | `#d6d6d6` peak (equals pure white at about 1 raw px by integration) | n/a | 322 both tab rows | 1 | estimated |
| color.chart.grid.dashed | `#888888` (1 px dashes) | n/a | 322 | 1 | estimated |

### 3.3 Text

| token | value | light twin | evidence | n | conf |
|---|---|---|---|---|---|
| color.text.primary | `#ffffff` | `#0d0d0d` | max on titles/nav/active in 318, 319, 320, 321, 322 | 5 | measured |
| color.text.secondary (inactive top-bar link, inactive tabs, menu email) | `#c9c9c9` (API Docs ceiling on 4 screens; tabs `#c5c5c5`; email `#c0c0c0`) | `#424242` | 318, 320, 321, 322 | 4 | measured |
| color.text.tertiary (group labels, card meta, 'Group by', '/ $10', node sublabels) | `#9e9e9e` (ceilings `#9e-#a1`; group label `#9e9e9e` identical on 4 screens) | `#7f7f7f` | 318, 320, 321, 322, 319 | 5 | measured |
| color.text.placeholder | `#a1a1a1` (Generate...), textarea `#ababab` | `#797979` | 318, 320, 321 | 3 | estimated |
| color.text.quaternary (chart axis labels) | `#7e7d80` | n/a | 322 | 1 | estimated |
| color.text.disabled | `#6c6c6c` ('Evaluate' `#6c6c6c`, undo icon `#696969`) | n/a | 319 | 1 | estimated |
| color.text.separator ('/' in breadcrumb) | `#494949` | n/a | 322 | 1 | estimated |
| color.link.default | same as the surrounding text, **underlined** ('Edit budget' `#a1a1a1`-`#b2b2b2`) | `#4267e5` blue | 322 | 1 | estimated |

### 3.4 Buttons and controls

| token | value | evidence | n | conf |
|---|---|---|---|---|
| color.button.primary.bg | `#f3f3f3` (same as the light shell tint) | 318 Create, 319 Publish, 320 send (pause `#f5f5f5`) | 3 flat identical | measured |
| color.button.primary.fg | `#000000` | 318, 319, 320 | 3 | measured |
| color.button.secondary.bg (suggestion chip) | `#3d3d3d`, label `#ffffff` | 318 | 1 | estimated |
| color.button.secondary.border (outline pill) | `#555555` on transparent (`#212121` through) | 318, 322 | 2 | estimated |
| color.button.ghost | no fill, label `#ffffff` (Export, Clear, History) | 320, 322 | 2 | estimated |
| color.button.neutral-chip (Draft) | `#2b2b2b`, label `#c5c5c5` | 319 | 1 | estimated |
| color.button.disabled.bg / fg (tinted outlier) | `#393a40` / `#48494e` | 321 | 1 | estimated |
| color.segmented.track / selected | `#0d0d0d` / `#303030` (icon selected `#ffffff`, unselected `#bebebe`) | 318, 320 | 2 | estimated |
| color.slider.fill / track / thumb | `#8c8c8c` / `#3e-#45` / white with dark ring | 320 | 1 | estimated |
| color.input.bg | transparent (shows `#212121`) | 318, 320, 322 | 3 | measured |

### 3.5 Accents and chart (colour appears only as signal)

| token | value | evidence | conf |
|---|---|---|---|
| color.chart.series.1 | `#885be3` (bars, mini bars, three charts); legend square `#735fdd` | 322 | estimated (1 screen) |
| color.chart.series.2 (legend) | `#c6c5d5` | 322 | estimated |
| color.chart.line.red / orange | `#c44570` / `#ef6f57`-`#d47a48` (sparkline) | 322 | estimated |
| color.icon.tile.blue (prompt card tile) | `#0086ff`, same as light `#0385ff` (theme-invariant) | 318 (2 tiles) | estimated |
| color.meter.ok (budget mark) | `#12a24c` (gradient `#127d40`-`#1c9d4f`, 4 px wide) | 322 | estimated |
| color.success.wave (audio waveform) | `#35c387` (peaks `#3ac288`) | 320 | estimated |
| node tile palette (dark): blue / green / orange / yellow / purple | `#76a1fb` / `#8ce5c9` / `#ffae2d` / `#ffdc43` / `#9665fb`; sticky note `#af8916` with `#130800` text | 319 | estimated (light twins are pastel tint tiles; dark twins are mid-tone fills with dark glyphs) |

### 3.6 Platform surfaces and elevation (observed)

- Raised surfaces show a 1 px lighter edge about +6 over their `#303030` fill (`#363636`): prompt card top, menu left/right/top, composer top/bottom. Cards that share the canvas fill use the same `#363636` as their only visible outline (322). Treat `#363636` as the card outline.
- Soft shadow is still present but faint. Prompt card: below the edge the page reads `#1e1e1e`..`#171717` then `#1f1f1f` over about 11 raw px (-2 to -10 vs `#212121`). Profile menu: `#1b1b1b` at the edge, rising to `#1f1f1f` over about 25 raw px (-6 at the edge, about 18% darkening). Floating toolbar on the `#0d0d0d` canvas: `#080808` below (-5, 38%). Estimated recipes: card `0 4px 12px rgba(0,0,0,0.20)`, popover `0 8px 24px rgba(0,0,0,0.30)`.

## 4. ChatGPT dark (use for the newcomer app and agent feed)

### 4.1 Surfaces

| token | value | light twin | evidence | n | conf |
|---|---|---|---|---|---|
| color.bg.page | `#212121` (canvas; top bar is transparent over it) | `#ffffff` | 182-187 | 6 | measured |
| color.bg.sidebar | `#181818` (`#171717` on 185) | `#f8f8f8` | 183, 184, 186, (185, 182 dimmed) | 4 | measured |
| color.bg.content | `#212121` | `#ffffff` | 182-187 | 6 | measured |
| color.bg.raised (composer, user bubble, Play pill) | `#303030` (Play pill `#2f2f2f`); same `#303030` in 112 (light page, dark composer) | white + border + shadow / `#f2f2f2` bubble | 183, 184, 185, 182, 112 | 5 | measured |
| color.bg.raised.high (Codex connect card) | `#414141` | n/a | 187 | 1 | estimated |
| color.bg.selected (active sidebar row, spans x 8..320 raw) | `#242424` (`#232323` on 185) | `#eaeaea` | 184, 185, 186 | 3 | estimated |
| color.bg.selected.pill (modal nav active, 'Featured' tab) | `#363636` (`#343434` tab) | `#efefef` / `#f3f3f3` | 182, 186 | 2 | estimated |
| color.bg.modal (right pane) / nav column | `#212121` / `#1e1e1e` | white / `#f9f9f9` | 182 | 1 | estimated |
| color.bg.input | transparent (`#212121` through), pill outline | white | 186 | 1 | estimated |
| color.bg.toggle.off.track / knob | `#696969` / `#ffffff` | n/a | 182 | 1 | estimated |
| color.bg.hover | `#212121` on the `#181818` sidebar; `#2a2a2a` on canvas rows | `#f5f5f5` | not captured | 0 | estimated |
| color.bg.code.block (dark terminal on a light page, for reference) | `#171717`, text `#e8e8e8`-`#f3f3f3` | n/a | 139 | 1 | estimated |

### 4.2 Borders

| token | value | alpha-equivalent over `#212121` (estimated) | evidence | n | conf |
|---|---|---|---|---|---|
| color.border.sidebar | **none visible** (x=329 reads `#232323`, i.e. canvas +2) | n/a | 183 | 1 | estimated |
| color.border.subtle (row hairlines in settings, Codex list separators) | `#2c2c2c` peak, `#2e2e2e` integrated | white 5% | 182 (four rows), 187 (two rows) | 2 | estimated |
| color.border.modal (outer edge) | `#2a2a2a` (top), `#242424` right/bottom | white 4% | 182 | 1 | estimated |
| color.border.default (header divider, control outlines) | `#424242` (header divider `#414141`, search pill `#424242`, Upgrade pill `#404040`, scroll button `#404040`) | white 15% | 182, 186, 183, 184 | 4 | measured |
| color.border.strong (carousel buttons, Codex card, ring around controls) | `#4b4b4b` | white 19% | 185, 187 | 2 | estimated |
| color.border.rule (assistant section rule, 1 px) | `#464646` peak | white 17% | 184 | 1 | estimated |
| color.border.composer (faint edge, +6 over fill) | `#363636` | n/a | 183 top and bottom | 1 | estimated |
| color.border.disabled (carousel left button) | `#2a2a2a` | n/a | 185 | 1 | estimated |

### 4.3 Text

| token | value | light twin | evidence | n | conf |
|---|---|---|---|---|---|
| color.text.primary | `#ffffff` (also user bubble text, headings, sidebar items, Upgrade label) | `#0d0d0d` | all 6 | 6 | measured |
| color.text.secondary (section labels 'Group chats' ceiling `#c9c9c9` on four screens; 'Your chats' `#c1c1c1`; descriptions `#c0-#cd`; row meta `#cccccc`) | `#c9c9c9` | `#484848` | 183, 184, 185, 186 | 4 | measured |
| color.text.placeholder (composer) | `#c7c7c7` ceiling (`#c1c1c1` top-mean), image prompt `#cccccc` | `#7b7b7b`-`#8f8f8f` | 183, 184, 185 | 3 | estimated |
| color.text.tertiary (search placeholder) | `#ababab` ceiling (`#a9a9a9` top-mean) | `#6a6a6a`-`#8b8b8b` | 186 | 1 | estimated |
| color.text.quaternary (inactive top nav 'App', 'Docs') | `#8d8d8d` ceiling | n/a | 187 | 1 | estimated |
| color.text.disabled (disabled carousel arrow) | `#686868`-`#737373` | n/a | 185 | 1 | estimated |
| color.link.default | primary text **underlined** ('Cookie Preferences' `#ffffff`) | blue `#5565ad` family | 184 | 1 | estimated |
| color.text.success (diff +N) | `#0a9646`-`#0fa24c` (same as light `#0c9144`) | same | 187 (3 rows) | 1 | estimated |
| color.text.error (diff -N) | `#bf2e29`-`#c9393b` (light `#ab2c28`) | same | 187 (3 rows) | 1 | estimated |

### 4.4 Buttons, chips, accents

| token | value | evidence | n | conf |
|---|---|---|---|---|
| color.button.primary.bg (send/voice circle, 36 CSS) | `#ffffff`, icon `#000000` (light twin `#000`/`#0d0d0d`) | 183, 184 (182 dimmed reads `#7e7e7e` = 50%) | 2 | estimated |
| color.button.primary.bg (Codex pills) | `#f9f9f9`, label `#000000` | 187 | 1 | estimated |
| color.button.primary.disabled (send, empty prompt) | bg `#4d4d4d`, arrow `#555555` | 185 | 1 | estimated |
| color.button.secondary (outline pill) | transparent, border `#404040`, label `#ffffff` | 183 Upgrade, 184 | 2 | estimated |
| color.button.secondary.filled (Play pill) | `#2f2f2f` | 182 | 1 | estimated |
| color.chip.plan (Get Plus) | bg `#383669` (`#37386b`, `#39376c`), label `#f6f6ff`, glyph `#eceeff` (light twin bg `#f0eefa`, text `#454085`) | 183, 184 | 2 | estimated |
| color.accent.setting-default | grey dot `#9a9a9a` ('Accent color: Default') | 182 | 1 | estimated |
| color.dot.unread | `#96d0fc` (light blue) | 184 | 1 | estimated |
| color.avatar.group (SL) | `#7f8b89` | 183 | 1 | estimated |

### 4.5 ChatGPT scrim, modal and shadows

- **Scrim = black at 50%** (measured): sidebar `#181818` becomes `#0c0c0c` (0.50), canvas `#212121` becomes `#101010` (0.485), composer `#303030` becomes `#181818` (0.50), Get Plus chip `#383669` becomes `#1b1c34` (0.49). The backdrop is also blurred: a chip edge that rises in about 1-2 raw px in 183 takes about 5 raw px (10-90%) in 182, giving sigma about 1.5-2 CSS px (estimated; `blur(2px)` class, softer than the 4-6 px guess in the light survey).
- Modal: panel `#212121` (the same value as the canvas, but the scrim makes it the brightest layer), nav column `#1e1e1e` (darker than the pane), 1 px outer edge about `#2a2a2a`, shadow almost invisible (page `#101010` darkens to `#0c0c0c` at the edge, -4). Width 865 raw (680 CSS) and radius at least 19 raw are carried over from the ChatGPT survey, not re-measured.
- Composer: fill `#303030`, faint `#363636` edge, and below it `#1d1d1d`-`#1f1f1f` (-2 to -4 vs `#212121`) fading over about 12 raw px, so a very soft shadow exists.

## 5. Observed light <-> dark relationships (basis for the estimates)

| role | Platform light -> dark | ChatGPT light -> dark |
|---|---|---|
| page / shell | `#f3f3f3` -> `#131313` | `#ffffff` -> `#212121` |
| sidebar | `#f3f3f3` -> `#131313` | `#f8f8f8` -> `#181818` |
| content card | `#ffffff` -> `#212121` | `#ffffff` -> `#212121` |
| raised (menu/card/composer) | `#ffffff` + shadow -> `#303030` | `#ffffff` + `#dedede` + shadow -> `#303030` |
| selected nav | `#e0e0e0` -> `#303030` | `#eaeaea` -> `#242424` |
| selected pill | n/a | `#efefef` -> `#363636` |
| hairline | `#eaeaea`-`#eeeeee` -> `#3a3a3a` | `#e5e5e5` -> `#2c2c2c`; modal header `#e2e2e2` -> `#424242` |
| control outline | `#d5d5d5`-`#dedede` -> `#4d4d4d`-`#5d5d5d` | `#d0d0d0` -> `#404040`-`#424242` |
| primary button | `#181818`/white label -> `#f3f3f3`/black label | `#0d0d0d`/white -> `#ffffff`/black |
| text primary | `#0d0d0d` -> `#ffffff` | `#0d0d0d` -> `#ffffff` |
| text muted | `#7f7f7f` -> `#9e9e9e` | `#6a6a6a`-`#8b8b8b` -> `#a9a9a9`-`#8d8d8d` |
| plan chip | n/a | bg `#f0eefa` -> `#383669`, text `#454085` -> `#f6f6ff` |
| scrim | black 30-35% -> not shown | black 6% + blur -> black 50% + blur |
| blue (tile, toggle ON) | `#0385ff` -> `#0086ff` (unchanged) | `#0285ff` -> not shown |
| green / red text | n/a | `#0c9144`/`#ab2c28` -> `#0a9646`-`#0fa24c`/`#bf2e29`-`#c9393b` (unchanged) |
| toast | `#3eae72` (Platform), `#008635` (ChatGPT) green; black `#000` neutral | not shown |
| segmented track | `#eeeeee` -> `#0d0d0d` | n/a |

Rules that follow: (1) surfaces flip lightness but keep the same number of steps; (2) text becomes pure white and muted greys are lifted; (3) the primary button inverts, taking the light theme's shell colour (`#f3f3f3`) in Platform; (4) saturated signal colours (blue tile, green/red text) stay the same hex; (5) tinted chips become deeper, more saturated fills with near-white text (plan chip).

## 6. Estimated dark tokens (not observable in any dark screen)

All values in this section are **estimated**. They are derived from section 5 and from measured dark hues; contrast ratios were computed (WCAG 2.x).

| token | value | derivation | contrast |
|---|---|---|---|
| color.button.destructive.bg / fg | `#df2e2b` / `#ffffff` | solid red is theme-invariant in the packs (light `#df2e2b`, `#e1302c`, `#e5322d`; diff red unchanged in dark) | fg on bg 4.60 |
| color.status.success.bg / fg / border | `#1e3528` / `#35c387` / `#1a5332` | green `#0f9e4b` at 16% over `#212121`; fg is the measured waveform green | 5.83 |
| color.status.error.bg / fg / border | `#402423` / `#ff6b64` / `#6f2826` | red `#e5322d` at 16%; fg lifted from measured `#c33a37` (which is only 3.17:1 on `#212121`) | 5.04 |
| color.status.warning.bg / fg / border | `#453823` / `#ffae2d` / `#7a5926` | amber at 16%; fg is the measured node-tile orange | 6.16 |
| color.status.info.bg / fg / border | `#1c3145` / `#96d0fc` / `#15497a` | blue `#0285ff` at 16%; fg is the measured unread dot | 8.08 |
| color.status.neutral.bg / fg / border | `#303030` / `#c9c9c9` / `#3a3a3a` | raised fill plus secondary text | 7.97 |
| color.banner.* | same hues as the pills above, 1 px border at 40% mix, no solid fills | Platform light banner is a tint fill (`#fff4f1`) with no border; the dark tint needs a border to read | n/a |
| color.focus.ring (reference-derived) | `#7f9bf5`, 2 px | light ring `#4c68d8` / `#5565ad` lifted to 3:1+ on `#212121` and `#303030`; **Rasikh must swap in its own accent** | 6.06 / 4.97 |
| color.link.default (reference-derived) | `#7f9bf5` underlined | light link `#4267e5`; the dark references themselves use underlined text colour | 6.06 |
| color.scrim (Platform dashboards) | `rgba(0,0,0,0.5)` | ChatGPT dark measured 0.50; Platform light is 0.30-0.35 | n/a |
| color.toast.neutral | bg `#f3f3f3`, text `#0d0d0d` (inverse surface) | light neutral toast is black `#000` with white text; dark inverse follows the primary-button inversion | 18.93 |
| color.toast.success | bg `#018635`, text `#ffffff` (kept) | solid green toast is theme-invariant by analogy to other signal colours | 4.71 |
| elevation.card | `0 4px 12px rgba(0,0,0,0.20)` | edge darkening -2 to -10 at 4-11 raw px | n/a |
| elevation.popover | `0 8px 24px rgba(0,0,0,0.30)` | menu edge -6 fading over 25 raw px | n/a |
| elevation.modal | none or `0 12px 40px rgba(0,0,0,0.35)` over a 50% scrim | ChatGPT modal edge only -4 | n/a |

## 7. Component notes

- **Buttons**: primary = inverted pill/rounded rect (`#f3f3f3` + black label on Platform; white circle or `#f9f9f9` pill on ChatGPT). Secondary = outline (`#404040`-`#555555`) or a filled `#2f2f2f`-`#3d3d3d` chip. Ghost = no fill. No coloured primary exists in dark.
- **Selected state**: filled row only, text unchanged (Platform `#303030`, ChatGPT sidebar `#242424`, ChatGPT pill `#363636`). No left accent bar, no tint.
- **Inputs**: transparent fill (canvas shows through), 1 px outline `#555555` (Platform) or `#424242` (ChatGPT); placeholder is lighter than you expect (`#a1a1a1`-`#c7c7c7`) because the capture ceilings are high.
- **Links**: no blue link exists in any dark screen; links are the surrounding text colour with an underline.
- **Tabs**: active text `#ffffff` with a 1-2 raw px `#d6d6d6` underline (Platform); ChatGPT uses a `#363636` filled pill.
- **Toggle off**: `#696969` track with a white knob (ChatGPT 182). Toggle ON is not shown.
- **Theme control**: Platform puts a 3-icon segmented control (sun / moon / monitor; track `#0d0d0d`, selected `#303030`, icon `#ffffff`, unselected icons `#bebebe`) inside the profile menu. ChatGPT puts a select (System / Dark / Light) in Settings > General, plus 'Accent color: Default' with a grey dot.
- **Image/media**: thumbnails are unaffected by the theme; the Platform image grid draws 1 px `#414141` lines between cells.

## 8. Contrast of the dark ladder (computed)

| pair | ratio |
|---|---|
| `#ffffff` on `#212121` / `#303030` / `#131313` | 16.1 / 13.2 / 18.6 |
| `#c9c9c9` on `#212121` / `#303030` | 9.72 / 7.97 |
| `#9e9e9e` on `#212121` / `#303030` / `#131313` | 6.01 / 4.93 / 6.94 |
| `#7e7d80` (axis) on `#212121` | 3.94 |
| `#6c6c6c` (disabled) on `#212121` | 3.07 |
| `#0f9e4b` on `#212121` / `#303030` | 4.61 / 3.78 (fails on raised) |
| `#c9393b` (measured red) on `#212121` / `#303030` | 3.17 / 2.60 (fails) |
| `#555555` (input border) on `#212121` | 2.16 (below the 3:1 non-text guideline) |
| `#000000` on `#f3f3f3` (primary button) | 18.9 |

## 9. Rules (short)

1. Build dark by elevation steps, not by inverting: shell `#131313` -> content `#212121` -> raised `#303030` -> high `#3d3d3d`.
2. Text on dark is pure `#ffffff`; never use `#e0e0e0`-style off-whites for body text.
3. The primary button is inverted: light fill, black label. Do not colour it.
4. Selected nav/list row is a flat fill one step above its parent; do not change text weight or colour.
5. Hairlines are white-alpha, not grey hexes: 5% (list rows), 10% (cards/dividers), 15% (controls), 24% (pill outlines).
6. Raised surfaces get a 1 px edge about +6 levels over the fill (`#363636` on `#303030`) and, at most, a faint shadow (<= 20% darkening at the edge).
7. Modals sit on `rgba(0,0,0,0.5)` plus a 2 px backdrop blur; the panel keeps the canvas colour.
8. Saturated signal colours keep their hex across themes for icons, meters and large text; small body-size text uses lifted tones.
9. No pale tint pills with dark text in dark mode: use a deep tint fill (about 16% hue) with a lifted same-hue label and a 1 px 40% border.
10. Links are underlined text colour unless Rasikh's accent is applied on purpose.
11. Keep the shell borderless: shell and sidebar share one tint, the content card is inset and has no border.
12. Do not use hover as selected: hover is one half-step (about +9 levels) below selected.

## 10. Recommendations for Rasikh

- **Dashboards (employer, landlord, bank)**: adopt the Platform dark ladder as is (`#131313`, `#212121`, `#303030`, `#3d3d3d`, inset `#0d0d0d`), with the inverted primary `#f3f3f3` / `#000000`.
- **Newcomer app and agent feed**: adopt the ChatGPT ladder (`#181818` sidebar, `#212121` canvas, `#303030` composer and user bubble, `#242424` sidebar selected, `#363636` modal selected, 50% blur scrim). On mobile the sidebar becomes a drawer on `#181818`.
- **Accent**: `DECISIONS.md` bans purple and blue accents and wants one restrained Rasikh accent. The dark references have **no coloured UI accent at all** (active, focus, links and tab underline are white or grey). So limit the accent to the focus ring, links, the current-step marker in the roadmap and the confidence/verification tick; lift its lightness so it is at least 4.5:1 on `#212121` and at least 3:1 on `#303030`. The CSS below carries a placeholder accent until DESIGN.md fixes the hue. Info should map to neutral or the accent, not blue.
- **Deliberate deviations (accessibility)**: (a) error text `#ff6b64` instead of the measured `#c33a37` (3.17:1); (b) success text `#35c387` instead of `#0f9e4b` (3.78:1 on raised); keep `#0f9e4b` for icons and meters; (c) input border `#6c6c6c` where the field boundary must be perceivable (3.07:1 on `#212121`) instead of the reference `#555555` (2.16:1), because document-upload and approval forms are core flows; (d) text.tertiary `#9e9e9e` only at 14 px or larger and never for body copy in Arabic (thin strokes, 4.93:1 on `#303030` is borderline) - use `#c9c9c9` there.
- **Trust passport toggles**: ChatGPT's toggle off state (`#696969` track, white knob) and its channel popover pattern fit; define the ON track with the Rasikh accent (the reference ON colour is not available in dark).
- **Status pills**: use the section 6 deep-tint recipe; do not use saturated fills. The Platform light pills (`#e3f4e7` / `#105e25` etc.) have no dark equivalent in the references.
- **Agent activity feed**: dark rows are flat on `#212121` with `#2c2c2c` separators (ChatGPT) and right-aligned signal text (green `+`, red `-`); no cards per row.
- **RTL**: no value in this audit depends on direction. Use logical properties (`border-s`, `ps-*`) per DECISIONS.md; the `#363636` edge and hairlines are symmetric.
- **Theme switching**: put a 3-state control (light / dark / system) in the account menu, as Platform does; keep the `dark` class on `<html>` (`apps/web/src/lib/theme.ts`) and drive the variables below.

## 11. CSS variables (also returned in the structured result)

Paste into `apps/web/src/app/globals.css` (66 lines). Dashboards use the base block; wrap newcomer-app screens in `data-surface="app"` to switch to the ChatGPT ladder.

```css
/* Rasikh dark theme. Source: docs/reference-audit/measure-color-dark.md. Applied by <html class="dark">. */
:root.dark,
:root[data-theme='dark'] {
  color-scheme: dark;
  /* surfaces, dashboards (Platform ladder) */
  --bg-page: #131313; /* shell: sidebar + top bar */
  --bg-sidebar: #131313;
  --bg-content: #212121; /* inset content card, charts, modal panel */
  --bg-raised: #303030; /* cards, menus, composer */
  --bg-raised-high: #3d3d3d; /* chips */
  --bg-inset: #0d0d0d; /* segmented track, editor canvas */
  --bg-selected: #303030;
  --bg-hover: #1e1e1e; /* estimated */
  /* borders are white alpha */
  --border-subtle: #363636; /* about white 10% */
  --border-default: #3a3a3a;
  --border-input: #555555; /* reference value, 2.16:1 */
  --border-input-a11y: #6c6c6c; /* use on forms, 3.07:1 */
  --border-strong: #5d5d5d;
  /* text */
  --text-primary: #ffffff;
  --text-secondary: #c9c9c9;
  --text-tertiary: #9e9e9e; /* 14px+ only, never Arabic body copy */
  --text-placeholder: #a1a1a1;
  --text-disabled: #6c6c6c;
  --text-inverse: #000000;
  /* buttons: primary is inverted */
  --btn-primary-bg: #f3f3f3;
  --btn-primary-fg: #000000;
  --btn-secondary-bg: #3d3d3d;
  --btn-secondary-border: #555555;
  --btn-destructive-bg: #df2e2b; /* estimated */
  --btn-destructive-fg: #ffffff;
  /* status: deep tint + lifted label (all estimated) */
  --success-bg: #1e3528; --success-fg: #35c387; --success-border: #1a5332;
  --warning-bg: #453823; --warning-fg: #ffae2d; --warning-border: #7a5926;
  --error-bg: #402423; --error-fg: #ff6b64; --error-border: #6f2826;
  --info-bg: #1c3145; --info-fg: #96d0fc; --info-border: #15497a;
  /* PLACEHOLDER accent: swap for the DESIGN.md accent, lifted to 4.5:1 on #212121 (no blue/purple) */
  --accent: #4fc3b0;
  --focus-ring: var(--accent); /* 2px */
  --link: var(--accent);
  /* overlay and elevation */
  --scrim: rgba(0, 0, 0, 0.5);
  --scrim-blur: 2px;
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.2); /* estimated */
  --shadow-popover: 0 8px 24px rgba(0, 0, 0, 0.3); /* estimated */
}
/* newcomer app + agent feed (ChatGPT ladder) */
:root.dark [data-surface='app'],
:root[data-theme='dark'] [data-surface='app'] {
  --bg-page: #212121;
  --bg-sidebar: #181818;
  --bg-selected: #242424; /* sidebar row */
  --bg-selected-pill: #363636; /* modal nav, tabs */
  --bg-hover: #212121; /* estimated */
  --bg-raised-high: #414141;
  --border-subtle: #2c2c2c; /* about white 5%, list rows */
  --border-default: #424242; /* about white 15%, controls */
  --border-input: #424242;
  --border-strong: #4b4b4b;
  --btn-primary-bg: #ffffff;
  --btn-secondary-bg: #2f2f2f;
  --btn-secondary-border: #404040;
  --text-placeholder: #c7c7c7; /* composer; search fields use #ababab */
}
```

## 12. Evidence, crop notes, open questions

- Crops: Platform `y < 1205`, ChatGPT `y < 1200`. All flat-region samples were taken at least 6 px away from edges and text.
- Gaps (nothing in the references to measure): hover state, focus ring, toggle ON, destructive/error/success/warning/info pills and banners, toast, table header and row hover, tooltip, tag/badge, code block in dark theme, skeleton shimmer, selection highlight.
- Platform scale (1.27 vs 1.333) remains unverified, so Platform CSS lengths are estimated.
- Platform 321's composer is cool-tinted (`#33343c`); it appears only once and is treated as an outlier.
- Only 5 Platform and 6 ChatGPT dark screens exist; several border and button values rest on 1-3 screens (the `n` column shows this).
- Questions for the lead: (1) should Rasikh's accent follow the "no colour in chrome" behaviour of the references or be allowed on selected states? (2) should info map to neutral? (3) is a dark toast inverse (light) or raised (`#303030`) in the Rasikh style?
