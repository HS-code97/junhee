# -*- coding: utf-8 -*-
import json
from pathlib import Path
import requests

base = Path(r"c:/Vibe Coding/23. junhee/입결DB_2029맞춤_서울13개교/raw_data")
d = json.load(open(base / "_adiga/batch1_detail_links.json", encoding="utf-8"))
targets = []
for item in d:
    u, tag = item["univ"], item["tag"]
    for lk in item.get("links", []):
        h = lk["href"]
        if u == "서울대" and "fileidx=51182" in h:
            targets.append((u, "2028_시행계획.pdf", h))
        elif u == "연세대" and "202604201055398D4W8V" in h:
            targets.append((u, "2026_수시선발결과.pdf", h))
        elif u == "서강대" and tag == "plan2028" and "download.File.asp" in h:
            targets.append((u, "2028_시행계획.pdf", h))
        elif u == "서강대" and tag == "result" and "20260602150120JNQJPH.pdf" in h:
            targets.append((u, "2026_입시결과.pdf", h))
        elif u == "성균관대" and tag == "plan2028" and "download.php" in h:
            targets.append((u, "2028_시행계획.pdf", h))

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36"}
for u, fn, url in targets:
    try:
        r = requests.get(url, headers=headers, timeout=30)
        out = base / u / fn
        out.write_bytes(r.content)
        ct = r.headers.get("Content-Type", "")
        is_pdf = r.content[:4] == b"%PDF"
        print(f"[OK] {u}/{fn}: {len(r.content):,} bytes | PDF={is_pdf} | CT={ct}")
    except Exception as e:
        print(f"[ERR] {u}/{fn}: {e}")
