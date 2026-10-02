"""Render fake document fixtures and deterministic photo-like variants.

No OCR, model answers, real identity imagery, official crests, or valid document
numbers are used. Arabic layout uses package-local shaping dependencies when
Pillow lacks Raqm. Run from any directory; paths resolve from this script.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import random
import re
import subprocess
import sys

PACKAGE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PACKAGE / "node_modules" / ".python"))

from PIL import Image, ImageDraw, ImageFilter, ImageFont, __version__ as pillow_version
import arabic_reshaper
from bidi.algorithm import get_display

SEED = 7102026
WIDTH, HEIGHT = 1200, 1600
INK = (33, 48, 61)
TEAL = (28, 89, 89)
RED = (160, 48, 49)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def arabic_sources() -> list[dict]:
    return [
        {"id": "fake_ar_passport_001", "case_id": "hire_demo_001", "synthetic": True, "kind": "passport", "language": "ar", "text": "جواز سفر وهمي — غير صالح للسفر\nالاسم الكامل: سامي مثال تجريبي\nرقم الجواز: FAKE-AR-P-001\nالجنسية: جمهورية المثال الوهمية\nتاريخ الميلاد: ١٩٩٤-٠٣-٠٢\nتاريخ الانتهاء: ٢٠٣١-٠٥-٠٦", "expected": {"full_name": "سامي مثال تجريبي", "passport_number": "FAKE-AR-P-001", "nationality": "جمهورية المثال الوهمية", "date_of_birth": "1994-03-02", "expiry_date": "2031-05-06"}},
        {"id": "fake_bilingual_passport_002", "case_id": "hire_demo_002", "synthetic": True, "kind": "passport", "language": "ar-en", "text": "FAKE PASSPORT / جواز سفر وهمي\nFull name / الاسم الكامل: ليلى مثال تجريبي\nPassport number / رقم الجواز: FAKE-BI-P-002\nNationality / الجنسية: دولة الاختبار الوهمية\nDate of birth / تاريخ الميلاد: 1996-08-14\nExpiry date / تاريخ الانتهاء: 2032-07-01", "expected": {"full_name": "ليلى مثال تجريبي", "passport_number": "FAKE-BI-P-002", "nationality": "دولة الاختبار الوهمية", "date_of_birth": "1996-08-14", "expiry_date": "2032-07-01"}},
        {"id": "fake_ar_offer_003", "case_id": "hire_demo_003", "synthetic": True, "kind": "offer_letter", "language": "ar", "text": "عرض عمل وهمي — مثال للاختبار فقط\nالموظف: نور مثال تجريبي\nجهة العمل: شركة المثال الوهمية\nالمسمى الوظيفي: مهندس برمجيات\nتاريخ البدء: ٢٠٢٦-١١-١٥\nالراتب السنوي: ٢٦٤٬٠٠٠ درهم في ١٢ دفعة شهرية متساوية", "expected": {"employee_name": "نور مثال تجريبي", "employer": "شركة المثال الوهمية", "role": "مهندس برمجيات", "start_date": "2026-11-15", "monthly_salary_aed": 22000}},
        {"id": "fake_bilingual_offer_004", "case_id": "hire_demo_004", "synthetic": True, "kind": "offer_letter", "language": "ar-en", "text": "SYNTHETIC OFFER / عرض عمل وهمي\nEmployee / الموظف: رامي مثال تجريبي\nEmployer / جهة العمل: مختبر الاختبار الوهمي\nRole / المسمى الوظيفي: محلل بيانات\nStart date / تاريخ البدء: لم يحدد بعد\nMonthly salary / الراتب الشهري: AED 27,500", "expected": {"employee_name": "رامي مثال تجريبي", "employer": "مختبر الاختبار الوهمي", "role": "محلل بيانات", "start_date": None, "monthly_salary_aed": 27500}},
        {"id": "fake_ar_degree_005", "case_id": "hire_demo_001", "synthetic": True, "kind": "degree_certificate", "language": "ar", "text": "شهادة تعليمية وهمية — لا قيمة أكاديمية لها\nالاسم: سارة مثال تجريبي\nالمؤسسة: جامعة المثال الوهمية\nالدرجة: بكالوريوس العلوم\nالتخصص: هندسة الحاسوب\nتاريخ المنح: ٢٠١٨-٠٦-٣٠", "expected": {"full_name": "سارة مثال تجريبي", "institution": "جامعة المثال الوهمية", "degree": "بكالوريوس العلوم", "field": "هندسة الحاسوب", "award_date": "2018-06-30"}},
        {"id": "fake_bilingual_degree_006", "case_id": "hire_demo_002", "synthetic": True, "kind": "degree_certificate", "language": "ar-en", "text": "FAKE DEGREE / شهادة وهمية\nName / الاسم: آدم مثال تجريبي\nInstitution / المؤسسة: معهد الاختبار الوهمي\nDegree / الدرجة: ماجستير العلوم\nField / التخصص: الإحصاء\nAward date / تاريخ المنح: 2023-07-15", "expected": {"full_name": "آدم مثال تجريبي", "institution": "معهد الاختبار الوهمي", "degree": "ماجستير العلوم", "field": "الإحصاء", "award_date": "2023-07-15"}},
        {"id": "fake_ar_bank_007", "case_id": "hire_demo_003", "synthetic": True, "kind": "bank_statement", "language": "ar", "text": "خطاب مصرفي وهمي — لا قيمة مالية له\nصاحب الحساب: مريم مثال تجريبي\nالمصرف: مصرف الاختبار الوهمي\nرقم الحساب: FAKE-AR-ACCT-007\nبداية الفترة: ٢٠٢٦-٠٩-٠١\nنهاية الفترة: ٢٠٢٦-٠٩-٣٠\nالرصيد الختامي: ١٢٬٣٤٥٫٧٥ درهم", "expected": {"account_holder": "مريم مثال تجريبي", "bank": "مصرف الاختبار الوهمي", "account_number": "FAKE-AR-ACCT-007", "period_start": "2026-09-01", "period_end": "2026-09-30", "closing_balance_aed": 12345.75}},
        {"id": "fake_bilingual_bank_008", "case_id": "hire_demo_004", "synthetic": True, "kind": "bank_statement", "language": "ar-en", "text": "SYNTHETIC BANK LETTER / خطاب مصرفي وهمي\nAccount holder / صاحب الحساب: هدى مثال تجريبي\nBank / المصرف: بنك المثال الوهمي\nAccount number / رقم الحساب: FAKE-BI-ACCT-008\nPeriod start / بداية الفترة: 2026-08-01\nPeriod end / نهاية الفترة: 2026-08-31\nClosing balance / الرصيد الختامي: AED -75.50", "expected": {"account_holder": "هدى مثال تجريبي", "bank": "بنك المثال الوهمي", "account_number": "FAKE-BI-ACCT-008", "period_start": "2026-08-01", "period_end": "2026-08-31", "closing_balance_aed": -75.5}},
    ]


def has_arabic(value: str) -> bool:
    return any("\u0600" <= char <= "\u06ff" for char in value)


def display_text(value: str) -> str:
    if not has_arabic(value):
        return value
    # Unicode LRM isolates ISO date tokens so RTL does not reorder YYYY-MM-DD.
    isolated = re.sub(r"(?<!\w)[0-9٠-٩]{4}-[0-9٠-٩]{2}-[0-9٠-٩]{2}(?!\w)", lambda match: "\u200e" + match.group(0) + "\u200e", value)
    return get_display(arabic_reshaper.reshape(isolated)).replace("\u200e", "")


def wrap_line(value: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines, current = [], ""
    for word in value.split():
        candidate = f"{current} {word}".strip()
        if current and font.getlength(display_text(candidate)) > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def fonts(font_path: Path) -> dict[str, ImageFont.FreeTypeFont]:
    return {name: ImageFont.truetype(str(font_path), size) for name, size in [("title", 43), ("body", 32), ("small", 23), ("warning", 27), ("stamp", 31)]}


def render_clean(source: dict, font_path: Path) -> tuple[Image.Image, list[dict]]:
    font = fonts(font_path)
    image = Image.new("RGB", (WIDTH, HEIGHT), (249, 248, 244))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((40, 35, WIDTH - 40, HEIGHT - 35), radius=18, fill=(255, 255, 253), outline=(209, 216, 214), width=2)
    draw.rectangle((40, 35, WIDTH - 40, 225), fill=TEAL)
    draw.text((82, 72), "RASIKH DOCUMENT LAB", font=font["title"], fill="white")
    draw.text((84, 138), "SYNTHETIC TEST DOCUMENT / NO OFFICIAL VALUE", font=font["small"], fill=(213, 233, 228))
    draw.text((84, 180), source["kind"].replace("_", " ").upper(), font=font["small"], fill=(213, 233, 228))
    draw.rounded_rectangle((80, 251, WIDTH - 80, 311), radius=8, outline=RED, width=2)
    draw.text((101, 264), "FAKE / NOT VALID — ALL IDENTITIES ARE EXAMPLES", font=font["warning"], fill=RED)
    boxes, y = [], 351
    for source_line in source["text"].splitlines():
        for line in wrap_line(source_line, font["body"], WIDTH - 176):
            rendered = display_text(line)
            rtl = has_arabic(line)
            x = WIDTH - 88 - font["body"].getlength(rendered) if rtl else 88
            draw.text((x, y), rendered, font=font["body"], fill=INK)
            bbox = draw.textbbox((x, y), rendered, font=font["body"])
            boxes.append({"source_text": line, "bounds": list(bbox), "rtl_shaped": rtl})
            y += 66
        y += 13
    if y > 1370:
        raise ValueError(f"Document content overflows: {source['id']}")
    draw.line((88, 1380, WIDTH - 88, 1380), fill=(205, 212, 210), width=2)
    footer = f"Fixture: {source['id']}"
    draw.text((88, 1407), footer, font=font["small"], fill=(92, 107, 105))
    draw.text((88, 1450), "TRAINING COPY — NO REAL PERSON OR ACCOUNT", font=font["warning"], fill=RED)
    draw.text((88, 1495), display_text("وثيقة وهمية للاختبار فقط — غير صالحة"), font=font["warning"], fill=RED)
    return image, boxes


def recipe_for(document_id: str, cohort: str) -> dict:
    local_seed = int(sha256(f"{SEED}:{document_id}".encode())[:16], 16)
    rng = random.Random(local_seed)
    clean = cohort != "degraded"
    return {
        "seed": local_seed,
        "operation_order": ["render", "stamps", "lighting", "gaussian_noise", "rotation", "gaussian_blur", "crop", "encode"],
        "canvas_px": [WIDTH, HEIGHT],
        "rotation_degrees": 0 if clean else round(rng.uniform(-2.8, 2.8), 3),
        "blur_radius_px": 0 if clean else round(rng.uniform(0.4, 0.95), 3),
        "lighting": {"gradient_strength": 0 if clean else round(rng.uniform(0.12, 0.25), 3), "vignette_strength": 0 if clean else round(rng.uniform(0.09, 0.19), 3), "warm_tint_rgb": [1.0, 1.0, 1.0] if clean else [1.0, 0.985, 0.956]},
        "noise_sigma": 0 if clean else round(rng.uniform(0.6, 1.6), 3),
        "crop_edges_px": [0, 0, 0, 0] if clean else [rng.randint(5, 18), rng.randint(4, 13), rng.randint(6, 20), rng.randint(6, 20)],
        "stamp": None if clean else {"text": "SYNTHETIC COPY", "center_px": [rng.randint(785, 950), rng.randint(1130, 1240)], "angle_degrees": round(rng.uniform(-18, -8), 3), "alpha": 122},
        "encoding": {"format": "png" if clean else "jpeg", "quality": None if clean else rng.randint(45, 69), "subsampling": None if clean else 2, "optimize": False},
        "expected_visibility": "All scored fields retained; crop affects outer margins only. Existing unreadable fields remain null.",
    }


def stamp(image: Image.Image, recipe: dict, font_path: Path) -> Image.Image:
    settings = recipe["stamp"]
    if settings is None:
        return image
    layer = Image.new("RGBA", (460, 160), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    color = (*RED, settings["alpha"])
    draw.rounded_rectangle((8, 10, 452, 150), radius=11, outline=color, width=4)
    draw.text((32, 54), settings["text"], fill=color, font=fonts(font_path)["stamp"])
    layer = layer.rotate(settings["angle_degrees"], resample=Image.Resampling.BICUBIC, expand=True)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    cx, cy = settings["center_px"]
    overlay.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)))
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def degrade(image: Image.Image, recipe: dict, font_path: Path) -> Image.Image:
    image = stamp(image, recipe, font_path)
    lighting = recipe["lighting"]
    rng = random.Random(recipe["seed"] + 1)
    source = image.load()
    for y in range(image.height):
        ny = (y - image.height / 2) / (image.height / 2)
        for x in range(image.width):
            nx = (x - image.width / 2) / (image.width / 2)
            factor = 1 - lighting["gradient_strength"] * (x / image.width) - lighting["vignette_strength"] * (nx * nx + ny * ny) / 2
            noise = rng.gauss(0, recipe["noise_sigma"])
            source[x, y] = tuple(max(0, min(255, round(channel * factor * tint + noise))) for channel, tint in zip(source[x, y], lighting["warm_tint_rgb"]))
    image = image.rotate(recipe["rotation_degrees"], resample=Image.Resampling.BICUBIC, expand=False, fillcolor=(216, 207, 191))
    image = image.filter(ImageFilter.GaussianBlur(recipe["blur_radius_px"]))
    left, top, right, bottom = recipe["crop_edges_px"]
    return image.crop((left, top, image.width - right, image.height - bottom))


def source_documents(node: str) -> list[dict]:
    command = [node, "--import", "tsx", "--input-type=module", "-e", "import {documentFixtures} from './src/fixtures/documents.ts'; process.stdout.write(JSON.stringify(documentFixtures));"]
    result = subprocess.run(command, cwd=PACKAGE, check=True, capture_output=True, text=True, encoding="utf-8")
    documents = json.loads(result.stdout)
    if len(documents) != 20 or not all(source["synthetic"] for source in documents):
        raise ValueError("Expected exactly 20 original synthetic fixtures.")
    return [{**source, "language": "en"} for source in documents]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--node", default="node")
    parser.add_argument("--font", default=os.environ.get("RASIKH_DOCUMENT_FONT", "C:/Windows/Fonts/tahoma.ttf"))
    parser.add_argument("--output", type=Path, default=PACKAGE / "assets" / "documents")
    parser.add_argument("--cohort", choices=["all", "arabic"], default="all", help="Arabic-only refresh preserves existing clean/degraded image records.")
    args = parser.parse_args()
    font_path = Path(args.font).resolve()
    if not font_path.is_file():
        raise ValueError("Supply an Arabic-capable font with --font or RASIKH_DOCUMENT_FONT.")
    original = source_documents(args.node)
    sources = original + arabic_sources()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    records = []
    if args.cohort == "arabic":
        existing = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
        records = [record for record in existing["documents"] if record["cohort"] != "arabic"]
    for source in sources:
        if args.cohort == "arabic" and source["language"] == "en":
            continue
        cohorts = ["clean", "degraded"] if source["language"] == "en" else ["arabic"]
        clean, boxes = render_clean(source, font_path)
        for cohort in cohorts:
            recipe = recipe_for(source["id"], cohort)
            image = degrade(clean.copy(), recipe, font_path) if cohort == "degraded" else clean.copy()
            extension = "jpg" if cohort == "degraded" else "png"
            relative = f"{cohort}/{source['id']}.{extension}"
            target = output / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            save_options = {"quality": recipe["encoding"]["quality"], "subsampling": 2, "optimize": False} if extension == "jpg" else {"optimize": False, "compress_level": 9}
            image.save(target, **save_options)
            records.append({"id": f"{source['id']}__{cohort}", "source_fixture_id": source["id"], "case_id": source["case_id"], "synthetic": True, "kind": source["kind"], "cohort": cohort, "language": source["language"], "image": relative, "mime_type": "image/jpeg" if extension == "jpg" else "image/png", "width": image.width, "height": image.height, "sha256": sha256(target.read_bytes()), "source_text": source["text"], "source_text_sha256": sha256(source["text"].encode("utf-8")), "expected": source["expected"], "render_recipe": recipe, "source_text_boxes": boxes})
    manifest = {"schema_version": "1.0.0", "synthetic": True, "dataset": "rasikh-rendered-documents-v1", "seed": SEED, "generated_by": "scripts/render-documents.py", "render_environment": {"python": sys.version.split()[0], "pillow": pillow_version, "arabic_reshaper": importlib.metadata.version("arabic-reshaper"), "python_bidi": importlib.metadata.version("python-bidi"), "font_file": font_path.name, "font_sha256": sha256(font_path.read_bytes()), "arabic_layout": "arabic-reshaper + Unicode bidi; LRM-isolated ISO dates; Pillow BASIC layout"}, "source_fixtures_sha256": sha256((PACKAGE / "src/fixtures/documents.ts").read_bytes()), "notice": "Entirely fake synthetic evaluation documents. No official crests, valid MRZ, biometric photo, real identity, valid passport/account identifier or signature. Rendering recipe preserves scored fields.", "documents": records}
    manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    (output / "manifest.json").write_bytes(manifest_bytes)
    print(json.dumps({"images": len(records), "cohorts": {cohort: sum(record["cohort"] == cohort for record in records) for cohort in ["clean", "degraded", "arabic"]}, "manifest_sha256": sha256(manifest_bytes)}))


if __name__ == "__main__":
    main()
