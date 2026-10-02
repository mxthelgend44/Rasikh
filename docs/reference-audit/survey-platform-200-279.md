# Survey: OpenAI Platform web Apr 2026, screens 200-279

Slice: indices 200..279 inclusive (80 screens). Reviewed every screen through the contact sheets (`.reference/contact-sheets/platform-late/platform-200-215.jpg` to `platform-264-279.jpg`) and 40+ at full resolution (Mobbin footer cropped; app viewport 1920x1205).

## Scale and method note

- Every image is 1920x1325; bottom 120 px is the Mobbin footer and was cropped before all measurement.
- **Assumed scale: 1.27 screenshot px per CSS px (estimated).** The captures look like a ~1512-CSS-px-wide viewport (a 14-inch MacBook default) shot at 2x and resized to 1920 wide. Evidence: sidebar item pitch 45.6 px = 36 CSS; Logs table row pitch 57.1 px = 45 CSS; 40 px buttons/pills = 31.5, so 32 CSS; modal width 570 px = 449 CSS (450); sidebar padding 15 px = 11.8 CSS (12); key/value row pitch 42 px = 33 CSS; 1-CSS-px hairlines render blurred across 2 rows (resize artifact). 1.25 (1536-px viewport) fits within ~2% and is not excluded.
- Where a number is written `NN px (MM css)`, NN is measured in screenshot pixels and MM = NN / 1.27, rounded. Anything marked *est.* is inferred, not read off a pixel run.
- Hex values were sampled from flat regions (most common colour in the region). Text colours are the darkest anti-aliased pixel in the glyph run, so they are lower bounds on darkness.
- Not measurable from this slice: dark mode of the app shell (none in 200-279; 239/240 only contain a dark logo-preview panel), hover/focus/pressed states, animation timing, font family name (it is a neutral grotesque, OpenAI-Sans-like, with a mono for IDs/keys/JSON).

## Catalog (idx | kind | theme | note)

