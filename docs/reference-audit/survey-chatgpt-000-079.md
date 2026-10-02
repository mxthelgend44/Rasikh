# Survey: ChatGPT web Mar 2026, screens 0-79

Slice: `ChatGPT web Mar 2026 {0..79}.png` (80 screens). Surveyed from the contact sheets (every index seen), then about 25 screens opened at full resolution (plus medium-res grids of the rest) and measurements taken from pixels on roughly 35 screens. All values are CSS px unless marked `[px]` (image pixels). Anything marked *estimated* is inferred (typically type size from cap height at an assumed 0.72 cap-height ratio, or radius from corner curvature).

## Method and scale

- Viewport crop used for every measurement: 1920x1200 (bottom 120 px Mobbin footer removed).
- **Scale assumed: 1.27 image px per CSS px** (1920/1512; the capture is a ~1512 CSS px viewport scaled up). Evidence: sidebar 330 px, header 66 px, sidebar row pitch 45.8 px, body line pitch 35.6 px and composer outer width 977 px give 1.269, 1.269, 1.272, 1.271 and 1.272 against round CSS values 260 / 52 / 36 / 28 / 768. Those CSS reference values are recalled ChatGPT layout conventions, not measured here; their mutual consistency is what supports the scale.
- All 80 screens are **light theme, desktop 1920 px wide**. No dark mode, no mobile viewport, no error state, no chart, no settings page in this slice.
- Scratch crops/grids live outside the repo; nothing under `.reference` was modified.

## Key measured tokens (quick reference)

