# Measure: page layout patterns and spacing (key: page-layout)

Packs: "OpenAI Platform web Apr 2026" (platform) and "ChatGPT web Mar 2026" (chatgpt).
Audience: Rasikh front-end. Platform values drive the employer / landlord / bank desktop dashboards. ChatGPT values drive the mobile-first newcomer app and agent feed.

All numbers below were read from pixels. `img px` = screenshot pixels after cropping the Mobbin footer. `css` = img px / 1.27. Anything not read from a pixel run is marked **est.**

---

## 1. Pixel scale and crop

**Crop.** Bottom 120 px of every image is the Mobbin footer (#2f2f2f). Platform viewport measured = 1920 x 1205; ChatGPT = 1920 x 1200. Nothing under `.reference` was touched. Scratch scripts live in the session scratchpad only.

**Scale used: 1.27 img px per CSS px** (1920 / 1512; the capture is a ~1512 CSS px wide viewport, not a 1x capture of 1920). I verified it myself, independently of the surveys, on round-number layout widths that cannot all be coincidence:

| Element (screen) | img px | / 1.27 | Round CSS value | At 1.25 | At 1.333 |
|---|---|---|---|---|---|
| Platform centered section container (391, 331, 373, 374) | 1143 | 900.0 | 900 | 914 | 857 |
| Platform centered container (324) | 1016 | 800.0 | 800 | 813 | 762 |
| Platform centered container (397, 326) | 762 | 600.0 | 600 | 610 | 572 |
| Platform wizard container (237-244) | 853 | 671.7 | 672 (max-w-2xl) | 682 | 640 |
| Platform "Your Apps" container (236) | 975 | 767.7 | 768 | 780 | 731 |
| Platform usage right rail (212-219) | 407 | 320.5 | 320 | 326 | 305 |
| Platform assistants list pane (196, 199-201, 206) | 407 | 320.5 | 320 | 326 | 305 |
| Platform primary button height (225, 329, 358, 195...) | 40 | 31.5 | 32 | 32 | 30 |
| Platform kv row pitch (300, 263) | 40.7 | 32.0 | 32 | 32.6 | 30.5 |
| ChatGPT sidebar (22, 24, 45, 57, 238) | 330 | 259.8 | 260 | 264 | 247 |
| ChatGPT thread column / composer (22, 24, 154, 238) | 975-976 | 768 | 768 (48rem) | 780 | 731 |
| ChatGPT settings modal (173-178, 203) | 862 x 761 | 679 x 599 | 680 x 600 | 690 x 609 | 647 x 571 |
| ChatGPT settings row pitch (173, 177) | 76.0 | 59.8 | 60 | 60.8 | 57 |
| ChatGPT header (45, 57) | 66 | 52.0 | 52 | 52.8 | 49.5 |

1.27 lands on a round CSS number for every row; 1.25 and 1.333 miss most of them. Residual error on any single edge is about +/-1 img px (hairlines render blurred over 2 rows), i.e. about +/-1 CSS px. "At 1920" in the brief therefore means 1920 screenshot px = 1512 CSS px. What happens on a true 1920 CSS px viewport is **derived**, not captured (section 8).

---

## 2. Screens used

Whole-pack scans (all 417 Platform and 245 ChatGPT indices, scripted) were used to count how often a pattern occurs; individual screens were then opened and measured edge to edge.

Platform: 29, 194, 195, 196, 199, 200, 201, 206, 210-215, 218, 219, 224, 225, 236, 237-246, 248-250, 253, 255, 256, 260-266, 269, 299, 300, 305-307, 324-326, 329-331, 334, 336, 343, 344, 358, 369, 370, 372-374, 384, 385, 387, 391, 394, 397, 398 (layout); 318, 319, 322 (dark geometry check).
ChatGPT: 22, 24, 45-48, 57, 98, 113, 120, 121, 128, 140, 145, 154, 173-178, 184, 186, 194, 203, 238 (layout); 182, 184, 186 (dark check).

Whole-pack scan results (Platform, 177 screens that show the page-card shell and a header divider):

| Header divider row (img y) | Meaning | Screens |
|---|---|---|
| 140 or 141 | title-only header, 56 css | 108 (46 at y141, 62 at y140) |
| 139 | same, playground family (55 css) | 14 |
| 178 | header + underline tab strip, 85 css | 26 (326, 328, 330, 334, 335, 340, 343, 344, 348-350, 353, 358, 361, 362, 366, 370-372, 384, 385, 387, 388, 397, 398, 403) |
| 192 | header + toolbar row or segmented tabs, 96 css | 15 (260-266, 269, 299, 300, 305-307, 329, 369) |
| 145 | header with back arrow, 59 css | 5 (196, 199-201, 206) |

Centered containers (Platform): 900 css on 9 screens (330-332, 370, 384, 385, 387, 391, 394); 672 css on 9 (237-245 wizard); 600 css on 5 (326, 336, 343, 344, 397); 700 css on 2 (334, 398); 768 css on 2 (236, 246); 800 css on 2 (324, 325). Left-aligned pages (133 screens): leftmost body ink starts 20 css from the card edge on 47 of them, 23-24 css on 36, 16-17 css on 21, within 3 css (flush grids and editors) on 20.

Pane dividers (Platform): x 975-976 (550 css list pane) on 15 screens (194, 195, 260-266, 269, 299, 300, 305-307); x 684-685 (320 css) on 5 (196, 199-201, 206); x 1089-1090 (50 / 50) on 41 playground screens (23-38, 41-49, 53, 57, 58, 61, 62, 64, 74, 76-78, 80-86); right rail x 1501-1502 (320 css) on 7 usage screens (210-215, 218, 219); detail-pane footer rule at y 1121-1122 on 8 (260, 263-265, 300, 305-307).

ChatGPT: the 768 css column (x 636..1612 img) appears on 55 of the 67 screens with a visible sidebar; the 640 css column on the 4 side-panel screens (45-48); a ~807 css directory container on 120, 121, 194.

---

## 3. OpenAI Platform: dashboard page layout (light unless stated)

### 3.1 Shell (the page is ONE card on a grey frame)

| Fact | img px | css | Evidence |
|---|---|---|---|
| Frame bg | #f3f3f3 | | 12 screens |
| Top bar height (frame bg, no border) | card outer-top border at y 68-69 | 54 (53.5) | 12 screens |
| Card outer left edge | x 277 | 218 (sidebar is 12 css inset nav, nominal 220) | 12 screens |
| Card right inset to viewport | 10 (card outer right x 1909) | 8 | 12 screens |
| Card bottom inset to viewport | 10 (card outer bottom y 1194) | 8 | 12 screens |
| Card bg | #ffffff | | 12 screens |
| Card border | 1 px #eeeeee left/top, #ececec right/bottom | 1 | 12 screens |
| Card radius | inner fit 8.5 img px + 1.3 border | 8 (est.) | corner fit on 225, 374, 391 (identical) |
| Card shadow | none: rows outside the border return to #f3f3f3 within 1 px | none | 225 bottom edge: 1193 #f8f8f8, 1194 #ececec, 1195 #f2f2f2, 1196+ #f3f3f3 |

The card is flush to the sidebar (no gutter on the left), flush to the top bar, 8 css from the right and bottom. The sidebar itself has no fill and no border (same #f3f3f3 as the frame). The page card scrolls internally; header (and footer where present) stay put (screen 241: a textarea is clipped under the header while the page is scrolled).

Dark (322, 318): frame #131313, card #212121 (header band #1e1e1e, divider #3b3b3b), border #1b1b1b/#1c1c1c; geometry identical to light (card edges at x 277 / 1908, y 70 / 1193).

### 3.2 Page header (title row, actions, divider)

| Variant | Content height | Divider row (img y) | Screens |
|---|---|---|---|
| Title only | 56 css (71 img px) + 1 px | 141 | 108 |
| Title + underline tabs | 85 css (108 img px) + 1 px | 178 | 26 |
| Title + toolbar row (chips / search / buttons) or segmented tabs | 96 css (122 img px) + 1 px | 192 | 15 |
| Back arrow + title + buttons (config panes) | 59 css (75 img px) + 1 px | 145 | 5 |

- Divider: 1 px #f2f2f2 (242) on 11 sampled screens (#e8e8e8 on the usage page 212, #efefef on playground 29).
- Horizontal padding 24 css: title glyph x0 = 310 (card inner left 279 + 31 img = 24.4 css); primary action right edge x = 1877 (1908 - 1877 = 31 img = 24.4 css) on 225, 329, 300, 236, 241.
- Title: cap height of flat glyphs L = 16 img px (12.6 css) -> about 18 px (est., cap ratio 0.70). In the Platform screens examined there is no description line under the title; intro text is the first paragraph of the body (225: three 14 / 20 paragraphs starting 24 css below the divider).
- Title vertical centre = 34.5 img px below card top (27 css) on 225, 391, 374, 397, 324 (centre y 104.5).
- Right-aligned actions: height 40-41 img px = 32 css (primary, #181818 fill), gap between adjacent buttons 10 img px = 8 css (329: Export 1641-1754, Create 1765-1877; 300 same). Secondary button fill #ececec, primary #181818.
- Header with a status or breadcrumb (241): breadcrumb "Apps > Smart Travel Planner" at the title position; right cluster = muted status text + primary button (gap 26 img = 20 css).
- Alert banner (194, 195): sits inside the card ABOVE the header: x 308..1867, y 86..159 = 1228 x 58 css, fill #fff4f1, 12 css top inset (15 img px), 24 css left inset, 32 css right inset. The header and divider are pushed below it (divider y 237-238).

### 3.3 Header with underline tabs

Measured on 374, 397, 358, 326, 334, 373 (6 screens; all divider y 178).

| Fact | img px | css | Note |
|---|---|---|---|
| Title row | ~67 | ~53-54 | est.: 85 total minus tab strip |
| Tab strip | ~41 | ~32 | est.: tab label centre is 20.5 img px above the divider |
| Label to label gap | 24-25 (23 on one) | 19 (18.1-19.7) | 374: 25,25,24,23; 397: 24,21,25; 358: 24,24,23 |
| First label x0 | 313 | 27.6 from card edge (title is 25.2) | all six |
| Indicator | 1.15 img px ink, #181818 | 1 | row 178 dark #1e1e1e, row 177 25% dark; overlaps the header divider; spans the label text width only (374: underline x 833..929, label 835..930) |
| Inactive label colour | darkest glyph #3f3f3f | | |
| Active label | #000000, heavier weight (est. 500) | | |

Content-level tab strips (usage 212, two strips): 72 img px between hairlines (637-638 to 709-710) = 56 css + 1 px; label x0 = 301 (18 css from pane edge); underline row 710, same 1 px #1d1d1d. Content starts 16 css below the strip (cards top at y 731 vs strip bottom 710).

Segmented tabs (Logs 249/250/253; Fine-tuning 300; Storage 263): container bg #eeeeee, height 37 img px (29 css, est. 28), selected pill white 34 img px (27 css), sits on the title row to the right of the title (Logs) or in the toolbar row (300, 263). Used when the tabs switch the list in a pane, underline tabs when they switch the whole page.

### 3.4 Content container: width, alignment, padding

| Page type | Container | Alignment | Evidence |
|---|---|---|---|
| Settings / forms | 600 css, inputs 340 / 400 css or full width | centered on card centre x 1093 (+/-1) | 397 (712..1474), 326, 336, 343, 344 |
| Wizard / create flow | 672 css (max-w-2xl), inputs full width | centered | 237-245, 9 screens |
| Settings with radio groups | 700 css | centered | 334, 398 (x 649..1537), 2 screens, est. |
| Card list ("Your Apps") | 768 css | centered | 236, 246, est. |
| Org settings with bordered cards | 800 css | centered | 324 (585..1600), 325, est. |
| Section pages (budget card + tables, billing tabs, limits) | 900 css | centered | 331, 370, 373, 374, 384, 385, 387, 391, 394 (522..1664), 9 screens |
| Tables, lists, API keys, projects, logs | full card width | left, flush at 20 css (tables) or 24 css (text, toolbars) | 133 left-aligned screens; 225, 249, 329, 358 measured |
| Master-detail panes | pane width | left, 16 css pane padding | 300, 263, 195 |
| Empty state | block centered horizontally in card (x 1093) and in the upper third vertically | | 224: icon tile top 391, button bottom 548, card content 142..1193 |

Top padding: first line box of a centered page sits 44 css below the header divider (397: divider y 178, info box top border y 235 = 56 img px = 44.1 css; 326, 374, 324, 336 derive the same from label ink, est.). Full-bleed pages start 24 css below the divider (358: divider 178 -> search input top 209 = 31 img = 24.4 css; 225 first paragraph derived, est.). Side padding of the centered pages is whatever is left of the max-width (no minimum observed; window never narrower than 1512 css).

### 3.5 Vertical rhythm (css px)

Exact (box edge to box edge, or pitch of identical elements):

| Gap | css | Where |
|---|---|---|
| Header divider to first box, centered page | 44 | 397 |
| Header divider to toolbar control, full-bleed page | 24 | 358 |
| Toolbar control bottom to list card top | 16 | 358 (250 -> 270 img) |
| Tab strip to first card | 16 | 212 |
| Stacked inputs (input 32 + gap) | 8 | 374: 5 inputs, pitch 51 img px = 40.2 css |
| Side-by-side inputs gap | 8 | 374 city/postal 9 img px |
| Input to Save button | 12 / 16 / 24 | 324 / 374 / 326 (varies, 16 typical) |
| Last field to wizard CTA | 32 | 241 (checkbox bottom 1080 -> button top 1123) |
| CTA bottom to card bottom | 24 | 241 (1163 -> 1193) |
| Card to card (grid) | 16 | 212 (1048 -> 1069 img = 16.5) |
| Radio rows pitch | 30 | 397 (3 groups), 334 (3 groups): 38.2 img px |
| Radio group pitch (3 options) | 160 | 397: 355 -> 558 -> 762 img px |
| Key/value row pitch | 32 | 300 (479, 520, 561, 602, 642, 682, 723 img), 263 |
| Field pitch, 1-line description | 96 | 374 and 326: 122 img px |
| Field pitch, 2-line description | 112 | 374, 326: 143 img px |
| Field pitch, no description | 84 | 336: 106.5 img px |
| Field pitch, compact (28 css input) | 72 | wizard 241: 91.4 img px |
| Section to next section heading (ink) | 53.5 | 324: input/card bottom to next heading cap top = 68 img px; subtracting line-box offset gives about 46-48 css (est. 48) |
| Card bottom to next heading (ink) | 36 | 391 (card bottom 675 -> heading cap top 720 img px); about 30 css box to box (est.) |

Body text: 14 px / 20 px (line pitch 25.5 img = 20 css). Paragraph spacing 16 css in 225, 8 css inside the Limits copy block (391). Heading text about 18 px (cap 16-17 img px). Description under a label about 13 px / 16 px (2-line description pitch 20.5 img = 16 css).

### 3.6 Forms (no label/control columns except key-value and parameter rows)

- Label sits ABOVE the control; description (muted, 13 px) between label and control. This holds on 374, 326, 336, 324, 241, 334, 397.
- Input heights: 40-41 img px = 32 css (md) on 374, 326, 336, 324, 195, 194, 199; 36 img px = 28 css (sm) in the wizard (measured on 241, same layout 237-245) and in-card buttons (324 "Start" 37 img px).
- Input widths inside the 600 container: 340 css (326: 432 img px), 400 css (336: 507 img px), full width in wizard / config panes; address group in 374: 400 css country/address, city + postal 195 css each, tax select 159 css.
- Two real label/control columns exist only in dense editors: key-value detail (label column from x 1010 to value x 1228 = 218 img px = 172 css incl. 16 css icon; hyperparameter rows 184 img px = 145 css without icon, 300) and the prompt editor parameter rows (label x 304, control x 413: 86 css, 29).
- Section sub-headings inside config panes (195, 194, 199: TOOLS, MODEL CONFIGURATION, API VERSION): uppercase 12 px muted label + 1 px #f0f0f0 rule beneath, 60 img px (47 css) per toggle row.
- Primary action (Save / Continue) is left aligned under the form (326, 336, 334, 374) except in wizards where it is right aligned to the container's right edge (241).

### 3.7 Cards and bordered sections

| Fact | Value | Evidence |
|---|---|---|
| Border | 1 px #ececec (236) | 391: left x 522, top y 239; 324 verification card 585..1600 |
| Radius | 8 css (est.; straight edge starts 9-10 img px from the corner) | 391 corner |
| Fill | none (white on white); no tint, no shadow | 391, 324, 212, 236, 397 |
| Internal row rule | 1 px #f0f0f0 | 391 rules at y 424, 507, 578; 324 at 784 |
| Row padding | 16 css (324: 21 img px; 212 rail: 21) / 20 css (391 budget card: 26 img px) | 4 screens |
| Row height | 77 css two-line title/description row with right-aligned small button (324, 98 img px); 70 css avatar + two lines (358, 88.5 img px); 56 css single-line alert row (391 row 2, 71 img px; row 1 is 65 css because it carries the card's top padding) | |
| Info / note box | white, 1 px #eeeeee, 8 css radius, 52 css tall (397: y 235..300), text 14 px | 397, 391 |
| Alert banner | #fff4f1 tint, only for deprecations/errors | 194, 195 |
| Grid of cards | 2 columns of 458 css (582 img px) with 16 css gutter inside a 963 css main column; card height 250 css (317 img px) | 212 (and 213-215, 218, 219) |
| Card header | title 14 px medium + inline chevron, 16 css padding, no divider | 212 |

How the pack avoids heavy cards/shadows: (1) one page card; (2) sections are separated by whitespace (44-48 css) and 1 px rules (#f2f2f2 header, #f0f0f0 rows), not by nested cards; (3) a bordered card is used only to group rows (alerts, verifications, budget) or small metrics (usage cards), always unfilled; (4) tinted fills appear only on alerts (#fff4f1) and status chips; (5) shadow exists only on overlays: popover bottom edge darkens to #d5d5d5 and fades to #fafafa over ~36 img px (28 css), top edge almost none, left/right faint (29 popover) = about `0 8px 24px / 12-15% black` (est.).

### 3.8 Master-detail, overview + rail, and footers

| Pattern | Measured | Screens |
|---|---|---|
| Wide list pane | divider at x 975-976 (#f7f7f7) -> list pane 550 css (698 img px), detail pane 932 img px | 194, 195, 260-266, 269, 299, 300, 305-307 (15 screens) |
| Narrow config pane | divider at x 684-685 -> 320 css (407 img px) | 196, 199, 200, 201, 206 |
| Even split | divider x 1089-1090 -> 50 / 50 of the 1630 img px card | 41 playground screens, e.g. 29, 33 |
| List pane padding | 16 css (300: row x 298, top 214 vs divider 192) | 300, 263 |
| Selected list row | 517 css wide (pane - 32), 50 css tall (two lines), fill #eeeeee, radius 8 | 300, 195 |
| Detail pane padding | 24 css (300: x 1010 vs divider 976 = 34 img incl. glyph bearing); form-like detail panes center a 600 css column (195: x 1059..1826 in a 932 img px pane) | 300, 195 |
| Detail kv rows | 32 css pitch, label column 172 css (icon) / 145 css (no icon) | 300, 263 |
| Sticky footer action bar (detail pane only) | 56 css + 1 px top rule (#ececec, y 1121-1122; card bottom y 1193); actions left aligned at pane padding (x 1007), 32 css buttons, gap 8 | 260, 263-265, 300, 305-307 (8 screens) |
| Overview main + right rail | rail starts x 1501-1502 -> 320 css (407 img px); main 963 css; rail blocks 128-134 css separated by 1 px #efefef; rail padding 16 css | 210-215, 218, 219 (7 screens) |
| Empty state inside a pane | centered in the pane (pane centre x 626.5): icon tile, title, text, primary button | 263 |

### 3.9 Lists with a toolbar (search + filters + primary action)

| Pattern | Layout (css) | Screen |
|---|---|---|
| Header with filter row | 96 total: title row 54, toolbar row 32 (chips 28, search 28 / 239 wide), 12 css below toolbar; right cluster Export (32, #ececec) + Create (32, #181818), gap 8; chip gap 8-9; chips are pills with 1 px #e2e2e2 border | 329, 300 |
| Tabs, then toolbar below divider | tabs 85 header; toolbar starts 24 below divider; search input 32 tall x 250 wide, right-aligned primary 32; list card starts 16 below | 358 |
| Title + segmented tabs on same row | title row holds the tabs (37 img px container) and right-aligned `Quick eval` (28 css, black) + search (28 css); filter chips on second row (28 css); results count after the chips; table band follows at 190 img px | 249, 250, 253 |
| Master list with search at top of the pane | search input 32 css tall at pane padding 16 css | 263 |

### 3.10 Tables

| Fact | Value | Screens |
|---|---|---|
| Header | Only the Logs family has a filled band: #f9f9f9, 30 css (38 img px: y 190..227), full-bleed; every other table has an unfilled header row of small uppercase labels (11-12 px, tracked) | band: 249, 250, 253, 255, 256 (scan found no other); text-only: 225, 329, 331, 373, 236 |
| Header row height (unfilled) | about 32-34 css (est.: header label centre sits 42-54 img px above first row centre) | 331, 373, 329 |
| Data row, one line | 45 css (57.1 img px), rule 1 px #f2f2f2 full-bleed | 249, 250, 253, 255, 256 |
| Data row, compact | 41 css (52 img px), rule #f2f2f2 | 331 |
| Data row, rich (pill + mono id + icon buttons) | 59 css (75 img px), rule #eaeaea inset to the page padding | 329 |
| Cell inset | 20 css (Logs: text x 304 vs 279) / 24 css (329, 225 align to page padding) | 249, 329, 225 |
| Actions column | icon buttons right aligned; glyphs end about 31-34 css from the card edge (inside the 24 css page padding plus the icon hit area, est.) | 225, 329 |
| After the list | "Load more" secondary button, centered, 16 css below last rule | 329 |
| Equal columns in short tables | 4 equal columns of 225 css inside the 900 container | 373 |

---

## 4. ChatGPT: app and settings layout

### 4.1 Shell

| Fact | img px | css | Evidence |
|---|---|---|---|
| Sidebar | 329 + 1 px border (#e9e9e9) | 260 | 22, 24, 45, 57, 238 |
| Sidebar bg | #f8f8f8 (#f9f9f9 on 45, 57) | | |
| Canvas bg | #ffffff | | |
| Header height | 66 | 52 | 45, 57, 22, 24 |
| Header hairline | 1 px #f3f3f3 (45) / #f5f5f5 (57) when scrolled; absent at scroll top | 1 | present 45, 57; absent 22, 24, 238 |
| Header content | title text x 354 (19 css from pane edge), right icon ends 25 img px from viewport edge (20 css) | | 24 |
| Sidebar row | highlight box x 8..321 (247 css), 45 img px tall (35.4 css), pitch 45.6 (36 css), inset 6 css | | 24, 154 |
| Shadows | none on shell | | |

Dark (184, 186): sidebar #181818, border #232323, canvas #212121; settings-dark (182) uses #0c0c0c / #101010.

### 4.2 Conversation column (the newcomer-app model)

| Fact | img px | css | Evidence |
|---|---|---|---|
| Column | x 637..1612 (975-976 wide) | 768, centered in the pane (centre x 1125 = 330 + 795) | 22, 24, 154, 238 + 51 more screens |
| Column with right panel open | x 465..1277 (813 wide) | 640, recentered in remaining pane | 45-48 |
| Right panel | border x 1412-1413 (#f2f2f2) | 399 (400 nominal) | 45-48 |
| Composer | height 73-74 | 58 (57.5), full radius, 1 px border (#dddddd top edge, #ebebeb at pill ends), faint 5 img px shadow below | 22, 24, 154, 238 |
| Composer position in chat | bottom 40 img px above viewport bottom; disclaimer ink centre 20 img px above bottom | 31 / 16 css | 24 |
| Hero (empty chat) | heading cap top 410, composer top 503: ink gap 62 img px = 49 css; block centre at y 493 of 1200 (41%) | | 22 (238, 113 same) |
| User bubble | 46 img px tall (36 css, single line), 21 img px side padding (16 css), fill #f2f2f2, right edge = column edge x 1612 | 36 | 24, 45 |
| Assistant text | no bubble, no avatar, full column width | | 24, 45 |
| Body prose line pitch | 35.6 img px | 28 css (16 px / 28 px) | 24 |
| List bullets in prose | line pitch 35.5 | 28 | 24 |
| Horizontal rule in prose | 1 px #d2d2d2, spans the column | | 24 |
| Image grid in prose | 3 tiles 320 img px each, gap 6-7 | 252 css tiles, 5 css gap | 24 |

### 4.3 List / project / directory pages inside the column

| Pattern | Measured | Screen |
|---|---|---|
| Project page | title cap top 77 img px below header (61 css); title about 28 px; composer 34 css below the title ink (incl. descender); tabs 35 css below composer; first list row 36 css below tabs | 154 |
| Pill tabs | active #f3f3f3 pill, 32 css tall (334..374 img), 87 css wide, label inset 16 css | 154 |
| List rows | pitch 82.5 img px = 65 css, 1 px #f3f3f3 rule across the full 768 column, row content inset ~12 css, leading 38 css file icon | 154 (4 rows) |
| Codex / underline tabs | strip with 1 px hairline #f7f7f7 across the 768 column; underline 1 px #050505 spanning label + 9 css padding each side (560..693 for label 571..682); neighbouring tab boxes 16 css apart (label gap 43 img px = 34 css) | 145 |
| Task-group list | section label 12 px uppercase muted, rows with title + muted subtitle, 1 px rule #f5f5f5 | 145 |
| Directory (Apps) | container 1025 img px = 807 css (x 617..1642) with title + BETA chip + muted subtitle left, search 256 x 38 css right; pill tabs 40 css tall (231..282 img); 2-column list, row pitch 91.5 img = 72 css, 36 css round icon, chevron right | 120 (121, 194 same container) |

### 4.4 Settings (a modal, with a secondary left nav)

| Fact | img px | css | Evidence |
|---|---|---|---|
| Modal | 862 x 761 (x 529..1390, y 195..955) | 680 x 600 | 173-178, 203 (7 screens) |
| Left nav | x 530..755 = 226, bg #f9f9f9 | 180 | 7 screens |
| Nav items | 46 img px pitch (36 css, touching), active fill #f2f2f2, inset 5 css each side (536..748 inside 530..755), icon + label | 36 | 173, 177, 203 |
| Content header | divider (#e2e2e2) at y 270 -> 75-76 img px from top | 60 | 7 screens |
| Content padding | x 777 (21 img px from nav edge), right 1371 (20 img px from modal edge) | 16 | 7 screens |
| Setting row | pitch 76.0 img px = 60 css; with 2-line description 98 img px = 77 css | 60 / 77 | 173, 174, 177 |
| Row divider | 1 px #f3f3f3 to #f8f8f8 | | |
| Row layout | label left (14-15 px, est.) with muted 13 px description below; control right aligned flush to the 16 css padding (select + chevron, button pill, toggle) | | 173, 177, 178, 203 |
| Form fields in settings | stacked label above input, input 48 img px = 38 css, pitch 119 img px = 94 css | | 203 |

No page-level secondary nav exists on Platform: settings pages swap the PRIMARY sidebar content (groups "Settings", "Organization", "Project", same 36 css rows) and the page keeps a top underline-tab strip for sub-sections.

### 4.5 Elevation

ChatGPT also avoids cards: content sits on the white canvas; separators are 1 px rules (#f3f3f3-#f8f8f8); the only elevations are the composer (1 px border + ~4 css soft shadow) and modals/popovers (overlay dim to #f0f0f0 behind a 1 px edge + soft shadow).

---

## 5. Where the packs differ, and which to use

| Topic | Platform | ChatGPT | Use for Rasikh |
|---|---|---|---|
| Frame | grey frame + one bordered white card | flat white canvas + tinted sidebar | Platform for desktop dashboards; flat canvas for the mobile newcomer app |
| Header | 56 css, 24 css padding, title 18 px, divider #f2f2f2 | 52 css, no divider until scroll | Platform 56 (dashboards); ChatGPT 52 (app) |
| Content width | 600-900 centered (forms/sections), full-bleed (tables, lists) | one 768 column (640 with a 400 css side panel) | Platform widths on dashboards; 640-768 column on app (full width minus gutters on phone) |
| Tabs | 1 px underline, 32 css strip; segmented #eeeeee container for list switching | 32-40 css pills (#f3f3f3) or 1 px underline | Underline for dashboard pages; pills for newcomer filters |
| Settings | stacked label above input; kv grid only in detail | label left / control right rows, 60 css, dividers | Platform for dashboard forms; ChatGPT rows for trust passport toggles |
| Rows | 41 / 45 / 59 / 70 css | 60 (settings), 65 (lists), 72 (directory grid) | Platform for tables; ChatGPT for newcomer lists |
| Controls | 32 css buttons and inputs (28 css compact) | 36 css round buttons, 58 css composer | Platform dashboards; app controls enlarged to 44 touch targets (deviation) |
| Secondary nav | in the primary sidebar | modal nav 180 css | sidebar on dashboards; stacked / segmented on phone |

---

## 6. Spacing scale actually used (css px)

| px | Observed as | Where |
|---|---|---|
| 4 | est. only: label-to-description, underline offset | not directly measurable |
| 8 | card inset right/bottom; button gap; stacked-control gap; chip gap; side-by-side input gap | 12, 329, 358, 374 |
| 12 | sidebar nav inset; banner top inset; toolbar bottom pad; Save gap in 324; ChatGPT list row inset | 225, 195, 324, 154 |
| 16 | pane padding; card row padding; card gutter; tab-strip-to-content; toolbar-to-list; modal content padding; field gap (est.) | 300, 212, 324, 358, 173-178 |
| 20 | budget card padding; table cell inset (Logs and 47 left-aligned pages) | 391, 249, scan |
| 24 | page padding-x (header and body); in-body toolbar top gap; wizard bottom pad | 108 headers, 26 bodies, 358, 241 |
| 32 | control height; kv row pitch; field to wizard CTA | 20+ screens, 300, 263, 241 |
| 36 | nav row pitch; ChatGPT user bubble height, sidebar item | 225, 24 |
| 44 | header divider to first box on centered pages | 397 (exact), 4 derived |
| 48 | section to section on settings pages | 324 (est.) |
| 52 / 54 / 56 | ChatGPT header / Platform top bar and title row / Platform header, footer, content tab strip | |
| 60 / 65 / 72 | ChatGPT settings row / list row / directory row | 173-178, 154, 120 |

Platform and ChatGPT both sit on a 4 px grid with the extra steps 20, 44, 56, 60, 65. Not observed as layout spacing: 6, 10, 14, 40.

---

## 7. Rasikh page template (px, derived)

Design basis 1512 css px wide (Platform capture); everything below that is a container max-width or fixed height, so the page scales to wider screens by growing side margins.

### 7.1 Desktop dashboards (employer, landlord, bank) - Platform-derived

**Frame and card**
- Frame: bg #f3f3f3. Top bar 54 (workspace switcher left, links and avatar right, no border). Sidebar 220 wide, nav rows 32 on a 36 pitch, 12 inset.
- Page card: left 0, right 8, bottom 8, top 0; 1 px #ececec border, radius 8, bg #fff, no shadow, internal scroll.

**Header (sticky)**
- Title-only: 56 + 1 px #f2f2f2. Padding-inline 24. Title 18 / 24, weight 600. Actions right: 32 tall, gap 8, ends 24 from edge.
- With tabs: 54 title row + 31 tab strip = 85 + 1 px. Tabs: labels 14 px, gap 19, first label 27 from edge, active = #000 label with 1 px underline under the label width.
- With toolbar: 54 + 32 toolbar row + 10 = 96 + 1 px. Chips 28 (pill, 1 px border), search 28 or 32 (240 wide), gap 8, primary on the right.

**Toolbar (when it lives below the header, e.g. after tabs)**
- 24 below the divider, controls 32 (search 250-320 wide), chips 28, gap 8, 16 above the list.

**Table / list section (employer hires, landlord applications, bank pending list)**
- Full-bleed in the card, cell inset 20 (24 where it must align with the header title).
- Header: 32-34, 11-12 px uppercase muted labels, no fill (or #f9f9f9 band, 30, if sortable controls need a visible row).
- Rows: 45 single line; 59 when a pill or id chip is present; 70 for avatar + two lines (hire name + employer + blocker). Rule 1 px #f2f2f2.
- Actions column right aligned, 24 from edge. "Load more" 16 below last row.

**Detail (hire detail, application detail)**
- Master-detail: list pane 550 (320 if the list is secondary), pane padding 16, list row 50 tall (two lines), divider #f7f7f7. Detail pane padding 24; kv rows 32 pitch with a 172 label column; forms inside a centered 600 column.
- Section page (timeline, verified fields, risk summary): centered 900 (768 if text only); top padding 44; section gap 48; heading 18 / 28; card 1 px #ececec radius 8 padding 16-20, rows 1 px #f0f0f0.
- Decision actions: sticky footer 56 + 1 px #ececec top rule, left aligned at pane padding, 32 tall buttons, gap 8 (approve primary, request info and offer terms secondary).

**Overview with metrics (employer home)**
- Main column + 320 rail (pattern of 212): rail blocks 128-134 tall, 1 px #efefef rules, padding 16. Metrics row is NOT in the reference; derive it from the rail block: one bordered card (radius 8), N equal cells with 1 px #f0f0f0 dividers, cell padding 16-20, label 13 / 16 muted, value 24 / 32, height about 88-96 (est.).

**Page end:** no global footer. Only sticky action footers (56) on master-detail and wizard CTAs (right aligned to container edge, 32 below last field, 24 above card bottom).

### 7.2 Newcomer app (mobile-first) - ChatGPT-derived

The ChatGPT captures are desktop only, so phone values below are **est.** adaptations of measured desktop values.
- Header 52 (title left, 36 icon buttons right), hairline #f3f3f3 only after scroll.
- Content column: measured 768 (640 when a 400 side panel is open). On phone: full width minus 16 gutters (est.), keep 640 as tablet cap.
- Composer / command bar: 58 tall pill, full radius, 1 px border, soft shadow; disclaimer 12 / 16 muted 11 below; pinned to the bottom.
- Feed and roadmap rows: 65 tall with 38 leading icon and 1 px #f3f3f3 rules; steps with dependencies indent under the parent.
- Trust-passport / settings rows: 60 tall (77 with two-line description), label left, toggle right flush to a 16 padding, 1 px dividers; header of a sheet 60 with divider.
- Approval requests: sit in the feed as a bordered block (1 px #ececec, radius 8, padding 16) with two 36-44 buttons.
- Secondary navigation becomes a segmented control or stacked list instead of the 180 css modal nav.
- Arabic RTL: mirror with logical properties (padding-inline, border-inline, inset-inline); symmetric gutters mean no value changes.

---

## 8. What a true 1920 css viewport would do (derived, not captured)

Card inner width = 1920 - 218 - 8 = 1694 css. Centered containers stay 600-900 so side margins grow (900 container -> 397 per side). Tables, toolbars and master-detail panes stretch (list pane stays 550, rail 320). ChatGPT column stays 768 centered in a 1660 css pane.

---

## 9. Open questions and limits

- Radius (8 css) and the tab strip height (32 css) are inferred from curvature and text position, not from a drawn edge.
- Section gap (48) is derived from ink positions with an assumed line box; only the 44 header-to-content gap has an exact box edge.
- Containers 700, 768, 800 each occur on 2 screens only; 600, 672, 900 occur on 5-9 screens.
- The type sizes quoted (18 px title, 14/20 body, 16/28 prose) use cap-height / 0.70 and line pitch; font family not identifiable.
- Phone behaviour (gutters, touch targets, stacking order) cannot be measured: all captures are 1512 css desktop windows.
- No hover, focus, pressed or loading geometry was measured here.
- Dark mode was checked for card geometry only (identical); no dark-only layout exists in the pack beyond color.
- Mobbin screenshots are slightly soft: all edges are +/-1 img px, so css values carry +/-1 css px.

---

## 10. Rules (short, for implementation)

1. One page = one white card (1 px #ececec, radius 8) on a #f3f3f3 frame, flush to the sidebar, 8 from right and bottom. No page shadow.
2. Header is 56 + 1 px rule, padding-inline 24, title 18 / 24, actions right aligned at 32 tall with gap 8. Tabs make it 85, a toolbar row makes it 96.
3. Header and action footer are sticky; the body scrolls.
4. Tables, lists and detail panes are left aligned and full width (cell inset 20, text and toolbar inset 24). Forms and section pages are centered with a fixed max-width: 600 forms, 672 wizards, 768 card lists, 900 sections with tables or cards.
5. Centered pages start 44 below the header rule; full-bleed pages start 24 below it.
6. Separate sections with space (48) and 1 px rules (#f2f2f2 / #f0f0f0), not with nested cards.
7. A bordered card only groups rows or metrics: 1 px #ececec, radius 8, no fill tint, no shadow, row padding 16 (20 for a hero card), row rules #f0f0f0.
8. Tint a surface only for an alert (#fff4f1) or a status chip.
9. Shadows only on overlays (popover, modal, composer): about 0 8px 24px at 12-15% black.
10. Label above control; description 13 px muted between them; input 32 (28 in compact wizards); stacked inputs gap 8; Save left aligned under the form, wizard CTA right aligned to the container edge.
11. Use two-column label / value only for key-value detail (label column 172, or 145 without icon, rows 32) and for settings-style toggle rows (ChatGPT 60-tall rows, control flush right).
12. Table rows: 41 compact, 45 single line, 59 with pills or ids, 70 with avatar and two lines; 1 px #f2f2f2 rules; header row 32-34 with small uppercase labels, no fill unless a filled band (30, #f9f9f9) is needed.
13. Toolbar: chips 28 pills, search 28 or 32, primary 32; gap 8; 24 below the header rule if it is a separate row; 16 above the list.
14. Page tabs are underline tabs (1 px under the label, gap 19); list-switching tabs are a segmented control (#eeeeee container, white pill).
15. Master-detail: list pane 550 (320 for config lists), pane padding 16; detail padding 24; hairline between panes (#f7f7f7).
16. Overview pages: main column + 320 rail; rail blocks 128-134 tall with 1 px rules; card grids use a 16 gutter.
17. Newcomer app: 52 header, column 640-768 centered (phone: full width minus 16), 58 composer pill, 60 setting rows, 65 list rows, no bubbles for assistant text (user bubble 36 tall, 16 side padding).
18. Mirror for RTL with logical properties only; no hard-coded left / right in layout CSS.

---

## 11. CSS / token snippet (ready to paste)

```css
/* Rasikh dashboard layout tokens. Source: OpenAI Platform (css = img px / 1.27) + ChatGPT pack. */
:root{
  --frame:#f3f3f3; --surface:#fff; --line-card:#ececec; --line-head:#f2f2f2; --line-row:#f0f0f0; --line-pane:#f7f7f7; --band:#f9f9f9;
  --top-h:54px; --side-w:220px; --card-gap:8px; --card-r:8px;
  --head-h:56px; --head-tabs-h:85px; --head-tools-h:96px; --pad-x:24px; --foot-h:56px;
  --ctl:32px; --ctl-sm:28px; --act-gap:8px;
  --w-form:600px; --w-wizard:672px; --w-page:768px; --w-wide:800px; --w-section:900px;
  --pane-list:550px; --pane-list-sm:320px; --rail:320px;
  --row-compact:41px; --row-text:45px; --row-rich:59px; --row-2line:70px;
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:20px; --sp-6:24px; --sp-8:32px; --sp-11:44px; --sp-12:48px; --sp-14:56px;
}
.shell{display:grid;grid-template:var(--top-h) 1fr / var(--side-w) 1fr;height:100dvh;background:var(--frame)}
.topbar{grid-column:1/-1}
.page{grid-column:2;display:flex;flex-direction:column;min-height:0;margin:0 var(--card-gap) var(--card-gap) 0;background:var(--surface);border:1px solid var(--line-card);border-radius:var(--card-r);overflow:hidden}
.page-head{flex:none;display:flex;flex-wrap:wrap;align-items:center;align-content:flex-start;gap:0 var(--sp-4);min-height:var(--head-h);padding-inline:var(--pad-x);border-block-end:1px solid var(--line-head)}
.page-head h1{margin:0 auto 0 0;font:600 18px/24px var(--font-ui)}
.page-head .actions{display:flex;gap:var(--act-gap)}
.page-head--tabs{height:var(--head-tabs-h)} .page-head--tools{height:var(--head-tools-h)}
.page-head .tabs{flex-basis:100%;display:flex;gap:19px;height:32px;align-items:center;padding-inline-start:3px}
.tabs [aria-selected=true]{color:#000;box-shadow:0 1px 0 #181818}
.page-body{flex:1;min-height:0;overflow:auto}
.page-body--fluid{padding:var(--sp-6) var(--pad-x)}
.page-body--centered{padding:var(--sp-11) var(--sp-6) var(--sp-12)}
.container{width:100%;max-width:var(--w-form);margin-inline:auto}
.container--wizard{max-width:var(--w-wizard)} .container--section{max-width:var(--w-section)}
.section+.section{margin-block-start:var(--sp-12)}
.field+.field{margin-block-start:var(--sp-4)}
.input,.btn{height:var(--ctl)} .input--sm{height:var(--ctl-sm)}
.card{background:var(--surface);border:1px solid var(--line-card);border-radius:var(--card-r)}
.card>.row{padding:var(--sp-4);border-block-start:1px solid var(--line-row)} .card>.row:first-child{border:0}
.split{display:grid;grid-template-columns:var(--pane-list) 1fr;min-height:0}
.split>.list{padding:var(--sp-4);border-inline-end:1px solid var(--line-pane)}
.split>.detail{padding:var(--sp-6);overflow:auto}
.with-rail{display:grid;grid-template-columns:1fr var(--rail)} .with-rail>aside{border-inline-start:1px solid var(--line-row)}
.kv{display:grid;grid-template-columns:172px 1fr;align-items:center;min-height:32px}
.table{width:100%;border-collapse:collapse}
.table th{height:32px;padding-inline:var(--sp-5);text-align:start;font:500 11px/16px var(--font-ui);text-transform:uppercase;letter-spacing:.04em}
.table td{height:var(--row-text);padding-inline:var(--sp-5);border-block-end:1px solid var(--line-head)}
.table--rich td{height:var(--row-rich)} .table--band thead{background:var(--band)}
.page-foot{flex:none;display:flex;align-items:center;gap:var(--act-gap);height:var(--foot-h);padding-inline:var(--sp-6);border-block-start:1px solid var(--line-card)}
/* newcomer app: ChatGPT pack, phone values are estimates */
.app-m{--m-head:52px;--m-gutter:16px;--m-col:640px;--m-row:60px;--m-row-list:65px;--m-compose:58px}
.app-m .head{height:var(--m-head);padding-inline:var(--m-gutter)}
.app-m .col{max-width:var(--m-col);margin-inline:auto;padding-inline:var(--m-gutter)}
.app-m .setting-row{min-height:var(--m-row);display:flex;align-items:center;justify-content:space-between;border-block-end:1px solid #f3f3f3}
```

---

## 12. Method notes

- Crop: `Image.crop((0,0,1920,1205))` (Platform) and `(0,0,1920,1200)` (ChatGPT) before any sampling.
- Edges: row/column colour runs on flat regions (tolerance 2-6 levels), box-from-point expansion for outlined controls, connected components for dark buttons, circle fit for corner radius.
- Hex values: median of a flat region, or darkest glyph pixel for text (lower bound on darkness).
- Pack scans: Platform 417 indices -> 177 with card shell and header divider; ChatGPT 245 indices -> 67 with a detectable sidebar (blurred modal screens are not counted).
- Scripts and crops: session scratchpad `page-layout/` only; no repo file other than this report was written.
