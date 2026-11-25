# -*- coding: utf-8 -*-
"""
어디가(adiga.kr) 원천 HTML 파서 (2024~2026학년도 13개 대학 수시/정시 표준화)
"""
from __future__ import annotations
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple
from lxml import html as lxml_html

from schema_utils import (
    ALL_UNIVS, RAW_DIR, clean_str, parse_int, parse_float,
    infer_track, normalize_dept, save_checkpoint_csv
)

# 정원외 / 특수자격 전형 제외 필터 (정원 내 일반 수시·정시 중심)
EXCLUDE_ADMISSION_KEYWORDS = [
    "농어촌", "기초생활", "차상위", "한부모", "특성화고", "재직자", "서해5도",
    "특수교육", "장애인", "만학도", "기회균형", "고른기회", "사회배려",
    "국가보훈", "보훈", "다문화", "북한이탈", "자립지원", "저소득",
    "재외국민", "외국인", "특기자", "체육특기", "실기우수", "연기", "연출",
    "성인학습자", "군위탁", "계약학과(재직)", "고교졸업예정자외", "사회통합",
    "사회적배려", "기회균등", "배려대상", "다자녀", "아동복지", "조기취업",
    "특성화고졸", "평생학습", "글로벌인재", "국제학부(외국인)", "전교육과정",
    "기회배려", "고교연계(특성화)", "사회기여자", "가톨릭지도자", "종교지도자",
    "불교추천", "목회자", "선교사",
    "이웃사랑", "서강가치", "사회공헌통합", "해외고", "검정고시",
]

# 예외: 정원 내 일반 전형인데 위 키워드가 일부 겹칠 수 있는 경우 방어
FORCE_INCLUDE_KEYWORDS = [
    "지역균형", "학교추천", "학교장추천", "추천형", "일반전형", "학업우수",
    "계열적합", "활동우수", "국제형", "학생부교과", "학생부종합", "네오르네상스",
    "다빈치", "탐구형", "융합형", "CAUT", "KU자기추천", "Do Dream", "두드림",
    "서류형", "면접형", "성균인재", "과학인재", "탐구인재", "융합인재", "학교생활우수",
    "학생부우수", "수능(일반", "수능위주", "가군", "나군", "다군",
]

# 분교/타캠퍼스 명시 학과 제외 (경희대 국제캠, 중앙대 본교 통합분은 포함)
BRANCH_CAMPUS_EXCLUDE = {
    "연세대": ["미래캠퍼스", "[미래]", "(미래)", "원주"],
    "고려대": ["세종캠퍼스", "[세종]", "(세종)"],
    "한양대": ["ERICA", "에리카", "[안산]"],
    "건국대": ["글로컬", "[충주]"],
    "동국대": ["WISE", "와이즈", "경주"],
    "홍익대": ["세종캠퍼스", "[세종]", "(세종)"],
    "한국외대": ["글로벌캠퍼스", "[글로벌]", "(글로벌)", "용인"],
}


def is_excluded_admission(univ: str, adm_name: str) -> bool:
    name_clean = re.sub(r"\s+", "", adm_name)
    # 특정 대학 특수 일반전형 예외 처리 (예: 연세대 국제형(국내고)은 정원내 일반, 해외고/국제인재는 제외)
    if univ == "연세대" and "국제형(해외고" in name_clean:
        return True
    if univ == "연세대" and "글로벌인재" in name_clean:
        return True
    if univ == "고려대" and "사이버국방" in name_clean:
        return False
    # Check explicit exclude tokens
    for kw in EXCLUDE_ADMISSION_KEYWORDS:
        if kw in name_clean:
            # 예: "지역균형"에 "기회균형" 안 겹침; "일반전형(기회균형)" 등은 제외
            return True
    return False


def is_branch_dept(univ: str, dept: str) -> bool:
    for kw in BRANCH_CAMPUS_EXCLUDE.get(univ, []):
        if kw in dept:
            return True
    return False


def zero_to_none(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, (int, float)) and val == 0:
        return None
    return val


