# Rasikh public-data neighborhood recommender

A trained **CPU NumPy baseline** with two unsupervised models and an explainable
content recommendation algorithm. It is independent of the web app, existing
contracts, deployment and root workspace. No GPU execution is claimed here;
the main release coordinator owns the separately requested GPU-training work.

## Real data

One bounded Overpass query retrieved **4,229 OpenStreetMap elements** around Abu
Dhabi. After bounding-coordinate filtering and category selection, training uses
**3,958 mapped amenity objects** in **366 occupied 1 km cells**. Recommendations
cover **199 named place markers** in this metropolitan bounding box. This is not
all of Abu Dhabi emirate and not a curated list of 199 residential districts.

Features are mapped schools/kindergartens, healthcare, supermarkets, parks,
restaurants/cafes and transit. Counts are OSM objects, not verified facilities:
separate nodes and ways can represent the same facility. Mapping is incomplete;
a zero count does not establish absence. Source hashes, original query, retrieval
date and OSM base timestamp are in `models/osm-provenance.json`.

The normalized snapshot and derived data are distributed under **ODbL 1.0** with
OpenStreetMap attribution; see `LICENSE-DATA.md`. Raw responses stay gitignored.
There are **no synthetic preference labels or customer outcome labels**.

## Models and recommendation algorithm

1. Assign each amenity object to one disjoint approximate 1 km grid cell.
2. Apply `log1p` to the six mapped-object count features. Learn means/scales
   from the training cells only during evaluation.
3. Train **PCA with three components** to learn a compact amenity representation.
4. Train **KMeans with four clusters** to group similar amenity-density profiles.
   Cluster IDs are descriptive; they do not certify quality or name lifestyles.
5. For each named place, count mapped objects within 1.5 km of its OSM marker
   and divide by circular area to get density per square km. These are circular
   feature windows, not administrative neighborhood boundaries.
6. Convert explicit user preferences (0–1 per feature) into a target between
   the learned mean and 90th-percentile log features. Rank by distance in the
   learned PCA representation. Optional office coordinates contribute a
   configurable straight-line-distance score. No traffic or journey time is
   inferred. Preference targets and tradeoff weights are product rules.

The match index is **not a probability or satisfaction forecast**. No rent,
property availability, school quality, legal eligibility or future prices are
predicted by this shipping model.

## Held-out evidence

Seed `7102026`; **70/15/15 split by nonoverlapping 3 km spatial blocks**.
The exact cell membership is recorded in `models/osm-evaluation.json`.
Train/validation/test contain 251/59/56 cells from 59/13/13 blocks. Object IDs,
cells and blocks are disjoint. Neighboring blocks can still be spatially
correlated; no geographical buffer or future-time validation is claimed.

On the same untouched test cells:

| Representation metric | Trained model | Matched baseline |
| --- | ---: | ---: |
| Standardized reconstruction MSE | PCA **0.218926** | Training mean **0.682632** |
| Nearest-centroid squared distance | Four clusters **2.584933** | One centroid **4.095790** |

Reconstruction compression is expected to improve when adding components;
these comparisons do **not** establish user recommendation effectiveness.
The report includes a held-out block bootstrap interval for reconstruction
improvement. Both final models are refitted on all cells only after test scoring.
Source-data hashes and NumPy version are recorded. No live app validation is
implied by these package metrics.

## Reproduce

Python 3.11+ and NumPy 2.3.5; Node 22+. This package installs no runtime npm
dependencies and does not alter the root lockfile or workspace.

```sh
python -m pip install -r packages/rasikh-recommender/requirements.txt
python packages/rasikh-recommender/train_osm.py
node --test packages/rasikh-recommender/test/recommender.test.mjs
node packages/rasikh-recommender/server.mjs
```

Default training reuses the cached raw snapshot if present, otherwise the
packaged normalized snapshot; it verifies the normalized provenance hash.
`--refresh` makes a new public Overpass request and replaces the snapshot/models,
so refresh can change results and must never be done against a frozen release.
For an exact reproduction, omit `--refresh`.

Local demo: **http://127.0.0.1:8795**. Set `RASIKH_RECOMMENDER_PORT` to use another
free port. Inputs stay local; inference makes no provider calls or paid requests.
`npm run test:browser --prefix packages/rasikh-recommender --workspaces=false`
uses the repository's existing headless Chromium QA helper and the running demo.

Server-side integration, after the coordinator's review:

```js
import { recommend } from './packages/rasikh-recommender/index.mjs';
const result = recommend({
  preferences: { schools: 1, parks: 1, groceries: .8, transit: .6 },
  office: { latitude: 24.5, longitude: 54.39 },
  commuteWeight: .25,
  limit: 6,
});
```

This module reads its own model JSON on the server. Do not bundle `node:fs` into
browser code. Returned reasons/counts and source/license fields should remain
visible. No main-app route or deployment is modified by this package.

## Separate rental research (not shipped)

`train.py` explored the public ArcGIS `RentalIndexV1` table. It produced 3,370
aggregate observations, 95 zones and 661 sectors. A sector-disjoint test set
contains 716 observations. Ridge test MAE was AED 17,317.29 per year versus
AED 16,183.09 for a hierarchical median baseline: **ridge was 7.01% worse**.
It is not promoted as an improvement. Publisher identity/official linkage and
reuse rights are unverified; this source is not called an official government
dataset. Raw cache and rental-model artifacts are ignored and excluded from
the shipping file list. They are local research evidence only.
