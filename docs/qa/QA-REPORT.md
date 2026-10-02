# Rasikh QA and demo-polish report

> **Update, 2 Oct 2026, 15:20.** Three things in this report have moved on.
> 1. **Guard evidence.** The "12 of 25 forbidden flows allowed" figure below is the *archived* evaluation. The
>    deployed Guard (contract 1.2.0) has since denied all 25 synthetic attacks in each of 3 runs (75 of 75) over
>    HTTP. That measures the policy decision only; end-to-end safety is still not proven, and the app and the
>    README say so. Read "unverified" below as "end-to-end safety not proven".
> 2. **The demo UI.** The tab strip that switched between users is gone and every user has a distinct link; a
>    demo hub at `/`, a presenter guided tour (`/?tour=demo`) and live toasts were added. They are in
>    [`demo-polish/`](./demo-polish/) as patches against the shared working tree (`git apply --check` passes).
> 3. **Live AI** in the code is Gemini on Vertex AI, not OpenAI.


Independent review of the running app, 2 Oct 2026. Everything below was observed in a real
browser (headless Edge over the DevTools Protocol) or by running the code. Numbers are from runs
made today on the stated snapshot; none are carried over from earlier notes.

- **Snapshot tested:** the shared working tree on `devin/integrations` as it stood at **13:08 Dubai**
  (copied to an isolated directory; nothing in the shared tree, branch or state was touched).
- **Fixes live on:** branch `qa/polish`, an isolated git worktree cut from a 12:48 snapshot of the
  shared tree. Nothing was pushed, published or staged in the shared tree.
- **Ownership:** every fix is small, in its own commit, and listed so the coordinator can take or
  drop each one. Nothing here replaces work that has an active owner.

## Verdict

The app is in good shape for a demo. All four surfaces render with populated, role-appropriate
content, there are no axe violations in 50 route, language and theme cases, and live sync across
tabs is immediate. The three-minute path works end to end. The weak points were at the seams: a
hire created during the demo could not reach the central "agent drafts, newcomer approves" moment,
and some demo copy contradicted the privacy promise. Both are fixed on `qa/polish`.

## Findings, by priority

Status: **Fixed** = fix committed on `qa/polish`. **Open** = not fixed, reason given.

### P1: demo-breaking or trust-breaking

| #   | Finding                                                                                                                                                                                                                                                                                                                             | Evidence                                                                             | Status                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 1   | **A hire created during the demo cannot reach the approval moment.** After the employer adds a hire and the newcomer confirms three documents, the housing step opens and nothing on the phone can start it. Only the seeded hire, Anders, had a draft. The "agent drafts, you approve" story therefore only worked on seeded data. | Cold-start run on the old tree: housing `ready`, no control to continue.             | **Fixed** `1b2c7b7`: a _Prepare application_ card on the agent view creates the draft and its approval together. |
| 2   | **The first hire and the first company did not take the INTEGRATION.md fixture ids.** They got random ids, so `hire_demo_001`, `company_demo_001` and the Guard and TAMM fixtures would never match what the UI created.                                                                                                            | State after _Add a hire_: random id.                                                 | **Fixed** `db1be82`. Falls back to a random id only if the fixture id is already taken.                          |
| 3   | **Landlord risk text revealed income.** The seeded risk summaries said the rent was "about 47%" and "about 28%" of income. The landlord is only allowed a yes or no. The text contradicted the consent screen and the policy matrix. Anders's draft also had no risk summary at all, so the landlord saw nothing to reason from.    | Landlord detail text; journey check J4 fails on the shared snapshot for this reason. | **Fixed** `632e918`. Arabic strings updated to match.                                                            |

### P2: noticeable polish and accessibility

| #   | Finding                                                                                                                                                                                                              | Evidence                                                                                                | Status                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 4   | **Cold open showed the wrong person.** The phone opened on the newest seeded hire, who has nothing to do, so the first screen was an empty feed.                                                                     | First load of `/newcomer` with no stored person.                                                        | **Fixed** `e1a8e4f`. A hire created during the demo always wins; otherwise the person with a pending decision. Four tests. |
| 5   | **Seven employer dialogs lose focus when closed.** Add hire, the expansion dialogs, the Guard dialogs and hire detail all drop focus to the top of the page. A keyboard user has to tab back through the whole page. | Focus trace: the dialog is unmounted before `close()` runs, so the browser has nothing to restore from. | **Fixed** `5804acb`, three lines in the shared employer `Modal`.                                                           |
| 6   | **The demo notice took three lines** at the top of every phone screen and pushed the real content down.                                                                                                              | Phone screenshots.                                                                                      | **Fixed** `df33fa0`: one line, expandable.                                                                                 |
| 7   | **Tab title read "Rasikh · Rasikh"** on the newcomer app and the favicon request returned 404.                                                                                                                       | Page title and console.                                                                                 | **Fixed** `77cc016`.                                                                                                       |
| 8   | **"1 units", "1 applications", "1 viewings".**                                                                                                                                                                       | Landlord pages scoped to a single portfolio.                                                            | **Fixed** `0dbbb9c`.                                                                                                       |

