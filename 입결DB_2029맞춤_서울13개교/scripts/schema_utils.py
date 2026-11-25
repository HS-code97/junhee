# -*- coding: utf-8 -*-
"""
서울 주요 13개 대학 3개년 입결 표준 스키마 및 정제 유틸리티
"""
from __future__ import annotations
import csv
import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

BASE_DIR = Path(r"c:/Vibe Coding/23. junhee/입결DB_2029맞춤_서울13개교")
RAW_DIR = BASE_DIR / "raw_data"
INTERMEDIATE_DIR = BASE_DIR / "intermediate"
OUTPUT_DIR = BASE_DIR / "output"

UNIV_BATCH_1 = ["서울대", "연세대", "고려대", "서강대", "성균관대", "한양대"]
UNIV_BATCH_2 = ["중앙대", "경희대", "한국외대", "서울시립대", "건국대", "동국대", "홍익대"]
ALL_UNIVS = UNIV_BATCH_1 + UNIV_BATCH_2

UNIV_FULL_NAMES = {
    "서울대": "서울대학교",
    "연세대": "연세대학교",
    "고려대": "고려대학교",
    "서강대": "서강대학교",
    "성균관대": "성균관대학교",
    "한양대": "한양대학교",
    "중앙대": "중앙대학교",
    "경희대": "경희대학교",
    "한국외대": "한국외국어대학교",
    "서울시립대": "서울시립대학교",
    "건국대": "건국대학교",
    "동국대": "동국대학교",
    "홍익대": "홍익대학교",
}

SUSI_COLUMNS = [
    "학년도",
    "대학명",
    "전형유형",
    "세부전형명",
    "계열",
    "모집단위(학과)",
    "표준모집단위명(3개년추적용)",
    "모집인원",
    "지원인원",
    "경쟁률",
    "충원합격순위",
    "최종등록자_50%컷(9등급)",
    "최종등록자_70%컷(9등급)",
    "평균등급",
    "최초합격컷",
    "출처구분",
    "원본URL_또는_파일명",
    "비고",
]

JEONGSI_COLUMNS = [
    "학년도",
    "대학명",
    "모집군",
    "세부전형명",
    "계열",
    "모집단위(학과)",
    "표준모집단위명(3개년추적용)",
    "모집인원",
    "지원인원",
    "경쟁률",
    "충원합격순위",
    "대학환산점수_만점기준",
    "대학환산점수_50%컷",
    "대학환산점수_70%컷",
    "국수탐_평균백분위_50%컷",
    "국수탐_평균백분위_70%컷",
    "영어_평균등급",
    "출처구분",
    "원본URL_또는_파일명",
    "비고",
]

REFORM_2028_COLUMNS = [
    "대학명",
    "수시_교과전형_5등급제반영및정성평가여부",
    "수시_학종_주요변화(면접/수능최저등)",
    "정시_학생부반영여부및비율",
    "정시_통합수능_영역별반영특징",
    "2029학년도_현고1_준비포인트",
    "출처URL_및_발표시점",
]

MISSING_TOKENS = {
    "", "-", "--", "—", "–", "N/A", "n/a", "NULL", "null", "None", "none",
    "미공개", "비공개", "공식 비공개", "해당없음", "없음", "미산출", "미발표",
    "발표안함", "공개안함", "미제공", "미집계", "*", "·", "."
}


def clean_str(val: Any) -> str:
    if val is None:
        return ""
    s = str(val).replace("\r", " ").replace("\n", " ").replace("\xa0", " ").strip()
    s = re.sub(r"\s+", " ", s)
    return s


def parse_int(val: Any) -> Optional[int]:
    s = clean_str(val)
    if not s or s in MISSING_TOKENS:
        return None
    s = s.replace(",", "").replace("명", "").replace("번", "").replace("위", "").strip()
    m = re.search(r"^-?\d+", s)
    if not m:
        return None
    try:
        return int(m.group(0))
    except ValueError:
        return None


def parse_float(val: Any) -> Optional[float]:
    s = clean_str(val)
    if not s or s in MISSING_TOKENS:
        return None
    # Strip trailing ':1', '%', '점', '등급'
    s = s.replace(",", "").replace(":1", "").replace("%", "").replace("점", "").replace("등급", "").strip()
    m = re.search(r"^-?\d+(?:\.\d+)?", s)
    if not m:
        return None
    try:
        return round(float(m.group(0)), 4)
    except ValueError:
        return None


def infer_susi_type(admission_name: str, raw_type: str = "") -> str:
    t = f"{raw_type} {admission_name}"
    if "논술" in t:
        return "논술"
    if "교과" in t or "학교장추천" in t or "지역균형" in t and "서울대" not in t:
        # 주의: 서울대 지역균형전형은 학생부종합전형!
        if "종합" in t:
            return "종합"
        return "교과"
    if "종합" in t or "학종" in t or "계열적합" in t or "학업우수" in t or "네오르네상스" in t or "다빈치" in t or "탐구형" in t or "KU자기추천" in t or "Do Dream" in t or "두드림" in t:
        return "종합"
    if "추천" in t and "자기추천" not in t:
        return "교과"
    return raw_type.strip() or "기타"


