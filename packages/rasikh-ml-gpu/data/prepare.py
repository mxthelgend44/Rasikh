"""Frozen OSM-only GPU input, exact baseline split, train-only preprocessing.

Writes only this script's directory. Reads baseline files without importing or
executing baseline code. No downloads, preference labels, or rental inputs.
"""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import io
import json
import math
from pathlib import Path
import sys

import numpy as np

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
FEATURES = ["schools", "healthcare", "groceries", "parks", "dining", "transit"]
SPLITS = ["train", "validation", "test"]
SEED = 7102026
BBOX = [24.30, 54.28, 24.62, 54.72]
RADIUS_KM = 1.5
LICENSE = "ODbL-1.0"
ATTRIBUTION = "© OpenStreetMap contributors"
SOURCE_NAMES = {
    "HANDOFF.json": "source/handoff.json",
    "data/osm-amenities.json": "source/osm-amenities.json",
    "data/osm-places.json": "source/osm-places.json",
    "data/osm-training-cells.json": "source/osm-training-cells.json",
    "models/osm-provenance.json": "source/osm-provenance.json",
    "models/osm-evaluation.json": "source/osm-evaluation.json",
}
DERIVED_FILES = ["schema.json", "preprocessing.json", "split.json", "quality.json",
                 "named-areas.json", "named-areas.float32.npy"] + [
    f"{name}{suffix}" for name in SPLITS for suffix in (".json", ".float32.npy")
]
STATIC_FILES = ["prepare.py", "source-lock.json", "requirements.txt", "README.md", "LICENSE-DATA.md"]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True,
                      allow_nan=False).encode("utf-8")


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")


