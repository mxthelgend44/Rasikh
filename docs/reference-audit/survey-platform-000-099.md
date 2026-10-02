# Survey: OpenAI Platform web Apr 2026, screens 0-99

Slice: indices 0..99 inclusive (100 screens). Every screen was reviewed through the contact sheets (`.reference/contact-sheets/platform-early/000-019.jpg` to `080-099.jpg`), then re-checked in 2x2 full-width montages (all 100) and 25+ screens were opened at full resolution (Mobbin footer cropped; app viewport 1920x1205). Nothing under `.reference` was modified.

What this slice contains: the sign-up funnel (marketing home, login/create-account/password/e-mail-code/age), 4-step developer onboarding (organisation, first API key, credits), then one long Playground session: Chat prompts home, prompt editor (model picker, parameter popover, variables, tools, system/developer message, chat pane, feedback), publish/versioning flow, compare A/B, Optimize (AI rewrite with diff), View code, history side panel, and a Dataset/Evaluation grid. All 100 screens are LIGHT theme, desktop only. There is no dark mode, no chart, no mobile layout and no toggle switch in this slice.

## Scale and method note (verified)

- Every image is 1920x1325; the bottom 120 px (Mobbin footer) was cropped before all measurement, leaving a 1920x1205 viewport.
- **Assumed scale: 1.27 screenshot px per CSS px (estimated).** This looks like a ~1512-CSS-px-wide viewport (14-inch MacBook default) resized to 1920 wide. It agrees with the sibling surveys (slices 100-199 and 200-279 use the same figure). Verification done here, using flat-region edge-to-edge runs:
  - sidebar nav pitch 45.7 px = 36 css; nav row 41 px = 32 css; nav left inset 15 px = 12 css;
  - modal widths 570 / 634 / 660 px = 449 / 499 / 520 css (i.e. 450 / 500 / 520, round numbers); dropdown 380 px = 299 css (300); onboarding column 456 px = 359 css (360); auth pill height 66 px = 52 css;
  - body-text cap height 12-13 px, with the usual ~0.70 cap ratio, gives 14 css exactly at 1.27; the other measured caps (small 11, 16-css 14.6, 18-css 16, 20-css 17.5, 24-css 21.5, 32-css 28) all land on whole CSS sizes at 1.27 and overshoot by ~5% at 1.35;
  - body line pitch 26.8-27.0 px = 21 css (14 px x 1.5).
  - A competing fit of 1.33-1.35 matches only the auth column (432 px = 320 css) and the 24-px avatar, and fails the modal widths and type sizes, so it is rejected but not impossible. Treat every CSS figure as +/-6%.
- Written as `NN px (MM css)`: NN is measured in screenshot pixels, MM = NN / 1.27 rounded. `est.` marks anything inferred rather than read off a pixel run.
- Hex values are the most common colour in a flat region (or the darkest cluster inside a glyph run for text, which is therefore a lower bound on darkness). Screenshots are slightly soft (JPEG-like), so hairlines render across 2 rows and edge positions are +/-1 px.
- Not measurable here: hover/pressed states (only a few hover tooltips appear), animation timing, the exact font name (neutral geometric grotesque, OpenAI-Sans-like, plus a monospace for params/IDs/code), dark mode, mobile.

## Catalog (idx | kind | theme | note)

