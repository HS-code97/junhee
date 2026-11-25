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
    bg: 'bg-[#E9F7F3]',
    text: 'text-[#247366]',
    ring: 'ring-[#BCE6DA]',
    dot: 'bg-[#42A896]',
    shortLabel: '안정',
  },
  적정: {
    bg: 'bg-[#EAF4FB]',
    text: 'text-[#2D6A96]',
    ring: 'ring-[#C5E0F3]',
    dot: 'bg-[#569ED0]',
    shortLabel: '적정',
  },
  소신: {
    bg: 'bg-[#FEF6E6]',
    text: 'text-[#9A6518]',
    ring: 'ring-[#F5DDB0]',
    dot: 'bg-[#E5A33E]',
    shortLabel: '소신',
  },
  상향: {
    bg: 'bg-[#FDF0F5]',
    text: 'text-[#B9467A]',
    ring: 'ring-[#F4C8DC]',
    dot: 'bg-[#DD6D9E]',
    shortLabel: '상향',
  },
  '참고(1등급내 경합)': {
    bg: 'bg-[#F2EEFC]',
    text: 'text-[#6A57A5]',
    ring: 'ring-[#DDD3F6]',
    dot: 'bg-[#9480CF]',
    shortLabel: '1등급내 경합',
  },
  '참고(컷미공개)': {
    bg: 'bg-[#F3F1F8]',
    text: 'text-[#6E6782]',
    ring: 'ring-[#E4DFF0]',
    dot: 'bg-[#A69EBC]',
    shortLabel: '컷 미공개',
  },
  '참고(미공개)': {
    bg: 'bg-[#F3F1F8]',
    text: 'text-[#6E6782]',
    ring: 'ring-[#E4DFF0]',
    dot: 'bg-[#A69EBC]',
    shortLabel: '미공개',
  },
};

export const UNIV_THEMES: Record<string, { badgeBg: string; badgeText: string; accent: string }> = {
  서울대: { badgeBg: 'bg-[#EEF2FA]', badgeText: 'text-[#39558B]', accent: '#5A78B4' },
  연세대: { badgeBg: 'bg-[#EAF4FB]', badgeText: 'text-[#2D6898]', accent: '#4C8EC4' },
  고려대: { badgeBg: 'bg-[#FCEEF3]', badgeText: 'text-[#A23B61]', accent: '#C85B83' },
  서강대: { badgeBg: 'bg-[#FDEFF0]', badgeText: 'text-[#AE444D]', accent: '#D0656E' },
  성균관대: { badgeBg: 'bg-[#EAF7F2]', badgeText: 'text-[#27755E]', accent: '#4CA288' },
  한양대: { badgeBg: 'bg-[#EAF5FA]', badgeText: 'text-[#2A6F8E]', accent: '#4D9AB9' },
  중앙대: { badgeBg: 'bg-[#EDF3FC]', badgeText: 'text-[#3A64A8]', accent: '#628DD0' },
  경희대: { badgeBg: 'bg-[#FCEFF4]', badgeText: 'text-[#B2416C]', accent: '#D66791' },
  한국외대: { badgeBg: 'bg-[#EBF7F6]', badgeText: 'text-[#287570]', accent: '#4BA49E' },
  서울시립대: { badgeBg: 'bg-[#F1EEFB]', badgeText: 'text-[#62509C]', accent: '#8A76C7' },
  건국대: { badgeBg: 'bg-[#EDF8F1]', badgeText: 'text-[#2E7A4E]', accent: '#54A777' },
  동국대: { badgeBg: 'bg-[#FEF4EB]', badgeText: 'text-[#B06127]', accent: '#DA894E' },
  홍익대: { badgeBg: 'bg-[#F5EFFB]', badgeText: 'text-[#7A54A8]', accent: '#A07BCE' },
};

export const EXCEL_DOWNLOAD_URL = `${import.meta.env.BASE_URL}downloads/seoul13_2029_admissions_db.xlsx`;
export const EXCEL_DOWNLOAD_FILENAME = '서울13개대학_3개년입결_2029맞춤DB.xlsx';
