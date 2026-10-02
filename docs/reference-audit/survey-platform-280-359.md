# Survey: OpenAI Platform web Apr 2026, screens 280..359

Scope: 80 screens (indices 280..359 inclusive). Every index was checked on the contact sheets, and about 35 screens were opened at full resolution with the Mobbin footer cropped (bottom 120 px). The app viewport is 1920x1205.

## Scale assumption (read first)

- All numbers below are RAW image px (the file is 1920 px wide). Nothing has been divided.
- Estimated scale: the screens look like a 1440 CSS px viewport resampled to 1920, a factor of about 1.333. This is inferred and not verified. Evidence:
  - Hairlines are anti-aliased, e.g. the sidebar border is `#eeeeee` then `#fafafa` across 2 px.
  - Input borders are about 2 px wide at about `#e2e2e2`.
  - Round numbers appear after dividing by 1.333: sidebar 277.5 raw = 208 CSS (13rem), top bar 70 raw = 52 CSS, control height 40 raw = 30 CSS, nav pill 40 raw = 30 CSS, nav text cap-height 12.5 raw gives a 14 CSS font.
- If the measurement specialists find the true scale differs, divide the raw values by their factor. Do not use the CSS numbers here without checking.
- The sidebar is 277-278 raw wide including its 1 px border. The content card starts at x=279, y=70 and ends about 12 raw px short of the right and bottom viewport edges.

## Catalog (80 rows)

