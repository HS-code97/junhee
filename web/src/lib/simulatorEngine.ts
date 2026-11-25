import type { JeongsiJudgment, SusiJudgment } from '../types';

export const G9_TABLE = [
  { grade: 1, start: 0, end: 4, mid: 2.0 },
  { grade: 2, start: 4, end: 11, mid: 7.5 },
  { grade: 3, start: 11, end: 23, mid: 17.0 },
  { grade: 4, start: 23, end: 40, mid: 31.5 },
  { grade: 5, start: 40, end: 60, mid: 50.0 },
  { grade: 6, start: 60, end: 77, mid: 68.5 },
  { grade: 7, start: 77, end: 89, mid: 83.0 },
  { grade: 8, start: 89, end: 96, mid: 92.5 },
  { grade: 9, start: 96, end: 100, mid: 98.0 },
] as const;

export const G5_TABLE = [
  { grade: 1, start: 0, end: 10, mid: 5.0 },
  { grade: 2, start: 10, end: 34, mid: 22.0 },
  { grade: 3, start: 34, end: 66, mid: 50.0 },
  { grade: 4, start: 66, end: 90, mid: 78.0 },
  { grade: 5, start: 90, end: 100, mid: 95.0 },
] as const;

/**
 * 엑셀 Sheet 4 K5 수식 1:1 구현:
 * 5등급제 내신 평균(1.00~5.00) → 구간 중앙값 선형 보간 상위 누적 백분위(%)
 */
export function grade5ToCumPct(grade5: number): number {
  if (grade5 >= 5) return 95.0;
  if (grade5 < 1) return 2.0;
  const idx = Math.min(Math.floor(grade5) - 1, 3); // 0..3 -> 1..4등급 구간
  const cur = G5_TABLE[idx];
  const next = G5_TABLE[idx + 1];
  return cur.mid + (grade5 - cur.grade) * (next.mid - cur.mid);
}

/**
 * 엑셀 Sheet 4 K17:K... 수식 1:1 구현:
 * 9등급제 3개년 평균 70%컷 → 구간 중앙값 선형 보간 요구 상위 누적 백분위(%)
 */
export function grade9ToCumPct(avgCut9: number | null): number | null {
  if (avgCut9 === null || Number.isNaN(avgCut9)) return null;
  if (avgCut9 >= 9) return 98.0;
  if (avgCut9 < 1) return 2.0;
  const idx = Math.min(Math.floor(avgCut9) - 1, 7); // 0..7 -> 1..8등급 구간
  const cur = G9_TABLE[idx];
  const next = G9_TABLE[idx + 1];
  return cur.mid + (avgCut9 - cur.grade) * (next.mid - cur.mid);
}

/**
 * 학생 최종 적용 상위 누적 백분위(%) 계산
 */
export function getEffectiveStudentCumPct(grade5: number, customCumPct: number | null): number {
  if (customCumPct !== null && !Number.isNaN(customCumPct)) {
    return Math.max(0.01, Math.min(100, customCumPct));
  }
  return grade5ToCumPct(grade5);
}

/**
 * 엑셀 Sheet 4 N17:N... 수시 판정 수식 1:1 구현
 */
export function evaluateSusiJudgment(
  reqCumPct: number | null,
  studentGrade5: number,
  studentCustomPct: number | null,
  effectiveStudentPct: number
): SusiJudgment {
  if (reqCumPct === null || Number.isNaN(reqCumPct)) {
    return '참고(컷미공개)';
  }
  if (studentCustomPct === null && studentGrade5 < 1.5 && reqCumPct <= 10.0) {
    return '참고(1등급내 경합)';
  }
  const diff = reqCumPct - effectiveStudentPct;
  if (diff >= 2.0) return '안정';
  if (diff >= -1.0) return '적정';
  if (diff >= -4.0) return '소신';
  return '상향';
}

/**
 * 엑셀 Sheet 4 Z17:Z... 정시 판정 수식 1:1 구현
 */
export function evaluateJeongsiJudgment(
  avgPct70: number | null,
  studentMockPct: number
): JeongsiJudgment {
  if (avgPct70 === null || Number.isNaN(avgPct70)) {
    return '참고(미공개)';
  }
  const diff = studentMockPct - avgPct70;
  if (diff >= 1.5) return '안정';
  if (diff >= -0.5) return '적정';
  if (diff >= -2.5) return '소신';
  return '상향';
}

