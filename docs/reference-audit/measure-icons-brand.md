# Measure: Icons, avatars, logo lockup, microcopy (key: icons-brand)

Packs: OpenAI Platform web Apr 2026 (P, desktop dashboards) and ChatGPT web Mar 2026 (C, newcomer app + agent feed).
All values are CSS px unless written `NN img px` (screenshot pixels). Conversion: CSS = img px / 1.27.
`measured` = read from pixels on at least 4 screens (or on every instance of a repeated element); `estimated` = inferred, single-screen, or derived from an assumption.

## 1. Scale and crop

- Footer: bottom 120 px (Mobbin bar) cropped before every measurement. Viewport = 1920x1205 (P) / 1920x1200 (C).
- **Scale assumed: 1.27 img px per CSS px (viewport about 1512 CSS px wide, resized to 1920).** Re-verified here on pixels:
  - C 22: sidebar border column at x=329, so the sidebar is 330 img px = 260 CSS (1.269). Nav row pitch 45.8 px = 36 CSS (1.272).
  - P 20: selected nav row spans x=15..261 (247 px = 194.5 CSS); pitch 45.7 px = 36 CSS.
  - The surveys' modal widths (570/634/660 px = 449/499/520 CSS) also land on round CSS numbers only at 1.27 (1.33 gives 428/476/495).
  - Rejected alternative: 1.33 (fails the modal widths and the sidebar).
- Tolerance: edge positions +/-1 px (about +/-0.8 CSS). Screens are lightly sharpened (JPEG-like), so thin dark strokes read darker and slightly bolder than the real CSS colour. Hex values for icons are "darkest 3-8 % cluster" (lower bound on darkness).
- Stroke width method: coverage integration. Skeletonise the glyph, divide total ink coverage by skeleton length. Calibrated on synthetic renders of lucide `search` at 20/24/25.4 px, error under 0.07 px (so about +/-0.05 CSS).
- Scratch crops: `C:/Users/maalh/AppData/Local/Temp/claude/.../scratchpad/icons-brand/`. Nothing under `.reference` modified.

## 2. Icons

### 2.1 Style (both packs)

- Outline icons, no fills (exceptions: play triangle in circle, send arrow in disc, mic/waveform bars, dots in ellipsis, plus and chevrons are strokes).
- Round line caps and round joins (visible on search handle, chat-bubble tail, audio bars, flag pole, trash lid).
- Stroke scales with the icon (it is not a fixed 1.5 px). The ratio stroke / ink width stays 0.085-0.09 from a 12 CSS glyph to a 27 CSS glyph, which is **about strokeWidth 1.65-1.85 on a 24 grid** (see 2.3).
- Corners: P rounded rects are tight (image glyph radius about 2 img px on a 20 px ink = lucide rx 2) up to rounder (square-play about 5 px). C rects are rounder (square-pen, archive about 3.5 px on 20 px ink = about 4/24).
- Glyph padding: ink fills about 0.8 of the icon box (typical 24-grid, 2 px margin), same as lucide.

### 2.2 Size per context (ink bbox in img px, CSS in brackets; box = estimated)

