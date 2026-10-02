# Verify: colour system, dark theme (key: color-dark)

Independent re-measurement of `measure-color-dark.md` (90 token entries, 13 rules). Method: PIL/numpy on the raw PNGs with the Mobbin bar cropped (Platform y<1205, ChatGPT y<1200). Hex values are scale-independent; lengths use 1 CSS px = 1.27 raw px.

## 0. Result

- 90 entries checked: 63 confirmed, 9 corrected, 18 cannot_verify (hover x2, and the derived status, destructive, focus, accent-link and toast tokens that no dark screen shows).
- Nothing that was marked `measured` was refuted. Every flat-fill surface (shell, content, raised, selected, inset, canvas, sidebar, composer, bubble) reproduces to the exact hex.
- Corrections are all in thin or tiny elements: Platform chart dashed line, blue tile, node outline, "strong" border tier, ChatGPT disabled send arrow, status.info.fg, backdrop blur, and the card and modal shadows.
- Rule 9 (signal colours keep their hex across themes) is wrong for red and green text. Rule 7 (2 px backdrop blur) is wrong; the blur is about 1 px.

## 1. Coverage limit (important)

A pixel scan of all 662 screens (my own, not reused) finds exactly the same dark screens as the measurer: Platform 318-322, ChatGPT 182-187, plus the partial dark elements in c139 (terminal) and p239/p240 (preview panel). Everything else dark is a black light-theme button, an image, or the 30-35% light scrim. So "different screens" do not exist for almost all dark tokens. I re-sampled **different elements, regions and edges on those screens** instead, plus the light twins (p329/p309, c128 for the same Codex rows, c238, c211).

Consequence worth knowing: "ceiling repeats on 4 screens" is **not** independent evidence. The same string at the same position renders pixel-identically in every capture (for example `API Docs` and the `Create` group label read the same value on 318/320/321/322 because they are one glyph render). Text confidence therefore rests on the number of distinct strings, not distinct screens.

## 2. Scale (the open question)

- Platform: the selected nav pill is **40.65 raw px tall on all four screens** (fractional-coverage integral, 318/320/321/322), which is 32.0 CSS px at 1.27 (30.5 at 1.333). 32 px = h-8, so **1.27 holds for Platform**. The sidebar is 278 raw = 219 CSS; the content card is inset 11.5 raw right and 12 raw bottom = 9.0 and 9.4 CSS; top 70 raw = 55 CSS.
- ChatGPT: send circle is 45.7 raw tall = 36.0 CSS (1.27 confirmed independently of the sidebar).

## 3. Corrections

| token | claimed | remeasured | basis |
|---|---|---|---|
| platform color.border.strong | `#5d5d5d` tier | no distinct tier: 12 outline edges (318 pill, 322 date pill, 320 Model/Voice/Response selects, textarea) peak `#4b`-`#5b`, integrated `#53`-`#5f`, mean peak `#545454`, mean integrated `#595959`. `#5d5d5d` is one edge. | edge profiles |
| platform color.border.node | `#474747` | integrated `#484848`-`#505050` (mean `#4b4b4b`), peaks only `#3b`-`#44` | 319, 4 edges |
| platform color.chart.grid.dashed | `#888888` | `#7b7b7b` (dash row 271 reads 112-120, row 272 63; integrated `#797979`-`#7d7d7d`). `#888888` is the single brightest pixel. | 322 |
| platform color.icon.tile.blue | `#0086ff` | `#0586ff` (median of 853 px per tile, both tiles) | 318 |
| chatgpt color.button.primary.disabled | bg `#4d4d4d`, arrow `#555555` | circle `#4d4d4d`-`#4f4f4f` (ok) but the arrow is **darker** than the circle: min `#292929`, stem `#343434`. `#555555` was the circle rim. | 185 |
| chatgpt color.scrim.blur | `blur(2px)` | **blur(1px)**: fit B = 0.5 * gaussian(A, sigma) between 183 and 182 over six regions gives sigma 1.2-1.3 raw = 0.94-1.02 CSS (residual min 1.2-2.2 levels; sigma 2 CSS would be 2.5 raw, residual 6-8). Scrim alpha fits 0.494-0.508. | 183 vs 182 |
| both color.status.info.fg | `#96d0fc` | `#9dceff` (modal of the unread-dot plateau; `#96d0fc` is 2 of 71 px) | 184 |
| both elevation.card | `0 4px 12px rgba(0,0,0,0.20)` | below-edge darkening is only -3 levels (9%) and gone by 11 raw px (8.7 CSS), on Platform cards (318) and the ChatGPT composer (183): about `0 2px 8px rgba(0,0,0,0.12)` | 318, 320, 183 |
| both elevation.modal | none or `0 12px 40px 0.35` | a soft, **bottom-only** shadow exists: -3 levels on a scrimmed 16 (19%) at the bottom edge, fading in about 20 raw px; nothing above or left. A 40 px blur would reach 60+ raw px. About `0 4px 16px rgba(0,0,0,0.2)`. | 182 |

