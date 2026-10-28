#!/usr/bin/env python3
"""Build the pt-BR presentation layer for the canonical Strong releases.

The Hebrew/Greek source fields and their English definitions are never changed.
Only the short display gloss is translated. Every generated row remains marked
as machine translated, so editorial review can replace it without data loss.

Bootstrap once in an isolated environment:
  python -m pip install -r scripts/requirements-strong-translation.txt
  python scripts/translate-strong-ptbr.py
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

import argostranslate.package
import argostranslate.translate
import ctranslate2

WORKSPACE = Path(__file__).resolve().parents[3]
DATA_DIR = WORKSPACE / "stepdata" / "translations"
CACHE_PATH = DATA_DIR / "pt-BR-strong-argos-cache.json"
OUTPUT_PATH = DATA_DIR / "pt-BR-strong-translations.json"
SOURCES = (
    ("hebrew", WORKSPACE / "stepdata" / "lexicon" / "TBESH.txt", "5326244c-d9ff-46f7-90f7-7155813e0d5f"),
    ("greek", WORKSPACE / "stepdata" / "lexicon" / "TBESG.txt", "638a757c-be1e-4b64-875b-9e90ba8ed69a"),
)

# These are presentation corrections for the initial editorial spot-checks.
# They remain machine-status rows; a future human review may replace them.
EDITORIAL_OVERRIDES = {
    "H7225": "princípio, começo, primeiro",
    "H1254": "criar, formar",
    "H430": "Deus, deuses",
    "H835": "feliz, bem-aventurado",
    "H1897": "meditar, murmurar, refletir",
    "G746": "princípio, começo",
    "G3056": "palavra, discurso; o Verbo",
    "G4637": "habitar, armar tenda, tabernacular",
    "G286": "cordeiro",
}


def ensure_model() -> None:
    languages = {language.code for language in argostranslate.translate.get_installed_languages()}
    if {"en", "pt"}.issubset(languages):
        return
    argostranslate.package.update_package_index()
    package = next(
        (
            item
            for item in argostranslate.package.get_available_packages()
            if item.from_code == "en" and item.to_code == "pt"
        ),
        None,
    )
    if package is None:
        raise RuntimeError("Argos Translate en→pt model was not available")
    argostranslate.package.install_from_path(package.download())


def parse_source(file_path: Path, language: str, release_id: str) -> list[dict[str, str]]:
    best: dict[str, dict[str, str | int]] = {}
    for line in file_path.read_text(encoding="utf-8-sig").splitlines():
        fields = [value.strip() for value in line.split("\t")]
        match = re.fullmatch(r"([HG])(\d{1,4})([a-zA-Z]*)", fields[0] if fields else "")
        if not match:
            continue
        strong_number = f"{match.group(1)}{int(match.group(2))}"
        if (language == "hebrew" and not strong_number.startswith("H")) or (language == "greek" and not strong_number.startswith("G")):
            continue
        gloss = fields[6] if len(fields) > 6 else ""
        if not gloss:
            continue
        suffix = match.group(3).lower()
        priority = 0 if not suffix else 1 if suffix == "a" else 2
        existing = best.get(strong_number)
        if existing is None or priority < existing["priority"]:
            best[strong_number] = {
                "release_id": release_id,
                "strong_number": strong_number,
                "gloss": gloss,
                "priority": priority,
            }
    return [{key: value for key, value in row.items() if key != "priority"} for row in best.values()]


def get_package_translation():
    languages = argostranslate.translate.get_installed_languages()
    source = next(language for language in languages if language.code == "en")
    target = next(language for language in languages if language.code == "pt")
    translation = source.get_translation(target)
    # Argos wraps the installed package with a cache. The package translation
    # exposes its SentencePiece tokenizer and CTranslate2 model directory.
    while hasattr(translation, "underlying"):
        translation = translation.underlying
    return translation


def translate_batch(translator, tokenizer, glosses: list[str]) -> list[str]:
    tokenized = [tokenizer.encode(gloss) for gloss in glosses]
    results = translator.translate_batch(
        tokenized,
        max_batch_size=len(tokenized),
        batch_type="examples",
        beam_size=1,
        num_hypotheses=1,
    )
    return [tokenizer.decode(result.hypotheses[0]).strip() for result in results]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--batch-size", type=int, default=128)
    args = parser.parse_args()

    ensure_model()
    package_translation = get_package_translation()
    translator = ctranslate2.Translator(
        str(package_translation.pkg.package_path / "model"),
        inter_threads=1,
        intra_threads=max(1, args.workers),
        compute_type="auto",
    )
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8")) if CACHE_PATH.exists() else {}
    rows = [row for language, file_path, release_id in SOURCES for row in parse_source(file_path, language, release_id)]
    missing = [gloss for gloss in dict.fromkeys(row["gloss"] for row in rows) if gloss not in cache]

    batches = [missing[index : index + args.batch_size] for index in range(0, len(missing), args.batch_size)]
    for completed, batch in enumerate(batches, start=1):
        translated = translate_batch(translator, package_translation.pkg.tokenizer, batch)
        cache.update(zip(batch, translated))
        if completed % 5 == 0 or completed == len(batches):
            CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"translated {min(completed * args.batch_size, len(missing))}/{len(missing)}", flush=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    output = []
    for row in rows:
        strong_number = row["strong_number"]
        output.append(
            {
                "release_id": row["release_id"],
                "strong_number": strong_number,
                "locale": "pt-BR",
                "translated_gloss": EDITORIAL_OVERRIDES.get(strong_number, cache[row["gloss"]]),
                "translated_definition": None,
                "translation_status": "machine",
                "translation_method": "automatic-neural",
                "source_language": "en",
                "source_gloss_sha256": hashlib.sha256(row["gloss"].encode()).hexdigest(),
                "provider": "Argos Translate en→pt; local neural model; generated 2026-10-27",
            }
        )
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(output)} translations to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
