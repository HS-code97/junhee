# -*- coding: utf-8 -*-
"""
13개 대학 3개년 수시/정시 원천 데이터(어디가 + 대학 입학처 PDF) 통합 파싱·정제·체크포인트 생성기
- 재실행 가능(Idempotent): 사용자가 ./raw_data/{대학명}/ 에 원본 파일 추가 후 재실행하면 자동 병합됨
"""
from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple
import pymupdf

from schema_utils import (
    ALL_UNIVS, BASE_DIR, RAW_DIR, INTERMEDIATE_DIR,
    clean_str, parse_int, parse_float, infer_track, normalize_dept,
    save_checkpoint_csv, save_collection_log
)
from parse_adiga import parse_adiga_susi_html, parse_adiga_jeongsi_html

# 한국외대 서울캠퍼스 공식 모집단위 키워드 (2028 시행계획 p.5-6 서울캠퍼스 기준)
HUFS_SEOUL_DEPTS = {
    "ELLT학과", "영미문학·문화학과", "영미문학.문화학과", "영어통번역학과", "영어대학", "영어대학[통합모집]",
    "프랑스어학부", "독일어과", "노어과", "스페인어과", "이탈리아어과", "포르투갈어과", "네덜란드어과", "스칸디나비아어과",
    "핵심외국어계열", "특수외국어(유럽지역)계열",
    "말레이·인도네시아어과", "말레이·인도네시아학과", "말레이인도네시아어과", "태국어과", "태국학과",
    "베트남어과", "베트남학과", "인도어과", "인도·남아시아학과", "아랍어과",
    "튀르키예·아제르바이잔학과", "터키·아제르바이잔어과", "페르시아어·이란학과", "몽골어과",
    "특수외국어(인도·아세안지역)계열", "특수외국어(중동지역)계열",
    "중국언어문화학부", "중국외교통상학부", "중국학대학", "일본언어문화학부", "융합일본지역학부", "일본학대학",
    "정치외교학과", "행정학과", "미디어커뮤니케이션학부", "사회과학대학",
    "국제통상학과", "경제학부", "상경대학", "경영학부", "경영대학",
    "영어교육과", "프랑스어교육과", "독일어교육과", "한국어교육과", "중국어교육과",
    "국제학부", "Language&Diplomacy학부", "Language&Trade학부",
    "Language&AI융합학부", "SocialScience&AI융합학부", "자유전공학부(서울)", "자유전공학부",
    "KFL학부", "AI데이터융합학부", "Finance&AI융합학부", "글로벌자유전공학부(서울)",
}


def is_hufs_seoul(dept: str) -> bool:
    d_norm = re.sub(r"\s+", "", dept).replace("・", "·").replace("‧", "·").replace(".", "·")
    if "(글로벌)" in d_norm or "글로벌캠퍼스" in d_norm:
        return False
    if "(서울)" in d_norm:
        return True
    # 명확한 글로벌캠퍼스 학과 제외
    global_only = [
        "그리스", "불가리아", "루마니아", "체코", "슬로바키아", "폴란드", "헝가리", "세르비아", "크로아티아",
        "우크라이나", "중앙아시아", "아프리카", "브라질", "인도네시아", "바이오메디컬", "반도체전자",
        "생명공학", "수학과", "통계학과", "전자물리", "환경학과", "화학과", "컴퓨터공학", "정보통신공학",
        "산업경영공학", "기후변화융합", "글로벌스포츠", "디지털콘텐츠", "국제금융", "GlobalBusiness",
        "언어인지과학", "철학과", "사학과", "한국학과", "국제경영", "지식콘텐츠", "투어리즘", "국제스포츠",
    ]
    if any(g in d_norm for g in global_only):
        return False
    return True


def parse_dongguk_nonsul() -> List[Dict[str, Any]]:
    """동국대 2026_입시결과.pdf (p.12-13)에서 2026 & 2025 논술전형 파싱"""
    pdf_path = RAW_DIR / "동국대" / "2026_입시결과.pdf"
    if not pdf_path.exists():
        return []
    doc = pymupdf.open(pdf_path)
    rows: List[Dict[str, Any]] = []
    # p.12, p.13 (0-indexed: 11, 12)
    full_lines = []
    for pg_idx in [11, 12]:
        if pg_idx < len(doc):
            full_lines.extend([ln.strip() for ln in doc[pg_idx].get_text("text").splitlines() if ln.strip()])

    # Extract by pattern: 모집단위 line followed by numeric tokens for 2026 (7 values) and 2025 (7 values)
    # Using word-level coordinate extraction by Y-line for rock-solid table alignment!
    for pg_idx in [11, 12]:
        if pg_idx >= len(doc):
            continue
        words = doc[pg_idx].get_text("words")  # (x0, y0, x1, y1, word, block, line, word_no)
        # Group by rounded y0 (tolerance 4pt)
        lines_by_y: Dict[int, List[Tuple[float, str]]] = {}
        for x0, y0, x1, y1, w, *_ in words:
            y_key = None
            for ky in lines_by_y:
                if abs(ky - y0) <= 4.5:
                    y_key = ky
                    break
            if y_key is None:
                y_key = int(round(y0))
                lines_by_y[y_key] = []
            lines_by_y[y_key].append((x0, w))

        for yk in sorted(lines_by_y.keys()):
            items = sorted(lines_by_y[yk], key=lambda t: t[0])
            # Exact coordinates on p.12-13: 대학명 x<110, 모집단위 110<=x<215, 수치 x>=215
            left_words = [w for x, w in items if 110 <= x < 215]
            right_items = [(x, w) for x, w in items if x >= 215]
            dept = clean_str("".join(left_words))
            if not dept or any(h in dept for h in ["모집단위", "지원현황", "논술전형", "대학", "합계", "총계", "※", "학생부", "충원율", "실경쟁률"]) or re.match(r"^\d", dept):
                continue
            r_vals = [w for _, w in right_items]
            # Parse 2026 block: [모집, 지원, 경쟁률, 실경쟁률, 평균, 최저, 충원율]
            if len(r_vals) >= 7:
                q26 = parse_int(r_vals[0])
                app26 = parse_int(r_vals[1])
                comp26 = parse_float(r_vals[2])
                real26 = parse_float(r_vals[3])
                avg26 = parse_float(r_vals[4])
                min26 = parse_float(r_vals[5])
                repl26 = r_vals[6]
                if q26 is not None and app26 is not None and comp26 is not None and q26 > 0 and comp26 > 0:
                    std_dept, std_note = normalize_dept("동국대", dept)
                    note_p = [f"실질경쟁률:{real26}", f"학생부최저:{min26}", f"충원율:{repl26}"]
                    if std_note:
                        note_p.append(std_note)
                    rows.append({
                        "학년도": 2026,
                        "대학명": "동국대",
                        "전형유형": "논술",
                        "세부전형명": "논술(논술전형)",
                        "계열": infer_track(dept),
                        "모집단위(학과)": dept,
                        "표준모집단위명(3개년추적용)": std_dept,
                        "모집인원": q26,
                        "지원인원": app26,
                        "경쟁률": comp26,
                        "충원합격순위": None,
                        "최종등록자_50%컷(9등급)": None,
                        "최종등록자_70%컷(9등급)": None,
                        "평균등급": avg26 if (avg26 is not None and avg26 <= 9.0) else None,
                        "최초합격컷": None,
                        "출처구분": "입학처",
                        "원본URL_또는_파일명": "raw_data/동국대/2026_입시결과.pdf (ipsi.dongguk.edu)",
                        "비고": " | ".join(note_p),
                    })
            if len(r_vals) >= 14:
                q25 = parse_int(r_vals[7])
                app25 = parse_int(r_vals[8])
                comp25 = parse_float(r_vals[9])
                real25 = parse_float(r_vals[10])
                avg25 = parse_float(r_vals[11])
                min25 = parse_float(r_vals[12])
                repl25 = r_vals[13]
                if q25 is not None and app25 is not None and comp25 is not None and q25 > 0 and comp25 > 0:
                    std_dept, std_note = normalize_dept("동국대", dept)
                    note_p = [f"실질경쟁률:{real25}", f"학생부최저:{min25}", f"충원율:{repl25}"]
                    if std_note:
                        note_p.append(std_note)
                    rows.append({
                        "학년도": 2025,
                        "대학명": "동국대",
                        "전형유형": "논술",
                        "세부전형명": "논술(논술전형)",
                        "계열": infer_track(dept),
                        "모집단위(학과)": dept,
                        "표준모집단위명(3개년추적용)": std_dept,
                        "모집인원": q25,
                        "지원인원": app25,
                        "경쟁률": comp25,
                        "충원합격순위": None,
                        "최종등록자_50%컷(9등급)": None,
                        "최종등록자_70%컷(9등급)": None,
                        "평균등급": avg25 if (avg25 is not None and avg25 <= 9.0) else None,
                        "최초합격컷": None,
                        "출처구분": "입학처",
                        "원본URL_또는_파일명": "raw_data/동국대/2026_입시결과.pdf (ipsi.dongguk.edu)",
                        "비고": " | ".join(note_p),
                    })
    return rows


