# Notice

Rasikh Guide is adapted from **Eduverse Companion**, an earlier Chrome (Manifest V3) extension by the
same author. That project is separate and is not part of this repository.

**What came from it.** The overall architecture (a side panel, a content script that reads page
structure, a background service worker with a guidance loop, a small orchestration backend and
authored per-site skillpacks) and some code: the perception pipeline, the message bus, the worker
loop and state machine, the server-sent-events shape of the backend and the panel store.

**What was done for Rasikh, on 2 October 2026, for the Hub71 hackathon.**

- Rebranded and reduced to a coach: every action that changes a page (click, type, select, submit,
  navigate) was removed from the code and is guarded by tests that fail if one comes back.
- Perception no longer has any field for values, and personal-data fields are described by label only.
- New skillpacks for the mock portals, draft skillpacks for real site kinds (unverified), and three
  mock portals (`packages/rasikh-portals`) to practise on.
- An offline, deterministic guide as the default; the optional cloud model needs an explicit opt-in.
- Fewer permissions, access granted one site at a time, and a per-site content-script registration.
- English and Arabic panel, new tests and the documentation in `docs/`.

**Licence.** No licence has been chosen for this package. Until the author decides, all rights are
reserved. The other packages in this repository carry their own licences.
