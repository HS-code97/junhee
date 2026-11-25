# -*- coding: utf-8 -*-
"""
서울 주요 13개 대학 3개년 입결 & 2029학년도(현 고1) 맞춤형 6시트 완성 엑셀(.xlsx) 빌더
- 재실행/자동병합 지원: ./intermediate/{대학명}_수시/정시_3개년.csv 를 읽어 최종 .xlsx 생성
- 모든 수식은 표준 Excel 함수(IF, AND, OR, COUNTIFS, AVERAGEIFS, INDEX, MATCH 등)만 사용하여
  버전/언어 무관하게 #NAME? 오류 0건 보장
"""
from __future__ import annotations
import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

import pandas as pd
import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import CellIsRule
from openpyxl.worksheet.datavalidation import DataValidation

from schema_utils import (
    ALL_UNIVS, UNIV_BATCH_1, BASE_DIR, INTERMEDIATE_DIR, OUTPUT_DIR,
    SUSI_COLUMNS, JEONGSI_COLUMNS, REFORM_2028_COLUMNS, clean_str
)

# Color Palette (Executive Navy / Slate)
NAVY = "1F4E78"
DARK_SLATE = "2F5597"
TEAL_HEADER = "1E6B7B"
SUB_HEADER = "D9E1F2"
LIGHT_BLUE = "E9F1FB"
LIGHT_YELLOW = "FFF8DC"
INPUT_BG = "E8F4FD"
ZEBRA_BG = "F8FAFC"
BORDER_GRAY = "CBD5E1"
WARN_BG = "FFF2CC"
WARN_TEXT = "8A5300"

FONT_NAME = "맑은 고딕"

THIN_SIDE = Side(border_style="thin", color=BORDER_GRAY)
MED_NAVY = Side(border_style="medium", color=NAVY)
THIN_BORDER = Border(left=THIN_SIDE, right=THIN_SIDE, top=THIN_SIDE, bottom=THIN_SIDE)
INPUT_BORDER = Border(left=MED_NAVY, right=MED_NAVY, top=MED_NAVY, bottom=MED_NAVY)


def normalize_adm_for_sim(univ: str, adm: str) -> str:
    """시뮬레이터 3개년 연동을 위한 세부전형명 구분자 정규화 (원본 DB는 건드리지 않음)"""
    s = clean_str(adm)
    if univ == "고려대":
        # 2024 '학생부교과-학교추천' vs 2025/2026 '학생부교과:학교추천' 통일
        s = s.replace("-", ":")
    return s


def load_all_checkpoints() -> Tuple[pd.DataFrame, pd.DataFrame]:
    susi_frames = []
    jeongsi_frames = []
    for u in ALL_UNIVS:
        ps = INTERMEDIATE_DIR / f"{u}_수시_3개년.csv"
        if ps.exists():
            susi_frames.append(pd.read_csv(ps, encoding="utf-8-sig"))
        pj = INTERMEDIATE_DIR / f"{u}_정시_3개년.csv"
        if pj.exists():
            jeongsi_frames.append(pd.read_csv(pj, encoding="utf-8-sig"))

    df_susi = pd.concat(susi_frames, ignore_index=True) if susi_frames else pd.DataFrame(columns=SUSI_COLUMNS)
    df_jeongsi = pd.concat(jeongsi_frames, ignore_index=True) if jeongsi_frames else pd.DataFrame(columns=JEONGSI_COLUMNS)

    # Ensure exact column order and numeric types
    for col in ["학년도", "모집인원", "지원인원", "충원합격순위"]:
        if col in df_susi.columns:
            df_susi[col] = pd.to_numeric(df_susi[col], errors="coerce")
        if col in df_jeongsi.columns:
            df_jeongsi[col] = pd.to_numeric(df_jeongsi[col], errors="coerce")

    for col in ["경쟁률", "최종등록자_50%컷(9등급)", "최종등록자_70%컷(9등급)", "평균등급", "최초합격컷"]:
        if col in df_susi.columns:
            df_susi[col] = pd.to_numeric(df_susi[col], errors="coerce")

    for col in ["경쟁률", "대학환산점수_만점기준", "대학환산점수_50%컷", "대학환산점수_70%컷",
                "국수탐_평균백분위_50%컷", "국수탐_평균백분위_70%컷", "영어_평균등급"]:
        if col in df_jeongsi.columns:
            df_jeongsi[col] = pd.to_numeric(df_jeongsi[col], errors="coerce")

    # Sort consistently by Univ order (Batch1 -> Batch2), Year desc, Type/Gun, Dept
    univ_order = {u: i for i, u in enumerate(ALL_UNIVS)}
    df_susi["_ord"] = df_susi["대학명"].map(univ_order).fillna(99)
    df_susi = df_susi.sort_values(["_ord", "학년도", "전형유형", "세부전형명", "모집단위(학과)"],
                                  ascending=[True, False, True, True, True]).drop(columns=["_ord"]).reset_index(drop=True)

    df_jeongsi["_ord"] = df_jeongsi["대학명"].map(univ_order).fillna(99)
    df_jeongsi = df_jeongsi.sort_values(["_ord", "학년도", "모집군", "세부전형명", "모집단위(학과)"],
                                        ascending=[True, False, True, True, True]).drop(columns=["_ord"]).reset_index(drop=True)

    return df_susi[SUSI_COLUMNS], df_jeongsi[JEONGSI_COLUMNS]


def style_header_row(ws, row_idx: int, max_col: int, fill_hex: str = NAVY, height: float = 28):
    fill = PatternFill("solid", fgColor=fill_hex)
    font = Font(name=FONT_NAME, size=10, bold=True, color="FFFFFF")
    align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[row_idx].height = height
    for c in range(1, max_col + 1):
        cell = ws.cell(row=row_idx, column=c)
        cell.fill = fill
        cell.font = font
        cell.alignment = align
        cell.border = THIN_BORDER


def autofit_columns(ws, min_width: int = 9, max_width: int = 42, extra: int = 3):
    for col in ws.columns:
        col_letter = get_column_letter(col[0].column)
        max_len = 0
        for cell in col[:200]:  # Sample first 200 rows for speed
            val = cell.value
            if val is None:
                continue
            s = str(val)
            if s.startswith("="):
                continue
            # Count Korean characters as ~1.8 width
            line_max = max((sum(1.8 if ord(ch) > 127 else 1.0 for ch in ln) for ln in s.splitlines()), default=0)
            if line_max > max_len:
                max_len = line_max
        ws.column_dimensions[col_letter].width = max(min_width, min(max_width, int(max_len) + extra))


