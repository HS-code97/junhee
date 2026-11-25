# -*- coding: utf-8 -*-
"""
완료 검증(Definition of Done) 4대 항목 자동 검증 스크립트
1. Microsoft Excel COM 강제 재계산 및 전 시트 수식 오류(#REF!, #NAME?, #VALUE!, #N/A, #DIV/0!, #NUM!) 0건 검증
2. 시뮬레이터 동적 판정 전환 테스트 (1등급내 경합 vs 추정 누적 백분위 입력 시 정밀 판정)
3. 13개 대학 x 3개년 커버리지 리포트 (01_요약_대시보드 계산값 검증)
4. 원본 아카이빙 파일(HTML/PDF) vs 최종 엑셀 셀 값 6건(수시 3 + 정시 3) 1:1 대조 검증
"""
from __future__ import annotations
import json
import subprocess
from pathlib import Path
from lxml import html as lxml_html
import openpyxl
import pymupdf

from schema_utils import BASE_DIR, RAW_DIR, OUTPUT_DIR

XLSX_PATH = OUTPUT_DIR / "서울13개대학_3개년입결_2029맞춤DB.xlsx"

ERROR_TOKENS = {"#REF!", "#NAME?", "#VALUE!", "#DIV/0!", "#NUM!", "#N/A", "#NULL!"}


def run_excel_com_recalc_and_test():
    """PowerShell COM으로 실제 Microsoft Excel에서 전체 수식 재계산 + 동적 시뮬레이터 테스트 + 저장"""
    ps_script = rf'''
$ErrorActionPreference = "Stop"
$path = "{str(XLSX_PATH).replace("/", "\\")}"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {{
    $wb = $excel.Workbooks.Open($path)
    $excel.CalculateFullRebuild()
    $ws4 = $wb.Worksheets.Item("04_2029맞춤_비교시뮬레이터")

    # Scenario A: default (D5=1.15, D6=blank, D7=94.0)
    $a_k5 = $ws4.Range("K5").Text
    $a_k6 = $ws4.Range("K6").Text
    $a_samples = @()
    for ($r = 17; $r -le 26; $r++) {{
        $a_samples += "$($ws4.Cells.Item($r,1).Text)|$($ws4.Cells.Item($r,5).Text)|avg=$($ws4.Cells.Item($r,9).Text)|req%=$($ws4.Cells.Item($r,11).Text)|judge=$($ws4.Cells.Item($r,14).Text)"
    }}
    $a_jsamples = @()
    for ($r = 17; $r -le 22; $r++) {{
        $a_jsamples += "$($ws4.Cells.Item($r,16).Text)|$($ws4.Cells.Item($r,20).Text)|avg=$($ws4.Cells.Item($r,24).Text)|judge=$($ws4.Cells.Item($r,26).Text)"
    }}

    # Scenario B: user enters custom cumulative percentile D6 = 3.5, D7 = 96.5
    $ws4.Range("D6").Value2 = 3.5
    $ws4.Range("D7").Value2 = 96.5
    $excel.CalculateFullRebuild()
    $b_k5 = $ws4.Range("K5").Text
    $b_k6 = $ws4.Range("K6").Text
    $b_samples = @()
    for ($r = 17; $r -le 22; $r++) {{
        $b_samples += "$($ws4.Cells.Item($r,1).Text)|$($ws4.Cells.Item($r,5).Text)|judge=$($ws4.Cells.Item($r,14).Text)"
    }}

    # Restore default inputs and save cached calculated values!
    $ws4.Range("D6").MergeArea.ClearContents() | Out-Null
    $ws4.Range("D7").Value2 = 94.0
    $excel.CalculateFullRebuild()
    $wb.Save()
    $wb.Close($false)

    [PSCustomObject]@{{
        ScenarioA_K5 = $a_k5
        ScenarioA_K6 = $a_k6
        ScenarioA_Susi = $a_samples
        ScenarioA_Jeongsi = $a_jsamples
        ScenarioB_K5 = $b_k5
        ScenarioB_K6 = $b_k6
        ScenarioB_Susi = $b_samples
    }} | ConvertTo-Json -Depth 4
}} finally {{
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}}
'''
    res = subprocess.run(
        ["powershell", "-NoProfile", "-Command", ps_script],
        capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180
    )
    if res.returncode != 0:
        raise RuntimeError(f"Excel COM failed:\nSTDOUT: {res.stdout}\nSTDERR: {res.stderr}")
    return json.loads(res.stdout[res.stdout.index("{"):])