| idx | kind | theme | note |
|---|---|---|---|
| 280 | modal-dialog | light | Evaluation: "Create a new dataset" modal |
| 281 | other | light | Trip prompt editor, empty dataset grid |
| 282 | list-table | light | Evaluation > Datasets list, one row "Trip" |
| 283 | dropdown-menu | light | Trip editor, Columns menu (Data/Annotations/Graders) |
| 284 | dropdown-menu | light | Trip editor, Columns menu open (repeat frame) |
| 285 | other | light | Trip editor, empty grid, menu closed |
| 286 | onboarding | light | New evaluation step 1: Select your data source |
| 287 | file-upload | light | Step 1 Import test data, "No files found" |
| 288 | file-upload | light | Step 1, Trip Planning.csv selected, column types |
| 289 | onboarding | light | Step 2/3 Create test criteria, Add button |
| 290 | modal-dialog | light | Add testing criteria: six option cards |
| 291 | modal-dialog | light | Create a grader modal, empty form |
| 292 | dropdown-menu | light | Create a grader, variable autocomplete list open |
| 293 | modal-dialog | light | Create a grader filled, Save enabled |
| 294 | onboarding | light | Step 2/3, String check grader added, Next |
| 295 | onboarding | light | Step 3/3 Review evaluation, Back/Run |
| 296 | detail-page | light | External Data Eval Report, configuration right rail |
| 297 | list-table | light | External Data Eval Data tab, Pass pills |
| 298 | list-table | light | Evaluation > Evals list, Completed status pill |
| 299 | empty-state | light | Fine-tuning: no jobs found, select a job |
| 300 | detail-page | light | Fine-tuning list + failed job detail panel |
| 301 | modal-dialog | light | Create fine-tuned model, validation errors, dropzone |
| 302 | modal-dialog | light | Create fine-tuned model, base model set, upload error |
| 303 | modal-dialog | light | Create fine-tuned model, existing file, hyperparameters |
| 304 | modal-dialog | light | Create fine-tuned model scrolled, hyperparameter radios |
| 305 | loading-state | light | Fine-tuning job "Validating files..." spinner, Cancel job |
| 306 | error-state | light | Fine-tuning job Failed, error text in detail |
| 307 | detail-page | light | Failed job detail scrolled, Messages timeline |
| 308 | app-shell-home | light | Chat prompts, collapsed icon-rail sidebar, body not loaded |
| 309 | dropdown-menu | light | Organization switcher open, Your prompts cards |
| 310 | app-shell-home | light | Chat prompts "Create a chat prompt" (SLMobbin org) |
| 311 | dropdown-menu | light | Project switcher open: Default project, Create project |
| 312 | modal-dialog | light | Create a new project modal, empty name |
| 313 | modal-dialog | light | Create a new project modal, "Europe Trip Plan" typed |
| 314 | toast-banner | light | Project created green toast, Chat prompts |
| 315 | docs | light | API Platform docs home, quickstart, model cards |
| 316 | docs | light | Docs home scrolled: Start building, help links |
| 317 | dropdown-menu | light | Profile menu with theme toggle, Chat prompts |
| 318 | dropdown-menu | dark | Dark theme profile menu, Your prompts cards |
| 319 | other | dark | Agent Builder: Travel Agent workflow canvas |
| 320 | other | dark | Audio playground, text-to-speech waveform, settings rail |
| 321 | other | dark | Images playground, generated lily, composer |
| 322 | chart-usage | dark | Usage dashboard: spend chart, budget, tokens |
| 323 | error-state | light | "Oops!" authentication token invalidated page |
| 324 | settings-form | light | Organization settings: details, verifications |
| 325 | settings-form | light | Organization settings scrolled: integrations, features |
| 326 | settings-form | light | Your profile, User tab form |
| 327 | empty-state | light | Org API keys: "Create an API key" empty |
| 328 | list-table | light | People & Permissions > Members, one member card |
| 329 | list-table | light | Projects table: filters, IDs, spend, Load more |
| 330 | billing | light | Billing Overview: free trial credit, links grid |
| 331 | billing | light | Limits: org budget bar, rate limits table |
| 332 | billing | light | Limits scrolled: usage limit, tier steps |
| 333 | chart-usage | light | Service health: uptime chart, incident history |
| 334 | settings-form | light | Data controls: radio groups per data type |
| 335 | empty-state | light | Security > Domain allowlist: Add domains empty |
| 336 | settings-form | light | Project settings: name, ID, tier, toggle, Save |
| 337 | empty-state | light | Project API keys: lock icon empty state |
| 338 | empty-state | light | Webhooks: no webhook endpoints found |
| 339 | settings-form | light | Project Evaluations: custom model providers note |
| 340 | list-table | light | Project People & Permissions, member filters |
| 341 | billing | light | Project limits: budget bar, model usage rows |
| 342 | modal-dialog | light | Verify your identity modal over Org settings |
| 343 | settings-form | light | Your profile form with values filled |
| 344 | toast-banner | light | "User profile successfully updated" toast on form |
| 345 | modal-dialog | light | Invite team members modal, empty fields |
| 346 | dropdown-menu | light | Invite modal, Role menu with descriptions |
| 347 | modal-dialog | light | Invite modal filled: email token, Owner role |
| 348 | toast-banner | light | "Invite sent" toast on Members tab |
| 349 | list-table | light | Invitations tab: pending invite, Resend/Remove |
| 350 | empty-state | light | Groups tab: "No groups found" |
| 351 | modal-dialog | light | Create group modal, empty name |
| 352 | modal-dialog | light | Create group modal, "Staff" typed |
| 353 | toast-banner | light | "Group created" toast, Staff group row |
| 354 | modal-dialog | light | Members of Staff modal, "No members found" |
| 355 | modal-dialog | light | Add members to Staff, member row with checkbox |
| 356 | modal-dialog | light | Add members to Staff, member checked, button on |
| 357 | toast-banner | light | "Added members to group" toast, Members modal |
| 358 | list-table | light | Roles tab: Owner and Reader preset roles |
| 359 | modal-dialog | light | Create role modal: name and description |

Notes on the catalog:
- Frames 283/284, 301/302/303 and 312/313 are near-duplicate states of one flow.
- 308 and 310 are transitional or empty-body frames. Do not use them as shell references beyond the collapsed-rail idea.
- Frame 314 shows a toast over the Chat prompts page.

## Canonical picks (up to 6 per category, this slice only)