def load(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


def write(name, value):
    path = ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(value if isinstance(value, bytes) else json_bytes(value))


def matrix_bytes(value):
    stream = io.BytesIO()
    np.save(stream, np.asarray(value, dtype="<f4"), allow_pickle=False)
    return stream.getvalue()


def distance(lat, lon, other_lat, other_lon):
    p, q = math.radians(lat), math.radians(other_lat)
    h = math.sin((q - p) / 2) ** 2 + math.cos(p) * math.cos(q) * math.sin(math.radians(other_lon - lon) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(min(1, h)))


def mapped_category(tags):
    amenity = tags.get("amenity")
    if amenity in ("school", "kindergarten"):
        return "schools"
    if amenity in ("clinic", "hospital", "pharmacy"):
        return "healthcare"
    if tags.get("shop") == "supermarket":
        return "groceries"
    if tags.get("leisure") == "park":
        return "parks"
    if amenity in ("cafe", "restaurant"):
        return "dining"
    if amenity == "bus_station" or tags.get("highway") == "bus_stop":
        return "transit"
    return None


def inspect_sources(sources):
    objs = {key: json.loads(value) for key, value in sources.items() if key.endswith(".json")}
    amenities = objs["data/osm-amenities.json"]["amenities"]
    places = objs["data/osm-places.json"]["places"]
    cells = objs["data/osm-training-cells.json"]["cells"]
    provenance = objs["models/osm-provenance.json"]
    evaluation = objs["models/osm-evaluation.json"]
    handoff = objs["HANDOFF.json"]
    handoff_files = {item["path"]: item["sha256"] for item in handoff["files"]}
    if handoff["content_identity_sha256"] != "a25a92b77e07d5602db604d6de1ab8b61d5a25acd8eff72605a3572b456ecce1":
        raise ValueError("Unexpected baseline handoff identity")
    for name, content in sources.items():
        if name != "HANDOFF.json" and (name not in handoff_files or sha(content) != handoff_files[name]):
            raise ValueError("Source is not in authoritative baseline shipping allowlist")
    if provenance["license"] != LICENSE or provenance["bbox"] != BBOX:
        raise ValueError("Unexpected dataset license or coverage")
    if sha(canonical({"amenities": amenities, "places": places})) != provenance["derived_dataset_sha256"]:
        raise ValueError("Normalized public source hash mismatch")
    if len(amenities) != 3958 or len(cells) != 366 or len(places) != 222:
        raise ValueError("Frozen source row counts changed")
    ids = [obj["osm_id"] for obj in amenities]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate OSM identity")
    grids = defaultdict(lambda: {"counts": [0] * 6, "osm_ids": []})
    for obj in amenities:
        if obj["category"] not in FEATURES:
            raise ValueError("Feature outside allowlist")
        north = (obj["latitude"] - BBOX[0]) * 111.32
        east = (obj["longitude"] - BBOX[1]) * 111.32 * math.cos(math.radians(24.46))
        n, e = math.floor(north), math.floor(east)
        record = grids[(n, e)]
        record["counts"][FEATURES.index(obj["category"])] += 1
        record["osm_ids"].append(obj["osm_id"])
    rebuilt = [{"cell_id": f"{n}:{e}", "spatial_block": f"{n // 3}:{e // 3}",
                "counts": item["counts"], "osm_ids": sorted(item["osm_ids"])}
               for (n, e), item in sorted(grids.items())]
    if rebuilt != cells:
        raise ValueError("Public object to cell reconstruction differs")
    splits = evaluation["splits"]
    if set(splits) != set(SPLITS) or evaluation["seed"] != SEED:
        raise ValueError("Unexpected baseline split")
    by_id = {cell["cell_id"]: cell for cell in cells}
    if len(by_id) != len(cells):
        raise ValueError("Duplicate cell identity")
    cell_sets = {name: set(splits[name]) for name in SPLITS}
    blocks = {name: {by_id[c]["spatial_block"] for c in splits[name]} for name in SPLITS}
    osm_sets = {name: {obj for c in splits[name] for obj in by_id[c]["osm_ids"]} for name in SPLITS}
    if [len(splits[n]) for n in SPLITS] != [251, 59, 56]:
        raise ValueError("Frozen holdout sizes changed")
    if [len(blocks[n]) for n in SPLITS] != [59, 13, 13]:
        raise ValueError("Frozen block sizes changed")
    if set.union(*cell_sets.values()) != set(by_id):
        raise ValueError("Split does not cover exact snapshot")
    for i, first in enumerate(SPLITS):
        if len(splits[first]) != len(cell_sets[first]):
            raise ValueError("Duplicate cell inside split")
        for second in SPLITS[i + 1:]:
            if cell_sets[first] & cell_sets[second] or blocks[first] & blocks[second] or osm_sets[first] & osm_sets[second]:
                raise ValueError("Cross-split cell/block/OSM identity leakage")
    # Import exact membership/order; seed reproduction is a cross-check only.
    shuffled = sorted({cell["spatial_block"] for cell in cells})
    np.random.default_rng(SEED).shuffle(shuffled)
    a, b = int(len(shuffled) * .7), int(len(shuffled) * .85)
    seeded = [set(shuffled[:a]), set(shuffled[a:b]), set(shuffled[b:])]
    for name, expected in zip(SPLITS, seeded):
        if expected != blocks[name] or [c["cell_id"] for c in cells if c["spatial_block"] in expected] != splits[name]:
            raise ValueError("Exact split cannot be reproduced with frozen seed")
    return amenities, places, by_id, provenance, splits, blocks, osm_sets


def build_values(sources):
    amenities, places, by_id, provenance, splits, blocks, osm_sets = inspect_sources(sources)
    counts = {name: np.asarray([by_id[c]["counts"] for c in splits[name]], dtype=np.float64) for name in SPLITS}
    if any(not np.isfinite(x).all() or (x < 0).any() for x in counts.values()):
        raise ValueError("Invalid public count feature")
    logs = {name: np.log1p(x) for name, x in counts.items()}
    mean = logs["train"].mean(axis=0)
    observed_scale = logs["train"].std(axis=0, ddof=0)
    scale = np.where(observed_scale > 0, observed_scale, 1.0)
    transform = {"schema_version": 1, "feature_names": FEATURES,
                 "formula": "z=(log1p(counts)-mean)/scale", "fitted_split": "train",
                 "fitted_cell_count": 251, "fit_cell_ids_sha256": sha(canonical(splits["train"])),
                 "statistics_dtype": "float64", "std_ddof": 0, "mean": mean.tolist(),
                 "scale": scale.tolist(), "zero_variance_features": [FEATURES[i] for i in range(6) if observed_scale[i] == 0],
                 "clipping": None, "missing_value_imputation": None,
                 "validation_or_test_fit": False, "license": LICENSE, "attribution": ATTRIBUTION}
    split = {"schema_version": 1, "seed": SEED, "method": "Imported exact frozen baseline 70/15/15 split of 3km blocks",
             "cell_ids": splits, "spatial_blocks": {name: sorted(blocks[name]) for name in SPLITS},
             "cell_counts": {name: len(splits[name]) for name in SPLITS},
             "block_counts": {name: len(blocks[name]) for name in SPLITS},
             "assignments_sha256": sha(canonical(splits)),
             "baseline_evaluation_file_sha256": sha(sources["models/osm-evaluation.json"]),
             "holdout_policy": "Test rows are evaluator-only until selected checkpoint/config is frozen; no fitting or selection on test rows.",
             "license": LICENSE, "attribution": ATTRIBUTION}
    schema = {"schema_version": 1, "dataset_id": load("source-lock.json")["dataset_id"],
              "feature_names": FEATURES, "feature_count": 6,
              "source_categories": {"schools": ["amenity=school", "amenity=kindergarten"],
                                    "healthcare": ["amenity=clinic", "amenity=hospital", "amenity=pharmacy"],
                                    "groceries": ["shop=supermarket"], "parks": ["leisure=park"],
                                    "dining": ["amenity=cafe", "amenity=restaurant"],
                                    "transit": ["amenity=bus_station", "highway=bus_stop"]},
              "category_precedence": FEATURES,
              "split_json_fields": {"cell_ids": "Ordered unique strings n:e", "spatial_blocks": "Parallel block IDs floor(n/3):floor(e/3)",
                                    "counts": "N by 6 nonnegative integer-valued float64 mapped object counts",
                                    "log_features": "N by 6 float64 log1p(counts)",
                                    "standardized_features": "N by 6 float64 using frozen train mean/std"},
              "npy_files": {"dtype": "little-endian float32", "shape": "N by 6", "order": "C", "content": "standardized_features rounded to float32", "pickle": False},
              "cell_geometry": {"cell_size_km_approx": 1, "block_size_km_approx": 3,
                                "north_formula": "floor((latitude-24.30)*111.32)",
                                "east_formula": "floor((longitude-54.28)*111.32*cos(radians(24.46)))", "bbox": BBOX},
              "sample_unit": "Occupied approximate 1km² cell; no unoccupied coverage mask",
              "named_area_role": "Inference only after model selection; 1.5km circles may overlap split boundaries",
              "named_area_input": "log1p(mapped object density/km²), normalized with same train-only mean/scale; geometry differs from occupied-cell training",
              "task": "Unsupervised amenity representation/reconstruction; input features are reconstruction targets",
              "labels": None, "prohibited_sources": ["rental-index.json", "rental predictions", "invented preferences", "facility quality", "traffic", "travel-time outcomes"],
              "license": LICENSE, "attribution": ATTRIBUTION}
    result = {"schema.json": schema, "preprocessing.json": transform, "split.json": split}
    for name in SPLITS:
        z = (logs[name] - mean) / scale
        if not np.isfinite(z).all():
            raise ValueError("Nonfinite transformed features")
        result[f"{name}.json"] = {"schema_version": 1, "split": name, "feature_names": FEATURES,
                                 "cell_ids": splits[name], "spatial_blocks": [by_id[c]["spatial_block"] for c in splits[name]],
                                 "counts": counts[name].tolist(), "log_features": logs[name].tolist(),
                                 "standardized_features": z.tolist(), "license": LICENSE, "attribution": ATTRIBUTION}
        result[f"{name}.float32.npy"] = matrix_bytes(z)
    area_records, area_z = [], []
    for place in places:
        nearby = Counter(p["category"] for p in amenities if distance(place["latitude"], place["longitude"], p["latitude"], p["longitude"]) <= RADIUS_KM)
        if not nearby:
            continue
        density = np.asarray([nearby[f] / (math.pi * RADIUS_KM ** 2) for f in FEATURES], dtype=np.float64)
        z = (np.log1p(density) - mean) / scale
        area_records.append({**place, "mapped_object_counts": {f: nearby[f] for f in FEATURES},
                             "density_per_km2": density.tolist(), "standardized_features": z.tolist(),
                             "observation_radius_km": RADIUS_KM})
    area_records.sort(key=lambda row: row["osm_id"])
    if len(area_records) != 199:
        raise ValueError("Named-area frozen inference count changed")
    area_z = [row["standardized_features"] for row in area_records]
    result["named-areas.json"] = {"schema_version": 1, "role": "post-selection inference only", "feature_names": FEATURES,
                                 "areas": area_records, "license": LICENSE, "attribution": ATTRIBUTION,
                                 "training_use_permitted": False, "customer_outcome_validation": False}
    result["named-areas.float32.npy"] = matrix_bytes(area_z)
    result["quality.json"] = {"schema_version": 1, "checks_passed": ["pinned source byte hashes", "authoritative baseline HANDOFF allowlist", "canonical normalized source hash",
                                "public-object-to-cell reconstruction",
                                "exact seeded block membership/order", "no cross-split cells/blocks/OSM IDs", "train-only fitted normalization", "finite outputs"],
                              "amenity_objects": len(amenities), "occupied_cells": len(by_id), "source_place_markers": len(places),
                              "inference_named_areas": len(area_records), "split_cells": {n: len(splits[n]) for n in SPLITS},
                              "split_blocks": {n: len(blocks[n]) for n in SPLITS}, "split_osm_objects": {n: len(osm_sets[n]) for n in SPLITS},
                              "labels_collected": 0, "source_derived_sha256": provenance["derived_dataset_sha256"],
                              "raw_source_hash_scope": "Upstream provenance records raw response hash; baseline data/raw is intentionally excluded and not redistributed.",
                              "limitations": ["Mapped objects may contain node/way duplicates of the same facility.",
                                              "Incomplete mapping; zero mapped objects is not verified facility absence.",
                                              "Spatially disjoint blocks can be adjacent; no spatial buffer or future-time holdout.",
                                              "Only occupied cells are modeled; features do not measure neighborhood or rental quality.",
                                              "Named-area density uses marker-centered circles, not neighborhood boundaries; inference geometry differs from training.",
                                              "No customer preference, recommendation success, traffic, quality or journey-time labels.",
                                              "Baseline final deployed PCA/KMeans were refitted on all cells; evaluation must refit baseline using only training cells."]}
    return result


def verify():
    manifest = load("manifest.json")
    checksums = (ROOT / "FREEZE.sha256").read_text(encoding="ascii").splitlines()
    entries = dict(line.split("  ", 1)[::-1] for line in checksums)
    expected = {**manifest["artifacts_sha256"], "manifest.json": sha((ROOT / "manifest.json").read_bytes())}
    if entries != expected:
        raise ValueError("Manifest/checksum ledger differs")
    for name, digest in expected.items():
        if sha((ROOT / name).read_bytes()) != digest:
            raise ValueError(f"Frozen file hash mismatch: {name}")
    present = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*") if p.is_file()}
    if present != set(manifest["frozen_allowlist"]):
        raise ValueError("Unexpected/missing file outside exact data allowlist")
    sources = {key: (ROOT / target).read_bytes() for key, target in SOURCE_NAMES.items()}
    for key, value in sources.items():
        if sha(value) != load("source-lock.json")["files"][key]:
            raise ValueError(f"Pinned snapshot mismatch: {key}")
    values = build_values(sources)
    for name, value in values.items():
        regenerated = value if isinstance(value, bytes) else json_bytes(value)
        if regenerated != (ROOT / name).read_bytes():
            raise ValueError(f"Reproduction differs: {name}")
    print(json.dumps({"status": "verified", "manifest_sha256": expected["manifest.json"],
                      "files": len(present), "split_cells": manifest["split_cell_counts"],
                      "dataset_sha256": manifest["source_derived_sha256"],
                      "split_sha256": manifest["split_assignments_sha256"]}))


def prepare(baseline, reuse_frozen):
    lock = load("source-lock.json")
    if reuse_frozen:
        sources = {key: (ROOT / target).read_bytes() for key, target in SOURCE_NAMES.items()}
    else:
        sources = {key: (baseline / key).read_bytes() for key in lock["files"]}
    for key, value in sources.items():
        if sha(value) != lock["files"][key]:
            raise ValueError(f"Baseline changed; refusing to refresh holdout: {key}")
    values = build_values(sources)
    # Complete validation before writing; source package remains read-only.
    for key, target in SOURCE_NAMES.items():
        write(target, sources[key])
    for name, value in values.items():
        write(name, value)
    artifact_names = sorted(STATIC_FILES + list(SOURCE_NAMES.values()) + DERIVED_FILES)
    hashes = {name: sha((ROOT / name).read_bytes()) for name in artifact_names}
    existing_manifest = ROOT / "manifest.json"
    built_at = load("manifest.json")["built_at_utc"] if existing_manifest.exists() else datetime.now(timezone.utc).isoformat()
    trainer_files = ["schema.json", "preprocessing.json", "source-lock.json", "train.json", "train.float32.npy",
                     "validation.json", "validation.float32.npy", "LICENSE-DATA.md"]
    manifest = {"schema_version": 1, "dataset_id": lock["dataset_id"], "status": "frozen", "built_at_utc": built_at,
                "deadline_dubai": "2026-10-02T15:45:00+04:00", "seed": SEED,
                "preparer_environment": {"python": sys.version.split()[0], "numpy": np.__version__, "statistics_dtype": "float64", "gpu_matrix_dtype": "float32"},
                "feature_names": FEATURES, "source_files_sha256": lock["files"],
                "raw_response_sha256": load("source/osm-provenance.json")["raw_sha256"],
                "source_derived_sha256": load("source/osm-provenance.json")["derived_dataset_sha256"],
                "split_assignments_sha256": values["split.json"]["assignments_sha256"],
                "preprocessing_sha256": hashes["preprocessing.json"], "split_cell_counts": values["split.json"]["cell_counts"],
                "artifacts_sha256": hashes, "frozen_allowlist": sorted(artifact_names + ["manifest.json", "FREEZE.sha256"]),
                "trainer_fit_and_selection_allowlist": trainer_files,
                "evaluator_allowlist": sorted(artifact_names + ["manifest.json", "FREEZE.sha256"]),
                "post_selection_inference_allowlist": ["schema.json", "preprocessing.json", "named-areas.json", "named-areas.float32.npy", "LICENSE-DATA.md"],
                "redistributable_data_allowlist": ["schema.json", "preprocessing.json", "named-areas.json", "LICENSE-DATA.md", "source/osm-provenance.json"],
                "trainer_policy": "Read only train/validation numeric rows during fitting and selection. No test/source full snapshot/named-area numeric rows for selection. Frozen ledger is identity metadata, not training input.",
                "checkpoint_policy": "Freeze selected checkpoint/config before evaluator opens test rows; never retune after test scoring.",
                "license": LICENSE, "license_url": "https://opendatacommons.org/licenses/odbl/1-0/",
                "attribution": ATTRIBUTION, "source_url": "https://www.openstreetmap.org/copyright",
                "excluded": ["rentals", "rental predictions", "preference labels", "quality labels", "traffic labels", "journey-time outcomes", "baseline all-cell fitted model outputs"],
                "metrics_scope": "Amenity feature reconstruction/representation only; no customer outcome evidence."}
    write("manifest.json", manifest)
    checksum_entries = {**hashes, "manifest.json": sha((ROOT / "manifest.json").read_bytes())}
    write("FREEZE.sha256", "".join(f"{checksum_entries[n]}  {n}\n" for n in sorted(checksum_entries)).encode("ascii"))
    if not reuse_frozen:
        for key, digest in lock["files"].items():
            if sha((baseline / key).read_bytes()) != digest:
                raise ValueError("Baseline mutated while preparing package")
    verify()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline-root", type=Path, default=(ROOT / "../../rasikh-recommender").resolve())
    parser.add_argument("--reuse-frozen", action="store_true", help="Rebuild from pinned copied snapshots, without accessing baseline")
    parser.add_argument("--verify", action="store_true", help="Read-only checksum and independent semantic reproduction")
    args = parser.parse_args()
    if args.verify:
        verify()
    else:
        prepare(args.baseline_root.resolve(), args.reuse_frozen)


if __name__ == "__main__":
    main()