Confirmed with a caveat worth carrying into the code:

- **Hairline values are peak, not integrated.** Integrated at 1.27 raw per CSS px: Platform card outlines `#393939` (peak `#383838`), dividers `#3e3e3e` (peak `#3c3c3c`), input outlines `#595959` (peak `#545454`), ChatGPT row hairlines `#2c2c2c` (matches), ChatGPT header `#424242` (matches), ChatGPT rule line `#3d`-`#41` (peak `#464646`). Differences are 2-4 levels; the claims hold on a peak basis.
- **Text values are class ceilings of thin glyphs** (lower bounds). Same-class strings differ by up to 10 levels purely from glyph shape (sidebar labels `Create` `#9e`, `Manage` `#a2`-`#a8`, `Optimize` `#a1`-`#a8`). Medians: Platform tertiary `#a1a1a1` (claim `#9e9e9e`, the lowest string), secondary `#c5c5c5` with max `#c9c9c9` (and `Realtime` on the `#0d0d0d` track `#cfcfcf`), ChatGPT secondary median `#c7c7c7`, max `#cccccc`. Treat tertiary/secondary as +/-6, as the measurer said.
- Platform `button.primary.fg` and ChatGPT `button.primary.fg`: darkest pixels read 0 (many at exactly 0 inside the 3 px voice bars on ChatGPT; Platform 2.5 px pause bars have cores 6-13). True value is `#000000`-`#0d0d0d`; keep `#000000`.

## 4. Rule issues

1. **Rule 9 / evidence "same hex as light"**: green and red text do not keep their hex. Same glyphs, ChatGPT Codex diff counts, light c128 vs dark c187: green extreme pixels `#0b8a3a`-`#21803d` -> `#0fa24c`-`#19994d` (G about +20), red `#8c3736`-`#ac3231` -> `#b64647`-`#c9393b` (R about +25). The blue tile is the only signal that stays (`#0385ff` vs `#0586ff`). Lift red and green for dark.
2. **Rule 7**: the blur is about 1 px, not 2 px. The panel edge is `#2a2a2a` only on top (+9); right and bottom are `#242424` (+3).
3. **Rule 4 ("one step above its parent")**: the selected fills are not one step: ChatGPT sidebar `#242424` on `#181818` is +12, ChatGPT modal pill `#363636` on `#1e1e1e` is +24, Platform `#303030` on `#131313` is +29 (it equals the raised level and sits above the `#212121` content card).
4. **Rule 12 (hover +9, half a step)**: no hover exists in any dark screen, so the number is unsupported. Platform light hover (`#ececec`) shows only on white menu rows, not on the shell.
5. **Rule 13**: `#6c6c6c` is 3.07:1 only on `#212121`; on `#303030` raised surfaces it is 2.51:1 and fails 3:1.
6. **Rule 5**: Platform cards and dividers measure 11% and 13% white over `#212121` (integrated), not 10-11%. Other percentages (5%, 15%, 24%) hold.
7. **Rule 6**: the +6 edge is present on the audio composer (3 of 3 edges), prompt card top, menu top and right, but not on the prompt card left, right or bottom; and the card shadow is about 9% not 20% (only the popover reaches 18%). Keep it as "usually", not "always".
8. Section 6 of the measure file quotes 18.93:1 for the dark toast (`#0d0d0d` on `#f3f3f3`); that is the `#000000` figure, the pair is 17.52:1.

Rules 1, 2, 3, 8, 10, 11 hold. Rule 8 verified: shell/sidebar no border, card edge step has no highlight and no shadow, inset 9.0/9.4/55 CSS px.

## 5. Not verifiable from the screenshots

Hover (both packs), destructive button, status pills (arithmetic reproduces: 16% tint bg, 40% border, contrast 5.83/6.16/5.04/8.08/7.97), focus ring, accent link, dark toasts. Light twins found: destructive red is `#e12e2a` on 14+ light screens (claim `#df2e2b`, within 2); light neutral toast is `#000000` (c211); the green toast is `#008635` on 12 ChatGPT screens and `#3eae72` on Platform p47/p49.