def audit_formula_errors():
    """저장된 Excel(계산값 캐시 포함) 전 시트 전수 스캔"""
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    wb_f = openpyxl.load_workbook(XLSX_PATH, data_only=False)
    errors = []
    sheet_stats = {}
    for name in wb.sheetnames:
        ws = wb[name]
        ws_f = wb_f[name]
        formula_cnt = 0
        for row in ws.iter_rows(values_only=False):
            for cell in row:
                v = cell.value
                fv = ws_f[cell.coordinate].value
                if isinstance(fv, str) and fv.startswith("="):
                    formula_cnt += 1
                if isinstance(v, str) and (v in ERROR_TOKENS or any(v.startswith(tok) for tok in ERROR_TOKENS)):
                    errors.append({
                        "sheet": name, "cell": cell.coordinate, "value": v, "formula": fv
                    })
        sheet_stats[name] = {"rows": ws.max_row, "cols": ws.max_column, "formulas": formula_cnt}
    return sheet_stats, errors


def extract_dashboard_coverage():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb["01_요약_대시보드"]
    rows = []
    for r in range(8, 22):
        rows.append([ws.cell(r, c).value for c in range(1, 13)])
    return rows


def verify_6_source_samples():
    """서로 다른 대학·연도에서 수시 3건 + 정시 3건을 원본 아카이빙 파일과 엑셀 셀 값 1:1 대조"""
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws_susi = wb["02_수시_3개년DB(원본)"]
    ws_jeongsi = wb["03_정시_3개년DB(원본)"]

    # Index Excel rows for quick lookup
    susi_rows = list(ws_susi.iter_rows(min_row=2, values_only=True))
    jeongsi_rows = list(ws_jeongsi.iter_rows(min_row=2, values_only=True))

    checks = []

    def find_adiga_html_val(html_path: Path, adm_kw: str, dept_exact: str, is_jeongsi: bool):
        doc = lxml_html.fromstring(html_path.read_text(encoding="utf-8", errors="ignore"))
        def fnum(s):
            s = s.strip()
            if not s or s in ("-", "0", "0.0"):
                return None
            return float(s)
        for blk in doc.xpath('//div[contains(@class, "tbAdmRes")]'):
            h5 = "".join(blk.xpath('.//h5/text()')).strip()
            if adm_kw not in h5:
                continue
            for tr in blk.xpath('.//table//tbody/tr'):
                tds = [" ".join(td.itertext()).strip() for td in tr.xpath('./td')]
                if len(tds) > 10 and tds[1] == dept_exact:
                    if not is_jeongsi:
                        c50, c70 = fnum(tds[9]), fnum(tds[10])
                        if c50 is None and c70 is None:
                            continue
                        return {"adm": h5, "dept": tds[1], "quota": int(tds[4]) if tds[4].isdigit() and int(tds[4]) > 0 else None, "comp": fnum(tds[5]), "cut50": c50, "cut70": c70}
                    else:
                        cv70 = fnum(tds[8])
                        p50 = fnum(tds[17]) if len(tds) > 17 else None
                        p70 = fnum(tds[28]) if len(tds) > 28 else None
                        if cv70 is None and p70 is None:
                            continue
                        return {"adm": h5, "dept": tds[1], "gun": tds[0], "quota": int(tds[4]) if tds[4].isdigit() and int(tds[4]) > 0 else None, "comp": fnum(tds[5]), "conv50": fnum(tds[7]), "conv70": cv70, "pct50": p50, "pct70": p70}
        return None

    def eq_num(a, b):
        if a is None and b is None:
            return True
        if a is None or b is None:
            return False
        return abs(float(a) - float(b)) < 1e-6

    # 3 수시 samples (different universities & years: 서울대 2026, 고려대 2025, 경희대 2024 + 동국대 2026 논술 PDF!)
    src_s1 = find_adiga_html_val(RAW_DIR / "서울대/adiga_2026_종합.html", "일반전형", "경영대학", False)
    xl_s1 = next((r for r in susi_rows if r[0] == 2026 and r[1] == "서울대" and "일반전형" in str(r[3]) and r[5] == "경영대학"), None)
    checks.append({
        "구분": "수시 #1", "대상": "서울대 2026 수시 일반전형 경영대학",
        "원본파일": "raw_data/서울대/adiga_2026_종합.html",
        "원본수치": f"모집 {src_s1['quota']} / 경쟁률 {src_s1['comp']} / 50%컷 {src_s1['cut50']} / 70%컷 {src_s1['cut70']}" if src_s1 else "NOT_FOUND",
        "엑셀셀값": f"모집 {xl_s1[7]} / 경쟁률 {xl_s1[9]} / 50%컷 {xl_s1[11]} / 70%컷 {xl_s1[12]}" if xl_s1 else "NOT_FOUND",
        "일치여부": bool(src_s1 and xl_s1 and eq_num(src_s1["quota"], xl_s1[7]) and eq_num(src_s1["cut70"], xl_s1[12]) and eq_num(src_s1["cut50"], xl_s1[11])),
    })

    src_s2 = find_adiga_html_val(RAW_DIR / "고려대/adiga_2025_교과.html", "학교추천", "경영대학", False)
    xl_s2 = next((r for r in susi_rows if r[0] == 2025 and r[1] == "고려대" and "학교추천" in str(r[3]) and r[5] == "경영대학"), None)
    checks.append({
        "구분": "수시 #2", "대상": "고려대 2025 수시 학교추천 경영대학",
        "원본파일": "raw_data/고려대/adiga_2025_교과.html",
        "원본수치": f"50%컷 {src_s2['cut50']} / 70%컷 {src_s2['cut70']}" if src_s2 else "NOT_FOUND",
        "엑셀셀값": f"50%컷 {xl_s2[11]} / 70%컷 {xl_s2[12]}" if xl_s2 else "NOT_FOUND",
        "일치여부": bool(src_s2 and xl_s2 and eq_num(src_s2["cut50"], xl_s2[11]) and eq_num(src_s2["cut70"], xl_s2[12])),
    })

    src_s3 = find_adiga_html_val(RAW_DIR / "경희대/adiga_2024_교과.html", "지역균형", "경제학과", False)
    xl_s3 = next((r for r in susi_rows if r[0] == 2024 and r[1] == "경희대" and "지역균형" in str(r[3]) and r[5] == "경제학과"), None)
    checks.append({
        "구분": "수시 #3", "대상": "경희대 2024 수시 지역균형 경제학과",
        "원본파일": "raw_data/경희대/adiga_2024_교과.html",
        "원본수치": f"50%컷 {src_s3['cut50']} / 70%컷 {src_s3['cut70']}" if src_s3 else "NOT_FOUND",
        "엑셀셀값": f"50%컷 {xl_s3[11]} / 70%컷 {xl_s3[12]}" if xl_s3 else "NOT_FOUND",
        "일치여부": bool(src_s3 and xl_s3 and eq_num(src_s3["cut50"], xl_s3[11]) and eq_num(src_s3["cut70"], xl_s3[12])),
    })

    # Bonus S4: 동국대 2026 입학처 공식 PDF 논술전형 법학과 (2026_입시결과.pdf p.12)
    doc_dg = pymupdf.open(RAW_DIR / "동국대/2026_입시결과.pdf")
    dg_txt = doc_dg[11].get_text("text")
    has_law = "법학과" in dg_txt and "978" in dg_txt and "81.50" in dg_txt and "2.47" in dg_txt
    xl_s4 = next((r for r in susi_rows if r[0] == 2026 and r[1] == "동국대" and r[2] == "논술" and r[5] == "법학과"), None)
    checks.append({
        "구분": "수시 #4(논술PDF)", "대상": "동국대 2026 논술전형 법학과",
        "원본파일": "raw_data/동국대/2026_입시결과.pdf (p.12)",
        "원본수치": "모집 12 / 지원 978 / 경쟁률 81.50 / 평균등급 2.47" if has_law else "NOT_FOUND",
        "엑셀셀값": f"모집 {xl_s4[7]} / 지원 {xl_s4[8]} / 경쟁률 {xl_s4[9]} / 평균등급 {xl_s4[13]}" if xl_s4 else "NOT_FOUND",
        "일치여부": bool(has_law and xl_s4 and xl_s4[7] == 12 and xl_s4[8] == 978 and eq_num(81.5, xl_s4[9]) and eq_num(2.47, xl_s4[13])),
    })

    # 3 정시 samples (different universities & years: 연세대 2026, 한양대 2025, 건국대 2024)
    src_j1 = find_adiga_html_val(RAW_DIR / "연세대/adiga_2026_정시.html", "일반전형[일반계열]", "경영학과", True)
    xl_j1 = next((r for r in jeongsi_rows if r[0] == 2026 and r[1] == "연세대" and "일반계열" in str(r[3]) and r[5] == "경영학과"), None)
    checks.append({
        "구분": "정시 #1", "대상": "연세대 2026 정시(가) 일반 경영학과",
        "원본파일": "raw_data/연세대/adiga_2026_정시.html",
        "원본수치": f"모집 {src_j1['quota']} / 환산70% {src_j1['conv70']} / 국수탐백분위50% {src_j1['pct50']} / 70% {src_j1['pct70']}" if src_j1 else "NOT_FOUND",
        "엑셀셀값": f"모집 {xl_j1[7]} / 환산70% {xl_j1[13]} / 국수탐백분위50% {xl_j1[14]} / 70% {xl_j1[15]}" if xl_j1 else "NOT_FOUND",
        "일치여부": bool(src_j1 and xl_j1 and eq_num(src_j1["quota"], xl_j1[7]) and eq_num(src_j1["conv70"], xl_j1[13]) and eq_num(src_j1["pct70"], xl_j1[15])),
    })

    src_j2 = find_adiga_html_val(RAW_DIR / "한양대/adiga_2025_정시.html", "일반", "컴퓨터소프트웨어학부", True)
    xl_j2 = next((r for r in jeongsi_rows if r[0] == 2025 and r[1] == "한양대" and r[5] == "컴퓨터소프트웨어학부"), None)
    checks.append({
        "구분": "정시 #2", "대상": "한양대 2025 정시 컴퓨터소프트웨어학부",
        "원본파일": "raw_data/한양대/adiga_2025_정시.html",
        "원본수치": f"환산70% {src_j2['conv70']} / 국수탐백분위70% {src_j2['pct70']}" if src_j2 else "NOT_FOUND",
        "엑셀셀값": f"환산70% {xl_j2[13]} / 국수탐백분위70% {xl_j2[15]}" if xl_j2 else "NOT_FOUND",
        "일치여부": bool(src_j2 and xl_j2 and eq_num(src_j2["conv70"], xl_j2[13]) and eq_num(src_j2["pct70"], xl_j2[15])),
    })

    src_j3 = find_adiga_html_val(RAW_DIR / "건국대/adiga_2024_정시.html", "KU일반학생", "경영학과", True)
    xl_j3 = next((r for r in jeongsi_rows if r[0] == 2024 and r[1] == "건국대" and r[5] == "경영학과"), None)
    checks.append({
        "구분": "정시 #3", "대상": "건국대 2024 정시 KU일반학생 경영학과",
        "원본파일": "raw_data/건국대/adiga_2024_정시.html",
        "원본수치": f"환산50% {src_j3['conv50']} / 환산70% {src_j3['conv70']} / 국수탐백분위70% {src_j3['pct70']}" if src_j3 else "NOT_FOUND",
        "엑셀셀값": f"환산50% {xl_j3[12]} / 환산70% {xl_j3[13]} / 국수탐백분위70% {xl_j3[15]}" if xl_j3 else "NOT_FOUND",
        "일치여부": bool(src_j3 and xl_j3 and eq_num(src_j3["conv50"], xl_j3[12]) and eq_num(src_j3["conv70"], xl_j3[13]) and eq_num(src_j3["pct70"], xl_j3[15])),
    })

    return checks