| idx | kind | theme | note |
|---|---|---|---|
| 200 | chat-composer | light | Assistants playground, Smart Alarm config, empty thread |
| 201 | settings-form | light | Assistants config scrolled: model configuration, temperature, top P |
| 202 | modal-dialog | light | Function modal over Assistants, example JSON, mid-open |
| 203 | modal-dialog | light | Function modal, Generate popover fading in (transitional) |
| 204 | modal-dialog | light | Function modal, generating overlay on definition (transitional) |
| 205 | modal-dialog | light | Function modal, manage_alarms JSON definition, Cancel/Add |
| 206 | chat-composer | light | Assistants playground, message typed in composer, Run |
| 207 | chat-thread | light | Assistant thread running, tool call awaiting submit output |
| 208 | chat-thread | light | Thread with tool call, green Submit button, Cancel |
| 209 | chat-thread | light | Completed thread: user, assistant, tool call, composer |
| 210 | loading-state | light | Usage page skeleton shimmer, Add credits card |
| 211 | empty-state | light | Usage with zero spend, no usage data this period |
| 212 | chart-usage | light | Usage dashboard: total spend bars, budget, sparklines |
| 213 | chart-usage | light | Usage dashboard, small hover tooltip on bar |
| 214 | chart-usage | light | Usage dashboard, tokens tooltip input/output breakdown |
| 215 | chart-usage | light | Usage capability cards scrolled, all zero requests |
| 216 | dropdown-menu | light | Usage date-range popover, presets plus two-month calendar |
| 217 | dropdown-menu | light | Date-range popover Last 30 days checked, brush below |
| 218 | chart-usage | light | Usage chart with brush range selector |
| 219 | chart-usage | light | Usage chart zoomed to range, brush tooltip |
| 220 | modal-dialog | light | Export modal, Activity data tab, grouped selects |
| 221 | modal-dialog | light | Export modal, Cost data tab, Download button |
| 222 | modal-dialog | light | Download files modal, csv file row |
| 223 | modal-dialog | light | Download files modal, copied/check state |
| 224 | empty-state | light | API keys empty: lock icon, create secret key |
| 225 | list-table | light | API keys table, one row, edit/delete icons |
| 226 | modal-dialog | light | Create new secret key modal, empty fields |
| 227 | modal-dialog | light | Create secret key modal, permissions list, Cancel/Create |
| 228 | dropdown-menu | light | Permission select open: Read/Write/None in modal |
| 229 | modal-dialog | light | Create secret key modal, permissions set, Create active |
| 230 | toast-banner | light | Save your key modal, green API key generated toast |
| 231 | modal-dialog | light | Save your key modal, key field with Copy |
| 232 | modal-dialog | light | Save your key modal, copied check state, summary |
| 233 | modal-dialog | light | Revoke secret key confirm modal, red Revoke button |
| 234 | toast-banner | light | API key revoked green toast, API keys empty state |
| 235 | empty-state | light | ChatGPT Apps empty: create and publish new app |
| 236 | list-table | light | Apps list: Your Apps card, version/status row |
| 237 | onboarding | light | New App wizard step 1, logo upload empty |
| 238 | onboarding | light | New App wizard step 1, logo uploaded, light preview |
| 239 | file-upload | mixed | Wizard step 1, light and dark logo preview panels |
| 240 | settings-form | mixed | Wizard step 1 filled, logo plus name/subtitle/description |
| 241 | settings-form | light | Wizard step 1 lower fields: category, URLs, checkbox |
| 242 | settings-form | light | Wizard step 1 lower fields filled, Continue |
| 243 | onboarding | light | Wizard step 2 MCP Server, domain verification |
| 244 | onboarding | light | Wizard step 2, MCP URL filled, token fields |
| 245 | error-state | light | Wizard step 2, red error toast, inline errors, scanning |
| 246 | dropdown-menu | light | Apps list with row menu Delete App |
| 247 | modal-dialog | light | Delete app? confirm modal, Cancel and Delete App |
| 248 | empty-state | light | Logs Completions empty: Enable API call logging |
| 249 | list-table | light | Logs Responses table, filter chips, 14 results |
| 250 | list-table | light | Logs Traces table, workflow/flow/handoffs columns |
| 251 | dropdown-menu | light | Enable API logging popover: radio org/project, Save |
| 252 | toast-banner | light | Setting updated successfully toast, Logs empty |
| 253 | list-table | light | Logs Responses filtered by Prompt ID, 14 results |
| 254 | detail-page | light | Logs/Responses detail: instructions, input, output, properties |
| 255 | dropdown-menu | light | Metadata filter popover: key/value, Add key, Apply |
| 256 | dropdown-menu | light | Metadata filter popover with values entered |
| 257 | empty-state | light | Logs Responses filtered chip, no responses |
| 258 | detail-page | light | Logs/Responses detail with Previous Response |
| 259 | detail-page | light | Logs/Responses detail with long JSON output |
| 260 | list-table | light | Storage Files: master list, file detail, Ready pill |
| 261 | empty-state | light | Storage Vector stores empty: Create a vector store |
| 262 | empty-state | light | Storage Skills: No skills found |
| 263 | detail-page | light | Vector store detail: properties, Files attached, Used by |
| 264 | detail-page | light | Vector store detail, name editing, list still empty |
| 265 | toast-banner | light | Vector store updated green toast, selected store row |
| 266 | detail-page | light | Vector store list row selected, renamed, detail pane |
| 267 | file-upload | light | Attach files modal, drag files here or click |
| 268 | file-upload | light | Attach files modal with attached file row, Attach |
| 269 | detail-page | light | Vector store with one file attached, Uploaded column |
| 270 | empty-state | light | Batches empty: No batches found, Learn more/Create |
| 271 | detail-page | light | Batch detail Failed: errors, key-values, event timeline |
| 272 | modal-dialog | light | Create a batch modal, upload dropzone, selects, radios |
| 273 | modal-dialog | light | Create a batch modal, Select existing, Create active |
| 274 | detail-page | light | Batch detail Validating: key-values, Cancel batch |
| 275 | empty-state | light | Evaluation Datasets empty: datasets will appear here |
| 276 | empty-state | light | Evaluation Evals empty: evaluations will appear here |
| 277 | modal-dialog | light | Create a new dataset modal, Quick start options |
| 278 | modal-dialog | light | Create a new dataset, prompt linked, Trip chip |
| 279 | modal-dialog | light | Create a new dataset, linked prompt variables list |