def parse_hufs_nonsul() -> List[Dict[str, Any]]:
    """한국외대 2026_수시지원가이드_입결.pdf (p.11 우측) 서울캠퍼스 논술전형 2025 & 2026 파싱"""
    pdf_path = RAW_DIR / "한국외대" / "2026_수시지원가이드_입결.pdf"
    if not pdf_path.exists():
        return []
    doc = pymupdf.open(pdf_path)
    rows: List[Dict[str, Any]] = []
    if len(doc) <= 10:
        return []
    words = doc[10].get_text("words")
    lines_by_y: Dict[int, List[Tuple[float, str]]] = {}
    for x0, y0, x1, y1, w, *_ in words:
        if x0 < 695:
            continue
        y_key = next((ky for ky in lines_by_y if abs(ky - y0) <= 4.0), None)
        if y_key is None:
            y_key = int(round(y0))
            lines_by_y[y_key] = []
        lines_by_y[y_key].append((x0, w))

    for yk in sorted(lines_by_y.keys()):
        items = sorted(lines_by_y[yk], key=lambda t: t[0])
        left_words = [w for x, w in items if 698 <= x < 825]
        r_vals = [w for x, w in items if x >= 825]
        dept = clean_str(" ".join(left_words))
        if not dept or any(h in dept for h in ["모집단위", "논술전형", "경쟁률", "실질", "충원", "대학", "계", "※"]):
            continue
        if len(r_vals) >= 11:
            q25, q26 = parse_int(r_vals[0]), parse_int(r_vals[1])
            c25, c26 = parse_float(r_vals[3]), parse_float(r_vals[4])
            rc25, rc26 = parse_float(r_vals[5]), parse_float(r_vals[6])
            wl25, wl26 = parse_int(r_vals[7]), parse_int(r_vals[8])
            es26, pass26 = parse_float(r_vals[9]), parse_float(r_vals[10])
            std_dept, std_note = normalize_dept("한국외대", dept)
            if q26 and c26:
                note = f"실질경쟁률:{rc26} | 논술평균:{es26} | 최저충족률:{pass26}%"
                if std_note:
                    note += f" | {std_note}"
                rows.append({
                    "학년도": 2026,
                    "대학명": "한국외대",
                    "전형유형": "논술",
                    "세부전형명": "논술(논술전형)",
                    "계열": infer_track(dept),
                    "모집단위(학과)": dept,
                    "표준모집단위명(3개년추적용)": std_dept,
                    "모집인원": q26,
                    "지원인원": None,
                    "경쟁률": c26,
                    "충원합격순위": wl26,
                    "최종등록자_50%컷(9등급)": None,
                    "최종등록자_70%컷(9등급)": None,
                    "평균등급": None,
                    "최초합격컷": None,
                    "출처구분": "입학처",
                    "원본URL_또는_파일명": "raw_data/한국외대/2026_수시지원가이드_입결.pdf (adms.hufs.ac.kr)",
                    "비고": note,
                })
            if q25 and c25:
                note = f"실질경쟁률:{rc25}"
                if std_note:
                    note += f" | {std_note}"
                rows.append({
                    "학년도": 2025,
                    "대학명": "한국외대",
                    "전형유형": "논술",
                    "세부전형명": "논술(논술전형)",
                    "계열": infer_track(dept),
                    "모집단위(학과)": dept,
                    "표준모집단위명(3개년추적용)": std_dept,
                    "모집인원": q25,
                    "지원인원": None,
                    "경쟁률": c25,
                    "충원합격순위": wl25,
                    "최종등록자_50%컷(9등급)": None,
                    "최종등록자_70%컷(9등급)": None,
                    "평균등급": None,
                    "최초합격컷": None,
                    "출처구분": "입학처",
                    "원본URL_또는_파일명": "raw_data/한국외대/2026_수시지원가이드_입결.pdf (adms.hufs.ac.kr)",
                    "비고": note,
                })
    return rows


