# Measure: Controls (buttons, inputs, menus, dialogs)

Topic key: `controls`. Packs: OpenAI Platform web Apr 2026 (indices 0-416) and ChatGPT web Mar 2026 (0-244).
Everything below is CSS px unless it says "screenshot px". `[idx]` = screen index in that pack.
Scratch scripts and crops live outside the repo (`.../scratchpad/controls/`); nothing under `.reference` was modified.

## 1. Scale and crop (verified)

- Crop: bottom 120 px (Mobbin bar) removed before every measurement. Viewport = 1920x1205 (Platform) / 1920x1200 (ChatGPT).
- **Assumed scale: 1.27 screenshot px per CSS px** (1920 / 1512, i.e. a ~1512-px-wide laptop viewport resized to 1920).
- Verification done in this pass (all from pixels):
  - ChatGPT sidebar: border column at x=329, so 330 px = 260 css (a known layout constant). ChatGPT header 66 px = 52 css, composer 73 px = 57 css.
  - ChatGPT modal widths 568 / 650 / 730 px = 447 / 512 / 575 css (Tailwind max-w-md / lg / xl = 448 / 512 / 576).
  - Platform modal widths (white span between scrim): 570 / 634 / 660 / 762 / 888 / 964 px (+2 px border) = 450 / 500 / 520 / 600 / 700 / 760 css. All round numbers; 1.25 and 1.333 give non-round values (458/508/528/610/710/771 and 429/475/495/572/666/723).
  - Sub-pixel fit of ~25 flat-filled buttons gives heights of exactly 32.0, 28.0, 34.0, 42.0, 52.0 css, which is only possible at 1.27.
- Slice 280-359 survey assumed 1.333; that is rejected here (its "30 css" buttons are really 32 css at 1.27).

## 2. Method and bias notes

