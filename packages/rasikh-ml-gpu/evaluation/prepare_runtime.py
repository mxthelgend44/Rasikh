"""Audit frozen CUDA evidence and create portable inference artifact. No fitting."""
import hashlib
import json
from pathlib import Path
import numpy as np
from evaluate import ROOT, FEATURES, read, digest, save, forward


def tensor_hash(export):
    state = {}
    for layer in export["encoder"] + export["decoder"]:
        state[layer["name"] + ".weight"] = np.asarray(layer["weight"], dtype="<f4")
        state[layer["name"] + ".bias"] = np.asarray(layer["bias"], dtype="<f4")
    result = hashlib.sha256()
    for name, values in sorted(state.items()):
        result.update(name.encode("utf-8") + b"\0")
        result.update(json.dumps(list(values.shape), separators=(",", ":")).encode("ascii") + b"\0")
        result.update(values.tobytes(order="C"))
    return result.hexdigest()


def main():
    artifacts = ROOT / "training/artifacts"
    export = read(artifacts / "model-export.json")
    selected = read(ROOT / "evaluation/selected-freeze.json")
    report = read(ROOT / "evaluation/report.json")
    if report["gpu_export_sha256"] != digest(artifacts / "model-export.json") or report["selected_freeze_sha256"] != digest(ROOT / "evaluation/selected-freeze.json"):
        raise ValueError("Independent report does not reference frozen selected export")
    for name, expected in selected["file_sha256"].items():
        if digest(ROOT / name) != expected:
            raise ValueError(f"Artifact changed after independent evaluation: {name}")
    trainer_freeze = read(artifacts / "FREEZE.json")
    for name, expected in trainer_freeze["artifact_sha256"].items():
        if digest(artifacts / name) != expected:
            raise ValueError(f"Trainer artifact changed after freeze: {name}")
    device = read(artifacts / "device-proof.json")
    if device["cuda_available"] is not True or device["device"] != "cuda:0" or device["finite_nonzero_cuda_gradient"] is not True or device["max_abs_error_against_twice_input"] != 0 or any(value != "cuda:0" for value in device["tensor_devices"].values()):
        raise ValueError("Actual CUDA matrix/backward proof incomplete")
    training = read(artifacts / "training-report.json")
    traces = []
    for candidate in training["candidates"]:
        proof = read(artifacts / candidate["device_proof"])
        values = [proof[key] for key in ("input_device", "validation_input_device", "output_device", "loss_device")]
        values += list(proof["parameter_devices"].values()) + list(proof["gradient_devices"].values())
        values += [value for row in proof["optimizer_state_devices"] for value in row["tensors"].values()]
        if not values or any(value != "cuda:0" for value in values) or proof["first_gradient_l2_norm"] <= 0 or max(proof["first_step_max_abs_parameter_change"].values()) <= 0:
            raise ValueError("CUDA model/gradient/optimizer training proof incomplete")
        log = [json.loads(line) for line in (artifacts / candidate["log"]).read_text().splitlines()]
        best = min(log, key=lambda value: value["validation_mse"])
        if best["epoch"] != candidate["best_epoch"] or best["validation_mse"] != candidate["validation_mse"] or any(value["device"] != "cuda:0" for value in log):
            raise ValueError("Training log and selected validation checkpoint differ")
        traces.append({"id": candidate["id"], "best_epoch": best["epoch"], "validation_mse": best["validation_mse"], "first_gradient_l2_norm": proof["first_gradient_l2_norm"], "maximum_first_step_parameter_change": max(proof["first_step_max_abs_parameter_change"].values()), "all_parameter_gradient_optimizer_tensor_devices": "cuda:0"})
    canonical_tensor = tensor_hash(export)
    replay = read(artifacts / "replay-proof.json")
    if canonical_tensor != export["tensor_sha256"] or canonical_tensor != trainer_freeze["selected_tensor_sha256"] or replay["expected_tensor_sha256"] != canonical_tensor or replay["replay_tensor_sha256"] != canonical_tensor or replay["bitwise_tensor_hash_match"] is not True or replay["max_abs_parameter_difference"] != 0:
        raise ValueError("Exported tensor hash and deterministic replay do not agree")
    audit = {
        "status": "actual_local_cuda_training_evidence_verified",
        "gpu_name": device["gpu_name"], "pytorch": device["pytorch"], "cuda_runtime": device["pytorch_cuda_runtime"],
        "actual_matrix_and_backward_device": device["device"], "kernel_and_backward_ms": device["cuda_event_kernel_and_backward_ms"],
        "candidate_traces": traces, "selected_candidate": export["candidate"], "selected_epoch": export["selected_epoch"],
        "checkpoint_sha256": export["checkpoint_sha256"], "export_sha256": digest(artifacts / "model-export.json"), "canonical_tensor_sha256": canonical_tensor,
        "trainer_freeze_sha256": digest(artifacts / "FREEZE.json"), "device_proof_sha256": digest(artifacts / "device-proof.json"),
        "replay_bitwise_tensor_hash_match": True,
        "train_rows": 251, "validation_rows": 59, "trainer_test_feature_rows_read": training["test_feature_rows_read"],
        "training_replay_and_export_wall_seconds": training["training_replay_and_export_wall_seconds"],
        "peak_cuda_allocated_bytes": training["peak_cuda_allocated_bytes"],
        "proof_scope": "Executed CUDA matrix/backprop check, candidate training device assertions/traces and parameter changes, frozen hashes and deterministic selected-weight replay; no CPU fallback. Source inspected for explicit train/validation-only file reads. No performance-speed or recommendation-quality claim."
    }
    save(ROOT / "evaluation/gpu-audit.json", audit)
    train = read(ROOT / "data/train.json")
    validation = read(ROOT / "data/validation.json")
    parity = read(artifacts / "validation-parity-reference.json")
    latent = forward(train["standardized_features"], export["encoder"])
    latent_scale = latent.std(axis=0)
    latent_scale = np.where(latent_scale > 1e-12, latent_scale, 1)
    runtime = {
        "schema_version": 1, "experimental": True, "features": FEATURES,
        "encoder": export["encoder"], "decoder": export["decoder"], "preprocessing": export["preprocessing"],
        "target_log_features": np.quantile(np.asarray(train["log_features"]), .9, axis=0).tolist(),
        "latent_scale": latent_scale.tolist(),
        "ranking_heuristic": "User importance shifts train log-feature means toward train 90th percentiles; compare GPU encoder embeddings with train-only latent population std scaling; index100/(1+RMSgap). Optional straight-line distance index100/(1+km/10) blended by explicit user weight. No outcome calibration.",
        "areas": read(ROOT / "data/named-areas.json")["areas"],
        "provenance": read(ROOT / "data/source/osm-provenance.json"),
        "model": {"kind": "experimental_gpu_trained_amenity_autoencoder", "architecture": [6, export["candidate"]["hidden_width"], 3, export["candidate"]["hidden_width"], 6], "candidate": export["candidate"], "trained_device": "cuda:0", "gpu_name": device["gpu_name"], "checkpoint_sha256": export["checkpoint_sha256"], "export_sha256": digest(artifacts / "model-export.json"), "tensor_sha256": canonical_tensor},
        "evaluation": {"test": report["metrics"]["test"], "paired_pca_minus_gpu": report["paired_test_uncertainty"]["pca_minus_gpu"], "scope": "Unsupervised occupied-cell reconstruction; named-area recommendations unvalidated"},
        "artifact_sha256": {"data_manifest": digest(ROOT / "data/manifest.json"), "preprocessing": digest(ROOT / "data/preprocessing.json"), "split": digest(ROOT / "data/split.json"), "independent_report": digest(ROOT / "evaluation/report.json"), "gpu_audit": digest(ROOT / "evaluation/gpu-audit.json")},
        "parity_fixtures": [{"cell_id": validation["cell_ids"][i], "counts": validation["counts"][i], "reconstruction": parity["reconstructed_standardized"][i], "embedding": parity["encoded"][i]} for i in range(5)]
    }
    save(ROOT / "evaluation/runtime-model.json", runtime)
    print(json.dumps({"status": audit["status"], "gpu": audit["gpu_name"], "runtime_sha256": digest(ROOT / "evaluation/runtime-model.json"), "areas": len(runtime["areas"])}))


if __name__ == "__main__":
    main()