def infer_track(dept: str, college: str = "", raw_track: str = "") -> str:
    combined = f"{raw_track} {college} {dept}"
    free_kw = [
        "자유전공", "무전공", "전공자율", "인터칼리지", "열린전공", "자율전공",
        "창의융합학부", "첨단융합", "글로벌융합학부", "학부대학", "광역",
        "융합전공학부", "KU자유전공", "자연계열(광역)", "인문계열(광역)",
        "사회과학계열", "인문과학계열", "공학계열", "자연과학계열",
    ]
    if any(k in dept for k in ["자유전공", "무전공", "인터칼리지", "열린전공", "자율전공", "학부대학", "KU자유전공", "전공자율", "캠퍼스자율전공"]):
        return "자유전공"
    if "예체능" in raw_track or any(k in combined for k in [
        "미술", "음악", "성악", "작곡", "기악", "국악", "디자인", "조소", "회화", "공예",
        "체육", "스포츠", "무용", "연극", "영화", "연기", "방송영상", "실용음악", "도예", "섬유미술", "판화", "시각디자인", "산업디자인", "예술"
    ]):
        if not any(ex in dept for ex in ["예술경영", "문화예술경영", "고고미술사", "미술사", "예술학", "미술이론"]):
            return "예체능"
    if "(인문)" in dept or "인문계" in dept or "인문사회" in dept or "사회과학" in dept or "농경제사회" in dept or "문과" in dept or "경영" in dept or "경제" in dept or "행정" in dept or "정치" in dept or "사회학" in dept or "심리" in dept or "미디어" in dept or "신문방송" in dept or "언론" in dept or "국어국문" in dept or "영어영문" in dept or "사학" in dept or "철학" in dept or "법학" in dept or "교육학" in dept:
        if not any(n in dept for n in ["산업경영공학", "경영공학", "금융공학", "수학교육", "과학교육", "물리교육", "화학교육", "생물교육", "지구과학교육", "컴퓨터교육", "데이터사이언스", "생명과학"]):
            return "인문"
    if "자연" in raw_track or "공학" in raw_track or "이학" in raw_track or "의약" in raw_track:
        return "자연"
    if "인문" in raw_track or "사회" in raw_track or "상경" in raw_track:
        return "인문"
    nat_kw = [
        "공학", "과학", "수학", "물리", "화학", "생명", "생물", "지구", "천문", "대기", "통계",
        "컴퓨터", "소프트웨어", "인공지능", "AI", "데이터", "전자", "전기", "기계", "화공", "신소재",
        "재료", "건축", "토목", "도시", "환경", "에너지", "반도체", "시스템", "로봇", "바이오",
        "의예", "의학", "치의", "한의", "약학", "수의", "간호", "보건", "식품", "영양", "농", "산림",
        "원예", "조경", "스마트", "모빌리티", "배터리", "양자", "지능", "사이버", "정보보호", "융합전자",
        "산업경영공학", "수학교육", "과학교육", "물리교육", "화학교육", "생물교육", "지구과학교육", "가정교육", "컴퓨터교육"
    ]
    if any(k in combined for k in nat_kw):
        # 예외: 통계학과/건축학과(인문) 등 인문 표기가 명시된 경우
        if "(인문)" in dept or "인문계" in dept:
            return "인문"
        return "자연"
    return "인문"


# 3개년 모집단위 표준화 매핑(명칭 변경/캠퍼스 표기 정리/공백 제거)
DEPT_NORMALIZE_RULES: List[Tuple[str, str, str]] = [
    # (pattern_regex, replacement, note)
    (r"\s+", "", ""),
    (r"^\[서울\]", "", ""),
    (r"^\[서울캠퍼스\]", "", ""),
    (r"\(서울\)$", "", ""),
]

