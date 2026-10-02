# Platform pack survey, indices 100-199

Slice: OpenAI Platform web Apr 2026, screens 100-199 (100 screens). Source: contact sheets platform-early/100-119 to 180-199, then ~35 screens inspected at full resolution (Mobbin 120 px footer cropped; app viewport 1920x1205).

**Scale assumed: 1.27 capture px per CSS px** (capture = 1920 px of a ~1512 CSS px viewport; derived from fixed panels that become round CSS values only at 1.27: 406.5 px = 320 css, 762 px = 600 css, 30.5 px avatar = 24 css, and ChatGPT sidebar 330 px = 260 css). CSS values are capture px / 1.27 and are estimates. Colours are sampled hex from flat regions.

**Theme:** every screen in this slice is light mode (modal screens are light with a ~35% black scrim). No dark-mode, chart, or true data-table screens exist in 100-199.

**Slice content:** 100 chat prompt published modal; 101-141 Agent Builder (home, node canvas, config panels, schema modal, preview chat, publish/deploy/delete); 142-164 Audio (realtime transcript + logs, text-to-speech); 165-180 Images; 181-192 Videos; 193-199 Assistants.

## Catalog

| idx | kind | theme | note |
|---|---|---|---|
| 100 | modal-dialog | light | Chat prompt published modal with API code snippet |
| 101 | app-shell-home | light | Agent Builder home: six template cards, credits card |
| 102 | app-shell-home | light | Agent Builder: Workflows tab, two workflow cards |
| 103 | workflow-canvas | light | Start to My agent; Intro video promo toast |
| 104 | workflow-canvas | light | Canvas: Start, Classifier, If/else, two agents |
| 105 | modal-dialog | light | Publish workflow modal, name field, over canvas |
| 106 | workflow-canvas | light | Travel Agent live canvas, full graph, Publish disabled |
| 107 | workflow-canvas | light | My agent selected; config panel instructions, model, tools |
| 108 | workflow-canvas | light | Classifier node selected, config panel open |
| 109 | modal-dialog | light | Structured output (JSON) modal, empty properties |
| 110 | modal-dialog | light | Structured output modal, first property row added |
| 111 | modal-dialog | light | Structured output modal, classification ENUM row |
| 112 | modal-dialog | light | Structured output modal, enum value chips entered |
| 113 | workflow-canvas | light | Classifier panel, response_schema chip, JSON format |
| 114 | workflow-canvas | light | Start to Classifier, config panel closed |
| 115 | workflow-canvas | light | Full branching graph with yellow sticky note |
| 116 | workflow-canvas | light | Sticky note 'My first travel agent' on canvas |
| 117 | workflow-canvas | light | Dragging connector from Classifier onto empty canvas |
| 118 | onboarding | light | New node placeholder, 'Select a new node' tooltip |
| 119 | workflow-canvas | light | If/else node added, empty condition panel |
| 120 | dropdown-menu | light | If/else case field with variable autocomplete popover |
| 121 | dropdown-menu | light | Operator picker: comparisons and logic options |
| 122 | workflow-canvas | light | If/else expression filled, classification equals flight_info |
| 123 | workflow-canvas | light | New Agent node connected after If/else, panel open |
| 124 | workflow-canvas | light | Flight Agent panel with travel-assistant instructions |
| 125 | workflow-canvas | light | Itinerary Agent panel, branch graph complete |
| 126 | workflow-canvas | light | Flight Agent panel, Web Search tool chip added |
| 127 | file-upload | light | Add widget modal: Create or Upload .widget file |
| 128 | modal-dialog | light | Flight Tracker widget preview modal |
| 129 | workflow-canvas | light | Flight Agent output format Widget, Flight Tracker chip |
| 130 | empty-state | light | Preview panel: 'Preview your agent' empty chat |
| 131 | chat-composer | light | Preview panel, message typed in composer |
| 132 | chat-thread | light | Preview run trace per node with flight card |
| 133 | dropdown-menu | light | Live workflow overflow menu: Rename, Duplicate, Delete |
| 134 | modal-dialog | light | Publish workflow modal for Copy of Travel Agent |
| 135 | modal-dialog | light | 'Published!' success modal with green check |
| 136 | modal-dialog | light | Deploy modal: ChatKit/Agents SDK tabs, workflow ID fields |
| 137 | workflow-canvas | light | Copy of Travel Agent live canvas, no overlay |
| 138 | dropdown-menu | light | Overflow menu open on Copy of Travel Agent |
| 139 | modal-dialog | light | Delete workflow confirm, checkbox unchecked |
| 140 | modal-dialog | light | Delete confirm, checkbox ticked, red Delete enabled |
| 141 | app-shell-home | light | Agent Builder home, Workflows tab, Travel Agent card |
| 142 | empty-state | light | Audio landing: 'Create a realtime prompt' |
| 143 | settings-form | light | Audio text-to-speech, empty output, settings rail |
| 144 | error-state | light | Realtime audio: enable microphone access prompt |
| 145 | empty-state | light | Realtime: 'Conversation will appear here', Start session |
| 146 | loading-state | light | User turn recording: typing dots, red waveform pill |
| 147 | chat-thread | light | Audio transcript, assistant reply, Generating pill |
| 148 | chat-composer | light | Realtime transcript, text composer 'Write your message' |
| 149 | chat-composer | light | Composer with 'Quiet beach in Maldives' typed |
| 150 | chat-thread | light | Second user turn sent, assistant pending |
| 151 | chat-thread | light | Second turn, assistant reply streaming |
| 152 | chat-thread | light | Second reply complete, controls idle |
| 153 | chat-thread | light | Two-turn transcript complete, composer collapsed |
| 154 | chat-thread | light | Session ended divider, Start session control |
| 155 | modal-dialog | light | Publish prompt modal, name 'Relaxing Trip' |
| 156 | modal-dialog | light | 'Your prompt was published' modal with prompt ID |
| 157 | list-table | light | Audio landing with 'Your prompts' list, Relaxing Trip |
| 158 | chat-thread | light | Audio transcript beside timestamped Logs event panel |
| 159 | chat-composer | light | Text-to-speech multi-line composer, send button |
| 160 | loading-state | light | Text-to-speech 'Generating speech...' state |
| 161 | audio-player | light | Waveform with playback progress, pause control |
| 162 | audio-player | light | Waveform complete, play, duration, download |
| 163 | dropdown-menu | light | Voice select list: checkmark, preview play buttons |
| 164 | audio-player | light | Waveform with Marin voice selected |
| 165 | empty-state | light | Images: empty square grid, bottom prompt composer |
| 166 | gallery | light | Images: two generated results, composer empty |
| 167 | chat-composer | light | Images: prompt typed in composer, empty grid |
| 168 | chat-composer | light | Images composer: Number of images slider popover |
| 169 | chat-composer | light | Images composer: slider popover adjusted |
| 170 | loading-state | light | Images: shimmer tile with prompt and 14s timer |
| 171 | gallery | light | Images: first result tile, composer reset |
| 172 | gallery | light | Images: result tile, Clear button appears |
| 173 | detail-page | light | Image detail overlay: prompt, metadata, Code button |
| 174 | file-upload | light | Images composer: attached thumbnail, edit prompt |
| 175 | file-upload | light | Attached image plus edit prompt typed |
| 176 | file-upload | light | Attached image, edit prompt typed, send active |
| 177 | loading-state | light | Edit generating tile beside original image |
| 178 | gallery | light | Original and edited variant side by side |
| 179 | loading-state | light | Gray pending tile, enlarged attachment preview |
| 180 | gallery | light | Two results in grid, Add credits card in sidebar |
| 181 | empty-state | light | Videos: 'Payment method needed' blocked state |
| 182 | empty-state | light | Videos: empty grid, prompt composer |
| 183 | gallery | light | Videos: first cat video tile |
| 184 | chat-composer | light | Videos: prompt typed, empty grid |
| 185 | loading-state | light | Videos: generating tile with progress bar |
| 186 | gallery | light | Videos: finished tile with hover controls |
| 187 | detail-page | light | Video detail overlay: player, prompt, model metadata |
| 188 | detail-page | light | Video detail overlay, larger player, Code button |
| 189 | file-upload | light | Videos composer: remix attachment chip |
| 190 | chat-composer | light | Videos remix: follow-up prompt typed |
| 191 | loading-state | light | Videos remix generating tile beside original |
| 192 | gallery | light | Videos: original and remix tiles |
| 193 | empty-state | light | Assistants: 'No assistants found', deprecation banner |
| 194 | detail-page | light | Assistants: master list and selected assistant detail |
| 195 | settings-form | light | Assistant detail scrolled: model config, sliders |
| 196 | settings-form | light | Assistant editor: blank fields, thread playground |
| 197 | modal-dialog | light | Edit system instructions modal, empty textarea |
| 198 | modal-dialog | light | Edit system instructions modal, long prompt filled |
| 199 | settings-form | light | Assistant editor: Smart Alarm, tools, Run composer |

