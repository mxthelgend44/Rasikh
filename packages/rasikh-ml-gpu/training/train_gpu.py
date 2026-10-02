"""Bounded CUDA-only amenity representation experiment. Never opens test.json."""
from __future__ import annotations

import os
os.environ["CUBLAS_WORKSPACE_CONFIG"] = ":4096:8"
os.environ["PYTHONDONTWRITEBYTECODE"] = "1"

import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform
import random
import subprocess
import sys
import time
import traceback
import warnings

import numpy as np
import torch
from torch import nn

ROOT = Path(__file__).resolve().parent
FEATURES = ["schools", "healthcare", "groceries", "parks", "dining", "transit"]
EXPECTED_DATA_MANIFEST_SHA256 = "3899e50f9368d6465bc4109a1070822eab5e3431f711cd887d2625dd9b015098"


def save(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=True, allow_nan=False) + "\n", encoding="utf-8")


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def sha(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tensor_hash(state):
    digest = hashlib.sha256()
    for name, tensor in sorted(state.items()):
        arr = tensor.detach().cpu().contiguous().numpy().astype("<f4", copy=False)
        digest.update(name.encode("utf-8") + b"\0")
        digest.update(json.dumps(list(arr.shape), separators=(",", ":")).encode("ascii") + b"\0")
        digest.update(arr.tobytes(order="C"))
    return digest.hexdigest()


def seed_everything(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def cuda_settings():
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable: CPU fallback is forbidden")
    torch.use_deterministic_algorithms(True, warn_only=False)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True
    torch.backends.cuda.matmul.allow_tf32 = False
    torch.backends.cudnn.allow_tf32 = False
    torch.set_float32_matmul_precision("highest")
    return torch.device("cuda:0")


def require_cuda(*tensors):
    for tensor in tensors:
        if tensor.device.type != "cuda":
            raise RuntimeError(f"CPU fallback detected: {tensor.device}")


def probe_cuda(out: Path):
    """Execute a real CUDA GEMM and autograd kernel, then read back the result."""
    device = cuda_settings()
    seed_everything(7102026)
    props = torch.cuda.get_device_properties(device)
    started = time.perf_counter()
    a = torch.arange(1024 * 1024, device=device, dtype=torch.float32).reshape(1024, 1024) / (1024 * 1024)
    a.requires_grad_(True)
    b = torch.eye(1024, device=device, dtype=torch.float32) * 2
    torch.cuda.synchronize()
    start_event, end_event = torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True)
    start_event.record()
    result = a @ b
    loss = result.square().mean()
    loss.backward()
    end_event.record()
    torch.cuda.synchronize()
    require_cuda(a, b, result, a.grad, loss)
    expected_error = (result.detach() - 2 * a.detach()).abs().max().item()
    if expected_error != 0 or not torch.isfinite(a.grad).all().item() or a.grad.abs().sum().item() == 0:
        raise RuntimeError("Actual CUDA GEMM/backprop verification failed")
    info = {
        "executed_at_utc": datetime.now(timezone.utc).isoformat(),
        "python": sys.version,
        "python_executable": sys.executable,
        "platform": platform.platform(),
        "pytorch": torch.__version__,
        "pytorch_package_path": torch.__file__,
        "numpy_version": np.__version__,
        "numpy_package_path": np.__file__,
        "environment_choice": "Explicitly authorized reuse of existing CUDA-enabled installation; initial isolated 2.11/cu128 download abandoned",
        "pytorch_cuda_runtime": torch.version.cuda,
        "cudnn": torch.backends.cudnn.version(),
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": props.name,
        "gpu_total_memory_bytes": props.total_memory,
        "gpu_compute_capability": [props.major, props.minor],
        "device": str(device),
        "tensor_devices": {"input": str(a.device), "multiplier": str(b.device), "output": str(result.device), "gradient": str(a.grad.device), "loss": str(loss.device)},
        "kernel": "1024x1024 float32 matrix multiplication and squared-mean backward",
        "max_abs_error_against_twice_input": expected_error,
        "finite_nonzero_cuda_gradient": True,
        "loss": loss.item(),
        "cuda_event_kernel_and_backward_ms": start_event.elapsed_time(end_event),
        "synchronized_wall_seconds": time.perf_counter() - started,
        "torch_arch_list": torch.cuda.get_arch_list(),
        "nvidia_smi": subprocess.check_output(["nvidia-smi"], text=True),
        "determinism": {"enabled": torch.are_deterministic_algorithms_enabled(), "warn_only": torch.is_deterministic_algorithms_warn_only_enabled(), "cublas_workspace_config": os.environ["CUBLAS_WORKSPACE_CONFIG"], "tf32_matmul": torch.backends.cuda.matmul.allow_tf32}
    }
    save(out / "device-proof.json", info)
    del a, b, result, loss
    torch.cuda.empty_cache()
    print(json.dumps({"gpu": info["gpu_name"], "torch": info["pytorch"], "cuda": info["pytorch_cuda_runtime"], "actual_kernel_device": info["device"], "kernel_and_backward_ms": info["cuda_event_kernel_and_backward_ms"]}), flush=True)
    return device, info


class Autoencoder(nn.Module):
    def __init__(self, hidden_width: int):
        super().__init__()
        self.encoder = nn.Sequential(nn.Linear(6, hidden_width), nn.Tanh(), nn.Linear(hidden_width, 3))
        self.decoder = nn.Sequential(nn.Linear(3, hidden_width), nn.Tanh(), nn.Linear(hidden_width, 6))

    def forward(self, x):
        return self.decoder(self.encoder(x))


def load_training_data(data: Path):
    # Explicit allowlist. No globbing, matrix-all-cells load, or test feature read.
    if sha(data / "manifest.json") != EXPECTED_DATA_MANIFEST_SHA256:
        raise ValueError("Data manifest differs from independently confirmed frozen identity")
    manifest = read(data / "manifest.json")
    if manifest["status"] != "frozen" or manifest["seed"] != 7102026:
        raise ValueError("Dataset is not the frozen experiment")
    for name in ["train.json", "validation.json", "preprocessing.json", "split.json"]:
        if sha(data / name) != manifest["artifacts_sha256"][name]:
            raise ValueError(f"Allowed data file changed after freeze: {name}")
    train_doc = read(data / "train.json")
    val_doc = read(data / "validation.json")
    preprocessing = read(data / "preprocessing.json")
    split = read(data / "split.json")
    docs = [train_doc, val_doc]
    if [len(doc["cell_ids"]) for doc in docs] != [251, 59]:
        raise ValueError("Expected exact frozen 251/59 training/validation cells")
    ids = [doc["cell_ids"] for doc in docs]
    if len(set(ids[0])) != 251 or len(set(ids[1])) != 59 or set(ids[0]) & set(ids[1]):
        raise ValueError("Cell identities are not unique and disjoint")
    train_blocks, val_blocks = [set(doc["spatial_blocks"]) for doc in docs]
    if train_blocks & val_blocks or [len(train_blocks), len(val_blocks)] != [59, 13]:
        raise ValueError("Training/validation spatial blocks overlap or differ from freeze")
    if train_blocks != set(split["spatial_blocks"]["train"]) or val_blocks != set(split["spatial_blocks"]["validation"]):
        raise ValueError("Training/validation block identities differ from frozen split")
    if set(split["spatial_blocks"]["test"]) & (train_blocks | val_blocks):
        raise ValueError("Frozen test blocks overlap training or validation")
    for doc in docs:
        if doc["feature_names"] != FEATURES:
            raise ValueError("Feature order mismatch")
        row_count = len(doc["cell_ids"])
        if any(len(doc[key]) != row_count for key in ["spatial_blocks", "counts", "log_features", "standardized_features"]):
            raise ValueError("Parallel data arrays are misaligned")
    if ids[0] != split["cell_ids"]["train"] or ids[1] != split["cell_ids"]["validation"]:
        raise ValueError("Training/validation IDs do not match frozen ordered split")
    test_ids = set(split["cell_ids"]["test"])
    if len(test_ids) != 56 or test_ids & (set(ids[0]) | set(ids[1])):
        raise ValueError("Frozen test IDs overlap or do not total 56")
    arrays = [np.array(doc["standardized_features"], dtype=np.float32) for doc in docs]
    counts = [np.array(doc["counts"], dtype=np.float64) for doc in docs]
    for values in counts:
        if not np.isfinite(values).all() or (values < 0).any():
            raise ValueError("Invalid count input")
    logs = [np.log1p(values) for values in counts]
    mean, scale = logs[0].mean(axis=0), logs[0].std(axis=0, ddof=0)
    scale = np.where(scale > 0, scale, 1)
    if preprocessing["feature_names"] != FEATURES or preprocessing["fitted_split"] != "train" or preprocessing["fitted_cell_count"] != 251 or preprocessing["std_ddof"] != 0:
        raise ValueError("Preprocessing metadata differs from training-only contract")
    if not np.allclose(mean, preprocessing["mean"], atol=1e-12, rtol=1e-12) or not np.allclose(scale, preprocessing["scale"], atol=1e-12, rtol=1e-12):
        raise ValueError("Independent training statistics differ from frozen preprocessing")
    for actual, log in zip(arrays, logs):
        if not np.isfinite(actual).all() or actual.shape[1] != 6:
            raise ValueError("Invalid feature matrix")
        if not np.allclose(actual, (log - mean) / scale, atol=2e-6, rtol=2e-6):
            raise ValueError("Features do not match train-only population normalization")
    # Independent train-only check is exported for transparent CPU inference.
    norm = {"feature_names": FEATURES, "transform": "log1p(counts)", "mean": mean.tolist(), "scale": scale.tolist(), "ddof": 0, "fit_rows": 251, "fit_split": "train", "zero_scale_rule": "replace with 1"}
    return arrays, ids, norm, preprocessing, split


def optimizer_for(model, protocol, candidate):
    # Capturable forces Adam's step tensor onto CUDA too; no fused/foreach ambiguity.
    return torch.optim.Adam(model.parameters(), lr=protocol["learning_rate"], weight_decay=candidate["weight_decay"], capturable=True, foreach=False, fused=False)


def optimizer_devices(optimizer):
    return [{"parameter": i, "tensors": {name: str(value.device) for name, value in state.items() if isinstance(value, torch.Tensor)}} for i, state in enumerate(optimizer.state.values())]


def train_one(candidate, protocol, train, validation, out):
    seed_everything(protocol["seed"])
    model = Autoencoder(candidate["hidden_width"]).to(train.device)
    require_cuda(*model.parameters(), train, validation)
    optimizer = optimizer_for(model, protocol, candidate)
    initial = {name: value.detach().clone() for name, value in model.state_dict().items()}
    best_state, best_val, best_epoch = None, float("inf"), None
    patience_best, checks_without_progress = float("inf"), 0
    log_path = out / "logs" / f"{candidate['id']}.jsonl"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    torch.cuda.synchronize()
    started = time.perf_counter()
    cuda_start, cuda_end = torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True)
    cuda_start.record()
    proof = None
    with log_path.open("w", encoding="utf-8") as log:
        for epoch in range(1, protocol["max_epochs"] + 1):
            model.train()
            optimizer.zero_grad(set_to_none=True)
            prediction = model(train)
            loss = nn.functional.mse_loss(prediction, train)
            require_cuda(prediction, loss)
            if not torch.isfinite(loss).item():
                raise RuntimeError("Nonfinite training loss")
            loss.backward()
            require_cuda(*[parameter.grad for parameter in model.parameters()])
            if epoch == 1:
                gradient_norm = sum(parameter.grad.square().sum() for parameter in model.parameters()).sqrt().item()
                if not np.isfinite(gradient_norm) or gradient_norm <= 0:
                    raise RuntimeError("CUDA gradient is nonfinite or zero")
            optimizer.step()
            if epoch == 1:
                changed = {name: (value - initial[name]).abs().max().item() for name, value in model.state_dict().items()}
                if max(changed.values()) <= 0:
                    raise RuntimeError("Optimizer did not update model weights")
                devices = optimizer_devices(optimizer)
                if any(device != "cuda:0" for row in devices for device in row["tensors"].values()):
                    raise RuntimeError("Optimizer state unexpectedly off CUDA")
                proof = {"input_device": str(train.device), "validation_input_device": str(validation.device), "output_device": str(prediction.device), "loss_device": str(loss.device), "parameter_devices": {name: str(value.device) for name, value in model.named_parameters()}, "gradient_devices": {name: str(value.grad.device) for name, value in model.named_parameters()}, "optimizer_state_devices": devices, "first_loss": loss.item(), "first_gradient_l2_norm": gradient_norm, "first_step_max_abs_parameter_change": changed, "initial_tensor_sha256": tensor_hash(initial)}
                save(out / "logs" / f"{candidate['id']}-first-step-device-proof.json", proof)
            if epoch == 1 or epoch % protocol["validation_interval"] == 0:
                model.eval()
                with torch.no_grad():
                    train_mse = nn.functional.mse_loss(model(train), train).item()
                    val_mse = nn.functional.mse_loss(model(validation), validation).item()
                if not np.isfinite(val_mse):
                    raise RuntimeError("Nonfinite validation loss")
                if val_mse < best_val:
                    best_state = {name: value.detach().clone() for name, value in model.state_dict().items()}
                    best_val, best_epoch = val_mse, epoch
                if val_mse < patience_best - protocol["early_stop_min_delta"]:
                    patience_best, checks_without_progress = val_mse, 0
                else:
                    checks_without_progress += 1
                event = {"epoch": epoch, "train_mse": train_mse, "validation_mse": val_mse, "best_epoch": best_epoch, "best_validation_mse": best_val, "checks_without_progress": checks_without_progress, "elapsed_wall_seconds": time.perf_counter() - started, "device": str(train.device)}
                log.write(json.dumps(event, allow_nan=False) + "\n")
                log.flush()
                if checks_without_progress >= protocol["early_stop_patience_checks"]:
                    break
    cuda_end.record()
    torch.cuda.synchronize()
    elapsed = time.perf_counter() - started
    model.load_state_dict(best_state)
    model.eval()
    with torch.no_grad():
        train_mse = nn.functional.mse_loss(model(train), train).item()
    record = {**candidate, "parameter_count": sum(p.numel() for p in model.parameters()), "best_epoch": best_epoch, "epochs_run": epoch, "validation_mse": best_val, "train_mse_at_selected_epoch": train_mse, "wall_seconds_synchronized": elapsed, "cuda_event_elapsed_ms": cuda_start.elapsed_time(cuda_end), "tensor_sha256": tensor_hash(best_state), "model_device": str(next(model.parameters()).device), "device_proof": f"logs/{candidate['id']}-first-step-device-proof.json", "log": f"logs/{candidate['id']}.jsonl"}
    torch.save({"state_dict": best_state, "candidate": candidate, "selected_epoch": best_epoch, "protocol": protocol}, out / f"{candidate['id']}.pt")
    print(json.dumps(record), flush=True)
    return model, record, best_state


