# -*- coding: utf-8 -*-
"""
13개 대학 공식 2028학년도 대학입학전형 시행계획 PDF에서 주요 변경사항/전형요소/수능반영 핵심 텍스트 추출
"""
from pathlib import Path
import pymupdf

BASE = Path(r"c:/Vibe Coding/23. junhee/입결DB_2029맞춤_서울13개교")
RAW = BASE / "raw_data"
OUT = BASE / "intermediate" / "plan2028_extracts"
OUT.mkdir(parents=True, exist_ok=True)

UNIVS = ["서울대", "연세대", "고려대", "서강대", "성균관대", "한양대", "중앙대", "경희대", "한국외대", "서울시립대", "건국대", "동국대", "홍익대"]

KEYWORDS = ["주요 변경", "주요변경", "변경사항", "변경 사항", "주요사항", "주요 사항", "전형요소", "반영비율", "학생부교과", "학생부종합", "정시모집", "수능위주", "수능 반영", "논술"]

for u in UNIVS:
    pdf_path = RAW / u / "2028_시행계획.pdf"
    if not pdf_path.exists():
        print(f"[MISSING] {u}/2028_시행계획.pdf")
        continue
    raw_bytes = pdf_path.read_bytes()
    if raw_bytes[:4] != b"%PDF":
        print(f"[NOT_PDF] {u}/2028_시행계획.pdf ({len(raw_bytes)} bytes)")
        continue
    doc = pymupdf.open(pdf_path)
    chunks = [f"=== {u} 2028학년도 시행계획 (총 {len(doc)}쪽) ===\n"]
    extracted_pages = 0
    for idx, page in enumerate(doc):
        txt = page.get_text("text").strip()
        if not txt:
            continue
        # Always include first 10 pages + any page with key reform terms (up to 25 pages)
        if idx < 10 or (extracted_pages < 28 and any(k in txt for k in ["주요 변경", "변경사항", "전형요소", "수능 영역별", "교과역량", "5등급", "교과전형", "정시모집"])):
            chunks.append(f"\n--- PAGE {idx + 1} ---\n{txt}")
            extracted_pages += 1
    out_txt = OUT / f"{u}_2028_extract.txt"
    out_txt.write_text("\n".join(chunks), encoding="utf-8")
    print(f"[OK] {u}: {len(doc)} pages -> extracted {extracted_pages} pages ({out_txt.stat().st_size:,} bytes)")