| category | indices |
|---|---|
| shell_sidebar | 300, 329, 317, 328, 308, 322 |
| top_bar | 329, 311, 309, 317, 322, 319 |
| data_table | 329, 298, 297, 331, 295, 358 |
| settings_form | 344, 336, 324, 334, 343, 326 |
| detail_page | 300, 296, 307, 305, 297, 295 |
| empty_state | 337, 299, 350, 338, 354, 286 |
| loading_state | 305 |
| error_state | 323, 301, 300, 306, 302, 307 |
| modal_dialog | 347, 301, 290, 342, 354, 291 |
| dropdown_menu | 311, 309, 317, 346, 283, 292 |
| toast_banner | 344, 348, 353, 357, 314, 330 |
| tabs | 328, 330, 358, 300, 298, 296 |
| chart | 322, 333, 331 |
| dark_mode | 322, 318, 319, 320, 321 |
| input_states | 301, 344, 347, 342, 293, 292 |
| buttons | 329, 328, 301, 305, 342, 358 |
| onboarding | 286, 287, 288, 289, 294, 295 |
| chat_thread | none in this slice |
| chat_composer | 317, 320, 321, 311 |
| status_pill | 300, 298, 297, 305, 329, 358 |
| file_upload | 301, 288, 287, 303, 302, 295 |

Caveats:
- `chat_thread`: there is no conversation thread in this slice. "Chat prompts" is an empty or card-grid prompt library.
- `chat_composer`: 317 is the only prompt input, a "Generate..." pill input with an arrow button and suggestion chips. 320/321 are playground composers.
- `loading_state`: only one true loading frame exists (305).

## Raw measurements and sampled colours (raw px, sampled at flat regions)

These are a snapshot to help the specialists. They are not final tokens.

### Light theme

| token | value |
|---|---|
| shell and sidebar bg | `#f3f3f3` |
| content card bg | `#ffffff` |
| selected nav fill | `#e0e0e0` |
| secondary button fill | `#ececec` |
| segmented-control track / list selected row / empty icon tile | `#eeeeee` |
| table header band (296) | `#f9f9f9` |
| table header band (295, 297) | `#eeeeee` |
| selectable option card fill | `#f9f9f9` |
| dropzone fill | `#f9f9f9` |
| primary button fill | `#181818` (white label) |
| disabled primary fill (301) | about `#5c5c5c` |
| destructive button fill | `#e12e2a` |
| toast fill | `#49b880` |
| text darkest sampled | `#000`-`#0f0f0f` (about `#0d0d0d`) |
| helper text | `#454545` |
| inactive top-bar link | `#424242` |
| group label / muted | `#7f7f7f` |
| placeholder | about `#797979`-`#818181` |
| error text | `#9f362a` |
| green badge | bg about `#e3f4e7`, text `#105e25`-`#13672d` |
| blue badge ("Global") | bg about `#e0eefa`, text `#083465` |
| red badge ("Failed") | bg about `#ffe1dc`, text `#781711` |
| neutral badge ("Owner") | bg `#ececec` |
| hairlines | `#eaeaea`-`#eeeeee` (about 1-2 px raw) |
| modal overlay | shell `#f3f3f3` becomes `#aaaaaa` and white becomes `#b2b2b2`, so black at about 30% |

### Dark theme

| token | value |
|---|---|
| shell and top bar | `#131313`-`#141414` |
| content card, right panels, chart cards | `#212121` |
| selected nav, menu surface, prompt cards, composer, budget track | `#303030` |
| raised chips | `#3d3d3d` |
| hairline | `#3b3b3b` |
| primary button | `#f3f3f3` with dark label |
| chart accent | purple `#885be3` |
| agent-builder canvas | `#0d0d0d` |
| agent-builder nodes and palette | `#1c1c1c` |
| text | `#ffffff` / `#fcfcfc` |
| muted group label | `#9e9e9e` |
| axis label | `#7e7d80` |

### Geometry (raw px)