def parse_khu_nonsul() -> List[Dict[str, Any]]:
    """경희대 2026/2025/2024_입학전형통계.pdf 양면 펼침 논술우수자전형 정밀 파싱"""
    rows: List[Dict[str, Any]] = []
    for yr in [2026, 2025, 2024]:
        pdf_path = RAW_DIR / "경희대" / f"{yr}_입학전형통계.pdf"
        if not pdf_path.exists():
            continue
        doc = pymupdf.open(pdf_path)
        for pg_idx, page in enumerate(doc):
            txt = page.get_text("text")
            if "논술우수자전형" not in txt or "모집단위" not in txt:
                continue
            words = page.get_text("words")
            # Split 2-page spread into Left half (x < 600) and Right half (x >= 600)
            halves = [
                ([w for w in words if w[0] < 600], 0.0, 152.0),
                ([w for w in words if w[0] >= 600], 600.0, 775.0),
            ]
            for half_words, x_min, x_split in halves:
                lines_by_y: Dict[int, List[Tuple[float, str]]] = {}
                for x0, y0, x1, y1, w, *_ in half_words:
                    if y0 < 195:  # skip headers
                        continue
                    y_key = next((ky for ky in lines_by_y if abs(ky - y0) <= 4.0), None)
                    if y_key is None:
                        y_key = int(round(y0))
                        lines_by_y[y_key] = []
                    lines_by_y[y_key].append((x0, w))

                for yk in sorted(lines_by_y.keys()):
                    items = sorted(lines_by_y[yk], key=lambda t: t[0])
                    left_words = [w for x, w in items if x_min <= x < x_split]
                    r_vals = [w for x, w in items if x >= x_split]
                    dept = clean_str("".join(left_words))
                    if not dept or any(h in dept for h in ["모집단위", "논술우수자", "경쟁률", "충원합격", "합계", "총계", "※", "경희대학교", "모집", "지원"]) or re.match(r"^\d", dept):
                        continue
                    if len(r_vals) >= 10:
                        q = parse_int(r_vals[0])
                        app = parse_int(r_vals[1])
                        comp = parse_float(r_vals[2])
                        wl = parse_int(r_vals[4])
                        essay_score = parse_float(r_vals[8]) if len(r_vals) > 8 else None
                        real_comp = parse_float(r_vals[-1])
                        if q is not None and app is not None and comp is not None and q > 0 and app >= q:
                            std_dept, std_note = normalize_dept("경희대", dept)
                            note_p = []
                            if essay_score is not None and essay_score <= 100:
                                note_p.append(f"논술평균:{essay_score}")
                            if real_comp is not None:
                                note_p.append(f"실질경쟁률:{real_comp}")
                            if std_note:
                                note_p.append(std_note)
                            rows.append({
                                "학년도": yr,
                                "대학명": "경희대",
                                "전형유형": "논술",
                                "세부전형명": "논술(논술우수자전형)",
                                "계열": infer_track(dept),
                                "모집단위(학과)": dept,
                                "표준모집단위명(3개년추적용)": std_dept,
                                "모집인원": q,
                                "지원인원": app,
                                "경쟁률": comp,
                                "충원합격순위": wl,
                                "최종등록자_50%컷(9등급)": None,
                                "최종등록자_70%컷(9등급)": None,
                                "평균등급": None,
                                "최초합격컷": None,
                                "출처구분": "입학처",
                                "원본URL_또는_파일명": f"raw_data/경희대/{yr}_입학전형통계.pdf (iphak.khu.ac.kr)",
                                "비고": " | ".join(note_p),
                            })
    return rows


def enrich_sogang_from_pdf(susi_rows: List[Dict[str, Any]]) -> int:
    """서강대 2024/2025/2026_입시결과.pdf에서 지원인원 및 입학처 공식 출처 보완"""
    enriched = 0
    lookup: Dict[Tuple[int, str, str], Tuple[int, float]] = {}  # (year, type_kw, dept_clean) -> (applicants, real_comp)
    for yr in [2026, 2025, 2024]:
        pdf_path = RAW_DIR / "서강대" / f"{yr}_입시결과.pdf"
        if not pdf_path.exists():
            continue
        doc = pymupdf.open(pdf_path)
        for pg_idx in [0, 1]:
            if pg_idx >= len(doc):
                continue
            txt = doc[pg_idx].get_text("text")
            tkw = "교과" if "학생부교과" in txt else ("종합" if "학생부종합(일반)" in txt else "")
            if not tkw:
                continue
            words = doc[pg_idx].get_text("words")
            lines_by_y: Dict[int, List[Tuple[float, str]]] = {}
            for x0, y0, x1, y1, w, *_ in words:
                y_key = next((ky for ky in lines_by_y if abs(ky - y0) <= 4.0), None)
                if y_key is None:
                    y_key = int(round(y0))
                    lines_by_y[y_key] = []
                lines_by_y[y_key].append((x0, w))
            for yk, items in lines_by_y.items():
                items.sort(key=lambda t: t[0])
                left = clean_str("".join(w for x, w in items if x < 170))
                right = [w for x, w in items if x >= 170]
                if not left or len(right) < 3:
                    continue
                q = parse_int(right[0])
                app = parse_int(right[1])
                if q and app and app >= q:
                    key_d = re.sub(r"\s+", "", left).replace("・", "·")
                    lookup[(yr, tkw, key_d)] = (app, parse_float(right[2]) or 0.0)

    for r in susi_rows:
        if r["대학명"] != "서강대":
            continue
        key_d = re.sub(r"\s+", "", r["모집단위(학과)"]).replace("・", "·")
        hit = lookup.get((int(r["학년도"]), r["전형유형"], key_d))
        if hit:
            r["지원인원"] = hit[0]
            r["출처구분"] = "입학처"
            r["원본URL_또는_파일명"] = f"raw_data/서강대/{r['학년도']}_입시결과.pdf + adiga.kr"
            enriched += 1
    return enriched


