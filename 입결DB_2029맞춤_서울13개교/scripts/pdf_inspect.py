# -*- coding: utf-8 -*-
"""
PDF 텍스트 추출 및 2028 시행계획 / 입시결과 PDF 점검 유틸리티
"""
import sys
from pathlib import Path
import fitz  # PyMuPDF


def inspect_pdf(pdf_path: str, keywords=None, max_pages=60):
    p = Path(pdf_path)
    doc = fitz.open(p)
    print(f"=== {p.name} | Pages: {len(doc)} | Size: {p.stat().st_size:,} bytes ===")
    text_pages = 0
    hits = []
    for i, page in enumerate(doc):
        if i >= max_pages:
            break
        txt = page.get_text("text").strip()
        if len(txt) > 30:
            text_pages += 1
        if keywords:
            for kw in keywords:
                if kw in txt:
                    hits.append((i + 1, kw, txt[:400].replace("\n", " ")))
                    break
    print(f"Text-extractable pages (first {min(len(doc), max_pages)}): {text_pages}")
    if keywords:
        for pg, kw, sn in hits[:15]:
            print(f"  [p.{pg} | {kw}] {sn[:220]}")
    else:
        for i in range(min(3, len(doc))):
            print(f"--- Page {i+1} ---")
            print(doc[i].get_text("text")[:1000])


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_inspect.py <pdf_path> [kw1 kw2 ...]")
        sys.exit(1)
    inspect_pdf(sys.argv[1], sys.argv[2:] if len(sys.argv) > 2 else None)
