"""Read-only artifact checks and validation inference parity. No test features."""
import hashlib
import json
from pathlib import Path
import numpy as np
import torch

ROOT = Path(__file__).resolve().parent
ARTIFACTS = ROOT / "artifacts"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def forward(values, layers):
    for layer in layers:
        weight, bias = np.asarray(layer["weight"], dtype=np.float64), np.asarray(layer["bias"], dtype=np.float64)
        assert weight.ndim == 2 and weight.shape[1] == values.shape[1]
        assert bias.shape == (weight.shape[0],) and np.isfinite(weight).all() and np.isfinite(bias).all()
        values = values @ weight.T + bias
        assert layer["activation"] in ["linear", "tanh"]
        if layer["activation"] == "tanh":
            values = np.tanh(values)
    return values


def main():
    frozen = read(ARTIFACTS / "FREEZE.json")
    for relative, digest in frozen["artifact_sha256"].items():
        assert sha(ARTIFACTS / relative) == digest, relative
    for relative, digest in frozen["source_sha256"].items():
        assert sha(ROOT / relative) == digest, relative
    for relative, digest in frozen["data_sha256"].items():
        assert sha(ROOT.parent / "data" / relative) == digest, relative
    exported = read(ARTIFACTS / "model-export.json")
    checkpoint = torch.load(ARTIFACTS / "selected-checkpoint.pt", map_location="cpu", weights_only=True)
    for layer in exported["encoder"] + exported["decoder"]:
        for field in ["weight", "bias"]:
            actual = checkpoint["state_dict"][f"{layer['name']}.{field}"].numpy()
            assert np.array_equal(actual, np.array(layer[field], dtype=np.float32)), layer["name"]
    reference = read(ARTIFACTS / "validation-parity-reference.json")
    values = np.array(reference["standardized_input"], dtype=np.float64)
    encoded = forward(values, exported["encoder"])
    reconstructed = forward(encoded, exported["decoder"])
    encoder_difference = float(np.abs(encoded - np.array(reference["encoded"])).max())
    decoder_difference = float(np.abs(reconstructed - np.array(reference["reconstructed_standardized"])).max())
    assert max(encoder_difference, decoder_difference) < reference["absolute_tolerance"]
    proof = read(ARTIFACTS / "device-proof.json")
    step = read(ARTIFACTS / "logs/h16_wd001-first-step-device-proof.json")
    assert proof["device"] == "cuda:0" and proof["finite_nonzero_cuda_gradient"]
    assert all(device == "cuda:0" for device in proof["tensor_devices"].values())
    assert all(device == "cuda:0" for device in step["parameter_devices"].values())
    assert all(device == "cuda:0" for device in step["gradient_devices"].values())
    assert all(device == "cuda:0" for row in step["optimizer_state_devices"] for device in row["tensors"].values())
    assert step["first_gradient_l2_norm"] > 0 and max(step["first_step_max_abs_parameter_change"].values()) > 0
    replay = read(ARTIFACTS / "replay-proof.json")
    assert replay["bitwise_tensor_hash_match"] and replay["max_abs_parameter_difference"] == 0
    report = read(ARTIFACTS / "training-report.json")
    assert report["test_feature_rows_read"] == 0 and len(report["candidates"]) == 4
    assert frozen["test_used_for_selection"] is False
    print(json.dumps({"passed": True, "freeze_sha256": sha(ARTIFACTS / "FREEZE.json"), "frozen_artifacts_verified": len(frozen["artifact_sha256"]), "source_hashes_verified": len(frozen["source_sha256"]), "data_metadata_and_allowed_input_hashes_verified": len(frozen["data_sha256"]), "checkpoint_export_weights_exact_float32_match": True, "validation_rows": len(values), "validation_encoder_max_abs_difference": encoder_difference, "validation_reconstruction_max_abs_difference": decoder_difference, "parity_tolerance": reference["absolute_tolerance"], "cuda_model_gradient_optimizer_proof_valid": True, "same_seed_cuda_replay_bitwise_match": True, "test_feature_files_opened": 0}, indent=2))


if __name__ == "__main__":
    main()