| idx | kind | theme | note |
|---|---|---|---|
| 0 | marketing | light | OpenAI home: "What can I help with?" composer, text nav |
| 1 | marketing | light | Home with Log in menu open: ChatGPT, API Platform, Sora |
| 2 | auth | light | Welcome back: email pill, Continue, Google/Apple/Microsoft/phone |
| 3 | auth | light | Create an account, empty email field |
| 4 | auth | light | Create an account, email focused, blue border, floating label |
| 5 | auth | light | Create a password, empty password field |
| 6 | auth | light | Create a password, requirement checklist box shown |
| 7 | auth | light | Password valid, "At least 12 characters" met in blue |
| 8 | auth | light | Check your inbox, empty verification code field |
| 9 | auth | light | Check your inbox, code entered, Resend email link |
| 10 | auth | light | Let's confirm your age, empty name, default birthday |
| 11 | auth | light | Confirm your age, name filled, year segment selected |
| 12 | auth | light | Confirm your age, name and birthday filled |
| 13 | onboarding | light | Welcome org form, empty fields, stepper step 1 of 4 |
| 14 | dropdown-menu | light | Onboarding role select open: Student, Engineer, etc. |
| 15 | onboarding | light | Org form filled, Create organization enabled |
| 16 | loading-state | light | Create organization button replaced by spinner |
| 17 | onboarding | light | Make your first API call: key name, project name |
| 18 | billing | light | Add some API credits: radio cards, Purchase credits |
| 19 | empty-state | light | Chat prompts first run: icon tile, Create, Generate input |
| 20 | app-shell-home | light | Chat prompts: generate input, chips, two prompt cards |
| 21 | empty-state | light | Chat prompts empty, Generate input focused, plus button |
| 22 | empty-state | light | Generate input typed "Generate UX critique assistant" |
| 23 | loading-state | light | New prompt: skeleton bars while system message generates |
| 24 | detail-page | light | New prompt editor, generated system message, Save |
| 25 | detail-page | light | Editor scrolled: end of system message, User message box |
| 26 | dropdown-menu | light | Model picker: search, grouped list with descriptions |
| 27 | dropdown-menu | light | Model picker filtered by typing "gpt-5" |
| 28 | detail-page | light | gpt-5.2 selected, label becomes Developer message |
| 29 | dropdown-menu | light | Parameters popover: format, temperature, tokens, Store logs |
| 30 | dropdown-menu | light | Tool choice select open inside parameters popover |
| 31 | settings-form | light | Parameters popover, tool choice web_search_preview |
| 32 | settings-form | light | Sliders moved: temp 0.53, tokens 12872, top P 0.66 |
| 33 | dropdown-menu | light | Add variable popover, empty "e.g. city" input |
| 34 | dropdown-menu | light | Add variable popover, "product_type" typed, Add enabled |
| 35 | chat-composer | light | Variable chip added; composer shows key row, enter value |
| 36 | chat-composer | light | Composer variable value typed "web dashboard" |
| 37 | chat-composer | light | Three variable rows filled above composer |
| 38 | dropdown-menu | light | Tools Add menu: Hosted group, Local group, Function |
| 39 | modal-dialog | light | Configure Web Search tool, empty fields, scrim |
| 40 | modal-dialog | light | Web Search tool config, country and state filled |
| 41 | detail-page | light | Web Search tool chip added; editor, three variables |
| 42 | chat-composer | light | Composer text typed; Optimize and Compare enabled |
| 43 | file-upload | light | Image attachment thumbnail with remove x in composer |
| 44 | chat-thread | light | Streaming response, Reasoning list, stop button |
| 45 | chat-thread | light | Completed response: Good/Bad, time and token stats |
| 46 | toast-banner | light | Consent popover "Allow submitting feedback", Decline/Allow |
| 47 | toast-banner | light | Green "Feedback settings updated" toast, feedback popover |
| 48 | chat-thread | light | Feedback textarea typed, Send button, privacy note |
| 49 | toast-banner | light | Green "Feedback submitted" toast over top bar |
| 50 | modal-dialog | light | Publish prompt modal, empty name, disabled Publish |
| 51 | modal-dialog | light | Publish prompt, name "UX Critique Assistant", Publish |
| 52 | modal-dialog | light | Your prompt was published: ID and node.js snippet |
| 53 | detail-page | light | UX Critique Assistant v1, "Set as default" pill, Update |
| 54 | modal-dialog | light | Publish changes? Version 1 to New version, checkbox |
| 55 | modal-dialog | light | Published! success state, blank modal with green check |
| 56 | modal-dialog | light | Published v2 modal with code snippet, version "2" |
| 57 | detail-page | light | Critique Assistant v2 default, clean, empty chat pane |
| 58 | dropdown-menu | light | Prompt title menu: search, Rename prompt, New prompt |
| 59 | modal-dialog | light | Rename "UX Critique Assistant" modal, Cancel/Rename |
| 60 | modal-dialog | light | Rename modal, new name "Critique Assistant" typed |
| 61 | dropdown-menu | light | Version menu: v2 default tag, v1, New version |
| 62 | detail-page | light | Critique Assistant v1 selected, "Set as default" pill |
| 63 | modal-dialog | light | Change default version? v2 to v1, Change button |
| 64 | detail-page | light | Critique Assistant v1 default, clean state |
| 65 | chat-thread | light | Compare mode A/B panes, B still streaming reasoning |
| 66 | chat-thread | light | Compare A/B complete, shared composer with variables |
| 67 | other | light | Optimize for GPT-5.2 full screen, original prompt |
| 68 | other | light | Optimize screen, instruction typed, Optimize button |
| 69 | loading-state | light | Optimizing prompt... progress card, spinner on button |
| 70 | other | light | Optimization result: blue changed blocks, comment icons |
| 71 | other | light | Result with "Reasoning behind change" hover popover |
| 72 | other | light | Result diff view: red deleted blocks, reasoning notes |
| 73 | other | light | Optimize result, Copy button shows copied check |
| 74 | dropdown-menu | light | More menu: API Responses/Chat Completions, Code, History |
| 75 | modal-dialog | light | Switch to Chat Completions API? confirm, Cancel/Continue |
| 76 | detail-page | light | Chat Completions "Prompts" editor with Functions row |
| 77 | error-state | light | View code modal with red "no API key" alert banner |
| 78 | modal-dialog | light | View code modal scrolled, JSON body, Close |
| 79 | detail-page | light | 30-day history side panel, timeline rail, three panes |
| 80 | detail-page | light | New prompt gpt-5, variables city and num_days empty |
| 81 | detail-page | light | Variables filled: Tokyo, 4 days 3 nights |
| 82 | detail-page | light | Tooltip "Clear conversation on each run" on Auto-clear |
| 83 | chat-composer | light | Composer message typed, variable rows above |
| 84 | loading-state | light | User message sent, assistant thinking dots, stop button |
| 85 | chat-thread | light | Assistant answer, Expand, Good/Bad, time and tokens |
| 86 | detail-page | light | Trip v1 default saved, Evaluate enabled, answer shown |
| 87 | list-table | light | Trip dataset grid: num_days, city, five empty rows |
| 88 | list-table | light | Dataset prompt tab: prompt pane left, output column right |
| 89 | modal-dialog | light | Annotate full-screen modal, row list, empty annotations |
| 90 | dropdown-menu | light | AI edit popover "What would you like to change?" |
| 91 | dropdown-menu | light | AI edit popover typed "Add cafe to visit" |
| 92 | detail-page | light | Developer message rewritten with cafe line, Save active |
| 93 | dropdown-menu | light | Export menu: Download as CSV, Create Eval disabled |
| 94 | modal-dialog | light | Leave without saving? red Leave, Cancel, Save and Leave |
| 95 | list-table | light | Evaluation > Datasets table, one row, Create button |
| 96 | modal-dialog | light | Publish prompt modal for Trip, empty name focused |
| 97 | modal-dialog | light | Publish prompt, name "Trip" filled |
| 98 | loading-state | light | "Publishing..." modal with centred spinner |
| 99 | modal-dialog | light | Published! confirmation after Trip publish |