### P3: left open, with the reason

| #   | Finding                                                                                                                                                                                                                                                                                                                         | Why it is open                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | **DEMO.md promises a live blocked action that the app does not have.** It describes the agent trying to attach a salary slip and Guard blocking it. No such trigger exists. What does exist: the _Approve_ button is disabled until the passport consent is on, with the reason shown, and the Guard page lists seeded denials. | Needs a decision from the owner: build the trigger or reword DEMO.md. The three-minute script uses what actually works and says so.                      |
| 10  | **Guard enforcement is unverified, and the UI says so.** The Guard page states that the historical evaluation allowed 12 of 25 forbidden synthetic flows and that the provenance failure is unresolved.                                                                                                                         | This is the truthful position. It must stay in the submission. Do not describe the blocking in the demo as Guard enforcement.                            |
| 11  | The new _Prepare application_ card sits above a "No decisions waiting for you" empty state, which reads as a contradiction for a moment.                                                                                                                                                                                        | Cosmetic. The empty state belongs to the approvals section, which has another owner.                                                                     |
| 12  | Organisation and portfolio pickers reset on a full page reload. They are held in layout-level React state, so they persist across in-app navigation (verified) but not across **F5**.                                                                                                                                           | Acceptable for a demo; do not reload mid-story.                                                                                                          |
| 13  | In Arabic, the roadmap-built note ("The bank account is ordered after…") is shown in English, under a label that marks it as an original note. Organisation and property names stay in Latin script.                                                                                                                            | By design in the current code (`OriginalNote`). A translation for that one generated sentence would remove the last visible English string on the phone. |
| 14  | Dev-mode warning: the hero image on the Documents, Agent and Passport pages is the largest paint but lacks `priority`.                                                                                                                                                                                                          | Dev only, no visible effect.                                                                                                                             |
| 15  | Tab from the last control in a modal dialog moves focus to the browser's own controls.                                                                                                                                                                                                                                          | Native `<dialog>` behaviour. The page behind never receives focus, which is the requirement. No change.                                                  |

### Withdrawn after re-checking

Two things looked wrong in the first pass and were not: the axe `aria-progressbar-name` violations
(my first sweep accidentally hit an older server on the same port; the live tree names every
progress bar) and "scope does not persist" (it persists in-app, see 12). One journey failure,
consent revocation not reaching shared state, appeared once under load and did not reproduce on
two clean re-runs; treat as a timing flake, not a defect.

## Fixes: files and commits on `qa/polish`

All eight commits are on top of baseline `d899732`. Patch files are in `docs/qa/patches/` and each
one passes `git apply --check` against the shared working tree as it stood at 13:08, so they can be
applied in any order. The shared tree is mostly uncommitted, so apply patches rather than
cherry-picking.

| Patch | Commit    | Files                                                                                                                                                 |
| ----- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0001  | `db1be82` | `components/employer/new-hire.tsx`, `components/employer/expansion.tsx`                                                                               |
| 0002  | `632e918` | `domain/seed/applications.ts`, `components/landlord/content.ts`                                                                                       |
| 0003  | `e1a8e4f` | `store/default-person.ts`, `store/default-person.test.ts`, `store/person.ts`                                                                          |
| 0004  | `df33fa0` | `components/newcomer/demo-notice.tsx`                                                                                                                 |
| 0005  | `77cc016` | `app/newcomer/layout.tsx`, `app/icon.svg`                                                                                                             |
| 0006  | `0dbbb9c` | `components/landlord/{applications,leases,properties,viewings}.tsx`                                                                                   |
| 0007  | `1b2c7b7` | `components/newcomer/housing-draft-card.tsx`, `domain/rental-risk.ts`, `domain/rental-risk.test.ts`, one line in `components/newcomer/agent-view.tsx` |
| 0008  | `5804acb` | `components/employer/common.tsx`                                                                                                                      |

```bash
git apply --check docs/qa/patches/0001-*.patch   # dry run, changes nothing
git apply docs/qa/patches/0001-*.patch           # then 0002 ... 0008
```

Patch 0007 touches `agent-view.tsx` by two lines (an import and one mount). If that file has moved,
add `import { HousingDraftCard } from './housing-draft-card';` and put `<HousingDraftCard />`
directly above the `agent-approvals-title` section.

## Checks performed

Counts are from today's runs.

