# Frozen OSM GPU feature inputs

This experimental dataset contains observed public mapped amenity objects. It
has no preference, rental, quality, traffic or travel-time labels. It supports
unsupervised feature reconstruction; it cannot establish customer outcomes.

Feature order is **schools, healthcare, groceries, parks, dining, transit**.
There are 366 occupied approximate 1 km² cells. Exact frozen baseline membership
and row order are imported: 251 train, 59 validation, 56 test cells across
59/13/13 non-overlapping 3 km blocks. Seed: **7102026**. No new split is drawn.

`preprocessing.json` contains float64 population mean and standard deviation of
`log1p(counts)` fitted on the 251 training cells only. Zero variance would use
scale 1. No clipping, imputation, PCA components, or model scores are inputs.
The JSON matrices preserve float64 statistics; the NPY matrices contain their
little-endian float32 rounding for GPU kernels.

## Trainer and evaluator contract

- Trainer reads only `trainer_fit_and_selection_allowlist` in `manifest.json`:
  train rows for fitting and validation rows for checkpoint/config selection.
- Freeze checkpoint and config before the independent evaluator reads test
  numeric rows. No retraining or selection based on heldout results.
- Evaluator uses the identical 56 test cells and train transform. Refit PCA and
  statistical baselines from training rows. The CPU package's deployed PCA and
  KMeans files are all-cell refits and would contaminate this comparison.
- `named-areas.json` provides 199 candidates solely for inference after model
  selection. Its 1.5 km circles overlap split boundaries. Never fit on these
  records. They describe mapped density around OSM markers, not neighborhood
  boundaries. Density is transformed with training statistics, with an explicit
  geometry/occupied-cell distribution limitation.
- User weights remain explicit product choices. No invented feedback is present.

Every JSON row matrix has `feature_names`, ordered `cell_ids`, parallel
`spatial_blocks`, `counts`, `log_features`, and `standardized_features`. Use
`standardized_features` as both input and reconstruction target. A source zero
means no mapped object in this snapshot; it does not establish facility absence.

## Reproduce and verify

From this directory, using Python with NumPy 2.2.6:

```powershell
py -3 prepare.py --verify
py -3 prepare.py --reuse-frozen
```

Default `prepare.py` reads the baseline package without writing to it. All
inputs must match `source-lock.json` byte hashes before any artifacts are written.
`--reuse-frozen` reproduces from the copied public snapshots. Original baseline
script bytes are fingerprinted for audit only and are never imported/executed.
Reproduction preserves the first manifest creation timestamp.

`FREEZE.sha256` lists every frozen file's SHA-256 except its own. It includes the
manifest hash; the manifest lists the exact allowlist and artifact hashes.
Verification checks those hashes, exact files, baseline HANDOFF allowlist, source-to-cell reconstruction,
identity/block separation, seeded split reproduction and byte-for-byte feature
reproduction. No dataset refresh or rental import is performed.

## Source and limitations

Snapshot: 2026-10-02, Abu Dhabi metropolitan bounding box 24.30/54.28 to
24.62/54.72. Source query, timestamp and canonical raw/derived hashes are in
`source/osm-provenance.json`. Upstream raw source contained 4,229 public OSM
objects; its hash is recorded by the baseline owner, and `data/raw` is explicitly
excluded from this copy. The 3,958 categorized amenity objects form the cells.
There are 222 source place
markers, of which 199 have mapped objects in the inference circle.

Node/way representations may count the same real facility more than once.
Mapping is incomplete. Only occupied cells are modeled. Adjacent split blocks
can remain spatially correlated; there is no buffer or future-time holdout.
No rentals, listings, school quality, traffic or journey-time predictions.

Data and derived data: **© OpenStreetMap contributors, ODbL 1.0**. Retain
`LICENSE-DATA.md` and visible attribution when redistributing or displaying
derived records. This package does not modify the app or its deployment.