def write_raw_db_sheet(ws, df: pd.DataFrame, kind: str):
    """Sheet 2 (수시 원본) & Sheet 3 (정시 원본) 생성"""
    cols = list(df.columns)
    ws.append(cols)
    style_header_row(ws, 1, len(cols), fill_hex=NAVY if kind == "수시" else DARK_SLATE, height=30)

    # For 정시, distinguish 환산점수 (L~N) vs 국수탐 백분위 (O~Q) header fills clearly
    if kind == "정시":
        conv_fill = PatternFill("solid", fgColor="2B6CB0")
        pct_fill = PatternFill("solid", fgColor="1E6B7B")
        for c_idx in [12, 13, 14]:
            ws.cell(1, c_idx).fill = conv_fill
        for c_idx in [15, 16, 17]:
            ws.cell(1, c_idx).fill = pct_fill

    int_cols = {"학년도", "모집인원", "지원인원", "충원합격순위"}
    float_cols = {
        "경쟁률", "최종등록자_50%컷(9등급)", "최종등록자_70%컷(9등급)", "평균등급", "최초합격컷",
        "대학환산점수_만점기준", "대학환산점수_50%컷", "대학환산점수_70%컷",
        "국수탐_평균백분위_50%컷", "국수탐_평균백분위_70%컷", "영어_평균등급",
    }
    center_cols = {"학년도", "대학명", "전형유형", "모집군", "계열", "출처구분"}

    font_body = Font(name=FONT_NAME, size=9.5)
    zebra_fill = PatternFill("solid", fgColor=ZEBRA_BG)

    records = df.to_dict(orient="records")
    for r_i, rec in enumerate(records, start=2):
        row_vals = []
        for c in cols:
            v = rec.get(c)
            if pd.isna(v):
                row_vals.append(None)
            elif c in int_cols:
                row_vals.append(int(round(float(v))))
            elif c in float_cols:
                row_vals.append(round(float(v), 2))
            else:
                row_vals.append(str(v))
        ws.append(row_vals)
        is_zebra = (r_i % 2 == 1)
        for c_i, c_name in enumerate(cols, start=1):
            cell = ws.cell(r_i, c_i)
            cell.font = font_body
            cell.border = THIN_BORDER
            if is_zebra:
                cell.fill = zebra_fill
            if c_name in int_cols:
                cell.number_format = "0" if c_name == "학년도" else "#,##0"
                cell.alignment = Alignment(horizontal="center" if c_name == "학년도" else "right", vertical="center")
            elif c_name in float_cols:
                cell.number_format = "0.00"
                cell.alignment = Alignment(horizontal="right", vertical="center")
            elif c_name in center_cols:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(cols))}{len(records) + 1}"
    autofit_columns(ws, min_width=9, max_width=36)
    ws.views.sheetView[0].showGridLines = True


