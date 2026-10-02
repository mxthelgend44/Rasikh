Rasikh experimental GPU amenity representation

This separate package evaluates a small GPU-trained representation of six
OpenStreetMap mapped amenity features. The Node adapter provides experimental
amenity matching based on explicit user choices. It has no rent, listing, quality,
journey-time or customer-satisfaction target labels, and is not an official
housing recommendation service. The verified core app release is independent.

Portable use (Node 22+, no install, GPU, Python, cloud or network required):
  npm test
  npm run demo
  import { recommend, metadata } from './index.mjs';
  recommend({ preferences: { schools: .8, groceries: 1, parks: .8 }, limit: 3 });
  Optional office: {latitude,longitude}, commuteWeight:0..1 adds only a
  straight-line distance tradeoff. It never predicts commute minutes.

Model and evaluation:
  The trainer uses actual local CUDA, tanh hidden layers, a linear 3-dimensional
  bottleneck, and validation-only selection among four predeclared candidates.
  No all-cell refit or test-directed tuning. Training files contain source,
  protocol, logs, device/gradient/optimizer evidence, replay and checkpoint hashes.
  evaluation/selected-freeze.json captures selected artifacts before GPU test
  scoring. evaluation/report.json records the independent final comparison.
  evaluation/gpu-audit.json audits actual CUDA evidence and export tensor hashes.
  evaluation/runtime-model.json contains portable weights, train-fitted transform,
  named-area candidates, provenance and validation parity fixtures.

  Independent baseline reconstruction on the identical 56 heldout cells:
  train-only rank3 PCA MSE 0.21892617726073668; train-mean MSE0.6826315923816707.
  Four-centroid KMeans squared distance2.5849332114238286;
  single-centroid squared distance4.095789554290024.
  Frozen selected GPU autoencoder heldout MSE0.14109884282344806.
  Paired PCA-minus-GPU cell-weighted MSE difference0.0778273344372886;
  95% whole-block bootstrap interval[0.04230045430661165,0.12000785840650494].
  This lower snapshot reconstruction error does not validate the recommendation
  ranking heuristic or establish customer satisfaction/housing accuracy.
  Actual device: NVIDIA GeForce RTX4060 Laptop; PyTorch2.5.1+cu121/CUDA12.1.
  Selected6->16->3->16->6 model has329parameters, Adamweight_decay.001,
  epoch1080, validation MSE0.10422197729349136. Same-environment selected-run
  replay matched the canonical weight hash bitwise. Full CUDA validation export
  parity over59rows differed by at most4.95e-7; all6Node tests passed.
  Reconstruction MSE averages all six standardized features; centroid distance
  sums their squared errors. These are separate metrics, not comparable scores.
  The authoritative 251/59/56 split uses 59/13/13 disjoint spatial blocks.
  All transforms fit only training cells. PCA/KMeans shipping baseline models
  were all-cell refits, so the independent evaluator recomputes train-only fits.
  Paired 10000-resample intervals resample complete heldout blocks, seed7102026.
  Both cell-weighted and equally weighted block estimands are explicitly labelled.

Reproduce existing verification:
  python data/prepare.py --verify
  python evaluation/evaluate.py --export training/artifacts/model-export.json
  python evaluation/prepare_runtime.py
  numpy is needed only for evaluation; no PyTorch dependency for Node inference.
  See training instructions for the isolated pinned CUDA training environment.
  Do not retrain or select a different model based on observed test results.

Ranking rules and limitations:
  A preference value0..1 shifts a feature's target from the training log-count
  mean toward the training 90th percentile. Missing preferences use0. The encoder
  compares named-place density embeddings to that target, scaled by training
  latent standard deviations. Index100/(1+RMSgap) is a heuristic, not a probability.
  Optional straight-line distance uses100/(1+km/10) with the user's chosen weight.
  These rules and preferences are not learned from user feedback.
  Occupied approximate1km cells are the training unit; named-area features are
  densities inside1.5km circles around OSM markers. Different spatial support
  creates distribution shift; heldout reconstruction does not validate named-area
  ranking. Place markers are not neighborhood boundaries. Mapping is incomplete,
  objects can refer to the same physical facility, and no unrecorded object proves
  absence. There is no buffer between adjacent blocks or future-time validation.
  No metric here establishes recommendation satisfaction or housing accuracy.
  The unverified rental-index cache and predictions are excluded from shipping.

Data attribution:
  © OpenStreetMap contributors. Derived data remains under ODbL-1.0.
  https://www.openstreetmap.org/copyright
  https://opendatacommons.org/licenses/odbl/1-0/
  Retain visible attribution and license links when showing output, and include
  data/LICENSE-DATA.md with redistributed data. No source/provider endorsement.
  Full source query/time/canonical hashes are in data/source/osm-provenance.json.
  Exact shipping files and SHA256 hashes are in evaluation/HANDOFF.json.
  Only the allowlisted files may ship; never copy the trainer's local environment.