/**
 * 원점수 · 과목평균 · 표준편차 기반 표준정규분포 상위 누적 백분위(%) 보조 계산기
 */
export function estimateTopPctFromZScore(
  rawScore: number,
  mean: number,
  stdDev: number
): { z: number; topPct: number } | null {
  if (!Number.isFinite(rawScore) || !Number.isFinite(mean) || !Number.isFinite(stdDev) || stdDev <= 0) {
    return null;
  }
  const z = (rawScore - mean) / stdDev;
  // Standard normal CDF via Abramowitz & Stegun 7.1.26 erf approximation
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const erf = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);
  const cdf = 0.5 * (1 + sign * erf);
  const topPct = Math.max(0.05, Math.min(99.9, (1 - cdf) * 100));
  return { z: Math.round(z * 100) / 100, topPct: Math.round(topPct * 10) / 10 };
}

export const JUDGMENT_STYLES: Record<
  string,
  { bg: string; text: string; ring: string; dot: string; shortLabel: string }
> = {
  안정: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200/80',
    dot: 'bg-emerald-500',
    shortLabel: '안정',
  },
  적정: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    ring: 'ring-blue-200/80',
    dot: 'bg-blue-500',
    shortLabel: '적정',
  },
  소신: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200/80',
    dot: 'bg-amber-500',
    shortLabel: '소신',
  },
  상향: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    ring: 'ring-rose-200/80',
    dot: 'bg-rose-500',
    shortLabel: '상향',
  },
  '참고(1등급내 경합)': {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    ring: 'ring-violet-200/80',
    dot: 'bg-violet-500',
    shortLabel: '1등급내 경합',
  },
  '참고(컷미공개)': {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    ring: 'ring-slate-200',
    dot: 'bg-slate-400',
    shortLabel: '컷 미공개',
  },
  '참고(미공개)': {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    ring: 'ring-slate-200',
    dot: 'bg-slate-400',
    shortLabel: '미공개',
  },
};

export const UNIV_THEMES: Record<string, { badgeBg: string; badgeText: string; accent: string }> = {
  서울대: { badgeBg: 'bg-[#EEF2FF]', badgeText: 'text-[#1E3A8A]', accent: '#1E3A8A' },
  연세대: { badgeBg: 'bg-[#EFF6FF]', badgeText: 'text-[#1D4ED8]', accent: '#1D4ED8' },
  고려대: { badgeBg: 'bg-[#FFF1F2]', badgeText: 'text-[#9F1239]', accent: '#9F1239' },
  서강대: { badgeBg: 'bg-[#FEF2F2]', badgeText: 'text-[#B91C1C]', accent: '#B91C1C' },
  성균관대: { badgeBg: 'bg-[#ECFDF5]', badgeText: 'text-[#047857]', accent: '#047857' },
  한양대: { badgeBg: 'bg-[#F0F9FF]', badgeText: 'text-[#0369A1]', accent: '#0369A1' },
  중앙대: { badgeBg: 'bg-[#EFF6FF]', badgeText: 'text-[#2563EB]', accent: '#2563EB' },
  경희대: { badgeBg: 'bg-[#FFF1F2]', badgeText: 'text-[#BE123C]', accent: '#BE123C' },
  한국외대: { badgeBg: 'bg-[#F0FDFA]', badgeText: 'text-[#0F766E]', accent: '#0F766E' },
  서울시립대: { badgeBg: 'bg-[#EEF2FF]', badgeText: 'text-[#3730A3]', accent: '#3730A3' },
  건국대: { badgeBg: 'bg-[#ECFDF5]', badgeText: 'text-[#15803D]', accent: '#15803D' },
  동국대: { badgeBg: 'bg-[#FFF7ED]', badgeText: 'text-[#C2410C]', accent: '#C2410C' },
  홍익대: { badgeBg: 'bg-[#F5F3FF]', badgeText: 'text-[#5B21B6]', accent: '#5B21B6' },
};

export const EXCEL_DOWNLOAD_URL = `${import.meta.env.BASE_URL}downloads/seoul13_2029_admissions_db.xlsx`;
export const EXCEL_DOWNLOAD_FILENAME = '서울13개대학_3개년입결_2029맞춤DB.xlsx';