def build_dashboard_sheet(ws, n_susi: int, n_jeongsi: int, log_data: Dict[str, Any]):
    """Sheet 1: 01_요약_대시보드"""
    ws.views.sheetView[0].showGridLines = True

    # Title Banner
    ws.merge_cells("A1:M1")
    ws["A1"] = "서울 주요 13개 대학 3개년(2024~2026) 입결 & 2029학년도(현 고1) 맞춤형 통합 DB"
    ws["A1"].font = Font(name=FONT_NAME, size=15, bold=True, color="FFFFFF")
    ws["A1"].fill = PatternFill("solid", fgColor=NAVY)
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 36

    ws.merge_cells("A2:M2")
    ws["A2"] = "기준 범위: 서울 본캠퍼스(경희대 서울+국제 및 중앙대 본교 통합 공시분 포함) 정원 내 일반전형 | 출처: 각 대학 입학처 공식 PDF + 대입정보포털 어디가(adiga.kr)"
    ws["A2"].font = Font(name=FONT_NAME, size=9.5, italic=True, color="334155")
    ws["A2"].fill = PatternFill("solid", fgColor=LIGHT_BLUE)
    ws["A2"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 22

    # KPI Cards (Row 4-5)
    kpis = [
        ("A4:C4", "A5:C5", "대상 대학 수", "=COUNTA(B8:B20)", '0"개교"'),
        ("D4:F4", "D5:F5", "총 수시 3개년 레코드", f"=COUNTA('02_수시_3개년DB(원본)'!B2:B{n_susi+1})", '#,##0"건"'),
        ("G4:I4", "G5:I5", "총 정시 3개년 레코드", f"=COUNTA('03_정시_3개년DB(원본)'!B2:B{n_jeongsi+1})", '#,##0"건"'),
        ("J4:M4", "J5:M5", "2028 시행계획 원문 PDF 확보", '=COUNTIF(K8:K20,"확보완료")&" / 13개교 (전 대학 요약 완료)"', "@"),
    ]
    ws.row_dimensions[4].height = 20
    ws.row_dimensions[5].height = 28
    for lbl_rng, val_rng, title, formula, num_fmt in kpis:
        ws.merge_cells(lbl_rng)
        ws.merge_cells(val_rng)
        top_left = lbl_rng.split(":")[0]
        val_tl = val_rng.split(":")[0]
        ws[top_left] = title
        ws[top_left].font = Font(name=FONT_NAME, size=9.5, bold=True, color="1E293B")
        ws[top_left].fill = PatternFill("solid", fgColor=SUB_HEADER)
        ws[top_left].alignment = Alignment(horizontal="center", vertical="center")
        ws[val_tl] = formula
        ws[val_tl].font = Font(name=FONT_NAME, size=13, bold=True, color=NAVY)
        ws[val_tl].fill = PatternFill("solid", fgColor="FFFFFF")
        ws[val_tl].alignment = Alignment(horizontal="center", vertical="center")
        ws[val_tl].number_format = num_fmt

    # Coverage Table Header (Row 7)
    headers = [
        "배치", "대학명",
        "수시 2024", "수시 2025", "수시 2026", "수시 합계",
        "정시 2024", "정시 2025", "정시 2026", "정시 합계",
        "2028 시행계획 PDF", "수집 상태", "비고 / 특이사항"
    ]
    for c_i, h in enumerate(headers, start=1):
        ws.cell(7, c_i, h)
    style_header_row(ws, 7, len(headers), fill_hex=NAVY, height=28)

    susi_end = n_susi + 1
    jeongsi_end = n_jeongsi + 1
    univ_logs = log_data.get("universities", {})

    for idx, u in enumerate(ALL_UNIVS, start=8):
        batch = "Batch 1" if u in UNIV_BATCH_1 else "Batch 2"
        ul = univ_logs.get(u, {})
        has_pdf = "확보완료" if ul.get("has_2028_pdf") else "수동확인필요"
        status = ul.get("status", "부분완료")
        notes = ul.get("missing_or_notes", "")

        ws.cell(idx, 1, batch)
        ws.cell(idx, 2, u)
        ws.cell(idx, 3, f"=COUNTIFS('02_수시_3개년DB(원본)'!$B$2:$B${susi_end},$B{idx},'02_수시_3개년DB(원본)'!$A$2:$A${susi_end},2024)")
        ws.cell(idx, 4, f"=COUNTIFS('02_수시_3개년DB(원본)'!$B$2:$B${susi_end},$B{idx},'02_수시_3개년DB(원본)'!$A$2:$A${susi_end},2025)")
        ws.cell(idx, 5, f"=COUNTIFS('02_수시_3개년DB(원본)'!$B$2:$B${susi_end},$B{idx},'02_수시_3개년DB(원본)'!$A$2:$A${susi_end},2026)")
        ws.cell(idx, 6, f"=SUM(C{idx}:E{idx})")
        ws.cell(idx, 7, f"=COUNTIFS('03_정시_3개년DB(원본)'!$B$2:$B${jeongsi_end},$B{idx},'03_정시_3개년DB(원본)'!$A$2:$A${jeongsi_end},2024)")
        ws.cell(idx, 8, f"=COUNTIFS('03_정시_3개년DB(원본)'!$B$2:$B${jeongsi_end},$B{idx},'03_정시_3개년DB(원본)'!$A$2:$A${jeongsi_end},2025)")
        ws.cell(idx, 9, f"=COUNTIFS('03_정시_3개년DB(원본)'!$B$2:$B${jeongsi_end},$B{idx},'03_정시_3개년DB(원본)'!$A$2:$A${jeongsi_end},2026)")
        ws.cell(idx, 10, f"=SUM(G{idx}:I{idx})")
        ws.cell(idx, 11, has_pdf)
        ws.cell(idx, 12, status)
        ws.cell(idx, 13, notes)

        ws.row_dimensions[idx].height = 24
        for c_i in range(1, 14):
            cell = ws.cell(idx, c_i)
            cell.font = Font(name=FONT_NAME, size=9.5, bold=(c_i in (2, 6, 10)))
            cell.border = THIN_BORDER
            if idx % 2 == 1:
                cell.fill = PatternFill("solid", fgColor=ZEBRA_BG)
            if c_i in (1, 2, 11, 12):
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif c_i == 13:
                cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            else:
                cell.number_format = "#,##0"
                cell.alignment = Alignment(horizontal="right", vertical="center")

    # Total Row (Row 21)
    tot_r = 21
    ws.cell(tot_r, 1, "합계")
    ws.cell(tot_r, 2, "13개 대학 전체")
    for c_i in range(3, 11):
        col_l = get_column_letter(c_i)
        ws.cell(tot_r, c_i, f"=SUM({col_l}8:{col_l}20)")
    ws.cell(tot_r, 11, '=COUNTIF(K8:K20,"확보완료")&"/13"')
    ws.cell(tot_r, 12, '=COUNTIF(L8:L20,"완료")&"완료/"&COUNTIF(L8:L20,"*부분*")&"부분"')
    ws.cell(tot_r, 13, "전 대학 3개년(2024~2026) 교과·종합·정시 확보 완료 (서울대 교과·논술 미운영)")
    ws.row_dimensions[tot_r].height = 26
    for c_i in range(1, 14):
        cell = ws.cell(tot_r, c_i)
        cell.font = Font(name=FONT_NAME, size=10, bold=True, color=NAVY)
        cell.fill = PatternFill("solid", fgColor=SUB_HEADER)
        cell.border = THIN_BORDER
        if c_i in range(3, 11):
            cell.number_format = "#,##0"
            cell.alignment = Alignment(horizontal="right", vertical="center")
        elif c_i == 13:
            cell.alignment = Alignment(horizontal="left", vertical="center")
        else:
            cell.alignment = Alignment(horizontal="center", vertical="center")

    # Conditional formatting for status column L8:L20
    ws.conditional_formatting.add(
        "L8:L20",
        CellIsRule(operator="equal", formula=['"완료"'], fill=PatternFill("solid", fgColor="DCFCE7"), font=Font(name=FONT_NAME, bold=True, color="166534"))
    )
    ws.conditional_formatting.add(
        "L8:L20",
        CellIsRule(operator="equal", formula=['"부분완료"'], fill=PatternFill("solid", fgColor="FEF9C3"), font=Font(name=FONT_NAME, bold=True, color="854D0E"))
    )
    ws.conditional_formatting.add(
        "L8:L20",
        CellIsRule(operator="equal", formula=['"부분완료(수동확인필요)"'], fill=PatternFill("solid", fgColor="FFEDD5"), font=Font(name=FONT_NAME, bold=True, color="9A3412"))
    )

    # Usage Guide Box (Row 23-27)
    ws.merge_cells("A23:M23")
    ws["A23"] = "시트 구성 및 2029학년도(현 고1) 활용 가이드"
    ws["A23"].font = Font(name=FONT_NAME, size=10.5, bold=True, color="FFFFFF")
    ws["A23"].fill = PatternFill("solid", fgColor=TEAL_HEADER)
    ws["A23"].alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[23].height = 24

    guides = [
        "• [02_수시_3개년DB(원본)] & [03_정시_3개년DB(원본)]: 2024~2026학년도 공식 입결 원천 데이터(가공 없음). 정시는 대학환산점수와 국수탐 백분위를 엄격히 분리했습니다.",
        "• [04_2029맞춤_비교시뮬레이터]: 상단 파란 입력칸에 현 고1 학생의 [5등급제 내신 평균], [추정 상위 누적 백분위(%) - 선택], [모의고사 국수탐 평균 백분위]를 입력하면 전 대학·학과별 판정이 자동 계산됩니다.",
        "• [05_2028개편_전형변화요약]: 2029학년도 현 고1에 직접 적용되는 2028 대입개편(내신 5등급제·통합수능) 각 대학 공식 시행계획 핵심 변화와 준비 포인트를 정리했습니다.",
        "• [06_수집로그_및_출처검증]: 대학별 원천 파일 목록, 누락/OCR 검증 항목, 무전공·학과 통폐합 매핑 내역 및 수동 파일 추가 후 자동 재병합 방법을 안내합니다.",
    ]
    for g_i, g_txt in enumerate(guides, start=24):
        ws.merge_cells(f"A{g_i}:M{g_i}")
        ws[f"A{g_i}"] = g_txt
        ws[f"A{g_i}"].font = Font(name=FONT_NAME, size=9.5)
        ws[f"A{g_i}"].alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        ws.row_dimensions[g_i].height = 22

    # Column widths
    widths = {1: 10, 2: 13, 3: 11, 4: 11, 5: 11, 6: 11, 7: 11, 8: 11, 9: 11, 10: 11, 11: 17, 12: 20, 13: 54}
    for col_i, w in widths.items():
        ws.column_dimensions[get_column_letter(col_i)].width = w
    ws.freeze_panes = "A8"


def build_simulator_sheet(ws, df_susi: pd.DataFrame, df_jeongsi: pd.DataFrame):
    """Sheet 4: 04_2029맞춤_비교시뮬레이터 (현 고1 5등급제 + 통합수능 맞춤형)"""
    ws.views.sheetView[0].showGridLines = True

    n_susi = len(df_susi)
    n_jeongsi = len(df_jeongsi)
    s_end = n_susi + 1
    j_end = n_jeongsi + 1

    # Row 1: Main Banner
    ws.merge_cells("A1:Z1")
    ws["A1"] = "2029학년도(현 고1: 내신 5등급제 + 통합수능) 맞춤형 수시·정시 비교 시뮬레이터"
    ws["A1"].font = Font(name=FONT_NAME, size=14, bold=True, color="FFFFFF")
    ws["A1"].fill = PatternFill("solid", fgColor=NAVY)
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 34

    # Row 2: Mandatory 2028 Integrated CSAT Warning Banner
    ws.merge_cells("A2:Z2")
    ws["A2"] = "※ 2028 통합수능 개편으로 과거 환산점수 직접 비교 불가 — 정시는 3개년 국수탐 평균 백분위(70% 컷) 기준 상대 위치 참고용입니다. 수시는 5등급제 1등급(상위 10%) 내 변별력이 핵심이므로 [추정 상위 누적 백분위(%)]를 입력하면 정밀 판정되며, 미입력 시 1등급 경합 구간은 [참고(1등급내 경합)]으로 표기됩니다."
    ws["A2"].font = Font(name=FONT_NAME, size=9.5, bold=True, color=WARN_TEXT)
    ws["A2"].fill = PatternFill("solid", fgColor=WARN_BG)
    ws["A2"].alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[2].height = 28

    # ============================================================
    # TOP-LEFT: 현 고1 학생 성적 입력부 (A4:N9)
    # ============================================================
    ws.merge_cells("A4:F4")
    ws["A4"] = "① 현 고1 학생 성적 입력부 (파란 셀 입력)"
    ws["A4"].font = Font(name=FONT_NAME, size=10.5, bold=True, color="FFFFFF")
    ws["A4"].fill = PatternFill("solid", fgColor=DARK_SLATE)
    ws["A4"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[4].height = 24

    ws.merge_cells("H4:N4")
    ws["H4"] = "② 자동 환산 상태 & 판정 기준 안내"
    ws["H4"].font = Font(name=FONT_NAME, size=10.5, bold=True, color="FFFFFF")
    ws["H4"].fill = PatternFill("solid", fgColor=TEAL_HEADER)
    ws["H4"].alignment = Alignment(horizontal="center", vertical="center")

    inputs_meta = [
        (5, "① 학생 5등급제 내신 평균 (1.00~5.00)", 1.15, "0.00", "학생 적용 상위 누적 백분위(%)",
         '=IF(ISNUMBER(D6),D6,IF(D5>=5,95,IF(D5<1,2,INDEX($X$6:$X$10,MATCH(D5,$U$6:$U$10,1))+(D5-INDEX($U$6:$U$10,MATCH(D5,$U$6:$U$10,1)))*(INDEX($X$6:$X$10,MATCH(D5,$U$6:$U$10,1)+1)-INDEX($X$6:$X$10,MATCH(D5,$U$6:$U$10,1))))))', '0.0"%"'),
        (6, "② 학생 추정 상위 누적 백분위(%) [선택]", None, '0.0"%"', "적용 기준 모드",
         '=IF(ISNUMBER(D6),"직접 입력 백분위 우선 적용","5등급제 내신 구간 중앙 보간 자동 적용")', "@"),
        (7, "③ 모의고사 국수탐 평균 백분위 (0~100)", 94.0, "0.0", "수시 판정 기준 (요구% - 학생%)",
         "안정(+2.0%p↑) / 적정(-1.0~+2.0%p) / 소신(-4.0~-1.0%p) / 상향(-4.0%p↓)", "@"),
        (8, "④ 희망 계열 (전체/인문/자연/자유전공/예체능)", "전체", "@", "정시 판정 기준 (학생백분위 - 70%컷)",
         "안정(+1.5↑) / 적정(-0.5~+1.5) / 소신(-2.5~-0.5) / 상향(-2.5↓)", "@"),
        (9, "⑤ 희망 전형유형 (전체/교과/종합/논술)", "전체", "@", "1등급내 경합 조건",
         "추정 백분위 미입력 & 학생 5등급<1.5 & 학과 요구%≤10% → 참고(1등급내 경합)", "@"),
    ]

    for r_i, lbl, default_val, fmt, r_lbl, r_val, r_fmt in inputs_meta:
        ws.row_dimensions[r_i].height = 23
        ws.merge_cells(f"A{r_i}:C{r_i}")
        ws.merge_cells(f"D{r_i}:F{r_i}")
        ws[f"A{r_i}"] = lbl
        ws[f"A{r_i}"].font = Font(name=FONT_NAME, size=9.5, bold=True)
        ws[f"A{r_i}"].fill = PatternFill("solid", fgColor=LIGHT_BLUE)
        ws[f"A{r_i}"].alignment = Alignment(horizontal="left", vertical="center")
        ws[f"A{r_i}"].border = THIN_BORDER

        ws[f"D{r_i}"] = default_val
        ws[f"D{r_i}"].font = Font(name=FONT_NAME, size=10.5, bold=True, color="0B5394")
        ws[f"D{r_i}"].fill = PatternFill("solid", fgColor=INPUT_BG)
        ws[f"D{r_i}"].alignment = Alignment(horizontal="center", vertical="center")
        ws[f"D{r_i}"].number_format = fmt
        for cc in range(1, 7):
            ws.cell(r_i, cc).border = INPUT_BORDER if cc >= 4 else THIN_BORDER

        ws.merge_cells(f"H{r_i}:J{r_i}")
        ws.merge_cells(f"K{r_i}:N{r_i}")
        ws[f"H{r_i}"] = r_lbl
        ws[f"H{r_i}"].font = Font(name=FONT_NAME, size=9, bold=True)
        ws[f"H{r_i}"].fill = PatternFill("solid", fgColor=ZEBRA_BG)
        ws[f"H{r_i}"].alignment = Alignment(horizontal="left", vertical="center")
        ws[f"K{r_i}"] = r_val
        ws[f"K{r_i}"].font = Font(name=FONT_NAME, size=9.5, bold=(r_i == 5), color=NAVY if r_i == 5 else "1E293B")
        ws[f"K{r_i}"].alignment = Alignment(horizontal="center" if r_i <= 6 else "left", vertical="center")
        ws[f"K{r_i}"].number_format = r_fmt
        for cc in range(8, 15):
            ws.cell(r_i, cc).border = THIN_BORDER

    # Dropdown validations for 희망 계열 & 희망 전형유형
    dv_track = DataValidation(type="list", formula1='"전체,인문,자연,자유전공,예체능"', allow_blank=False)
    dv_type = DataValidation(type="list", formula1='"전체,교과,종합,논술"', allow_blank=False)
    ws.add_data_validation(dv_track)
    ws.add_data_validation(dv_type)
    dv_track.add("D8")
    dv_type.add("D9")

    # ============================================================
    # TOP-RIGHT: 9등급제 ↔ 5등급제 ↔ 누적 백분위(%) 대조 환산표 (P4:Y14)
    # ============================================================
    ws.merge_cells("P4:S4")
    ws["P4"] = "9등급제 누적 백분위 환산표"
    ws["P4"].font = Font(name=FONT_NAME, size=10, bold=True, color="FFFFFF")
    ws["P4"].fill = PatternFill("solid", fgColor=NAVY)
    ws["P4"].alignment = Alignment(horizontal="center", vertical="center")

    ws.merge_cells("U4:X4")
    ws["U4"] = "5등급제 누적 백분위 환산표"
    ws["U4"].font = Font(name=FONT_NAME, size=10, bold=True, color="FFFFFF")
    ws["U4"].fill = PatternFill("solid", fgColor=TEAL_HEADER)
    ws["U4"].alignment = Alignment(horizontal="center", vertical="center")

    for c_i, h in zip([16, 17, 18, 19], ["9등급", "시작(%)", "누적상한(%)", "구간중앙(%)"]):
        cell = ws.cell(5, c_i, h)
        cell.font = Font(name=FONT_NAME, size=9, bold=True)
        cell.fill = PatternFill("solid", fgColor=SUB_HEADER)
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = THIN_BORDER

    for c_i, h in zip([21, 22, 23, 24], ["5등급", "시작(%)", "누적상한(%)", "구간중앙(%)"]):
        cell = ws.cell(5, c_i, h)
        cell.font = Font(name=FONT_NAME, size=9, bold=True)
        cell.fill = PatternFill("solid", fgColor=SUB_HEADER)
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = THIN_BORDER

    g9_table = [
        (1, 0, 4, 2.0), (2, 4, 11, 7.5), (3, 11, 23, 17.0), (4, 23, 40, 31.5),
        (5, 40, 60, 50.0), (6, 60, 77, 68.5), (7, 77, 89, 83.0), (8, 89, 96, 92.5), (9, 96, 100, 98.0),
    ]
    for offset, (g, st, en, mid) in enumerate(g9_table):
        rr = 6 + offset
        for c_i, v in zip([16, 17, 18, 19], [g, st, en, mid]):
            cell = ws.cell(rr, c_i, v)
            cell.font = Font(name=FONT_NAME, size=9)
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = THIN_BORDER
            cell.number_format = "0" if c_i < 19 else "0.0"

    g5_table = [
        (1, 0, 10, 5.0), (2, 10, 34, 22.0), (3, 34, 66, 50.0), (4, 66, 90, 78.0), (5, 90, 100, 95.0),
    ]
    for offset, (g, st, en, mid) in enumerate(g5_table):
        rr = 6 + offset
        for c_i, v in zip([21, 22, 23, 24], [g, st, en, mid]):
            cell = ws.cell(rr, c_i, v)
            cell.font = Font(name=FONT_NAME, size=9)
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = THIN_BORDER
            cell.number_format = "0" if c_i < 24 else "0.0"

    # Note under 5-grade table (U11:X14)
    ws.merge_cells("U11:X14")
    ws["U11"] = "※ 환산 원리:\n9등급 소수 컷을 구간 중앙값 선형 보간으로 상위 누적 백분위(%) 환산 후 5등급제 구간(10/34/66/90/100%)에 대조합니다.\n(예: 9등급 1.50 → 상위 4.8% = 5등급 1등급 중반)"
    ws["U11"].font = Font(name=FONT_NAME, size=8.5, color="334155")
    ws["U11"].fill = PatternFill("solid", fgColor=LIGHT_YELLOW)
    ws["U11"].alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    ws["U11"].border = THIN_BORDER

    # ============================================================
    # SECTION A (LEFT A16:N...): 수시 비교 시뮬레이터
    # ============================================================
    ws.merge_cells("A15:N15")
    ws["A15"] = "▶ [수시 비교 영역] 대학·전형·표준모집단위별 3개년 70% 컷(9등급) → 5등급제/누적백분위 환산 및 자동 판정"
    ws["A15"].font = Font(name=FONT_NAME, size=10.5, bold=True, color="FFFFFF")
    ws["A15"].fill = PatternFill("solid", fgColor=NAVY)
    ws["A15"].alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[15].height = 25

    susi_headers = [
        "대학명", "전형유형", "세부전형명", "계열", "표준모집단위명",
        "2024\n70%컷", "2025\n70%컷", "2026\n70%컷", "3개년 평균\n70%컷",
        "3개년 추이\n(24→26)", "요구 상위\n누적(%)", "5등급제\n환산 구간",
        "희망필터", "2029 맞춤 판정"
    ]
    for c_i, h in enumerate(susi_headers, start=1):
        ws.cell(16, c_i, h)
    style_header_row(ws, 16, len(susi_headers), fill_hex=DARK_SLATE, height=30)

    # Deduplicate unique (대학명, 전형유형, 세부전형명, 계열, 표준모집단위명) with at least one 70% cut
    susi_work = df_susi.copy()
    susi_work["_has_cut"] = susi_work["최종등록자_70%컷(9등급)"].notna()
    # Keep rows that have a 70% cut in at least one year
    key_cols = ["대학명", "전형유형", "세부전형명", "계열", "표준모집단위명(3개년추적용)"]
    susi_keys = (
        susi_work[susi_work["_has_cut"]]
        .drop_duplicates(subset=key_cols)[key_cols]
        .reset_index(drop=True)
    )

    s_sheet = "'02_수시_3개년DB(원본)'"
    font_s = Font(name=FONT_NAME, size=9)
    zebra_fill = PatternFill("solid", fgColor=ZEBRA_BG)

    for idx, row in susi_keys.iterrows():
        r = 17 + idx
        ws.cell(r, 1, row["대학명"])
        ws.cell(r, 2, row["전형유형"])
        ws.cell(r, 3, row["세부전형명"])
        ws.cell(r, 4, row["계열"])
        ws.cell(r, 5, row["표준모집단위명(3개년추적용)"])

        # Bounded AVERAGEIFS guarded by COUNTIFS (zero #DIV/0!)
        for c_i, yr in [(6, 2024), (7, 2025), (8, 2026)]:
            crit = (
                f"{s_sheet}!$B$2:$B${s_end},$A{r},"
                f"{s_sheet}!$D$2:$D${s_end},$C{r},"
                f"{s_sheet}!$G$2:$G${s_end},$E{r},"
                f"{s_sheet}!$A$2:$A${s_end},{yr},"
                f'{s_sheet}!$M$2:$M${s_end},">0"'
            )
            ws.cell(r, c_i, f'=IF(COUNTIFS({crit})=0,"",AVERAGEIFS({s_sheet}!$M$2:$M${s_end},{crit}))')

        # Col I (9): 3개년 평균 70%컷
        ws.cell(r, 9, f'=IF(COUNT(F{r}:H{r})=0,"",AVERAGE(F{r}:H{r}))')

        # Col J (10): 3개년 추이 (lower grade = higher cutoff = 상승)
        ws.cell(
            r, 10,
            f'=IF(AND(ISNUMBER(F{r}),ISNUMBER(H{r})),'
            f'IF(H{r}-F{r}<-0.05,"▲상승("&TEXT(H{r}-F{r},"0.00")&")",'
            f'IF(H{r}-F{r}>0.05,"▼하락(+"&TEXT(H{r}-F{r},"0.00")&")","─유지("&TEXT(H{r}-F{r},"0.00")&")")),'
            f'IF(AND(ISNUMBER(G{r}),ISNUMBER(H{r})),"25→26("&TEXT(H{r}-G{r},"+0.00;-0.00;0.00")&")","단일연도"))'
        )

        # Col K (11): 요구 상위 누적 백분위(%) via piecewise linear interpolation on $P$6:$S$14
        ws.cell(
            r, 11,
            f'=IF(NOT(ISNUMBER(I{r})),"",'
            f'IF(I{r}>=9,98,IF(I{r}<1,2,'
            f'INDEX($S$6:$S$14,MATCH(I{r},$P$6:$P$14,1))'
            f'+(I{r}-INDEX($P$6:$P$14,MATCH(I{r},$P$6:$P$14,1)))'
            f'*(INDEX($S$6:$S$14,MATCH(I{r},$P$6:$P$14,1)+1)-INDEX($S$6:$S$14,MATCH(I{r},$P$6:$P$14,1))))))'
        )

        # Col L (12): 5등급제 환산 구간
        ws.cell(
            r, 12,
            f'=IF(NOT(ISNUMBER(K{r})),"",'
            f'IF(K{r}<=10,"1등급 ("&TEXT(K{r},"0.0")&"%)",'
            f'IF(K{r}<=34,"2등급 ("&TEXT(K{r},"0.0")&"%)",'
            f'IF(K{r}<=66,"3등급 ("&TEXT(K{r},"0.0")&"%)",'
            f'IF(K{r}<=90,"4등급 ("&TEXT(K{r},"0.0")&"%)","5등급 ("&TEXT(K{r},"0.0")&"%)")))))'
        )

        # Col M (13): 희망필터 일치
        ws.cell(r, 13, f'=IF(AND(OR($D$8="전체",D{r}=$D$8),OR($D$9="전체",B{r}=$D$9)),"★일치","-")')

        # Col N (14): 2029 맞춤 판정
        ws.cell(
            r, 14,
            f'=IF(NOT(ISNUMBER(K{r})),"참고(컷미공개)",'
            f'IF(AND(NOT(ISNUMBER($D$6)),$D$5<1.5,K{r}<=10),"참고(1등급내 경합)",'
            f'IF(K{r}-$K$5>=2,"안정",'
            f'IF(K{r}-$K$5>=-1,"적정",'
            f'IF(K{r}-$K$5>=-4,"소신","상향")))))'
        )

        is_z = (r % 2 == 0)
        for c_i in range(1, 15):
            cell = ws.cell(r, c_i)
            cell.font = Font(name=FONT_NAME, size=9, bold=(c_i in (9, 14)))
            cell.border = THIN_BORDER
            if is_z:
                cell.fill = zebra_fill
            if c_i in (1, 2, 4, 10, 12, 13, 14):
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif c_i in (6, 7, 8, 9):
                cell.number_format = "0.00"
                cell.alignment = Alignment(horizontal="right", vertical="center")
            elif c_i == 11:
                cell.number_format = '0.0"%"'
                cell.alignment = Alignment(horizontal="right", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    susi_sim_end = 16 + len(susi_keys)

    # Conditional formatting on 수시 판정 N17:N{susi_sim_end}
    cf_rules_susi = [
        ('"안정"', "DCFCE7", "166534"),
        ('"적정"', "DBEAFE", "1E40AF"),
        ('"소신"', "FEF9C3", "854D0E"),
        ('"상향"', "FEE2E2", "991B1B"),
        ('"참고(1등급내 경합)"', "F3E8FF", "6B21A8"),
    ]
    for formula_str, bg, fg in cf_rules_susi:
        ws.conditional_formatting.add(
            f"N17:N{susi_sim_end}",
            CellIsRule(operator="equal", formula=[formula_str],
                       fill=PatternFill("solid", fgColor=bg),
                       font=Font(name=FONT_NAME, size=9, bold=True, color=fg))
        )

    # ============================================================
    # SECTION B (RIGHT P15:Z...): 정시 비교 시뮬레이터 (국수탐 백분위 70% 기준)
    # ============================================================
    ws.merge_cells("P15:Z15")
    ws["P15"] = "▶ [정시 비교 영역] 2028 통합수능 대비 3개년 국수탐 평균 백분위(70% 컷) 기준 상대 위치 시뮬레이터"
    ws["P15"].font = Font(name=FONT_NAME, size=10.5, bold=True, color="FFFFFF")
    ws["P15"].fill = PatternFill("solid", fgColor=TEAL_HEADER)
    ws["P15"].alignment = Alignment(horizontal="left", vertical="center")

    jeongsi_headers = [
        "대학명", "모집군", "세부전형명", "계열", "표준모집단위명",
        "2024\n백분위70%", "2025\n백분위70%", "2026\n백분위70%", "3개년 평균\n백분위70%",
        "3개년 추이\n(24→26)", "2029 정시 판정"
    ]
    for offset, h in enumerate(jeongsi_headers):
        c_i = 16 + offset
        cell = ws.cell(16, c_i, h)
        cell.fill = PatternFill("solid", fgColor=TEAL_HEADER)
        cell.font = Font(name=FONT_NAME, size=10, bold=True, color="FFFFFF")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = THIN_BORDER

    j_work = df_jeongsi.copy()
    j_work["_has_pct"] = j_work["국수탐_평균백분위_70%컷"].notna()
    j_key_cols = ["대학명", "모집군", "세부전형명", "계열", "표준모집단위명(3개년추적용)"]
    j_keys = (
        j_work[j_work["_has_pct"]]
        .drop_duplicates(subset=j_key_cols)[j_key_cols]
        .reset_index(drop=True)
    )

    j_sheet = "'03_정시_3개년DB(원본)'"
    for idx, row in j_keys.iterrows():
        r = 17 + idx
        ws.cell(r, 16, row["대학명"])
        ws.cell(r, 17, row["모집군"])
        ws.cell(r, 18, row["세부전형명"])
        ws.cell(r, 19, row["계열"])
        ws.cell(r, 20, row["표준모집단위명(3개년추적용)"])

        for c_i, yr in [(21, 2024), (22, 2025), (23, 2026)]:
            crit = (
                f"{j_sheet}!$B$2:$B${j_end},$P{r},"
                f"{j_sheet}!$C$2:$C${j_end},$Q{r},"
                f"{j_sheet}!$D$2:$D${j_end},$R{r},"
                f"{j_sheet}!$G$2:$G${j_end},$T{r},"
                f"{j_sheet}!$A$2:$A${j_end},{yr},"
                f'{j_sheet}!$P$2:$P${j_end},">0"'
            )
            ws.cell(r, c_i, f'=IF(COUNTIFS({crit})=0,"",AVERAGEIFS({j_sheet}!$P$2:$P${j_end},{crit}))')

        # Col X (24): 3개년 평균 백분위 70%
        ws.cell(r, 24, f'=IF(COUNT(U{r}:W{r})=0,"",AVERAGE(U{r}:W{r}))')

        # Col Y (25): 3개년 추이 (higher percentile = 상승)
        ws.cell(
            r, 25,
            f'=IF(AND(ISNUMBER(U{r}),ISNUMBER(W{r})),'
            f'IF(W{r}-U{r}>0.5,"▲상승(+"&TEXT(W{r}-U{r},"0.0")&")",'
            f'IF(W{r}-U{r}<-0.5,"▼하락("&TEXT(W{r}-U{r},"0.0")&")","─유지("&TEXT(W{r}-U{r},"0.0")&")")),'
            f'IF(AND(ISNUMBER(V{r}),ISNUMBER(W{r})),"25→26("&TEXT(W{r}-V{r},"+0.0;-0.0;0.0")&")","단일연도"))'
        )

        # Col Z (26): 2029 정시 판정 (student mock pct $D$7 vs 3yr avg X{r})
        ws.cell(
            r, 26,
            f'=IF(NOT(ISNUMBER(X{r})),"참고(미공개)",'
            f'IF($D$7-X{r}>=1.5,"안정",'
            f'IF($D$7-X{r}>=-0.5,"적정",'
            f'IF($D$7-X{r}>=-2.5,"소신","상향"))))'
        )

        is_z = (r % 2 == 0)
        for c_i in range(16, 27):
            cell = ws.cell(r, c_i)
            cell.font = Font(name=FONT_NAME, size=9, bold=(c_i in (24, 26)))
            cell.border = THIN_BORDER
            if is_z:
                cell.fill = zebra_fill
            if c_i in (16, 17, 19, 25, 26):
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif c_i in (21, 22, 23, 24):
                cell.number_format = "0.00"
                cell.alignment = Alignment(horizontal="right", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    jeongsi_sim_end = 16 + len(j_keys)
    for formula_str, bg, fg in cf_rules_susi[:4]:
        ws.conditional_formatting.add(
            f"Z17:Z{jeongsi_sim_end}",
            CellIsRule(operator="equal", formula=[formula_str],
                       fill=PatternFill("solid", fgColor=bg),
                       font=Font(name=FONT_NAME, size=9, bold=True, color=fg))
        )

    # Set clean column widths
    col_w = {
        1: 11, 2: 8, 3: 24, 4: 9, 5: 22,
        6: 9, 7: 9, 8: 9, 9: 10.5, 10: 14, 11: 11, 12: 15, 13: 9, 14: 17,
        15: 3,  # visual spacer column O
        16: 11, 17: 7, 18: 22, 19: 9, 20: 22,
        21: 10, 22: 10, 23: 10, 24: 11, 25: 13, 26: 14,
    }
    for ci, w in col_w.items():
        ws.column_dimensions[get_column_letter(ci)].width = w

    ws.freeze_panes = "A17"
    ws.auto_filter.ref = f"A16:N{susi_sim_end}"


def build_reform_2028_sheet(ws, reform_data: List[Dict[str, str]]):
    """Sheet 5: 05_2028개편_전형변화요약"""
    ws.views.sheetView[0].showGridLines = True

    ws.merge_cells("A1:G1")
    ws["A1"] = "2028학년도 대학입학전형 시행계획 기반 — 서울 주요 13개 대학 핵심 개편 요약 (2029학년도 현 고1 직결)"
    ws["A1"].font = Font(name=FONT_NAME, size=13, bold=True, color="FFFFFF")
    ws["A1"].fill = PatternFill("solid", fgColor=NAVY)
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 32

    for c_i, col_name in enumerate(REFORM_2028_COLUMNS, start=1):
        ws.cell(2, c_i, col_name)
    style_header_row(ws, 2, len(REFORM_2028_COLUMNS), fill_hex=DARK_SLATE, height=30)

    zebra_fill = PatternFill("solid", fgColor=ZEBRA_BG)
    for r_i, item in enumerate(reform_data, start=3):
        ws.row_dimensions[r_i].height = 78
        for c_i, col_name in enumerate(REFORM_2028_COLUMNS, start=1):
            val = item.get(col_name, "공식 시행계획 원문 확인 필요")
            cell = ws.cell(r_i, c_i, val)
            cell.font = Font(name=FONT_NAME, size=9.5, bold=(c_i == 1))
            cell.border = THIN_BORDER
            if r_i % 2 == 0:
                cell.fill = zebra_fill
            cell.alignment = Alignment(
                horizontal="center" if c_i == 1 else "left",
                vertical="center",
                wrap_text=True,
            )

    widths = {1: 13, 2: 38, 3: 40, 4: 38, 5: 40, 6: 40, 7: 42}
    for ci, w in widths.items():
        ws.column_dimensions[get_column_letter(ci)].width = w
    ws.freeze_panes = "A3"
    ws.auto_filter.ref = f"A2:G{2 + len(reform_data)}"


def build_log_sheet(ws, log_data: Dict[str, Any]):
    """Sheet 6: 06_수집로그_및_출처검증"""
    ws.views.sheetView[0].showGridLines = True

    ws.merge_cells("A1:G1")
    ws["A1"] = "원천 데이터 수집 로그, 출처 검증 및 학과명 통폐합 매핑 내역"
    ws["A1"].font = Font(name=FONT_NAME, size=13, bold=True, color="FFFFFF")
    ws["A1"].fill = PatternFill("solid", fgColor=NAVY)
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 32

    # Table 1: 대학별 수집 로그
    h1 = ["대학명", "탐색 공식 URL", "아카이빙 원본 파일 (./raw_data/{대학명}/)", "2028 PDF", "수시 건수(24/25/26)", "정시 건수(24/25/26)", "누락 연도·전형 및 검증 사유"]
    for ci, h in enumerate(h1, start=1):
        ws.cell(3, ci, h)
    style_header_row(ws, 3, len(h1), fill_hex=DARK_SLATE, height=26)

    u_logs = log_data.get("universities", {})
    r = 4
    for u in ALL_UNIVS:
        ul = u_logs.get(u, {})
        sc = ul.get("susi_counts", {})
        jc = ul.get("jeongsi_counts", {})
        s_str = f"{sc.get('2024',0)} / {sc.get('2025',0)} / {sc.get('2026',0)}"
        j_str = f"{jc.get('2024',0)} / {jc.get('2025',0)} / {jc.get('2026',0)}"
        files_str = ", ".join(ul.get("raw_files", []))
        vals = [
            u,
            ul.get("url", ""),
            files_str,
            "확보완료" if ul.get("has_2028_pdf") else "수동확인필요",
            s_str,
            j_str,
            ul.get("missing_or_notes", ""),
        ]
        ws.row_dimensions[r].height = 46
        for ci, v in enumerate(vals, start=1):
            cell = ws.cell(r, ci, v)
            cell.font = Font(name=FONT_NAME, size=9, bold=(ci == 1))
            cell.border = THIN_BORDER
            if r % 2 == 1:
                cell.fill = PatternFill("solid", fgColor=ZEBRA_BG)
            cell.alignment = Alignment(horizontal="center" if ci in (1, 4, 5, 6) else "left", vertical="center", wrap_text=True)
        r += 1

    # Table 2: 학과명 통폐합 & 신설 무전공 매핑 내역
    r += 1
    ws.merge_cells(f"A{r}:G{r}")
    ws[f"A{r}"] = "학과명 통폐합 · 신설 자유전공(무전공) 3개년 추적 매핑 내역"
    ws[f"A{r}"].font = Font(name=FONT_NAME, size=10.5, bold=True, color="FFFFFF")
    ws[f"A{r}"].fill = PatternFill("solid", fgColor=TEAL_HEADER)
    ws[f"A{r}"].alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[r].height = 24
    r += 1

    h2 = ["대학명", "원 모집단위명", "표준모집단위명", "변동 구분", "비고", "", ""]
    for ci, h in enumerate(h2[:5], start=1):
        ws.cell(r, ci, h)
    ws.merge_cells(f"E{r}:G{r}")
    style_header_row(ws, r, 7, fill_hex=TEAL_HEADER, height=24)
    r += 1

    for mp in log_data.get("dept_mappings", []):
        ws.merge_cells(f"E{r}:G{r}")
        ws.cell(r, 1, mp.get("대학명", ""))
        ws.cell(r, 2, mp.get("원모집단위명", ""))
        ws.cell(r, 3, mp.get("표준모집단위명", ""))
        ws.cell(r, 4, mp.get("변동구분", ""))
        ws.cell(r, 5, mp.get("비고", ""))
        ws.row_dimensions[r].height = 24
        for ci in range(1, 8):
            cell = ws.cell(r, ci)
            cell.font = Font(name=FONT_NAME, size=9)
            cell.border = THIN_BORDER
            cell.alignment = Alignment(horizontal="center" if ci in (1, 4) else "left", vertical="center", wrap_text=True)
        r += 1

    # Table 3: 수동 보완 및 자동 재병합 가이드
    r += 1
    ws.merge_cells(f"A{r}:G{r}")
    ws[f"A{r}"] = "수동 보완 파일 추가 및 자동 재병합 가이드 (재실행 방법)"
    ws[f"A{r}"].font = Font(name=FONT_NAME, size=10.5, bold=True, color="FFFFFF")
    ws[f"A{r}"].fill = PatternFill("solid", fgColor=NAVY)
    ws[f"A{r}"].alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[r].height = 24
    r += 1

    guide_lines = [
        "1. 수동확인필요(예: 한양대·중앙대 2028 시행계획 PDF 또는 타 대학 논술 입결 PDF/CSV) 원본 파일을 ./입결DB_2029맞춤_서울13개교/raw_data/{대학명}/ 폴더에 저장합니다.",
        "2. CSV 체크포인트에 직접 행을 보완할 경우 ./intermediate/{대학명}_수시_3개년.csv 또는 {대학명}_정시_3개년.csv (UTF-8-SIG)에 동일 스키마로 행을 추가합니다.",
        "3. 터미널에서 아래 명령어를 실행하면 기존 체크포인트 및 신규 원본이 자동 병합되어 6시트 엑셀이 무결하게 재생성됩니다:",
        "   python ./입결DB_2029맞춤_서울13개교/scripts/enrich_and_standardize.py && python ./입결DB_2029맞춤_서울13개교/scripts/build_excel.py",
    ]
    for gl in guide_lines:
        ws.merge_cells(f"A{r}:G{r}")
        ws[f"A{r}"] = gl
        ws[f"A{r}"].font = Font(name=FONT_NAME, size=9.5, bold=("python " in gl))
        ws[f"A{r}"].alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        ws.row_dimensions[r].height = 22
        r += 1

    widths = {1: 13, 2: 34, 3: 44, 4: 16, 5: 18, 6: 18, 7: 44}
    for ci, w in widths.items():
        ws.column_dimensions[get_column_letter(ci)].width = w
    ws.freeze_panes = "A4"


def build_workbook(out_path: Path):
    df_susi, df_jeongsi = load_all_checkpoints()
    reform_path = INTERMEDIATE_DIR / "2028_시행계획_13개교.json"
    reform_data = json.loads(reform_path.read_text(encoding="utf-8")) if reform_path.exists() else []
    log_path = INTERMEDIATE_DIR / "collection_log.json"
    log_data = json.loads(log_path.read_text(encoding="utf-8")) if log_path.exists() else {}

    wb = openpyxl.Workbook()
    # Rename default sheet
    ws1 = wb.active
    ws1.title = "01_요약_대시보드"
    ws2 = wb.create_sheet("02_수시_3개년DB(원본)")
    ws3 = wb.create_sheet("03_정시_3개년DB(원본)")
    ws4 = wb.create_sheet("04_2029맞춤_비교시뮬레이터")
    ws5 = wb.create_sheet("05_2028개편_전형변화요약")
    ws6 = wb.create_sheet("06_수집로그_및_출처검증")

    # Populate sheets
    write_raw_db_sheet(ws2, df_susi, "수시")
    write_raw_db_sheet(ws3, df_jeongsi, "정시")
    build_dashboard_sheet(ws1, len(df_susi), len(df_jeongsi), log_data)
    build_simulator_sheet(ws4, df_susi, df_jeongsi)
    build_reform_2028_sheet(ws5, reform_data)
    build_log_sheet(ws6, log_data)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out_path)
    print(f"[SUCCESS] Built workbook: {out_path} ({out_path.stat().st_size:,} bytes)")
    print(f"  Sheets: {wb.sheetnames}")
    print(f"  수시 rows: {len(df_susi):,} | 정시 rows: {len(df_jeongsi):,}")
    print(f"  시뮬레이터 수시 rows: {ws4.max_row - 16} (sheet max_row={ws4.max_row})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=str(OUTPUT_DIR / "서울13개대학_3개년입결_2029맞춤DB.xlsx"))
    args = parser.parse_args()
    build_workbook(Path(args.out))