def replay_selected(candidate, protocol, train, record, expected_state):
    seed_everything(protocol["seed"])
    model = Autoencoder(candidate["hidden_width"]).to(train.device)
    optimizer = optimizer_for(model, protocol, candidate)
    torch.cuda.synchronize()
    started = time.perf_counter()
    for _ in range(record["best_epoch"]):
        optimizer.zero_grad(set_to_none=True)
        loss = nn.functional.mse_loss(model(train), train)
        loss.backward()
        optimizer.step()
    torch.cuda.synchronize()
    actual = model.state_dict()
    max_delta = max((actual[name] - expected_state[name]).abs().max().item() for name in actual)
    replay_hash = tensor_hash(actual)
    proof = {"candidate": candidate["id"], "epochs": record["best_epoch"], "device": str(train.device), "training_data_only": True, "wall_seconds_synchronized": time.perf_counter() - started, "expected_tensor_sha256": record["tensor_sha256"], "replay_tensor_sha256": replay_hash, "max_abs_parameter_difference": max_delta, "bitwise_tensor_hash_match": replay_hash == record["tensor_sha256"], "scope": "same pinned Python/PyTorch/CUDA environment, GPU, full-batch deterministic execution"}
    if not proof["bitwise_tensor_hash_match"] or max_delta != 0:
        raise RuntimeError(f"Deterministic replay failed: {proof}")
    return proof


