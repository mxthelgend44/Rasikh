# Demo UI hand-over (patches)

Against the shared working tree of `devin/integrations` as it stood at 15:21 Dubai on 2 Oct 2026 (employer hero files, which are being reworked live, are deliberately not touched). Both
patches pass `git apply --check` on it.

```bash
git apply --check docs/qa/demo-polish/demo-polish-all.patch   # dry run, changes nothing
git apply docs/qa/demo-polish/demo-polish-all.patch            # code: the eight QA fixes + hub, tour, toasts, shell and UI polish
git apply docs/qa/demo-polish/readme-for-judges.patch           # the rewritten README
```

`series/` holds the same changes as individual commits so any piece can be taken or dropped.
Includes: no user-switching tabs, a distinct link per user (`/newcomer?as=anders`), the demo hub at `/`,
the presenter guided tour (`/?tour=demo`, `/?tour=features`, Alt+G), live toasts that disclose only what
each screen may know, a rental-draft card for a newly added hire, and UI polish for all four surfaces.
Checked: `tsc` clean, 398 unit tests pass, axe 0 violations on the 50-case matrix, journeys 17 of 17.
