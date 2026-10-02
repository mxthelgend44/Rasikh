"""Reproducible unsupervised amenity models; public OSM observations only."""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import urllib.parse
import urllib.request
import numpy as np

ROOT = Path(__file__).resolve().parent
SEED = 7102026
FEATURES = ["schools", "healthcare", "groceries", "parks", "dining", "transit"]
BBOX = [24.30, 54.28, 24.62, 54.72]
RADIUS_KM = 1.5
ENDPOINT = "https://overpass-api.de/api/interpreter"
QUERY = '[out:json][timeout:40];(nwr["amenity"~"^(school|kindergarten|clinic|hospital|pharmacy|cafe|restaurant|bus_station)$"](24.30,54.28,24.62,54.72);nwr["shop"="supermarket"](24.30,54.28,24.62,54.72);nwr["leisure"="park"](24.30,54.28,24.62,54.72);nwr["highway"="bus_stop"](24.30,54.28,24.62,54.72);nwr["place"~"^(suburb|neighbourhood|quarter|town|island)$"](24.30,54.28,24.62,54.72););out center;'


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def fetch(refresh):
    path = ROOT / "data/raw/osm.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text(encoding="utf-8"))
    data = urllib.parse.urlencode({"data": QUERY}).encode()
    request = urllib.request.Request(ENDPOINT, data=data, headers={"User-Agent": "Rasikh public amenities research prototype"})
    with urllib.request.urlopen(request, timeout=55) as response:
        result = json.load(response)
    if result.get("remark") or not result.get("elements"):
        raise RuntimeError("Incomplete Overpass data; no model was trained")
    value = {"query": QUERY, "endpoint": ENDPOINT, "retrieved_at": datetime.now(timezone.utc).timestamp(), "response": result}
    save(path, value)
    return value


def category(tags):
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


def coordinates(element):
    center = element.get("center", element)
    return center.get("lat"), center.get("lon")


def distance(lat, lon, other_lat, other_lon):
    p, q = math.radians(lat), math.radians(other_lat)
    h = math.sin((q - p) / 2) ** 2 + math.cos(p) * math.cos(q) * math.sin(math.radians(other_lon - lon) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(min(1, h)))


def normalize(snapshot):
    amenities, places, seen = [], [], set()
    for e in snapshot["response"]["elements"]:
        identity = f"{e['type']}/{e['id']}"
        if identity in seen:
            raise RuntimeError("Duplicate OSM element identity")
        seen.add(identity)
        lat, lon = coordinates(e)
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)) or not (BBOX[0] <= lat <= BBOX[2] and BBOX[1] <= lon <= BBOX[3]):
            continue
        tags = e.get("tags", {})
        feature = category(tags)
        if feature:
            amenities.append({"osm_id": identity, "latitude": lat, "longitude": lon, "category": feature})
        # Islands are geographic features, not neighborhood candidates.
        if tags.get("place") in ("suburb", "neighbourhood", "quarter", "town") and tags.get("name"):
            places.append({"osm_id": identity, "name": tags.get("name:en", tags["name"]), "name_ar": tags.get("name:ar"), "latitude": lat, "longitude": lon})
    return amenities, places


def grid(amenities):
    cells = defaultdict(lambda: np.zeros(len(FEATURES)))
    identities = defaultdict(list)
    for poi in amenities:
        north = (poi["latitude"] - BBOX[0]) * 111.32
        east = (poi["longitude"] - BBOX[1]) * 111.32 * math.cos(math.radians(24.46))
        key = (int(math.floor(north)), int(math.floor(east)))
        cells[key][FEATURES.index(poi["category"])] += 1
        identities[key].append(poi["osm_id"])
    return [{"cell_id": f"{n}:{e}", "spatial_block": f"{n // 3}:{e // 3}", "counts": counts.tolist(), "osm_ids": sorted(identities[(n, e)])} for (n, e), counts in sorted(cells.items())]


def pca_fit(x):
    mean, scale = x.mean(axis=0), x.std(axis=0)
    scale = np.where(scale > 0, scale, 1)
    z = (x - mean) / scale
    _, singular, vt = np.linalg.svd(z, full_matrices=False)
    components = vt[:3]
    return {"kind": "pca_log_amenity_density", "features": FEATURES, "mean": mean.tolist(), "scale": scale.tolist(), "components": components.tolist(), "target_log_features": np.quantile(x, .9, axis=0).tolist(), "explained_variance_fraction": float((singular[:3] ** 2).sum() / (singular ** 2).sum())}


def standardize(x, model):
    return (x - np.array(model["mean"])) / np.array(model["scale"])