| element | measurement |
|---|---|
| top bar height | 70 |
| top bar breadcrumb text | vertical centre y=34 |
| nav pill | 40 tall, x 16..260, so 244 wide |
| nav row pitch | about 45.7 |
| primary control height (button, input, select) | about 40 |
| larger buttons (Save, Add member, Go to Billing) | 43-45 including edge |
| modal width, small | 632 (invite) |
| modal width, medium | 762 (create fine-tuned model) |
| modal width, large | 914 (members) |
| modal corner radius | about 20-24 |
| control corner radius | about 8-10 |
| modal header divider (301) | y=118 |
| modal footer divider (301) | y about 1067 |
| form field column width (344) | 433 |
| form field vertical pitch (344) | 122 |
| settings content column (330, 331) | x 522..1664 |
| table row pitch (329) | about 74 |
| table row pitch (297 grid) | about 46 |
| table row pitch (298 list) | about 38 |
| table row pitch (331 rate-limits) | 52 |
| master-detail divider (300) | x about 975 |
| detail rail (296) | x 1465..1908 |
| wizard left column (286-295) | 686 wide |
| wizard Back/Next buttons | about 46 tall |

### Type (cap height raw px, so estimated font size = cap / 0.7)

| text | cap height | estimated font size |
|---|---|---|
| page title | about 16.5 | about 24 |
| section heading (331) | about 15 | about 21 |
| nav / field label / tab / button | 12-13 | about 18 |
| table header (uppercase) | 10 | about 14 |
| helper text | 10 | about 14 |
| big stat (330) | about 38 for digits | |

Estimated CSS equivalents at 1.333: 18, 16, 14, 10.5. All of these are estimated.

## Observations (24)

1. **Three-zone shell on one tinted surface.**
   - Top bar (70 raw px) and sidebar (278 raw) share the shell tint `#f3f3f3` (dark `#131313`).
   - They have no separating border. A white (dark `#212121`) rounded content card is inset against them.
   - The card starts at x=279, y=70 and ends about 12 raw px before the right and bottom viewport edges.
   - A ring of tint around the card gives depth without shadows.
   - Evidence: 329, 328, 322, 318.
2. **Sidebar anatomy.**
   - Uppercase-free small grey group labels (about 14 raw px, `#7f7f7f`) with no dividers between groups.
   - Items are 40 raw px pills, 244 raw wide, on a 45.7 raw pitch.
   - Only the selected item has a fill (`#e0e0e0` light, `#303030` dark). Text weight and colour do not change.
   - The primary nav has 24 raw px line icons. The settings nav has none.
   - Evidence: 300, 329, 317, 322.
3. **One shell, two sidebars.**
   - The primary nav (Create / Manage / Optimize, with icons) swaps to a text-only settings nav (Settings / Organization / Project) when settings routes open.
   - The shell is unchanged.
   - The sidebar can collapse to an icon rail about 82 raw wide.
   - Evidence: 317 vs 329, 308.
4. **Sidebar footer.**
   - A dismissible "Add credits" or "Claim free tokens" card pins above the footer links.
   - It has a 1 px border, a `#f3f3f3` fill, a title with an x, two lines of grey copy, and a small fully rounded black "Go to Billing" button (44 raw tall).
   - Below it sit "Cookbook" and "Forum" links, with the collapse toggle bottom-left.
   - Evidence: 328, 331, 317.
5. **Top bar.**
   - A breadcrumb with a 28 raw px black circular org avatar (white initial) and "ASMobbin" in medium weight.
   - Org and project are separate switchers: text plus a tiny up/down chevron, with a hover pill (311).
   - On the right: "Dashboard" (active black) and "API Docs" (`#424242`), a gear icon, and an avatar circle.
   - Evidence: 329, 311, 317, 322.
6. **Page header stack.**
   - Left-aligned page title (about 24 raw px, medium weight) at x=309, with its centre at y=105.
   - Underlined text tabs follow (active = darker and heavier with a 2 px underline, inactive = muted grey).
   - A full-width hairline sits at y about 178.
   - A toolbar row follows: search on the left, actions right-aligned (Export secondary, primary "+ Create/Add member").
   - Evidence: 328, 330, 358, 349.
7. **Two kinds of tabs.**
   - Underline tabs for page sections: Members/Invitations/Groups/Roles and Overview/Payment methods.
   - Segmented control for filters and view switches: an `#eeeeee` track, an active white segment with a thin shadow, and no border.
   - Examples: All/Successful/Failed, Datasets/Evals, Report/Data.
   - Evidence: 328, 330, 300, 298, 296.