| Token | Value | Source idx |
|---|---|---|
| Sidebar width / bg / border | 260 CSS [330 px] / #F8F8F8 / 1px #E9E9E9 | 22 |
| Main canvas | #FFFFFF | 22 |
| Header height | 52 CSS [66 px]; hairline #F5F5F5-#F1F1F1 only when scrolled | 57, 44 |
| Content column | 768 CSS max [974-977 px]; 640 CSS beside 400 CSS side panel | 22, 24, 44 |
| Sidebar row pitch | 36 CSS [45.8 px]; label 14 CSS (est.) | 22 |
| Active/hover row | #E8E8E8, ~8 CSS radius (est.), 247 CSS wide | 24 |
| Body text | 16 CSS / 28 CSS line height; ink #0D0D0D class (display type mode #0E0E0E) | 24, 0 |
| Secondary text | #484848 (subtitle), #6A6A6A (disclaimer), #7B7B7B-#8B8B8B (placeholder, labels) | 2, 24, 22 |
| User bubble | #F2F2F2 (#F5F5F5 in some captures), ~18 CSS radius (est.) | 24, 39 |
| Composer | pill 768 CSS wide, 57 CSS tall, 1px #DDDDDD + soft shadow | 22 |
| Composer action button | 36 CSS disc [46 px], #010101; stop state on #E9E9E9 disc | 22, 24 |
| Get Plus pill | 98x36 CSS, #F1EFFD, sparkle #4E51CF | 22 |
| Primary button fill | #0E0E0E (onboarding/modals) to #131313 (auth) | 13, 2 |
| Primary button heights | 52 CSS auth, 41-42 CSS onboarding/tour, 34-36 CSS dialogs/panels | 2, 13, 78 |
| Input | 52 CSS pill, 1px #D0D0D0, focus ~#5565AD, floating label on border | 4 |
| Auth column | 340 CSS wide, control pitch 64 CSS (52 + 12) | 2 |
| Chip (onboarding) | 44 CSS tall, 12 CSS gaps; selected Search #D1F3E0 / #127E44 | 16 |
| Modal sizes | feedback 575x328, delete 447x174, share 640x612 CSS | 66, 78, 68 |
| Modal backdrop | ~6% dim (#F0F0F0 over white) + blur; share modal lighter (#FAFAFA) | 66, 68 |
| Menu | 1px #DCDCDC, 36 CSS row pitch, plus menu 230x239, options 198x203 CSS | 26, 75 |
| Toast | #008735, 43 CSS tall, viewport-centred, 12 CSS from top | 67, 69 |
| Destructive | #E1302C fill (button), #C53730 text (menu) | 78, 75 |
| Link/accent blue | ~#4163BC (inputs), #2D5484 (activity links), #075EC2 (unread dot) | 4, 44, 22 |
| Table | header rule #DBDBDB, row rules #F2F2F2, row pitch 69 CSS (2-line), 14/24 CSS text | 57 |
| Hairlines | #E5E5E5-#E9E9E9 | 24, 54, 22 |

## Catalog (every index 0-79)

| idx | kind | theme | note |
|---|---|---|---|
| 0 | marketing | light | ChatGPT landing hero with prompt suggestion marquee |
| 1 | auth | light | Log in or sign up, empty email focused |
| 2 | auth | light | Log in or sign up, email filled |
| 3 | auth | light | Create a password, empty field focused |
| 4 | auth | light | Create a password, typing with rule checklist |
| 5 | auth | light | Create a password, revealed text, rule met |
| 6 | auth | light | Check your inbox, empty code field |
| 7 | auth | light | Check your inbox, code entered |
| 8 | onboarding | light | Confirm your age, empty name, birthday selects |
| 9 | onboarding | light | Confirm your age, name filled |
| 10 | dropdown-menu | light | Confirm your age, day picker list open |
| 11 | onboarding | light | Confirm your age, day 19 chosen |
| 12 | onboarding | light | Confirm your age, year 1995 filled |
| 13 | onboarding | light | What brings you to ChatGPT, single-select list |
| 14 | onboarding | light | What brings you, Personal tasks row selected |
| 15 | onboarding | light | What do you want to do, chip cloud |
| 16 | onboarding | light | Chip cloud with Search chip selected green |
| 17 | onboarding | light | Chip cloud, Analyze data expanded, mid-transition |
| 18 | onboarding | light | Nice to meet you, quick tour intro |
| 19 | onboarding | light | Tour step Ask anything with sample chat card |
| 20 | onboarding | light | Tour step Picture this with image result card |
| 21 | onboarding | light | You're all set, consent copy and Continue |
| 22 | app-shell-home | light | Home empty state, Ready when you are, composer |
| 23 | chat-composer | light | Home, prompt typed, send arrow shown |
| 24 | chat-thread | light | Streaming recipe answer with images, stop button |
| 25 | chat-thread | light | Completed recipe answer with action icon row |
| 26 | dropdown-menu | light | Plus menu: add files, create image, research |
| 27 | file-upload | light | Image attached in composer with edit badge |
| 28 | file-upload | light | Composer with image, PDF and file tiles |
| 29 | chat-composer | light | Image mode composer with style gallery |
| 30 | chat-composer | light | Image mode, style gallery scrolled with arrows |
| 31 | loading-state | light | Image prompt sent, Analyzing image status |
| 32 | chat-thread | light | Generated plush image, personality feedback banner |
| 33 | chat-composer | light | Image mode empty composer, What's on your mind |
| 34 | chat-composer | light | Image mode, descriptive prompt typed |
| 35 | chat-thread | light | Image created result, Iced matcha latte |
| 36 | chat-composer | light | Think mode chip, empty composer |
| 37 | chat-composer | light | Think mode, question typed |
| 38 | loading-state | light | Reasoning streaming with Answer now link |
| 39 | chat-thread | light | Reasoned answer, Thought for 42s, citation chips |
| 40 | empty-state | light | Research mode, What are you researching |
| 41 | chat-composer | light | Research mode, question typed |
| 42 | chat-thread | light | Clarifying questions reply with action icons |
| 43 | chat-composer | light | Reply typed in Research composer |
| 44 | loading-state | light | Deep research running, Activity side panel |
| 45 | detail-page | light | Research complete, report card, Activity panel |
| 46 | detail-page | light | Research report opened beside Activity panel |
| 47 | detail-page | light | Report sources paragraph, Activity panel |
| 48 | detail-page | light | Citations tab listing source cards |
| 49 | empty-state | light | New chat, Shopping research chip, group chats |
| 50 | chat-composer | light | Shopping research prompt typed |
| 51 | chat-thread | light | Shopping research promo card with Get started |
| 52 | loading-state | light | Gathering requirements, quick feedback prompt card |
| 53 | detail-page | light | Product card with Not interested, More like this |
| 54 | detail-page | light | Product card, spec list, decision buttons |
| 55 | loading-state | light | Gathering requirements, insight with progress bar |
| 56 | chat-thread | light | Shopping report, summary and best overall pick |
| 57 | list-table | light | Comparison table of five matcha products |
| 58 | chat-composer | light | Voice dictation waveform in composer |
| 59 | chat-composer | light | Question typed, send arrow shown |
| 60 | dropdown-menu | light | Text selected, Ask ChatGPT popover |
| 61 | chat-composer | light | Quoted reply chip above empty composer |
| 62 | chat-composer | light | Quoted reply chip with question typed |
| 63 | chat-thread | light | Reply with image row and bulleted lists |
| 64 | chat-thread | light | Recipe answer, copy-confirmed check in action row |
| 65 | modal-dialog | light | Share feedback modal, no category, Submit disabled |
| 66 | modal-dialog | light | Share feedback modal, Style or tone selected |
| 67 | toast-banner | light | Green toast: Thank you for submitting feedback |
| 68 | modal-dialog | light | Share conversation modal with social buttons |
| 69 | toast-banner | light | Link copied toast over share modal |
| 70 | dropdown-menu | light | Message popover: timestamp, Branch, Read aloud |
| 71 | chat-thread | light | Branched chat with Branched from notice |
| 72 | chat-thread | light | Branch chat active in sidebar, notice shown |
| 73 | chat-thread | light | Branch streaming new answer with images |
| 74 | dropdown-menu | light | Message popover with Branch and Stop |
| 75 | dropdown-menu | light | Chat options menu: group, pin, archive, delete |
| 76 | chat-thread | light | Recipe answer scrolled, pinned chat in sidebar |
| 77 | empty-state | light | New home, Hey Alex greeting, group chats |
| 78 | modal-dialog | light | Delete chat confirmation, red Delete button |
| 79 | empty-state | light | Home after delete, Hey Alex greeting |

## Canonical picks per category

| category | indices |
|---|---|
| shell_sidebar | 22, 24, 67, 75, 39, 56 |
| top_bar | 22, 24, 57, 44, 0, 75 |
| data_table | 57, 54, 53 |
| settings_form | 4, 10, 12, 66, 2 |
| detail_page | 46, 54, 56, 45, 47, 48 |
| empty_state | 22, 77, 40, 36, 49, 79 |
| loading_state | 38, 44, 55, 31, 24, 52 |
| error_state | (none in this slice) |
| modal_dialog | 66, 78, 68, 65, 69 |
| dropdown_menu | 26, 75, 10, 70, 74, 60 |
| toast_banner | 67, 69, 44, 32 |
| tabs | 44, 45, 48, 46, 47 |
| chart | (none in this slice) |
| dark_mode | (none in this slice) |
| input_states | 4, 2, 1, 5, 65, 10 |
| buttons | 2, 13, 78, 54, 44, 0 |
| onboarding | 13, 16, 8, 19, 20, 21 |
| chat_thread | 24, 39, 25, 63, 67, 56 |
| chat_composer | 22, 28, 29, 51, 61, 26 |
| status_pill | 22, 39, 44, 16, 66, 45 |
| file_upload | 28, 27, 29, 26, 31, 20 |

Notes: 17 is a mid-transition frame (top chip row fading) and is deliberately not canonical. Categories with no screens in the slice: error_state, chart, dark_mode. settings_form has no real settings page; the picks are the closest form screens (auth, birthday selects, feedback modal). data_table has only the comparison table (57) plus a key-value spec list (54, 53).

## Observations

### 1. Pixel scale (read this first)

Screens are NOT 1x. Five independent round CSS values all land on the same factor of about 1.27 (1920/1512, i.e. a 1512 CSS px viewport scaled to 1920): sidebar 330 px = 260 CSS, header 66 px = 52 CSS, sidebar row pitch 45.8 px = 36 CSS, body line pitch 35.6 px = 28 CSS, composer 977 px = 768 CSS (factors 1.269-1.272). All CSS px below = image px / 1.27 (image px given in brackets where useful). The CSS reference values are recalled ChatGPT layout conventions, not measured, but their mutual consistency makes the scale reliable. Viewport crop = 1920x1200 (Mobbin footer removed).

Evidence: 22, 24, 57

### 2. App shell geometry

Sidebar 260 CSS [330 px] on #F8F8F8 with a 1px #E9E9E9 right border (x=329); main canvas pure #FFFFFF; no card or elevation around the main area. Header is 52 CSS [66 px], transparent, with a 1px hairline (#F5F5F5 / #F1F1F1) that appears only once content scrolls under it (57, 44, 75) and is absent on empty home (22) and at scroll-top (24). Content column is centred in the remaining width: 768 CSS max [974 px, x 638-1612], shrinking to 640 CSS when the 400 CSS side panel opens (44).

Evidence: 22, 24, 57, 44, 75

### 3. Sidebar rows

Rows repeat on a 36 CSS pitch [45.8 px] for both nav items (New chat, Search chats, Images, Apps, Codex, Projects) and chat history. Label 14 CSS (cap height 13 px = 10.2 CSS; estimated), ink #0D0D0D class (small text renders #000). Nav icons are ~16 CSS thin-outline glyphs [ink 19-20 px], icon at x~18 CSS, label at x=43 CSS (~10 CSS icon-text gap). History rows have NO icon, text starts at 17 CSS. Active/hover row = #E8E8E8 fill, ~8 CSS radius (estimated), inset ~6 CSS each side (x 8-321 px = 247 CSS wide), 34-36 CSS tall. Section labels ('Your chats', 'Group chats') are muted (#767676-#8B8B8B), ~13 CSS, about 34 CSS below the last nav row's text and ~24 CSS above the first history row's text. Unread = ~9 CSS dot #075EC2 at the right edge. Footer: 24 CSS initials avatar (#3292F0), name 14 CSS, plan 'Free' 12 CSS muted, and an outlined pill 'Upgrade' (72x28 CSS, 1px #D9D9D9).

Evidence: 22, 24, 67, 75

### 4. Top bar anatomy

Left: product title with chevron ('ChatGPT v') ~18 CSS (cap 16 px; estimated). Centre: a 'Get Plus' upsell pill, 98x36 CSS [124x46 px], fill #F1EFFD, indigo sparkle (#4E51CF) + indigo label, optional dismiss x. Right: 'Share' (icon + label, 14-16 CSS) and a 36 CSS '...' icon button (hover #EEEEEE, ~8 CSS radius). Logged-out/empty variants show two bare 16 CSS icon buttons instead. Only one coloured element in the whole bar.

Evidence: 22, 24, 44, 75

### 5. Chat composer (resting)

A fully-rounded pill, 768 CSS max-width [977 px], 57 CSS tall [73 px] single-line, 1px #DDDDDD border plus a soft low shadow (rows below fade #EEE -> #F8F8F8 over ~6 px). Left: ghost '+' button (hover/pressed disc #F5F5F5, ~36 CSS); placeholder 'Ask anything' 16 CSS in ~#7B7B7B; right: mic icon then a 36 CSS circular primary button [46 px] filled #010101. That primary button morphs by state: waveform glyph when empty (22), up-arrow when text present (23, 59), black square on a pale-grey (#E9E9E9) disc while streaming (24, 38). Sits 31 CSS above the viewport bottom with a 12-13 CSS disclaimer line beneath ('ChatGPT can make mistakes...' with underlined link).

Evidence: 22, 23, 24, 59, 38

### 6. Composer expanded states

The pill grows instead of opening a separate panel. Attachments render as a tile row inside the top of the pill: image thumbs 56x56 CSS [71 px] with ~12 CSS radius and an 18 CSS black circular x badge (some with a pencil/edit badge); file cards 321x56 CSS [407x71] with 1px #E5E5E5 border, a 40 CSS square icon tile (PDF #FA433F, generic file #8F8F8F), bold 14 CSS filename over muted #444 'PDF'/'File' type. Pill grows to ~130 CSS tall with the input row below it. Active tools appear as a blue 'chip' next to '+' ('Image', 'Shopping research', 'Think', 'Research'), each with a 16 CSS icon; the placeholder changes with the mode ('Describe or edit an image', 'Get a detailed report'). Quoted-reply context is a slim row above the input with a reply arrow, quoted text and an x (61, 62).

Evidence: 28, 27, 29, 51, 36, 41, 61

### 7. Thread layout, message styling and action row

Assistant output is unboxed text on the white canvas - no avatar, no bubble, no name label - 16 CSS / 28 CSS line height [pitch 35.6 px], ink #0D0D0D class. User messages are right-aligned hugging bubbles: fill #F2F2F2 (#F5F5F5 in other captures), ~18 CSS radius (estimated; a 1-line bubble is a full pill 35 CSS tall), 16 CSS text, up to about 536 CSS wide before wrapping to a second line. Gap user bubble -> assistant first line = ~50 CSS [64 px]. First message starts ~12 CSS under the header. Section headings inside answers are 20 CSS semibold with a leading emoji, separated by 1px #D2D2D2 rules with ~40 CSS space; list pitch 28 CSS; bold lead-in phrases inside bullets; inline image rows are 3-up, 201 CSS tall, ~5 CSS gaps, ~12 CSS radius, with a '4' overflow badge on the last tile. Under each assistant message: copy, thumbs-up, thumbs-down, share, regenerate, '...' - 16 CSS outline icons on 32 CSS hit areas [40.8 px pitch]. Selected/pressed state = #F5F5F5 rounded-square chip (32 CSS, ~8 CSS radius) with the glyph filled (thumbs-down in 67/70/74); copy swaps to a check glyph for confirmation (64). A 32 CSS round white arrow button with a 1px border floats centred just above the composer when content is below the fold (24, 39, 57).

Evidence: 24, 25, 39, 51, 63, 64, 67, 70

### 8. Streaming / loading microstates

No spinners or skeletons anywhere in the slice. Loading is expressed as copy plus quiet motion: (a) stop square in the composer button (24); (b) reasoning summary headline ('Explaining tea plant shading ... >' in ~#333 semibold) with muted streaming text (~#7E7E7E) and a right-aligned underlined 'Answer now' link (38), which collapses to a muted 'Thought for 42s >' (#4E4E4E) once done (39); (c) plain muted status text 'Analyzing image' under the sent message (31); (d) a 418x93 CSS progress card: title 16 CSS, blue '2 sources' link, thin track (#E9E9E9) with black (#0E0E0E) fill and a round stop button (44); (e) 'Gathering requirements' label over product cards with a thin determinate bar (52-55); (f) voice dictation shows a live waveform inside the pill with x and check controls (58).

Evidence: 24, 38, 39, 31, 44, 52, 55, 58

### 9. Activity / Sources panel and citation chips

A 400 CSS wide [508 px] panel docks on the right (x=1412 px) with a 1px #E7E7E7 left border on the same white canvas. Header 52 CSS: centred segmented control 'Activity | 23 Sources' (track #E9E9E9, 208x43 CSS, selected segment = white pill with soft edge) and a close x. Body is a vertical agent log: leading 16 CSS glyph (OpenAI knot for model thoughts, magnifier for 'Searched for ...', favicon for 'Read reuters.com', globe for 'Reading...') + 16 CSS text, 24 CSS line height [30.5 px pitch], ~14 CSS of extra space between entries, domain links in blue (#2D5484), the current step in lighter shimmering grey. Sticky footer with two near-equal pills ~178x35 CSS: outlined 'Stop' and primary black 'Update' (#0E0E0E). The 'Citations' tab swaps the log for source cards: favicon + muted domain, bold title, grey 2-line snippet (sizes not measured). Inline source chips follow claims: 17 CSS tall pills [22 px], small text (~11 CSS, estimated) #535353 on #F6F6F6, no border, e.g. 'PubMed Central', 'Wiley Online Libr... +1'. Report footers collapse sources into one pill with stacked favicons + 'Sources' (47). Run metadata is plain muted text ('Research completed in 5m - 23 sources - 63 searches', 'Shopped for 7m - 25 products viewed >'). Status is carried by text colour and tiny pills, not by coloured badges.

Evidence: 44, 45, 46, 47, 48, 39, 56

### 10. Auth and sign-in column

Everything is one centred column 340 CSS wide [432 px], starting ~150 CSS from the top: H1 ~32 CSS [cap 29 px; estimated] regular/medium, near-black; subtitle 16/24 CSS centred in #484848 (two lines, 31 px pitch). Every control is 52 CSS tall [66 px] and fully rounded; vertical pitch 64 CSS (52 + 12 gap). Social buttons are white with 1px #D0D0D0 border, 20 CSS brand icon at x=24 CSS and left-aligned label (Google, Apple, Microsoft, phone). 'OR' = 12 CSS caps label centred on a 1px light hairline. Primary 'Continue' = solid #131313 pill; secondary 'Sign up with a one-time code' = white pill with 1px border. Footer links 'Terms of Use | Privacy Policy' 14 CSS underlined. Only chrome: wordmark top-left at 24 CSS inset.

Evidence: 1, 2, 3, 4, 6

### 11. Floating-label input states

Inputs are 52 CSS pills with a label that sits ON the top border, interrupting the stroke with a white notch (label 13 CSS, #9E9E9E at rest). Default border #D0D0D0 1px. Focus: border turns indigo-blue (about #5565AD, ~2 px) and the label turns blue (#6D87D7 to #4163BC). Filled value 16 CSS #000. Trailing affordances sit inside the pill: blue 'Edit' text link (4), eye toggle (4, 5), autofill/face icon (2). Validation is a squared checklist box below the field (1px #B6B6B6, ~2 CSS radius, 'Your password must contain:' + tick rows in blue #2B72B1 when satisfied). No red error state appears in this slice. Disabled primary is a pale-grey pill (65).

Evidence: 1, 2, 3, 4, 5, 65

### 12. Post-signup onboarding step pattern

Pages have no chrome and no progress bar; the content block is ~317-340 CSS wide, vertically centred a little above middle. H1 30-32 CSS (can wrap to two lines, 35 CSS line pitch) + 16/24 muted sub. Single-select list: 5 rows on a 64 CSS pitch, 16 CSS outline icon + 16 CSS label, no borders at rest; the chosen row becomes a #F1F1F1 filled card 321x56 CSS [407x71 px] with ~14 CSS radius (estimated) and a trailing black check-circle ~16 CSS (14). Footer is always 'Next/Continue' (black pill 317x41 CSS, #0E0E0E) with a text-only 'Skip' ~16 CSS below. Birthday step uses a 3-field segmented select (Feb | 26 | 2026) inside one 52 CSS pill and a custom list popover with a 39 CSS row pitch [49.5 px] and a #F0F0F0 highlighted row (101x39 CSS) (10).

Evidence: 13, 14, 8, 9, 10, 12

### 13. Chip cloud multi-select

'What do you want to do' = centred wrapping chips: 44 CSS tall [56 px], row pitch 56 CSS (12 CSS gap), full pill, white with a 1px near-white border and soft drop shadow, 15-16 CSS label, 20 CSS emoji at left. Selected = tinted fill + coloured border + coloured text + leading check-circle; the tint is per-category (green #D1F3E0 / text #127E44 for Search; amber for Analyze data). Choosing a chip fades its row and expands 6 sub-chips below (17, caught mid-transition). 'Continue' (black pill 318x42 CSS) + 'Skip' stay anchored at ~74-82% of viewport height (13: Next at 72-76%).

Evidence: 15, 16, 17

### 14. Guided tour as live preview

Tour steps split the screen at the viewport centre: the left half holds a 318 CSS wide copy block (title ~30 CSS [cap 28 px; estimated], 16/24 muted description in two lines, black 'Next' pill 318x42 CSS and plain 'Skip Tour'), the right half is a large white card 660x785 CSS [838x997 px] starting exactly at x=960 px, 79 CSS from the top, ~28 CSS radius with a faint 3-4 px grey edge/shadow (#F0F0F0), rendering a real sample conversation / generated image. Finale 'You're all set' = check-circle icon, title, 13 CSS legal micro-copy with underlined links, black Continue pill, then a second legal line.

Evidence: 18, 19, 20, 21

### 15. Modal dialogs and in-dialog form controls

White surface, 1px ~#CCC border and a large diffuse shadow, centred. The page behind is dimmed about 6% (white -> #F0F0F0) AND blurred so text is unreadable (66, 78); the share modal uses a lighter veil (#FAFAFA). Sizes: feedback 575 CSS wide x 328 CSS (radius ~16-18 CSS); delete confirm 447 CSS x 174 CSS (title 18 CSS, body 16, 14-CSS muted explanatory line #7E7E7E with underlined link, buttons right-aligned: outlined 'Cancel' pill and red 'Delete' pill #E1302C, ~8 CSS gap, 36 CSS tall); share 640 CSS x 612 CSS with a larger ~28-32 CSS radius, bold ~30 CSS title (cap 27 px; estimated), hairline divider, preview card, and 64 CSS circular black icon buttons with 12 CSS captions (Copy link, X, LinkedIn, Reddit). Close is a bare 20 CSS x top-right. Feedback modal uses 38 CSS pill chips (12 CSS gaps, 1px light border) as single-select; selected = solid #0F0F0F fill with white text. Free-text field is a squared-ish 545x38 CSS box (~6 CSS radius, 1px light border, placeholder 'Share details (optional)'). Privacy note sits in a #ECECEC filled strip with 13 CSS text and underlined link. Submit is a right-aligned 71x34 CSS #0D0D0D pill, pale grey when disabled (65).

Evidence: 66, 65, 78, 68

### 16. Dropdown and popover menus

White card, 1px #DCDCDC border, soft shadow, ~16 CSS outer radius (estimated), anchored just beneath the trigger. Plus menu is 230x239 CSS: 6 rows on a 36 CSS pitch, 16 CSS outline icon at left, 16 CSS label, a trailing chevron on 'More', and a 1px #E9E9E9 separator after the first group. Chat options menu is 198x203 CSS with 5 rows; the destructive 'Delete' row has red text and icon (#C53730-#E1302C). Small text-selection popover ('Ask ChatGPT' pill with quote glyph, 60) and message popover (muted timestamp row 'Yesterday, 2:37 PM' + actions, 70/74) use the same surface.

Evidence: 26, 75, 70, 74, 60, 10

### 17. Toasts and inline banners

Toast = solid green #008735 pill (~8 CSS radius, 43 CSS tall), centred on the VIEWPORT (x=960 px) at 12 CSS from the top, hugging its content (162-307 CSS wide), white 16 CSS text with a leading check-circle and optional x. It floats above a dimmed modal without being dimmed (69). Inline notices are white 1px-bordered cards ~16 CSS radius sitting directly above the composer: 'Multitasking - Try asking ChatGPT something else while you wait' with x (44), or a tiny pill 'Do you like this personality?' with thumbs and x (32).

Evidence: 67, 69, 44, 32

### 18. Decision card with paired actions

Shopping research product card: outer 1px #E5E5E5 card with ~24 CSS radius and shadow; left media tile (~360 CSS square, light-grey backdrop, image centred); right column: 16 CSS semibold title with '>', muted meta line (price - seller - amber star #F2AC00 3.9 (53 reviews)), then a key-value spec list on a 37 CSS row pitch with 1px #E6E6E6 rules (bold label column ~168 CSS, muted value). Footer: two equal outlined pills 359x36 CSS ('x Not interested' / 'check More like this', ~9 CSS gap) and a centred muted 14 CSS 'Skip' text link below the card. Binary decision + skip is a reusable approval pattern. The single-action sibling is the promo card in 51: 768 CSS wide x 409 CSS tall, 1px #E7E7E7 border, ~23 CSS radius, 358 CSS square media tile in #CEDDFC, ~24 CSS semibold title, 16 CSS muted body and a 337x42 CSS black 'Get started' pill.

Evidence: 53, 54, 52, 51

### 19. Data table (only one in slice)

Comparison table inside the chat column: no outer border, no zebra. Header row = 163 CSS square product images [207 px, ~12 CSS radius] over 14 CSS semibold two-line names with a muted 'price - seller' line; first column 'Attribute' bold; 1px #DBDBDB rule under the header, then extremely faint row rules (#F2F2F2 / #F6F6F6) every 69 CSS for two-line rows; body cells 14 CSS / 24 CSS line height; column pitch 192 CSS, label column ~135 CSS; the table overflows horizontally and clips at the viewport edge (no scroll chrome visible). No sort arrows, filters, pagination, row hover or selection in the slice.

Evidence: 57

### 20. Image-generation entry and gallery

Image mode swaps the one-line pill for a two-row card (input on top, toolbar with '+' / blue 'Image' chip / mic / send below), 104 CSS tall [455-586 px] when empty, ~263 CSS tall with an attached 142 CSS thumbnail at top-left (29). Below it sits a horizontally scrolling style carousel: an 'Edit an image' upload tile, then portrait style tiles ~97x145 CSS (about 2:3; estimated from the half-scale view) at ~108 CSS pitch (Caricature Trend, Lunar New Year, Gold, Crayon...) with small muted captions; two circular arrow buttons top-right. Result messages are labelled 'Image created - <title>' in muted 14 CSS with a 3-icon action row (35).

Evidence: 29, 30, 33, 34, 35

### 21. Colour discipline and radius ladder

The UI is strictly monochrome: #FFFFFF canvas, #F8F8F8 sidebar, #E8E8E8 active row, #F2F2F2 user bubble, 1px #E5E5E5-#E9E9E9 hairlines, ink #0D0D0D (large display type measures #0E0E0E; small text renders #000), secondary #484848, muted #6A6A6A-#8B8B8B. Colour appears only as signal: indigo (Get Plus), blue (focus, links, unread dot, active tool chip), green (success toast, selected chip), red (destructive), amber (stars, one chip), file-type tiles (red/grey). Radius ladder: full pill = buttons, inputs, chips, composer; ~8 CSS list rows and icon buttons; ~12 CSS media tiles and attachment cards; ~16-18 CSS menus, modals, notices; ~24-32 CSS promo/decision cards and the share modal. Shadows only on popovers, modals, chips and the composer; cards otherwise use flat borders.

Evidence: 22, 24, 66, 16, 26, 54

### 22. Button system

Three tiers, all pill-shaped: primary solid #0E0E0E-#131313 with white 16 CSS text (heights 52 CSS on auth, 41 CSS on onboarding, 34-36 CSS in dialogs/panels and nav); secondary white with 1px #D0D0D0-#E5E5E5 border and black text; tertiary text-only ('Skip', 'Skip Tour', underlined 'Answer now'). Destructive = solid red #E1302C pill. Icon buttons are ghost 32-36 CSS squares/discs with #F5F5F5 hover. Primary and secondary are paired side by side at equal widths in decision/footer rows (44, 53, 78).

Evidence: 2, 13, 78, 54, 44, 0

### 23. Marketing landing header and hero

Logged-out landing uses a ~64 CSS display headline [cap ~58 px; estimated] on a 64 CSS line pitch [81 px] in #0E0E0E with tight tracking, centred; eyebrow 'ChatGPT' 14 CSS muted above it; 18-20 CSS subhead; primary 'Start now >' black pill 106x34 CSS next to a text link. Nav: logo left, 7 centred text links ~14 CSS muted, right 'Log in' black pill (65x34 CSS) + 'Sign up for free' outlined pill (124x36 CSS). Below, a marquee of three rows of suggestion cards (286x79 CSS, ~8 CSS gap, flat grey #E4E4E4 fill, ~8 CSS radius, 16 CSS two-line text, edges fading out).

Evidence: 0

### 24. Copy tone and dynamic greetings

Short, friendly, sentence-case microcopy. The empty-state heading rotates by context and name: 'Ready when you are.', 'What's on the agenda today?', 'Where should we begin?', 'What are you working on?', 'What are you researching?', 'Hey, Alex. Ready to dive in?'. Every optional step has an explicit 'Skip'; reassurance lines explain data use ('We'll use this information to suggest ideas you might find useful.'). Buttons are single verbs (Continue, Next, Update, Stop, Submit). Confirmations name the object ('This will delete Best Matcha Latte Recipe.').

Evidence: 22, 36, 40, 49, 77, 13, 78

### 25. Coverage gaps in this slice

All 80 screens are light-theme, 1920 px-wide desktop captures. There is NO dark mode, NO mobile viewport, NO settings page, NO billing/usage chart, NO error state (no red inline errors or failed-generation screens), NO toggle switches, NO tabs-as-navigation and NO sortable table. Those must come from other slices or the Platform pack; mobile behaviour of the sidebar/composer cannot be measured here.

Evidence: 22, 24, 57, 66

## Rasikh mappings

- **Agent activity feed (did / waiting on / needs approval)** - screens 44, 45, 46, 47, 48, 38, 39, 52, 55. Activity panel (44-48) is a ready-made agent log: icon + one-line step + blue source links, 24 CSS line height, sticky Stop/Update footer, segmented 'Activity | Sources' switch. The reasoning summary that collapses to 'Thought for 42s >' (38/39) is the model for a collapsed 'did X' group; 'Gathering requirements' progress (52, 55) and the progress card with stop (44) model the 'waiting on' state.
- **Approval request card (employer backing, landlord decisions)** - screens 53, 54, 78, 51, 44. Product decision card: bordered card, key-value facts, two equal outlined pill actions plus a muted 'Skip' link (53, 54) maps directly to Approve / Decline / Ask later. The confirmation dialog 447 CSS wide with outline Cancel + solid destructive/primary pill (78) is the confirm step; the promo card with one black CTA (51) is the single-action variant.
- **Document upload + AI extraction (newcomer app)** - screens 28, 27, 29, 26, 31, 54, 39. Attachment tiles inside the composer (28: 56 CSS thumbs with x badges, 321x56 CSS file cards with a 40 CSS typed icon tile, filename + type line) are the upload pattern; the '+' menu with 'Add photos & files' (26) is the entry; muted 'Analyzing image' status (31) is the extraction-in-progress copy; extracted fields can render as the bold-label / muted-value hairline list from 54 plus inline source chips from 39. Confidence scores are NOT shown anywhere in this slice, so a confidence meter has no reference here.
- **Landlord / bank application detail with verified fields and plain-language risk summary** - screens 54, 56, 57, 46. Summary-first report (56: 'Summary' paragraph, then 'Best overall' with image, then a rationale line) is the layout for a plain-language risk summary; spec rows (54) for verified fields; comparison table (57) for side-by-side applicant data; long-form report opened beside a log panel (46) for the detail + audit-trail layout.
- **Employer hires table** - screens 57. Only table in the slice: borderless, header rule #DBDBDB, near-invisible row rules, 14 CSS / 24 CSS text, ~69 CSS two-line rows. Use it for type scale and rule colours only - sorting, stage pills, hover and pagination are absent here and must come from the Platform pack.
- **Add-hire / multi-step forms and newcomer sign-in** - screens 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 66. Centred 340 CSS column, 52 CSS floating-label pill inputs with blue focus ring, checklist validation box, 'Continue' primary pill with an 'OR' divider and secondary alternative; segmented 3-field select with list popover (10) for dates; OTP 'Check your inbox' (6, 7) for passwordless sign-in. The feedback form in a modal (66) shows the compact in-dialog variant.
- **Mobile-first newcomer chat / agent composer** - screens 22, 23, 28, 51, 61, 29, 58. Composer pill (57 CSS, black circular action morphing waveform / arrow / stop), expanding attachments row, blue mode chip, quoted-reply row and voice dictation waveform give the full input system for the newcomer assistant. These are desktop-only captures: scale the 768 CSS column down to full width with 16 CSS gutters.
- **Onboarding questions and welcome tour** - screens 13, 14, 15, 16, 18, 19, 20, 21. Single-question screens with an icon-row choice list or chip cloud, black Next/Continue pill and plain Skip; tour pages with copy left and live preview card right; 'You're all set' close with legal micro-copy. Good template for newcomer intake (visa type, arrival date, goals) and the post-signup 'what matters to you' step.
- **Roadmap with dependencies / trust passport toggles (partial)** - screens 13, 14, 16, 66, 75. No stepper, timeline or switch components exist in this slice. Closest primitives: selectable rows with a trailing check-circle (14), the selected-chip tint system (16, 66) for per-party visibility choices, and the 36 CSS-pitch menu with icon + label rows (75) for per-field options. Treat as partial only; look to the Platform pack (settings/toggles) for real switches.
- **Language switcher (EN / AR) and toast feedback** - screens 10, 26, 67, 69. No language selector or RTL screen exists. Reusable primitives only: the custom list popover with highlighted row (10) and the 230 CSS menu with chevron-submenu (26) for the switcher; top-centre solid-green toast with check-circle (67, 69) for save/confirm feedback.
