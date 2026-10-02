"""Independent fixed-split evaluation. Never trains/tunes the GPU checkpoint."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT.parent / "rasikh-recommender"
SEED = 7102026
FEATURES = ["schools", "healthcare", "groceries", "parks", "dining", "transit"]
EXPECTED_DATA_MANIFEST_SHA256 = "3899e50f9368d6465bc4109a1070822eab5e3431f711cd887d2625dd9b015098"


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def kmeans(x):
    rng, best = np.random.default_rng(SEED), None
    for _ in range(12):
        centers = x[rng.choice(len(x), 4, replace=False)].copy()
        for _ in range(100):
            labels = ((x[:, None] - centers[None]) ** 2).sum(axis=2).argmin(axis=1)
            new = np.array([x[labels == c].mean(axis=0) if np.any(labels == c) else x[rng.integers(len(x))] for c in range(4)])
            if np.allclose(centers, new):
                centers = new
                break
            centers = new
        inertia = float(((x[:, None] - centers[None]) ** 2).sum(axis=2).min(axis=1).sum())
        if best is None or inertia < best[0]:
            best = inertia, centers
    return best[1]


def forward(x, layers):
    value = np.asarray(x, dtype=np.float64)
    for layer in layers:
        weights = np.asarray(layer["weight"], dtype=np.float64)
        bias = np.asarray(layer["bias"], dtype=np.float64)
        if weights.ndim != 2 or weights.shape[1] != value.shape[-1] or weights.shape[0] != bias.shape[0]:
            raise ValueError("Invalid exported layer dimensions")
        value = value @ weights.T + bias
        activation = layer.get("activation", "linear")
        if activation == "relu":
            value = np.maximum(0, value)
        elif activation == "tanh":
            value = np.tanh(value)
        elif activation not in ("linear", "identity", "none"):
            raise ValueError(f"Unsupported activation: {activation}")
    if not np.isfinite(value).all():
        raise ValueError("Nonfinite inference output")
    return value


def bootstrap_difference(reference, candidate, blocks):
    names = sorted(set(blocks))
    groups = [np.flatnonzero(np.array(blocks) == name) for name in names]
    differences = reference - candidate
    sums = np.array([differences[g].sum() for g in groups])
    counts = np.array([len(g) for g in groups])
    means = sums / counts
    rng = np.random.default_rng(SEED)
    selected = rng.integers(len(groups), size=(10000, len(groups)))
    cell_weighted = sums[selected].sum(axis=1) / counts[selected].sum(axis=1)
    block_weighted = means[selected].mean(axis=1)
    return {
        "positive_difference_means_candidate_has_lower_error": True,
        "cell_weighted_mean_difference": float(differences.mean()),
        "cell_weighted_block_bootstrap_ci95": np.quantile(cell_weighted, [.025, .975]).tolist(),
        "equally_weighted_block_mean_difference": float(means.mean()),
        "equally_weighted_block_bootstrap_ci95": np.quantile(block_weighted, [.025, .975]).tolist(),
        "resamples": 10000, "seed": SEED, "blocks": len(groups),
        "scope": "Finite correlated spatial snapshot; interval is not a customer-outcome guarantee",
    }


def baseline_input():
    source = ROOT / "data/source"
    cells_path = source / "osm-training-cells.json" if source.exists() else BASE / "data/osm-training-cells.json"
    report_path = source / "osm-evaluation.json" if source.exists() else BASE / "models/osm-evaluation.json"
    cells, old = read(cells_path)["cells"], read(report_path)
    if len(cells) != 366 or len({c["cell_id"] for c in cells}) != len(cells):
        raise ValueError("Unexpected cell count or duplicate cell IDs")
    lookup = {c["cell_id"]: c for c in cells}
    all_objects = [identity for cell in cells for identity in cell["osm_ids"]]
    if len(set(all_objects)) != len(all_objects) or len(all_objects) != 3958:
        raise ValueError("Unexpected or duplicated object membership")
    for cell in cells:
        counts = np.asarray(cell["counts"])
        if counts.shape != (6,) or not np.isfinite(counts).all() or (counts < 0).any() or (counts != counts.astype(int)).any() or counts.sum() != len(cell["osm_ids"]):
            raise ValueError("Invalid cell count columns or object membership")
    splits = {name: [lookup[identity] for identity in old["splits"][name]] for name in ("train", "validation", "test")}
    if [len(splits[name]) for name in splits] != [251, 59, 56]:
        raise ValueError("Authoritative split differs from frozen protocol")
    checks = {}
    for field in ("cell_id", "spatial_block", "osm_ids"):
        sets = {name: set(v for c in rows for v in (c[field] if field == "osm_ids" else [c[field]])) for name, rows in splits.items()}
        checks[f"disjoint_{field}"] = all(sets[a].isdisjoint(sets[b]) for a, b in (("train", "validation"), ("train", "test"), ("validation", "test")))
    checks["all_cells_assigned_once"] = set(lookup) == set(v for name in splits for v in old["splits"][name]) and sum(map(len, splits.values())) == len(cells)
    if not all(checks.values()):
        raise ValueError(f"Split leakage detected: {checks}")
    logs = {name: np.log1p(np.array([c["counts"] for c in rows], dtype=np.float64)) for name, rows in splits.items()}
    mean = logs["train"].mean(axis=0)
    scale = logs["train"].std(axis=0)
    scale = np.where(scale > 0, scale, 1)
    z = {name: (x - mean) / scale for name, x in logs.items()}
    _, _, vt = np.linalg.svd(z["train"], full_matrices=False)
    components = vt[:3]
    centers = kmeans(z["train"])
    return cells, old, splits, checks, logs, z, mean, scale, components, centers


def verify_packaged_data(old, splits, logs, z, mean, scale):
    manifest_path = ROOT / "data/manifest.json"
    if digest(manifest_path) != EXPECTED_DATA_MANIFEST_SHA256:
        raise ValueError("Data manifest differs from data owner's pre-training freeze")
    manifest = read(manifest_path)
    for name, expected in manifest["artifacts_sha256"].items():
        if digest(ROOT / "data" / name) != expected:
            raise ValueError(f"Frozen data artifact changed: {name}")
    preprocess_path = ROOT / "data/preprocessing.json"
    preprocess = read(preprocess_path)
    if preprocess["feature_names"] != FEATURES or preprocess["fitted_split"] != "train" or preprocess["fitted_cell_count"] != 251 or preprocess["std_ddof"] != 0:
        raise ValueError("Incorrect packaged transform metadata")
    for key, values in (("mean", mean), ("scale", scale)):
        if not np.allclose(preprocess[key], values, rtol=0, atol=1e-12):
            raise ValueError(f"Packaged {key} differs from training-only derivation")
    for name in ("train", "validation", "test"):
        package = read(ROOT / f"data/{name}.json")
        if package["feature_names"] != FEATURES or package["cell_ids"] != old["splits"][name] or package["spatial_blocks"] != [c["spatial_block"] for c in splits[name]]:
            raise ValueError(f"Packaged {name} feature order or row/block ordering differs")
        for key, reference in (("counts", [c["counts"] for c in splits[name]]), ("log_features", logs[name]), ("standardized_features", z[name])):
            actual = np.asarray(package[key], dtype=np.float64)
            if actual.shape != np.asarray(reference).shape or not np.isfinite(actual).all() or not np.allclose(actual, reference, rtol=0, atol=1e-12):
                raise ValueError(f"Packaged {name}/{key} differs from independent derivation")
    return preprocess


def validate_export(path, mean, scale):
    export = read(path)
    if export["features"] != FEATURES or export["input_dim"] != 6 or export["output_dim"] != 6 or export["bottleneck_dim"] != 3 or export["trained_device"] != "cuda:0":
        raise ValueError("GPU export differs from frozen feature/device/architecture contract")
    if export["candidate"]["hidden_width"] not in (8, 16) or export["candidate"]["weight_decay"] not in (0, .001):
        raise ValueError("GPU candidate outside frozen experiment")
    prep = export["preprocessing"]
    if prep["feature_names"] != FEATURES or prep["fit_split"] != "train" or prep["fit_rows"] != 251 or prep["ddof"] != 0 or prep["transform"] != "log1p(counts)":
        raise ValueError("GPU preprocessing metadata mismatch")
    for key, values in (("mean", mean), ("scale", scale)):
        if np.shape(prep[key]) != (6,) or not np.allclose(prep[key], values, rtol=0, atol=1e-12):
            raise ValueError(f"GPU preprocessing {key} mismatch")
    encoder, decoder = export["encoder"], export["decoder"]
    if len(encoder) != 2 or len(decoder) != 2:
        raise ValueError("GPU encoder/decoder must each have two dense layers")
    width = export["candidate"]["hidden_width"]
    for layer, shape, activation in zip(encoder + decoder, ((width, 6), (3, width), (width, 3), (6, width)), ("tanh", "linear", "tanh", "linear")):
        weights, bias = np.asarray(layer["weight"]), np.asarray(layer["bias"])
        if weights.shape != shape or bias.shape != (shape[0],) or layer["activation"] != activation or layer["weight_layout"] != "out_features x in_features" or not np.isfinite(weights).all() or not np.isfinite(bias).all():
            raise ValueError("Invalid exported weights, bias, layout or activation")
    for name in ("train.json", "validation.json", "preprocessing.json", "split.json", "manifest.json"):
        if export["data_sha256"][name] != digest(ROOT / "data" / name):
            raise ValueError(f"GPU data hash mismatch: {name}")
    if export["preprocessing_sha256"] != digest(ROOT / "data/preprocessing.json") or export["split_sha256"] != digest(ROOT / "data/split.json"):
        raise ValueError("GPU preprocessing/split digest mismatch")
    return export


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--export", type=Path, help="Frozen JSON export selected on validation only")
    parser.add_argument("--freeze-export", type=Path, help="Capture selected export hashes without GPU test scoring")
    parser.add_argument("--output", type=Path, default=ROOT / "evaluation/report.json")
    args = parser.parse_args()
    if args.export:
        args.export = args.export.resolve()
    if args.freeze_export:
        args.freeze_export = args.freeze_export.resolve()
    cells, old, splits, checks, logs, z, mean, scale, components, centers = baseline_input()
    source = ROOT / "data/source"
    paths = [source / name for name in ("osm-training-cells.json", "osm-evaluation.json", "osm-provenance.json")] if source.exists() else [BASE / "data/osm-training-cells.json", BASE / "models/osm-evaluation.json", BASE / "models/osm-provenance.json"]
    paths.append(ROOT / "evaluation/protocol.json")
    if args.export or args.freeze_export:
        verify_packaged_data(old, splits, logs, z, mean, scale)
    if args.freeze_export:
        export = validate_export(args.freeze_export, mean, scale)
        artifacts = args.freeze_export.parent
        checkpoint, config = artifacts / "selected-checkpoint.pt", artifacts / "selected-config.json"
        # Artifact names are agreed with trainer before scoring; never infer a
        # different file based on better test performance.
        if digest(checkpoint) != export["checkpoint_sha256"] or digest(config) != export["config_sha256"]:
            raise ValueError("Checkpoint/config digest does not match selected export")
        trainer_freeze = read(artifacts / "FREEZE.json")
        if digest(artifacts / "FREEZE.json") != "382fb0a8deb73a2ae362adb3f29dcb6a135e48f9f7c4d48b74f1927802a61a5a" or digest(args.freeze_export) != "688edea11afc5a926b3f5794efd35749ee8ab4d9c2dde5b7957f9a567a9cdf8a":
            raise ValueError("Trainer's announced pretest freeze identity differs")
        if trainer_freeze["test_used_for_selection"] is not False or trainer_freeze["selected_candidate"] != export["candidate"]["id"] or trainer_freeze["selected_epoch"] != export["selected_epoch"]:
            raise ValueError("Trainer freeze selection does not match export")
        for name, expected in trainer_freeze["artifact_sha256"].items():
            if digest(artifacts / name) != expected:
                raise ValueError(f"Trainer frozen artifact changed: {name}")
        for name, expected in trainer_freeze["source_sha256"].items():
            if digest(ROOT / "training" / name) != expected:
                raise ValueError(f"Trainer source changed: {name}")
        training = read(artifacts / "training-report.json")
        selected = min(enumerate(training["candidates"]), key=lambda pair: (pair[1]["validation_mse"], pair[0]))[1]
        if len(training["candidates"]) != 4 or selected["id"] != export["candidate"]["id"] or selected["best_epoch"] != export["selected_epoch"] or training["test_feature_rows_read"] != 0 or training["external_test_results_seen_before_freeze"] is not False:
            raise ValueError("GPU checkpoint was not frozen by agreed validation-only selection")
        freeze = {"captured_at_utc": datetime.now(timezone.utc).isoformat(), "protocol_sha256": digest(ROOT / "evaluation/protocol.json"), "gpu_export_sha256": digest(args.freeze_export), "checkpoint_sha256": digest(checkpoint), "config_sha256": digest(config), "candidate": export["candidate"], "selected_epoch": export["selected_epoch"], "captured_before_gpu_holdout_scoring": True, "file_sha256": {str(p.relative_to(ROOT)).replace("\\", "/"): digest(p) for p in [args.freeze_export, checkpoint, config, ROOT / "data/preprocessing.json", ROOT / "data/split.json", artifacts / "validation-parity-reference.json", artifacts / "FREEZE.json"]}}
        save(ROOT / "evaluation/selected-freeze.json", freeze)
        print(json.dumps({"status": "Selected checkpoint frozen; GPU holdout not scored", "export_sha256": freeze["gpu_export_sha256"]}))
        return
    report = {
        "schema_version": 1, "scope": "independent unsupervised representation evaluation; experimental amenity matching unvalidated",
        "numpy_version": np.__version__, "protocol_sha256": digest(ROOT / "evaluation/protocol.json"),
        "input_file_sha256": {str(p.relative_to(ROOT.parent)).replace("\\", "/"): digest(p) for p in paths},
        "features": FEATURES, "split_cell_counts": {k: len(v) for k, v in splits.items()},
        "split_block_counts": {k: len({c["spatial_block"] for c in v}) for k, v in splits.items()},
        "split_audit": checks, "preprocessing": {"mean": mean.tolist(), "scale": scale.tolist(), "fit_split": "train", "ddof": 0, "transform": "log1p"},
        "metric": "mean squared error across cells and six standardized features", "metrics": {},
        "provenance": read(paths[2]),
        "limitations": old["limitations"] + ["GPU versus PCA reconstruction compares representation only; no recommendation-ranking or customer satisfaction validation.", "Named-place 1.5km-circle densities have different spatial support from occupied 1km training cells."]
    }
    per = {}
    for name in ("validation", "test"):
        values = z[name]
        pca_error = np.mean((values - (values @ components.T) @ components) ** 2, axis=1)
        mean_error = np.mean(values ** 2, axis=1)
        cluster_error = ((values[:, None] - centers[None]) ** 2).sum(axis=2).min(axis=1)
        single_error = ((values - z["train"].mean(axis=0)) ** 2).sum(axis=1)
        per[name] = {"pca": pca_error, "train_mean": mean_error, "kmeans_four": cluster_error, "single_centroid": single_error}
        report["metrics"][name] = {"rows": len(values), "pca_reconstruction_mse": float(pca_error.mean()), "train_mean_reconstruction_mse": float(mean_error.mean()), "kmeans_four_centroid_squared_distance": float(cluster_error.mean()), "single_centroid_squared_distance": float(single_error.mean())}
    report["cpu_report_reproduction"] = {"pca_test_absolute_difference": abs(report["metrics"]["test"]["pca_reconstruction_mse"] - old["test"]["pca_standardized_reconstruction_mse"]), "kmeans_test_absolute_difference": abs(report["metrics"]["test"]["kmeans_four_centroid_squared_distance"] - old["kmeans_test"]["four_centroid_squared_distance"])}
    comparisons = [(report["metrics"][name][key], old[name][reference]) for name in ("validation", "test") for key, reference in (("pca_reconstruction_mse", "pca_standardized_reconstruction_mse"), ("train_mean_reconstruction_mse", "training_mean_baseline_mse"))]
    comparisons += [(report["metrics"]["test"][key], old["kmeans_test"][reference]) for key, reference in (("kmeans_four_centroid_squared_distance", "four_centroid_squared_distance"), ("single_centroid_squared_distance", "one_centroid_baseline_squared_distance"))]
    if any(abs(actual - expected) > 1e-10 for actual, expected in comparisons):
        raise ValueError("CPU frozen metric reproduction failed")
    blocks = [c["spatial_block"] for c in splits["test"]]
    report["paired_test_uncertainty"] = {"mean_minus_pca": bootstrap_difference(per["test"]["train_mean"], per["test"]["pca"], blocks), "single_minus_four_centroids": bootstrap_difference(per["test"]["single_centroid"], per["test"]["kmeans_four"], blocks)}
    if args.export:
        frozen = read(ROOT / "evaluation/selected-freeze.json")
        if frozen["protocol_sha256"] != digest(ROOT / "evaluation/protocol.json") or frozen["gpu_export_sha256"] != digest(args.export):
            raise ValueError("Protocol or selected export changed after freeze")
        for name, expected in frozen["file_sha256"].items():
            if digest(ROOT / name) != expected:
                raise ValueError(f"Frozen artifact changed: {name}")
        export = validate_export(args.export, mean, scale)
        layers = export["encoder"] + export["decoder"]
        parity = read(args.export.parent / "validation-parity-reference.json")
        if parity["cell_ids"] != old["splits"]["validation"]:
            raise ValueError("Validation fixture IDs differ from frozen validation rows")
        parity_input = np.asarray(parity["standardized_input"], dtype=np.float64)
        if parity_input.shape != z["validation"].shape or not np.allclose(parity_input, z["validation"], rtol=0, atol=2e-6):
            raise ValueError("Validation CUDA fixture inputs differ")
        parity_output = np.asarray(parity["reconstructed_standardized"], dtype=np.float64)
        parity_latent = np.asarray(parity["encoded"], dtype=np.float64)
        if not np.isfinite(parity_output).all() or not np.isfinite(parity_latent).all():
            raise ValueError("Nonfinite validation fixture output")
        prediction = forward(parity_input, layers)
        embedding = forward(parity_input, export["encoder"])
        if parity_output.shape != prediction.shape or parity_latent.shape != embedding.shape:
            raise ValueError("Validation CUDA fixture output shape mismatch")
        max_error = float(np.max(np.abs(prediction - parity_output)))
        latent_error = float(np.max(np.abs(embedding - parity_latent)))
        if max_error > 2e-5 or latent_error > 2e-5:
            raise ValueError("JSON-export inference differs from CUDA validation fixtures")
        report["export_validation_parity"] = {"rows": 59, "reconstruction_max_absolute_error": max_error, "embedding_max_absolute_error": latent_error, "tolerance": 2e-5}
        report["selected_freeze_sha256"] = digest(ROOT / "evaluation/selected-freeze.json")
        report["gpu_export_sha256"] = digest(args.export)
        for name in ("validation", "test"):
            reconstructed = forward(z[name], layers)
            if reconstructed.shape != z[name].shape:
                raise ValueError("GPU output feature dimensions mismatch")
            error = np.mean((z[name] - reconstructed) ** 2, axis=1)
            per[name]["gpu"] = error
            report["metrics"][name]["gpu_autoencoder_reconstruction_mse"] = float(error.mean())
        report["paired_test_uncertainty"]["pca_minus_gpu"] = bootstrap_difference(per["test"]["pca"], per["test"]["gpu"], blocks)
        report["paired_test_uncertainty"]["mean_minus_gpu"] = bootstrap_difference(per["test"]["train_mean"], per["test"]["gpu"], blocks)
        report["gpu_status"] = "Frozen export evaluated independently; actual GPU training proof audited separately"
    else:
        report["gpu_status"] = "Awaiting frozen validation-selected GPU export; CPU baselines only"
    save(args.output, report)
    save(ROOT / "evaluation/cpu-train-baselines.json", {"features": FEATURES, "fit_split": "train", "mean": mean.tolist(), "scale": scale.tolist(), "pca_components": components.tolist(), "kmeans_centers": centers.tolist()})
    save(ROOT / "evaluation/per-cell-errors.json", {name: [{"cell_id": c["cell_id"], "spatial_block": c["spatial_block"], **{key: float(value[i]) for key, value in per[name].items()}} for i, c in enumerate(splits[name])] for name in ("validation", "test")})
    print(json.dumps({"output": str(args.output), "gpu_status": report["gpu_status"], "test": report["metrics"]["test"], "reproduction": report["cpu_report_reproduction"]}))


if __name__ == "__main__":
    main()
