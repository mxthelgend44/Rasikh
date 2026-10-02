"""Train on published aggregate rents, never authored customer preferences.

Requires NumPy. Raw network responses stay in gitignored data/raw. Model and
evaluation exports are JSON; inference in index.mjs requires no Python runtime.
"""
import argparse
import hashlib
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
import urllib.parse
import urllib.request
import numpy as np

ROOT = Path(__file__).resolve().parent
SERVICE = "https://services.arcgis.com/XnXlSO1jWajDu7rr/ArcGIS/rest/services/RentalIndexV1/FeatureServer"
ITEM = "https://www.arcgis.com/sharing/rest/content/items/eefee0cf9d1248c3b2deca7573138d00?f=json"
SEED = 7102026


def get_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Rasikh public aggregate-rent research prototype"})
    with urllib.request.urlopen(request, timeout=35) as response:
        value = json.load(response)
    if isinstance(value, dict) and "error" in value:
        raise RuntimeError(str(value["error"]))
    return value


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def acquire(refresh):
    cache = ROOT / "data/raw/rental-index.json"
    if cache.exists() and not refresh:
        return json.loads(cache.read_text(encoding="utf-8"))
    count = get_json(SERVICE + "/3/query?" + urllib.parse.urlencode({"where": "1=1", "returnCountOnly": "true", "f": "json"}))["count"]
    if not isinstance(count, int) or not 1 <= count <= 100000:
        raise RuntimeError("Unexpected public dataset size")
    attributes = []
    for offset in range(0, count, 1000):
        query = urllib.parse.urlencode({"where": "1=1", "outFields": "*", "returnGeometry": "false", "orderByFields": "OBJECTID ASC", "resultOffset": offset, "resultRecordCount": 1000, "f": "json"})
        page = get_json(SERVICE + "/3/query?" + query)
        attributes.extend(feature["attributes"] for feature in page["features"])
    if len(attributes) != count or len({a["OBJECTID"] for a in attributes}) != count:
        raise RuntimeError("Incomplete or duplicate public-data download")
    item = get_json(ITEM)
    snapshot = {"retrieved_at": datetime.now(timezone.utc).isoformat(), "attributes": attributes, "item": {k: item.get(k) for k in ("title", "owner", "licenseInfo", "access", "modified", "url")}}
    write_json(cache, snapshot)
    return snapshot


def normalize(attributes):
    grouped = defaultdict(list)
    rejected = 0
    for a in attributes:
        beds = a.get("NUM_OF_BEDROOM")
        municipality, zone, group = a.get("MUNICIPALITYNAMEENG"), a.get("ZONETPSSNAMEENG"), a.get("ADM_ID")
        if not all(isinstance(x, str) and x.strip() for x in (municipality, zone, group)) or not isinstance(beds, (int, float)) or not math.isfinite(beds) or beds != int(beds) or not 0 <= beds <= 9:
            rejected += 1
            continue
        for kind, field in (("apartment", "APRTMENT_AVG_ANNUAL_CONTRCT_VAL"), ("villa", "VILLA_AVG_ANNUAL_CONTRCT_VAL")):
            rent = a.get(field)
            if isinstance(rent, (int, float)) and not isinstance(rent, bool) and math.isfinite(rent) and rent > 0:
                key = (municipality.strip(), zone.strip(), group, int(beds), kind)
                grouped[key].append(float(rent))
    rows = [{"municipality": key[0], "zone": key[1], "sector_id": key[2], "bedrooms": key[3], "property_type": key[4], "annual_rent_aed": float(np.median(values))} for key, values in sorted(grouped.items())]
    if len(rows) < 100:
        raise RuntimeError("Insufficient real rental observations")
    return rows, rejected


def vocabulary(rows):
    return {"municipalities": sorted({r["municipality"] for r in rows}), "zones": sorted({r["municipality"] + "|" + r["zone"] for r in rows})}


def vector(row, vocab):
    beds, villa = row["bedrooms"], int(row["property_type"] == "villa")
    zone = row["municipality"] + "|" + row["zone"]
    return [1, beds / 9, (beds / 9) ** 2, math.log1p(beds), villa, villa * beds / 9] + [int(row["municipality"] == m) for m in vocab["municipalities"]] + [int(zone == z) for z in vocab["zones"]]


def fit(rows, alpha):
    vocab = vocabulary(rows)
    x = np.array([vector(r, vocab) for r in rows], dtype=float)
    y = np.log([r["annual_rent_aed"] for r in rows])
    penalty = np.eye(x.shape[1]) * alpha
    penalty[0, 0] = 0
    weights = np.linalg.solve(x.T @ x + penalty, x.T @ y)
    return {"kind": "log_rent_ridge", "alpha": alpha, "vocabulary": vocab, "weights": weights.tolist(), "target": "published_sector_average_annual_rent_aed", "bedroom_range": [min(r["bedrooms"] for r in rows), max(r["bedrooms"] for r in rows)]}


