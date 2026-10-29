#!/usr/bin/env python3
"""Stage open Bible USFM content without touching any database.

This is intentionally a source artifact/structure QA step, NOT publication.
Only pinned archive SHA-256 for BLIVRE and BPM are accepted; source wording
is preserved except USFM structural markup removal, which is documented.
"""
from __future__ import annotations
import hashlib,io,json,re,sys,urllib.request,zipfile
from pathlib import Path

SOURCES={
 "BLIVRE":("https://github.com/blivre/BibliaLivre/releases/download/2018.2.0/usfm-s-blivre-tr.zip",
 "9dc839d8c0dc6c2d732e5b56455fda11c6743d4f7c7c39dd5d25bb822ec7aff4"),
 "BPM":("https://ebible.org/Scriptures/porbrbsl_usfm.zip",
 "16375fb06fff9186a8db06353743fe8075dc77d976cc1629263dbb4497630749"),
}
IDS=("GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV").split()
NAMES=("Gênesis|Êxodo|Levítico|Números|Deuteronômio|Josué|Juízes|Rute|1 Samuel|2 Samuel|1 Reis|2 Reis|1 Crônicas|2 Crônicas|Esdras|Neemias|Ester|Jó|Salmos|Provérbios|Eclesiastes|Cânticos|Isaías|Jeremias|Lamentações|Ezequiel|Daniel|Oséias|Joel|Amós|Obadias|Jonas|Miqueias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Mateus|Marcos|Lucas|João|Atos|Romanos|1 Coríntios|2 Coríntios|Gálatas|Efésios|Filipenses|Colossenses|1 Tessalonicenses|2 Tessalonicenses|1 Timóteo|2 Timóteo|Tito|Filemom|Hebreus|Tiago|1 Pedro|2 Pedro|1 João|2 João|3 João|Judas|Apocalipse").split("|")
CHAPTERS=[50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22]
assert len(IDS)==len(NAMES)==len(CHAPTERS)==66 and sum(CHAPTERS)==1189
BOOK_INDEX={key:(i+1,NAMES[i],CHAPTERS[i]) for i,key in enumerate(IDS)}
BOOK_ID=r"(?m)^\\id\s+(\S+)"
CHAPTER_RE=re.compile(r"(?m)^\\c\s+(\d+)(?:\s|$)")
VERSE_RE=re.compile(r"\\v\s+(\d+)(?:-(\d+))?\s+")
NOTE_RE=re.compile(r"\\(?:f|x)\b[\s\S]*?\\(?:f|x)\*",flags=re.I)
MARKUP_RE=re.compile(r"\\[a-zA-Z][a-zA-Z0-9+\-*]*(?:\s+)?")

def verses_of_chapter(text:str)->list[dict]:
 # Remove footnotes/cross-references; preserve original Portuguese verse words.
 text=NOTE_RE.sub("",text)
 found=list(VERSE_RE.finditer(text))
 result=[]
 for i,m in enumerate(found):
  verse=int(m.group(1));ending=int(m.group(2) or verse)
  if ending!=verse: raise ValueError(f"Compound verse range {verse}-{ending} must be checked by an editor")
  end=found[i+1].start() if i+1<len(found) else len(text)
  chunk=text[m.end():end]
  chunk=re.sub(r"\\w\s+([^|\\]+)\|[^\\]*?\\w\*",r"\1",chunk)
  chunk=MARKUP_RE.sub(" ",chunk)
  chunk=re.sub(r"<[^>]+>"," ",chunk)
  chunk=" ".join(chunk.replace("\u00a0"," ").split())
  if not chunk:
   # Some critical-text editions retain a verse number solely to indicate
   # textual omission in manuscripts; never fabricate missing Scripture.
   print(f"  Source has no verse text at verse {verse}; record omission in review log",flush=True)
   continue
  if len(chunk)>5000:raise ValueError(f"Enormous verse {verse}")
  result.append({"number":verse,"text":chunk})
 if not result or len({row["number"] for row in result})!=len(result):
  raise ValueError("Duplicate or missing verse within chapter")
 if result[0]["number"]!=1:
  raise ValueError("Chapter missing first verse")
 return result

def parse_source(code:str,raw:bytes):
 found={}
 with zipfile.ZipFile(io.BytesIO(raw)) as z:
  for info in z.infolist():
   if not info.filename.lower().endswith((".usfm",".sfm",".txt")):continue
   text=z.read(info).decode("utf-8-sig",errors="strict").replace("\r\n","\n")
   m=re.search(BOOK_ID,text)
   if not m:continue
   usfm=m.group(1).upper()
   if usfm not in BOOK_INDEX:continue
   if usfm in found:raise ValueError(f"Duplicate canonical book: {usfm}")
   index,name,count=BOOK_INDEX[usfm]
   spans=list(CHAPTER_RE.finditer(text))
   chapters=[]
   for j,mark in enumerate(spans):
    chapter=int(mark.group(1))
    next_pos=spans[j+1].start() if j+1<len(spans) else len(text)
    try:
     verses=verses_of_chapter(text[mark.end():next_pos])
    except ValueError as exc:
     raise ValueError(f"{code} {usfm} {chapter}: {exc}") from exc
    chapters.append({
     "edition":code,"chapter_id":f"{index}:{chapter}","book_name":name,
     "chapter_number":chapter,"verses":verses
    })
   if {x["chapter_number"] for x in chapters}!=set(range(1,count+1)):
    raise ValueError(f"Chapter numbering incomplete: {usfm}")
   found[usfm]=chapters
 if set(found)!=set(IDS):raise ValueError(f"Missing books {set(IDS)-set(found)}")
 all_rows=[row for book in IDS for row in found[book]]
 total_verses=sum(len(x["verses"]) for x in all_rows)
 if len(all_rows)!=1189 or not (29000<=total_verses<=33000):
  raise ValueError(f"Invalid canonical size: {len(all_rows)} chapters, {total_verses} verses")
 return all_rows,total_verses

def main():
 outdir=Path("/tmp/labgame-open-bible-staging")
 outdir.mkdir(parents=True,exist_ok=True)
 manifest=[]
 for edition,(url,expected_sha) in SOURCES.items():
  print("Staging canonical source",edition,flush=True)
  req=urllib.request.Request(url,headers={"User-Agent":"LABGame-open-edition-source-integrity/1"})
  with urllib.request.urlopen(req,timeout=35) as response: raw=response.read(51_000_000)
  sha=hashlib.sha256(raw).hexdigest()
  if sha!=expected_sha:raise ValueError(f"{edition}: pinned SHA256 changed, manual re-audit required")
  rows,total=parse_source(edition,raw)
  file=outdir/f"{edition}.jsonl"
  with file.open("w",encoding="utf-8") as fp:
   for row in rows:fp.write(json.dumps(row,ensure_ascii=False)+"\n")
  manifest.append({"code":edition,"source_sha256":sha,"chapters":len(rows),
    "verses":total,"jsonl_sha256":hashlib.sha256(file.read_bytes()).hexdigest(),
    "public_available":False,"editorial_state":"staged-for-review"})
 manifest_file=Path("open-edition-canonical-manifest.json")
 manifest_file.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(manifest_file.read_text())
 print("Open editions are STAGED ONLY. Nothing uploaded to Supabase or deployed.")
if __name__=="__main__":
 try:main()
 except Exception as error:
  print("Open Bible staging FAILED:",str(error)[:900],file=sys.stderr)
  sys.exit(1)