## Canonical picks (per category, from this slice)

| category | indices |
|---|---|
| shell_sidebar | 20, 95, 19, 29, 86, 53 |
| top_bar | 20, 29, 95, 53, 14, 87 |
| data_table | 87, 95, 88 |
| settings_form | 29, 39, 15, 17, 31, 40 |
| detail_page | 57, 79, 86, 66, 41, 29 |
| empty_state | 19, 21, 24, 57, 89 |
| loading_state | 23, 69, 98, 84, 16, 47 |
| error_state | 77, 6 |
| modal_dialog | 51, 75, 94, 63, 39, 52 |
| dropdown_menu | 26, 14, 38, 74, 61, 58 |
| toast_banner | 49, 47, 77, 69, 46, 82 |
| tabs | 95, 87, 39, 88 |
| chart | none (no charts in this slice) |
| dark_mode | none (all 100 screens are light) |
| input_states | 3, 4, 7, 11, 13, 15 |
| buttons | 94, 29, 2, 23, 20, 18 |
| onboarding | 15, 17, 18, 13, 10, 8 |
| chat_thread | 45, 85, 66, 86, 44, 84 |
| chat_composer | 37, 29, 43, 83, 42, 24 |
| status_pill | 24, 53, 61, 18, 66, 57 |
| file_upload | 43, 44, 87, 65 |

