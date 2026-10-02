# Demo script

Two paths, one product. Each runs in about 90 seconds and both include the Guard moment, because that is what proves the agent is safe. Run in demo AI mode so nothing depends on network or latency.

Names and numbers below are placeholders until the Session 2 seed is final. Fixture ids are fixed by INTEGRATION.md section 5.

## Setup

- Four windows: employer (desktop), newcomer (phone width or a real phone), landlord (desktop), Guard log (inside newcomer).
- AI mode: demo. Guard and TAMM: stub until Session 11, then the real packages.
- Press **Reset demo** before every run. It resets the app, then TAMM MCP, then Guard.

## Path 1: an existing company hires someone from abroad

Fixture: `hire_demo_001`, apartment `lease_reem_2207` on Al Reem Island.

1. **Employer adds and backs the hire.** Hires, add hire, enter the details, back this hire. The hire appears in the newcomer app at once, with the employer backing attached.
2. **Newcomer uploads documents.** Passport and offer letter. AI extracts the fields with confidence and reasoning. The roadmap appears with dependencies visible: the bank account unlocks after the Emirates ID application.
3. **Agent proposes a rental application** to the Al Reem apartment. Approval request appears in the newcomer app.
4. **Guard moment.** To strengthen the application the agent tries to attach the hire's salary slip. Guard blocks it: "Blocked: your salary was not shared with landlords. Share it?" The newcomer shares only the affordability result instead (a derived signal) and approves the application. The Guard log shows both the block and the allowed check, with reasons.
5. **Landlord decides.** A verified, employer-backed application with a plain-language risk summary and a reason for every point. The landlord approves with better terms (more cheques).
6. **Employer sees it move.** The hire advances on the employer dashboard without anyone touching it. Days in relocation and blockers update.

## Path 2: a foreign company opens an Abu Dhabi branch

Fixtures: `company_demo_001`, then `hire_demo_002` to `hire_demo_004`.

1. **Expansion intake.** The company describes itself: industry, home country, activities, team size moving, timeline. The AI recommends a setup path (mainland or a specific free zone) with plain reasoning and trade-offs for each option, labelled as guidance and not legal advice.
2. **Setup roadmap.** Trade name, licence, office lease, establishment card, visa quota, entity bank account, in order with dependencies. Each step links to its TAMM service. The agent checks the trade name and starts applications.
3. **Entity can sponsor.** When the visa quota step completes, the first three employees flow into the relocation pipeline on their own. The employer dashboard shows them as new hires with the company backing them.
4. **Expansion dashboard.** Entity setup progress, team relocation progress, blockers and days to fully operational, all moving.
5. **One hire settles.** Jump into Path 1 steps 3 to 6 for one of the three, including the Guard moment.

## Done criteria (Session 7, extended in Session 11)

Each path runs start to finish three times in a row, in both themes, both languages, and newcomer at mobile width, with no console errors.