8. **Tables are borderless and airy.**
   - No outer border. 1 px hairline row separators (`#eaeaea`).
   - Header is uppercase 10-px-cap letter-spaced labels on white (329). In other tables it is sentence case on a `#f9f9f9` band (296, 298) or an `#eeeeee` grid band (295, 297).
   - Ids and numbers are monospace. Numeric columns are right-aligned.
   - Row actions are icon buttons far right (a destructive icon is red).
   - Row height is about 74 raw in the settings table but 38-46 in dense grids, so density depends on the page.
   - Evidence: 329, 331, 297, 298, 295.
9. **List-as-cards for people and roles.**
   - Rows live inside one 1 px bordered rounded card (radius about 12).
   - A circular `#eeeeee` avatar with an initial sits left.
   - Title is followed by inline tiny badges (You, Owner, Preset). Muted secondary text is below.
   - Actions are right-aligned: a secondary pill and a primary dark pill (Leave + Roles, Assignments + Permissions) plus a "..." menu.
   - Evidence: 328, 358, 349.
10. **Buttons.**
    - Primary is `#181818` with a white label, 40 raw tall, radius about 8-10, an optional leading "+" glyph, and no border.
    - Secondary is `#ececec` with a dark label and no border.
    - A low-emphasis outlined pill (white, 1 px border, fully round) is used for "Add alert", "Edit budget" and inline "+ Add".
    - Disabled primary dims to about `#5c5c5c` (301). Disabled secondary shows grey text on `#ececec` (342, 354).
    - Destructive is solid `#e12e2a` (305), shown only while a job is running.
    - Evidence: 329, 328, 301, 305, 342.
11. **Status pills and badges.**
    - Tinted background with deeper tinted text and a small radius (about 6 raw), 24-29 raw tall. Icons are optional.
    - Colours: green = Completed / Pass / Preset / You / Usage tier 1, blue = Global, red with a triangle icon = Failed, neutral grey = Owner, grey with a spinner = Validating.
    - The "Live" indicator is a fully round green pill with a dot (333).
    - Evidence: 300, 298, 297, 305, 329, 358, 328, 331, 333.
12. **Forms.**
    - A bold label sits above a grey helper line, then the input.
    - Input is 40-42 raw tall with a 1 px `#e0e0e0`-ish border and radius about 8-10. The placeholder is `#797979`-`#818181`. A read-only or disabled value is just greyer text on white.
    - Settings forms use a narrow centred column (433 raw) with a 122 raw field pitch and a left-aligned Save (44 raw tall).
    - The error helper is small red text (`#9f362a`) under the field. The border does not visibly change.
    - Selects show a stacked up/down chevron at right. Email entry uses a removable chip token inside the field.
    - Evidence: 344, 301, 336, 347.
13. **Settings content.**
    - The column is centred and narrow (x 522..1664).
    - Section heading is about 21 raw px.
    - Body copy is about 16 raw px with generous line height.
    - Callouts are a bordered rounded box with an (i) icon and a bold "Note:" lead-in (not a tinted banner).
    - Link-card grids use a 50 raw px bordered icon tile, a bold title and a grey subtitle.
    - Evidence: 331, 330, 342, 324.
14. **Modals.**
    - White, radius about 20-24 raw, widths 632 / 762 / 914 raw.
    - Overlay is black at about 30%, which dims the whole shell including the top bar.
    - Title is 20-22 raw px bold at about 26 raw padding.
    - Footer actions are right-aligned: Cancel (secondary) then the primary.
    - Long modals have a fixed header and footer separated by hairlines and a scrolling body (301: header rule y=118, footer rule y about 1067). The footer's left slot carries a "Learn about fine-tuning" link.
    - Evidence: 347, 301, 354, 290, 342.
15. **Option-card pickers.**
    - Stacked selectable cards with a `#f9f9f9`/`#f3f3f3` fill, no border and radius about 12.
    - A 28 raw line icon sits left, with a medium-weight title and a grey one-line description.
    - They are used both in a modal ("Add testing criteria") and a full-page step ("Select your data source").
    - There is no radio or checkbox. The whole card is the control.
    - Evidence: 290, 286.