Selection notes: 69 and 82 are transient frames chosen only because they are the single clean example of a progress card and a tooltip. 29, 31, 32 are the only slider/checkbox surfaces. 77 is the only genuine error banner; 6 is the only inline validation box. 6, 7, 11 are mid-typing frames kept for input-state evidence.

## Observations (design language, measured)

All sizes are `screenshot px (css est. at 1.27)`.

1. **App shell = grey canvas holding one floating white panel.** Canvas `#f3f3f3` covers the sidebar and the top bar; the content panel is `#ffffff` with a ~1 px `#efefef` border, a very faint shadow and ~14 px (~11 css) corner radius. Panel left edge x=278 (219 css); panel runs to 11 px (9 css) from the right and bottom viewport edges; top edge y~70 (55 css). There is no sidebar divider line, no top-bar border. Evidence: 20, 29, 95.
2. **Sidebar nav.** 278 px (219 css) wide. Rows are 41 px (32 css) tall on a 45.7 px (36 css) pitch, 15 px (12 css) from the left edge, 246 px (194 css) wide, corner radius ~11 px (8 css). Selected row = flat fill `#e0e0e0` and pure-black label (others ~`#0c0c0c`); no accent colour, no left bar. 20-21 px (16 css) outline icons at x=30, label at x=64 (icon-to-label gap ~14 px, 11 css). Group labels (Create / Manage / Optimize) are 12-13 css `#848484`, 39 px (31 css) above the first item and 50 px (39 css) below the last item of the previous group. Collapse-sidebar icon pinned bottom-left (x=41, y=1167). Evidence: 20, 29, 95.
3. **Top bar.** 70 px (55 css), sits on the canvas. Left: 33 px (26 css) filled-black circular avatar with white initial, bold org name, up/down chevron, grey "/" separator, project switcher. Right: "Dashboard" (`#000`, medium) and "API Docs" (`#494949`, regular) as plain text links, gear icon, light-grey (`#eeeeee`) circular avatar. Onboarding variant (13-18) swaps the left side for the wordmark and puts a 4-segment stepper in the centre. Evidence: 20, 29, 14, 18.
4. **In-panel page header.** 70 px (55 css) row with a 1 px `#e7e7e7` rule below: back chevron, title (cap height 17 px; ~20 css, medium), small up/down chevron, then pills (`Draft`, `v1 - default`, `Set as default`) and a muted status string ("Unsaved changes", 12-13 css `#4e4e4e`). Right-aligned actions are ghost text+icon buttons (Compare, Optimize, Evaluate) and one solid black primary at far right (87 x 38 px = 68 x 30 css). Disabled actions keep layout and drop to ~`#a0a0a0`. Evidence: 29, 23, 53, 79, 66.
5. **Button system.** Primary: solid near-black `#181818` (auth pages `#141414`), white 14-16 css label. App buttons are rounded rectangles (radius ~11 px = 8 css): 30-31 css tall in toolbars, 38-40 css in modals (49 px), 47-48 css for a page CTA (60 px). Pill shape (full radius) is used for auth (Continue 65 px = 52 css), the Create pill (128 x 48 px = 101 x 38 css), onboarding (CTA 455 x 59 px = 359 x 46 css, full pill) and billing CTAs. Secondary: flat `#ececec`/`#eeeeee` fill, no border (Cancel 85 x 40 px; Generate `#e8e8e8`). Outline pill: 1 px light border, white fill, "+ Add" (26 css tall). Destructive: `#e12e2a` fill, white label, 76 x 38 px (60 x 30 css), only inside a confirm modal beside neutral buttons. Tertiary: bare grey text ("I'll buy credits later", `#848484`). Evidence: 94, 29, 2, 18, 23, 20, 51.
6. **Type scale (one grotesque, mostly regular weight).** Body/UI, sidebar, buttons, table cells = 14 css (cap 12-13 px) on a 21 css line pitch (27 px); small/meta/table header = 12 css (cap 11 px); section heading 16 css semibold (cap 15 px, "Your prompts"); modal title ~18 css semibold (cap 16 px); page title ~20 css medium (cap 17-18 px); onboarding title ~20 css semibold; empty-state hero ~24 css semibold (cap ~21); auth H1 ~32 css regular (cap 28-29 px). Text colours: primary `#000`-`#141414`, secondary `#474747`-`#4e4e4e` (subtitles, field labels), tertiary `#848484`-`#868686` (group labels, meta), placeholder `#a4a4a4`. Monospace (~12 css `#575757`) used for the parameter summary line with green values, response IDs and token stats. Evidence: 20, 29, 2, 7, 14, 18, 51, 94.
7. **Colour restraint.** The UI is monochrome (`#f3f3f3` / `#ffffff` / `#fafafa` / `#181818` + greys). Colour is reserved for meaning: solid blue `#0385ff` icon tiles on prompt cards; link blue ~`#4267e5`; success green `#3eae72` (toast), green-tint badge `#e0f4e4` with `#14853d` text ("Recommended", "default"); destructive red `#e12e2a`; alert outline red ~`#b6332d`-`#d94540`; diff red `#ffd9d8` (left bar ~`#ff6c67`) and diff blue `#e5f3fe`; A/B model badges amber `#ffe8c5` and lavender `#d2cff2`; template variables `{{city}}` and param values in green. Evidence: 20, 47, 18, 94, 77, 72, 70, 66, 29.
8. **Input anatomy, two systems.** (a) Auth: pill inputs 432 px (340 css) wide x 66 px (52 css) tall, 1 px `#dedede` border, the label sits inside the field until focus/value, then floats up into the border as a cut-out; focus = blue border recolour, no glow (sampled stroke `#8399e3`, anti-aliased; the true stroke is probably nearer the link blue `#4267e5`, est.); inline "Edit" link and an eye toggle live inside the pill; social buttons are the same pill, outlined, 16 px (12 css) apart, brand icon at the left. (b) In-app/onboarding: bold 13 css label above, rounded-rect input (54 px = 43 css tall, ~10 css radius), 456 px (359 css) column, select with up/down chevron. Password rules appear as a square-cornered bordered box titled "Your password must contain:" with a blue check when met. Evidence: 2, 3, 4, 6, 7, 11, 13, 14, 15.
9. **Onboarding stepper and layout.** Header stepper = 4 bars, each 30 x 4 px (24 x 3 css), ~6 px gap, active/completed `#1e1e1e`, upcoming `#cecece`; 17 shows three dark, 18 shows four. Content is a single centred column (456 px = 359 css): 64 px (50 css) icon tile (white, 1 px border, tiny shadow, ~12 css radius), 20 css semibold title, two-line grey subtitle (`#474747`, ~16 css), fields, full-width pill CTA, then a muted text link ("I'll do this later", "I'm looking for ChatGPT" as a small grey chip). One decision per screen. Evidence: 13, 15, 17, 18.
10. **Option cards (billing).** Stacked radio cards 455 x 55 px (358 x 43 css) with ~11 px (9 css) gaps. Selected = 2 px black border + filled black circle with white tick; unselected = 1 px `#eee` border + empty 26 px ring. Right-aligned green-tint "Recommended" pill; helper copy below in 14 css grey; then the 60 px CTA and a tertiary text button. Evidence: 18.
11. **Home/list cards.** Prompt cards 347 x 163 px (273 x 128 css), ~16 css radius, 1 px `#ececec` border + soft shadow, 24 px (19 css) gap; contents: 36 px (28 css) solid-blue icon tile, title 14 css medium, then a baseline row with date (left) and author (right) in 12 css `#868686`. Above them a centred hero: 24 css title, black "Create" pill + pill "Generate..." input with a round send button, then 34 px (27 css) tall `#ececec` suggestion chips (full radius). Evidence: 20, 19, 21.
12. **Empty states are minimal.** A 50 px (39 css) rounded tile (`#ececec` in the chat pane, white with border on the home page) holding a line icon, then one 16 css semibold sentence ("Your conversation will appear here", `#111`), no CTA. Data grids show five blank rows plus a "+ Add row" line instead of an illustration; the annotate modal shows "No annotation columns found." with a two-line grey hint. Evidence: 24, 19, 87, 89.
13. **Popovers and menus.** White (or very light `#f8f8f8`) surface, 1 px hairline, ~16-18 px (13-14 css) radius, large soft diffuse shadow. Model picker is 380 px (300 css) wide: pinned search field, uppercase letter-spaced group labels (`GPT-4.1`, `REASONING`; 11-12 css grey), single-line rows on a 41 px (32 css) pitch, two-line rows (name + grey description) on 65 px (51 css); selected = tick on the left; hover/selected row = `#ececec` rounded 8 css. Small action menus (tools, more, export, version) use the same recipe with 16 px leading icons, and group heads like "Hosted"/"Local"/"API". Evidence: 26, 27, 38, 74, 61, 58, 93, 14.
14. **Parameter popover (settings pattern).** 381 x 365 px (300 x 287 css) card anchored to a small icon button; rows are label left, value right (14 css); selects show the value plus up/down chevron; sliders have a ~3 px grey track, 20 px white thumb with a dark ring, and the numeric value right-aligned on the label line; boolean = square 22 px (17 css) `#181818` checkbox with white tick (no toggle switches anywhere in this slice). A mono summary line (`text.format: text  temp: 1.00  tokens: 2048`) mirrors the same settings in the form. Evidence: 29, 30, 31, 32.
15. **Editor form rows.** Label column ~110 px (87 css) in `#4e4e4e` 14 css, value area to its right: Model (borderless value + chevron + tiny settings icon button), Variables and Tools as rows of 33 px (26 css) pill chips (`#ebebeb`, with x) followed by an outline "+ Add" pill; "System message" / "Prompt messages" are plain grey 14 css section labels with a small wand icon button at the right. The message area is a `#fafafa` block (770 x ~400 px, 1 px `#efefef` border, ~12 css radius, ~16 px inner padding) with a role caption ("User", 12 css semibold) inside. Config pane and chat pane split the panel ~50/50 at x=1090 with a 1 px divider. Evidence: 29, 23, 41, 37, 81.
16. **Modals.** White, radius ~18 px (14 css), no internal dividers, scrim = black at ~30% (pure white shows as `#b2b2b2`). Widths 570 / 634 / 660 px (449 / 499 / 520 css). Three archetypes: (a) confirm: left-aligned 18 css semibold title, 14 css `#474747` body, right-aligned [Cancel `#ececec`][Primary `#181818`] (75, 63); (b) destructive-save: [red Leave] left, [Cancel][Save and Leave] right (94); (c) icon-tile form: centred 64 px tile with arrow icon, title, grey subtitle, labelled input, full-width primary, x close top-right (51, 96). Result states are bare white cards: "Published!" with a green check-circle, "Publishing..." with a centred 20 px spinner (55, 98, 99). Large form modal: segmented control + labelled fields + Cancel/Add (39, 40); full-screen "Annotate" modal inset 25 px (20 css) from the viewport with a 3-column layout (89). Evidence: 51, 75, 94, 63, 39, 52, 55, 98, 89.
17. **Toasts, banners, popover consent.** Toast = top-centre, 311 x 54 px (245 x 43 css), solid `#3eae72`, white semibold label, small x, ~12 px (9 css) radius, overlapping the top bar (y 12-65). Inline alert = white, 1 px red outline, ~10 css radius, warning icon + red text + inline underlined link ("Generate one"), 838 x 67 px (660 x 53 css) (77). Consent prompt is a small popover anchored to the Good/Bad button: bold question, 12 css grey explanation, "Learn more" link left, Decline (ghost) and Allow (black) right (46); after acting, the choice is confirmed by a toast (47, 49). Evidence: 47, 49, 77, 46.
18. **Chat thread and composer.** No bubbles: role captions ("User", "Assistant", 12 css semibold, grey) over plain text; assistant markdown with bold lead-ins, 4 px grey bullets, 16 css section headings; footer row of ghost Good/Bad buttons, then a centred mono stats line (`23.9s  2,002t  695t`) and a `resp_...` ID + copy icon top-right. Composer = single card 779 x 149 px (613 x 117 css), 1 px `#ebebeb` border, ~34 px (~27 css) corner radius, soft shadow beneath; variable key/value rows are stacked inside the top of the same card (1 px separators, key as `#ececec` pill, value right of a colon); placeholder "Chat with your prompt..." `#a4a4a4`; bottom row: paperclip left, "Auto-clear" ghost button and a 44 px (35 css) black circular send button right; send turns into a black stop square while streaming (44, 84). Evidence: 29, 37, 45, 85, 86, 44, 84.
19. **Data grid (full-bleed).** Edge-to-edge, no panel inset. Header band 45 px (35 css) `#eeeeee`, no header borders, 14 css grey labels; rows on a 45.8 px (36 css) pitch with 1 px `#f1f1f1` row rules and `#f0f0f0` column rules, white cells, no zebra; two narrow trailing columns (expand icon, kebab); a "+ Add row" text row; toolbar in the header row: ghost "Upload / Export / Columns", soft-grey "Generate output" and "Grade" (disabled = lighter), black Save. Tabs under the title: "Data" (active = `#ececec` fill, rounded 8 css), "Trip v1", "+ Add prompt". Running cell shows plain "Running..." text and a floating "Ran 0 out of 1" pill at bottom centre. Evidence: 87, 88, 94.
20. **List table (Evaluation).** Page title + segmented control (Datasets | Evals: `#eee` track 177 x 40 px = 139 x 31 css, white active pill inside, radius ~8 css) and a black "+ Create" at top-right. Header row 36 px (28 css) `#f9f9f9`, 12 css grey labels, no borders; body rows borderless, 14 css: bold name, 26 px (20 css) `#eee` avatar circle with initial + author, long ID truncated with an ellipsis, date, trailing trash icon. Evidence: 95.
21. **Explainable-diff review (Optimize).** AI rewrite is shown inline: changed blocks tinted `#e5f3fe` with a tiny comment icon in the right margin (70); hover reveals a "Reasoning behind change:" popover (71); the "deleted" view shows `#ffd9d8` blocks and red-text reasoning notes behind a 2 px red left bar (72). A floating pill "Review changes +29 -33" (green/red counts) and a floating instruction input with a black "Optimize" button sit bottom-centre; the header holds Copy (soft grey, turns into a check when copied: 73) and Save (black). Evidence: 70, 71, 72, 73, 67-69.
22. **Versioning and history affordances.** Title + version pill (`v1 - default`) + "Set as default" pill; version menu lists versions with a green "default" tag and "+ New version"; changing a default shows a modal with current to new as two soft rounded rectangles joined by a down arrow (63, 54). The history panel (79) is a 508 px (400 css) right pane: uppercase 12 css date header, a dot-and-line timeline rail, time at left, entry text at right with ellipsis, and an "END OF 30-DAY HISTORY" footer. Evidence: 53, 54, 61, 63, 79.
23. **Transient and loading states.** Skeleton = 10 stacked rounded bars (~16 px high, `#e8e8e8` with a lighter `#f3f3f3` shimmer, varied widths) inside the final container (23); button spinner replaces the label while keeping the button size (16); top-bar breadcrumb text switches to "Loading..." with a 16 px spinner (47); title shows an inline spinner while a publish is in flight (55); three grey "thinking" dots under the Assistant caption (84); a small progress card with title + one-line subtext ("Optimizing prompt... Resolving conflicts; fixing format gaps.") (69); full-modal spinner (98). Evidence: 23, 16, 47, 84, 69, 98.
24. **Microcopy and tone.** Sentence case, short verbs (Create, Publish, Update, Leave, Allow); one-line helper text in grey; confirm modals explain consequences plainly ("Changes will affect all API calls using this prompt without a pinned version. You can always undo this change."; "You have unsaved changes in your dataset. If you leave now, they will be lost."); disabled actions say why in a sublabel ("Create Eval - Requires a grader"); empty states state what will appear, not what to do. Evidence: 63, 75, 94, 93, 24.
25. **Density and rhythm.** One consistent 8/12/16 css rhythm: 12 css gaps between nav items and chips, 16 css between form rows (Variables to Tools row pitch 59 px = 46 css), 20-24 css panel padding (content starts at x=304, 26 px = 20 css from the panel edge), 8-9 css canvas inset. Rows are 32 css (menus, nav), 36 css (tables), 52 css (auth inputs). Information density is high but air comes from line-height and hairline-only separation: no card shadows inside tables, no zebra, no heavy borders; elevation is reserved for floating layers (popover, modal, toast, composer). Evidence: 20, 29, 87, 95, 26.

