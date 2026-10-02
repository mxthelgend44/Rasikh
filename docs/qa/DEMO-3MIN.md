# Three-minute demo

> **Superseded in the app** by the guided tour: open `/?tour=demo` (Alt+G reopens it). The steps below stay as a text fallback. Person links are now `/newcomer?as=anders`. Guard wording: the latest HTTP measurement denied 75 of 75 synthetic attacks (an archived evaluation allowed 12 of 25); end-to-end safety is not proven.

Verified by a scripted dry run against the QA branch (`qa/polish`) and the live tree, using the
Anders Lindqvist case. Every click below was executed with a real browser; the timings are the
target, not a guarantee. Run it in demo AI mode: no network call is needed anywhere.

## Before you start (about one minute, off stage)

1. **Reset.** Open `/design-system/state` and press **Reset demo**. This restores the seed in every
   open tab. Do it before every run, including a retry.
2. **Three windows**, arranged left to right:
   - **A, newcomer (phone width, 390 px or a real phone):** `/newcomer`. The top of the page must
     read _Anders Lindqvist · Solutions architect_. If it shows someone else, open the avatar menu
     (_Viewing as …_, top right) and choose **Anders Lindqvist**. After patch 0003 the cold open
     picks him by itself.
   - **B, landlord (desktop):** `/landlord/applications`, organisation _Al Reem Residences_.
   - **C, employer (desktop):** `/employer/hires/hire_seed_04`.
3. **Check the starting state** (10 seconds):
   - A: _Your next action: Review a request_, **Documents ready 3 / 3**, **Pending requests 1**,
     _2 of 9 steps done_, _Backed by Gulf Meridian Technologies_.
   - B: the inbox has **no** Lindqvist row.
   - C: _2 of 9 steps complete · 22%_, _Find and rent a home_ shows _Needs approval_, and the page says _A personal approval is waiting_.

## The script

| Time | Window | Do                                                                                                                      | Expected, and what to say                                                                                                                                                                                                                                                                                                                                         |
| ---- | ------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00 | A      | Stay on **Roadmap**.                                                                                                    | One clear next action, a progress bar and the steps with their owners. "Anders was hired by a Dubai company. His employer added him and backed him. This is everything he sees."                                                                                                                                                                                  |
| 0:20 | A      | Tap **Documents**. Open **View details** on the passport.                                                               | Three documents, each _Confirmed in demo_. The details sheet lists the extracted fields (name, number, nationality, dates), each with a _Demo confidence_ score. "He reviewed what the agent read from his documents and confirmed each one. Nothing moves until he does." Say plainly that the sheet is labelled a demo preview and the scores are illustrative. |
| 0:40 | A      | Tap **Agent**.                                                                                                          | One card: _Review rental application_. Recipient _Al Reem Residences_, the home, the employer backing, and the draft contents.                                                                                                                                                                                                                                    |
| 0:55 | A      | Point at the draft contents.                                                                                            | Employment letter _Allowed_; Passport needs consent; Salary _Derived result only_. "The landlord can see a yes or no on affordability. Never the salary."                                                                                                                                                                                                         |
| 1:10 | A      | Tap **Trust passport**, then **Revoke** on _Passport · Landlords_. Go back to **Agent**.                                | **Approve demo submission** is greyed out, with the reason _Turn on the required consent to approve this draft._ "This is the blocked action. Without consent the agent cannot send his passport, and the button tells him why."                                                                                                                                  |
| 1:30 | A      | On the card, turn the **Passport** switch back on, then tap **Approve demo submission**.                                | The card clears and the feed records the approval. "Consent is his to give and take back."                                                                                                                                                                                                                                                                        |
| 1:45 | B      | Switch to the landlord window. Do not reload.                                                                           | A new row for **Anders Lindqvist** under _Rental applications_, already there (measured at about 50 ms). It was not there before the approval.                                                                                                                                                                                                                    |
| 1:55 | B      | Open the row.                                                                                                           | Employer backing, a **Low risk** summary with a reason on every point, and no salary figure. "It says the affordability result is a yes. It never says the salary."                                                                                                                                                                                               |
| 2:15 | B      | **Start review**. Outcome **Offer lease terms**, cheque schedule **4 cheques**, add a short note, **Save lease offer**. | The decision is saved.                                                                                                                                                                                                                                                                                                                                            |
| 2:35 | C      | Switch to the employer window. Do not reload.                                                                           | _Find and rent a home_ is now _Done_, the count has moved to _3 of 9 steps complete_, and _A personal approval is waiting_ is gone. "His employer sees the result without chasing anyone."                                                                                                                                                                        |
| 2:50 | A      | Tap **Roadmap**.                                                                                                        | _Find and rent a home_ is done, and the next steps (tenancy registration, bank account) have unlocked.                                                                                                                                                                                                                                                            |
| 3:00 |        | **Reset.**                                                                                                              | `/design-system/state`, **Reset demo**. Every window returns to the starting state.                                                                                                                                                                                                                                                                               |

## If asked: the Guard story, honestly

- The **Employer → Guard** page lists recorded demo checks. It includes a seeded _Denied_ entry:
  _Salary details can only be shared with landlords as a yes or no result._
- It also states, on the same page, that the historical evaluation **allowed 12 of 25 forbidden
  synthetic flows** and that its provenance failure is unresolved. We do not claim live Guard
  enforcement. The newcomer-side blocking you just saw is the app's own consent rule, not a Guard
  verdict.
- DEMO.md describes an agent trying to attach a salary slip and being blocked. That trigger does
  not exist in the app today, so do not promise it on stage.

## Optional 60-second opener: a hire from nothing (adds about a minute)

Use this only if you have four minutes. It needs patches 0001 and 0007.

1. **Employer window** → **Hires** → **Add a hire** → **Use sample** → **Create roadmap**.
2. **Newcomer window** → **Documents**: upload a file for each of Passport, Offer letter and Degree
   certificate, **Create demo preview**, tick the check boxes, **Confirm demo details**.
3. **Agent** → **Prepare application**. The pending approval appears. **Approve demo submission**
   is blocked until the passport consent is on; turn it on from **Trust passport**, then approve.
4. Continue from the landlord step above. The hire is Nadia Rahman and the id is `hire_demo_001`.

## If something goes wrong

| Symptom                                 | Fix                                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A window shows old data                 | **F5**. The live connection normally keeps every window current, so this means the connection dropped; a reload restores it. |
| Approve is unexpectedly disabled        | Passport consent is off. Turn the switch on, on the card or in **Trust passport**.                                           |
| The landlord inbox already shows Anders | The demo was not reset. **Reset demo**, then reload all three windows.                                                       |
| Wrong person on the phone               | Avatar menu → **Anders Lindqvist**.                                                                                          |
| Anything else                           | **Reset demo** and start again. Nothing external is ever sent, so a reset is always safe.                                    |
