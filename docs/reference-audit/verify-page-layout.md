# Verify: page layout patterns and spacing

Independent re-measurement of `measure-page-layout.md`. Scale assumed: 1 css px = 1.27 img px (1920 / 1512), re-checked on screens the measurer did not use. Footer cropped (Platform 1205 rows, ChatGPT 1200 rows). Thresholds: geometry within 1 px, colour within +/-2 per channel. Hairlines render 1.27 img px wide, so single-row hairline colours are blurred; I compare observed pixels and, where it matters, the integrated (deblurred) value.

Result: 104 token entries checked, 93 confirmed, 11 corrected, 0 cannot_verify. (A few confirmed entries could only be re-read on the measurer's own screen because no other screen shows the element; the note says so.)

## Scale (confirmed)

New evidence: ChatGPT sidebar 330 img on 22 screens (260 css), composer 73.5-74 img (58 css) on 11 screens, header hairline at y66 on 14 screens (52 css), settings modal interior 862 x 761 on 8 screens (679 x 599 css), nav 226 img (178-180 css); Platform buttons 40-41 img (32 css) on 10 screens, rail 407 img (320.5 css) on 6 screens, containers 600.0 / 672.4 / 698-701 / 767.7 / 800.0 / 900.0-901.6 css on 30 screens, pane footer 72.5 img (57 css). 16px bold ChatGPT prose caps measure 14 img = 11 css (ratio 0.69 at 1.27, plausible; 1.0 or 2.0 would not be).

## Corrections

| Token | Claimed | Measured | Screens |
|---|---|---|---|
| page.card.bg (dark) | #212121, header band #1e1e1e | body and header are both #212121 (#222222 noise). #1e1e1e is only the 1px top border row (y70) | 322, 321, 320, 318 |
| page.header.title | 18px/24px | 18px only on settings/billing/org pages (cap 16 img). 20px on list/overview pages: API keys, Usage, Logs, Storage, Fine-tuning (cap 18 img, 42 screens). 16-17px on playground (cap 15). Centre 27.3 css below card top holds | 224, 225, 327, 337, 339, 391, 372, 235, 24-45 |
| tabs.segmented.container | ~29px (est. 28), pill ~27 | container 40-41 img = 32 css, pill ~36 img = 28 css, inset ~2 css | 249, 263, 282 |
| table.header | filled #f9f9f9 band only on Logs family | band also on Evaluation (95, 282, 298): 37 img = 29 css; Logs 38 img = 30 css. Whole-pack scan found no other screens | scan of 417 |
| content.section.gap | 48px sections, ~30 card to heading | 48 holds for input sections (324: 48.5 css). Data controls toggle/radio sections are ~24 css. Card to next heading ~32 css (394) | 324, 399, 400, 394 |
| content.empty-state.position | block top ~196 below rule | horizontal centre 1093 holds. Vertical offset is not fixed: top 84 css (235), 105 (338), 50 (335), 196 (224), vertically centred ~339 (181) | 235, 338, 335, 181, 224 |
| form.action.placement | Save 12-24 (16 typical) | Save sits 24 css under the last control on 326/343/344, 18 on 374, 12 on 324. Wizard CTA unchanged: 32 tall, right edge x1520 = container edge, 24 above card bottom | 343, 344, 374, 242 |
| card.notice | 1px #eeeeee, radius 8 | border #e5e5e5-#e8e8e8 (deblurred ~#e6e6e6), corner fit radius 12 css, height 52 css confirmed | 330, 397, 394, 385 |
| pane.list.padding | selected row 50 tall | padding 16 and radius 8 confirmed (corner fit). Height is content-driven: 50 css (300), 64 css (266, 269: 80-81 img) | 266, 269, 300, 305 |
| thread.panel.width (ChatGPT) | border-left #f2f2f2 | width 400 css holds (507 img). Border column is flat #eeeeee (neighbour #f7f7f7, deblurred ~#ebebeb) | 45-48 |
| tabs.underline (ChatGPT) | strip rule #f7f7f7, padding 9, boxes 16 apart | indicator 1px black (#050505) confirmed. Strip rule is #f2f2f2 (129 y311, 145 y366). Padding 8-9 css (129: 10/11 img), boxes 16-18 apart | 129, 145 |

## Notes on confirmed tokens worth knowing

- Header divider row: dashboard family (y141) is #f2f2f2 and 56 css; playground family (y140, 60 screens) is #e7e7e7 and 55 css; usage family #e8e8e8-#ebebeb. Both rows are within 1 px of the claim.
- Nav highlight x15..261, 32 css tall, fill #e0e0e0 (12 css inset both sides).
- Settings modal: 679 x 599 css interior; a 1px dark ring adds ~1 css per side (outer 682 x 602).
- Pane dividers are two rows of #f7f7f7 (deblurred ~#f2f2f2). Even split is 638:645 css (49.7:50.3).
- Underline tab indicator (Platform): row 178 #1c-#1e, 1.27 px, label width +/-1; label gaps average 19.0 css over ~50 gaps; first label x 312-313 on 16 screens.
- Stacked-input gap (374), kv no-icon column, 3-group radio pitch, 4-col table (373), 800/768 containers, with-back header, 320 pane: only one screen family shows them; re-read there and they agree.

## Rule issues

- Rule 2: title is not always 18/24 (20px on list and overview pages); the #f2f2f2 divider is true for dashboard pages only.
- Rule 5: centered pages start 44 below the rule, except 768 card-list pages (236, 246) which start ~32.
- Rule 6: 48px section gap is not universal (Data controls ~24).
- Rule 7/8: "tint only alerts and chips" is contradicted by selected row #eeeeee, segmented container #eeeeee, table header band #f9f9f9 (Logs and Evaluation), active nav #e0e0e0. Info boxes use radius 12 and a #e5e5e5 border, not the card's radius 8 / #ececec.
- Rule 9: the selected segmented pill also carries a faint shadow (rows under it read #e1e1e1).