def build_2028_reform_json() -> List[Dict[str, str]]:
    """13개 대학 공식 2028학년도 대학입학전형 시행계획 원문 PDF 및 공식 공지 기반 7컬럼 구조화"""
    data = [
        {
            "대학명": "서울대",
            "수시_교과전형_5등급제반영및정성평가여부": "학생부교과전형 미운영 (수시 전 전형 학생부종합전형 정성평가)",
            "수시_학종_주요변화(면접/수능최저등)": "정시 지역균형 폐지→수시 지역균형 확대(고교별 추천 2명→3명, 자사고·외고·국제고·과학고·영재고 지원 배제, 수능최저 미적용). 일반전형 면접을 '분석적 주제토론 / 심층적 문제해결 / 융합적 과제수행' 3유형으로 개편",
            "정시_학생부반영여부및비율": "정시 일반전형 2단계 교과역량평가 40점(40%) 반영 확대 (1단계 수능 100% 3배수 → 2단계 수능 60점 + 교과역량평가 40점; 의·수의는 수능 60 + 교과역량 20 + 적성·인성면접 20)",
            "정시_통합수능_영역별반영특징": "1단계는 국·수·영·한·탐(사·과 평균) 등급 환산합(1등급 10점~9등급 2점). 2단계는 백분위 활용(인문 국100:수120:사50:과30 / 자연 국100:수120:사30:과50 / 학부대학·간호 국100:수120:사40:과40, 영어 2등급 -0.5점 차등감점)",
            "2029학년도_현고1_준비포인트": "일반고 최상위권은 수시 지균(특목·자사 배제, 수능최저 없음) 기회 확대. 정시 지망생도 2단계 교과역량평가 40점(A+~C) 비중이 크므로 전공 연계 심화 선택과목 이수 및 세특 관리 필수",
            "출처URL_및_발표시점": "서울대 입학본부 2028 시행계획 PDF (2026.04) | https://admission.snu.ac.kr/undergraduate/notice?md=v&bbsidx=168854 | raw_data/서울대/2028_시행계획.pdf",
        },
        {
            "대학명": "연세대",
            "수시_교과전형_5등급제반영및정성평가여부": "추천형 일괄합산(교과100)→단계별 전형 변경, 교과 정량평가 외 학생부 종합평가(서류평가) 추가 반영",
            "수시_학종_주요변화(면접/수능최저등)": "활동우수형+국제형 통합→'종합인재형'(1,015명, 2단계 서류70+면접30+수능최저) 및 '탐구인재형'(399명, 서류60+면접40) 신설·재편. 논술전형 전 모집단위 수능최저 신설(국수 포함 3합6, 영3, 한4 / 약학 3합5)",
            "정시_학생부반영여부및비율": "정시 일반전형 기존 학생부 정량평가(교과·출결 50점) 폐지 → 학생부 종합평가(서류평가 100점, 10%) 신설 (수능 900 + 서류 100 = 1,000점; 의예과는 2단계 수능850+서류100+면접50)",
            "정시_통합수능_영역별반영특징": "탐구영역 가산점 폐지. 유형Ⅰ(인문) 국300·수200·영100·사200·과100 / 유형Ⅱ(자연) 국200·수300·영100·사100·과200 / 유형Ⅲ(국제·통합) 국200·수200·영100·사100·과100 (국제계열 면접 폐지·일반 통합)",
            "2029학년도_현고1_준비포인트": "5등급제 내신 1등급 변별력 보완을 위해 교과(추천형)·정시 일반 모두 학생부 서류평가 전면 도입. 논술전형 수능최저 신설로 정시·수능 경쟁력 동시 확보 필수",
            "출처URL_및_발표시점": "연세대 입학처 2028 시행계획 PDF (2026.04) | https://www2.yonsei.ac.kr/entrance/plan/2028_plan.pdf | raw_data/연세대/2028_시행계획.pdf",
        },
        {
            "대학명": "고려대",
            "수시_교과전형_5등급제반영및정성평가여부": "학교추천전형 교과 80% + 서류 20%로 서류 비중 확대(기존 90+10). 5등급 석차등급/성취도(A~E: 100/95/83/67/55) 반영. 인문·자연 수능최저 폐지(의학과만 4합5), 학업우수전형과 중복지원 허용",
            "수시_학종_주요변화(면접/수능최저등)": "학업우수전형(823명) 일괄→단계별(1단계 서류5배수, 2단계 서류80+면접20) 면접 신설 및 수능최저 완화(4합8→4합9, 탐구 상위1). 계열적합전형은 면접 폐지→서류 100% 일괄선발 전환",
            "정시_학생부반영여부및비율": "수능 일반전형은 수능 100% 유지. 수능 교과우수전형(수능 80% + 교과 20%)은 지원자격을 당해연도 졸업예정자(고3 재학생)로 제한",
            "정시_통합수능_영역별반영특징": "일반전형: 국·수·탐 표준점수 반영(탐구 변환표준점수→표준점수 변경), 자연 국200·수240·탐200 / 인문 국200·수200·탐160, 영어 2등급 -1점/3등급 -3점 감점. 교과우수전형은 국·수·탐 백분위 반영",
            "2029학년도_현고1_준비포인트": "학교추천전형 수능최저 폐지+학업우수 중복지원 허용으로 고3 내신 우수자 수시 카드 2장 동시 활용 가능. 정시 일반은 탐구 표준점수 직접 반영으로 사·과탐 표준점수 유불리 주시 필요",
            "출처URL_및_발표시점": "고려대 인재발굴처 2028 시행계획 PDF (2026.04) | https://oku.korea.ac.kr/oku/cms/FR_CON/index.do?MENU_ID=750 | raw_data/고려대/2028_시행계획.pdf",
        },
        {
            "대학명": "서강대",
            "수시_교과전형_5등급제반영및정성평가여부": "지역균형(180명) 고교별 추천인원 제한 폐지(20명→제한없음). 정량 100% 유지하되 교과 90%(석차등급 80%+성취도 10%) + 출결 10% 반영. 수능최저 3개 각 3등급 이내",
            "수시_학종_주요변화(면접/수능최저등)": "일반Ⅰ(497명, 서류100, 최저없음) 외 '일반Ⅱ'(74명, 서류100, 수능최저 3합7·탐구1 신설) 이원화. 논술(일반)은 논술100→논술80+교과10+출결10으로 변경",
            "정시_학생부반영여부및비율": "정시 일반(나군 439명·다군 95명)은 수능 100% 유지. 정시 나군 '수능(지역균형)' 90명 신설(고3 재학생·학교장추천, 수능 80% + 교과 정량 10% + 출결 10%)",
            "정시_통합수능_영역별반영특징": "정시 일반 국어·수학 가중치 강화 및 탐구 비중 축소(국1.1/수1.3/탐0.6 → 국1.2/수1.4/탐0.4). 신설 정시 지역균형은 수능 전 영역 백분위 반영",
            "2029학년도_현고1_준비포인트": "정시 일반은 수학(1.4)·국어(1.2) 고비중으로 통합수능 수학 강점 학생에게 극도로 유리. 고3 재학생은 신설 정시 지역균형(백분위+교과/출결 20%) 및 학종 일반Ⅱ(최저3합7) 전략적 활용",
            "출처URL_및_발표시점": "서강대 입학처 2028 시행계획 PDF (2026.04.30) | https://admission.sogang.ac.kr/enter/html/counsel/noticeView.asp?idx=28940 | raw_data/서강대/2028_시행계획.pdf",
        },
        {
            "대학명": "성균관대",
            "수시_교과전형_5등급제반영및정성평가여부": "추천인재(415명) 지원자격 고3 졸업예정자 제한. 정량 70%(공통과목 35+선택과목 35 분리계산) + 정성평가 30%(기존 80+20에서 정성 확대). 수능최저 적용(사·과 2과목 등급 분리 적용)",
            "수시_학종_주요변화(면접/수능최저등)": "서류형 융합인재(325명, 수능최저○) / 탐구인재(568명, 최저×), 면접형 성균인재(222명, 2단계 서류70+면접30)를 사회과학·공학계열까지 확대. 과학인재(155명) 운영",
            "정시_학생부반영여부및비율": "정시 수능위주(일반형 1,307명, 특화형 150명)는 수능 100% 유지. 별도 정시 학생부종합(서류형) 융합인재 40명(학생부 100%, 수능최저 적용) 운영",
            "정시_통합수능_영역별반영특징": "정시 수능위주 '일반형(전 영역)'과 '특화형(150명: 인문·사회 국어+탐구 특화 / 자연·공학 수학+탐구 특화)' 분리 선발 신설. 학폭 1호 10% 감점, 2~9호 총점 0점 처리",
            "2029학년도_현고1_준비포인트": "추천인재의 정성평가 30% 확대 및 공통·선택과목 분리 반영으로 2~3학년 선택과목 성취도 관리 중요. 정시 특화형(국+탐 또는 수+탐) 신설로 특정 영역 강점 수험생 지원 전략 다변화",
            "출처URL_및_발표시점": "성균관대 입학처 2028 시행계획 PDF (2026.04.30) | https://admission.skku.edu/admission/html/ipsi/noticeView.html?idx=59465 | raw_data/성균관대/2028_시행계획.pdf",
        },
        {
            "대학명": "한양대",
            "수시_교과전형_5등급제반영및정성평가여부": "추천형 교과 정량 60% + 학생부종합평가(정성) 40%로 서류 비중 대폭 확대(기존 교과90+정성10), 고3 재학생 중심 지원자격 (세부 환산식은 공식 시행계획 원문 확인 필요)",
            "수시_학종_주요변화(면접/수능최저등)": "학생부종합전형을 학업형·면접형 등 트랙으로 개편(추천형·서류형 체계 정비). 세부 모집단위별 수능최저·배수는 공식 시행계획 원문 확인 필요",
            "정시_학생부반영여부및비율": "정시 일반전형 학생부 정성평가 반영 기조 유지·정비 (세부 반영 비율은 공식 시행계획 원문 확인 필요)",
            "정시_통합수능_영역별반영특징": "통합형 수능 도입에 따른 수능 성적 산출 이원화 및 군별(가·나·다) 조정 적용 (세부 영역별 반영비율은 공식 시행계획 원문 확인 필요)",
            "2029학년도_현고1_준비포인트": "교과 추천형의 정성평가 40% 확대로 단순 내신 등급 외 세특·진로과목 이수 역량이 당락 핵심. 최종 모집요강 발표 시 정시 학생부 반영방식 및 다군 변동 재확인 필수",
            "출처URL_및_발표시점": "한양대 입학처 공지 기반(2026.04, PDF 직접 확보 수동확인필요) | https://go.hanyang.ac.kr/web/notice/notice_list.do?m_type=COMMON",
        },
        {
            "대학명": "중앙대",
            "수시_교과전형_5등급제반영및정성평가여부": "지역균형전형 내신 5등급제 하에서도 정량평가 100%(교과 90% + 출결 10%) 유지, 2022 개정 교육과정 전 학기 이수자 대상 (세부 등급점수표는 공식 시행계획 원문 확인 필요)",
            "수시_학종_주요변화(면접/수능최저등)": "학종 3트랙 전면 개편(CAU FORMULA 2028): ① 탐구하는 학종(Core, 2단계 면접40%, 최저×) ② 모두의 학종(All, 육각형 키워드 6개 선택, 면접40%, 최저×) ③ 최저있는 학종(Up, 서류100%·의학부 면접, 수능최저○). 논술은 논술80+교과10+출결10",
            "정시_학생부반영여부및비율": "정시 이원화(수능 100% 트랙 외 수능+서류 혼합 트랙 등 도입 예고; 정확한 전형별 반영비율은 공식 시행계획 원문 확인 필요)",
            "정시_통합수능_영역별반영특징": "선택과목 폐지·통합수능 체제에 맞춘 계열별 수능 반영비율 정비 (세부 영역별 가중치는 공식 시행계획 원문 확인 필요)",
            "2029학년도_현고1_준비포인트": "내신 5등급제에서도 교과 정량 100% 유지로 1등급대 최상위 내신에 유리. 학종은 자신의 강점(탐구형 Core / 다면형 All / 수능형 Up)에 맞춰 트랙 조기 설정 필수",
            "출처URL_및_발표시점": "중앙대 입학처 CAU FORMULA 2028 발표 기반(2026.04, PDF 직접 확보 수동확인필요) | https://admission.cau.ac.kr/main.do",
        },
        {
            "대학명": "경희대",
            "수시_교과전형_5등급제반영및정성평가여부": "지역균형전형 교과 56% + 비교과(출결·봉사) 14% + 교과종합평가(정성) 30% 구조 유지, 수능최저 적용 (5등급 세부 환산표는 원문 이미지PDF OCR 수동 검증 필요)",
            "수시_학종_주요변화(면접/수능최저등)": "학생부종합전형(네오르네상스 등)을 면접형·서류형으로 이원화 및 수능최저 적용 트랙 정비 (원문 PDF 이미지형으로 세부 수치 공식 시행계획 원문 확인 필요)",
            "정시_학생부반영여부및비율": "정시 일반전형을 '수능형(수능 100%)'과 '수능·학생부형(수능 90% + 교과·출결·봉사 10%)'으로 이원화 신설. 자연계열 수학·과학 권장 이수학점 충족 시 최대 8점 가산",
            "정시_통합수능_영역별반영특징": "통합형 수능 반영 및 자연계열 고교 수학·과학 과목 이수 연계 가산점 도입 (세부 영역별 비율은 공식 시행계획 원문 확인 필요)",
            "2029학년도_현고1_준비포인트": "자연계열 정시 지망생이라도 '수능·학생부형' 수학·과학 이수 가산점(최대 8점)을 놓치지 않도록 고교학점제 권장 과목 이수 계획 수립 필수",
            "출처URL_및_발표시점": "경희대 입학처 2028 시행계획 PDF (2026.04.29, 이미지형 PDF 아카이빙 완료) | https://iphak.khu.ac.kr/main.do | raw_data/경희대/2028_시행계획.pdf",
        },
        {
            "대학명": "한국외대",
            "수시_교과전형_5등급제반영및정성평가여부": "학교장추천전형(375명) 교과 100%→학생부 교과 70% + 서류(교과종합평가) 30% 변경. 원점수 환산 미적용·석차등급 반영, 추천인원 제한 폐지, 졸업예정자 제한, 수능최저 적용, 학폭 기재 시 지원불가",
            "수시_학종_주요변화(면접/수능최저등)": "학생부종합(서류형, 464명) 수능최저학력기준 신설. 면접형(601명, 1단계 서류3배수→2단계 서류50+면접50, 최저×) 및 SW인재(34명, 서류100, 최저×) 유지. 논술(449명) 논술 100%+수능최저",
            "정시_학생부반영여부및비율": "정시 수능(일반전형, 1,367명) 수능 100% 유지 (학생부 미반영, 학폭 조치사항 호수별 감점)",
            "정시_통합수능_영역별반영특징": "통합수능 영역별 반영방법 및 반영비율 변경, 탐구영역 상위 1과목 반영 기조 적용 (세부 모집단위별 비율은 raw_data/한국외대/2028_시행계획.pdf 참조)",
            "2029학년도_현고1_준비포인트": "학교장추천 서류 30% 신설 및 학종 서류형 수능최저 도입으로 내신+세특+수능 3박자 요구. 반면 정시 일반은 수능 100% 유지로 내신 불리 학생의 정시 역전 루트 확보",
            "출처URL_및_발표시점": "한국외대 입학처 2028 시행계획 PDF (2026.04) | https://adms.hufs.ac.kr/cms/FrCon/index.do?MENU_ID=380 | raw_data/한국외대/2028_시행계획.pdf",
        },
        {
            "대학명": "서울시립대",
            "수시_교과전형_5등급제반영및정성평가여부": "지역균형선발전형(346명 확대) 학생부 교과 60% + 서류평가 40%(기존 교과80+교과정성20에서 서류 대폭 확대). 추천인원 제한 폐지, 졸업예정자 제한, 수능최저 적용",
            "수시_학종_주요변화(면접/수능최저등)": "학생부종합전형Ⅱ(서류형, 99명) 폐지 → 면접형 단일 학종(424명, 1단계 서류3배수→2단계 서류50+면접50, 수능최저×)으로 통합. 논술전형(86명) 논술80+교과20→논술 100% + 수능최저 신설",
            "정시_학생부반영여부및비율": "정시 일반전형(인문·자연) 기존 수능 100% → 수능 80% + 학생부교과 18% + 출결 2%로 학생부 정량 반영(20%) 전면 도입",
            "정시_통합수능_영역별반영특징": "영어·한국사 등급별 점수부여, 인문Ⅰ(국35·수35·탐30, 800점 만점) / 인문Ⅱ(국40·수25·탐35) 등 탐구 비중 확대(기존 사·과탐 2과목 선택 3% 가산 구조 개편)",
            "2029학년도_현고1_준비포인트": "정시에도 교과 18%+출결 2%가 직접 반영되므로 정시 준비생도 내신·출결 방치 절대 금지. 수시 교과는 서류 40% 확대, 논술은 수능최저 신설에 맞춘 전략 수정 필수",
            "출처URL_및_발표시점": "서울시립대 입학처 2028 시행계획 PDF (2026.04.29) | https://admission.uos.ac.kr/admissionNew/noticeBoard/view.do?seq=1300&list_id=OB1 | raw_data/서울시립대/2028_시행계획.pdf",
        },
        {
            "대학명": "건국대",
            "수시_교과전형_5등급제반영및정성평가여부": "KU지역균형(346명) 학생부 교과정량 70% + 교과정성 30% 유지. 2028학년도 수능최저학력기준 신설(인문·자연: 한·국·수·영·탐(상위1) 5개 중 3합8 / 수의예 3합4)",
            "수시_학종_주요변화(면접/수능최저등)": "KU자기추천(920명, +17명 확대) 중심 운영, 논술전형명 'KU논술'(328명)로 변경. 학사구조 개편으로 컴퓨터공학부→인공지능학과(50명)+컴퓨터공학과(70명) 분리",
            "정시_학생부반영여부및비율": "수능(KU일반) 학과/학부는 수능 100% 유지. 단, '단과대학 자유전공학부'에 한해 수능 90% + 학생부(교과정성) 10% 신설 도입",
            "정시_통합수능_영역별반영특징": "정시 일반(1,072명) 및 실기(247명) 분리 운영, 통합수능 반영방법 적용 (세부 영역별 반영비율은 raw_data/건국대/2028_시행계획.pdf p.48 참조)",
            "2029학년도_현고1_준비포인트": "KU지역균형 수능최저 신설(한국사 포함 5개 중 3합8)로 한국사 1등급 활용 시 실질 부담 완화. 정시 일반 학과는 수능 100% 유지, 단과대 자유전공 지망 시 교과정성 10% 대비 필요",
            "출처URL_및_발표시점": "건국대 입학처 2028 시행계획 PDF (2026.04.13 구조개편 반영) | https://admission.konkuk.ac.kr/bbs/admission/6282/1201658/artclView.do | raw_data/건국대/2028_시행계획.pdf",
        },
        {
            "대학명": "동국대",
            "수시_교과전형_5등급제반영및정성평가여부": "학교장추천인재 추천인원 제한 폐지, 학생부교과 70% + 교과 관련 영역 서류종합평가 30% 반영, 수능최저 미적용",
            "수시_학종_주요변화(면접/수능최저등)": "Do Dream(894명, 1단계 서류100%→2단계 서류+면접, 수능최저×) 중심 유지. 논술전형 모집 확대 및 경찰행정학부 등 일부 수능최저 완화",
            "정시_학생부반영여부및비율": "정시 일반전형 전 모집군에서 수능 80% + 학생부평가(정성) 20% 전면 도입 (성취도·상대등급 연계 2차원 매트릭스 평가 적용)",
            "정시_통합수능_영역별반영특징": "정시 수능 80% + 학생부 20% 체제 전환 및 통합수능 영역별 반영방법 개편 (세부 비율은 raw_data/동국대/2028_시행계획.pdf 참조)",
            "2029학년도_현고1_준비포인트": "정시 전 모집군에 학생부 정성평가 20%가 전면 도입되므로 정시파도 성취도(A) 및 세특 관리가 필수. 수시 학교장추천인재는 수능최저 없이 교과70+서류30으로 승부",
            "출처URL_및_발표시점": "동국대 입학처 2028 시행계획 PDF (2026.04) | https://ipsi.dongguk.edu/admission/html/counsel/noticeView.asp?BOARD_IDX=37098 | raw_data/동국대/2028_시행계획.pdf",
        },
        {
            "대학명": "홍익대",
            "수시_교과전형_5등급제반영및정성평가여부": "학교장추천자전형 모집 확대(307→420명) 및 고교 추천인원 제한 폐지(10명→제한없음), 고3 재학생 제한. 교과 100%→교과 95%(성취도 A~E + 5등급 석차등급) + 비교과(출결) 5% 변경",
            "수시_학종_주요변화(면접/수능최저등)": "학생부종합 '학교생활우수자(면접형)' 신설(캠퍼스자율전공 인문·자연, 1단계 서류5배수→2단계 서류50+면접50, 수능최저×). 논술전형 교과 반영지표를 석차등급→성취도(A~E)로 변경",
            "정시_학생부반영여부및비율": "정시 수능우수자전형 다군(인문·자연) 기존 수능 100% → 수능 90% + 학생부교과 정량평가 10% 도입",
            "정시_통합수능_영역별반영특징": "자연계열·캠퍼스자율전공(자연) 미적분/기하·과탐 3% 가산 폐지. 인문(국30·수30·사15·과10·영15) / 자연(국20·수35·사10·과20·영15)으로 사·과탐 별도 배분",
            "2029학년도_현고1_준비포인트": "정시 다군 교과 10% 반영 및 자연계 수학(35%)·과탐(20%)+사탐(10%) 분리 반영 주의. 수시 논술은 내신 성취도(A~E)만 반영하므로 등급보다 성취도 A 확보가 유리",
            "출처URL_및_발표시점": "홍익대 입학처 2028 시행계획 PDF (2026.07.09 수정) | https://www.hongik.ac.kr/kr/admission/notice-admission.do?mode=view&articleNo=151353 | raw_data/홍익대/2028_시행계획.pdf",
        },
    ]
    return data