## Rasikh mappings

| Rasikh screen / pattern | Reference screens in this slice | Why |
|---|---|---|
| Employer hires table (sortable, stage / days / blockers) | 95, 87, 88 | 95: borderless rows under a 36 px `#f9f9f9` header, avatar + name cell, truncated ID, trailing icon action, page-level segmented tabs and one black primary top-right. 87/88: denser variant with 36 css row pitch, hairline row and column rules, a kebab/expand action column and a toolbar of ghost buttons - copy the row height, header band and rule colours. |
| Hire detail page + timeline | 79, 53, 57, 29 | 79: dot-and-line timeline rail with time left, event right and an uppercase date header; 53/57: header recipe (back chevron, title, status pills, one primary) and label-left rows for fields. |
| Landlord application detail + plain-language risk summary | 70, 72, 71, 85, 86 | The Optimize diff shows every flagged span with a "Reasoning behind change" note, a comment marker and a net summary pill (+29 -33): the same explainable pattern as risk flag -> reason. 85/86 give the structured answer layout (bold lead-in bullets, summary heading, Good/Bad feedback, time/token footer). |
| Decision actions (approve / request info / offer terms) | 94, 75, 63, 54 | 94: three-button confirm with a red destructive left, grey cancel and black primary right; 75/63/54: consequence-first confirm copy and the current -> new state diagram (two soft rounded boxes and an arrow) for approving or changing terms. |
| Approval request card / consent prompt (newcomer app, agent feed) | 46, 47, 49 | Small anchored consent card: bold question, 12 css explanation, "Learn more" link, Decline (ghost) + Allow (black); outcome confirmed by a green toast - maps directly onto "needs your approval" items. |
| Trust passport (per-party field visibility) | 29, 31, 32, 39 | Closest available: label-left / control-right rows, selects with up-down chevron, square black checkbox, segmented "Latest / Deprecated" control, helper text under fields. No toggle switch exists in this slice, so the switch itself must come from another slice. |
| Roadmap / step progress with dependencies, add-hire flow | 13, 15, 17, 18, 3-12 | One decision per screen: 4-bar stepper (24 x 3 css, dark done / grey upcoming), centred 360 css column, icon tile + title + subtitle, full-width CTA and a tertiary skip link; option cards with radio state for choosing a plan/option; floating-label inputs for the micro-steps. |
| Document upload + AI extraction + confidence | 43, 44, 89, 87 | 43: attachment thumbnail with remove x inside the composer; 44: AI reading the upload while streaming; 89: row-by-row review layout (row list left, labelled fields with "Empty" placeholder centre, annotations pane right) and 87: grid of extracted fields - a base for field + confidence review. Confidence badges themselves are not in this slice. |
| Agent activity feed (did / waiting / needs approval) | 84, 85, 69, 79, 47 | State vocabulary: three-dot thinking, "Running...", progress card with title + subline (69), completed answer with stats footer (85), timeline rail (79) and toasts (47/49) for completions. |
| Language switcher / metrics row / mobile layout | none found | Not present in this slice (no language selector, no KPI cards, desktop only). Metrics cards and usage charts are in the sibling slice 200-279. |

## Gaps (so nobody searches this slice for them)

No dark theme; no charts; no mobile or narrow-width layouts; no toggle switches; no sortable-header affordance or pagination; no multi-select or bulk-action bar; no file-drop zone (only an in-composer attachment); no progress bar for long jobs (only spinners/skeleton); no avatar menu opened; hover states appear only as tooltips (82, 71).
