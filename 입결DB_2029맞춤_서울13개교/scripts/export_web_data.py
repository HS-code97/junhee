# -*- coding: utf-8 -*-
"""
서울 13개 대학 3개년 입결 & 2029 맞춤 DB → 모바일 웹 정적 JSON 분할 추출기
- build_excel.py 와 100% 동일한 데이터/집계/보간 로직을 적용하여
  web/public/data/*.json 및 다운로드용 원본 .xlsx 에셋을 생성합니다.
"""
from __future__ import annotations
import json
import math
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

from schema_utils import (
    ALL_UNIVS,
    UNIV_BATCH_1,
    UNIV_BATCH_2,
    UNIV_FULL_NAMES,
    INTERMEDIATE_DIR,
    OUTPUT_DIR,
)
from build_excel import load_all_checkpoints

REPO_ROOT = Path(r"c:/Vibe Coding/23. junhee")
WEB_PUBLIC_DIR = REPO_ROOT / "web" / "public"
DATA_OUT_DIR = WEB_PUBLIC_DIR / "data"
DOWNLOAD_OUT_DIR = WEB_PUBLIC_DIR / "downloads"

G9_MIDS = [
    (1, 2.0),
    (2, 7.5),
    (3, 17.0),
    (4, 31.5),
    (5, 50.0),
    (6, 68.5),
    (7, 83.0),
    (8, 92.5),
    (9, 98.0),
]


def clean_num(val: Any, decimals: Optional[int] = None) -> Optional[float | int]:
    if val is None or (isinstance(val, float) and math.isnan(val)) or pd.isna(val):
        return None
    f = float(val)
    if decimals is None:
        return int(round(f))
    return round(f, decimals)


def clean_text(val: Any) -> str:
    if val is None or pd.isna(val):
        return ""
    s = str(val).strip()
    return "" if s.lower() == "nan" else s


def g9_to_cum_pct(avg_cut: Optional[float]) -> Optional[float]:
    if avg_cut is None:
        return None
    if avg_cut >= 9.0:
        return 98.0
    if avg_cut < 1.0:
        return 2.0
    idx = min(int(math.floor(avg_cut)) - 1, 7)
    g_cur, mid_cur = G9_MIDS[idx]
    _, mid_next = G9_MIDS[idx + 1]
    return mid_cur + (avg_cut - g_cur) * (mid_next - mid_cur)


def g5_bucket_label(req_pct: Optional[float]) -> str:
    if req_pct is None:
        return ""
    p_txt = f"{req_pct:.1f}%"
    if req_pct <= 10.0:
        return f"1등급 ({p_txt})"
    if req_pct <= 34.0:
        return f"2등급 ({p_txt})"
    if req_pct <= 66.0:
        return f"3등급 ({p_txt})"
    if req_pct <= 90.0:
        return f"4등급 ({p_txt})"
    return f"5등급 ({p_txt})"


def format_susi_trend(c24: Optional[float], c25: Optional[float], c26: Optional[float]) -> str:
    if c24 is not None and c26 is not None:
        diff = c26 - c24
        if diff < -0.05:
            return f"▲상승({diff:.2f})"
        if diff > 0.05:
            return f"▼하락(+{diff:.2f})"
        return f"─유지({diff:.2f})"
    if c25 is not None and c26 is not None:
        diff = c26 - c25
        sign = "+" if diff > 0 else ""
        return f"25→26({sign}{diff:.2f})"
    return "단일연도"


def format_jeongsi_trend(p24: Optional[float], p25: Optional[float], p26: Optional[float]) -> str:
    if p24 is not None and p26 is not None:
        diff = p26 - p24
        if diff > 0.5:
            return f"▲상승(+{diff:.1f})"
        if diff < -0.5:
            return f"▼하락({diff:.1f})"
        return f"─유지({diff:.1f})"
    if p25 is not None and p26 is not None:
        diff = p26 - p25
        sign = "+" if diff > 0 else ""
        return f"25→26({sign}{diff:.1f})"
    return "단일연도"