## Canonical picks per category (indices from this slice)

| category | indices |
|---|---|
| shell_sidebar | 212, 225, 260, 249, 271, 276 |
| top_bar | 212, 225, 249, 209 |
| data_table | 249, 225, 250, 236, 253, 263 |
| settings_form | 241, 240, 227, 220, 201, 244 |
| detail_page | 254, 260, 271, 263, 274, 259 |
| empty_state | 276, 235, 224, 270, 275, 248 |
| loading_state | 210, 245, 274 |
| error_state | 245, 271 |
| modal_dialog | 233, 227, 272, 277, 220, 247 |
| dropdown_menu | 216, 228, 255, 251, 246 |
| toast_banner | 230, 245, 234, 252, 265 |
| tabs | 249, 260, 212, 227, 276, 220 |
| chart | 212, 213, 214, 218, 219, 215 |
| dark_mode | (none in slice) |
| input_states | 227, 239, 245, 249, 257, 242 |
| buttons | 225, 233, 271, 260, 247, 245 |
| onboarding | 237, 238, 243, 244, 245 |
| chat_thread | 209, 208, 207 |
| chat_composer | 209, 206, 200, 207 |
| status_pill | 260, 271, 274, 247 |
| file_upload | 267, 272, 268, 237, 273 |

## Design-language observations