## Canonical picks (best exemplars within 100-199)

| category | indices |
|---|---|
| shell_sidebar | 141, 101, 193, 194, 181, 163 |
| top_bar | 141, 194, 163, 133, 107, 199 |
| data_table | 158, 194, 111 |
| settings_form | 194, 199, 163, 147, 107, 195 |
| detail_page | 194, 199, 173, 188, 195 |
| empty_state | 193, 181, 145, 130, 165, 142 |
| loading_state | 170, 160, 185, 147, 179, 146 |
| error_state | 144, 181 |
| modal_dialog | 111, 140, 198, 136, 100, 127 |
| dropdown_menu | 133, 163, 121, 138 |
| toast_banner | 193, 194, 103, 118, 101, 181 |
| tabs | 163, 141, 111, 136, 147 |
| chart | (none in this slice) |
| dark_mode | (none in this slice) |
| input_states | 111, 121, 194, 107, 136, 147 |
| buttons | 111, 140, 193, 181, 194, 136 |
| onboarding | 101, 103, 142, 181, 118 |
| chat_thread | 132, 147, 158, 153, 154 |
| chat_composer | 199, 165, 132, 159, 149, 100 |
| status_pill | 133, 107, 111, 147, 136 |
| file_upload | 127, 174, 175, 176, 189 |