16. **Dropdown and popover menus.**
    - White, radius about 14, soft shadow.
    - An uppercase 11-px-cap grey section label (PROJECTS, ORGANIZATIONS) heads the list.
    - The selected item has a check, bold text, and an `#ececec` rounded fill. Footer actions follow a hairline ("+ Create project", gear "Manage projects").
    - A role select shows two-line descriptions per option.
    - The profile menu has a 3-way icon segmented control (sun / moon / monitor).
    - Evidence: 311, 309, 346, 317, 283.
17. **Empty states.**
    - A centred stack with no illustration: a 50 raw px `#eeeeee` rounded icon tile, a bold title ("No X found"), one grey sentence, then a primary pill with "+" and optionally a secondary "Learn more".
    - In master-detail the unselected right pane is a single bold centred line, "Select a job to view details."
    - Evidence: 337, 299, 350, 338, 354, 286, 328.
18. **Master-detail.**
    - A list on the left (selected row filled `#eeeeee`, radius about 10) with a 1 px vertical divider at x about 975.
    - The right pane has an uppercase 11-px-cap eyebrow ("MODEL"), a large bold name, and key-value rows with a muted line icon plus a grey label on the left and a value on the right (monospace for ids).
    - Rows are about 41 raw apart, with hairline-separated groups.
    - A sticky footer holds secondary "Job" and, when running, red "Cancel job".
    - Evidence: 300, 305, 307.
19. **Vertical event timeline.**
    - A 1 px grey line with small grey dot nodes. The left column is a bold HH:MM:SS timestamp (about 12-13 raw px), and the right column is a normal-weight message with inline monospace ids.
    - It sits under underline tabs (Messages / Metrics / Moderation Checks), with newest first.
    - Evidence: 307, 305.
20. **Detail rail (report page).**
    - Header row: back arrow, title, segmented Report/Data, "..." menu, primary "+ Add run".
    - The main column holds Runs (a table with an inline score bar: `#b9ebcc` fill, right-aligned "100%") and Test criteria cards (a bordered card plus a same-size bordered "+ Add criteria" card with a circular plus).
    - A fixed right rail (445 raw wide) has collapsible sections with caret toggles and hairline separators. Rows are muted label left and value right, with a small action cluster ("No, thanks" / "Share") and a monospace JSON block.
    - Evidence: 296.
21. **Wizard.**
    - Split pane: a 686 raw left column holds a header ("x New evaluation" + "Step n / 3"), a step title, one explanatory sentence, the content, and a footer pinned to the bottom.
    - The footer has equal-width Back (secondary) and Next/Run (primary) buttons, about 46 raw tall.
    - The right pane is a live data-grid preview that fills as the user progresses, and it has its own empty state.
    - Evidence: 286-295.
22. **Dark mode.**
    - Shell `#131313`, card `#212121`, selected, menu and composer surfaces `#303030`, chip `#3d3d3d`, hairline `#3b3b3b`.
    - Primary button inverts to light `#f3f3f3` with dark text.
    - No shadows. Depth comes only from the lighter surface steps.
    - The sole saturated accents are data colours (purple bars `#885be3`, green waveform) and the blue prompt tile.
    - Evidence: 322, 318, 320, 321.
23. **Charts and stats.**
    - Single-hue bars (purple) with a dashed max line and its label, short dash baseline ticks for zero days, only the first and last date on the x axis, and no gridlines.
    - A right rail stacks stat tiles with hairlines: muted label, big number (about 22 raw bold), then a sparkline or mini bars.
    - The budget bar has a thick `#303030`/`#eeeeee` track, a green fill and tick marks for thresholds.
    - The service-health chart is a green gradient area with a black stroke.
    - Evidence: 322, 331, 333.
