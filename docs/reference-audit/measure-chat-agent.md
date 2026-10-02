# Measure: ChatGPT conversation, agent and attachment patterns (key: chat-agent)

Scope: how the ChatGPT web Mar 2026 pack builds conversation threads, composer, step/activity disclosures, attachments, approval-like cards, settings toggles, memory and language controls, and how the OpenAI Platform Apr 2026 pack builds its playground chat. Everything is converted to CSS px. Rasikh surfaces served: newcomer agent activity feed, approval requests, document upload, trust passport, EN/AR switcher.

## 1. Scale, crop and method

- **Crop.** Every image is 1920x1320 (chatgpt) or 1920x1325 (platform). The bottom 120 px Mobbin bar is cut before measuring, leaving a 1920x1200 / 1920x1205 app viewport. All Mobbin branding ignored.
- **Pixel scale assumed: 1.27 image px per CSS px** (a ~1512 CSS px viewport rendered at 1920). I verified it from six independent elements, all on the same factor: sidebar 330 px incl. 1px border (x=329) = 260 CSS; composer 977 px = 768; header rule at y=66 = 52; sidebar row pitch 45.8 px = 36; confirm dialog 570 px = 448; auth column 431 px = 340; send disc 45 px = 36; toggle 41x25 px = 32x20. The CSS reference values are recalled ChatGPT layout constants (Tailwind max-w-3xl, max-w-md, h-9), not read from the screenshots, so the scale is **estimated** though internally consistent to 0.4%. Platform pack uses the same factor (its send disc is 45 px and its 14px body cap height is 13 rows, identical to ChatGPT's 14px sidebar text).
- **How values were taken.** Edge-to-edge distances from flat-colour runs, ink bounding boxes for text, darkest sampled pixel for text colour, fill colour from the modal value of a flat region, radius from a least-squares circle fit of the outer contour, font size from cap-height rows (cap = 0.705 em) and line height from line pitch. 'measured' below means read from pixels on >= 4 screens; single-capture components are 'estimated' even when the pixel read is exact.
- **Scratch.** Crops and scripts live outside the repo (scratchpad/chat-agent). Nothing under `.reference` was modified.

## 2. Screens used

ChatGPT pack (opened and measured): 22-26, 28, 31, 34, 36, 38-42, 44-46, 48, 49, 51-55, 58, 61-64, 70, 77, 78, 86, 99, 107, 123, 131, 137, 143, 169, 172, 174, 175, 177, 184, 188, 192, 195, 203, 205, 208, 210, 222, 238; colour-only checks on 35, 42, 73, 96. Platform pack: 43, 44, 45, 66, 85, 86. Light theme everywhere except dark chat 184. Screens quoted as 'per survey' (54, 61, 170, 173, 182, 196-198, 129, 145) were not re-opened here.

Coverage gaps (stated plainly): no phone-width frame, no RTL frame, no approval-request UI, no confidence or upload-progress UI, no typing-dots or skeleton for chat, no hover transitions. Details in section 11.

## 3. Pattern geometry and Rasikh adaptation

### 3.1 Thread column, user vs assistant, spacing
- Column 768 CSS max, centred in the pane (242 CSS free each side at 1512). Same 768 for composer, rules, decision cards. With the 400 CSS Activity panel open the column and composer shrink to 640.
- First bubble starts 12 CSS under the 52 CSS header. User bubble to first assistant line: ~48 CSS ink-to-ink.
- User bubble: right-aligned, flush with column edge, hugs content up to 70% of the column (538 CSS), fill #f5f5f5 (range #f2f2f2-#f5f5f5), radius 18, padding 16 horizontal, 6 vertical on one line (37 CSS tall) and 12 vertical on multi-line (72 CSS for two lines), text 16/24.
- Assistant: no container at all. 16/28 on canvas, black text. Paragraph gap 16, list pitch 28 with no extra gap, text indent 32. H2 24/600, H3 20/600 (often with emoji), H4 18/600. Section rule 1px #d9d9d9 with ~33 CSS clear either side.
- **Rasikh:** copy exactly for the newcomer app; drop emoji headings; keep the bubble neutral (#f4f4f4) so the accent stays reserved.

### 3.2 Message action row
- Six outline glyphs (copy, thumbs-up, thumbs-down, share, regenerate, more), glyph 16 CSS inside 32 CSS hit areas on a 32 CSS pitch; first glyph centre is 9.5 CSS inside the text edge (hit area starts ~6 CSS left of it); ~23 CSS below the last line. Pitch measured on 6 screens (25, 62, 64, 44, 45, 48). Pressed = #f2f2f2 32 CSS chip with filled glyph (70). Copy becomes a check in the same slot (64). Codex task detail (143) shows only up/down.
- **Rasikh:** keep copy / helpful / not-helpful / retry; add 'Why?' (explainable risk) as the sixth slot instead of share; same sizes.

### 3.3 Composer (the model for 'ask Rasikh')
- Card 768 wide, 57.5 tall (one row), 1px #ddd border, radius 28 at any height, soft shadow below only, padding 11, controls 36. Left ghost '+' (14 glyph), placeholder 'Ask anything' 16 #777, ghost mic, 36 disc send.
- Send disc states: waveform (empty) -> arrow-up (text) -> black square on #e9e9e9 disc (streaming) -> #a7a7a7 (disabled, group and Codex composers).
- A tool chip makes it two rows: text row on top, toolbar below, 104 tall. Every extra typed line adds 24. The chip is accent-blue text+icon with no fill; the placeholder changes with the mode.
- Quote-reply: a 44 CSS #f9f9f9 bar inset 4 inside the top of the pill (61, 62). Voice: waveform replaces the placeholder, X and check replace mic and send (58).
- Docked in a thread the pill bottom sits 32 CSS above the viewport bottom with a 13px #454545 disclaimer under it. A 32 CSS white arrow-down disc floats above the pill when content is below the fold. On the empty home the composer top is at 42% of the viewport height.
- The '+' menu (26) is a 231x239 CSS card, 36 CSS rows, first group 'Add photos & files', 1px #e9e9e9 divider, then tool rows, chevron on 'More'.
- **Rasikh:** pill at 100% width minus 16 CSS gutters on phones, same 28 radius. '+' menu = Add document / Take photo / Ask about a step. Send disc black or ink.

### 3.4 Attachments and upload state
- Tray inside the top of the pill: image thumb 56 CSS square (~12 radius, 8 gap) or file card 316x56 (1px #e8e8e8, 12 radius, 39 CSS type tile: PDF #f0423c, other #909090; filename 14/600 over type 14 #444), 15 CSS black X badge top-right. With a tray the pill is 130 CSS tall. Sent image in thread: 387x258 CSS, right aligned, 5 CSS above the bubble (31).
- Processing is text only: 'Analyzing image' #404040, no bar or percent. Insight cards use a 5px determinate bar (55).
- **Rasikh:** file card = upload row; second line carries state 'Reading...' (shimmer) -> 'Extracted 12 fields' -> 'Needs review'; 5px bar under it while parsing; confidence is an invented 18px grey pill (no reference exists).

### 3.5 Step disclosures, activity log, sources
- Collapsed: 'Thought for 42s >' and 'Worked for 2m 13s >' are one grey 16/28 line (#333 / #4b4b4b), no border, same left edge as body (39, 143). Live: a 16px #222 headline with chevron, muted #696969 streaming body 16/24 and an underlined 'Answer now' link (38).
- Activity panel: 400 CSS wide, border-left 1px #e7e7e7, 52 CSS header holding a 208x44 CSS #e9e9e9 pill track with a 100x36 white selected pill, X at right (44, 45, 46, 48). Body rows: 20 CSS glyph, 10 gap, 16/24 text, 16 CSS between entries; glyphs are model knot (thoughts), magnifier ('Searched for'), favicon ('Read reuters.com'), globe + shimmer ('Reading...'); domains in link blue. Footer: rule #f3f3f3, two 180x36 pills (Stop outline, Update #0f0f0f).
- Run summary is plain muted text ('Research completed in 5m - 23 sources - 63 searches', #737373) with a grey check-disc at the end of the log.
- Citations: inline pill 18 CSS tall, #f6f6f6, no border, ~10px #535353; report footer collapses them to a 161x39 'Sources' pill (1px #e5e5e5) with stacked favicons.
- Progress card (44): 417x91 CSS, 1px #dedede, radius ~16, title 16, 8px track, 36 stop disc. Insight card (55): 480x135, thumb 82, 5px bar #484848 on #e5e5e5.
- Notice card (44): 640x74 CSS above the composer: 'Multitasking - Try asking ChatGPT something else while you wait', X dismiss.
- System notices (85, 86, 96): centred 13/24 #424242, bold actor, bold 'Today' header.
- **Rasikh agent feed row anatomy:** [20px glyph][10px gap][16/24 text, domain or counterparty in accent][optional muted timestamp]. Three states: DID (grey disclosure line, expands to log), WAITING ON (shimmer label + 5px bar + stop disc in a bordered card), NEEDS APPROVAL (decision card).

### 3.6 Approval and confirmation patterns (nearest analogues)
- Decision card (53, 54): thread-width 768 CSS card, 1px #e8e8e8, ~24 radius, ~20 padding, 364x377 media tile #f3f3f3, title 16/600, muted meta, then two equal 358x36 outline pills ('x Not interested' / 'check More like this') 9 CSS apart, and a centred muted 'Skip' ~28 CSS below. Promo variant (51): single 337x42 black pill, radius fit 25.
- Confirm dialog (78, 210, 107, 170): 448 CSS wide, 177-193 tall, 16 padding, title 18, body 16 with the object in bold, helper 14 #7d7d7d, right-aligned 36 CSS pills ~12 apart: outline Cancel + #e0302c Delete.
- Consent card (131, 123): 400 CSS modal, inner bordered 368 card with three titled paragraphs split by hairlines ('Permissions always respected', 'You're in control', 'Connectors may introduce risk'), a collapsed 'See app actions' row, full-width black pill. 123 puts a 32x20 switch ('Reference memories and chats') above bold-lead-in disclosures.
- **Rasikh approval card:** title / meta / fact rows / two 36px pills (Decline outline, Approve ink) / 'Not now' link. Deliberate deviation from the pack: make the primary action visually primary (ink fill) because approvals have a clear affirmative; keep the pair equal width.

### 3.7 Settings, trust-passport toggles, memory, data controls
- Modal 682x601 CSS, ~16 radius, 180 CSS left nav #f9f9f9 (36 rows, active pill #efefef), right pane padding 16, 18/regular title over a #e2e2e2 rule ~60 CSS from the top. Rows: 60 (label only), 77 (+1 helper line), 93 (+2); hairline #f2f2f2; Personalization page uses spacing only.
- Control vocabulary right-aligned in each row: value + chevron trigger, outline pill (Manage 68x29, footer pills 36), red-outline pill for destructive, 32x20 switch (ON #0285ff, OFF #e3e3e3), value + chevron-right drill-in.
- Summarising popover (195-199): trigger text reads 'Push', 'Email', 'Push, Email', 'Off'; popover 118x54 holds label + switch.
- Memory (205-209): 682x742 modal, 45 CSS rows with #eaeaea dividers, three-dot menu on hover only, 320x38 search pill, Delete confirmed by the 448 dialog naming the memory.
- **Rasikh trust passport:** one settings-style sheet per party; each field row = 14px label, 12.5px helper ('Landlord sees: verified income band only'), summarising trigger 'Landlord, Bank' that opens the popover of switches. 'Revoke all' is a red-outline pill -> confirm dialog.

### 3.8 Language selector
- Settings row 'Language' with value + chevron (173) opens a 222 CSS popover: 'Auto-detect' (check) and 'English (US)' pinned, 1px #e9e9e9 divider, then names in native script (Arabic listed); 36 CSS rows, 16 padding, ~18 radius (188, 189). Switching to Chinese relocalises everything with identical metrics (190-194).
- **Rasikh:** value + chevron row with two entries (English, العربية) and a check; for RTL mirror with logical properties (no reference exists).

### 3.9 Sidebar history
- 260 CSS, #f8f8f8, 1px #e9e9e9 border. Rows 36 CSS tall and pitch, active fill #e9e9e9 with ~8 radius and 6 CSS inset, history rows have no icon and text starts at 16 CSS, section label 14px #7f7f7f, unread dot 7 CSS #055dc1. Dark: #181818.
- **Rasikh:** newcomer app uses it as a drawer listing 'Roadmap steps' and past agent runs with the same rows.

### 3.10 Empty chat
- 28/regular #000 heading, centred on the pane centre, ink top at 34% of viewport; baseline ~54 CSS above the composer. No chips, cards or suggestions under it (22, 77, 169, 238).
- **Rasikh:** greeting 'Welcome to Abu Dhabi, Sara.' above the composer; put next-step shortcuts in the roadmap, not under the composer.

## 4. ChatGPT vs Platform (chat comparison)

| Topic | ChatGPT (use for newcomer app) | Platform (use for dashboards) |
|---|---|---|
| Thread | 768 column, unboxed assistant, right-aligned #f4f4f4 user bubble | 644 pane, 32 padding, no bubbles, 12/600 role captions 'User' / 'Assistant' |
| Body type | 16/28 #000 | 14/21 #000, headings 16/600 |
| Composer | 768x57.5 pill, 28 radius, border #ddd, send #000 | 613 card (238 with 3 variable rows), ~28 radius, border #ebebeb, send #181818, 'Auto-clear' + paperclip ghost |
| Send states | waveform / arrow / stop on #e9e9e9 | arrow / stop on #ececec |
| Feedback | 6 icon row, pressed chip | ghost 'Good' / 'Bad' buttons, mono stats '23.9s up 2,002t down 695t', 'resp_...' id + copy |
| Long answers | scroll + Activity side panel | 'Expand v' / 'Collapse ^' |
| Attachments | in-pill tray, 56px thumbs / 316x56 file cards | thumbnail with X badge in the card |
| Step disclosure | 'Thought for 42s >' grey line, Activity panel | 'Reasoning' heading rendered inline in the answer |

## 5. Mobile / narrow variants

No phone-width capture exists in either pack. Derived (not measured) adaptation: column 100% minus 16 gutters; composer same 28 radius and 36 controls with 44px touch padding; user bubble max-width ~85%; sidebar -> drawer; 400px Activity panel -> bottom sheet; settings modal -> full-screen sheet with the 180px nav collapsed to a list.

## 6. Dark mode (single chat capture, 184)

Canvas #212121, sidebar #181818, user bubble and composer #303030, composer border #363636, rule #464646, body text #fff, send disc #fff, placeholder ~#c7c7c7. Layout metrics identical to light.

## 7. Token tables

### 0 Scale and crop

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `chat.scale.px-per-css` | both | n/a | 1.27 image px per CSS px (1920 px image = ~1512 CSS px viewport); every value below is CSS px | sidebar 330px=260, composer 977px=768, header rule y=66px=52, row pitch 45.8px=36, confirm dialog 570px=448, auth column 431px=340 (screens 22,24,44,78,203,232); same component sizes on Platform (send button 45px=36) | estimated |
| `chat.viewport.crop` | both | n/a | 1920x1200 (chatgpt) / 1920x1205 (platform); bottom 120px Mobbin bar removed before every measurement | all screens | measured |

### 1 Thread column

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `chat.thread.max-width` | chatgpt | light | 768px, centred in the main pane (242px free each side at a 1512px viewport) | ink bbox x=637/638..1611/1612 on 24,25,39,63,64,70,184,192 | measured |
| `chat.thread.max-width.with-panel` | chatgpt | light | 640px while the 400px side panel is open | notice card and composer 813px/1.27 on 44,45,46,48 | measured |
| `chat.thread.padding-top` | chatgpt | light | 12px between 52px header and first user bubble (bubble top y=81 vs header rule y=66) | 24,39,52,53 | measured |
| `chat.turn.gap` | chatgpt | light | ~48px ink-to-ink from user bubble bottom to first assistant line (59-64 image px) | 24 (61px to heading), 39 (64), 52 (59), 53 (59) | measured |

### 2 User message

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `chat.user.bg` | chatgpt | light | #f5f5f5 (modal value, 7 of 12 screens); #f2f2f2 on 24,44,52; #f3f3f3 on group chat 86,96. Capture-to-capture drift only | 39,45,53,31,63,192,42 (#f5f5f5); 24,44,52 (#f2f2f2); 86,96 (#f3f3f3) | measured |
| `chat.user.bg` | chatgpt | dark | #303030 | 184 (also the composer fill) | estimated |
| `chat.user.radius` | chatgpt | light | 18px; one-line bubble is 37px tall so it reads as a near pill | contour fits 18.1-19.7px incl. anti-alias on 24,31,39,52,53 | measured |
| `chat.user.padding-x` | chatgpt | light | 16px | text-left minus bubble-left = 21-22 image px on 24,31,39,52 | measured |
| `chat.user.padding-y` | chatgpt | light | 6px single line (bubble 37px = 24 + 13); 12px multi line (bubble 72px = 2x24 + 24) | 24 (47px), 39 (92px), 31 (403px), 52 (92px) | measured |
| `chat.user.line-height` | chatgpt | light | 24px (30.5 image px pitch inside bubble) | 39,31,52,53 | measured |
| `chat.user.font-size` | chatgpt | light | 16px 400 #000 (cap height 14-15 rows) | 24,39,31 | estimated |
| `chat.user.max-width` | chatgpt | light | 70% of thread = 538px before wrapping (683/687 of 976 image px) | 39,31,52,53 | measured |
| `chat.user.align` | chatgpt | light | right edge flush with thread right edge (x=1612); no avatar, no name | 24,39,52,53 | measured |
| `chat.user.image` | chatgpt | light | attached image 387x258px, right aligned, 5px above the bubble | 31 | estimated |

### 3 Assistant message

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `chat.assistant.container` | chatgpt | light | unboxed: no bubble, avatar, name label or border; text sits on the canvas at full column width | 24,25,39,63,64,70,184,192 | measured |
| `chat.assistant.line-height` | chatgpt | light | 28px (35.5 image px pitch) | 39 (286..392), 24, 25, 44 | measured |
| `chat.assistant.font-size` | chatgpt | light | 16px 400 #000 (cap rows 15 on 'S' and 'L') | 39,25 | estimated |
| `chat.assistant.color` | chatgpt | light | #000 (darkest px #000000); secondary text steps down by grey value, not weight | 39,25,44,24 | measured |
| `chat.assistant.paragraph-gap` | chatgpt | light | 16px between paragraphs (28px pitch + 16 = 44px) | 44,45 | estimated |
| `chat.assistant.list` | chatgpt | light | item pitch 28px with no extra gap; text indented 32px from column edge; bullet glyph centre ~13px in | 24,25,39,64 | measured |
| `chat.assistant.heading.h2` | chatgpt | light | 24px 600 (cap 22 rows) | 39,45,46 | estimated |
| `chat.assistant.heading.h3` | chatgpt | light | 20px 600, optional leading emoji (cap 18 rows) | 24,25,64 | estimated |
| `chat.assistant.heading.h4` | chatgpt | light | 18px 600 (cap 17 rows incl. overshoot) | 24 | estimated |
| `chat.assistant.rule` | chatgpt | light | 1px solid #d9d9d9 (#cfcfcf at darkest); ~33px clear above and below | 24,25,64,70 | measured |
| `chat.assistant.text.dark` | chatgpt | dark | #ffffff body, rule #464646 | 184 | estimated |

### 4 Message action row

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `chat.actions.icon` | chatgpt | light | 16px outline glyph (19-21 image px) centred in a 32px hit area; order copy, thumbs-up, thumbs-down, share, regenerate, more | 25,64,62,44,45,48,70 | measured |
| `chat.actions.pitch` | chatgpt | light | 32px (40.5 image px between glyph centres, 6 screens) | 25,64,62,44,45,48 | measured |
| `chat.actions.offset-x` | chatgpt | light | first glyph centre sits 9.5px inside the text edge (12 image px), so the 32px hit area starts ~6px left of the thread edge | 25,64,62,44,45,48 | measured |
| `chat.actions.margin-top` | chatgpt | light | ~23px from last text ink bottom to icon top (29 image px) | 25 | estimated |
| `chat.actions.icon-color` | chatgpt | light | #363636 darkest sampled px (1.5px strokes under-sample; true stroke likely #2f2f2f-#5d5d5d) | 25,64,70 | estimated |
| `chat.actions.pressed` | chatgpt | light | 32px square chip #f2f2f2, ~8px radius, glyph switches to filled | 70 | estimated |
| `chat.actions.copied` | chatgpt | light | copy glyph swaps to a check glyph in the same slot; no toast | 64 | estimated |

### 5 Activity, steps and disclosures

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `agent.disclosure.collapsed` | chatgpt | light | single line 16px/28px 400, #333 ('Thought for 42s') or #4b4b4b ('Worked for 2m 13s'), trailing 12-14px chevron #555, no border or fill, left aligned with body | 39,143 | estimated |
| `agent.disclosure.live` | chatgpt | light | headline 16px #222 + chevron; muted streaming body 16px/24px #696969 (30px pitch) under it; right-aligned underlined 'Answer now' 16px #565656 | 38 | estimated |
| `agent.status.text` | chatgpt | light | plain 16px sentence-case line, no spinner or icon: 'Analyzing image' #404040, 'Gathering requirements' #2d2d2d, 'Research completed in 5m - 23 sources - 63 searches' #737373 | 31,52,53,55,45 | measured |
| `agent.shimmer` | chatgpt | light | live label runs a travelling highlight: base #2d2d2d, highlight band #8f8f8f ('Gathering requ\|irements'; 'Reading...' #363636/#848484); duration not measurable | 52,44 | estimated |
| `agent.panel.width` | chatgpt | light | 400px right panel, border-left 1px #e7e7e7, header 52px with rule #f2f2f2 at y=66 image px | 44,45,46,48 | measured |
| `agent.panel.tabs` | chatgpt | light | segmented track 208x44px #e9e9e9 pill; selected segment 100x36px white pill, 4px inset; 16px labels; X button at right | 44,45,46,48 | measured |
| `agent.panel.step` | chatgpt | light | 20px glyph + 10px gap + 16px/24px #000 text; glyph column starts ~23px from panel edge; entries separated by 16px extra; link domains blue (darkest px #1f3d5e, true link ~#2d5484) | 44,45,46 | estimated |
| `agent.panel.footer` | chatgpt | light | rule #f3f3f3; two 180x36px pills, 8px gap, 16px side padding: Stop (white, 1px #d5d5d5) and Update (#0f0f0f fill, white text) | 44 | estimated |
| `agent.progress-card.research` | chatgpt | light | 417x91px card, 1px #dedede + soft shadow, radius ~16, 16px title #000, blue '2 sources' link, 8px track #e7e7e7 with #020202 fill, 36px stop disc with 1px border | 44 | estimated |
| `agent.progress-card.insight` | chatgpt | light | 480x135px card, 1px #e2e2e2, radius ~21, 82px thumb (radius ~10) with count badge, 16px/24px text #292929, 5px track #e5e5e5 / fill #484848 | 55 (container family also in 52,53) | estimated |
| `agent.notice-card` | chatgpt | light | 640x74px card directly above composer (8px gap), 1px #e1e1e1, 16px medium title #000 + 16px body #383838, X dismiss at right | 44,45,46 | estimated |
| `agent.citation-chip` | chatgpt | light | inline pill ~18px tall (22-24 image px), fill #f6f6f6 (#f3f3f3 variants), no border, ~10px text #535353-#5e5e5e, sits on the text baseline | 39,45,46,48,86 | measured |
| `agent.sources-pill` | chatgpt | light | 161x39px white pill, 1px #e5e5e5, stacked 20px favicons + 14px 'Sources' | 48 | estimated |
| `agent.task-row` | chatgpt | light | two-line row 71px pitch: title 14-15px #000, meta 13px #787878, right-aligned status text #494949 + 26px stop circle (#f0f0f0, black square), hairline #f3f3f3 | 137 (129,145 per survey) | estimated |
| `agent.system-notice` | chatgpt | light | centred 13px/24px #424242 with bold actor name; bold 'Today' time header; pitch 24px | 85,86,96 | estimated |
| `agent.participant` | chatgpt | light | other party: 28px avatar + 12px #4f4f4f name above #f3f3f3 bubble 44px tall (1 line); own bubble right aligned #f5f5f5 | 86,96 | estimated |

### 6 Composer

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `composer.width` | chatgpt | light | 768px = thread width (977 image px) | 22,23,24,25,59,38 | measured |
| `composer.height.one-row` | chatgpt | light | 57.5px (73 image px) | 22,23,24,25,59 | measured |
| `composer.height.two-row` | chatgpt | light | 104px (131-132 image px) when a tool-chip row exists; +24px per extra typed line (34 vs 41: +30 image px) | 36,41,46,52,34 | measured |
| `composer.border` | chatgpt | light | 1px solid #dddddd (#dedede-#e1e1e1) | 22,24,28,62 | measured |
| `composer.radius` | chatgpt | light | 28px at every height (contour fits 28.3, 29.1, 29.9) | 22,52,62 | estimated |
| `composer.shadow` | chatgpt | light | soft low shadow below only (#eee to #fefefe over ~7 image px); est. 0 2px 6px rgba(0,0,0,.05) | 22,24,25 | estimated |
| `composer.padding` | chatgpt | light | 11px around 36px controls (14 image px top, bottom, right) | 22,25,59 | measured |
| `composer.placeholder` | chatgpt | light | 'Ask anything' 16px #777777 (darkest px), text starts 55px from pill edge | 22,39 measured; 25,59,38 same by eye | estimated |
| `composer.send` | chatgpt | light | 36px disc #000 (45 image px): arrow-up when text exists, waveform when empty; disabled #a7a7a7 | 22,23,25,59,62 | measured |
| `composer.send.streaming` | chatgpt | light | disc #e9e9e9 holding a 10px (13 image px) square #0e0e0e | 24,38 measured; 46,52,53 same by eye | estimated |
| `composer.plus` | chatgpt | light | 14px glyph (18 image px) centred 29px from pill edge (36px ghost target est.); opens a 231x239px menu with 36px rows | 22,25,59,26 | estimated |
| `composer.mic` | chatgpt | light | ghost glyph 16px tall (12.6px wide), no fill, 21px left of the send disc | 22,25,59 | estimated |
| `composer.mode-chip` | chatgpt | light | blue text+icon #1681e4 (no fill), 14-16px, 8px right of '+'; placeholder changes ('Get a detailed report') | 41,46,52,34,55 | estimated |
| `composer.quote-row` | chatgpt | light | 44px bar #f9f9f9 inset 4px at top of pill: reply glyph, quoted text #3b3b3b, X; pill grows to 105px | 62 (61 per survey) | estimated |
| `composer.disclaimer` | chatgpt | light | 13px #454545 centred 12px under the pill (ink top 15 image px below border), link underlined | 24,25,38,39 | estimated |
| `composer.offset-bottom` | chatgpt | light | pill bottom is 32px above viewport bottom (41 image px); home composer top at 42% of viewport height (y=503/1200) | 24,25,38,39,44,22 | measured |
| `composer.scroll-button` | chatgpt | light | 32px white circle, 1px #ddd, arrow-down, centred above pill when content is below the fold | 24,39,44,45 | estimated |
| `composer.voice` | chatgpt | light | black waveform bars replace the placeholder; X and check ghost buttons replace mic and send; pill size unchanged | 58 | estimated |
| `composer.dark` | chatgpt | dark | fill #303030, border #363636, send disc #fff | 184 | estimated |

### 7 Attachments

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `attach.image-thumb` | chatgpt | light | 56px square, ~12px radius, 8px gap, 15px black X badge at top-right (pencil badge optional) | 27,28 | estimated |
| `attach.file-card` | chatgpt | light | 316x56px, 1px #e8e8e8, ~12px radius; 39px icon tile ~8px radius (PDF #f0423c, other #909090); name 14px/600 #000 over type 14px #444; X badge 15px black | 28 (27 image variant) | estimated |
| `attach.tray` | chatgpt | light | tray sits inside the pill, 11px from its top/left; pill grows to 130px (165 image px) | 28,27 | estimated |
| `attach.state.processing` | chatgpt | light | no spinner or bar: muted line 'Analyzing image' #404040 below the sent message; no confidence or percent UI exists in the pack | 31 | estimated |

### 8 Empty chat

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `empty.heading` | chatgpt | light | 28px/regular #000 centred on pane centre; ink top y=410 (34% of viewport); baseline ~54px above composer top | 22,36,40,49,77,169,172,238 | measured |
| `empty.suggestions` | chatgpt | light | none on the chat home: heading + composer only; chips exist only inside onboarding and the marketing marquee | 22,77,169,238 | measured |

### 9 Sidebar history

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `sidebar.width` | chatgpt | light | 260px, bg #f8f8f8, border-right 1px #e9e9e9 (x=329 image px) | 22,24,25,39,44 | measured |
| `sidebar.row` | chatgpt | light | 36px pitch and height for nav and history rows; active fill #e9e9e9 (#e8e8e8-#eaeaea), ~8px radius, inset 6px (x 7..322 image px) | 24,25,39,44 | measured |
| `sidebar.history.type` | chatgpt | light | 14px #000, no icon, text starts 16px from edge, ellipsis on overflow; section label 14px #7f7f7f | 24,39,44 | measured |
| `sidebar.unread-dot` | chatgpt | light | 7px disc #055dc1 at the row's right end | 24,38,39 | measured |
| `sidebar.dark` | chatgpt | dark | sidebar #181818, canvas #212121, active row #242424 | 184 (+survey 182-187) | estimated |

### 10 Settings, memory, data controls

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `settings.modal.size` | chatgpt | light | 682x601px, white, ~16px radius, 1px #cccccc outer edge + diffuse shadow; page behind #f0f0f0 + blur | 174,175,177,195,203 | measured |
| `settings.modal.nav` | chatgpt | light | 180px column #f9f9f9; 36px rows, active pill 168x36px #efefef; X close top-left | 174,175,177,203 | measured |
| `settings.pane.title` | chatgpt | light | 18px regular #000, 16px pane padding, rule 1px #e2e2e2 ~60px below modal top | 174,177,203,175 | measured |
| `settings.row.height` | chatgpt | light | 60px single line; 77px with one description line; 93px with two | 177 (76 image px), 174 (98/118), 203 (77) | measured |
| `settings.row.divider` | chatgpt | light | 1px #f2f2f2 hairline, no card per row (Personalization page uses spacing only) | 174,177,203,175 | measured |
| `settings.row.label` | chatgpt | light | 14px #000; helper 12-13px #808080 on 16px line, ~60% width | 174,203,175 | estimated |
| `settings.switch` | chatgpt | light | 32x20px pill; ON #0285ff, OFF #e3e3e3 (#cdcdcd in modal 98); white knob ~16px | 99,203,195,123 | measured |
| `settings.value-trigger` | chatgpt | light | borderless 14px value + chevron-down, right aligned; shows a summary of the choice ('Push, Email') | 174,175,177,188 | measured |
| `settings.pill-button` | chatgpt | light | in-row outline pill ~29px tall ('Manage' 68px wide); footer pills 36px (Cancel 72px, Save 60px #0d0d0d) | 203,177,174 | measured |
| `settings.pill-button.destructive` | chatgpt | light | outline pill with red text and red 1px border ('Delete all') | 177 | estimated |
| `settings.popover` | chatgpt | light | 118x54px card, 1px #dbdbdb, soft shadow, 'Push' label + switch; trigger text updates to Push / Email / Push, Email / Off | 195 (196-198 per survey) | estimated |
| `settings.input` | chatgpt | light | 468x38px field, 1px #e8e8e8, 14px text, 14px label above | 203,175 | estimated |
| `memory.modal` | chatgpt | light | 682x742px, ~18px radius, title 18px + 14px #3d3d3d description, close X top-right | 205,208,210 | estimated |
| `memory.row` | chatgpt | light | 45px pitch, 1px #eaeaea dividers, 14px text; '...' menu (3 dots ~13px) appears only on hover; search pill 320x38px | 205,208,210 | estimated |
| `lang.menu` | chatgpt | light | 222px popover, 36px rows, 16px side padding; 'Auto-detect' (check at right) and 'English (US)' pinned, 1px #e9e9e9 divider, then native-script names (Arabic listed) | 188,189 | estimated |
| `lang.trigger` | chatgpt | light | settings row 'Language' with value + chevron (same pattern as Appearance) | 188 (173,182 per survey) | estimated |

### 11 Dialogs, consent and decision cards

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `dialog.confirm.size` | chatgpt | light | 448px wide (570 image px incl. border); 177px (name line + helper) to 193px (3-line body); 16px padding; ~18px radius | 78,107,210 (170 per survey) | estimated |
| `dialog.confirm.type` | chatgpt | light | title 18px #000; body 16px with the object name in bold; helper 14px #7d7d7d with underlined link | 78,210 | estimated |
| `dialog.confirm.actions` | chatgpt | light | right aligned 36px pills ~12px apart: Cancel (white, 1px border, 72px) + destructive #e0302c (68px) or primary #0d0d0d | 78,107,210 | estimated |
| `consent.card` | chatgpt | light | 400px modal; inner bordered card 368px with 3 titled paragraphs (16px title, 14px #5d5d5d body) split by 1px hairlines; 'See app actions' disclosure row 42px; full-width black pill 366x42px | 131,123 | estimated |
| `consent.toggle-row` | chatgpt | light | 14px label + 12px helper + 32x20px switch above bold-lead-in 12px disclosures ('You're in control.') | 123 | estimated |
| `decision.card` | chatgpt | light | thread-width (768px) card, 1px #e8e8e8, ~24px radius, soft shadow, ~20px padding; media tile 364x377px #f3f3f3 ~12px radius; right column title 16px/600 + muted meta | 51 (radius 25 fit),53 (54 per survey) | estimated |
| `decision.actions` | chatgpt | light | two equal outline pills 358x36px, 9px gap ('x Not interested' / 'check More like this') inside the card; 'Skip' text 14-16px #424242 centred ~28px below the card | 53 (54 per survey) | estimated |
| `decision.cta.single` | chatgpt | light | one black pill 337x42px ('Get started') + 16px #5d5d5d body | 51 | estimated |
| `toast` | chatgpt | light | #008735, 40px tall, 13px from top, centred on the viewport (x=960) not the pane, 253-305px wide, ~8px radius, white 14px text + check + X; dark variant #000 | 67,88,144,133,204,201,211 | measured |

### 12 Platform pack chat (comparison)

| token | pack | theme | value | evidence screens | confidence |
|---|---|---|---|---|---|
| `platform.chat.composer` | platform | light | card 613px wide (779 image px); 238px tall with 3 variable rows; 1px #ebebeb-#efefef; ~28px radius; soft shadow below; paperclip + 'Auto-clear' ghost button + 36px send | 43,44,45,86 | measured |
| `platform.chat.send` | platform | light | 36px disc #181818-#1a1a1a (ChatGPT #000); stop state disc #ececec with ~10px square | 43,44,45,66 | measured |
| `platform.chat.pane` | platform | light | chat pane 644px (x 1091..1908 image), text starts 32px from the 1px #f6f6f6 divider, canvas #fff | 44,45,86 | estimated |
| `platform.chat.role-caption` | platform | light | 12px/600 #0f0f0f 'User' and 'Assistant' above plain text; no bubbles, no avatars | 44,45,86 | estimated |
| `platform.chat.body` | platform | light | 14px/21px #000 (26.5-27 image px pitch); section headings 16px/600 | 44,45,86,66 | estimated |
| `platform.chat.feedback-row` | platform | light | ghost 'Good' / 'Bad' buttons (16px thumb glyph + 14px label); centred mono stats line 12px '23.9s up 2,002t down 695t' #0f0f0f; 'resp_...' id + copy icon top-right #393939 | 45,85,86 | estimated |
| `platform.chat.expand` | platform | light | 'Expand v' / 'Collapse ^' text control 12-13px #414141 under a faded long answer | 85,86,66 | estimated |
| `platform.chat.variable-row` | platform | light | 40px rows with 1px #f3f3f3 hairlines: key pill + colon + value inside the composer card | 43,44,45,86 | estimated |
| `platform.chat.attachment` | platform | light | thumbnail ~47x59px with 20px black X badge at its top-right inside the card | 43 | estimated |

## 8. CSS snippet (49 lines)

```css
/* Rasikh chat + agent tokens. Source: ChatGPT web Mar 2026, CSS px at 1.27 image px per CSS px. */
:root{
  --chat-col:768px; --chat-col-panel:640px; --panel-w:400px;
  --ink:#0d0d0d; --ink-2:#4b4b4b; --ink-3:#7f7f7f; --canvas:#fff; --side:#f8f8f8;
  --bubble:#f4f4f4; --line:#e8e8e8; --line-soft:#f2f2f2; --rule:#d9d9d9; --chip:#f6f6f6;
  --accent:#0285ff; /* swap for the Rasikh accent: ON switch, mode chip, links, unread dot */
  --danger:#e0302c; --ok:#008735;
  --r-bubble:18px; --r-composer:28px; --r-card:24px; --r-file:12px; --r-modal:18px;
  --shadow-composer:0 2px 6px rgba(0,0,0,.05);
}
[data-theme=dark]{--ink:#fff;--canvas:#212121;--side:#181818;--bubble:#303030;--line:#363636;--rule:#464646;--ink-3:#9b9b9b}
.chat-col{max-inline-size:var(--chat-col);margin-inline:auto;padding-inline:16px}
.msg-user{width:fit-content;max-inline-size:70%;margin-inline-start:auto;background:var(--bubble);
  border-radius:var(--r-bubble);padding:6px 16px;font:400 16px/24px var(--font)}
.msg-user.is-multiline{padding-block:12px}
.msg-ai{font:400 16px/28px var(--font);color:var(--ink);margin-block-start:48px}
.msg-ai p{margin-block:16px}.msg-ai li{margin:0}
.msg-ai h2{font:600 24px/1.3 var(--font)}.msg-ai h3{font:600 20px/1.3 var(--font)}
.msg-ai hr{border:0;border-block-start:1px solid var(--rule);margin-block:32px}
.msg-actions{display:flex;margin-inline-start:-6px;margin-block-start:23px}
.msg-actions button{inline-size:32px;block-size:32px;border-radius:8px;display:grid;place-items:center;color:#5d5d5d}
.msg-actions button[aria-pressed=true]{background:#f2f2f2}
.composer{max-inline-size:var(--chat-col);min-block-size:57px;padding:11px;background:var(--canvas);
  border:1px solid #ddd;border-radius:var(--r-composer);box-shadow:var(--shadow-composer)}
.composer textarea{font:400 16px/24px var(--font)}.composer ::placeholder{color:#777}
.send{inline-size:36px;block-size:36px;border-radius:50%;background:#000;color:#fff}
.send[data-state=streaming]{background:#e9e9e9;color:#0e0e0e}.send[disabled]{background:#a7a7a7}
.chip-cite{block-size:18px;padding-inline:6px;border-radius:999px;background:var(--chip);font-size:10px;color:#535353}
.file-card{display:flex;align-items:center;gap:11px;inline-size:316px;block-size:56px;padding:8px 12px;
  border:1px solid var(--line);border-radius:var(--r-file);background:var(--canvas)}
.file-card .tile{inline-size:39px;block-size:39px;border-radius:8px;background:#909090;flex:none}
.agent-row{display:flex;gap:10px;font:400 16px/24px var(--font)}
.agent-row+.agent-row{margin-block-start:16px}.agent-row .glyph{inline-size:20px;block-size:20px;flex:none}
.agent-disclosure{font:400 16px/28px var(--font);color:#4b4b4b;background:none;border:0}
.shimmer{background:linear-gradient(90deg,#2d2d2d 40%,#8f8f8f 50%,#2d2d2d 60%) 0 0/200% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;animation:sh 1.6s linear infinite}
@keyframes sh{to{background-position:-200% 0}}
.progress{block-size:5px;border-radius:99px;background:#e5e5e5}
.progress>i{display:block;block-size:100%;border-radius:inherit;background:#484848}
.decision{padding:20px;border:1px solid var(--line);border-radius:var(--r-card);box-shadow:0 1px 4px rgba(0,0,0,.05)}
.decision .pair{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.decision .pair button{block-size:36px;border:1px solid var(--rule);border-radius:999px;background:var(--canvas)}
.decision .skip{display:block;margin:28px auto 0;color:#424242}
.dialog-confirm{inline-size:448px;padding:16px;border-radius:var(--r-modal);background:var(--canvas)}
.switch{inline-size:32px;block-size:20px;border-radius:99px;background:#e3e3e3}
.switch[aria-checked=true]{background:var(--accent)}
.setting-row{display:flex;justify-content:space-between;gap:16px;min-block-size:60px;padding-block:12px;
  border-block-end:1px solid var(--line-soft);font:400 14px/20px var(--font)}
.setting-row small{display:block;font:400 12.5px/16px var(--font);color:#808080}
```

## 9. Rules

1. Chat column is 768px max, centred; with a 400px side panel it narrows to 640px. On phones it is 100% minus 16px gutters.
2. User messages are right-aligned bubbles hugging their text: #f4f4f4 fill, 18px radius, 16px side padding, 6px vertical padding on one line and 12px on multi-line, max 70% of the column, 16px/24px text.
3. Assistant output is never boxed: no bubble, avatar, name label or border. Text is 16px/28px on the canvas, paragraph gap 16px, list items 28px pitch with no extra gap.
4. Separate answer sections with a 1px #d9d9d9 rule and ~32px clear on both sides; headings are 600 weight at 24/20/18px.
5. Put the 6-icon action row (copy, up, down, share, retry, more) under every finished assistant turn: 16px glyphs on 32px hit areas, 6px negative start margin, ~23px below the last line. Pressed state is a #f2f2f2 32px chip with a filled glyph; copy swaps to a check in place.
6. Loading is words plus quiet motion, never spinners: a plain 16px status line ('Analyzing image'), a shimmering label (#2d2d2d base, #8f8f8f highlight), or a 5px determinate bar on #e5e5e5.
7. Collapse finished work into one grey disclosure line ('Thought for 42s', 'Worked for 2m 13s') with a trailing chevron; expand into the activity log, never inline.
8. Agent log rows are 20px glyph + 10px gap + 16px/24px text; separate entries by 16px; source domains are the only coloured text (accent link).
9. Citations are inline 18px grey pills (#f6f6f6, no border, ~10px text) placed after the claim; collapse them to one 'Sources' pill with stacked favicons at the end of a report.
10. Composer is a 28px-radius card at thread width: 1px #ddd border, soft shadow below only, 11px inner padding, 36px controls. One row = 57.5px; a tool-chip row makes it 104px; each extra typed line adds 24px.
11. The composer action button morphs by state and keeps its 36px size: waveform when empty, arrow-up with text, black square on a #e9e9e9 disc while streaming, #a7a7a7 when disabled.
12. Attachments render as a tray inside the top of the composer: 56px thumbs and 316x56px file cards (1px #e8e8e8, 12px radius, 39px type tile, bold name over muted type line, 15px black X badge).
13. Mode or tool state is a quiet accent-coloured text chip beside '+' (no fill), and the placeholder changes to match the mode.
14. Approval is a bordered thread-width card (1px #e8e8e8, 24px radius, ~20px padding): summary, fact rows, two equal 36px outline pills side by side, and a centred muted 'Skip' link below it. Irreversible steps get a 448px confirm dialog with outline Cancel plus a solid action pill, 36px tall, right-aligned.
15. Per-item permissions use the settings row anatomy: 14px label, 12-13px #808080 helper, 32x20px switch right-aligned, 60-77px rows split by 1px #f2f2f2 hairlines, no card per row. Switch ON uses the accent, OFF is #e3e3e3.
16. When one row governs several channels or parties, show a borderless value trigger that summarises the state ('Landlord, Bank') and opens a small popover of label + switch rows.
17. Language picker is a value + chevron settings row that opens a 222px popover of 36px rows; each language is written in its own script, the selected one has a check, the default pinned above a 1px divider.
18. Success feedback for completed agent actions is a top-centred toast (centred on the viewport, 40px tall, 13px from top), past-tense copy, auto-dismissed.
19. Colour is signal only: neutral greys everywhere, one accent for ON/selected/link/unread, red only for destructive, green only for success toast.
20. Empty chat is a 28px regular heading centred above the composer at ~34% of the viewport height; no suggestion chips on the chat home.

## 10. Rasikh recommendations

1. NEWCOMER APP SHELL: adopt the ChatGPT thread as-is (full-width column, unboxed assistant text, right-aligned #f4f4f4 user bubble with 18px radius, 16/28 type) and the 28px-radius composer pinned 32px above the bottom. On mobile the column becomes 100% minus 16px gutters; the sidebar becomes a drawer and the 400px activity panel a bottom sheet (derived, not measured).
2. AGENT ACTIVITY FEED: model each row on the Activity panel (20px glyph + 10px gap + 16/24 text) and group by state. DID = collapsed grey disclosure line ('Rasikh did 4 things' with chevron, #4b4b4b); WAITING ON = a shimmering live label plus a 5px determinate bar on #e5e5e5 inside a bordered card with a 36px stop/cancel disc; NEEDS APPROVAL = the decision card below. Deliberate deviation: inside the chat and activity log ChatGPT uses no status colours; Rasikh may add one 8px status dot per row but must not tint rows.
3. APPROVAL REQUEST CARD: thread-width card, 1px #e8e8e8, 24px radius, ~20px padding. Anatomy top to bottom: 16px/600 title ('Back this hire?'), muted meta line, fact rows (14px label + #7d7d7d value, 1px #f2f2f2 rules), then two equal 36px pills ('Decline' outline / 'Approve' ink fill; deliberate deviation, the pack pairs two outline pills), and a centred 'Not now' text link 28px below. Use the 448px confirm dialog only for irreversible steps.
4. DOCUMENT UPLOAD: reuse the 316x56px file card (full width on phones), 39px type tile, bold filename, muted second line that carries the extraction state: 'Reading...' (shimmer) then 'Extracted 12 fields' then 'Needs review'. A 5px bar sits under the line while parsing. Confidence has NO reference in either pack: design it as a 18px grey pill (same spec as citation chips) reading 'High 96%'; treat it as invented, not measured.
5. TRUST PASSPORT: build it from the settings row (60-77px rows, 14px label, 12.5px grey helper, 32x20 switch) grouped under 18px section headings with a hairline. For per-party visibility use the summarising value trigger + popover (118x54px per row of switches) so each field row reads 'Visible to: Landlord, Bank'. Revoke-all is a red-outline pill that opens the 448px confirm dialog.
6. MEMORY / DATA CONTROLS ANALOGUE: use the 45px-pitch list from Saved memories (14px text, #eaeaea dividers, three-dot menu on hover only, 320x38 search pill) for 'What Rasikh knows about me', with Delete confirmed by the 448px dialog that names the item in bold.
7. LANGUAGE SELECTOR EN/AR: value + chevron row -> 222px popover with native-script names (English / العربية), check on the selected row, 36px rows. RTL is NOT shown anywhere in the packs: mirror with logical properties; the user bubble aligns to the inline-end edge, action row and sidebar flip, chevrons and arrows mirror, numerals stay as typed. Treat all RTL values as derived.
8. ACCENT: the packs use a blue family (switch ON #0285ff, mode chip ~#1681e4, unread dot #055dc1, activity links navy ~#2d5484) and near-black primary buttons. Rasikh should collapse these into its single brand accent in the same four slots (switch ON, mode chip, links, unread dot) and keep primary buttons ink (#0d0d0d). Do not copy the lavender 'Get Plus' pill, emoji headings or the green toast unless Rasikh adopts a success colour.
9. SPACING DENSITY: newcomer app uses ChatGPT values (16/28 body, 36px rows, 28px composer radius). Employer/landlord/bank dashboards should use the Platform chat values instead where a chat or review pane appears (14/21 body, 12px role captions, 613px composer card with 1px #ebebeb border, ghost Good/Bad row, mono stats line).
10. MOBILE / NARROW: neither pack contains a phone-width frame. Keep the radius ladder (18 bubble, 28 composer, 24 cards, 12 file cards), keep 36px controls (raise hit areas to 44px on touch by padding, not by growing glyphs), user bubble max-width 85% (estimated; 70% only makes sense at 768px).
11. STREAMING: no typing-dots or skeleton exists in the pack. Use (a) the stop-square state of the send button, (b) the shimmering status label, (c) a muted streaming reasoning body at 16px/24px #696969 under a one-line headline, and (d) the 'Answer now' style text link to skip waiting.
12. NOTICES: system lines inside the feed ('Landlord viewed your passport') use the centred 13px/24px #424242 notice style with a bold actor; transient confirmations use the top toast; blocking asks use the card or dialog, never the toast.

## 11. Open questions and uncertainties

- Pixel scale 1.27 is inferred, not read from an element of known size in the screenshots: it relies on recalled ChatGPT CSS values (260px sidebar, 768px column, 52px header, 36px rows, 448px dialog). Six such values agree within 0.4%, so every CSS value is probably within 1px, but there is no direct proof. Platform pack uses the same factor (send button 45px, 14px text cap height 13 rows) but only the survey and one cap-height check back it.
- Font sizes are inferred from cap-height rows (cap = 0.705em for the SF-like face, +-1 row of anti-alias); weights are judged by eye. Line heights (24/28/21px) are measured from line pitch and are firmer than the sizes.
- Text colours are the darkest sampled pixel in each run. On 1.5px strokes the true colour may be up to ~8 levels darker (icon row #363636, citation text #535353, helper #808080, placeholder #777777).
- User bubble fill varies across captures: #f2f2f2 (24,44,52), #f3f3f3 (86,96), #f5f5f5 (7 screens). It looks like capture drift, not a state; #f4f4f4 is the safe midpoint.
- Radii come from fitting a circle to the outer anti-aliased contour (rms <1px for bubbles, composer, file card, dialogs); shadow-heavy modals read 1-2px large. Treat modals as 16-20px.
- Shadows are described, not extracted: the composer's drop shadow fades over ~7 image px; the CSS value in the snippet is an estimate.
- No animation timings, easing or hover transitions are visible in stills. Only one hover/pressed state is captured (thumbs-down chip, screen 70) and one 'copied' check (64).
- No approval-request UI exists in the ChatGPT pack. The nearest analogues are the shopping decision card (53,54), the connector consent card (123,131) and confirm dialogs (78,107,210); the Rasikh approval card is a recombination, not a copy.
- No confidence meter, upload progress bar or extraction state exists in either pack (only 'Analyzing image' text and a 5px insight bar). Those designs are invented from available primitives.
- No mobile/narrow frame, no RTL frame and no dark-mode agent-activity or settings-toggle capture exists beyond the dark chat (184). Arabic appears only as one menu entry (188).
- Group-chat bubbles (86,96) are 44px tall on one line versus 37px in 1:1 chat (24), so ChatGPT uses two bubble paddings; only the 1:1 values are tokenised.
- The 400px activity panel and 640px column are measured from 3-4 captures that show the same research session; the footer, progress card and notice card are single-capture components.

## 12. Crop notes and evidence log

- Screen 24 (streaming) and 39 (reasoned answer) were the baseline for bubble, rhythm and composer; 25/64/70 for the action row; 44-48 for the Activity panel; 52-55 for insight and decision cards; 28/27/31 for attachments; 173-177, 195-199, 203 for settings and toggles; 205-210 for memory and confirm; 188-189 for language; 184 for dark; Platform 43-45, 66, 85, 86.
- Key pixel reads: composer top/bottom borders y=503/575 (22), send disc bbox 1555..1599 x 517..561, thread ink x=637..1612 (8 screens), user bubble 1237..1612 x 81..127 (24) and 930..1612 x 81..172 (39), Activity panel border x=1411-1412, toggle ON fill #0285ff, confirm dialog white run 676..1243 (210), toast #008735 at y=17..66 centred x=959.5.
- Open follow-ups for the lead: (1) verify platform scale on one more known element; (2) capture or design the Rasikh confidence pill and RTL mirror; (3) animation timings need a live reference, not stills.