Notes on picks: data_table lists row-based analogues only (no real table in slice); error_state lists blocked/permission states (no red error UI exists); chart and dark_mode are empty in this slice.

## Observations

1. **Pixel scale (assumed 1.27)** - Captures are ~1.27 capture px per CSS px (1920 px wide capture of a ~1512 CSS px viewport; app viewport 1920x1205). Evidence: fixed-width panels land on round CSS values only at this scale - Audio settings rail 406.5 px = 320 css (Tailwind w-80), Assistant config column 407 px = 320 css, Logs panel 762 px = 600 css, preview-chat panel ~608 px = ~480 css, avatar circle 30.5 px = 24 css; ChatGPT sidebar edge 330 px = 260 css. All css values below are capture px / 1.27 and are estimates unless noted. Raw capture px are given where measured. _(evidence: 163, 199, 158, 132, 141)_

2. **Two shells: dashboard vs editor** - Dashboard shell = page chrome #f3f3f3, a transparent text-only top bar, a left sidebar painted the same #f3f3f3 (no divider line) and ONE inset white card holding all content. Editor shell (Agent Builder canvas) drops the sidebar and top bar entirely: full-bleed #eeeeee canvas, floating white panels (left node palette, right config panel, top-centre mode pill, bottom-centre tool pill) and a minimal header (back chevron, title, Draft/Live pill, overflow, settings, Evaluate, Code, black Publish pill). _(evidence: 141, 194, 107, 133, 163)_