def export_model(model, candidate, norm, record):
    layers = []
    for name in ["encoder.0", "encoder.2", "decoder.0", "decoder.2"]:
        layer = model.get_submodule(name)
        layers.append({"name": name, "weight_layout": "out_features x in_features", "weight": layer.weight.detach().cpu().tolist(), "bias": layer.bias.detach().cpu().tolist(), "activation": "tanh" if name in ["encoder.0", "decoder.0"] else "linear"})
    return {"schema_version": 1, "kind": "amenity_autoencoder", "features": FEATURES, "preprocessing": norm, "encoder": layers[:2], "decoder": layers[2:], "bottleneck_dim": 3, "input_dim": 6, "output_dim": 6, "trained_device": str(next(model.parameters()).device), "candidate": candidate, "selected_epoch": record["best_epoch"], "tensor_sha256": record["tensor_sha256"], "inference_math": "row input; each layer y_j=sum_i(weight[j][i]*x_i)+bias[j], then specified activation", "limitations": ["Amenity reconstruction only; no preference or rental target labels", "ODbL-1.0 OpenStreetMap derived data; attribution required", "Occupied cells only; incomplete crowdsourced coverage", "Adjacent spatial blocks are not separated by a buffer", "No all-cell refit or production app integration"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=ROOT.parent / "data")
    parser.add_argument("--out", type=Path, default=ROOT / "artifacts")
    parser.add_argument("--probe-only", action="store_true")
    args = parser.parse_args()
    args.out = args.out.resolve()
    if ROOT not in args.out.parents:
        raise ValueError("All training outputs must be inside training directory")
    args.out.mkdir(parents=True, exist_ok=True)
    executed_source_hashes = {"train_gpu.py": sha(ROOT / "train_gpu.py"), "protocol.json": sha(ROOT / "protocol.json")}
    if (args.out / "FREEZE.json").exists():
        raise RuntimeError("Output is frozen; use a new training-local output directory for reproduction")
    device, device_info = probe_cuda(args.out)
    if args.probe_only:
        return
    protocol = read(ROOT / "protocol.json")
    save(args.out / "protocol.json", protocol)
    arrays, ids, norm, supplied_preprocessing, split = load_training_data(args.data)
    train, validation = [torch.tensor(values, device=device, dtype=torch.float32) for values in arrays]
    require_cuda(train, validation)
    source_hashes = {name: sha(args.data / name) for name in ["train.json", "validation.json", "preprocessing.json", "split.json"]}
    # Manifest is metadata only. Contains test hash supplied by data owner; no test bytes read.
    manifest_path = args.data / "manifest.json"
    if manifest_path.exists():
        source_hashes["manifest.json"] = sha(manifest_path)
        save(args.out / "data-manifest-copy.json", read(manifest_path))
    save(args.out / "preprocessing.json", norm)
    records, models, states = [], [], []
    torch.cuda.reset_peak_memory_stats(device)
    total_started = time.perf_counter()
    for candidate in protocol["candidates"]:
        model, record, state = train_one(candidate, protocol, train, validation, args.out)
        models.append(model)
        records.append(record)
        states.append(state)
    selected = min(range(len(records)), key=lambda i: (records[i]["validation_mse"], i))
    candidate, model, state, record = protocol["candidates"][selected], models[selected], states[selected], records[selected]
    replay_proof = replay_selected(candidate, protocol, train, record, state)
    save(args.out / "replay-proof.json", replay_proof)
    torch.save({"state_dict": state, "candidate": candidate, "selected_epoch": record["best_epoch"], "protocol": protocol, "preprocessing": norm}, args.out / "selected-checkpoint.pt")
    save(args.out / "selected-config.json", {"protocol": protocol, "selected_candidate": candidate, "selected_epoch": record["best_epoch"], "train_rows": 251, "validation_rows": 59, "test_rows_expected": 56, "dataset_file_sha256": source_hashes, "feature_order": FEATURES, "trainer_never_opened_test_features": True})
    export = export_model(model, candidate, norm, record)
    export["data_sha256"] = source_hashes
    export["checkpoint_sha256"] = sha(args.out / "selected-checkpoint.pt")
    export["config_sha256"] = sha(args.out / "selected-config.json")
    export["preprocessing_sha256"] = source_hashes["preprocessing.json"]
    export["data_preprocessing_sha256"] = source_hashes["preprocessing.json"]
    export["exported_preprocessing_sha256"] = sha(args.out / "preprocessing.json")
    export["split_sha256"] = source_hashes["split.json"]
    save(args.out / "model-export.json", export)
    with torch.no_grad():
        validation_reconstructed = model(validation).cpu().numpy().tolist()
        validation_encoded = model.encoder(validation).cpu().numpy().tolist()
    save(args.out / "validation-parity-reference.json", {"cell_ids": ids[1], "standardized_input": arrays[1].tolist(), "reconstructed_standardized": validation_reconstructed, "encoded": validation_encoded, "absolute_tolerance": 0.00001, "purpose": "Framework-neutral inference parity on validation only"})
    result = {"selected": record, "candidates": records, "selection_metric": protocol["selection"], "train_rows": 251, "validation_rows": 59, "test_feature_rows_read": 0, "device": device_info["gpu_name"], "torch": torch.__version__, "cuda_runtime": torch.version.cuda, "source_hashes": source_hashes, "executed_source_sha256": executed_source_hashes, "peak_cuda_allocated_bytes": torch.cuda.max_memory_allocated(device), "peak_cuda_reserved_bytes": torch.cuda.max_memory_reserved(device), "training_replay_and_export_wall_seconds": time.perf_counter() - total_started, "cuda_event_elapsed_scope": "elapsed training interval; includes host logging/idle gaps, not summed active GPU kernel time", "replay": replay_proof, "external_test_results_seen_before_freeze": False}
    save(args.out / "training-report.json", result)
    dependency_names = ["torch", "numpy", "filelock", "typing_extensions", "networkx", "jinja2", "fsspec", "sympy", "mpmath", "MarkupSafe"]
    dependency_versions = {name: importlib.metadata.version(name) for name in dependency_names}
    (args.out / "environment-lock.txt").write_text("\n".join(f"{name}=={version}" for name, version in dependency_versions.items()) + "\n", encoding="utf-8")
    if any(sha(ROOT / name) != digest for name, digest in executed_source_hashes.items()):
        raise RuntimeError("Executed trainer/protocol source changed during run; refusing freeze")
    files = [p for p in args.out.rglob("*") if p.is_file()]
    freeze = {"frozen_at_utc": datetime.now(timezone.utc).isoformat(), "selected_candidate": candidate["id"], "selected_epoch": record["best_epoch"], "selected_tensor_sha256": record["tensor_sha256"], "artifact_sha256": {str(p.relative_to(args.out)).replace("\\", "/"): sha(p) for p in sorted(files)}, "source_sha256": executed_source_hashes, "data_sha256": source_hashes, "holdout_policy": protocol["holdout_policy"], "test_used_for_selection": False}
    save(args.out / "FREEZE.json", freeze)
    print(json.dumps({"frozen": True, "freeze_sha256": sha(args.out / "FREEZE.json"), "selected": record, "replay_match": replay_proof["bitwise_tensor_hash_match"], "test_feature_rows_read": 0}), flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        raise