def parse_adiga_susi_html(univ: str, year: int, kind_label: str, html_path: Path) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    kind_label: '종합' or '교과'
    """
    raw = html_path.read_text(encoding="utf-8", errors="ignore")
    if "<table" not in raw.lower():
        return [], []
    doc = lxml_html.fromstring(raw)
    rows_out: List[Dict[str, Any]] = []
    skipped_adms: List[str] = []

    blocks = doc.xpath('//div[contains(@class, "tbAdmRes")]')
    for blk in blocks:
        h5s = blk.xpath('.//h5/text()')
        adm_name = clean_str(h5s[0]) if h5s else f"학생부{kind_label}"
        if is_excluded_admission(univ, adm_name):
            skipped_adms.append(adm_name)
            continue

        trs = blk.xpath('.//table//tbody/tr')
        for tr in trs:
            tds = [clean_str("".join(td.itertext())) for td in tr.xpath('./td')]
            if len(tds) < 6:
                continue
            gubun = tds[0]
            # 수시 파일 안에 간혹 정시 테이블이 섞여 있는 경우(예: 서울대 정시 일반전형 학생부 평가) 걸러냄
            if gubun.startswith("정시"):
                continue
            dept = tds[1]
            if not dept or is_branch_dept(univ, dept):
                continue

            init_quota = parse_int(tds[2])
            carry_quota = parse_int(tds[3])
            final_quota = parse_int(tds[4])
            quota = zero_to_none(final_quota if final_quota is not None else init_quota)
            comp_rate = zero_to_none(parse_float(tds[5]))
            waitlist = parse_int(tds[6]) if len(tds) > 6 else None

            # 미제출 사유 셀 체크
            note_parts = []
            cut50 = None
            cut70 = None
            if len(tds) <= 8 and len(tds) >= 8 and ("미제출" in tds[7] or "미제공" in tds[7] or "미존재" in tds[7]):
                note_parts.append(tds[7])
            elif len(tds) >= 11:
                # tds[7]: 환산점수 50%, tds[8]: 환산점수 70%, tds[9]: 환산등급 50%, tds[10]: 환산등급 70%
                cut50 = zero_to_none(parse_float(tds[9]))
                cut70 = zero_to_none(parse_float(tds[10]))
                # 가끔 9등급제 범위를 벗어나는 점수(예: 10 초과)가 잘못 들어간 경우 방어
                if cut50 is not None and cut50 > 9.0:
                    note_parts.append(f"환산점수50:{cut50}")
                    cut50 = None
                if cut70 is not None and cut70 > 9.0:
                    note_parts.append(f"환산점수70:{cut70}")
                    cut70 = None
                if cut50 is None and cut70 is None:
                    sc50 = zero_to_none(parse_float(tds[7]))
                    sc70 = zero_to_none(parse_float(tds[8]))
                    if sc50 is not None or sc70 is not None:
                        note_parts.append(f"학생부환산점수(50%:{sc50},70%:{sc70})")

            # 모집인원 0이고 경쟁률도 없고 컷도 없으면 미선발 행이므로 스킵
            if (quota is None or quota == 0) and comp_rate is None and cut50 is None and cut70 is None:
                continue

            std_dept, std_note = normalize_dept(univ, dept)
            if std_note:
                note_parts.append(std_note)
            if carry_quota and carry_quota > 0:
                note_parts.append(f"이월+{carry_quota}")

            # 서울대 지역균형전형은 학생부종합전형
            actual_type = kind_label
            if univ == "서울대" and "지역균형" in adm_name:
                actual_type = "종합"

            track = infer_track(dept, adm_name)

            rows_out.append({
                "학년도": year,
                "대학명": univ,
                "전형유형": actual_type,
                "세부전형명": adm_name,
                "계열": track,
                "모집단위(학과)": dept,
                "표준모집단위명(3개년추적용)": std_dept,
                "모집인원": quota,
                "지원인원": None,  # 어디가 원문에 지원인원 미기재 -> 추정 금지
                "경쟁률": comp_rate,
                "충원합격순위": waitlist,
                "최종등록자_50%컷(9등급)": cut50,
                "최종등록자_70%컷(9등급)": cut70,
                "평균등급": None,
                "최초합격컷": None,
                "출처구분": "어디가",
                "원본URL_또는_파일명": f"raw_data/{univ}/{html_path.name} (adiga.kr)",
                "비고": " | ".join(dict.fromkeys([n for n in note_parts if n])),
            })

    return rows_out, sorted(set(skipped_adms))


def parse_adiga_jeongsi_html(univ: str, year: int, html_path: Path) -> Tuple[List[Dict[str, Any]], List[str]]:
    raw = html_path.read_text(encoding="utf-8", errors="ignore")
    if "<table" not in raw.lower():
        return [], []
    doc = lxml_html.fromstring(raw)
    rows_out: List[Dict[str, Any]] = []
    skipped_adms: List[str] = []

    blocks = doc.xpath('//div[contains(@class, "tbAdmRes")]')
    for blk in blocks:
        h5s = blk.xpath('.//h5/text()')
        adm_name = clean_str(h5s[0]) if h5s else "수능위주"
        if is_excluded_admission(univ, adm_name):
            skipped_adms.append(adm_name)
            continue

        trs = blk.xpath('.//table//tbody/tr')
        for tr in trs:
            tds = [clean_str("".join(td.itertext())) for td in tr.xpath('./td')]
            if len(tds) < 7:
                continue
            gubun = tds[0]
            if not gubun.startswith("정시"):
                continue
            m_gun = re.search(r"([가나다])", gubun)
            gun = m_gun.group(1) if m_gun else ""

            dept = tds[1]
            if not dept or is_branch_dept(univ, dept):
                continue

            init_quota = parse_int(tds[2])
            carry_quota = parse_int(tds[3])
            final_quota = parse_int(tds[4])
            quota = zero_to_none(final_quota if final_quota is not None else init_quota)
            comp_rate = zero_to_none(parse_float(tds[5]))
            waitlist = parse_int(tds[6])
            conv50 = zero_to_none(parse_float(tds[7])) if len(tds) > 7 else None
            conv70 = zero_to_none(parse_float(tds[8])) if len(tds) > 8 else None

            note_parts = []
            pct50 = None
            pct70 = None
            eng_avg = None

            if len(tds) == 10 and ("미제출" in tds[9] or "미제공" in tds[9] or "미존재" in tds[9]):
                note_parts.append(tds[9])
            elif len(tds) >= 31:
                # 50% block: [9]=국, [10]=수, [11..16]=탐1/2, [17]=평균백분위, [18]=한국사, [19]=영어등급
                # 70% block: [20]=국, [21]=수, [22..27]=탐1/2, [28]=평균백분위, [29]=한국사, [30]=영어등급
                pct50 = zero_to_none(parse_float(tds[17]))
                pct70 = zero_to_none(parse_float(tds[28]))
                eng50 = zero_to_none(parse_float(tds[19]))
                eng70 = zero_to_none(parse_float(tds[30]))
                # 영어 평균등급: 70% 또는 50% 컷의 영어등급(원문 표기 기준, 50/70 평균이나 70% 표기)
                if eng50 is not None and eng70 is not None:
                    eng_avg = round((eng50 + eng70) / 2.0, 2) if eng50 != eng70 else eng70
                else:
                    eng_avg = eng70 if eng70 is not None else eng50

            if (quota is None or quota == 0) and comp_rate is None and conv70 is None and pct70 is None:
                continue

            std_dept, std_note = normalize_dept(univ, dept)
            if std_note:
                note_parts.append(std_note)
            if carry_quota and carry_quota > 0:
                note_parts.append(f"이월+{carry_quota}")

            track = infer_track(dept, adm_name)

            rows_out.append({
                "학년도": year,
                "대학명": univ,
                "모집군": gun,
                "세부전형명": adm_name,
                "계열": track,
                "모집단위(학과)": dept,
                "표준모집단위명(3개년추적용)": std_dept,
                "모집인원": quota,
                "지원인원": None,
                "경쟁률": comp_rate,
                "충원합격순위": waitlist,
                "대학환산점수_만점기준": None,  # 1순위 대학 입학처 요강/입결에서 보완
                "대학환산점수_50%컷": conv50,
                "대학환산점수_70%컷": conv70,
                "국수탐_평균백분위_50%컷": pct50,
                "국수탐_평균백분위_70%컷": pct70,
                "영어_평균등급": eng_avg,
                "출처구분": "어디가",
                "원본URL_또는_파일명": f"raw_data/{univ}/{html_path.name} (adiga.kr)",
                "비고": " | ".join(dict.fromkeys([n for n in note_parts if n])),
            })

    return rows_out, sorted(set(skipped_adms))


def parse_university_adiga(univ: str) -> Dict[str, Any]:
    susi_rows: List[Dict[str, Any]] = []
    jeongsi_rows: List[Dict[str, Any]] = []
    skipped: Dict[str, List[str]] = {}

    for year in [2026, 2025, 2024]:
        for kind in ["종합", "교과"]:
            p = RAW_DIR / univ / f"adiga_{year}_{kind}.html"
            if p.exists():
                rows, sk = parse_adiga_susi_html(univ, year, kind, p)
                susi_rows.extend(rows)
                if sk:
                    skipped[f"{year}_{kind}"] = sk
        pj = RAW_DIR / univ / f"adiga_{year}_정시.html"
        if pj.exists():
            rows, sk = parse_adiga_jeongsi_html(univ, year, pj)
            jeongsi_rows.extend(rows)
            if sk:
                skipped[f"{year}_정시"] = sk

    if susi_rows:
        save_checkpoint_csv(univ, "수시", susi_rows)
    if jeongsi_rows:
        save_checkpoint_csv(univ, "정시", jeongsi_rows)

    return {
        "univ": univ,
        "susi_total": len(susi_rows),
        "susi_by_year": {y: sum(1 for r in susi_rows if r["학년도"] == y) for y in [2024, 2025, 2026]},
        "jeongsi_total": len(jeongsi_rows),
        "jeongsi_by_year": {y: sum(1 for r in jeongsi_rows if r["학년도"] == y) for y in [2024, 2025, 2026]},
        "skipped_adms_count": sum(len(v) for v in skipped.values()),
    }


if __name__ == "__main__":
    import sys, json
    targets = sys.argv[1:] if len(sys.argv) > 1 else ALL_UNIVS
    stats = [parse_university_adiga(u) for u in targets]
    print(json.dumps(stats, ensure_ascii=False, indent=2))
