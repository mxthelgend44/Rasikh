# Survey: ChatGPT web Mar 2026, screens 80-159

Slice owner: survey-chatgpt-080-159. Pack: `.reference/chatgpt/ChatGPT web Mar 2026 {N}.png`, N = 80..159 (80 screens). Contact sheets 06-10 cover this slice. Mobbin footer (bottom 120 px) cropped before every measurement; app viewport = 1920 x 1200.

## 0. Pixel scale (READ FIRST)

These are NOT 1x captures of a 1920 px viewport. The pack is a ~1512 css px wide viewport (typical 14" laptop default) rendered into a 1920 px image, so **1 css px = 1.27 image px** (1920 / 1512 = 1.2698).

Evidence (all measured from pixels, each lands on a round CSS number only when divided by 1.27):

| Element | Image px | / 1.27 = css px | Screens |
|---|---|---|---|
| Sidebar width incl. 1px right border (border column at x = 329, #ececec) | 330 | 260.0 | 80, 119, 120 |
| Header height (hairline at y = 66, #f2f2f2, visible only when thread has scrolled) | 66-67 | 52 | 92 |
| Chat composer width (pill) | 974-977 | 767-770 (768 = max-w-3xl) | 80, 110, 92 |
| Home composer height | 70-73 | 55-57 (56) | 80, 110 |
| Send button circle | 44-45 | 35 (36) | 80, 92 |
| Sidebar row pitch (text baseline to baseline) | 45.8 | 36.0 | 80 |
| Modal widths (white box) | 568 / 650 / 730 | 447 / 512 / 575 (448 / 512 / 576) | 84, 99, 109 |

Everything below is reported in **css px (= image px / 1.27)** unless it says "img px". Where a value was not directly measurable it is labelled "estimated".

Font sizes are estimated from measured cap heights (cap height of the system UI sans = ~0.705 em). Colour hexes are sampled from flat regions.

## 1. Catalog (every index 80-159)

Themes: all light. "mixed" = light page with a dark surface (dark composer in Temporary Chat, black log terminal). No full dark-mode screens exist in this slice.

| idx | kind | theme | note |
|---|---|---|---|
| 80 | dropdown-menu | light | Home agenda screen; model picker menu open, ChatGPT checked |
| 81 | billing | light | Upgrade your plan, Personal tab: Free, Go, Plus, Pro |
| 82 | billing | light | Upgrade your plan, Business tab: Free versus Business |
| 83 | modal-dialog | light | Use ChatGPT together popover over blurred home; Start group chat |
| 84 | modal-dialog | light | Group link modal: URL input, Cancel, Copy link |
| 85 | chat-thread | light | New group chat: empty thread, system notices, Invite pill |
| 86 | chat-thread | light | Group chat: Sam Lee question, own reply, ChatGPT answer |
| 87 | chat-thread | light | Group chat answer scrolled: bonus tip and embedded map card |
| 88 | toast-banner | light | Green toast: Copied group link to clipboard |
| 89 | dropdown-menu | light | Group link modal with red Reset link, Delete link menu |
| 90 | toast-banner | light | Green toast: Group link has been reset; modal behind |
| 91 | toast-banner | light | Green toast: Group link has been deleted; Create link modal |
| 92 | dropdown-menu | light | Group chat header menu: People, Link, Rename, Report, Leave, Delete |
| 93 | modal-dialog | light | People modal: member list with admin tag, Add people |
| 94 | modal-dialog | light | Rename group chat modal with name input, Rename button |
| 95 | modal-dialog | light | Rename group chat modal, value Osaka trip typed |
| 96 | chat-thread | light | Osaka trip group chat after rename, unread dot in sidebar |
| 97 | settings-form | light | Customize ChatGPT modal empty: 0/1500, toggle off, Save disabled |
| 98 | settings-form | light | Customize ChatGPT with instructions 158/1500, Save enabled |
| 99 | settings-form | light | Customize ChatGPT, Respond automatically toggle switched on |
| 100 | modal-dialog | light | Report group chat step 1: radio reasons, Next disabled |
| 101 | modal-dialog | light | Report group chat: Something else selected, Next enabled |
| 102 | modal-dialog | light | Report step 2 reason list, Back and disabled Next |
| 103 | modal-dialog | light | Report step 2: I just don't like it selected |
| 104 | modal-dialog | light | Report step 3: optional details textarea, Back, Submit |
| 105 | modal-dialog | light | Report step 3 with typed details, Submit |
| 106 | modal-dialog | light | Thanks for your report confirmation modal, Close |
| 107 | modal-dialog | light | Leave group chat? confirm with red Leave button |
| 108 | app-shell-home | light | Home What are you working on? with Projects in sidebar |
| 109 | modal-dialog | light | Temporary Chat explainer: three titled points, Continue |
| 110 | empty-state | mixed | Temporary Chat start screen with dark composer |
| 111 | chat-composer | mixed | Temporary Chat, prompt typed, dark composer, active send |
| 112 | chat-thread | mixed | Temporary Chat answer with bullets, table, dark composer |
| 113 | app-shell-home | light | Collapsed sidebar rail; What's on the agenda today? |
| 114 | modal-dialog | light | Search chats palette: New chat, Yesterday, Previous 7 Days |
| 115 | loading-state | light | Search palette typing mobbin; skeleton result rows |
| 116 | empty-state | light | Search palette: mobbin, No results |
| 117 | modal-dialog | light | Search palette results for matcha with highlighted terms |
| 118 | onboarding | light | Images page behind; Introducing new improved memory promo modal |
| 119 | other | light | Images gallery: style carousel, Discover list, My images |
| 120 | list-table | light | Apps directory, Featured tab: two-column app rows |
| 121 | list-table | light | Apps directory, Lifestyle tab: longer two-column app list |
| 122 | detail-page | light | Apps > Figma detail: Connect button, previews, Information table |
| 123 | modal-dialog | light | Use Figma in ChatGPT connect modal with disclosures, toggle |
| 124 | auth | light | Figma OAuth consent: ChatGPT would like to access account |
| 125 | toast-banner | light | Figma is now connected toast; Figma page, Start chat |
| 126 | onboarding | light | Codex intro modal step 1: Your software engineering agent |
| 127 | onboarding | light | Codex intro modal step 3: Deep code review, Done |
| 128 | app-shell-home | light | Codex home: Connect to GitHub hero, example task list |
| 129 | list-table | light | Codex Tasks tab: composer, one task row with +28 -0 |
| 130 | empty-state | light | Codex Code reviews tab: Enable code review, Enable for me |
| 131 | modal-dialog | light | Connect GitHub permissions modal, Continue to GitHub |
| 132 | auth | light | GitHub Install and Authorize ChatGPT Codex Connector page |
| 133 | toast-banner | light | GitHub is now connected toast; Start your first task cards |
| 134 | empty-state | light | Codex Start your first task: three suggestion cards |
| 135 | chat-composer | light | Codex composer with typed task, repo, branch selectors |
| 136 | loading-state | light | Environment created toast; skeleton task row under tabs |
| 137 | loading-state | light | Task row Starting container with stop button, progress ring |
| 138 | detail-page | light | Codex task detail: summary left, unified diff right |
| 139 | detail-page | mixed | Task detail Logs tab: dark terminal block, summary |
| 140 | detail-page | light | Task detail after PR created: View PR, file card open |
| 141 | dropdown-menu | light | Diff view options menu: Split, Unified, Full, Incremental |
| 142 | detail-page | light | Task detail with split diff view |
| 143 | detail-page | light | Task detail single column: summary, file card, composer |
| 144 | toast-banner | light | Code review is now enabled toast; Code review enabled state |
| 145 | list-table | light | Code reviews tab: row with bug, Open, Fix chips |
| 146 | settings-form | light | Create project modal: name, suggestion chips, Create disabled |
| 147 | dropdown-menu | light | Create project: color swatches and icon grid popover |
| 148 | dropdown-menu | light | Icon picker popover, lotus icon selected |
| 149 | settings-form | light | Create project with icon chosen, name empty, disabled button |
| 150 | settings-form | light | Create project with name filled, Create project enabled |
| 151 | empty-state | light | Project page: No chats yet, Chats and Sources tabs |
| 152 | list-table | light | Project Chats tab: two chat rows with dates |
| 153 | empty-state | light | Project Sources tab: Give ChatGPT more context, Add |
| 154 | list-table | light | Project Sources tab: three PDFs and a txt file |
| 155 | file-upload | light | Add sources modal: dashed drop zone, four source tiles |
| 156 | file-upload | light | Sources tab after first upload: one PDF row |
| 157 | file-upload | light | Sources tab with three PDF rows after uploads |
| 158 | file-upload | light | Add text source modal empty, Save disabled |
| 159 | file-upload | light | Add text source modal with pasted text, Save enabled |


## 2. Canonical picks per category (hand-off to measurement specialists)

Up to 6 indices from this slice; picks are fully rendered, high-signal frames. Empty = nothing suitable in 80-159.

| category | indices |
|---|---|
| shell_sidebar | 119, 120, 152, 92, 80, 154 |
| top_bar | 138, 128, 122, 92, 152, 129 |
| data_table | 154, 128, 152, 121, 145, 112 |
| settings_form | 97, 98, 99, 146, 158, 159 |
| detail_page | 122, 138, 142, 140, 143, 139 |
| empty_state | 151, 153, 130, 134, 116, 110 |
| loading_state | 115, 136, 137, 133 |
| error_state | (none in slice) |
| modal_dialog | 84, 107, 93, 101, 109, 155 |
| dropdown_menu | 92, 80, 141, 89, 147, 148 |
| toast_banner | 88, 144, 125, 90, 133, 136 |
| tabs | 154, 129, 120, 81, 138, 145 |
| chart | (none in slice) |
| dark_mode | (none in slice) |
| input_states | 97, 98, 99, 101, 104, 105 |
| buttons | 81, 107, 100, 84, 134, 145 |
| onboarding | 126, 127, 118, 109, 123, 83 |
| chat_thread | 92, 86, 87, 112, 96, 143 |
| chat_composer | 80, 110, 111, 135, 85, 92 |
| status_pill | 145, 81, 82, 138, 120, 93 |
| file_upload | 155, 156, 157, 158, 159, 154 |

Gaps in this slice (be explicit): no full dark-mode screens (dark surfaces only as the Temporary Chat composer 110-112 and the Logs terminal block 139); no charts, usage graphs or billing tables; no true error state (116 'No results' is an empty state); no sortable data table with column headers; no mobile-width frames (all desktop, 1512 css px viewport); no metrics/stat-card row.


## 3. Measured token table (css px = image px / 1.27)

| Token | Image px | CSS px | Colour / note | Screens |
|---|---|---|---|---|
| Sidebar width | 330 (border col x=329) | 260 | bg #f9f9f9, 1px right border #ececec, main #ffffff | 80, 119, 120 |
| Header height | 66-67 | 52 | hairline #f2f2f2 (only when scrolled); Codex task header 82 img = ~64 css, border #eaeaea | 92, 138 |
| Sidebar row | 314 x 45 (pitch 45.8) | 247 x 35.4 (pitch 36.0), inset 6, radius ~10 | hover/selected #f0f0f0 | 119, 80 |
| Sidebar icon / label origin | 19 px glyph; icon x=24, text x=55 | 15-16; x 19 / 43 | outline glyphs, 14px label | 80 |
| Collapsed rail | 66 (border x=65) | 52 | | 113 |
| Sidebar footer avatar / Upgrade pill | 32; 90 x 36 | ~25; 71 x 28 | avatar #399dfb | 80 |
| Get Plus pill | 124 x 46 | 98 x 36 | fill #f1f1fe, text darkest px #454085 | 80 |
| Home composer | 974 x 70-73 | 767-768 x 55-57 | white, 1px #dedede, soft shadow | 80, 110 |
| Dark composer | 974 x 70 | 767 x 55 | #303030 | 110 |
| Send / voice button | 44-45 | 35-36 | #000 active, #111 dark variant, #a8a8a8 disabled | 80, 92, 110 |
| Codex composer card | ~130 tall | ~102 | controls row inside | 134, 135 |
| Thread column | assistant text 964 wide | 759 (container 768) | body 16px / 28px line | 92 |
| Message bubble | 462 x 56 (one line) | 364 x 44, radius ~22 | #f3f3f3 / #f5f5f5 | 92 |
| Thread avatar / sidebar bubble | 35 / 25 | 28 / 20 | grey #7d8889 | 92 |
| Modal widths | 508 / 568 / 608 / 650 / 730 / 736 / 812 | 400 / 447 / 479 / 512 / 575 / 580 / 639 | white, radius ~16-19 | 131 / 84,101,107 / 118 / 99,146 / 109 / 123 / 126,155,158 |
| Modal inner left padding | 21 | ~16.5 | | 84 |
| Backdrop | white -> #f0f0f0, #f9f9f9 -> #efefef | ~6% black + blur | | 84, 107, 109 |
| Compact button | 107 x 42, 70 x 43, 78 x 43 | 84 x 33, 55 x 34, 61 x 34 | pill; primary #0d0d0d / #000, destructive #e5322d | 84, 98, 107 |
| Large CTA | 380 x 52 | 299 x 41 | #0d0d0d (Go/Pro), #605eea (Plus) | 81 |
| Disabled primary | | | #c4c4c4 fill, white text | 100, 97 |
| Toast | 296-388 x 51, top 16 | 233-305 x 40, top 12.6, radius ~7.5 | #018635, white text | 88, 90, 133, 144 |
| Toggle | 41 x 25 | 32 x 20 | ON #0285ff, OFF #cdcdcd | 98, 99 |
| Pill tab (project) | 109 x 47 | 86 x 37 | #f3f3f3 | 154, 152 |
| Pill tab (Apps) | 102 x 49 | 80 x 39 | #ececec | 120 |
| Input field | 485 x 45 | 382 x 35 | 1px light border | 84 |
| Dropdown menu | 268 wide (92), ~393 wide (80) | 211, ~310; rows 36 pitch | white + 1px border + soft shadow | 92, 80 |
| Source / list rows | divider pitch 82 | 64.7 | hairline #f5f5f5; file tile ~50 img = ~39 css | 154 |
| Apps row | pitch 91.7; icon 46 | 72; 36 | | 120 |
| Codex hero card | 972 x 277 | 765 x 218 | #f3f3f3 | 128 |
| Codex task row | pitch 90 | 71 | stats #20783e / #ac3231 | 128 |
| Add-sources tile | 146 x 97 | 115 x 76 | #f3f3f3, radius ~12 | 155 |
| Pricing card | 447 wide, gutter 31 | 352, 24 | page #f9f9f9, card #fefefe, 1px #e7e7e7, radius ~11-14 | 81 |
| Diff colours | | | add row #e5ffed, gutter #cbffd9, pane #f3f3f3 | 138 |
| Heading sizes (estimated from cap height) | cap 25 / 27 / 26 / 38 | ~28 / ~30 / ~28 / ~40px | home H1 / Codex H1 / pricing title / plan name | 80 / 129 / 81 |
| Body sizes (estimated) | cap 12 / 13 / 15 | 14 / 14 / 16px | nav+menus / modal body / thread | 80 / 84 / 92 |


## 4. Observations

1. **pixel scale** - Screens are a ~1512 css px viewport rendered at x1.27 into 1920 px images: sidebar 330 img px = 260 css, composer 975 = 768 (max-w-3xl), header 66 = 52, modal 568 = 448, send button 45 = 36. Divide every image measurement by 1.27 to get css px; every value in this audit is already converted unless marked 'img px'. _(evidence: 80, 84, 92, 110)_
2. **app shell** - Fixed 260 css sidebar (#f9f9f9) with a 1px #ececec right border against a pure #ffffff main canvas. Separation is a ~4% tonal step plus one hairline; there are no shadows or panels in the shell. Main content is a single centred column 768 css wide (composer, thread, project page and lists share it); the Apps directory and Codex use a ~768-780 css column too. _(evidence: 80, 119, 120, 152)_
3. **header bar** - Header is 52 css tall, transparent, no border at rest (a #f2f2f2 hairline appears only once the thread scrolls under it). Three zones: left title text-button with chevron ('ChatGPT v', 'New group chat v', ~16px regular), centre 'Get Plus' lavender pill (98 x 36 css, #f1f1fe fill, indigo text, sparkle icon), right 1-2 ghost icon buttons (16 css glyphs, hover fill #ececec, 36 css high). Codex task pages use a taller ~64 css header with a #eaeaea bottom border (138); detail pages swap the title for a breadcrumb 'Apps > Figma' (122). _(evidence: 80, 92, 138, 122)_
4. **sidebar anatomy** - Nav rows are 36 css pitch; the selected/hover row is a #f0f0f0 fill 247 x 35 css, radius ~10, inset 6 css from the sidebar edge. Icons are 16 css monochrome outline glyphs (no fill, no colour) at x~19 css, labels 14px black starting x~43 css. Chat-history rows have no icon and truncate with an ellipsis. Section labels ('Group chats', 'Your chats', 'Projects') are the same 14px size in grey (#7f7f7f), sentence case, label rows on the same 36 css pitch with ~9 css of extra space above each group (Projects text to 'Your chats' text = 45 css vs 36 normal); no dividers between groups. _(evidence: 80, 119, 152, 108)_
5. **sidebar footer and rail** - Footer is pinned to the bottom: ~25 css initials avatar (#399dfb), name 14px with a 12px grey plan line ('Free'), and an outlined pill 'Upgrade' (71 x 28 css, 1px border). Group-chat rows carry trailing adornments: a ~20 css grey avatar bubble and an 8px blue unread dot. The collapsed rail (113) is 52 css wide (border at x=65 img px) and keeps only the icon column plus avatar and a sparkle; the 'Get Plus' pill stays in the header. _(evidence: 80, 96, 113, 152)_
6. **typography** - One system sans; almost everything is regular weight and hierarchy comes from size and grey value. Estimated from measured cap heights (cap ~0.705 em): sidebar/menus/buttons 14px; thread body 16px on a 28px line (line pitch 35.5 img px = 28 css); modal title ~18px regular; page H1 ~28px regular (home heading cap 19.7 css); Codex hero heading ~30px; pricing plan name ~40px; helper/meta 12-13px. Text colours: #000/#0d0d0d primary, ~#5d5d5d secondary (modal body darkest px #4e4e4e), ~#7f7f7f-#8f8f8f tertiary and placeholders. _(evidence: 80, 84, 92, 129, 81)_
7. **composer** - Home composer is a 768 x 56 css full-radius pill: white fill, 1px #dedede border, very soft shadow below, '+' ghost button left, mic glyph and a 36 css black circle (voice, then arrow) right, placeholder ~#8f8f8f. The in-thread composer is identical but the send circle is #a8a8a8 (disabled) until text exists, with a 12px grey disclaimer line centred beneath. The Codex composer (134/135) is a ~102 css rounded-3xl card: text on top, control row beneath (repo, branch, '1x' as ghost dropdown buttons, mic, send). Temporary Chat inverts the pill to #303030 with white text and a white send button (110-112). _(evidence: 80, 92, 110, 111, 135)_
8. **modal geometry** - Modals are a centred white card on a dimmed, blurred page. Widths snap to a handful of values: 400 (consent), 448 (every simple dialog: link, rename, report, leave, people), 480 (promo), 512 (forms: Customize, Create project), 575 (explainer), 580 (app connect), 640 (Add sources, Add text source, Codex intro). Radius ~16-19 css, 1px light border, soft diffuse shadow, inner padding ~16 css, title ~18px regular left-aligned, footer buttons right-aligned with ~8 css gap. A close X appears only on list, multi-step and promo modals (100-106, 126, 131, 155), not on simple confirms (84, 107). The page behind gets a ~6% black wash plus blur rather than a dark scrim (a white page measures #f0f0f0, the #f9f9f9 sidebar becomes #efefef; blur radius estimated 4-6 css); plain dropdown menus (80, 92, 141) have no backdrop at all. _(evidence: 84, 99, 107, 109, 123, 126, 131, 146, 155)_
9. **buttons** - Every button is a pill (radius = height/2). Compact modal buttons are 33-34 css tall (Copy link 84 x 33, Save 55 x 34, Leave 61 x 34), the large CTA is 299 x 41 css (pricing), icon buttons are 36 css circles. Variants: primary #0d0d0d + white text; secondary white + 1px light-grey border + black text; disabled primary = #c4c4c4 fill with white text (not opacity); destructive = #e5322d fill + white text; brand indigo #605eea is reserved for the Plus upgrade CTA. In pairs the secondary sits left of the primary. _(evidence: 81, 84, 97, 98, 100, 107, 134)_
10. **colour restraint** - Colour budget is tiny: neutral greys plus one near-black primary. Semantic colours appear only where they carry meaning: green #018635 (success toast), red #e5322d (destructive), blue #0285ff (toggle ON), indigo #605eea / #f1f1fe (paid plan, 'Get Plus', POPULAR chip), diff green #e5ffed with #cbffd9 gutter, +/- stats #20783e / #ac3231. Only project and app tiles (colour swatches, brand logos, red PDF tile, blue doc tile) carry decorative colour. _(evidence: 81, 88, 99, 107, 138, 146, 154)_
11. **toasts** - Success toasts are solid #018635 rectangles (radius ~8 css), 40 css tall, white 14px text with a leading check-circle and an optional trailing X, auto width 233-305 css, anchored top-centre of the viewport (centre x = viewport centre, not content centre) 13 css from the top, overlapping the header; no shadow. Fired after every mutation: copied, reset, deleted, connected, created, enabled. Copy is a past-tense fact ('Group link has been reset'). _(evidence: 88, 90, 91, 125, 133, 136, 144)_
12. **dropdown menus** - Menus are white cards, ~12-16 css radius, 1px border + soft shadow; width fits content (211 css for the 6-item group menu, ~310 css for the model picker). Row = 36 css pitch, 16 css leading outline icon, 14px label. Groups are split by a 1px hairline and the destructive group sits last with red text AND red icons (Report / Leave group / Delete group; Reset link / Delete link). The selected row gets a trailing check (80, 141); a 12px grey description may sit under the title and an inline outlined 'Upgrade' pill can be the row action. _(evidence: 80, 89, 92, 141, 147)_
13. **multi-step modal flow** - The Report flow reuses one 448 css modal across four states without changing width: step 1 nine radio rows (custom ~20px radio, black dot when selected, row pitch ~36 css) with Next disabled until a choice; step 2 a shorter list plus Back/Next; step 3 echoes the chosen reason as plain text above an optional textarea ('Please provide more details') with Back/Submit; final 'Thanks for your report' with an underlined policy link and a single Close. Primary stays grey-disabled until the step is valid; height changes, width never does. _(evidence: 100, 101, 102, 103, 104, 105, 106)_
14. **settings form** - Customize ChatGPT form: 14px field label, ~480 x 117 css textarea (1px border, radius ~12 estimated), live counter '158/1500' 12px grey under the left edge, then a toggle row: 14px black label, 12-13px grey helper beneath, 32 x 20 css switch right-aligned (ON #0285ff, OFF #cdcdcd-#e3e3e3), then a long 12px grey footnote and a Cancel + Save footer. No dividers, spacing only; Save is disabled grey until the form is valid. _(evidence: 97, 98, 99)_
15. **consent pattern** - App-connect and OAuth screens spell out permissions in plain language: 123 has a gradient hero with two logos split by a hairline, a white pill 'Connect Figma' + dark pill 'Continue without account', a toggle row ('Reference memories and chats'), then three bold-lead-in 12px paragraphs ('You're in control.', 'Apps may introduce elevated risk.', 'Data shared with this app.'). 131 puts the same three titled paragraphs in a bordered card separated by hairlines, a collapsed 'See app actions' disclosure, and a full-width black pill 'Continue to GitHub'. 124/132 are the third-party consent pages: heading 'ChatGPT would like to access your account and be able to:' with a checkmark scope list and one full-width blue Agree/Install button. _(evidence: 123, 131, 124, 132)_
16. **detail page layout** - Codex task detail is a full-bleed two-pane: ~64 css header (back arrow, 14px semibold title, 13px grey meta 'Feb 28 - repo - main - +28 -0' with green/red stats; right-aligned ghost 'Archive' and 'Share' plus a black split-button 'Create PR' that becomes 'View PR' when done); left ~400 css thread pane with user bubble, collapsible 'Worked for 2m 13s', Summary bullets with inline code chips, 'Testing' checklist, collapsible 'File (1)' card, thumbs up/down and a pinned 'Request changes or ask a question' composer; right pane #f3f3f3 with Diff | Logs tabs, close X and a diff card (filename, green 'New' chip, +28 -0, kebab) with add-line rows #e5ffed; Logs is a near-black rounded terminal block. The pane can collapse to a single 768 css column (143). _(evidence: 138, 139, 140, 142, 143)_
17. **list rows** - Lists are two-line rows separated by 1px near-invisible hairlines (#f5f5f5-#f6f6f6): no card chrome, no zebra, no column headers. Codex tasks 71 css pitch (title 14px black, 13px grey meta 'Aug 27 - openai/codex', right-aligned +145 -0 stats); project chats ~64 css (14px medium title, one-line grey preview truncated, right-aligned date 'Mar 1'); sources 64-65 css with a 38-40 css rounded file tile (red PDF, blue doc, white glyph) + title + 'PDF - Mar 1, 2026'; Apps directory 72 css with a 36 css brand circle, name + grey tagline, trailing chevron, two columns with ~48 css gutter. The only real table is the markdown one inside a chat answer (112): bold header row with a bottom rule, no zebra, no vertical rules. _(evidence: 128, 129, 145, 152, 154, 120, 121, 112)_
18. **tabs and segmented controls** - Four tab idioms, all quiet: pill tabs on project pages (active = #f3f3f3 pill 86 x 37 css, inactive grey text, no border; 152, 154); filter pills on Apps (active #ececec 80 x 39 css; 120); Codex underline tabs (14px, active black with a thin (~1-2 css) black underline over a 1px hairline, inactive grey; 129, 145); and a segmented Personal | Business control on the pricing overlay (grey track, white active pill; 81, 82). Diff | Logs on the task detail is plain text with the active one black (138). _(evidence: 152, 154, 120, 129, 81, 138, 145)_
19. **pricing overlay** - Upgrade is a full-screen overlay, not a card: page #f9f9f9, centred 28px title, segmented control, then four equal white cards (352 css wide, 24 css gutters, ~12 css radius, 1px #e7e7e7 border). The recommended plan swaps to an indigo border with a faint lavender-to-white gradient and a 'POPULAR' chip (#f1f1fe, indigo 11px caps). Each card: ~40px plan name, price with superscript '$' + ~40px numeral + two-line 'USD / month' caption, 14px tagline, a 299 x 41 css full-width CTA (outlined 'Your current plan' for the active plan, black for Go/Pro, indigo for Plus), then a feature list of 16 css outline icons + 14px text at ~40 css pitch and a 12px grey legal line pinned to the bottom. _(evidence: 81, 82)_
20. **loading states** - Loading is communicated with quiet placeholders and state words, never full-page spinners: low-contrast grey skeleton bars (search palette: circle + two bars per row, 115; two bars under the tabs, 136; a grey pill standing in for the repo select, 133) and, for long-running agent work, a circular progress ring on the bell, the status text 'Starting container' and a square stop button (137). Buttons that depend on loading data stay visible but disabled ('Start' on 133, 'Loading' on 123). _(evidence: 115, 133, 136, 137, 123)_
21. **empty states** - Empty states are centred and small: a 36-48 css icon in a rounded square (or a cluster of 3 app logos on 153), a 16px black title, one grey 14px line explaining why, and at most one black pill CTA ('Enable for me', 'Add', 'Manage code review'). The lightest variants are text-only: 'No chats yet / Ask anything about X' (151) and 'No results' with a search glyph inside the open palette (116). 153 wraps its message in a 1px-bordered rounded card; 128 uses a #f3f3f3 765 x 218 css hero block with two buttons ('Connect to GitHub' or 'Download the app'). _(evidence: 151, 153, 130, 134, 116, 110, 128)_
22. **file upload** - Add sources modal (640 css): a 1px dashed drop zone (~606 x 287 css) with a small centred icon and 'Drag sources here' in 14px grey, then four equal source tiles beneath (Upload, Text input, Google Drive, Slack: #f3f3f3 fill, radius ~12, icon above a 12px label, 115 x 76 css). Choosing Text input swaps the modal body (same 640 width) to a title input + large textarea with Back and Save (disabled until text exists; 158 vs 159). Uploaded files appear immediately as list rows on the Sources tab (154, 156, 157) under an 'Add sources' row led by a 40 css grey circle plus; a 'Newest v' and 'All v' text-dropdown pair sits right-aligned above the list. _(evidence: 155, 156, 157, 158, 159, 154, 153)_
23. **chat thread patterns** - Group chat adds multi-party structure to the thread: centred 13px grey system notices with a bold actor ('Alex Smith reset the group link.', 'Sam Lee joined the group chat.'), a bold 'Today' time header, an 'Invite with link' outlined pill, other participants shown as a 28 css avatar + 12px grey name above a #f3f3f3 bubble on the left, the user's own messages right-aligned in a #f3f3f3 pill/rounded bubble (radius ~22 css for one line), and ChatGPT answers unbubbled at full column width (759 css) with a 12px 'ChatGPT' label. Markdown answers carry bold lead-ins, emoji bullets, tiny grey citation chips and rich media cards (embedded map, 87). _(evidence: 85, 86, 87, 92, 96, 112)_
24. **copy style** - Sentence case, short verbs (Copy link, Create link, Rename, Leave, Save, Submit, Continue). Confirmation dialogs name the object and the consequence in one or two sentences ('You'll no longer see Osaka trip or its history. Other members will still have access to the group chat.'); toasts are past-tense facts; empty states give title + reason + one action; legal/disclosure text is 12px grey and honest about risk ('Apps may introduce elevated risk'). _(evidence: 107, 88, 90, 123, 151, 153)_
25. **density and radius scale** - Spacing sits on a 4 css grid with generous vertical air between sections but tight rows inside lists (36 css menu/nav rows, 64-72 css two-line rows). Radius scale observed: ~8 toasts/small inputs, ~10 nav rows, ~12 tiles/cards, 16-19 modals, ~12 pricing cards, up to pill (22) for single-line message bubbles, full pill for every button, chip, tab and composer. Hairline borders (#dedede-#ececec) do the structural work; shadows appear only on overlays (menus, modals, composer). _(evidence: 80, 84, 92, 119, 154, 81)_

## 5. Rasikh mappings

| Rasikh screen / pattern | reference indices | why |
|---|---|---|
| trust passport per-party visibility toggles | 99, 97, 98, 123, 93 | Toggle row anatomy to copy exactly: 14px label left, 12-13px grey helper line beneath, 32 x 20 css switch right-aligned (ON #0285ff, OFF grey), long 12px grey footnote below, Cancel/Save footer with Save disabled until dirty (97-99). 123 shows the toggle sitting above bold-lead-in plain-language disclosures, and 93 gives the per-person row (avatar, name, handle, role tag, trailing action) for listing parties. |
| approval request card and consent screens | 123, 131, 124, 132, 107 | The closest analogue to 'agent needs your approval': titled plain-language permission paragraphs ('You're in control.'), a bordered card with hairline separators (131), a collapsed 'See app actions' disclosure, one full-width black pill CTA plus a secondary 'Continue without account' (123), and a checkmark scope list under 'would like to access your account and be able to:' (124, 132). 107 is the destructive-confirm template (consequence sentence naming the object, Cancel + red Leave). |
| agent activity feed (did / waiting on / needs approval) | 85, 86, 96, 137, 129, 138, 143, 145 | Centred 13px grey system notices with a bold actor and a 'Today 10:30 PM' header (85, 86, 96) are a ready-made timeline-row style for 'did' items. Codex task rows show status inline (137: 'Starting container' + stop button; 129/145: stats and status chips Open / 1 bug / Fix) and the task detail left pane (138, 143) gives the narrative pattern: collapsible 'Worked for 2m 13s', Summary bullets, 'Testing' checklist with check marks, pinned composer for replies. Pair with the green success toast style (144) for completion pings. |
| document upload with AI extraction and confidence | 155, 156, 157, 154, 158, 159, 153 | Upload modal = dashed drop zone + four equal source tiles (155); result list = 64 css rows with a 38-40 css coloured file tile, filename, 'PDF - date' meta (154, 156, 157); empty state = bordered card, icon cluster, 'Give ChatGPT more context' + one black 'Add' (153); paste-text fallback (158, 159). Nothing here shows extraction or confidence, so extracted-field rows and a confidence chip must be designed from the list-row and status-pill primitives (145 chips, 120 'BETA' badge). |
| employer hires table and landlord/bank applications list | 128, 129, 145, 152, 154, 121, 112 | No sortable data table exists in this pack, so mirror its list idiom: two-line rows on 1px #f5f5f5 hairlines with no card chrome, 14px title, 13px grey meta, right-aligned stat or chip (128, 129, 145), a 'Newest v / All v' text-dropdown pair above the list for sort/filter (154), pill or underline tabs for stages (152, 129). For true columns borrow the markdown table in 112 (bold header row, one bottom rule, no zebra, no vertical rules). |
| hire detail / application detail page with timeline and decision actions | 138, 140, 142, 143, 122, 85 | Detail layout: header with back arrow, title, grey meta line with coloured stats, ghost secondary actions and one black split-button primary that changes label as state changes ('Create PR' to 'View PR' = 'Back this hire' to 'Backing') (138, 140); two panes with a narrative/summary column and a #f3f3f3 detail pane with text tabs (138, 139); key-value Information card with hairline rows (122); event timeline from centred system notices (85). |
| landlord application: verified fields, employer-backing badge, plain-language risk summary | 138, 122, 145, 81, 93 | Summary + 'Testing' checklist with check marks (138) maps to 'risk summary + verified checks'; the bordered Information card with grey key / black value rows (122) maps to verified fields; small chips (145 Open/Fix, 81 POPULAR, 93 'admin' tag) map to the employer-backing badge; decisions use the secondary-left / primary-right pill pair (84, 107). |
| add-hire and multi-step request flows | 100, 101, 102, 103, 104, 105, 106, 146, 150, 159 | Report flow keeps one 448 css modal across steps with Back/Next, disabled grey primary until valid, a radio list on step 1, free-text on the last step and a confirmation state (100-106). Create-project (146, 149, 150) is the single-screen version: name input with leading icon, suggestion chips ('Investing', 'Homework'), grey info callout, one disabled-until-valid primary. |
| language switcher (EN / AR) and settings pickers | 80, 141, 81, 82, 147 | Use the anchored dropdown with a trailing check on the selected row and 12px grey descriptions (80, 141) for the language list; the grey-track segmented control with a white active pill (81, 82) for a compact EN | AR toggle. Note these screens are LTR only, so RTL mirroring must be derived (logical start/end spacing, mirrored chevrons and check position). |
| roadmap of ordered steps and onboarding carousel | 126, 127, 120, 154, 109, 118 | No dependency graph exists here. For ordered steps reuse the multi-step modal chrome (126, 127: hero image, 3 dots, Back/Continue/Done) and the 'titled item + one grey sentence' list inside 109 (Not in history / No model training / Memory off) for step explanations; vertical step lists can use the 64-72 css icon-tile + title + grey tagline + trailing chevron rows from 120 and 154. |