def pca_error(x, model):
    z = standardize(x, model)
    basis = np.array(model["components"])
    reconstructed = (z @ basis.T) @ basis
    return {"pca_standardized_reconstruction_mse": float(np.mean((z - reconstructed) ** 2)), "training_mean_baseline_mse": float(np.mean(z ** 2)), "rows": len(x)}


def kmeans_fit(x, seed=SEED):
    rng = np.random.default_rng(seed)
    best = None
    for attempt in range(12):
        centers = x[rng.choice(len(x), 4, replace=False)].copy()
        for iteration in range(100):
            labels = ((x[:, None] - centers[None]) ** 2).sum(axis=2).argmin(axis=1)
            new = np.array([x[labels == c].mean(axis=0) if np.any(labels == c) else x[rng.integers(len(x))] for c in range(4)])
            if np.allclose(centers, new):
                centers = new
                break
            centers = new
        distances = ((x[:, None] - centers[None]) ** 2).sum(axis=2).min(axis=1)
        inertia = float(distances.sum())
        if best is None or inertia < best[0]:
            best = (inertia, centers)
    return {"kind": "kmeans_amenity_profiles", "k": 4, "centers": best[1].tolist(), "training_inertia": best[0]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    offline = not args.refresh and not (ROOT / "data/raw/osm.json").exists() and (ROOT / "data/osm-places.json").exists()
    if offline:
        amenities = json.loads((ROOT / "data/osm-amenities.json").read_text(encoding="utf-8"))["amenities"]
        places = json.loads((ROOT / "data/osm-places.json").read_text(encoding="utf-8"))["places"]
        previous = json.loads((ROOT / "models/osm-provenance.json").read_text(encoding="utf-8"))
        snapshot = {"endpoint": previous["query_endpoint"], "query": previous["query"], "retrieved_at": datetime.fromisoformat(previous["retrieved_at"]).timestamp()}
    else:
        snapshot = fetch(args.refresh)
        amenities, places = normalize(snapshot)
    derived_hash = hashlib.sha256(json.dumps({"amenities": amenities, "places": places}, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()).hexdigest()
    if offline and derived_hash != previous["derived_dataset_sha256"]:
        raise RuntimeError("Packaged data differs from provenance; refusing unverified offline training")
    cells = grid(amenities)
    blocks = sorted({c["spatial_block"] for c in cells})
    rng = np.random.default_rng(SEED)
    rng.shuffle(blocks)
    a, b = int(len(blocks) * .7), int(len(blocks) * .85)
    block_sets = [set(blocks[:a]), set(blocks[a:b]), set(blocks[b:])]
    splits = [[i for i, cell in enumerate(cells) if cell["spatial_block"] in selected] for selected in block_sets]
    assert all(block_sets[i].isdisjoint(block_sets[j]) for i in range(3) for j in range(i + 1, 3))
    x = np.log1p(np.array([c["counts"] for c in cells]))
    if min(map(len, splits)) < 10:
        raise RuntimeError("Insufficient spatially disjoint observations")
    train, validation, test = (x[indices] for indices in splits)
    evaluation_pca = pca_fit(train)
    z_train = standardize(train, evaluation_pca)
    evaluation_clusters = kmeans_fit(z_train)
    centers = np.array(evaluation_clusters["centers"])
    z_test = standardize(test, evaluation_pca)
    k_error = float(((z_test[:, None] - centers[None]) ** 2).sum(axis=2).min(axis=1).mean())
    one_error = float(((z_test - z_train.mean(axis=0)) ** 2).sum(axis=1).mean())
    # Resample whole held-out spatial blocks rather than treating POIs as independent.
    test_blocks = [cells[i]["spatial_block"] for i in splits[2]]
    basis = np.array(evaluation_pca["components"])
    per_cell_gain = np.mean(z_test ** 2, axis=1) - np.mean((z_test - (z_test @ basis.T) @ basis) ** 2, axis=1)
    gains = [float(np.mean([gain for block, gain in zip(test_blocks, per_cell_gain) if block == name])) for name in sorted(set(test_blocks))]
    bootstrap = np.array([np.mean(rng.choice(gains, len(gains), replace=True)) for _ in range(500)])
    final_pca = pca_fit(x)
    final_clusters = kmeans_fit(standardize(x, final_pca))
    areas = []
    for place in places:
        counts = Counter(p["category"] for p in amenities if distance(place["latitude"], place["longitude"], p["latitude"], p["longitude"]) <= RADIUS_KM)
        if not counts:
            continue
        area = math.pi * RADIUS_KM ** 2
        density = [counts[name] / area for name in FEATURES]
        z = standardize(np.log1p(np.array([density])), final_pca)[0]
        cluster = int(((np.array(final_clusters["centers"]) - z) ** 2).sum(axis=1).argmin())
        areas.append({**place, "mapped_object_counts": {name: counts[name] for name in FEATURES}, "density_per_km2": density, "cluster_id": cluster, "observation_radius_km": RADIUS_KM})
    areas.sort(key=lambda area: area["osm_id"])
    raw_hash = previous["raw_sha256"] if offline else hashlib.sha256(json.dumps(snapshot["response"], sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    base_timestamp = previous["osm_base_timestamp"] if offline else snapshot["response"].get("osm3s", {}).get("timestamp_osm_base")
    raw_count = previous["raw_elements"] if offline else len(snapshot["response"]["elements"])
    provenance = {"dataset": "OpenStreetMap contributors, Abu Dhabi metropolitan amenity snapshot", "license": "ODbL-1.0", "license_url": "https://opendatacommons.org/licenses/odbl/1-0/", "attribution": "© OpenStreetMap contributors", "source_url": "https://www.openstreetmap.org/copyright", "query_endpoint": snapshot["endpoint"], "query": snapshot["query"], "retrieved_at": datetime.fromtimestamp(snapshot["retrieved_at"], timezone.utc).isoformat(), "osm_base_timestamp": base_timestamp, "raw_sha256": raw_hash, "derived_dataset_sha256": derived_hash, "bbox": BBOX, "raw_elements": raw_count, "amenity_objects": len(amenities), "occupied_one_km_cells": len(cells), "named_area_candidates": len(areas), "labels": "No preference, satisfaction, transaction or customer outcome labels", "count_scope": "Mapped objects, not verified facility counts; node/way representations can refer to the same facility", "coverage": "Incomplete crowd-sourced mapping; unrecorded amenities do not establish absence"}
    report = {"seed": SEED, "numpy_version": np.__version__, "models": ["PCA: 3 learned components", "KMeans: 4 learned amenity profiles"], "split_method": "70/15/15 seeded split of nonoverlapping 3km spatial blocks; disjoint 1km cells and OSM object IDs", "split_block_counts": dict(zip(["train", "validation", "test"], map(len, block_sets))), "split_cell_counts": dict(zip(["train", "validation", "test"], map(len, splits))), "splits": dict(zip(["train", "validation", "test"], [[cells[i]["cell_id"] for i in indices] for indices in splits])), "validation": pca_error(validation, evaluation_pca), "test": pca_error(test, evaluation_pca), "kmeans_test": {"four_centroid_squared_distance": k_error, "one_centroid_baseline_squared_distance": one_error}, "pca_block_bootstrap": {"resamples": 500, "mse_reduction_mean_ci95": [float(np.quantile(bootstrap, .025)), float(np.quantile(bootstrap, .975))], "scope": "finite held-out spatial blocks, not user recommendation success"}, "source_sha256": raw_hash, "deployment_model_refit": "After all test scoring, refit both unsupervised models on all cells", "limitations": ["Unsupervised representation evaluation does not validate preference rankings or customer outcomes.", "Only occupied cells are modeled; there is no complete land/amenity-coverage mask.", "Nearby held-out and training blocks can remain spatially correlated; no buffer or future-time validation.", "Named-area features use density inside a 1.5km circle around an OSM marker, not a neighborhood boundary.", "No rents, listings, school quality, traffic or journey-time predictions.", "User preference weights and commute tradeoff are explicit product rules, not learned feedback.", "Dataset and derived data remain under ODbL with attribution."]}
    save(ROOT / "data/osm-amenities.json", {"license": "ODbL-1.0", "attribution": "© OpenStreetMap contributors", "amenities": amenities})
    save(ROOT / "data/osm-places.json", {"license": "ODbL-1.0", "attribution": "© OpenStreetMap contributors", "places": places})
    save(ROOT / "data/osm-training-cells.json", {"license": "ODbL-1.0", "cells": cells})
    save(ROOT / "models/osm-pca.json", final_pca)
    save(ROOT / "models/osm-clusters.json", final_clusters)
    save(ROOT / "models/osm-areas.json", areas)
    save(ROOT / "models/osm-provenance.json", provenance)
    save(ROOT / "models/osm-evaluation.json", report)
    print(json.dumps({"amenity_objects": len(amenities), "cells": len(cells), "areas": len(areas), "test": report["test"], "cluster_test": report["kmeans_test"]}, ensure_ascii=True))


if __name__ == "__main__":
    main()
