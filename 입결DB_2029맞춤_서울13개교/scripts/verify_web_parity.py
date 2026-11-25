# -*- coding: utf-8 -*-
"""
엑셀 4번 시트(04_2029맞춤_비교시뮬레이터) 캐시 계산값 vs 웹 JSON/시뮬레이터 엔진 전수 일치 검증
"""
from __future__ import annotations
import json
import math
from pathlib import Path
import openpyxl

REPO_ROOT = Path(r"c:/Vibe Coding/23. junhee")
XLSX_PATH = REPO_ROOT / "입결DB_2029맞춤_서울13개교" / "output" / "서울13개대학_3개년입결_2029맞춤DB.xlsx"
SIM_JSON_PATH = REPO_ROOT / "web" / "public" / "data" / "sim_meta_2029.json"


def eval_susi(req_pct, g5, custom_pct, eff_pct):
    if req_pct is None:
        return "참고(컷미공개)"
    if custom_pct is None and g5 < 1.5 and req_pct <= 10.0:
        return "참고(1등급내 경합)"
    diff = req_pct - eff_pct
    if diff >= 2.0:
        return "안정"
    if diff >= -1.0:
        return "적정"
    if diff >= -4.0:
        return "소신"
    return "상향"


def eval_jeongsi(avg_p70, mock_pct):
    if avg_p70 is None:
        return "참고(미공개)"
    diff = mock_pct - avg_p70
    if diff >= 1.5:
        return "안정"
    if diff >= -0.5:
        return "적정"
    if diff >= -2.5:
        return "소신"
    return "상향"


def main():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws4 = wb["04_2029맞춤_비교시뮬레이터"]
    sim_data = json.loads(SIM_JSON_PATH.read_text(encoding="utf-8"))

    g5 = float(ws4["D5"].value)
    custom_pct = ws4["D6"].value
    eff_pct = float(ws4["K5"].value)
    mock_pct = float(ws4["D7"].value)

    susi_sim = sim_data["susiSim"]
    jeongsi_sim = sim_data["jeongsiSim"]

    susi_mismatches = []
    for idx, item in enumerate(susi_sim):
        r = 17 + idx
        xl_u = ws4.cell(r, 1).value
        xl_d = ws4.cell(r, 5).value
        xl_avg = ws4.cell(r, 9).value
        xl_req = ws4.cell(r, 11).value
        xl_judg = ws4.cell(r, 14).value

        web_judg = eval_susi(item["reqPct"], g5, custom_pct, eff_pct)
        if xl_u != item["u"] or xl_d != item["d"]:
            susi_mismatches.append((r, "key", (xl_u, xl_d), (item["u"], item["d"])))
        elif xl_avg is not None and item["avg"] is not None and abs(float(xl_avg) - item["avg"]) > 1e-4:
            susi_mismatches.append((r, "avg", xl_avg, item["avg"]))
        elif xl_req is not None and item["reqPct"] is not None and abs(float(xl_req) - item["reqPct"]) > 1e-4:
            susi_mismatches.append((r, "reqPct", xl_req, item["reqPct"]))
        elif xl_judg != web_judg:
            susi_mismatches.append((r, "judgment", xl_judg, web_judg))

    jeongsi_mismatches = []
    for idx, item in enumerate(jeongsi_sim):
        r = 17 + idx
        xl_u = ws4.cell(r, 16).value
        xl_d = ws4.cell(r, 20).value
        xl_avg = ws4.cell(r, 24).value
        xl_judg = ws4.cell(r, 26).value

        web_judg = eval_jeongsi(item["avg"], mock_pct)
        if xl_u != item["u"] or xl_d != item["d"]:
            jeongsi_mismatches.append((r, "key", (xl_u, xl_d), (item["u"], item["d"])))
        elif xl_avg is not None and item["avg"] is not None and abs(float(xl_avg) - item["avg"]) > 1e-4:
            jeongsi_mismatches.append((r, "avg", xl_avg, item["avg"]))
        elif xl_judg != web_judg:
            jeongsi_mismatches.append((r, "judgment", xl_judg, web_judg))

    print(f"[PARITY CHECK] 수시 {len(susi_sim):,}건 불일치: {len(susi_mismatches)}건")
    print(f"[PARITY CHECK] 정시 {len(jeongsi_sim):,}건 불일치: {len(jeongsi_mismatches)}건")
    if susi_mismatches or jeongsi_mismatches:
        print("Sample mismatches:", (susi_mismatches + jeongsi_mismatches)[:5])
        raise SystemExit(1)
    print("[PASS] 엑셀 4번 시트(COM 계산값) ↔ 웹 시뮬레이터 엔진 100% 일치 확인 완료!")


if __name__ == "__main__":
    main()
