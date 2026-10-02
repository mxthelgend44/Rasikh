# Survey: OpenAI Platform pack, screens 360-416 (57 screens)

Scope: `OpenAI Platform web Apr 2026 {360..416}.png`. All 57 screens were reviewed on the contact sheets (`platform-late/platform-344-359` for context, `360-375`, `376-391`, `392-407`, `408-416`). About 30 were opened at full resolution (Mobbin footer cropped: viewport = 1920x1205) and 20+ were measured with PIL/numpy.

Slice content in one line: Settings area of the Platform (People & Permissions roles, Projects archive, Billing, Limits, Service health, Data controls), then the full auth / password-reset flow, one chat-prompts empty state, and one "Signing in" loading frame. Everything is light theme. No dark-mode, chat thread, file upload, or onboarding wizard exists in this slice.

## Pixel scale (read first)

- Reported numbers are raw screenshot pixels (1:1 with the 1920 px wide image). The lead's instruction was to assume 1x and to state it.
- The scale cannot be proven from these screenshots: no element of known CSS size is present. Circumstantial evidence says the capture is probably about 1.25x device-pixel ratio (a 1536 CSS px wide window on a 125% Windows display):
  - Body/nav/tab/button text has a cap-height of 12-13 px. That matches 14 px type at 1.25x (cap ratio about 0.72); at 1.0x it would be an unusual 17-18 px.
  - Controls and nav items are 40 px high (32 CSS at 1.25x). Radios are 20 px (16 CSS). Radii are about 8 px (about 6 CSS).
  - Hairline borders render as soft 2 px lines (#ececec to #dedede), which suggests resampling.
- Rule for downstream specialists: use the raw numbers for pixel-matching the screenshots. If targeting CSS px, divide by 1.25 and treat the result as estimated.

## Measured token quick-reference (raw px unless noted)

| Token | Value | Source |
|---|---|---|
| Shell background (header + sidebar) | #f3f3f3 | 361 |
| Content surface | #ffffff, card edge at x=278, y=70, right edge x=1908, bottom y=1193, 1px #ececec border | 361 |
| Header band height | 70 | 361 |
| Sidebar nav item slot | x 15-261 (246 wide), 40 tall, radius about 8, pitch about 45.6 | 361 |
| Sidebar active fill / text | #e0e0e0 / #111111 | 361 |
| Sidebar section label colour | #7f7f7f | 361 |
| Primary text / secondary / tertiary | #000-#111 / #414141-#424242 / #7d7d7d-#7f7f7f | 361 |
| Hairlines | #ececec (cards, rows), #eaeaea (table rows), #f3f3f3 (tab rule), #dedede (input border) | 361, 369, 374 |
| Primary button | fill #181818, white text, 40 tall, radius about 8 | 361 |
| Secondary button | fill #eeeeee, dark text, no border, 40 tall | 361, 368 |
| Destructive button | fill #e12f2c, white text, 41 tall | 368 |
| Overlay | #f3f3f3 becomes #aaaaaa and #ffffff becomes #b2b2b2, so about rgba(0,0,0,0.30) | 365 |
| Toast | fill #49b880, white text, 186x57, top-centred at y 10-67 | 361 |
| Positive badge ("Preset", "Usage tier 1") | bg #e0f5e7 / #e4f4e6, text #08652a / #086025 | 361, 391 |
| Info badge ("Global") | bg #e0efff, text #093669 | 369 |
| Warning banner | white bg, about 2 px #d45a0e (most saturated sample) outline, radius about 12, orange text | 370, 403 |
| Positive callout | bg #d8f4e4, text #004d15, no border | 398 |
| Chart line / fill | #178c45 line, fill #e2f1e5 fading to #ffffff | 396 |
| Toggle | about 40x23 (estimated from 3x crop), off #e1e1e1, on #181818 | 399, 400 |
| Radio | 20 px, 1px #d3d3d3 ring, selected = black | 398 |
| Auth input / button | 432 wide (x 744-1175), 65-66 tall, fully rounded, 16 px stack gap | 404 |
| Auth primary pill | #131313 | 404 |
| Auth focus ring / link blue | #4c68d8 / #3d5597 | 412, 404 |
| Cap-heights (px) | 10-11 captions, table headers and help; 12-13 body, nav, tabs, buttons, inputs; 15-17 section and modal titles; 25 budget numerals; 39 hero amount; 27-28 auth heading | various |

## Catalog (idx | kind | theme | note)

| idx | kind | theme | note |
|---|---|---|---|
| 360 | modal-dialog | light | Create role modal, name and description filled |
| 361 | toast-banner | light | Roles tab list, "Role created" green toast |
| 362 | list-table | light | People & Permissions Roles: Owner, Reader, Editor rows |
| 363 | modal-dialog | light | Manage permissions modal, warning banner, all None |
| 364 | modal-dialog | light | Manage permissions, Read/Write values set per row |
| 365 | modal-dialog | light | Manage permissions, Model capabilities group expanded |
| 366 | toast-banner | light | Roles list, "Role updated" toast |
| 367 | modal-dialog | light | Projects: Archive modal, confirm input empty, disabled |
| 368 | modal-dialog | light | Projects: Archive modal, name typed, red Archive |
| 369 | toast-banner | light | Projects table, "Project successfully archived" toast |
| 370 | error-state | light | Billing Payment methods, orange "no billing plan" banner |
| 371 | list-table | light | Billing Payment methods, Visa 6442 default card |
| 372 | list-table | light | Billing history, single paid invoice row |
| 373 | billing | light | Billing Credit grants, progress bar, grants table |
| 374 | settings-form | light | Billing Preferences form, address fields, Save |
| 375 | modal-dialog | light | Billing Overview, Add payment details modal empty |
| 376 | dropdown-menu | light | Add payment details, Country dropdown open, list |
| 377 | dropdown-menu | light | Country dropdown searching "united", option highlighted |
| 378 | modal-dialog | light | Add payment details, country selected, address fields |
| 379 | modal-dialog | light | Add payment details filled, business checkbox, tax address |
| 380 | modal-dialog | light | Configure payment, $10, auto-recharge fields shown |
| 381 | modal-dialog | light | Configure payment, $5, auto-recharge unchecked, disabled |
| 382 | modal-dialog | light | Payment summary, line items, Visa, Confirm payment |
| 383 | loading-state | light | Payment summary, Confirm button spinner, Back disabled |
| 384 | toast-banner | light | Billing Overview, "Payment successful" toast, $5.00 |
| 385 | billing | light | Billing Overview, Pay as you go, link tiles |
| 386 | modal-dialog | light | Cancel plan confirmation, Nevermind / red Cancel plan |
| 387 | toast-banner | light | Billing Overview, "subscription was canceled" toast |
| 388 | empty-state | light | Billing Overview, Canceled state, Start billing plan again |
| 389 | modal-dialog | light | Limits: Add budget alert modal, empty, Add disabled |
| 390 | modal-dialog | light | Limits: Add budget alert modal, filled, email chip |
| 391 | list-table | light | Limits: budget card, alerts, rate limits table |
| 392 | modal-dialog | light | Limits: Edit budget modal, monthly budget 120 |
| 393 | modal-dialog | light | Limits: Edit budget modal, monthly budget 10.00 |
| 394 | list-table | light | Limits page settled, budget $10, two alerts |
| 395 | chart-usage | light | Service health, uptime chart hover tooltip |
| 396 | chart-usage | light | Service health, All systems operational, incident history |
| 397 | settings-form | light | Data controls Hosted tools, radio groups |
| 398 | settings-form | light | Data controls Sharing, radios, green eligibility callouts |
| 399 | settings-form | light | Data controls Data retention, audit toggle off |
| 400 | settings-form | light | Data retention, audit toggle on, Save |
| 401 | toast-banner | light | Data retention, "Organization updated successfully" toast |
| 402 | onboarding | light | Invite accepted standalone page, gray background |
| 403 | error-state | light | Members tab, no-permission warning, No members found |
| 404 | auth | light | Welcome back, email plus social sign-in buttons |
| 405 | auth | light | Enter your password, empty field |
| 406 | auth | light | Enter your password, masked value entered |
| 407 | error-state | light | Enter your password, red incorrect-credentials error |
| 408 | auth | light | Enter your password, filled, Forgot password link |
| 409 | loading-state | light | Signing in spinner, blank shell |
| 410 | empty-state | light | Chat prompts empty state, Create nav, Generate composer |
| 411 | auth | light | Reset password, Continue / Back to login |
| 412 | auth | light | Check your inbox, code field focused with blue ring |
| 413 | auth | light | Check your inbox, six-digit code filled |
| 414 | auth | light | Reset your password, two empty password fields |
| 415 | auth | light | Reset your password, requirement checklist, filled |
| 416 | auth | light | Password changed success, green check, Log in |

## Canonical picks (best exemplars, from this slice only)

| Category | Indices |
|---|---|
| shell_sidebar | 361, 374, 385, 391, 396, 410 |
| top_bar | 361, 369, 391, 396, 409, 410 |
| data_table | 369, 391, 372, 361, 362, 373 |
| settings_form | 374, 398, 397, 400, 399, 378 |
| detail_page | 385, 388, 373, 391, 371, 395 |
| empty_state | 410, 403, 388, 370 |
| loading_state | 409, 383 |
| error_state | 407, 403, 370 |
| modal_dialog | 368, 365, 375, 382, 386, 389 |
| dropdown_menu | 377, 376 |
| toast_banner | 361, 369, 387, 384, 370, 403 |
| tabs | 374, 361, 398, 385, 370, 397 |
| chart | 396, 395, 373, 391 |
| dark_mode | none in slice |
| input_states | 407, 412, 406, 405, 374, 377 |
| buttons | 361, 368, 404, 385, 369, 383 |
| onboarding | 402, 416, 404, 412, 415 |
| chat_thread | none in slice |
| chat_composer | 410 |
| status_pill | 361, 369, 391, 396, 372, 373 |
| file_upload | none in slice |

## Observations

1. **Pixel scale.** See the scale section above. Raw cap-heights are 13 px (body) and 16 px (titles); controls are 40 px; the pattern is consistent with a 1.25x capture. Evidence: 361, 385, 398.
2. **App shell = tinted frame plus inset white card.** Header and sidebar share the #f3f3f3 background with no divider line between them. The page content is one white card starting at x=278, y=70 and ending 12 px from the right and bottom edges, with a 1px #ececec border and a rounded top-left corner. The 70 px header band holds the breadcrumb switcher on the left (32 px black avatar disc with white letter, org name, up/down chevron, "/", project name, chevron) and the utility links on the right. Evidence: 361, 369, 391, 396.
3. **Settings sidebar is text-only.** Items sit in 246x40 slots (x 15-261) with radius about 8 and about 45.6 px pitch. Labels start at x=31 (16 px inset). The active item gets a flat #e0e0e0 fill and #111 text, with no bold, no icon, and no accent bar. Group labels (Settings / Organization / Project) are small #7f7f7f text, about 59 px below the last item of the previous group and 43 px above the first item of their own group. The primary-nav variant (410) uses the same slots with 20 px outline icons at x 31-50 and the label at x=64. Evidence: 361, 391, 410.
4. **Sidebar footer stack.** A dismissible promo card ("Add credits" / "Claim free tokens") is 246x153 with a 1px #e0e0e0 border, bg about the shell colour, a bold title with an X at the top right, two lines of gray body copy, and a small pill CTA ("Go to Billing", 129x35, #181818). The nav list scrolls underneath it, with a 1px #d9d9d9 divider at its top edge. Below the card sit Cookbook and Forum links; when space is tight they collapse to an icon-only pair. Evidence: 370, 374, 385, 391, 410.
5. **Right side of header.** "Dashboard" and "API Docs" are plain #424242 text links, followed by a gear icon and a 32 px avatar ("A" on #f3f3f3). In the logged-out/lite shell (410) it becomes "API Docs" plus a black "Start building" button. Toasts overlay the header centre. Evidence: 361, 410.
6. **Page header and tabs.** The title (cap-height 16, medium weight) sits at x=310, which is 32 px inside the card. A text-only tab row follows, with tabs about 24 px apart. Inactive tabs are #424242; the active tab is black and semibold with a 2px #181818 underline exactly as wide as its label, over a full-width 1px #f3f3f3 hairline. There are no pill or segmented tabs. Some pages put a badge next to the title ("Usage tier 1") or a status dot plus filter chips on the right (service health). Evidence: 361, 370, 374, 391, 396, 398.
7. **Two content-width modes.** List and table pages run edge to edge with 32 px padding (content x 310-1877). Form, overview, and settings pages sit in a centred column: 1142 px wide (x 522-1664) for billing and limits, 888 px (x 649-1537) for data controls. The column centre is the card centre (x=1093). The result is wide margins and a calm, low-density feel. Evidence: 374, 385, 398 versus 361, 369, 403.
8. **Button system.** All standard buttons are 40 px tall with radius about 8. Primary: #181818 fill, white text, optional leading 20 px icon (+, pencil-square). Secondary: #eee fill, dark text, no border. Destructive: #e12f2c fill with white text, used only inside confirm modals. Outline pill: white fill, 1px border, fully rounded, about 122x51, used for card-header actions ("Add alert", "Edit budget"). Disabled primary becomes a light-gray fill with gray text (no opacity trick visible). Loading replaces the label with a thin spinner and keeps the button's size. Evidence: 361, 368, 369, 383, 385, 389, 391.
9. **Form anatomy.** Inputs are 40 px tall, white, with a 1px #dedede border (soft 2 px in the capture), radius about 7-8, and #7d7d7d placeholder text. Label (semibold, cap 13) goes on top, then help text (cap 11, dark gray) directly under it, then the input. A field block repeats about every 122 px. Fixed widths are used: 254 for short values, 508 for address-width fields. Stacked address inputs have an 11 px gap (51 px pitch), and City and Postal code sit side by side. Selects show an up/down chevron at the right edge. A single black "Save" button (about 70x40) sits left-aligned under the form, with no sticky footer. Evidence: 374, 375, 378, 380.
10. **Type scale (measured cap-heights).** 10-11 px for captions, help text, uppercase table headers, and "Resets in 4 days". 12-13 px for nav, tabs, body, inputs, and buttons. 15-17 px for section and modal titles. 25 px for budget numerals. 39 px for the hero balance. Only two weights are in daily use (regular and medium/semibold), and the hierarchy comes from size and #000 versus #414141 versus #7d7d7d rather than from colour. The face is a geometric grotesque, with monospace for IDs and model names (`proj_...`, `gpt-5.1`). Evidence: 385, 391, 369, 374, 368.
11. **Neutral-first palette.** Surfaces are #f3f3f3 and #fff. Hairlines are #ececec/#eaeaea. Input borders are #dedede. Active and secondary fills are #e0e0e0 and #eee. Text steps go #000/#111, then #414141, then #7d7d7d. Colour appears only as semantic signal: green, orange, red, and blue. Evidence: 361, 369, 374, 391.
12. **Semantic colour roles.** Success is solid green (#49b880 toast, #178c45 chart line, #e0f5e7/#08652a badges, #d8f4e4/#004d15 callout). Warning is orange (#d45a0e outline plus text). Destructive is red (#e12f2c button; crimson field error). Info and link is blue (#e0efff pill with #093669 text; #3d5597/#4c68d8 links and focus ring). Every semantic surface is a pale tint with dark same-hue text, not a saturated block, except the toast. Evidence: 361, 368, 369, 370, 398, 404, 407, 412.
13. **Modal anatomy.** Widths vary with content (570 for a confirm, 634 for a form, 812 for the permissions list). Radius is about 14-16, padding about 25 px, and the modal is vertically centred (centre y about 602 in a 1205 viewport). Tall content caps the modal at about 55 px margin top and bottom and scrolls the body between a fixed title bar and a fixed footer, each separated by a hairline. The overlay is about black at 30% (page #f3f3f3 becomes #aaa). Footer buttons are right-aligned, 40 px tall, with an 11 px gap, secondary on the left and primary on the right. Evidence: 365, 368, 375, 382, 386.
14. **Destructive confirm pattern.** Title names the object ("Archive Europe Trip Plan"). Body is plain language that states consequences and irreversibility. Typed confirmation is required (bold instruction "To confirm, type ..."), and the red button stays disabled until the text matches (367 to 368). The softer variant uses friendly labels ("Nevermind" / "Cancel plan") with no typed confirmation. Evidence: 367, 368, 386.
15. **Toast.** A solid #49b880 rounded block (186x57 for "Role created"), white text, a trailing X, pinned to viewport top-centre over the header and independent of the content column. Copy is short and past tense ("Role created", "Role updated", "Payment successful", "Project successfully archived"). It appears directly after the modal closes. Evidence: 361, 366, 369, 384, 387, 401.
16. **Inline banners (3 flavours).** (a) Warning: white fill, about 2px orange outline, radius about 12, triangle icon, bold orange title line plus regular orange sentence, no action button (370, 403, and inside the 363-365 modal). (b) Neutral info: 1px #ececec border, info icon, bold "Note:" lead-in, optional right-aligned black CTA ("Enable auto recharge") (385, 391, 397). (c) Positive callout: borderless #d8f4e4 block with sparkle icon, bold dark-green title, body, and underlined "Learn more" (398). Titles state the problem or fact; the second line gives the next step. Evidence: 363, 370, 385, 391, 397, 398, 403.
17. **Rows-in-a-card list.** The Roles list is one bordered card (radius about 12) with 89 px rows separated by #ececec hairlines. Each row has a 40 px #f2f2f2 initial-letter avatar disc, a title with a green "Preset" badge beside it, a one-line gray description, then a right cluster of outline buttons ("Assignments" secondary, "Permissions" black) and a "..." overflow. Evidence: 361, 362, 366.
18. **Table anatomy.** Projects table: no outer border and no zebra striping. The header row is uppercase, letter-spaced, cap 11 px, near-black (#0d0d0d, not gray). Rows are about 75 px tall with 1px #eaeaea separators. Name is semibold, ID is monospace, a pill is used for geography, numeric columns (MEMBERS, CREATED, MONTHLY SPEND) are right-aligned, and two 20 px icon-only actions sit at the row end (the destructive one tints red on hover/selection). A toolbar above holds a 40 px search chip, outlined filter chips (Geography, Data retention), a removable "Active x" chip, and right-aligned Export (secondary) and Create (primary). A centred "Load more" secondary button handles pagination. Evidence: 368, 369.
19. **Dense data table.** The rate limits table has 52 px row pitch, uppercase 11-cap headers, monospace first column, right-aligned numerics ("500,000 TPM"), and full-width #ececec hairlines that extend about 10 px beyond the text column. A budget card above it shows label, 25-cap amount ("$0.00 / $10.00"), a 20 px pale progress track with tick marks at thresholds, and a "Resets in 4 days" caption. Sub-rows (alerts) are 71 px with a 30 px icon tile, a bold title, optional gray subtitle, and trash plus pencil icons at the right. Evidence: 391, 394.
20. **Tile-link grid and hero metric.** The billing overview stacks a section title (cap 16), a small bold label with info icon, a 39-cap hero number, two 40 px secondary buttons, a bordered info banner, then a 2-column grid of 40 px bordered icon tiles with a medium title and gray one-line subtitle each (about 100 px row pitch). Evidence: 385, 388.
21. **Status and metric header for monitoring.** "All systems operational" has a green check disc plus the title, with right-aligned filter chips (a gray "All projects" pill, a "Last 30 days" select with calendar icon, a green "Live" pill with dot). Below is a label, a large value ("100.00%"), and a 1m/1h mini-toggle. The chart is a 2px #178c45 line with a vertical green-to-white gradient fill, a black 2px baseline with spike lines, only 5 x-axis date labels, and no y-axis or gridlines. Hovering gives a small white tooltip card with timestamp and green value. Collapsible service rows sit below, and a right rail ("API incident history") lists events as green dot + timestamp, bold title, gray resolution line, separated by hairlines. Evidence: 395, 396.
22. **Selection controls.** Radio buttons are 20 px with a 1px #d3d3d3 ring and a black filled dot when selected. Options stack vertically at about 38 px pitch under a semibold section title and a gray paragraph. The toggle is about 40x23, #e1e1e1 off and #181818 on, with a white knob and the label to its right. Checkboxes are about 22 px, black when checked. Each setting group is separated by about 60 px of whitespace, not by rules. Evidence: 397, 398, 399, 400, 379, 381.
23. **Permission matrix (modal).** Rows are about 51 px: a label with a 14 px info icon on the left and a borderless select ("None" in #7d7d7d, "Read"/"Write" in black, with an up/down chevron) on the right. Group rows have a chevron (collapsed/expanded), and child rows indent by about 20 px with lighter label colour. A sticky warning banner at the top explains the blast radius. Evidence: 363, 364, 365.
24. **Searchable select popover.** The Country select opens a white card with a shadow and radius, an embedded 40 px search input with a magnifier, then 42 px rows. The hovered/selected row gets a #ebebeb rounded fill. The list scrolls inside the modal, and the typed query filters live ("united" gives 5 rows). Evidence: 376, 377.
25. **Auth layout.** A bare white page with the wordmark at the top-left (30,30). A single centred 432 px column holds a heading (cap about 28, centred), then pill inputs and buttons 65-66 px tall with a 16 px gap. The primary is #131313 and the secondary is an outlined pill (social buttons carry a 24 px provider icon). An "OR" divider (1px #f0f0f0 rule with small caps text) separates alternatives. Blue inline links ("Sign up", "Edit", "Forgot password?") and a centred underlined "Terms of Use | Privacy Policy" footer in 13-cap gray close the page. Evidence: 404, 405, 411, 414, 416.
26. **Auth field states.** Fields use a floating label that notches into the top border: gray #a7a7a7 at rest, blue #4c68d8 with a 1px blue ring on focus (412), and red with a red border plus a filled red "!" disc and a 13-cap red message beneath on error (407). Password fields get a trailing eye icon. A neighbouring read-only field shows "Edit" as a blue text button. Validation checklists live in a bordered box ("Your password must contain:" with a blue check per met rule). Evidence: 407, 412, 413, 415.
27. **Empty and result states are minimal.** The empty members table is a bordered 1569x514 card holding one centred semibold line ("No members found") and no illustration. The canceled-billing page is just a bold heading, a sentence, and one secondary CTA. The one richer empty state (410) uses a 70 px white rounded icon tile with a faint shadow, a cap-17 centred heading ("Create a chat prompt"), an inline composer row (black "+ Create" pill and a pill input "Generate..." with a circular send arrow), and two rows of gray suggestion chips. The success page (416) is a 78 px green outlined check circle, heading, gray subtitle, and one black pill. Evidence: 388, 403, 410, 416.
28. **Loading is spinner-only.** A 30 px thin dark arc spinner sits centred in an otherwise blank white card, with a "Signing in..." label and small spinner in the header (409). Button-level loading swaps the label for a spinner and dims the neighbouring secondary button (383). No skeleton screens are used in this slice. Evidence: 383, 409.
29. **Copy style.** Sentence case everywhere, with short verb-first buttons ("Create role", "Add alert", "Edit budget", "Load more", "Nevermind", "Start building"). Explanations state consequences in plain language ("Changes to this role will affect every user and group assigned to it"; "Archived projects cannot be restored"). Banners lead with a bold fact and follow with the next step. Evidence: 363, 368, 370, 386, 403.
30. **Flat elevation.** Shadows are limited to modals, popovers, and toasts; cards, rows, inputs, and tiles rely on 1px hairlines. Radii step about 8 (controls) to about 12 (cards, banners) to about 16 (modals), with full pills for auth and chips. Density is moderate: 40 px controls, 45-52 px list pitch, 75-89 px record rows, and large whitespace margins. Evidence: 361, 365, 369, 391.

## Rasikh mappings

| Rasikh screen / pattern | Mirror these screens | Why |
|---|---|---|
| Employer hires table (sortable, stage, days, blockers) | 369, 391, 372, 361 | 369 gives the toolbar (search chip + filter chips + removable Active chip + Export/Create), the uppercase near-black headers, 75 px rows, right-aligned numerics, row-end icon actions, and Load more. 391 gives the denser 52 px variant with monospace IDs. 372 shows a status pill column ("Paid") for the stage column. 361 is the card-wrapped rows alternative for a mobile-width fallback. |
| Hire detail timeline and agent activity feed | 395, 396 | The "API incident history" rail is a ready-made vertical event list: green dot, small timestamp, bold title, gray status line, hairline separators. Map it to hire stage events and to the agent "did / waiting on / needs approval" feed. The "All systems operational" header with a green check disc and the "Live" pill maps to an "On track" / "Agent active" summary. |
| "Back this hire" action and confirmation | 382, 383, 386 | The Payment summary modal (due-today line items, estimated total, payment-method card with Default tag, small legal sentence, Back / Confirm payment) is the pattern for an explicit backing commitment. 383 shows the in-button spinner while the action runs. 386 shows the plain-language consequence text and softer cancel label. |
| Landlord application detail with verified fields, employer-backing badge, plain-language risk summary | 385, 398, 370, 403, 391 | 385 gives the section title, label + info icon, hero value, and info banner with a right-side CTA. 398's pale-green callout (bold fact + sentence) fits the "employer-backing" positive notice. 370/403's orange outline banner (bold problem + next step) fits risk and caution lines. 391's card with label, amount, progress track and tick marks fits a rent-to-income or affordability gauge. |
| Decision actions (approve / request info / offer terms) | 368, 386, 389, 390 | Right-aligned footer with secondary + primary, red variant only when destructive. 389/390 show the primary staying disabled until the form is valid. Use "Request info" as secondary and "Approve" as the black primary. |
| Trust passport per-party field visibility toggles | 363, 364, 365, 399, 400, 397 | The permission matrix modal (label + info icon left, None/Read/Write select right, expandable groups with indented children, sticky warning banner) maps to per-party field visibility. 399/400 give the 40x23 black/gray toggle with label. 397 gives the radio stack for "hidden / visible to party / visible to all". |
| Add-hire flow and multi-step forms | 360, 375, 378, 380, 382 | 360 is the minimal create modal (Name + Description + Cancel/Create). 375, 378, 380, and 382 are a three-step modal sequence (details, configure, summary) with Back/Continue. That pattern suits a short add-hire wizard on desktop or bottom sheet on mobile. |
| Language switcher and country / nationality picker | 376, 377, 374 | The searchable select popover (search input, 42 px rows, #ebebeb hover) works for language and nationality. 374 shows the closed select with chevron in a form context. RTL flip must mirror the chevron and the icon side. |
| Newcomer sign-in, OTP, and password flows (EN + AR) | 404, 407, 412, 413, 415, 416 | A centred 432 px single-column auth with pill inputs, floating labels, blue focus ring, red inline error, OTP "Check your inbox", requirement checklist, and a success page. Also a good base for mobile since the column is already narrow. |

## Not found in this slice

- No document-upload / extraction-with-confidence, roadmap-with-dependencies, or approval-request-card screens. The nearest reusable structures are the incident list (395, 396), confirm modals (382, 386), and callouts (370, 398).
- No dark mode, chat thread, or file-upload state. 410 is the only composer-like element, a small pill input inside an empty state.
- No hover states beyond 395's tooltip and 377's highlighted row.