| Context | Pack | Ink size | Box (est.) | Colour (darkest cluster) | Screens | Conf. |
|---|---|---|---|---|---|---|
| Sidebar nav | C | 20x20 (19-23) px = 15.7 CSS | 20 | #000 (ink #0d0d0d class) | 22,24,56,75,92,152,238 | measured |
| Sidebar nav | P | 21 (20-22) px = 16.5 CSS | 20 | #151515 unselected, #050505 selected | 20,29,95,141,194,225,249,260 | measured |
| Sidebar collapse toggle | C | 22x22 px (17 CSS), grey #777 | 20 | #777 | 22,24,75,92 (visually identical) | estimated |
| Sidebar collapse toggle | P | 20x20 px (16 CSS), bottom-left x=31,y=1157 | 20 | #030303 | 20,29,95,141 | measured |
| Menu item (overflow / plus / profile menus) | C | 20-22 px = 16-17 CSS | 20 | #000; destructive row #9d3430 | 75,92,26,165,179 | measured |
| Menu item | P | 15x16 px = 12 CSS | 14-16 | #1e1e1e; destructive #a83b3f | 133,138 (same menu), 309 check 13x11 px | estimated (one menu type) |
| Message action row (copy, thumbs, share, regen, more) | C | 19-22 px = 15-17 CSS, pitch 41 px (32 CSS) | 20 | #4d4d4d (secondary) | 60,74,75,76 | measured |
| Composer plus | C | 18-19 px = 14.6 CSS | 20 | #000 | 22,26,60,75 | measured |
| Composer mic | C | 16x22 px = 12.6x17 CSS | 20 | #000 | 22,26,60,75 | measured |
| Composer voice / send disc | C | disc 46 px = 36 CSS, waveform ink about 20 px | n/a | #010101 disc | 22,26,60,75 | measured |
| Composer send disc | P | disc 40 px = 31.5 CSS (fill #1a1a1a), arrow ink 11x13 px = 9x10 CSS | 14-16 | white | 131,132 (same widget) | estimated |
| Header icons (user-plus 20x22, temp-chat 22x20) | C | 20-22 px = 16-17 CSS | 20 | #000 | 22,26,116 (+ share/ellipsis pair on 75) | measured |
| Header chevron (title switcher) | C | 14x8 px = 11x6.3 CSS | 20 | #797979 | 22,24,75,80 | measured |
| Org/project chevrons-up-down | P | 10x15 px = 8x12 CSS (two 10x6 chevrons, 3 px gap) | 14 | #777 | 20,61,95,309 | measured |
| Breadcrumb slash | P | 7x13 px = 5.5x10 CSS | text | #8c8c8c | 20,61,95,309 | measured |
| Gear (settings) | P | 22x23 px = 17x18 CSS (6-lobe cog) | 20 | #000 | 20,95,141,163 (22x23 on all four) | measured |
| Button leading icon (plus in Create) | P | 14x14 px = 11 CSS; gap to label 14 px (11 CSS) | 14 | white on #1a1a1a | 20,95,361 | measured |
| Button leading icon (book, file-plus) | P | 16x20 px = 12.6x15.7 CSS; gap 12 px (9.4 CSS) | 16 | #1d1d1d / white | 260 | estimated |
| Input leading icon (search) | P | 14x15 px = 11 CSS | 14 | #1a1a1a | 361,260,283,311 | measured |
| Table row action (trash) | P | 17x20 px = 13.4x15.7 CSS | 16 | #494949 (secondary grey) | 95,225,249 | measured |
| Detail-list row icons (status, info, grid, layers, clock) | P | 17-18 px = 13.5 CSS; icon to label gap 15 px (12 CSS) | 16 | #3c3c3c | 260,300,370 | estimated |
| List play-circle (voice list) | P | about 14 px (11 CSS) | 14 | grey #8f8f8f | 163 | estimated |
| Modal close x | C | 15x14 px = 11.8x11 CSS | 16 | #7a7a7a | 116,179,225,227 | measured |
| Empty-state glyph in tile | P | 35x33 px = 27x26 CSS in a 70 px (55 CSS) white tile | 32 | #1d1d1d | 19,61,311 | estimated (3 screens, same tile) |
| Empty-state glyph in tile | C | about 26x30 px = 20x23 CSS in a 56 px (44 CSS) white squircle tile | 24 | #000 | 130,153 | estimated |
| Icon tile (card icon) | P | tile 36 px = 28 CSS, radius about 6 CSS, fill #0484fd, glyph white 16 px = 12.6 CSS | n/a | white | 20 (+19,21) | estimated |
| Icon tile (workflow palette) | P | tile about 29 px = 23 CSS, radius about 6 CSS, pastel tints, black glyph ink about 13 px | n/a | #181818 | 117,103,106 | estimated |

Tile tints (workflow palette, P 117): agent #e9efff, classify #ffe6c2, end #e0f3ec, note #e0e0e0, file search #fcf3c2, guardrails #fcf0b8, mcp #fff1a5, transform/set state #ede4ff.
Empty-state tile on C 153: three 36 CSS tiles tilted about +/-6 deg, white, 1px #e6e6e6 border, soft shadow, 2 px overlap (app logos / paperclip).

Dark mode (C 183-187, P 318, 322): icons flip to #ececec-#f9f9f9 (C) / #f0f0f0 (P), labels #e1e1e1; the stroke reads about 7 % heavier (1.88 vs 1.76 img px) because of light-on-dark bloom. Do not lower strokeWidth in dark mode.

### 2.3 Stroke weight

| Where | img px | CSS px | ink width | stroke / ink | Equivalent strokeWidth on a 24 grid (box 20) |
|---|---|---|---|---|---|
| C sidebar (6 glyphs x 6 screens: 22,24,56,75,92,238) | 1.70 (1.54-1.80) | 1.34 | 15.7 CSS | 0.085 | 1.61 |
| P sidebar (10 glyphs x 6 screens: 20,29,95,141,194,225) | 1.77 (1.57-2.03) | 1.39 | 16.5 CSS | 0.084 | 1.67 |
| P menu icons (133: pencil-square, copy, trash) | 1.39 (1.33-1.47) | 1.09 | 12.2 CSS | 0.090 | 1.64 at box 16 |
| P empty-state glyph (311) | 3.12 | 2.46 | 27 CSS | 0.089 | 1.85 at box 32 |

Reading: reference stroke is about 1.65 units on a 24 grid (1.6 C, 1.67 P), rising to about 1.85 for the largest glyphs.
Lucide default is 2 (about 20 % too heavy at these sizes); 1.5 is about 8 % too light; 1.75 is about 6 % heavy.

### 2.4 Concept -> closest lucide-react icon (names to be confirmed against the installed 1.x; see open questions)

Recommended render: `size` and `strokeWidth` as in the last column; leave `absoluteStrokeWidth` off so stroke scales; lucide caps/joins are already round.

Platform sidebar (P 20/95/141):

| Label | Reference glyph | lucide | Notes |
|---|---|---|---|
| Chat | speech bubble, tail bottom-left | `message-circle` | exact |
| Agent Builder | top circle linked to two lower circles (org tree) | `network` | reference uses circles; `git-fork` rotated is another option |
| Audio | 5 vertical bars of varying height | `audio-lines` | exact |
| Images | rounded square, sun dot, hills | `image` | exact |
| Videos | rounded square with play triangle | `square-play` | exact |
| Assistants | robot head + shoulders arc | `bot` | head only in lucide |
| Usage | 3 rounded bars (short/tall/mid) | `chart-no-axes-column` | |
| API keys | key | `key-round` | |
| ChatGPT Apps | 4 circles, two diagonal links | `layout-grid` | no exact match; custom 4-circle SVG is trivial |
| Logs | rounded square with prompt `>_` | `square-terminal` | exact |
| Storage | cylinder | `database` | exact |
| Batches | braces around 3 lines | `braces` | approximate |
| Evaluation | compass in circle | `compass` | exact |
| Fine-tuning | two sliders | `sliders-horizontal` | exact |
| Collapse sidebar | rounded rect with left rail | `panel-left` | exact |

Platform other: settings gear -> `settings`; org/project switcher -> `chevrons-up-down`; back -> `chevron-left`; row delete -> `trash-2`; rename -> `square-pen`; duplicate -> `copy`; play -> `circle-play`; info -> `info`; status -> `circle` / `circle-check`; clock -> `clock`; size/stack -> `layers`; learn more -> `book`; upload -> `file-plus`; send -> `arrow-up`; add -> `plus`; warning banner -> `triangle-alert`; filter chips (model, date, metadata, tool call) -> `box`, `calendar`, `tag`, `wrench`; quick eval -> `zap`; download -> `download`; close -> `x`.

ChatGPT sidebar / menus (C 22, 26, 75, 92, 165, 179):

| Label | Reference glyph | lucide |
|---|---|---|
| New chat | pencil in rounded square | `square-pen` |
| Search chats | magnifier | `search` |
| Images | two layered image frames | `images` |
| Apps | 2x2 small circles | `layout-grid` (approx.) |
| Codex | circle with `>_` | `square-terminal` (approx.) |
| Projects | folder with plus | `folder-plus` |
| Collapse sidebar | rounded rect with left rail | `panel-left` |
| Start a group chat | person + plus | `user-plus` |
| Pin chat / Archive / Report / Delete | pin / box with slot / flag / bin | `pin` / `archive` / `flag` / `trash-2` |
| People / Manage group link / Rename / Customize | two people / chain link / pencil / gear | `users` / `link` / `pencil` / `settings` |
| Leave group / Log out | door with arrow out | `log-out` |
| Plus menu | paperclip / images / bulb with rays / telescope / bag with magnifier / ellipsis + chevron | `paperclip` / `images` / `lightbulb` / `telescope` / `shopping-bag` / `ellipsis` + `chevron-right` |
| Profile menu | sparkle / smiley-clock / gear / lifebuoy / log-out | `sparkle` / `circle-user-round` / `settings` / `life-buoy` / `log-out` |
| Temporary chat | dashed bubble | `message-circle-dashed` |
| Message actions | copy / thumbs up / thumbs down / share (arrow out of tray) / regenerate / more | `copy` / `thumbs-up` / `thumbs-down` / `share` / `refresh-cw` / `ellipsis` |
| Composer | plus / mic / waveform in disc / send | `plus` / `mic` / `audio-lines` / `arrow-up` |
| Settings nav | General, Notifications, Personalization, Apps, Data controls, Security, Parental controls, Account | `settings`, `bell`, `circle-user-round`, `layout-grid`, `database`, `shield`, `users-round`, `circle-user` |

Recommended lucide settings (best visual match):

| Context | size | strokeWidth | colour |
|---|---|---|---|
| P sidebar, gear, collapse | 20 | 1.65 | #0d0d0d (selected #000) |
| C sidebar, menu, header, action row | 20 | 1.6 | #0d0d0d primary; action row #5d5d5d |
| P row actions, detail rows, button icons | 16 | 1.65 | #5d5d5d secondary / text colour in buttons |
| P menu and input icons | 14 | 1.65 | #1d1d1d / #5d5d5d |
| P chevrons-up-down | 14 | 1.75 | #777 |
| C title chevron | 18 | 1.6 | #797979 |
| Empty-state glyph | 32 (P) / 24 (C) | 1.85 | #1d1d1d |

## 3. Avatars

All avatars are circles, flat fill, centred initials, no border, no status ring.

| Avatar | Pack | Diameter | Fill | Initials | Screens | Conf. |
|---|---|---|---|---|---|---|
| Org avatar (top-left breadcrumb and org list) | P | 33 px = 26 CSS | #181818 (rim #1b1b1b); dark mode #f3f3f3 | white, cap 11 px (8.7 CSS) so about 12 CSS 600; one letter | 20,61,95,309,322 | measured |
| User avatar (top-right) | P | 36.5 px = 28.7 CSS | #eeeeee on #f3f3f3 (dark #313131) | black 14 CSS 500, one letter | 20,95,141,163,311,318 | measured |
| Table author avatar | P | 27 px = 21 CSS | #efefef | cap 9 px (7 CSS), about 10 CSS 600; gap to name 8 CSS | 95 | estimated |
| Roles list avatar | P | 41 px = 32 CSS | #eeeeee | black about 14 CSS 500 | 361 | estimated |
| Sidebar footer avatar | C | 32 px = 25 CSS | #2f91fb (also #1abc9c on 165) | white, cap 11 px (8.7 CSS) so about 12 CSS, 2 letters | 22,24,75,165 | measured |
| Group-chat participant | C | 36 px = 28 CSS | #7e8a8c | white about 11 CSS, 2 letters | 92,88 | measured |
| Sidebar group-chat bubble | C | 26 px = 20.5 CSS | #7e8a8c | white about 8 CSS | 75,92,152 | measured |
| Header top-right (group chat) | C | 41 px = 32 CSS | #7e8b8b / #1abc9c | white | 92,88 | measured |
| Edit-profile avatar | C | 162 px = 128 CSS | #1abc9c | white 48 CSS light-weight geometric sans; camera badge about 27 CSS white disc | 166 | measured (one screen) |
| Family member row | C | 48 CSS (survey) | #359bff | initials | 222 | survey only |

- Observed colour set: #2f91fb, #1abc9c, #7e8a8c (C); #181818 and #eeeeee (P). Initials are 0.38-0.46 x diameter (font size).
- P gap avatar -> name 8 CSS (org breadcrumb 10 px = 8 CSS; table 10 px).
- The Platform pack uses no photo avatars; the ChatGPT pack shows one photo avatar (167, group-chat row) clipped to the same circle.
- Unread dot (C sidebar): 8 CSS, #075ec2, right-aligned at the row.

## 4. Logo lockup (geometry only; the OpenAI mark is NOT to be copied)

| Item | Value | Screens |
|---|---|---|
| C in-app sidebar: mark only, no wordmark | ink 26x26 px = 20.5 CSS, left 20 px (15.7 CSS), top 20 px, centre y 32.5 px = 25.6 CSS (middle of the 52 CSS header); collapse icon pinned to the right edge of the sidebar (x 286-307) | 22,24,75,92 |
| C logged-out header lockup (mark + wordmark) | mark ink 37x37 px = 29 CSS at x=40 px (31.5 CSS); wordmark 105 px = 83 CSS wide, ascender height 19 px (15 CSS) so about 20 CSS semibold, tight tracking; **gap mark -> wordmark 9 px = 7 CSS**; mark and wordmark share the same centre line (y=40 px) | 0 |
| C auth header: wordmark only | x=30 px (23.6 CSS), 119 px wide, top 30 px | 1-7 |
| P logged-out lockup: wordmark text only, two words | "OpenAI" 97 px = 76 CSS wide at x=30 px (23.6 CSS); "Platform" 110 px = 87 CSS; **gap between words 20 px = 16 CSS**; ascender height 21 px = 16.5 CSS so about 22 CSS semibold; top 30 px (23.6 CSS) | 2,11,0 |
| P in-app: no logo at all | the top-left slot is the org avatar + org name + project switcher (see 5) | 20,61,95 |

Geometry takeaways: mark height is about 1.9x the wordmark ascender height; gap about 0.25 x the mark height; left page margin 24 CSS (logged-out) or 16 CSS (in-app sidebar); header band 52 CSS (C) / 55 CSS (P).

### 4.1 Spec for an ORIGINAL Rasikh mark (fits the same lockup geometry)

Name meaning: "Rasikh" = firmly rooted. Design brief: a single simple geometric glyph, monochrome #0d0d0d (white in dark mode), optional single accent dot; must read at 20 px and at 29 px; must not resemble the OpenAI blossom.

Grid: 24 x 24, 2 unit safe margin, ink area 20 x 20 (so it sits in the same 20.5 CSS in-app slot and 29 CSS logged-out slot as the reference mark). Stroke 2.5 for solid shapes, or filled shapes only (a logo may be heavier than the 1.65 UI icons). Round joins.

Three concepts (descriptions only, no paths):

1. **Keystone half-disc.** A squircle outline (radius about 7 units, stroke 2.5) containing a solid half-disc that sits on the bottom edge, flat side down, centred, diameter about 10 units. Reads as a stone resting on ground (rooted) and as a rising sun. Accent option: the half-disc takes the brand accent, the squircle stays ink.
2. **Arch + anchor dot.** An open arch (inverted U, legs vertical, round caps, stroke 3, 14 wide x 14 tall) with a solid circle (diameter 5) centred under the arch on the baseline. Reads as a doorway with a person arriving (relocation) and as a rooted stem. The dot is the only place the accent colour may appear.
3. **Ra hook (bilingual).** One continuous stroke (width 3, round caps): a vertical stem on the left that bends at the top into a quarter-circle (radius 8) sweeping to the right, ending in a short drop; a solid dot (diameter 3) sits at the foot of the stem. The silhouette reads as a Latin "r" and also echoes the Arabic letter Ra (ر), so it holds in RTL without redrawing.

Lockup for Rasikh: mark box 24 CSS (ink 20.5 CSS) in the app sidebar (mark only), mark 28-29 CSS + gap 7-8 CSS + wordmark "Rasikh" 20 CSS 600 for logged-out headers; Arabic wordmark "راسخ" at the same cap height, mark on the leading edge in both directions (mirror the order in RTL).

## 5. Org/project switcher chip (P 20, 61, 95, 309)

- At rest: no chip, no border, no background. Items sit directly on the #f3f3f3 canvas: avatar 26 CSS, 8 CSS gap, org name 14 CSS 500 (#101010; project #141414), 8 CSS gap, chevrons-up-down 8x12 CSS #777, 15 CSS gap, slash (#8c8c8c, 10 CSS tall), 16 CSS gap, project name, chevrons.
- Open / hover: a rounded chip appears behind the trigger: fill #e8e8e8, x=15..182 px (132 CSS wide), y=14..55 px (about 32 CSS tall), radius about 8 CSS, inner padding left about 6 CSS.
- Popover: white card 260 CSS wide (330 px), 1px border #dedede, large soft shadow, section label "ORGANIZATIONS" (uppercase, cap height 10 px = 8 CSS so about 11 CSS, wide tracking, #545454-#5d5d5d), rows 32 CSS tall with check at left (13x11 px), 26 CSS avatar, selected row fill #ececec, radius about 8 CSS; footer actions use plain icons (`plus` Create project, gear Manage projects).
- C equivalent: header title button "ChatGPT" + chevron-down (11x6 CSS, #797979), no avatar, no slash.

## 6. Keyboard-shortcut hints, scrollbars, selection, motion

- **Keyboard hints**: only one instance across 662 screens: P 201 (and 206) "Run" button. Chip inside the black button, 40x23 px = 31x18 CSS, fill #404040 on #181818 (about white at 16-20 % alpha), radius about 5 CSS, glyphs "command" and "return" in white about 12 CSS, 4 CSS gap to label. No kbd chips in menus, tooltips or ChatGPT screens (about 70 menus and dialogs reviewed). Measured on 2 screens only: estimated.
- **Scrollbars**: none visible in any scrolling container reviewed (P 163 voice list, P 78/25 code and text panes, C 188/189 language list, C 200 option list, C 141 diff). Lists are clipped mid-row at the container edge. Conclusion: macOS overlay scrollbars, styling not observable. No custom scrollbar can be specified from these references.
- **Text selection**: C 60 shows a real selection (the pack's only one): flat #bcdeff, square corners, full line-box height (35 px = 28 CSS), text colour unchanged (stays near-black). That is the macOS system selection, not a custom `::selection`. P 11 shows a focused date segment highlighted #027aff with white text (native control). No custom selection styling exists in either pack.
- **Motion** (stills only; no duration or easing can be measured):
  - C 17 (mid-transition): the first chip row is at about 20 % opacity (text #dcdcdc vs #464646 final) and the stack has moved up 7-8 px (about 6 CSS) vs C 16. Consistent with a short fade + vertical shift on list reflow.
  - P 203/204: the Generate popover is translucent (right half over the dimmed page reads about 60 % opaque), left edge fading. Consistent with an opacity transition on a popover; the page overlay is identical in 202 and 205 (black at 30 %: page #fff -> #b2b2b2, sidebar #f3f3f3 -> #aaaaaa), so the overlay is not mid-fade in these frames.
  - Toasts (P 361, C 67/69/88): fully formed, top-centre, 12 CSS from the top; no entrance frame captured.
  - Duration/easing: none measurable. Anything we ship is our own choice (see recommendations).

## 7. Microcopy (30+ verbatim strings)

All strings were read from the screens (no OCR; three spot-checked at 2x zoom: P 77, P 403 banner, C 60). Apostrophe style (straight vs typographic) was verified only for P 77 ("doesn’t" is typographic). Punctuation otherwise as seen.

| # | String | Role | Pack / screen |
|---|---|---|---|
| 1 | Ready when you are. | empty-state / home heading | C 22 |
| 2 | What's on the agenda today? | home heading (dark) | C 183 |
| 3 | Ask anything | composer placeholder | C 22 |
| 4 | New chat / Search chats / Images / Apps / Codex / Projects | sidebar nav | C 22 |
| 5 | Start a group chat | menu item | C 75 |
| 6 | Pin chat | menu item | C 75 |
| 7 | Archive / Report | menu items | C 75 |
| 8 | Delete | destructive menu item (red) | C 75 |
| 9 | Give ChatGPT more context | empty-state title | C 153 |
| 10 | Upload sources, link drives, or connect apps like Slack to give ChatGPT deeper context about your project. | empty-state helper | C 153 |
| 11 | Add | empty-state CTA | C 153 |
| 12 | No results here | filter empty state (with a "Reset" button) | C 164 |
| 13 | Enable code review | empty-state title | C 130 |
| 14 | Catch critical bugs before they ship | empty-state helper | C 130 |
| 15 | Enable for me | CTA | C 130 |
| 16 | Something went wrong. Please try again later | inline field error | C 225 |
| 17 | Incorrect email address or password | inline field error | C 234 |
| 18 | Thank you for submitting feedback! | success toast | C 67 |
| 19 | Link copied! | success toast | C 69 |
| 20 | Delete chat? | confirm title | C 78 |
| 21 | This will delete Best Matcha Latte Recipe. | confirm body (item name in bold) | C 78 |
| 22 | Visit settings to delete any memories saved during this chat. | confirm helper | C 78 |
| 23 | Share details (optional) | input placeholder | C 66 |
| 24 | Send verification email | button | C 225 |
| 25 | Add photos & files / Create image / Thinking / Deep research / Shopping research / More | plus menu | C 26 |
| 26 | Upgrade plan / Personalization / Settings / Help / Log out | profile menu | C 165 |
| 27 | ChatGPT can make mistakes. Check important info. See Cookie Preferences. | composer footnote | C 22, 75 |
| 28 | Your personal ChatGPT memory is never used in group chats. | privacy notice | C 88, 92 |
| 29 | Create a chat prompt | empty-state heading | P 20 |
| 30 | Your conversation will appear here | empty pane | P 25 |
| 31 | This project doesn’t have an API key. Generate one to authenticate API requests. | error banner (red, triangle icon, inline link) | P 77 |
| 32 | You have not started a billing plan yet | warning banner title | P 370 |
| 33 | You do not have permission to manage members and invitations | warning banner title (bold) | P 403 |
| 34 | Only members of your organization with the "Owner" role can manage members and invitations. | warning banner body | P 403 |
| 35 | No members found | empty table | P 403 |
| 36 | Role created | success toast (green #49b880, with x) | P 361 |
| 37 | To get started, enable microphone access. | empty state | P 144 |
| 38 | Enable access | CTA | P 144 |
| 39 | Oops! | error page title | P 323 |
| 40 | Your authentication token has been invalidated. Please try signing in again. | error page body | P 323 |
| 41 | MCP Server section has errors. Please fix them before continuing. | red toast | P 245 |
| 42 | Describe what your function does (or paste your code), and we'll generate a definition. | helper placeholder | P 203 |
| 43 | Playground messages can be viewed by anyone at your organization using the API. | footnote | P 201 |
| 44 | Add credits / Run your next API request by adding credits. / Go to Billing | sidebar nudge card | P 311, 370 |
| 45 | Let's confirm your age | auth heading | P 11 |
| 46 | This helps us personalize your experience and provide the right settings, in line with our Privacy Policy. | auth helper | P 11 |
| 47 | Your password must contain: / At least 12 characters | checklist | P 6 |
| 48 | Rename / Duplicate / Delete | menu | P 133 |
| 49 | Your profile / Terms & policies / Help / Log out | avatar menu | P 311 |
| 50 | Select a model... / Search files by name... / Search roles... / Enter your message... / Chat with your prompt... | placeholders (three ASCII dots) | P 26, 260, 361, 201, 25 |
| 51 | ORGANIZATIONS / PROJECTS | uppercase popover section labels | P 309, 61 |
| 52 | Create project / Manage projects | switcher footer actions | P 61 |

### Tone rules

- Sentence case everywhere: first word capitalised, product nouns capitalised (ChatGPT, Agent Builder, Codex, MCP). Title Case only for page titles that are names. The single exception is uppercase micro-labels (ORGANIZATIONS, PROJECTS, MODEL CONFIGURATION, TOOLS, FILE) at about 11 CSS, wide tracking, grey.
- Buttons and menu items begin with a verb and run 1-3 words: Create, Upload, Enable access, Go to Billing, Send verification email, Enable for me. Destructive actions say the verb only (Delete, Log out).
- Nav labels are one or two nouns (Usage, API keys, Fine-tuning, Search chats). No icons without labels in navigation.
- Empty states: a short statement or question title (4-6 words, often ending with a period or question mark: "Ready when you are.", "What's on the agenda today?"), one sentence of grey helper naming the benefit, at most one CTA. Titles are not exclamations.
- Errors say what happened and what to do next, in plain words, no codes: "Incorrect email address or password"; "Something went wrong. Please try again later". Inline field errors have no final period if they are one clause. Exclamation marks only for "Oops!" and thanks.
- Success toasts are 2-4 words, past tense, optionally with "!": "Role created", "Link copied!", "Thank you for submitting feedback!".
- Confirm dialogs: question title ("Delete chat?"), one body sentence that bolds the item name, one optional link-led helper, buttons Cancel + verb.
- Helper text is one sentence, 12-13 CSS grey, address the user as "you/your". Placeholders are short phrases; P ends them with "..." (three ASCII dots), C uses none.
- Warnings use a bold title line plus one regular body line; the title is a complete statement without a period.
- Plain language over jargon in consent/permission copy (see C 123/93: bold lead-in per permission).

## 8. Notes for Rasikh

See the structured recommendations returned with this audit. Short version:

1. lucide-react: size 20 / strokeWidth 1.6-1.65 for nav; 16 for row actions and buttons; 14 for menus and inputs; 32 / 1.85 for empty states. Keep caps and joins round.
2. Avatar set: Platform-style near-black org avatar (26 CSS) and #eee person avatar (21-32 CSS) for dashboards; ChatGPT-style coloured initials (25-28 CSS) for the newcomer app; Arabic initials use the first letter of the Arabic name.
3. Org/project switcher: breadcrumb-as-switcher with chip only on hover/open; reuse the same trigger for EN/AR.
4. Kbd chip only on the primary action of dense desktop forms (for example "Approve" with command + return), never on mobile.
5. Mark: concept 3 (Ra hook) for the bilingual brand, or concept 2 if the accent dot is wanted.
6. `::selection` explicitly set to #bcdeff to reproduce the macOS selection on Windows demos.
7. Scrollbar: thin neutral (our choice; the references show none).
8. Motion: our choice (references give nothing measurable).

## 9. Open questions

- Icon box sizes (20 / 16 / 14) are inferred from ink size assuming lucide-like padding (ink about 0.83 of the box). The real DOM sizes are unknown.
- lucide-react is not installed in the repo (no node_modules) and was not downloaded; icon names above come from the lucide naming scheme and must be confirmed with a search on the installed 1.x (aliases cover most renames).
- The P menu icon size is measured on one menu type (133 and 138 are the same menu); other P menus (309, 311, 61) are text-only or use checks.
- Avatar colour assignment logic (C) is unknown; three hues were observed.
- No scrollbar, no custom selection, no kbd chips outside P 201 were found; absence in the sample is not proof of absence in the product.
- Motion durations and easing cannot be derived from stills.
- Wordmark font size is inferred from ascender height (about 0.74 em).
- Font family not identified (neutral grotesque).