def predict(model, rows):
    x = np.array([vector(r, model["vocabulary"]) for r in rows])
    return np.exp(np.clip(x @ np.array(model["weights"]), math.log(1), math.log(10000000)))


def baseline(train, test):
    lookup = defaultdict(list)
    for r in train:
        for key in ((r["municipality"], r["zone"], r["property_type"], r["bedrooms"]), (r["municipality"], r["property_type"], r["bedrooms"]), (r["property_type"], r["bedrooms"]), ("all",)):
            lookup[key].append(r["annual_rent_aed"])
    values = []
    for r in test:
        keys = ((r["municipality"], r["zone"], r["property_type"], r["bedrooms"]), (r["municipality"], r["property_type"], r["bedrooms"]), (r["property_type"], r["bedrooms"]), ("all",))
        values.append(float(np.median(next(lookup[k] for k in keys if k in lookup))))
    return np.array(values)


def metrics(rows, predictions):
    actual = np.array([r["annual_rent_aed"] for r in rows])
    error = abs(actual - predictions)
    return {"rows": len(rows), "mae_aed_per_year": round(float(np.mean(error)), 2), "median_absolute_error_aed": round(float(np.median(error)), 2), "median_absolute_percentage_error": round(float(np.median(error / actual)) * 100, 2), "rmse_aed_per_year": round(float(np.sqrt(np.mean((actual - predictions) ** 2))), 2)}