| Check                                                    | Result                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type-check and unit tests on the shared snapshot (13:08) | `tsc --noEmit` clean. 18 files, **276 tests pass**.                                                                                                                                                                                                                                                                                                |
| Same on `qa/polish`                                      | `tsc` clean. 18 files, **277 tests pass** (adds 9 for the fixes).                                                                                                                                                                                                                                                                                  |
| Route, language and theme matrix on the shared snapshot  | **50 cases**: 16 phone-width newcomer cases (4 pages, English and Arabic, light and dark) and 34 desktop dashboard cases (17 pages, light and dark). **axe: 0 violations in all 50.** No horizontal overflow. No console errors. One case timed out in the batch; re-run alone it was clean (axe 0, no overflow, only the dev-mode image warning). |
| Cold-start journey on `qa/polish`                        | **17 of 17**: employer adds a hire (fixture id), newcomer confirms three documents, _Prepare application_, approval blocked without passport consent, consent on, approve, landlord sees it only after approval, landlord decides, housing done on the roadmap.                                                                                    |
| Seeded journey, shared snapshot                          | **16 of 17**. The one failure is finding 3 (no risk reasoning on Anders's draft). Revoke, re-grant, approve, landlord decision, roadmap, employer and reset all pass.                                                                                                                                                                              |
| Seeded journey, `qa/polish`                              | **17 of 17**.                                                                                                                                                                                                                                                                                                                                      |
| Live sync, no reload                                     | Landlord tab shows the approved application **52 ms** after the click. Employer tab updates in about **2 ms**.                                                                                                                                                                                                                                     |
| Documents review gate                                    | Confirm is disabled until the review box is ticked, for all three documents. Three verified opens housing.                                                                                                                                                                                                                                         |
| Dialog keyboard behaviour                                | Opens from the keyboard, focus lands inside, Escape closes. Focus did not return before patch 0008; **7 of 7 after it**.                                                                                                                                                                                                                           |
| Organisation scoping                                     | Landlord: Yas Gardens shows 0 applications, Khalifa City shows 1 unit. Employer: Northwind shows 0 hires. Persists across in-app navigation.                                                                                                                                                                                                       |
| Arabic and dark on the new card (`qa/polish`)            | `dir="rtl"`, no overflow, button on the start edge, all text Arabic except the property name. Dark renders correctly.                                                                                                                                                                                                                              |
| Contrast and semantic colours                            | Covered by axe (0 colour-contrast violations in the matrix).                                                                                                                                                                                                                                                                                       |

### Every visible action: click-through of all enabled controls

A script clicked every enabled button, tab, switch and disclosure on **20 pages** (every route in
the three dashboards and the four phone pages, English, light) and recorded whether anything
happened: navigation, a dialog, a DOM change, a request to the server, or a download.

**92 of 96 enabled controls were clicked; 4 showed no effect, and none is a defect.**

| Control       | Page                  | Why                                                                                                                                                                                               |
| ------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All hires     | Employer, Hires       | Already the selected filter.                                                                                                                                                                      |
| Journey       | Employer, hire detail | Already the selected tab.                                                                                                                                                                         |
| Planned       | Landlord, Viewings    | Already the selected filter.                                                                                                                                                                      |
| Mark complete | Landlord, Viewings    | **Works.** The sweep clicked before the page had hydrated. Re-tested with a longer wait: it sends `viewing.update`, the viewing becomes `completed`, and the page says _Viewing marked complete._ |

Controls that stay disabled until a form is filled (Save, Approve, Create roadmap and so on) are
not covered by this sweep. They are covered by the journeys above, where each is used and checked.
The language and theme toggles were excluded; both were checked in the matrix.

### Production build

`next build` exits 0 on both trees: the 13:08 snapshot of the shared working tree ("Compiled
successfully", lint and type check pass) and `qa/polish`. The build was run in the isolated copies,
not in the shared tree, so it did not touch the coordinator's build output. The coordinator should
still run it once more on the final commit.

## Remaining limitations to state honestly

- **Guard enforcement is unverified.** Do not present the demo as proof the agent is safe. The
  newcomer-side block is the app's own consent rule, not a Guard verdict.
- **Document extraction in demo mode** creates suggested fields from the hire profile. No AI reads
  the file. Live extraction is labelled and unavailable without credentials.
- **Nothing leaves the app.** Applications and messages are simulated.
- **Money figures are illustrative.** Rents and salaries are estimates (`est…` fields).
- **A full page reload resets the organisation pickers.**
- **Shared state is in memory.** A server restart is the same as _Reset demo_.

## Screenshots

In `docs/qa/screens/`: `cold-1-draft-card.png` (the new card), `cold-2b-blocked.png` (Approve blocked
without consent), `cold-4-landlord-detail.png` (landlord reasoning, no salary), `cold-5-roadmap-after.png`
(roadmap after the decision), `cold-ar-draft-card.png` (Arabic, RTL) and `cold-dark-draft-card.png`.

## Three-minute demo

See [DEMO-3MIN.md](./DEMO-3MIN.md). It was written from, and checked against, the runs above.