def main():
    DATA_OUT_DIR.mkdir(parents=True, exist_ok=True)
    DOWNLOAD_OUT_DIR.mkdir(parents=True, exist_ok=True)

    df_susi, df_jeongsi = load_all_checkpoints()

    # Match Sheet 2 & Sheet 3 rounding (2 decimal places for float columns)
    susi_float_cols = ["경쟁률", "최종등록자_50%컷(9등급)", "최종등록자_70%컷(9등급)", "평균등급", "최초합격컷"]
    jeongsi_float_cols = [
        "경쟁률",
        "대학환산점수_만점기준",
        "대학환산점수_50%컷",
        "대학환산점수_70%컷",
        "국수탐_평균백분위_50%컷",
        "국수탐_평균백분위_70%컷",
        "영어_평균등급",
    ]
    for c in susi_float_cols:
        df_susi[c] = df_susi[c].round(2)
    for c in jeongsi_float_cols:
        df_jeongsi[c] = df_jeongsi[c].round(2)

    # 1. Build Raw JSON arrays
    susi_raw: List[Dict[str, Any]] = []
    for idx, rec in enumerate(df_susi.to_dict(orient="records")):
        susi_raw.append({
            "id": idx,
            "yr": clean_num(rec["학년도"]),
            "u": clean_text(rec["대학명"]),
            "t": clean_text(rec["전형유형"]),
            "adm": clean_text(rec["세부전형명"]),
            "tr": clean_text(rec["계열"]),
            "dept": clean_text(rec["모집단위(학과)"]),
            "stdDept": clean_text(rec["표준모집단위명(3개년추적용)"]),
            "quota": clean_num(rec["모집인원"]),
            "app": clean_num(rec["지원인원"]),
            "rate": clean_num(rec["경쟁률"], 2),
            "wait": clean_num(rec["충원합격순위"]),
            "c50": clean_num(rec["최종등록자_50%컷(9등급)"], 2),
            "c70": clean_num(rec["최종등록자_70%컷(9등급)"], 2),
            "cAvg": clean_num(rec["평균등급"], 2),
            "cInit": clean_num(rec["최초합격컷"], 2),
            "src": clean_text(rec["출처구분"]),
            "url": clean_text(rec["원본URL_또는_파일명"]),
            "note": clean_text(rec["비고"]),
        })

    jeongsi_raw: List[Dict[str, Any]] = []
    for idx, rec in enumerate(df_jeongsi.to_dict(orient="records")):
        jeongsi_raw.append({
            "id": idx,
            "yr": clean_num(rec["학년도"]),
            "u": clean_text(rec["대학명"]),
            "gun": clean_text(rec["모집군"]),
            "adm": clean_text(rec["세부전형명"]),
            "tr": clean_text(rec["계열"]),
            "dept": clean_text(rec["모집단위(학과)"]),
            "stdDept": clean_text(rec["표준모집단위명(3개년추적용)"]),
            "quota": clean_num(rec["모집인원"]),
            "app": clean_num(rec["지원인원"]),
            "rate": clean_num(rec["경쟁률"], 2),
            "wait": clean_num(rec["충원합격순위"]),
            "sMax": clean_num(rec["대학환산점수_만점기준"], 2),
            "s50": clean_num(rec["대학환산점수_50%컷"], 2),
            "s70": clean_num(rec["대학환산점수_70%컷"], 2),
            "p50": clean_num(rec["국수탐_평균백분위_50%컷"], 2),
            "p70": clean_num(rec["국수탐_평균백분위_70%컷"], 2),
            "eng": clean_num(rec["영어_평균등급"], 2),
            "src": clean_text(rec["출처구분"]),
            "url": clean_text(rec["원본URL_또는_파일명"]),
            "note": clean_text(rec["비고"]),
        })

    # 2. Build Sheet 4 Simulator Aggregations (exact match to build_excel.py)
    # Index raw rows for fast AVERAGEIFS-equivalent lookup
    from collections import defaultdict
    susi_cut_map: Dict[tuple, List[float]] = defaultdict(list)
    susi_note_map: Dict[tuple, str] = {}
    susi_quota26_map: Dict[tuple, Optional[int]] = {}
    susi_rate26_map: Dict[tuple, Optional[float]] = {}

    for r in susi_raw:
        k_base = (r["u"], r["adm"], r["stdDept"])
        if r["c70"] is not None and r["c70"] > 0:
            susi_cut_map[(*k_base, r["yr"])].append(r["c70"])
        if r["note"] and k_base not in susi_note_map:
            susi_note_map[k_base] = r["note"]
        if r["yr"] == 2026 and k_base not in susi_quota26_map:
            susi_quota26_map[k_base] = r["quota"]
            susi_rate26_map[k_base] = r["rate"]

    susi_work = df_susi[df_susi["최종등록자_70%컷(9등급)"].notna()].drop_duplicates(
        subset=["대학명", "전형유형", "세부전형명", "계열", "표준모집단위명(3개년추적용)"]
    )

    susi_sim: List[Dict[str, Any]] = []
    for idx, (_, row) in enumerate(susi_work.iterrows()):
        u = clean_text(row["대학명"])
        t = clean_text(row["전형유형"])
        adm = clean_text(row["세부전형명"])
        tr = clean_text(row["계열"])
        d = clean_text(row["표준모집단위명(3개년추적용)"])
        k_base = (u, adm, d)

        vals_by_yr: Dict[int, Optional[float]] = {}
        for yr in (2024, 2025, 2026):
            arr = susi_cut_map.get((*k_base, yr), [])
            vals_by_yr[yr] = sum(arr) / len(arr) if arr else None

        c24, c25, c26 = vals_by_yr[2024], vals_by_yr[2025], vals_by_yr[2026]
        valid_cuts = [x for x in (c24, c25, c26) if x is not None]
        avg_cut = sum(valid_cuts) / len(valid_cuts) if valid_cuts else None
        req_pct = g9_to_cum_pct(avg_cut)

        susi_sim.append({
            "id": idx,
            "u": u,
            "t": t,
            "adm": adm,
            "tr": tr,
            "d": d,
            "c24": round(c24, 4) if c24 is not None else None,
            "c25": round(c25, 4) if c25 is not None else None,
            "c26": round(c26, 4) if c26 is not None else None,
            "avg": round(avg_cut, 6) if avg_cut is not None else None,
            "trend": format_susi_trend(c24, c25, c26),
            "reqPct": round(req_pct, 6) if req_pct is not None else None,
            "g5Label": g5_bucket_label(req_pct),
            "q26": susi_quota26_map.get(k_base),
            "r26": susi_rate26_map.get(k_base),
            "note": susi_note_map.get(k_base, ""),
        })

    # Jeongsi simulator aggregation
    j_pct_map: Dict[tuple, List[float]] = defaultdict(list)
    j_note_map: Dict[tuple, str] = {}
    j_quota26_map: Dict[tuple, Optional[int]] = {}
    j_rate26_map: Dict[tuple, Optional[float]] = {}

    for r in jeongsi_raw:
        k_base = (r["u"], r["gun"], r["adm"], r["stdDept"])
        if r["p70"] is not None and r["p70"] > 0:
            j_pct_map[(*k_base, r["yr"])].append(r["p70"])
        if r["note"] and k_base not in j_note_map:
            j_note_map[k_base] = r["note"]
        if r["yr"] == 2026 and k_base not in j_quota26_map:
            j_quota26_map[k_base] = r["quota"]
            j_rate26_map[k_base] = r["rate"]

    j_work = df_jeongsi[df_jeongsi["국수탐_평균백분위_70%컷"].notna()].drop_duplicates(
        subset=["대학명", "모집군", "세부전형명", "계열", "표준모집단위명(3개년추적용)"]
    )

    jeongsi_sim: List[Dict[str, Any]] = []
    for idx, (_, row) in enumerate(j_work.iterrows()):
        u = clean_text(row["대학명"])
        gun = clean_text(row["모집군"])
        adm = clean_text(row["세부전형명"])
        tr = clean_text(row["계열"])
        d = clean_text(row["표준모집단위명(3개년추적용)"])
        k_base = (u, gun, adm, d)

        vals_by_yr: Dict[int, Optional[float]] = {}
        for yr in (2024, 2025, 2026):
            arr = j_pct_map.get((*k_base, yr), [])
            vals_by_yr[yr] = sum(arr) / len(arr) if arr else None

        p24, p25, p26 = vals_by_yr[2024], vals_by_yr[2025], vals_by_yr[2026]
        valid_pcts = [x for x in (p24, p25, p26) if x is not None]
        avg_pct = sum(valid_pcts) / len(valid_pcts) if valid_pcts else None

        jeongsi_sim.append({
            "id": idx,
            "u": u,
            "gun": gun,
            "adm": adm,
            "tr": tr,
            "d": d,
            "p24": round(p24, 4) if p24 is not None else None,
            "p25": round(p25, 4) if p25 is not None else None,
            "p26": round(p26, 4) if p26 is not None else None,
            "avg": round(avg_pct, 6) if avg_pct is not None else None,
            "trend": format_jeongsi_trend(p24, p25, p26),
            "q26": j_quota26_map.get(k_base),
            "r26": j_rate26_map.get(k_base),
            "note": j_note_map.get(k_base, ""),
        })

    # 3. Load 2028 Reform & Collection Log
    reform_path = INTERMEDIATE_DIR / "2028_시행계획_13개교.json"
    reform_data = json.loads(reform_path.read_text(encoding="utf-8")) if reform_path.exists() else []
    log_path = INTERMEDIATE_DIR / "collection_log.json"
    log_data = json.loads(log_path.read_text(encoding="utf-8")) if log_path.exists() else {}

    # Build Sheet 1 Dashboard summary
    univ_logs = log_data.get("universities", {})
    dashboard_rows = []
    for u in ALL_UNIVS:
        ul = univ_logs.get(u, {})
        s24 = int(((df_susi["대학명"] == u) & (df_susi["학년도"] == 2024)).sum())
        s25 = int(((df_susi["대학명"] == u) & (df_susi["학년도"] == 2025)).sum())
        s26 = int(((df_susi["대학명"] == u) & (df_susi["학년도"] == 2026)).sum())
        j24 = int(((df_jeongsi["대학명"] == u) & (df_jeongsi["학년도"] == 2024)).sum())
        j25 = int(((df_jeongsi["대학명"] == u) & (df_jeongsi["학년도"] == 2025)).sum())
        j26 = int(((df_jeongsi["대학명"] == u) & (df_jeongsi["학년도"] == 2026)).sum())
        dashboard_rows.append({
            "batch": "Batch 1" if u in UNIV_BATCH_1 else "Batch 2",
            "univ": u,
            "fullName": UNIV_FULL_NAMES.get(u, u),
            "s24": s24,
            "s25": s25,
            "s26": s26,
            "sTotal": s24 + s25 + s26,
            "j24": j24,
            "j25": j25,
            "j26": j26,
            "jTotal": j24 + j25 + j26,
            "has2028Pdf": bool(ul.get("has_2028_pdf")),
            "status": ul.get("status", "부분완료"),
            "notes": ul.get("missing_or_notes", ""),
            "url": ul.get("url", ""),
        })

    sim_meta_payload = {
        "meta": {
            "generatedAt": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "totalSusi": len(susi_raw),
            "totalJeongsi": len(jeongsi_raw),
            "totalRecords": len(susi_raw) + len(jeongsi_raw),
            "susiSimCount": len(susi_sim),
            "jeongsiSimCount": len(jeongsi_sim),
            "universities": ALL_UNIVS,
            "batch1": UNIV_BATCH_1,
            "batch2": UNIV_BATCH_2,
        },
        "dashboard": dashboard_rows,
        "reform2028": reform_data,
        "susiSim": susi_sim,
        "jeongsiSim": jeongsi_sim,
    }

    # Write compact JSON files
    (DATA_OUT_DIR / "sim_meta_2029.json").write_text(
        json.dumps(sim_meta_payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (DATA_OUT_DIR / "susi_raw.json").write_text(
        json.dumps(susi_raw, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (DATA_OUT_DIR / "jeongsi_raw.json").write_text(
        json.dumps(jeongsi_raw, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (DATA_OUT_DIR / "collection_log.json").write_text(
        json.dumps(log_data, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    # Copy verified Excel workbook into public/downloads/ (ASCII-safe path for GitHub Pages artifact compatibility)
    xlsx_src = OUTPUT_DIR / "서울13개대학_3개년입결_2029맞춤DB.xlsx"
    if xlsx_src.exists():
        shutil.copy2(xlsx_src, DOWNLOAD_OUT_DIR / "seoul13_2029_admissions_db.xlsx")

    for fn in ["sim_meta_2029.json", "susi_raw.json", "jeongsi_raw.json", "collection_log.json"]:
        p = DATA_OUT_DIR / fn
        print(f"[OK] {fn}: {p.stat().st_size:,} bytes")
    print(f"[OK] Excel copied to {DOWNLOAD_OUT_DIR} ({xlsx_src.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