def cluster_zones(rows):
    groups = defaultdict(list)
    for row in rows:
        groups[(row["municipality"], row["zone"])].append(row)
    profiles = []
    # Features are real published rent medians for five unit types. Missing cells
    # are imputed and separately marked; these are not extra observations.
    slots = [("apartment", 1), ("apartment", 2), ("apartment", 3), ("villa", 3), ("villa", 4)]
    for (municipality, zone), values in sorted(groups.items()):
        profile = [float(np.median([r["annual_rent_aed"] for r in values if (r["property_type"], r["bedrooms"]) == slot])) if any((r["property_type"], r["bedrooms"]) == slot for r in values) else None for slot in slots]
        if sum(x is not None for x in profile) >= 2:
            profiles.append({"municipality": municipality, "zone": zone, "values": profile})
    raw = np.array([[np.log(v) if v is not None else np.nan for v in p["values"]] for p in profiles])
    missing = np.isnan(raw)
    medians = np.nanmedian(raw, axis=0)
    if not np.all(np.isfinite(medians)):
        raise RuntimeError("Insufficient observed unit types for clustering")
    filled = np.where(missing, medians, raw)
    mean, scale = filled.mean(axis=0), filled.std(axis=0)
    scale = np.where(scale > 0, scale, 1)
    x = (filled - mean) / scale
    rng = np.random.default_rng(SEED)
    k = min(4, len(profiles))
    best = None
    for attempt in range(12):
        centers = x[rng.choice(len(x), k, replace=False)].copy()
        for iteration in range(100):
            labels = ((x[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)
            updated = np.array([x[labels == c].mean(axis=0) if np.any(labels == c) else x[rng.integers(len(x))] for c in range(k)])
            if np.allclose(updated, centers):
                centers = updated
                break
            centers = updated
        labels = ((x[:, None, :] - centers[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)
        inertia = float(((x - centers[labels]) ** 2).sum())
        if best is None or inertia < best[0]:
            best = (inertia, centers, labels)
    inertia, centers, labels = best
    order = np.argsort(np.exp(centers * scale + mean).mean(axis=1))
    cluster_rank = {int(old): int(rank) for rank, old in enumerate(order)}
    return {"kind": "kmeans_rental_price_profiles", "k": k, "zone_count": len(profiles), "inertia": inertia, "feature_unit_types": [f"{kind}_{beds}" for kind, beds in slots], "log_feature_imputation_medians": medians.tolist(), "feature_means": mean.tolist(), "feature_scales": scale.tolist(), "centers": centers.tolist(), "scope": "descriptive_price_similarity_not_user_preference_validation", "assignments": [{"municipality": p["municipality"], "zone": p["zone"], "price_cluster": cluster_rank[int(label)], "imputed_feature_count": int(missing[i].sum())} for i, (p, label) in enumerate(zip(profiles, labels))]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    snapshot = acquire(args.refresh)
    rows, rejected = normalize(snapshot["attributes"])
    groups = sorted({r["sector_id"] for r in rows})
    rng = np.random.default_rng(SEED)
    rng.shuffle(groups)
    train_groups = set(groups[:int(len(groups) * .6)])
    validation_groups = set(groups[int(len(groups) * .6):int(len(groups) * .8)])
    test_groups = set(groups[int(len(groups) * .8):])
    splits = [[r for r in rows if r["sector_id"] in g] for g in (train_groups, validation_groups, test_groups)]
    train, validation, test = splits
    assert train_groups.isdisjoint(validation_groups) and train_groups.isdisjoint(test_groups) and validation_groups.isdisjoint(test_groups)
    candidates = []
    for alpha in (.1, 1., 10., 100.):
        model = fit(train, alpha)
        candidates.append((metrics(validation, predict(model, validation))["mae_aed_per_year"], alpha))
    _, chosen = min(candidates)
    evaluation_model = fit(train + validation, chosen)
    ridge_metrics = metrics(test, predict(evaluation_model, test))
    baseline_metrics = metrics(test, baseline(train + validation, test))
    # Final inference model uses all observations only AFTER untouched test scoring.
    final_model = fit(rows, chosen)
    data_hash = hashlib.sha256(json.dumps(snapshot["attributes"], sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    provenance = {"source": "Public ArcGIS RentalIndexV1 aggregate table", "source_url": SERVICE + "/3", "item_url": ITEM, "item_metadata": snapshot["item"], "retrieved_at": snapshot["retrieved_at"], "data_sha256": data_hash, "raw_records": len(snapshot["attributes"]), "normalized_observations": len(rows), "rejected_base_records": rejected, "municipalities": sorted({r["municipality"] for r in rows}), "zones": len({(r["municipality"], r["zone"]) for r in rows}), "sectors": len(groups), "labels": "published aggregate annual rents; no synthetic preference or customer outcome labels", "license_status": "ArcGIS item has no stated reuse license; raw cache excluded from git; public access is not proof of redistribution permission", "freshness": "Source modified timestamp is dataset metadata, not individual transaction dates; snapshot is not a live price feed", "official_portal_reference": "https://myland.dmt.gov.ae/adrec/rental_index/api_ar.html?v=3.0", "authority_status": "Public ArcGIS publisher metadata recorded; endorsement by the official portal has not been established"}
    report = {"seed": SEED, "evaluation": "60/20/20 split by sector_id; alpha selected on validation only; test sectors excluded until final scoring", "split_sectors": {"train": len(train_groups), "validation": len(validation_groups), "test": len(test_groups)}, "split_rows": {"train": len(train), "validation": len(validation), "test": len(test)}, "ridge_test": ridge_metrics, "hierarchical_median_baseline_test": baseline_metrics, "relative_mae_improvement_percent": round(100 * (1 - ridge_metrics["mae_aed_per_year"] / baseline_metrics["mae_aed_per_year"]), 2), "alpha_validation_mae": [{"alpha": alpha, "mae_aed": mae} for mae, alpha in candidates], "recommended_for_production": False, "limitations": ["Prediction targets aggregate index values, not individual listings or future prices.", "Split estimates new-sector generalization; it does not establish future or unseen-zone performance.", "No user preference outcomes: personalized ranking remains explicit configurable rules.", "No licensed live rent/commute/amenity feed or real user-outcome evaluation.", "Dataset reuse license and authoritative ownership need verification before redistribution."], "data_sha256": data_hash}
    zones = []
    by_zone = defaultdict(list)
    for r in rows:
        by_zone[(r["municipality"], r["zone"])].append(r)
    for (municipality, zone), values in sorted(by_zone.items()):
        observed = defaultdict(list)
        for r in values:
            observed[f"{r['property_type']}|{r['bedrooms']}"].append(r["annual_rent_aed"])
        zones.append({"municipality": municipality, "zone": zone, "observations": len(values), "sectors": len({r["sector_id"] for r in values}), "observed_median_rents": {key: round(float(np.median(v)), 2) for key, v in sorted(observed.items())}})
    artifacts = ROOT / "artifacts"
    write_json(artifacts / "rent-model.json", final_model)
    write_json(artifacts / "price-clusters.json", cluster_zones(rows))
    write_json(artifacts / "zones.json", zones)
    write_json(artifacts / "provenance.json", provenance)
    write_json(artifacts / "evaluation.json", report)
    print(json.dumps({"observations": len(rows), "zones": provenance["zones"], "sectors": len(groups), "ridge_test": ridge_metrics, "baseline_test": baseline_metrics, "relative_mae_improvement_percent": report["relative_mae_improvement_percent"]}, ensure_ascii=True))


if __name__ == "__main__":
    main()