# 대학별 명시적 명칭 변경/통합 매핑 (수집 과정에서 자동/수동 확장)
EXPLICIT_DEPT_MAP: Dict[Tuple[str, str], Tuple[str, str]] = {
    # (대학명, 원학과명_공백제거): (표준모집단위명, 비고태그)
    ("서울대", "첨단융합학부"): ("첨단융합학부", "2024 신설"),
    ("한양대", "한양인터칼리지학부"): ("한양인터칼리지학부", "2025 신설(무전공)"),
    ("건국대", "KU자유전공학부"): ("KU자유전공학부", "2025 신설(무전공)"),
    ("동국대", "열린전공학부(인문)"): ("열린전공학부(인문)", "2025 신설(무전공)"),
    ("동국대", "열린전공학부(자연)"): ("열린전공학부(자연)", "2025 신설(무전공)"),
    ("서강대", "인문학기반자유전공학부"): ("인문학기반자유전공학부", "2025 신설(무전공)"),
    ("서강대", "AI기반자유전공학부"): ("AI기반자유전공학부", "2025 신설(무전공)"),
    ("서강대", "SCIENCE기반자유전공학부"): ("SCIENCE기반자유전공학부", "2025 신설(무전공)"),
    ("성균관대", "자유전공계열"): ("자유전공계열", "2025 신설(무전공)"),
    ("고려대", "학부대학"): ("학부대학", "2025 신설(무전공)"),
    ("중앙대", "창의ICT공과대학"): ("창의ICT공과대학", "광역모집"),
    ("한국외대", "자유전공학부(서울)"): ("자유전공학부(서울)", "2025 신설(무전공)"),
    ("서울시립대", "자유전공학부(인문)"): ("자유전공학부(인문)", "2025 신설(무전공)"),
    ("서울시립대", "자유전공학부(자연)"): ("자유전공학부(자연)", "2025 신설(무전공)"),
    ("경희대", "자율전공학부"): ("자율전공학부", "무전공/자율전공"),
    ("경희대", "자유전공학부"): ("자유전공학부", "2025 신설(무전공)"),
    ("홍익대", "서울캠퍼스자율전공(자연·예능)"): ("서울캠퍼스자율전공(자연·예능)", "자율전공"),
    ("홍익대", "서울캠퍼스자율전공(인문·예능)"): ("서울캠퍼스자율전공(인문·예능)", "자율전공"),
}


def normalize_dept(univ: str, dept_raw: str) -> Tuple[str, str]:
    d = clean_str(dept_raw)
    if not d:
        return "", ""
    key_clean = re.sub(r"\s+", "", d)
    if (univ, key_clean) in EXPLICIT_DEPT_MAP:
        return EXPLICIT_DEPT_MAP[(univ, key_clean)]
    std = d
    for pat, repl, _ in DEPT_NORMALIZE_RULES:
        std = re.sub(pat, repl, std)
    # 괄호 및 가운데점 표기 통일 (전각 -> 반각, 가운데점 통일)
    std = std.replace("（", "(").replace("）", ")").replace("ㆍ", "·").replace("∙", "·").replace("・", "·")
    note = ""
    if any(k in std for k in ["자유전공", "인터칼리지", "열린전공", "자율전공", "학부대학"]):
        note = "자유전공/무전공"
    return std, note


def save_checkpoint_csv(univ: str, kind: str, rows: List[Dict[str, Any]]) -> Path:
    """
    kind: '수시' or '정시'
    """
    cols = SUSI_COLUMNS if kind == "수시" else JEONGSI_COLUMNS
    out_path = INTERMEDIATE_DIR / f"{univ}_{kind}_3개년.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # Deduplicate exact keys while preserving order (prefer 입학처 > 어디가 > 기타)
    src_rank = {"입학처": 0, "어디가": 1, "기타": 2}
    dedup: Dict[Tuple, Dict[str, Any]] = {}
    for r in rows:
        if kind == "수시":
            k = (
                str(r.get("학년도", "")),
                clean_str(r.get("대학명", "")),
                clean_str(r.get("전형유형", "")),
                clean_str(r.get("세부전형명", "")),
                clean_str(r.get("모집단위(학과)", "")),
            )
        else:
            k = (
                str(r.get("학년도", "")),
                clean_str(r.get("대학명", "")),
                clean_str(r.get("모집군", "")),
                clean_str(r.get("세부전형명", "")),
                clean_str(r.get("모집단위(학과)", "")),
            )
        if k not in dedup:
            dedup[k] = r
        else:
            # Merge missing fields from secondary source, prefer higher-priority source
            existing = dedup[k]
            r_rank = src_rank.get(clean_str(r.get("출처구분")), 9)
            e_rank = src_rank.get(clean_str(existing.get("출처구분")), 9)
            primary, secondary = (r, existing) if r_rank < e_rank else (existing, r)
            merged = dict(primary)
            for c in cols:
                if merged.get(c) in (None, "", "공식 비공개") and secondary.get(c) not in (None, ""):
                    merged[c] = secondary[c]
            dedup[k] = merged

    sorted_rows = sorted(
        dedup.values(),
        key=lambda x: (
            -int(x.get("학년도") or 0),
            clean_str(x.get("전형유형") or x.get("모집군") or ""),
            clean_str(x.get("세부전형명") or ""),
            clean_str(x.get("모집단위(학과)") or ""),
        ),
    )

    with open(out_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        writer.writeheader()
        for r in sorted_rows:
            writer.writerow({c: ("" if r.get(c) is None else r.get(c)) for c in cols})
    return out_path


def load_collection_log() -> Dict[str, Any]:
    log_path = INTERMEDIATE_DIR / "collection_log.json"
    if log_path.exists():
        return json.loads(log_path.read_text(encoding="utf-8"))
    return {"universities": {}, "dept_mappings": [], "sampling_checks": []}


def save_collection_log(log_data: Dict[str, Any]) -> Path:
    log_path = INTERMEDIATE_DIR / "collection_log.json"
    log_path.write_text(json.dumps(log_data, ensure_ascii=False, indent=2), encoding="utf-8")
    return log_path
