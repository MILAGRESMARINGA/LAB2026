#!/usr/bin/env python3
"""Prove open-translation source integrity; never publish unvalidated texts.

Requires only Python stdlib, no secret/network calls to Supabase.
A reviewed, pinned archive SHA is required before subsequent publication.
"""
from __future__ import annotations
import hashlib, io, json, re, sys, urllib.request, zipfile
from pathlib import Path

SOURCES = {
 "BLIVRE": {
  "url": "https://github.com/blivre/BibliaLivre/releases/download/2018.2.0/usfm-s-blivre-tr.zip",
  "license": "https://github.com/blivre/BibliaLivre/blob/master/LICENCA.md",
  "license_name": "CC BY 3.0 Brasil",
  "version": "2018.2.0-TR"
 },
 "BPM": {
  "url": "https://ebible.org/Scriptures/porbrbsl_usfm.zip",
  "license": "https://ebible.org/find/details.php?id=porbrbsl",
  "license_name": "Public Domain",
  "version": "eBible 2026-10-08 (mutable download: pin SHA before publishing)"
 }
}

BOOKS = [
 "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL".split(),
 "MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV".split(),
]
CANON = [x for group in BOOKS for x in group]
COUNTS = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22]
assert len(CANON) == len(COUNTS) == 66 and sum(COUNTS) == 1189
BIBLE_IDS = set(CANON)

def inspect_archive(code: str, raw: bytes) -> dict:
 if len(raw) < 100_000 or len(raw) > 50_000_000:
  raise ValueError(f"{code}: unexpected archive size")
 sha = hashlib.sha256(raw).hexdigest()
 books: dict[str,set[int]] = {}
 with zipfile.ZipFile(io.BytesIO(raw)) as archive:
  members = archive.infolist()
  if len(members) > 600 or sum(m.file_size for m in members) > 120_000_000:
   raise ValueError(f"{code}: possible ZIP bomb")
  for info in members:
   if ".." in Path(info.filename).parts or info.file_size > 8_000_000:
    raise ValueError(f"{code}: unsafe ZIP entry")
   if info.is_dir() or not info.filename.lower().endswith((".usfm", ".sfm", ".txt")):
    continue
   data = archive.read(info)
   text = data.decode("utf-8-sig", errors="strict").replace("\r\n","\n")
   match = re.search(r"(?m)^\\id\s+(\S+)",text)
   if not match: continue
   usfm_id = match.group(1).upper()
   if usfm_id not in BIBLE_IDS: continue
   chapters = {int(c) for c in re.findall(r"(?m)^\\c\s+([0-9]+)\b", text)}
   if usfm_id in books:
    raise ValueError(f"{code}: duplicate canonical book {usfm_id}")
   books[usfm_id] = chapters
 if set(books) != BIBLE_IDS:
  missing=sorted(BIBLE_IDS-set(books))
  raise ValueError(f"{code}: missing canonical books {missing}")
 differences = {book: {"expected":COUNTS[i],"found":len(books[book])} for i,book in enumerate(CANON)
                if books[book] != set(range(1, COUNTS[i]+1))}
 if differences:
  raise ValueError(f"{code}: invalid chapter inventory: {str(differences)[:900]}")
 return {"code":code,"url":SOURCES[code]["url"],"sha256":sha,
         "archive_bytes":len(raw),"books":len(books),
         "chapters":sum(map(len,books.values())),"license":SOURCES[code]["license"],
         "license_name":SOURCES[code]["license_name"],"version":SOURCES[code]["version"],
         "content_ready":False,"available":False,
         "note":"Archive checked for books/chapters only. No full text import, verse QA, or production release."}

def main():
 out=[]
 for code,source in SOURCES.items():
  print("Inspecting open source",code,flush=True)
  req=urllib.request.Request(source["url"],headers={"User-Agent":"LABGame-open-rights-verifier/1"})
  with urllib.request.urlopen(req,timeout=35) as response:
   raw=response.read(51_000_000)
  out.append(inspect_archive(code,raw))
 path=Path("open-edition-source-manifest.json")
 path.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps([{"code":row["code"],"sha256":row["sha256"],
                     "books":row["books"],"chapters":row["chapters"]} for row in out],indent=2))
if __name__ == "__main__":
 try: main()
 except Exception as e:
  print("Open edition archive QA failed:",type(e).__name__,str(e)[:700],file=sys.stderr)
  sys.exit(1)