1. **App shell: three-layer canvas.** Sidebar and top bar share one flat #f3f3f3 canvas (top bar 70 px = ~55 css tall, sidebar 277 px = ~218 css wide, no divider lines between them). Page content lives in an inset white (#ffffff) card with a 1 px #ececec border, ~10 px (8 css) gap to the viewport on the right and bottom, small corner radius (~6 px, est.) and no shadow. The card, not the page, is what scrolls. _(evidence: 212, 225, 249, 260, 271)_
2. **Top bar.** Left: 25-css black circle avatar with letter, org name in medium weight, a chevrons-up-down switcher glyph, a thin slash, then project name with the same switcher (breadcrumb-as-switcher). Right: 'Dashboard' in black medium, 'API Docs' in muted gray, gear icon, a light-gray circular user avatar. Pure text and icons, no buttons or borders. _(evidence: 212, 225, 209)_
3. **Sidebar anatomy and metrics.** 12 css side padding (15 px). Item pill is 247x40 px (~195x32 css), pitch 45.6 px (36 css, so a 4 css gap), 16 css outline icon (31-50 px) then 14 css label starting at x=64 px. Selected item = flat #e0e0e0 fill with ~6-8 css radius, same text weight and colour (no bold, no accent bar). Group labels 'Create / Manage / Optimize' are 12 css, #818181 regular, with ~39 css between the last item of one group and the next label. A panel-collapse icon is pinned bottom-left; some screens add a bordered 'Add credits' upsell card above it (bold title, x close, 2-line body, black pill button). _(evidence: 212, 225, 260, 210, 224, 235, 270)_
4. **Page header row inside the card.** Header row is 71 px (~56 css) tall with a 1 px hairline (~#e8e8e8) under it. Title is ~20 css medium/semibold (cap height 18 px), inset 31 px (~24 css) from the card edge; actions are right-aligned at the same 24 css inset. Sub-pages use back/breadcrumb titles: '< Assistants', 'Apps > Smart Travel Planner', '< Logs / Responses' with the parent in the same size as the child. _(evidence: 225, 209, 254, 245, 271, 239)_
5. **Type scale and text colours.** One neutral grotesque plus a mono. Body, nav and table cells 14 css; uppercase micro-labels 12 css (cap height 11 px) with ~0.04em tracking and weight 500-600; helper text 12-13 css; page titles ~20 css; hero metric numbers ~20-22 css semibold; detail-pane section headings ('Files attached', 'Used by') ~20 css semibold; mono (~13 css, est.) for IDs, keys, filenames, JSON. Only three text greys: near-black (#030303 sampled), secondary ~#444-#494949, tertiary/placeholder ~#787878-#828282. _(evidence: 212, 225, 260, 263, 271, 209)_
6. **Buttons.** Primary: solid #181818 fill, white 14 css medium text, 32 css tall (40 px; 'Create new secret key' is 233x40 px = ~183x32 css), ~6 css radius (est.), leading plus or icon at 16 css. Secondary: #ececec fill, no border (Cancel, Learn more with book icon, Upload, Create assistant). Destructive: solid #e12e2a with white text. Disabled primary becomes pale gray fill with gray text (still full size). Icon-only buttons are 32 css squares (neutral #ececec or red). Quiet outline buttons (white, 1 px border) appear for Back and Remove. _(evidence: 225, 233, 271, 260, 247, 245, 227, 239)_
7. **Segmented control vs underline tabs.** Segmented control: #eeeeee track, selected segment white with a hairline border and faint shadow, 32 css tall, 14 css medium text, unselected #494949. Used beside page titles for sub-navigation (Logs: Completions / Responses / Conversations / ChatKit threads / Traces; Storage: Files / Vector stores / Skills; Evaluation: Datasets / Evals) and inside forms (You / Service account; All / Restricted / Read only; full-width Activity data / Cost data). Underline tabs (API capabilities / Spend categories; Users / Services / API Keys) are reserved for sections inside a card: active label black medium with a thin underline, inactive gray, hairline below the row. _(evidence: 249, 260, 276, 212, 227, 220)_
8. **Dense data table.** Logs table: rows 57.1 px (45 css) apart, hairline #f2f2f2 separators edge to edge, no vertical rules, no zebra, no outer border. Header row has a #f9f9f9 fill ~30 css tall with small regular-weight labels (Input / Output / Model / Created). Cells are single line with ellipsis truncation; first column text is inset 20 css from the card edge; the Output cell leads with a small bordered rounded-square icon. 14 rows fit in one viewport. _(evidence: 249, 253, 250)_
9. **Simple table with row actions.** API keys table: no header fill, UPPERCASE 12 css header labels in near-black (#0c0c0c) with a tiny info icon, 14 css cells, secret key shown in mono and masked ('sk-...0sEA'), status as plain text (no pill), row actions as two icon buttons at the right (edit in gray, trash in #e12e2a). Table sits under three short plain-language paragraphs in the card body (24 css inset, ~36 css paragraph pitch). _(evidence: 225, 233, 236)_
10. **Filter chip row.** Above the table: fully-rounded pills with a 1 px #dcdcdc border, white fill, gray (#797979) icon plus label, ~27 css tall (Model, Date, Metadata, Tool call), then pill-shaped search inputs ('Prompt ID pmpt_123456', 'Input Search...'), then a plain '14 results' text in #444. A pill that has a value applied fills solid dark gray; Metadata opens a popover with key/value inputs, 'Add key' row, and Clear / Apply (Apply in green text). _(evidence: 249, 255, 256, 257, 248)_
11. **Master-detail layout.** List pane (299-955 px) + detail pane (from ~976 px) split by a 1 px #f7f7f7 vertical hairline, both full card height. List rows are two lines (mono primary 14 css, 12 css meta line) 84 px (66 css) tall; selected row = #eeeeee fill with ~8 css radius; unselected rows divided by hairlines; date is right-aligned 12 css #464646. Detail pane: uppercase overline (FILE / BATCH / VECTOR STORE), ~20 css semibold title, then a key-value list; a footer bar with a top hairline pins actions (red icon button for delete + neutral icon or 'Add files'). _(evidence: 260, 271, 263, 266, 274)_
12. **Key-value property list.** Each row: 16 css gray outline icon, #444 label (column ~170 css wide), black value; row pitch ~42 px (33 css); related groups separated by a hairline (e.g. request counts / Files: Input / Output / Error). Values can carry inline affordances (pencil to edit, info icon, underlined link, external-link glyph, red mono error text 'Line 1 Missing required parameter...'). Same pattern is reused in the narrower right 'Properties' rail of log detail with right-aligned values and collapsible chevron headers. _(evidence: 260, 271, 263, 254)_
13. **Status pills.** Icon plus label in a ~24 css tall rounded rectangle, no leading dot: Ready = #daf5e5 fill, green text, check-circle; Failed = #ffe2e3 fill, red text, warning triangle (also shown inline in the list row); Validating = neutral gray pill; Draft = plain text with eye-off icon (no fill). Tinted-background plus saturated-foreground is the single recipe; the same hues drive toasts (#49b880 green, #e12e2a red). _(evidence: 260, 271, 274, 247)_
14. **Modal anatomy.** Overlay is black at ~30% (page #ffffff becomes #b2b2b2, sidebar #f3f3f3 becomes #aaaaaa; the overlay covers sidebar and top bar too). Sheet is white, 570 px (~450 css) wide, centered on the viewport horizontally and vertically (confirm modal 433-778 px), or pinned ~43 css from the top when tall with internal scroll and a hairline above the footer. ~20 css padding, ~8-9 css radius (est.), soft diffuse shadow fading over ~12 px. Title ~18 css semibold, body 14 css black, footer buttons right-aligned (secondary Cancel then primary or red). Optional x top-right. Wider variant for code editing is ~889 px (700 css). _(evidence: 233, 227, 272, 277, 220, 247, 205)_
15. **Form fields.** Label 14 css medium above field; 'Optional' as gray text next to the label rather than required asterisks; 12 css helper text (#383838) under the label. Inputs: white, 1 px ~#d7d7d7 border, ~6 css radius, 32 css tall (40 px), placeholder #787878; single-field confirm boxes are taller (50 px = ~40 css). Selects show a chevrons-up-down glyph. Permission matrix rows: label plus info icon on the left, 'None / Read' select on the right in gray. Grouped settings card (export): one bordered rounded block, rows separated by hairlines, label left, value plus chevrons right. Toggle: off = light-gray track, white knob; on = black track. _(evidence: 227, 233, 220, 209, 205, 239)_
16. **Toasts and inline errors.** Toast is top-center, overlapping the top bar at ~9 css from the top, 237x55 px (~187x43 css), solid #49b880 (success) or #e12e2a (error), white 14 css medium text plus a small x dismiss, ~6 css radius. Error toast ('MCP Server section has errors. Please fix them before continuing.') is paired with red (#e12e2a) inline messages under the offending fields ('MCP tools scan is required', 'Domain must be verified') and a red X icon next to 'Domain not verified'. _(evidence: 230, 245, 234, 252, 265)_
17. **Empty states.** Centered stack at roughly mid-height: 39 css icon tile (#eeeeee fill, ~8 css radius, 20 px glyph) then a bold ~16 css title, a one-line 14 css gray description, then a black primary button with plus (and sometimes a secondary 'Learn more' or text link). Copy pattern: 'Your evaluations will appear here', 'No batches found', 'Create a vector store'. In split layouts the list pane shows the empty state and the detail pane shows a bold centered 'Select a batch to view details.' _(evidence: 276, 275, 235, 270, 261, 262, 224)_
18. **Loading skeleton.** Real labels, tabs and headings render immediately; only values and charts are replaced by rounded blocks (#efefef and #f6f6f6 with a diagonal shimmer gradient, ~8 css radius) at their final geometry (hero metric chip, 800x280 css chart block, 28 css list rows). Spinner appears only inside a button-like gray block ('Scanning tools...') for an in-form async check. _(evidence: 210, 245)_
19. **Chart language.** Single-hue purple (#885be3) bars, daily buckets; zero days drawn as thin gray dashes (#bfbdc8) instead of gaps; one dashed horizontal max line in a purple-gray with its value in purple at the left ('$1.81', '26'); only first and last date labels on the x-axis (#606263), no y-axis, no gridlines; legends are square swatches plus text ('41 requests', '24.732K input tokens'). Hover tooltip is a small white card with date, bold figure and colour-swatched rows. A brush/range slider with a purple outline sits under the chart. Sparklines in the side rail use thin orange/red lines. _(evidence: 212, 213, 214, 218, 219, 215)_
20. **Metrics rail.** Right column (1502-1908 px, ~320 css) is divided by hairlines into stacked blocks: label (14 css) then value (~20 css semibold) then sparkline. Budget block adds a 16 px tall #eeeeee progress track with a #0e903b fill, tick marks, and the caption 'Resets in 28 days. Edit budget' (underlined link). The hero 'Total Spend $2.01' on the left pairs the figure with a smaller purple secondary figure. _(evidence: 212, 211, 220)_
21. **Popovers, menus and date-range picker.** Anchored under the trigger chip and right-aligned; white card, hairline border, soft shadow. Left column of presets (Week to date ... Last 30 days, 14 css, 36 css pitch, checkmark on active), right area two month grids (cells ~30x32 css) with navigation chevrons. Range endpoints are black filled circles with white numerals; in-range days sit on a #eee band; days outside the available range are light gray. Sibling controls in the header: a removable 'Default project (x)' pill, the range chip with calendar icon and chevrons-up-down, and a ghost 'Export' button with a download arrow. Other popovers use the same white card (hairline border, soft shadow, ~8-10 css radius, 14 css items, #eee hover/selected row): the permission select is a three-item list (Read / Write / None); the Enable API logging popover holds two radios, a full-width gray Save, a divider and a 12 css footnote with a link; the app-card ellipsis menu is a one-item 'Delete App' popover. _(evidence: 212, 216, 217, 228, 246, 251, 255)_
22. **Chat thread and composer (playground).** Three regions: config pane (~320 css) / thread / optional logs. Thread has no bubbles or avatars: bold 14 css role label ('User', assistant name) above a ~16 css body, in one centred column ~700 css wide with ~28 css between turns. Tool calls render in mono with a return arrow and result. Awaiting-input state shows an inline mono 'Submit output e.g. {success: "true"}' field plus a Submit button (green when ready). Composer: ~750x103 css bordered rounded box (~12 css radius est.) with placeholder, three bordered square icon buttons bottom-left, a '+' and a black 'Run (cmd+enter)' bottom-right; Run becomes a gray 'Cancel' while running; a 12 css gray disclaimer is centred under the box. _(evidence: 209, 208, 207, 206, 200)_
23. **Stepper wizard.** Six-step progress track (thin full-radius #eeeeee bar) with a hollow 12 css dot per step and a blue fill to the current step; labels beneath (current black, future light gray). Form column is ~670 css wide, centered in the card, with ~20 css headings and 13 css helper text. Header carries Back (outline) and Continue (black) plus a muted autosave status ('Draft saved 4 seconds ago' with check-circle); the same Back / Continue pair repeats at the foot. Numbered instruction list in 14 css gray, read-only token fields with Copy buttons, a gray 'Verify Domain' secondary action. _(evidence: 237, 238, 243, 244, 245)_
24. **Copy tone and destructive confirmation.** Sentence case throughout; CTAs are direct verbs naming the object ('Create new secret key', 'Revoke key', 'Delete App'). Destructive modals state the consequence in plain language, with the entity name in bold ('This will permanently remove **Smart Travel Planner**.'), and put Cancel left of the red confirm. Secrets modal explains the one-time visibility ('you won't be able to view it again') in bold inside the sentence. Success toasts are short ('API key generated!', 'Setting updated successfully'). _(evidence: 233, 247, 230, 234, 252)_
25. **Density and spacing rhythm.** Everything snaps to a ~4 css grid: top bar 56, header row 56, table row 45, nav row 36, key-value row 33, button/input/segmented 32, paragraph line pitch ~21 (27 px), card gutter 24 css. Compact controls with generous outer whitespace; chrome is monochrome (black primary buttons, gray fills) and colour is reserved for semantics (green/red status, purple data). Borders are 1 css hairlines in #e8-#f2 range; cards and modals rely on borders and a single soft shadow rather than elevation layers. _(evidence: 212, 225, 249, 260, 271, 227)_

## Rasikh mappings

| Rasikh screen / pattern | reference idx | why |
|---|---|---|
| Employer hires table (sortable, stage / days / blockers) with filters and metrics | 249, 253, 250, 225, 257 | 249 is the dense dashboard table to mirror: 45 css rows with hairline separators, #f9f9f9 header, ellipsis truncation, pill filter chips plus 'N results' above. 225 is the lighter variant (uppercase header, row-action icons) for a short hires list. 257 shows the filtered-to-empty state. |
| Hire detail timeline (employer) and batch-style progress detail | 271, 254, 260 | 271 combines a status pill, icon-labelled key-value list and a dated event timeline (time, dot, event) at the bottom: the exact skeleton for a hire's stage history and blockers. 254 adds the main-column plus right 'Properties' rail layout for a hire summary. |
| Landlord applications list + application detail with verified fields, employer-backing badge, plain-language risk summary | 260, 271, 266, 263, 254 | Master-detail (list with selected #eee row, detail with overline, title and key-value fields) maps directly to applications list plus application detail. Status pills (Ready / Failed) model verified / flagged badges and the employer-backing badge; 254's gray code-like block and labelled sections suit the plain-language risk summary; 263 shows titled sections with inline empty copy. |
| Decision actions and approval request card (approve / request info / offer terms; employer 'back this hire') | 233, 247, 227, 230, 234 | Confirm modals with a plain-language consequence sentence, secondary Cancel plus a single solid confirm button (red for destructive, black for normal) fit the approval request and decision actions. 230 and 234 give the success-toast pattern after the decision; 233's masked identifier box maps to showing the application or hire being acted on. |
| Trust passport per-party field visibility toggles | 227, 228, 229, 232, 209, 220 | 227/228 are a permission matrix: one row per field (label plus info icon) with a right-aligned None / Read select, a preset segmented control (All / Restricted / Read only) above, and a read-only summary with a lock icon ('3 selected permissions') in 232. 209 shows the on/off switch row pattern (switch, label, info icon, secondary action). |
| Document upload with AI extraction and confidence | 272, 267, 268, 260, 239 | 272 and 267 are the dropzone pattern (icon, 'Upload a file or drag your file here', accepted-format hint, Upload button, disabled Attach until a file exists); 268 shows the attached-file row with size and timestamp; 260 shows a file list with a status pill (Ready) and a key-value detail pane that can carry extracted fields plus confidence. 239 shows preview-after-upload with a Remove action. |
| Roadmap of ordered steps with visible dependencies | 243, 244, 245, 237, 271 | The 6-step progress track with labelled stops (current dark, future gray) shows ordered steps; 245 shows a blocked step ('Continue' with inline red 'must be verified' messages and a failed-check X icon) which maps to an unmet dependency; the numbered instruction list in 243-245 maps to per-step tasks. 271's timeline covers completed steps with timestamps. |
| Agent activity feed (did / waiting on / needs approval) | 209, 207, 208, 271 | The thread is borderless, avatar-free turns with a bold actor label then body, tool calls as mono lines with a return arrow ('did'), an inline awaiting-input row with Submit ('needs approval', 208), a Cancel button during a running state ('waiting on', 207). 271's dated event list suits a compact activity log. |
| Add-hire flow and other create modals | 277, 278, 279, 272, 273, 244 | 277-279 show a centred create modal (title, one-line description, name input, grouped optional 'Quick start' rows, full-width Create that stays disabled until valid); 272/273 show the longer form-in-modal with labelled sections, radios and helper text; 244 is the multi-step full-page alternative with Back / Continue. |
| Employer dashboard metrics row and chart cards | 212, 215, 213, 211 | 212's stacked metric blocks (label, 20 css value, sparkline, progress bar with caption) in a hairline-divided right rail and the hero figure with a small secondary figure map to the metrics row (hires in progress, days to complete, blockers). 215 shows small-multiple cards with legends; 211 shows the zero-data variant and 213 the tooltip. |