- Flat fills (buttons, chips, toggles, tooltips): flood fill of the fill colour, then **sub-pixel edge fit** (alpha coverage on the edges, rounded-rect corner fit). Accuracy about +/-0.2 css px for size and +/-0.5 css px for radius.
- Bordered controls (inputs, outline buttons, popovers): border-line centroids give the outer box to +/-0.1 px. Border colour is estimated from the line integral assuming a 1 css px (1.27 px) stroke. **The screenshots are sharpened and clipped at white, so integral-derived stroke colours are biased slightly dark** (true grey borders are probably 3-8 levels lighter than reported; thin red/blue strokes are biased darker/more saturated). Flat-fill colours are exact.
- Text colours use the darkest AA pixels of the glyph run (a lower bound on lightness for thin text). Font sizes come from cap heights (cap ratio 0.72) and were consistent with 12 / 14 / 16 / 18 css. Weights come from stem integrals (stem/em: body 0.08-0.09, button labels 0.10, titles 0.11): estimated, treated as 400 / 500 / 600.
- Scrimmed screens (modals): scrim fill is applied over the page, not over the modal. Platform scrim = black at 30% (white -> #b2b2b2, #f3f3f3 -> #aaaaaa). ChatGPT scrim = black at ~6% plus a strong blur (white -> #f0f0f0).
- "measured" below means 4+ screens (or one sub-pixel fit repeated on 4+ instances); "estimated" means fewer screens or a colour/shadow inferred from thin strokes.

## 3. Buttons

### 3.1 Platform (dashboard model)

| size | height | radius | padding-x | label | where |
|---|---|---|---|---|---|
| xs | 24 | 6 | ~9 | 13/500 | "+ Files", gear, "+ Functions" [194, 199] (estimated, 2 screens) |
| sm | 28 | 6 | ~9 | 14/500 | data-grid toolbar Save / Generate output [87, 88, 94]; sidebar "Go to Billing" pill (28, full radius) [19, 101, 181, 193] |
| md (default) | **32.0** | **8 (7.7-8.1)** | **12** | 14/500 (cap 13 px) | modal footers, page-header actions, table toolbars [94, 111, 193, 225, 245, 260, 271, 328, 358, 385, 383, 342, 139, 140] |
| lg | 36 | 8 | 12 | 14/500 | "Finish account setup"-type CTA [181] (estimated) |
| pill-xl | 40 | full | ~16 | 14/500 | hero "+ Create" [19, 20, 101, 141; dark 318] |
| cta | 48 | full | full width (360) | 16/600 | onboarding "Create organization", "Purchase credits" [13, 15, 17, 18] |
| auth | 52 (66 px) | full | full width (340) | 16/400 | Continue / social buttons [2-12, 404-416] |

- Icon + label: 16 css icon, ink-to-ink gap to the label ~10 css (icon box to label ~8 css, so `gap: 8px`); left padding to icon box 12 css. Icon-only: 32 css tall, 32-42 wide, radius 8 [199: 42x32; 29: 32x26 sliders]; xs icon-only 32x24.
- Widths are content-driven; paired footer buttons sit **8 css apart** (Cancel right edge to Save left edge = 10.3 px) and are right-aligned.
- Fills: primary `#181818` (app) / `#141414` (auth pills) with white label; secondary `#ececec`, no border, black label; destructive `#e12e2a` (fits #e12e2a / #e22d2a / #df2f2a), white label; outline = white, 1 css border est. `#d6d6d6`, same 32 css box [245 Back: 55.6x32, r 7.5]; auth outline pill border est. `#d9d9d9` [4].
- Ghost = no fill; label `#0d0d0d` (primary action) or `#494949` (quiet). **Ghost hover fill `#ececec`, full-pill, 32 css** [82, one screen].
- Dark theme [318, 319]: primary `#f3f3f3` with dark label, same sizes (pill-xl 40.0, editor "Publish" pill 32.0).

### 3.2 ChatGPT (newcomer-app model)

| size | height | radius | padding-x | label | where |
|---|---|---|---|---|---|
| sm | ~28 (outline "Upgrade" fits 28-30 incl. 1px border + shadow) | full | ~12 | 14/500 | sidebar footer [22, 26, 75] (estimated) |
| md primary | **34.0** | full | **12** | 14/500 (cap 13 px) | Save, Submit, Update, Send, Delete [98, 66, 44, 203, 224, 109, 150, 217, 78] |
| md outline | **36 (incl. 1px border)** | full | 12 (+1 border) | 14/500 | Cancel, Stop [98, 44, 78, 219, 216] |
| lg | **42.0** | full | full width (318-365) | 16/500 | onboarding Next / Continue, pricing CTAs [13, 81, 131] |
| auth | **52.0** | full | full width (340) | 16/500 | Continue, social, one-time code [2, 10, 232-234] |
| icon-only | 36x36 | 8 (rows) / full (disc) | n/a | n/a | header "...", "+" disc [26, 44, 75, 80] |

- Primary and outline sit side by side centred on one axis, so the outline pill (36) is 2 css taller than the black pill (34).
- Fills: primary `#0e0e0e` (dialogs/onboarding; samples #0d0d0d-#0f0f0f) or `#131313` (auth); outline white with border est. `#d6d6d6` (samples #cecece-#d9d9d9); destructive `#e12e2a` (66x34 pill) [78]; disabled `#c4c4c4` fill with white label [65, 100, 216, 219, 97]; **single accent CTA** `#605eea` indigo 300x42 ("Upgrade to Plus") plus soft "Get Plus" pill `#f2f0fc` [81, 22].
- Text-only tertiary ("Skip", "Skip Tour"): 16 css `#000`/muted, no box.

### 3.3 Button states (deltas)

| state | Platform | ChatGPT |
|---|---|---|
| primary rest | `#181818` | `#0e0e0e` / `#131313` |
| primary hover | **`#323232`** (+26) direct [251]; scrim-corrected `#303030` on "Add member / Create" buttons that just opened a modal [345-347, 351, 352, 359, 360, 363-365] | **`#2d2d2d`** (+30) [235, 243] (hover / pressed / submitting, cannot be separated) |
| pressed | **`#5d5d5d`** fill, white label, on primary "Create" [301, 302] and secondary "Cancel" / "View usage" [247, 330, 384]; interpretation as mouse-down is inferred | not captured |
| ghost / icon hover | `#ececec` fill [82] | `#eeeeee` (36 css, r 8) [75, 80]; pressed disc `#f5f5f5` [26]; sidebar row `#e8e8e8` / `#f0f0f0` |
| disabled | neutral or destructive submit: **`#f1f1f1`-`#f3f3f3` fill, label ~`#8c8c8c`**, same size, no opacity trick [96, 292, 139]; ghost: label `#808080`, no fill [29 Evaluate, 94 Grade]; editor pill `#e2e2e2` / `#858585` [133, 106, 137, 138] | `#c4c4c4` fill, white label [65, 100, 216, 219] |
| destructive | `#e12e2a`, gated by a checkbox ("I want to delete this workflow"); disabled version is the grey above [139, 140] | `#e12e2a` pill, no gate [78] |
| loading | label replaced by 16 px spinner, size kept [16] | n/a |
| focus-visible ring | **none visible in any capture** | none |

## 4. Inputs

### 4.1 Platform

| variant | height | radius | border | padding-x | text | where |
|---|---|---|---|---|---|---|
| sm | 28.0 | 7.5-8 | 1px est. `#d6d6d6` | 12 | 14 | wizard form [245] (select r 5.9) |
| **md (default)** | **32.0** | **7.5-8** | 1px est. `#d5d5d5` (samples #d0-#dc) | **12** | 14/400 | [199, 301, 344, 374, 292] width fills column (340 settings, 272 side rail, 560 modal) |
| lg | 36.0 | 7.9 | same | 12 | 14 | modal fields and property rows [111] |
| xl | 40.0 | 9.4-10 | same | 12-16 | 14 | invite modal selects [345], publish-name input [96] |
| onboarding | 44.0 | ~11.4-12 | same | 16 | ~15-16 | org name + role select, width 360 [13, 14, 15, 17] |
| auth pill | 52.0 (66 px) | full | 1px est. `#d4d4d4` | ~21 | 16 | width 340 [2-12, 404-416] |
| filled (node config) | 28.0 | 7.5 | none | 12 | 14 | fill `#e9e9e9` [107] |

- Colours: bg `#ffffff`; placeholder / disabled value `#808080` (darkest AA px #797979-#7d7d7d); value `#0f0f0f`; label 14/21 weight 500 `#0d0d0d` above the field; helper 12 css `#535353` (darkest #454545), sits between label and input; optional marker is grey "Optional" text, not an asterisk.
- **Focus**: in-app inputs darken the border to ~`#6c6c6c` (1 css, no ring, no offset) [96]; rich editor (variable autocomplete) 2 css `#7f7f7f` [292]; open select trigger border ~`#b9b9b9` [14]; row-style select trigger (borderless) takes `#f5f5f5` fill, 32 css, r 8 [26]. Auth pills: border recolours to blue (est. `#3d60d7`, 1 css), floating label turns the same blue [4, 412].
- **Error (in-app)**: helper text 12 css `#9f362a` (darkest px) under the field; **border does not change** [301, 245]. Error toast pairs with inline messages [245]. Auth: 1 css red stroke + red floating label + 16 px red alert disc (`#ce101e`) + 12 css message [407; same as ChatGPT 234].
- **Disabled**: border unchanged, value text `#808080`, background stays white [344 email field]. No fill change, no cursor info.
- Floating label (auth only): at rest the label is placeholder-sized (16 css, `#a4a4a4`) inside the pill; on focus or value it moves onto the top border as a 14 css label with a ~5 css white notch each side. In-app uses a top label.
- Textarea: 272x112 (side rail) and 660x386 (modal), same border and r 7.5, fill white; filled variant `#e9e9e9` r 6 [199, 198, 107]. Corner expand icon bottom-right, "generate" wand icon at the label row's right.
- Search field: 250x32, r 8, 16 px magnifier at left, placeholder grey [345]; picker search 288x32 inside popover [26]; filter pills 27-28 css high with 1px border and full radius [249].
- Select trigger: same box as md input, up/down chevron pair 16 css, 12 css from the right edge.

### 4.2 ChatGPT

| variant | height | radius | border | padding-x | text | where |
|---|---|---|---|---|---|---|
| dialog input | **38.0** | **5.5-6** | 1px est. `#d6d6d6` (#d1-#d9) | 16 | 14 | [216, 217, 219, 65] widths 400-545 |
| search pill | 38.0 | full | est. `#e6e6e6` | ~16 + icon | 16 | 256 wide [120] |
| textarea | 118 (480 wide) | 7.5 | est. `#e1e1e1` | 16 | 16 | [98] counter "158/1500" 12 css below-left |
| chips (single select) | 38.0 | full | est. `#e5e5e5`; selected = solid `#0f0f0f` + white | 16 | 14 | [65] 12 css gaps |
| auth pill | 52.0 | full | est. `#d2d2d2` | ~21 | 16 | width 340, notched floating label 14 css [1-5, 232-234] |
| composer | 57 | full | `#ddd` + soft shadow | 16 | 16 | out of scope here |

- Placeholder `#8f8f8f` (lighter than Platform); helper 12 css `#818181`; label 14 css (dialog) / "Use phone" underlined link at the right of the label row [219].
- **Focus** (auth): border becomes dark indigo (core px `#506086`, est. 1 css `#34548e`), floating label `#44527d`; birthday segmented field uses the same [10, 232]. **Error** (auth): 1 css red stroke, red label, 16 px red alert disc (`#c70f11`), 12 css message "Incorrect email address or password" [234]. No error styling exists for dialog inputs in this pack; disabled input not captured.
- Multi-segment select inside one pill (Feb | 26 | 2026): segment separators 1 css `#d4d4d4`, chevron-down per segment [10].

## 5. Selection controls

| control | Platform | ChatGPT |
|---|---|---|
| switch | **32 x 19** track, knob 13 (inset 3), off `#e0e0e0`, on `#181818`, disabled-off `#efefef` + grey label [107, 108, 126 on; 199, 111 off] | **32 x 20**, knob 16 (inset 2), off `#e3e3e3`, on `#0487ff` (accent blue), dark-theme off `#686868` [98, 99, 182] |
| checkbox | 18 x 18, r 4, rest border est. `#c9c9c9`, checked `#181818` + white tick [29, 139, 140, 242] | not captured |
| radio | 16 x 16, ring est. `#d5d5d5`; selected = `#161616` disc with white centre dot (~7) [301, 251] | 16 x 16, ring est. `#828282` (darker), selected = black dot ~8 inside the ring [100, 219, 221]; rows on a 36 pitch |
| segmented | track 32 `#eeeeee` (hairline `#e8e8e8`), r ~8-10, padding 2, active segment white 28 high r ~6 with hairline + faint shadow; text 14/500, active `#000`, inactive `#454545` [111, 95, 249, 251] | track **40** `#ececec`, padding ~4, active segment white **32** full-pill with soft shadow, inactive `#818181` [81, 44] |
| filter / tab pills | chips 26 high full pill `#ebebeb` with x [29, 94] | active pill `#f3f3f3` 88x40 full radius, inactive plain text [120] |
| option cards (radio cards) | 358x43, 1px `#eee`; selected 2px black + filled black disc [18] | not captured |

- Toggle row anatomy (both): 14 css label left, optional 12 css grey helper below, switch right-aligned, hairline between rows. ChatGPT settings rows: pitch 60 css (76 px), value-plus-chevron selects ("Dark v") borderless at the right [182, 189]. Platform tools list: 36 css pitch with info icon after label [199].
- kbd chip (Platform only): 33 x 18, r ~4, fill `#313131` on a `#181818` button, white 12 css glyphs ("cmd" + "return") [199].

## 6. Menus, popovers, tooltip

| item | Platform | ChatGPT |
|---|---|---|
| surface | white, 1px hairline est. `#dadada`-`#e4e4e4` + soft shadow, radius **~10** (menu) / ~12 (picker, params) | white, 1px est. `#d4d4d4`, radius **~16** (menus), ~12-16 (listbox) |
| padding / row | padding ~6, **row 32**, item px 8, icon 16 + label 14; two-line option 51 (name + 12 css grey description) [26, 133] | padding ~6, **row 36** (pitch 45.7 px), icon 16 + label 14 (cap 13 px); two-line row ~50 (model switcher) [75, 80, 26] |
| hover / selected row | `#ececec`, r ~6-8, inset 6 [14, 26] | `#f0f0f0`, r 6, inset 6; listbox row 39 high [10] |
| selected marker | leading check at the left (text indented ~28) [26, 163] | trailing check at the right [80, 141, 189] |
| width vs trigger | select list = **trigger width** (360) and sits 6-8 below it [14]; combobox picker fixed **300** (trigger 470) and left-aligned slightly outside the trigger [26]; action menu 239 (content width) [133]; params popover 300 [29] | listbox = **trigger segment width** (113) [10]; menus are content width (198, 230); language list 220 wide, max-height = viewport minus ~10 (926) [189] |
| max-height | model picker ~400 with internal scroll (rows clip under the bottom edge) [26] | viewport-bound scroll [189] |
| group heads | 12 css uppercase letter-spaced grey ("GPT-4.1", "REASONING"); `#4a4a4a` darkest px [26] | none |
| destructive row | red label + icon (`#e55757`) [133] | red label + icon `#c53730` [75] |
| shadow (est.) | ~0 8px 24px rgba(0,0,0,.12) (falloff ~16 css below, ~11 css right) | ~0 8px 30px rgba(0,0,0,.08), listbox falloff ~22 css [10] |
| tooltip | bg **`#313131`**, white 13 css, height **25**, padding-x 8, r 8, soft shadow, ~6 css above target [82] | **not captured** |

## 7. Modal dialog

| property | Platform | ChatGPT |
|---|---|---|
| widths | **450** confirm, **500** icon-tile / publish, **520** upload, **600** form (tall, internal scroll), **700** editor, **760** schema [94, 51, 127, 301, 198, 111] | **448** confirm / small, **512** form, **576** feedback / share, ~680 settings (two-pane) [78, 98, 65, 182] |
| radius | **12** (11.2-12.4, 15.25 px fit) | **16** (15.4-16.1, 20 px) |
| padding | 20 sides and top; bottom ~17 (footer button bottom to edge) | **16** all round; footer button bottom to edge 16 |
| title | 18/600 `#0d0d0d`, ink top 21 css from edge | 18 / 400-500, ink top 18 css from edge |
| rhythm | title -> body 15.7 ink gap, body line pitch 21, body -> buttons 21 css | title -> body 29, body -> buttons 19 css |
| header / footer rules | none on small dialogs; tall forms (292, 301) add 1px `#ececec` rules under header and above footer | rule under header only on tall flows [216, 217, 182] |
| footer | right-aligned, gap 8; tertiary link or destructive button left (94: red Leave left; 301: "Learn about ..." link left) | right-aligned, gap ~8; Cancel (outline) + primary pill |
| close | 16 css x glyph (~9 ink), centre 36 css from right edge and 28 css from top (icon-tile forms only; confirm dialogs have none) [96, 139] | 20 css x (glyph ~11), centre 27 css from right and top [65, 100, 219] |
| scrim | black 30%, covers sidebar and top bar | black ~6% + heavy blur |
| shadow (est.) | ~0 8px 24px rgba(0,0,0,.14), none above the top edge | very soft, 1px border est. `#ccc` |
| result / loading | bare white card, 24 css green check or 20 px spinner [55, 98] | n/a |

## 8. Dark theme (Platform, light touch)

Shell `#131313`, card `#212121`; popover / selected row `#303030` [318]; segmented track `#0d0d0d` with active segment `#303030` (inverted) [318]; chip `#3d3d3d` [318]; primary `#f3f3f3` + dark label [318, 319]. ChatGPT dark [182]: modal `#212121` (nav pane `#1e1e1e`), selected row `#363636`, secondary pill `#2f2f2f` (74x36), switch off `#686868` with white knob, row hairline ~`#414141`. Only 1-2 screens each: estimated.

## 9. Evidence screens

Platform: 2-4, 13-15, 17-21, 26, 29, 82, 87, 88, 94-96, 101, 107, 108, 111, 126, 133, 139-141, 181, 193, 194, 198, 199, 225, 242, 245, 247, 249, 251, 260, 271, 292, 301, 305, 318, 319, 328, 330, 344-347, 358, 361, 365, 374, 383-385, 405-407, 412.
ChatGPT: 0-4, 10, 13, 22, 26, 44, 65, 66, 75, 78, 80, 81, 84, 97-100, 109, 120, 131, 150, 182, 189, 203, 216, 217, 219-221, 224, 225, 232-235, 243.

## 10. Where the two packs differ

| topic | Platform | ChatGPT | Rasikh uses |
|---|---|---|---|
| button shape | rounded rect r 8 (pills only for hero / CTA / auth) | pills everywhere | Platform in dashboards, ChatGPT pills in the mobile app |
| default button height | 32 | 34 primary / 36 outline | 32 (dashboard), 44 touch minimum (app, see 11) |
| input radius / height | 8 / 32 | 6 / 38 (dialogs), full / 52 (auth) | 8 / 32 dashboards; 52 pill auth; 48 mobile fields |
| focus | grey-dark border (1px) / blue on auth | indigo on auth | add real focus-visible ring (deviation) |
| error | red helper text only | red stroke + icon (auth only) | red helper text + 1px red border + icon everywhere |
| switch on | `#181818` | `#0487ff` | near-black dashboards; brand accent in newcomer app |
| menu radius / row | 10 / 32 | 16 / 36 | follow surface |
| modal radius / padding | 12 / 20 | 16 / 16 | follow surface |
| disabled | `#f1f1f1` + grey text | `#c4c4c4` + white text | `#f1f1f1` family (ChatGPT's white-on-grey fails contrast) |

## 11. Rasikh adoption

- Dashboards (employer / landlord / bank): take the Platform column verbatim: 32 css controls, 8 css radius, `#181818` primary (or the Rasikh ink), `#ececec` secondary, `#d6d6d6` 1px borders, 12 css padding, 14 css type, 12 css helper, 8 css button gaps, 12 css modal radius with 20 css padding, 30% scrim.
- Newcomer app (mobile): ChatGPT shapes (full-pill buttons, 16 css modal radius, 36-39 css menu rows) scaled for touch: buttons min 44 (52 for the primary step CTA), fields 48-52 pill or 12 css-radius rect, switch visual 32x20 with a 44x44 hit area, radio / checkbox visual 16-18 with 44 hit area.
- One accent: Rasikh needs a single brand accent. Use it for (a) the newcomer-app switch ON, (b) the main CTA on the approval card, (c) focus ring and links. Keep dashboards monochrome with near-black primary, as both packs do (ChatGPT spends its only colour on the Plus upsell).
- Trust passport: use the ChatGPT toggle row (14 css label + 12 css helper + 32x20 switch, 60 css row pitch with hairlines) and the Platform segmented control (32 css track, 28 css active) for three-state visibility.
- Decision actions (approve / request info / offer terms): Platform confirm-modal pattern: red destructive button left, Cancel + primary right, 8 css gap; gate irreversible actions with the "I want to ..." checkbox.
- Add a visible `:focus-visible` ring (2px accent with 2px white offset). Neither pack shows one; this is a deliberate accessibility deviation.
- RTL: mirror by logical properties (`padding-inline`, `inset-inline-end`). Move the select chevron and the selected check to the opposite side, flip the leading-icon side, keep numerals and `kbd` glyphs LTR. Both packs are LTR only, so all RTL values are derived.
- Loading: keep button size and swap the label for a 16 px spinner (Platform 16). Disabled buttons stay full size and say why in nearby helper text.

## 12. Open questions and gaps

- No hover state for secondary or destructive buttons, outline hover, input hover, or menu-row hover other than the screens cited. No keyboard focus ring anywhere.
- ChatGPT has no tooltip, kbd chip, checkbox, disabled input or in-app (non-auth) input error; Platform has no dark-theme control screens beyond 318-322.
- `#5d5d5d` "pressed" interpretation is inferred from five screens where the pointer just clicked the button; it could be a transition frame.
- Shadows, popover radii (~10 vs ~12) and border colours are estimates (sharpened screenshots). Weights are inferred from stem width, not read from font files.
- Platform xs (24), lg (36) and ChatGPT sm (28) buttons are covered by fewer than 4 screens.
- Font family is not measurable (neutral grotesque plus mono); Rasikh must pick its own.

## 13. Ready-to-paste CSS (61 lines)

Adopts the Platform column by default and the ChatGPT column under `data-surface="app"`. The red invalid border, the accent switch-on in the app and the accent focus ring are deliberate Rasikh deviations (see section 11).

```css
/* Rasikh controls v1 - measured from OpenAI Platform (dashboard) + ChatGPT (app). 1 css px = 1.27 screenshot px */
:root{
  --ink:#181818; --ink-hover:#323232; --ink-pressed:#5d5d5d; --on-ink:#fff;
  --fill-2:#ececec; --fill-off:#f1f1f1; --text-off:#8c8c8c;
  --text:#0d0d0d; --text-2:#454545; --text-3:#808080;
  --line:#d6d6d6; --line-focus:#6c6c6c; --hairline:#ececec;
  --danger:#e12e2a; --error-text:#9f362a; --link:#4b64bb;
  --accent:#2f6f5e;                /* Rasikh brand accent (placeholder): focus ring, links, app switch-on */
  --h-sm:28px; --h-md:32px; --h-lg:36px; --h-field:32px;
  --r-ctl:8px; --r-field:8px; --r-pop:10px; --r-modal:12px; --pad-modal:20px;
  --scrim:rgb(0 0 0/.30); --shadow-pop:0 8px 24px rgb(0 0 0/.12);
}
[data-surface="app"]{              /* newcomer app: ChatGPT shapes */
  --ink:#0e0e0e; --ink-hover:#2d2d2d; --fill-off:#c4c4c4; --text-off:#fff;
  --h-md:34px; --h-lg:42px; --h-field:38px;
  --r-ctl:9999px; --r-field:6px; --r-pop:16px; --r-modal:16px; --pad-modal:16px;
  --scrim:rgb(0 0 0/.06);
}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:var(--h-md);
  padding-inline:12px;border:0;border-radius:var(--r-ctl);background:var(--ink);color:var(--on-ink);
  font:500 14px/1 var(--font-sans);cursor:pointer}
.btn:hover{background:var(--ink-hover)}
.btn:active{background:var(--ink-pressed)}
.btn--secondary{background:var(--fill-2);color:#000}
.btn--outline{background:#fff;color:var(--text);box-shadow:inset 0 0 0 1px var(--line)}
.btn--ghost{background:transparent;color:var(--text)}
.btn--ghost:hover{background:var(--fill-2)}
.btn--danger{background:var(--danger);color:#fff}
.btn--sm{height:var(--h-sm);padding-inline:9px;border-radius:6px}
.btn--lg{height:var(--h-lg)}
.btn--cta{height:48px;width:100%;border-radius:9999px;font-size:16px;font-weight:600}
.btn:disabled{background:var(--fill-off);color:var(--text-off);box-shadow:none;cursor:not-allowed}
:is(.btn,.field,.switch,.segmented button):focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.field{height:var(--h-field);width:100%;padding-inline:12px;border:1px solid var(--line);
  border-radius:var(--r-field);background:#fff;color:var(--text);font:400 14px/1.5 var(--font-sans)}
.field::placeholder{color:var(--text-3)}
.field:focus{border-color:var(--line-focus)}
.field[aria-invalid="true"]{border-color:var(--danger)}
.field:disabled{color:var(--text-3)}
.field-label{font:500 14px/21px var(--font-sans);color:var(--text)}
.field-help{font-size:12px;line-height:18px;color:var(--text-2)}
.field-error{font-size:12px;line-height:18px;color:var(--error-text)}
.switch{position:relative;width:32px;height:19px;border:0;border-radius:9999px;background:#e0e0e0}
.switch::after{content:"";position:absolute;top:3px;inset-inline-start:3px;width:13px;height:13px;
  border-radius:50%;background:#fff;transition:transform .15s}
.switch[aria-checked="true"]{background:var(--ink)}
.switch[aria-checked="true"]::after{transform:translateX(13px)}
[dir="rtl"] .switch[aria-checked="true"]::after{transform:translateX(-13px)}
[data-surface="app"] .switch{height:20px}
[data-surface="app"] .switch::after{top:2px;inset-inline-start:2px;width:16px;height:16px}
[data-surface="app"] .switch[aria-checked="true"]{background:var(--accent)}
.segmented{display:inline-flex;height:32px;padding:2px;border-radius:8px;background:#eee;color:var(--text-2)}
.segmented button{padding-inline:12px;border:0;border-radius:6px;background:none;font:500 14px/1 var(--font-sans)}
.segmented [aria-selected="true"]{background:#fff;color:#000;box-shadow:0 0 0 1px #e3e3e3,0 1px 2px rgb(0 0 0/.08)}
.menu{padding:6px;border:1px solid #dadada;border-radius:var(--r-pop);background:#fff;box-shadow:var(--shadow-pop)}
.menu-item{display:flex;align-items:center;gap:8px;height:32px;padding-inline:8px;border-radius:6px}
.menu-item:hover{background:var(--fill-2)}
.modal{width:min(450px,calc(100vw - 32px));padding:var(--pad-modal);border-radius:var(--r-modal);
  background:#fff;box-shadow:var(--shadow-pop)}
.scrim{position:fixed;inset:0;background:var(--scrim)}
.tooltip{height:25px;padding-inline:8px;border-radius:8px;background:#313131;color:#fff;font-size:13px;line-height:25px}
```