24. **Feedback patterns and copy.**
    - Toasts are solid `#49b880` with white text, about 56 raw tall, about 360 raw wide, top-centred over the top bar, with an x. They carry short past-tense messages.
    - Loading has no skeletons: an in-place grey spinner chip ("Validating files...") appears in both the list row and the status field.
    - Copy is sentence case with short imperatives (Create, Add member, Invite, Cancel, Save).
    - Empty titles use "No X found". Errors are short and factual ("This field is required.").
    - Evidence: 344, 348, 353, 357, 305, 301, 350.

## Rasikh mappings

| Rasikh screen / pattern | Mirror these refs | Why |
|---|---|---|
| Employer hires table (sortable: stage, days, blockers) | 329, 298, 297, 331, 358 | 329 gives the filter-chip toolbar plus borderless table (uppercase header, mono id, status pill, row actions, Export/Create). 298/297 give the dense list rows and pill-in-cell pattern. 331 gives right-aligned numeric columns. 358 gives a card-row variant for a smaller list. |
| Hire detail timeline | 307, 300, 305, 296 | 307 is a vertical timestamped event timeline under underline tabs. 300 gives icon-label / value key-value rows with a status pill. 305 shows the in-progress state. 296 shows how to add a metadata rail. |
| Landlord application detail + verified fields + backing badge + plain-language risk summary | 296, 300, 342, 331, 333 | 296 + 300 give the master-detail and right-rail layout. 342's Individual / Business verification rows with Start buttons give the verified-fields pattern. 331's bordered "Note:" callout is the plain-language summary box. 333's green check status header with expandable rows gives an explainable-risk list. |
| Approval request card (needs approval, Approve / Decline) | 347, 342, 290, 311 | A small white modal with title, fields, right-aligned secondary + primary footer. 290's option-card list suits "choose an action". 311 shows a dropdown with a check for inline choices. |
| Trust passport per-party field visibility toggles | 334, 300, 336, 325 | 334 has radio groups per data type (Hidden / Visible to owners / Visible to everyone) with Save, which is the closest match to per-party visibility. 300 and 336 show the small toggle switch (Created by me, Disable user API keys). 325 shows toggle rows with a grey description. |
| Language switcher (EN / AR) | 317, 318, 346, 309 | 317/318 give a 3-way icon segmented control inside a profile popover, which suits EN / AR. 346 gives the select popover with descriptions. 309 gives the checkmark switcher list. |
| Roadmap with dependencies | 319, 286, 294, 333 | 319 gives the node-and-connector graph (rounded nodes, thin curved connectors, floating toolbar, dark canvas). 286/294 give the ordered "Step n / 3" idea. 333 gives a vertical checklist of expandable status rows. The slice has no locked / blocked step styling, so that must be invented. |
| Document upload + AI extraction + confidence | 301, 303, 288, 297, 296 | 301 gives the dropzone (icon, "Upload a file or drag your file here", file type hint, error text below). 303 and 288 give "Upload new / Select existing" radios and a file list. 288's column-type checkboxes suit extracted-field confirmation. 297 and 296 give the Pass pills and the inline score bar for confidence. |
| Agent activity feed (did / waiting on / needs approval) | 307, 333, 305 | 307 is a timestamp-left, message-right feed. 333's "API incident history" is a feed with status dot, timestamp, bold title and a resolved line. 305 provides the running / spinner-chip state. |
| Add hire flow | 286, 287, 288, 289, 294, 295, 345, 347 | A split-pane wizard with step counter, pinned Back/Next footer and live preview (286-295) for the multi-step flow. The invite modal (345, 347) is the compact single-step variant. |
| Metrics row (employer) | 322, 330, 331 | 322's stacked stat tiles (label, big number, sparkline) with hairlines. 330's single large stat (about 38 raw px digits). 331's budget progress bar. |

## Gaps in this slice

- No chat thread, message bubbles, streaming state or file-attachment-in-chat. Use the ChatGPT pack.
- No real data table with sortable headers or checkboxes: only static ones with no sort carets.
- No tooltip, no skeleton and no in-page banner with an action (only toast and "Note:" callout).
- No RTL or Arabic.
- No mobile or responsive frames. The whole slice is a desktop 1920 viewport.
