# Rasikh experimental GPU amenity representation

Real local GPU training finished and was frozen at **15:18:19 Dubai on 2 October 2026**. The selected model is a 329-parameter `6 → 16 → 3 → 16 → 6` autoencoder with tanh hidden activations, linear bottleneck/output, Adam learning rate 0.005 and weight decay 0.001. Validation selected epoch 1080. Its standardized reconstruction MSE is **0.1050331965 on training** and **0.1042219773 on validation**. These figures concern amenity representation, not user preferences or rental predictions.

## Actual device and environment

The run used **NVIDIA GeForce RTX 4060 Laptop GPU**, **PyTorch 2.5.1+cu121** and the framework's **CUDA 12.1** runtime. `artifacts/device-proof.json` records the exact interpreter/package locations, Python/NumPy/cuDNN versions, driver output and GPU properties. A 1024×1024 float32 matrix multiplication and backward pass actually ran on `cuda:0`, with exact numerical verification and finite nonzero gradients.

Every model parameter, training/validation tensor, output, loss, gradient and Adam state tensor was checked on CUDA. The first optimizer step changed weights; device traces are in `artifacts/logs/*-first-step-device-proof.json`. CPU fallback raises an error. NumPy is used for integrity/preprocessing checks and exported inference verification; model fitting and optimizer updates use CUDA PyTorch.

An isolated `.venv` was initially prepared, but its 2.753 GB PyTorch 2.11/cu128 download stalled. The coordinator explicitly authorized using the existing CUDA-enabled installation directly. The owned download was stopped. **The completed run used that existing interpreter, not the unfinished isolated environment.** No framework was installed into the existing environment. Its relevant pinned dependency versions are saved in `artifacts/environment-lock.txt`. The abandoned setup environment and temporary files are excluded from the handoff.

## Data and holdout isolation

Use the sibling data package frozen under manifest SHA256 `3899e50f9368d6465bc4109a1070822eab5e3431f711cd887d2625dd9b015098`. It derives licensed public OpenStreetMap mapped-object counts in six ordered categories: schools, healthcare, groceries, parks, dining and transit.

The exact baseline split has 251 training, 59 validation and 56 test occupied approximate 1 km cells, grouped into 59/13/13 disjoint 3 km spatial blocks. The trainer verifies only permitted train/validation inputs and preprocessing/split/manifest metadata. It applies `log1p(counts)` with mean and population standard deviation fitted only on the 251 training cells. It checks their ordered IDs, blocks and normalization against the frozen data package. The trainer never opens `test.json`, `test.float32.npy`, named-area features, rental research files or all-cell baseline model weights.

`protocol.json` was sent to the independent evaluator before scoring. Exactly four candidates were run: hidden width 8 or 16 × weight decay 0 or 0.001, all with seed 7102026, full batch, at most 2500 epochs, validation every 10 epochs, and early stopping after 40 checks without a 1e-6 improvement. Actual lowest validation-error weights were retained; ties follow candidate order. No checkpoint was retuned or refitted on all cells after the freeze.

## Frozen outputs

- `artifacts/FREEZE.json`: all artifact, executed trainer/protocol and consumed data hashes; selection timestamp and holdout policy.
- `artifacts/selected-checkpoint.pt`: selected CUDA-trained PyTorch weights and constructor metadata.
- `artifacts/model-export.json`: identical weights as portable JSON, explicit out×in matrices, biases, encoder/decoder activations, train-only preprocessing and checkpoint/config/data hashes.
- `artifacts/selected-config.json`, `training-report.json`, candidate checkpoints and epoch logs: all four configurations, losses, chosen epochs and timings.
- `artifacts/replay-proof.json`: same seed, train-only GPU replay to epoch 1080 gave **bitwise-identical model tensors**.
- `artifacts/validation-parity-reference.json`: all 59 validation inputs and GPU output/latent references for independent portable inference checks, tolerance 1e-5.

Freeze SHA256: `382fb0a8deb73a2ae362adb3f29dcb6a135e48f9f7c4d48b74f1927802a61a5a`.

Selected model tensor SHA256: `8e1238174d41842049e251f849412cd768abdd0535ef70be5d20989bb2ab5eef`.

Training timings use synchronized wall-clock intervals. Candidate CUDA event timings are elapsed intervals including host logging/idle gaps, not sums of active GPU kernel durations. Replay reproducibility is established for this pinned environment and hardware.

## Verification and reproduction

From this training directory, the existing verified interpreter was used with:

```powershell
$env:PYTHONDONTWRITEBYTECODE = '1'
python train_gpu.py --probe-only --out probe-evidence
python train_gpu.py --out artifacts
python verify_training.py
```

`verify_training.py` checks frozen hashes, exact checkpoint/export float32 weights, independent NumPy float64 validation inference parity, CUDA training evidence and replay equality. It does not read test features. The independent evaluator owns heldout metrics, paired spatial-block uncertainty and any experimental package integration.

To reproduce in a fresh environment under this directory, install the pinned CUDA framework and dependency versions using the [official PyTorch CUDA 12.1 wheel index](https://pytorch.org/get-started/previous-versions/#v251):

```powershell
python -m venv .repro-venv
& .\.repro-venv\Scripts\python.exe -m pip install -r artifacts\environment-lock.txt --extra-index-url https://download.pytorch.org/whl/cu121
& .\.repro-venv\Scripts\python.exe train_gpu.py --out replay-artifacts
```

Existing frozen output directories cannot be overwritten. A reproduced checkpoint's canonical tensor hash is the comparison identity; serialized-container timestamps and wall timings need not be byte-identical.

## Scope and license

Data attribution: **© OpenStreetMap contributors**, derived under **ODbL-1.0**. Keep the sibling data manifest and license documentation with redistribution. Mapping is incomplete, only occupied cells are sampled, adjacent spatial blocks have no separating buffer, and the snapshot does not validate preference rankings, customer outcomes, facility quality, rents or journey times. This experiment does not establish GPU speed superiority over CPU PCA. Main app source, Git state, production deployment and cloud resources were untouched by this workstream.