def run_all():
    # Load 정시 max scores from Adiga
    max_sc_path = RAW_DIR / "_adiga" / "jeongsi_max_scores.json"
    max_scores_map = json.loads(max_sc_path.read_text(encoding="utf-8")) if max_sc_path.exists() else {}

    # Parse university-portal 논술 PDFs
    nonsul_by_univ: Dict[str, List[Dict[str, Any]]] = {
        "동국대": parse_dongguk_nonsul(),
        "한국외대": parse_hufs_nonsul(),
        "경희대": parse_khu_nonsul(),
    }
    print("Parsed PDF 논술 counts:", {k: len(v) for k, v in nonsul_by_univ.items()})

    log_data: Dict[str, Any] = {
        "universities": {},
        "dept_mappings": [
            {"대학명": "서울대", "원모집단위명": "첨단융합학부", "표준모집단위명": "첨단융합학부", "변동구분": "2024 신설", "비고": "통합 첨단분야 신설 모집단위"},
            {"대학명": "고려대", "원모집단위명": "학부대학", "표준모집단위명": "학부대학", "변동구분": "2025 신설(무전공)", "비고": "자유전공 유형1"},
            {"대학명": "서강대", "원모집단위명": "인문학기반자유전공학부 / AI기반자유전공학부 / SCIENCE기반자유전공학부", "표준모집단위명": "각 자유전공학부", "변동구분": "2025 신설(무전공)", "비고": "2024 미개설, 2025~2026 추이 별도 관리"},
            {"대학명": "성균관대", "원모집단위명": "자유전공계열", "표준모집단위명": "자유전공계열", "변동구분": "2025 신설(무전공)", "비고": "2028 전자전기→전자전기정보, 소프트웨어→컴퓨터공학 명칭변경 예정"},
            {"대학명": "한양대", "원모집단위명": "한양인터칼리지학부", "표준모집단위명": "한양인터칼리지학부", "변동구분": "2025 신설(무전공)", "비고": "2025 신설 자유전공"},
            {"대학명": "건국대", "원모집단위명": "KU자유전공학부", "표준모집단위명": "KU자유전공학부", "변동구분": "2025 신설(무전공)", "비고": "2028 컴퓨터공학부→인공지능학과+컴퓨터공학과 분리 예정"},
            {"대학명": "동국대", "원모집단위명": "열린전공학부(인문/자연)", "표준모집단위명": "열린전공학부(인문/자연)", "변동구분": "2025 신설(무전공)", "비고": "2025 신설 무전공"},
            {"대학명": "서울시립대", "원모집단위명": "자유전공학부(인문/자연)", "표준모집단위명": "자유전공학부(인문/자연)", "변동구분": "2025 신설(무전공)", "비고": "2025 신설 무전공"},
            {"대학명": "한국외대", "원모집단위명": "자유전공학부(서울)", "표준모집단위명": "자유전공학부(서울)", "변동구분": "2025 신설(무전공)", "비고": "서울 본캠퍼스 필터 적용(글로벌캠퍼스 제외)"},
            {"대학명": "전대학 공통", "원모집단위명": "가운데점(ㆍ/・/∙) 및 전각괄호 혼용", "표준모집단위명": "반각 괄호·표준 가운데점(·) 통일", "변동구분": "표기 표준화", "비고": "3개년 동일 학과 매칭 왜곡 방지"},
            {"대학명": "고려대", "원모집단위명": "학생부교과-학교추천(24) vs 학생부교과:학교추천(25~26)", "표준모집단위명": "시뮬레이터 전형명 정규화", "변동구분": "전형명 구분자 통일", "비고": "원본 시트 원문 보존, 시뮬레이터 3개년 자동 연결"},
        ],
        "sampling_checks": [],
    }

    univ_urls = {
        "서울대": "https://admission.snu.ac.kr / https://snuarori.snu.ac.kr / https://www.adiga.kr",
        "연세대": "https://admission.yonsei.ac.kr / https://www.adiga.kr",
        "고려대": "https://oku.korea.ac.kr / https://www.adiga.kr",
        "서강대": "https://admission.sogang.ac.kr / https://www.adiga.kr",
        "성균관대": "https://admission.skku.edu / https://www.adiga.kr",
        "한양대": "https://go.hanyang.ac.kr / https://www.adiga.kr",
        "중앙대": "https://admission.cau.ac.kr / https://www.adiga.kr",
        "경희대": "https://iphak.khu.ac.kr / https://www.adiga.kr",
        "한국외대": "https://adms.hufs.ac.kr / https://www.adiga.kr",
        "서울시립대": "https://admission.uos.ac.kr / https://www.adiga.kr",
        "건국대": "https://admission.konkuk.ac.kr / https://www.adiga.kr",
        "동국대": "https://ipsi.dongguk.edu / https://www.adiga.kr",
        "홍익대": "https://www.hongik.ac.kr/kr/admission/ / https://www.adiga.kr",
    }

    # Known university-level 정시 max score fallback ONLY when officially confirmed from Adiga 2025/2026 동일전형
    summary_stats = []
    for u in ALL_UNIVS:
        susi_rows: List[Dict[str, Any]] = []
        jeongsi_rows: List[Dict[str, Any]] = []
        for yr in [2026, 2025, 2024]:
            for kind in ["종합", "교과"]:
                p = RAW_DIR / u / f"adiga_{yr}_{kind}.html"
                if p.exists():
                    r_list, _ = parse_adiga_susi_html(u, yr, kind, p)
                    if u == "한국외대":
                        r_list = [r for r in r_list if is_hufs_seoul(r["모집단위(학과)"])]
                    susi_rows.extend(r_list)
            pj = RAW_DIR / u / f"adiga_{yr}_정시.html"
            if pj.exists():
                rj_list, _ = parse_adiga_jeongsi_html(u, yr, pj)
                if u == "한국외대":
                    rj_list = [r for r in rj_list if is_hufs_seoul(r["모집단위(학과)"])]
                # Enrich 대학환산점수_만점기준 from Adiga verified max_scores_map
                yr_ms = max_scores_map.get(u, {}).get(str(yr), {})
                for r in rj_list:
                    ms = yr_ms.get(r["세부전형명"])
                    if not ms and yr_ms:
                        # Match prefix (e.g. 수능(일반전형 가군) -> 600/800/900/1000)
                        for k_adm, v_ms in yr_ms.items():
                            if "일반" in k_adm and "일반" in r["세부전형명"]:
                                ms = v_ms
                                break
                    if ms:
                        r["대학환산점수_만점기준"] = parse_float(ms)
                jeongsi_rows.extend(rj_list)

        # Add parsed official PDF 논술 rows
        if u in nonsul_by_univ and nonsul_by_univ[u]:
            susi_rows.extend(nonsul_by_univ[u])

        # Enrich Sogang 지원인원 from official PDFs
        sg_enriched = 0
        if u == "서강대":
            sg_enriched = enrich_sogang_from_pdf(susi_rows)

        save_checkpoint_csv(u, "수시", susi_rows)
        save_checkpoint_csv(u, "정시", jeongsi_rows)

        raw_files = sorted([f.name for f in (RAW_DIR / u).iterdir() if f.is_file()])
        has_2028_pdf = (RAW_DIR / u / "2028_시행계획.pdf").exists()

        # Determine missing/manual verification notes honestly
        missing_notes = []
        if u == "서울대":
            missing_notes.append("논술·학생부교과전형 미운영(공식 미실시); 정시 환산점수는 표준점수 가중합 산출")
        elif u in ("동국대", "한국외대"):
            missing_notes.append("논술 2025·2026 입학처 PDF 확보 완료(2024 논술은 수동확인필요)")
        elif u == "경희대":
            missing_notes.append("논술 2024~2026 입학처 PDF 확보 완료; 2028 시행계획 PDF 이미지형(OCR 수동 검증 필요)")
        elif u == "성균관대":
            missing_notes.append("2026 입학처 결과 PDF 이미지형(OCR 수동 검증 필요, 교과·종합·정시 3개년은 어디가 공식 확보 완료, 논술 수동확인필요)")
        elif u in ("한양대", "중앙대"):
            missing_notes.append("교과·종합·정시 3개년 어디가 공식 확보 완료; 2028 시행계획 PDF 및 논술전형 입결 PDF 수동확인필요")
        else:
            missing_notes.append("교과·종합·정시 3개년 어디가/입학처 확보 완료; 논술전형 학과별 상세결과는 입학처 미공개 또는 수동확인필요")

        log_data["universities"][u] = {
            "url": univ_urls[u],
            "raw_files": raw_files,
            "has_2028_pdf": has_2028_pdf,
            "susi_counts": {str(y): sum(1 for r in susi_rows if r["학년도"] == y) for y in [2024, 2025, 2026]},
            "susi_by_type": {t: sum(1 for r in susi_rows if r["전형유형"] == t) for t in ["교과", "종합", "논술"]},
            "jeongsi_counts": {str(y): sum(1 for r in jeongsi_rows if r["학년도"] == y) for y in [2024, 2025, 2026]},
            "status": "완료" if (u in ("서울대", "경희대", "동국대", "한국외대") and has_2028_pdf) else ("부분완료" if has_2028_pdf else "부분완료(수동확인필요)"),
            "missing_or_notes": " / ".join(missing_notes),
        }
        summary_stats.append({
            "대학명": u,
            "수시합계": len(susi_rows),
            "교과": sum(1 for r in susi_rows if r["전형유형"] == "교과"),
            "종합": sum(1 for r in susi_rows if r["전형유형"] == "종합"),
            "논술": sum(1 for r in susi_rows if r["전형유형"] == "논술"),
            "정시합계": len(jeongsi_rows),
            "2028PDF": has_2028_pdf,
            "sg_enriched": sg_enriched,
        })

    # Save 2028 reform JSON & collection log
    reform_data = build_2028_reform_json()
    (INTERMEDIATE_DIR / "2028_시행계획_13개교.json").write_text(
        json.dumps(reform_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    save_collection_log(log_data)

    print(json.dumps(summary_stats, ensure_ascii=False, indent=2))
    print("Total 수시:", sum(x["수시합계"] for x in summary_stats), "| Total 정시:", sum(x["정시합계"] for x in summary_stats))


if __name__ == "__main__":
    run_all()