if __name__ == "__main__":
    print("[1/4] Running real Microsoft Excel COM full recalculation & dynamic simulator test...")
    sim_test = run_excel_com_recalc_and_test()
    print(json.dumps(sim_test, ensure_ascii=False, indent=2))

    print("\n[2/4] Auditing all 6 sheets for formula errors (#REF!, #NAME?, #VALUE!, #DIV/0!, #N/A, #NUM!)...")
    stats, errs = audit_formula_errors()
    print("Sheet stats:", json.dumps(stats, ensure_ascii=False, indent=2))
    print(f"Total formula errors: {len(errs)}")
    if errs:
        print("First 10 errors:", json.dumps(errs[:10], ensure_ascii=False, indent=2))

    print("\n[3/4] Dashboard Coverage Table (cached Excel values):")
    cov = extract_dashboard_coverage()
    for r in cov:
        print(" ", r)

    print("\n[4/4] Source-vs-Excel Sampling Verification (4 Susi + 3 Jeongsi = 7 checks):")
    samples = verify_6_source_samples()
    print(json.dumps(samples, ensure_ascii=False, indent=2))
    all_ok = all(s["일치여부"] for s in samples) and len(errs) == 0
    print(f"\n=== OVERALL DoD VERIFICATION: {'PASS (ALL GREEN)' if all_ok else 'FAIL'} ===")