3. **Content card geometry** - White card (#ffffff, no border): left edge x=277.5 (~218 css from viewport left), top y=69.5 (~55 css), right and bottom inset ~11 px (~9 css), corner radius ~8 css (est.). Separated from #f3f3f3 only by a 3-4 px soft shadow ring (#efefef fading to #f5f5f5). Page header strip inside the card is ~55 css tall (title row) with a hairline beneath it (#e8e8e8 to #f7f7f7). _(evidence: 101, 141, 165, 193)_

4. **Sidebar nav anatomy** - Nav item pitch 45.8 px (~36 css). Selected item = #e0e0e0 pill 248x41.5 px (~195x32.7 css), ~8 css radius, ~12.6 css side inset, no left accent bar. Labels 14 css (cap height 13 px) regular weight, #0c0c0c unselected and #000 selected; 16 css outline icons (monochrome, never filled or coloured). Group captions 'Create / Manage / Optimize' ~12-13 css in #818181 with extra spacing above each group; sidebar collapse icon bottom-left; optional 'Add credits' promo card (hairline border, ~12 css radius, close X, pill CTA) pinned above it. _(evidence: 141, 101, 163, 181)_

5. **Top bar** - No background, no border: black 24 css avatar circle with white initial, 'ASMobbin' then up/down chevron, slash, 'Default project' + chevron, all 13-14 css medium weight; right cluster = text links 'Dashboard' (#000) and 'API Docs' (#494949), gear icon, small avatar. Height equals the ~55 css gap above the white card, so the bar reads as part of the chrome rather than a separate band. _(evidence: 141, 194, 163, 199)_

6. **Measured colour tokens** - Surfaces: #ffffff card/modal/menu, #f3f3f3 chrome, #eeeeee editor canvas and segmented-control track, #f8f8f8 composer fill. Selected row #e0e0e0; secondary button / hover / selected menu row #ececec; filled field (no border) #e9e9e9; input border #dcdcdc-#dddddd; hairlines #e8e8e8-#f0f0f0; canvas connectors #cccccc. Primary action #181818 with white text (toggle-on #171717). Text: #000-#0d0d0d primary, #494949 secondary links, #7b7b7b-#8f8f8f muted/captions, #818181 group captions, disabled #8c8c8c on #e9e9e9. Semantic only: destructive #e12e2a, success check #0d8538, Live pill #d7f7e4 bg with #01421a text, warning banner #fff4f1 bg with ~#4e2c11 text, pastel icon tiles (#fce48a yellow, #e7eefe blue, #ffeac6/#fce8c4 orange, #ebe2fe purple, #dff5ee green, #e2e2e2 gray). There is no brand/accent colour on primary UI. _(evidence: 141, 194, 107, 133, 140, 193, 135, 111)_

7. **Buttons** - Primary = #181818 fill, white 14 css label, 40 px (~32 css) tall (e.g. 112x40 px Create). Two shapes: rounded-rectangle (~6-8 css radius) for in-page and modal actions (Create in header, Update, Save) and full pill for hero/empty-state CTAs ('+ Create', 'Finish account setup ->', 'Go to Billing') and the editor 'Publish'. Secondary = #ececec fill, black label, no border (Cancel, Generate, Learn more, '+ Add' full-width list adders). Destructive = #e12e2a fill, white label, ~28 css high in the confirm modal. Disabled = #e9e9e9 fill with #8c8c8c label (Deploy). Icon+label buttons put a 16 css outline icon ~8 css before the label. _(evidence: 194, 111, 140, 193, 181, 101, 133, 107)_

8. **Type scale** - One geometric grotesque (OpenAI Sans-like) in two weights (400 and 500). Estimated css sizes from measured cap heights (cap ratio 0.72 assumed): body/nav/inputs 14, field labels 13-14 medium, captions/meta 12-13, page title ~18 medium (A cap height 17 px), hero heading ~23-24 medium (21 px ascender height), hero sub-line ~17, chat/transcript body ~15, composer placeholder ~15. Uppercase letterspaced micro-labels (ASSISTANT, TOOLS, MODEL CONFIGURATION, USER/ASSISTANT role tags) ~11-12 css in grey. Monospace for IDs, event names and timestamps (asst_..., sess_..., response.done, 00:09.224, JSON). _(evidence: 101, 194, 147, 158, 111)_

9. **Content cards (template/workflow)** - Card 353x249 px (~278x196 css), radius ~12 css (est. from 16 px corner), hairline border #e7e7e7-#eaeaea plus a soft shadow fading over ~14 px; padding ~16 css; 28 css rounded pastel-yellow icon tile (#fce48a) with black glyph; title 14 css medium black, description 13 css #7b7b7b-#8f8f8f clamped to 2 lines, footer meta ('Template' / 'Feb 26, 10:27 AM' + owner) 12 css muted. 4-up grid with 20 css gap (25 px); cards have no chevrons or buttons. A segmented 'Workflows | Templates' control (track #eeeeee, selected white pill with hairline, ~32 css tall) sits above. _(evidence: 101, 102, 141)_

10. **Modal anatomy and widths** - Scrim = black at ~35% (white becomes #a5a5a5). Panel #ffffff, radius ~11-12 css, no border, subtle shadow, ~20 css inner padding (title ink starts 26 px from panel edge). Widths (est. from 0.6-scale reads; 111 measured): confirm ~450 css (139/140), publish/deploy ~500 css (105/134/136), widget ~520 css (127), instructions editor ~700 css (198), schema modal 964x631 px = ~759x497 css (111). Header = 18-20 css medium title (+ optional segmented control top-right) then 14 css grey sub-line; body labels 14 medium; inputs 36 css tall (46 px) with #dcdcdc border and ~8 css radius; footer buttons 32 css high, tertiary action left and Cancel (#ececec) + primary (#181818) right-aligned. 127 uses a header with a hairline divider and a centred empty-state body. _(evidence: 111, 140, 198, 136, 127, 105)_

11. **Destructive confirmation pattern** - Delete dialog explains consequence in two short paragraphs with the identifier in inline mono (workflow_id), then requires ticking 'I want to delete this workflow' before the red Delete button becomes active (checkbox unchecked in 139, ticked in 140). Cancel is a neutral #ececec button directly left of the red button; no icon, no illustration. _(evidence: 139, 140)_

12. **Menus and dropdowns** - Popovers are white, radius ~10 css, soft shadow, no border. Action menu (133/138) 239x107 css with three ~32 css rows: 16 css outline icon + 14 css label (Rename, Duplicate, red Delete #e55757). Select list (163) rows ~32 css, selected row #ececec with leading check and trailing circled play icon for per-item preview; operator list (121) has 12 css grey section captions ('Comparisons', 'Logic') and mono option text. Closed selects are 32 css (41 px) high, #dddddd border, ~8 css radius, trailing up/down chevron pair. _(evidence: 133, 138, 163, 121, 120)_

13. **Status pills and chips** - Tiny, borderless pills ~19 css high with 12 css text: 'Draft' neutral grey with a pencil glyph; 'Live' = #d7f7e4 background, #01421a text, ~50x19 css, with a chevron when it opens a version switcher. Tool/value chips (Web Search x, flight_info x, response_schema) use #ececec fill with a small x; type tags like ENUM are mono 11 css inside the field. Success is signalled by a 24 css solid green check (#0d8538) in a modal, not a toast. _(evidence: 133, 107, 111, 112, 135, 126)_

14. **Empty and blocked states** - Centred vertical stack, optically in the middle of the white area: ~40 css #eeeeee rounded-square icon tile with an outline glyph, 14 css medium black title ('No assistants found', 'Payment method needed'), 13 css grey one-line explanation, then 1-2 buttons (32 css, pill or rounded-rect, 8 css apart: secondary 'Learn more' + primary '+ Create'). Variants: master-detail right pane shows only bold 'Select an assistant to view details'; chat panes show an icon + 'Conversation will appear here' or 'Preview your agent / Prompt the agent as if you're the user'; grids stay visible but blank (165, 182). Permission block (144) uses the same stack with a black 'Enable access' pill. _(evidence: 193, 181, 145, 130, 165, 144, 142)_

15. **Warning banner** - Deprecation notice is a banner inside the card, inset ~24 css from the card sides, ~60 css tall, #fff4f1 fill (no border), ~10 css radius, warning-triangle at left, 13-14 css brown text, underlined 'Learn more' link, close X at right; it sits above the page header and pushes content down. Only one banner colour (salmon) seen; no success/info variants in this slice. _(evidence: 193, 194, 195)_

16. **Settings rails and form controls** - Fixed-width side rails: 320 css settings column (Audio right rail 163/147, Assistant config left column 199) separated by a 1 px #e9e9e9 line. Fields stack vertically with 13-14 css medium labels, bordered selects/inputs 32 css tall, filled textareas (#e9e9e9, no border, ~8 css radius) with a corner expand icon and a small 'generate' wand icon at the label row's right. Section headers inside a rail are uppercase micro-labels (TOOLS, MODEL CONFIGURATION). Toggles are ~32x19 css pills (off #e0e0e0, on #171717, white knob) with an info icon after the label; sliders have a thin black filled track and a white circular thumb with the value right-aligned in grey ('0.50', '300 ms'); list adders are full-width #ececec '+ Add' buttons. Segmented 3-way control (Normal / Semantic / Disabled) matches the Workflows/Templates control. _(evidence: 163, 147, 199, 194, 195, 107)_

17. **Transcript and activity log pattern** - Realtime transcript (147/158): a left gutter of mono grey timestamps (00:02) then role tag in uppercase 12 css semibold (USER / ASSISTANT) with body ~15 css below, ~40 css vertical gap between turns, thumbs-down icon beside assistant tag, a hairline 'SESSION ENDED' divider (154). Logs panel (158, 600 css wide, opened from a 'Logs' toggle in the header): header row with session id and token totals (up 648t, down 780t), then ~36 css rows (45.5 px pitch) = direction arrow (green incoming, purple outgoing) + mono event name + right-aligned grey mono time; token counts appear inline only on 'done' events. This is the closest analogue to a did / waiting / needs-approval feed. _(evidence: 158, 147, 154, 153)_

18. **Chat preview thread** - Workflow preview (132) renders a step trace, not bubbles: each node is a row with 16 css outline icon + node name (14 css, black), its output beneath in 14 css text or inline JSON, and a grey 12 css 'resp_...' chip with copy icon; rich results render as an inline card (blue #327fc5 flight card, ~12 css radius, white text). No avatars, no bubbles, no timestamps. Panel is a white card ~480 css wide inset ~8 css from the viewport, 'New chat' + edit icon at top right, composer pinned at the bottom. _(evidence: 132, 130, 131)_

19. **Composer** - Two composer styles. (1) Chat/preview/assistant (131/132/199): white rounded box (radius ~20 css, 1 px #e9e9e9 border, light shadow), ~15 css placeholder, paperclip bottom-left, round 32 css send button bottom-right (black when active, #fafafa when empty) or a black rounded-rect 'Run cmd+Enter' button (199), disclaimer line below in 12 css grey. (2) Media prompt bar (165/174/189): #f8f8f8 panel ~800 css wide centred in the card, textarea above a toolbar row of 16 css outline icon buttons + '1x' text button + paperclip + model chip ('gpt-image-1.5' with chevrons) + circular send (#f0f0f0 disabled, black when ready). Attachments appear as ~40 css rounded thumbnails with an x at the panel's top-left (174, 189). Audio uses a floating mini-pill (timer, waveform, Generating..., icons) instead. _(evidence: 131, 132, 199, 165, 174, 189, 147)_

20. **Gallery grid and loading tiles** - Images and Videos pages are a 4-column grid of 1:1 cells, each ~321 css (408 px) with 1 px hairline separators (#e8e8e8-#f5f5f5) and no gutters, content bleeding edge-to-edge; a ~55 css header (title left, Clear + History right). Loading tile (170/185/191) = soft radial grey shimmer with the prompt text centred, elapsed timer ('14s') bottom-left, cancel x top-left and edit pencil bottom-right; finished video tiles show tiny hover controls. Clicking a tile opens a full-bleed white detail view (173/187/188): media left (~55-60% width), prompt in 14 css, grey meta row (quality, size, tokens), black pill 'Code' button, close X top-right. _(evidence: 165, 166, 170, 173, 185, 187, 188)_

21. **Audio player and generating state** - Text-to-speech output is a centred mint-green bar waveform (~600 css wide; sampled median ~#5bc79d, bars noisy/anti-aliased) with a black 24 css circular play/pause button, mono 'mm:ss' time and a download icon beneath; playback progress recolours bars (161). Generating shows a small spinner glyph + 'Generating speech...' centred (160); realtime shows a floating pill with red timer and red waveform while recording (146) and a stop + 'Generating...' state (147). _(evidence: 160, 161, 162, 163, 146, 147)_

22. **Editor canvas, nodes and floating panels** - Canvas bg #eeeeee. Left palette (239 px wide = ~188 css, white, ~16 css radius est.) lists node types grouped by captions 'Core / Tools / Logic / Data' (12 css grey), each row = ~22 css pastel rounded-square icon tile (Agent #e7eefe blue, Classify #ffeac6 orange, End #ebfbf6 green, Note #e2e2e2, tools #fcefa4 yellow, If/else #fce8c4, Transform #ebe2fe purple) + 14 css label. Right config panel is white, 452 px = ~356 css wide, radius ~16 css est., with title + subtitle ('Call the model with your instructions and tools'), filled #e9e9e9 fields, label-left / value-right rows (Model gpt-4.1 with chevrons, Output format JSON, Tools +). Nodes are white rounded cards (Start 168x91 px = ~133x72 css) with a ~41 css pastel icon tile (tile 52 px square) + 14-16 css name and a muted 12 css type line; connectors are ~1.5 px #cccccc curves with small hollow circle handles; selected node gets a darker 1.5 px outline. Top-centre pill (edit/run toggle) and bottom-centre pill (hand, pointer, undo, redo; 251x69 px = ~198x54 css) float on the canvas. _(evidence: 107, 104, 121, 133, 132, 118)_

23. **Density and rhythm** - Interactive control heights are quantised: ~32 css (buttons, selects, nav items, menu rows, tabs), ~36 css (modal inputs, list-row pitch), ~40 css (icon tiles on empty states). Paddings sit on a 4 css grid (16 card, 20 modal, 24 banner inset, ~8-9 card-to-viewport gap). Headings are small and quiet (18 css) relative to the generous empty white space; screens contain few borders - separation comes from #f3f3f3 vs #fff planes, hairlines and shadows. _(evidence: 141, 194, 111, 163, 193)_

24. **Copy style** - Sentence case everywhere; short verb-first labels (Create, Publish, Add property, Go to Billing, Finish account setup, Start session); one-line helper text under titles ('Build a chat agent workflow with custom logic and tools'); empty states state the problem then the fix ('You'll need to set up billing before you can use the playground.' + 'Finish account setup'); destructive copy states consequences plainly and names the object in quotes; no exclamation marks except the single 'Published!'. Technical identifiers are shown verbatim in mono (asst_..., resp_..., workflow IDs) with copy icons. _(evidence: 181, 193, 140, 136, 101, 135)_

25. **State handling** - Disabled/unavailable controls fade to #8c8c8c text on #e9e9e9 (Deploy, Evaluate) rather than hiding; in-progress actions swap the primary control for a status ('Generating...', timer tiles); success is a dedicated modal (135) and a persistent 'Live' pill; blocking prerequisites (billing, microphone) replace the whole content area with an empty-state stack instead of an inline error; no red inline field-error styling appears in this slice (only a small orange warning triangle beside the incomplete If/else 'If' label in 121). _(evidence: 133, 135, 144, 181, 146, 121)_

26. **List and table analogues** - No true data table appears in this slice. Row-based patterns to borrow: Assistants master list (194) = grouped by date caption ('Last month, Feb 26'), selected row #ececec rounded pill with bold name, right-aligned time and mono ID below; Logs rows (158); modal 'Properties' grid (111) with 12-13 css grey column headers (Name / Type / Description) over a hairline, 36 css input cells per row, trailing trash icon and drag-handle glyph at row start. _(evidence: 194, 158, 111, 157)_

## Rasikh mappings

| Rasikh screen / pattern | reference idx | why |
|---|---|---|
| Agent activity feed (did / waiting on / needs approval) | 158, 132, 147 | 158 gives the timestamped, direction-coded event rows (36 css pitch, mono names, right-aligned times, inline token counts) to mirror as feed rows with status icons; 132 shows the per-step trace (icon + step name + output + resp chip) for expandable 'what the agent did' detail; 147/154 supply the quiet 'SESSION ENDED' divider and mono timestamp gutter. |
| Newcomer mobile app chat thread and composer | 132, 131, 199, 147 | No bubbles or avatars: steps and replies as plain left-aligned text with small outline icons; composer is a white rounded box with paperclip bottom-left and round black send bottom-right (131/132), plus a 12 css grey disclaimer line (199). Scale radii/heights up for 44px mobile touch targets. |
| Approval request card / confirmation dialogs | 140, 139, 135, 136 | Destructive/approval dialog: plain-language consequence paragraphs, checkbox gate ('I want to...'), neutral Cancel + coloured primary (140/139). 135 is the success confirmation (solid green check + one bold line). 136 shows a mixed modal with tabs, read-only copy fields and tertiary footer links. |
| Employer / landlord / bank desktop dashboard shell | 141, 194, 163, 101 | Sidebar on #f3f3f3 with grouped captions and #e0e0e0 selected pill, text-only top bar, one inset white card with a ~55 css header strip and hairline: the exact shell for all three desktop dashboards. 101/141 show the card-grid home, 194 the master-detail, 163 the main + 320 css right rail layout. |
| Landlord application detail + risk summary | 194, 199, 195 | Master list (date caption, selected row, right-aligned meta) next to a detail pane with uppercase micro-section labels (ASSISTANT, TOOLS, MODEL CONFIGURATION), key/value rows, toggles with info icons and a footer action bar (Clone / Updated time). Map verified fields to the label/value rows and the risk summary to a plain-language block under a micro-label; the top-right outline button (Edit) pattern fits decision actions. |
| Trust passport per-party field visibility toggles | 199, 194, 163, 147 | Toggle rows: 14 css label + info icon left, ~32x19 css toggle right (off #e0e0e0, on #171717), hairline row separators at ~36 css pitch (194 Tools section); segmented control (147 Normal/Semantic/Disabled) for three-state visibility; section groups under uppercase micro-labels. |
| Roadmap with dependencies / step status | 104, 107, 132, 133 | Node canvas shows dependencies as white cards with pastel icon tiles joined by curved light-grey connectors and a palette grouped by captions; reuse the card anatomy (icon tile + name + muted type line) as roadmap step cards stacked vertically on mobile, and Live/Draft pills (133) for step status. |
| Document upload + AI extraction + confidence | 127, 174, 198, 111 | 127 is the upload modal pattern (centred empty-state body, 'Create' + 'Upload' buttons); 174 shows attachment thumbnails with an x above the composer; 111 gives the extracted-fields grid (grey column headers over a hairline, 36 css input cells, ENUM-style mono type chip) where a confidence chip can replace the type chip; 198 gives the review-and-edit large textarea modal. |
| Add-hire flow (multi-field modal) | 111, 109, 105, 198 | Modal with title + grey sub-line, 14 medium labels over 36 css bordered inputs, row-add pattern ('+ Add property' secondary pill), and footer with tertiary left action and Cancel + primary Update on the right; 105 is the minimal one-field publish variant. |
| Empty and blocked states across dashboards | 193, 181, 145, 130 | Use the ~40 css icon tile + 14 css medium title + 13 css grey sentence + 1-2 buttons stack for 'No hires yet', 'No applications', 'Documents needed' and permission/blocked prerequisites. |
| Language switcher / workspace switcher | 141, 194, 133, 163 | Top-bar switcher style: label text with an up-down chevron pair ('ASMobbin' and 'Default project' each with chevrons) plus gear and avatar at right - use the same chevron-pair text trigger for the EN/AR language switcher; menu style from 133 (white popover, ~32 css rows) and 163 (check mark on selected row). |

## Gaps (not measurable from slice 100-199)

- No dark theme, no charts/usage billing, no real data table, no toast (snackbar) component, no inline field-error styling, no onboarding wizard, no RTL. Take those from other slices.
- Exact font family and weights cannot be read from pixels; sizes above are inferred from cap heights (cap-height ratio ~0.72 assumed).
- Radii are estimated from corner profiles (+/-2 css); shadow values are visual estimates (soft, roughly 0 4px 12px at ~5% black).
