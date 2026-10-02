# @rasikh/data: Firestore data layer

The Firestore schema for Rasikh: typed models with zod validation in both directions, typed refs and queries, security
rules, composite indexes, and the trust-passport consent sync. It targets the Firebase project the web app already
configures (`rasikh-f0207`, see `FIREBASE.md`) and the modular `firebase@12.19.0` SDK the app pins.

## Collections

```
users/{uid}                              role, subject_ref, company_id, display_name
companies/{companyId}                    name, setup_path, member_uids
cases/{caseId}                           one hire or one company expansion; summary roll-up
  documents/{ref}                        labelled data items, id = Guard PayloadRef.ref
  consents/{label}__{destination}        trust passport consent, one per pair
  guard_checks/{checkId}                 Guard decisions incl. remedy, allowed_destinations (server-written)
  applications/{applicationId}           TAMM applications (server-written)
trust_passports/{uid}                    the newcomer's sharing toggles
```

| Decision | Why |
| --- | --- |
| Unbounded lists are subcollections | A case stays well under 1 MiB, and the Guard log and documents page independently |
| Deterministic ids (`ref`, `label__destination`) | Writes are idempotent, and a pair can never get duplicate consents |
| `cases.summary` roll-up | Dashboards list cases without reading subcollections |
| Revoking sets `active: false`, deletes are refused | Consent history is kept as an audit trail |
| Converters validate reads and writes (`strictObject`) | Unknown fields, unknown labels and bad dates fail at the boundary (`DataValidationError`) |
| Dates are `Date` in code, `Timestamp` in Firestore | Including nested ones such as application history |

## Security rules (`firestore.rules`)

Clients get least privilege. The Rasikh server writes through the Admin SDK, which bypasses the rules. It owns
companies, case creation, Guard checks, TAMM applications, `observed_at` and `guard_consent_id`.

- A case is visible to its newcomer and to members of its company. Lists must carry a filter the rules can prove.
- **Defense in depth:** an employer can read a case document only if every label on it is one the Guard policy allows to
  employers. Bank statements and health data never reach an employer client, even if the app has a bug.
- Only the newcomer adds documents. The id must equal the ref, labels must be known, and labels are immutable.
- Only the newcomer grants consent, only for the 10 `consent` cells of INTEGRATION.md 3.4, and only under the deterministic id.
- Users cannot promote their role or attach themselves to a company. Trust passports are private to their owner.

Indexes (`firestore.indexes.json`) cover every composite query in `src/refs.ts`: refusals newest first, open
applications, an employer's cases by status, and a newcomer's cases.

## Trust passport sync

`planConsentSync(passport, consents, now)` diffs the newcomer's toggles against consents in force and returns the
minimal `grant` / `revoke` operations for Guard (`POST /consent`, `DELETE /consent/{id}`), in a deterministic order.
Expired or revoked consents that are still wanted are re-granted. Toggles that consent cannot unlock (deny or
conditional cells) are returned as `ignored`, never granted.

## Test

```sh
cd packages/rasikh-data
npm ci
npm run typecheck
npm test              # converters and sync planner (no emulator)
npm run test:rules    # security rules against the Firestore emulator; needs JDK 21+
```

The unit tests also assert that the consentable pairs in `firestore.rules`, the sync planner, and the 3.4 matrix agree.
Mutation check: dropping the employer label restriction from the rules fails the rules suite.

## Deploy

```sh
npx firebase deploy --only firestore:rules,firestore:indexes --project rasikh-f0207
```

This needs a Firebase login with rights on the project. It is not run from CI.

## Known limits

- The web app does not use this package yet; it adopts `@rasikh/data` when it adds Firestore.
- Landlord and bank users have no client access. Those surfaces get data through the server after a Guard check.
