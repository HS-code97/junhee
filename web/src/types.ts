export type SusiJudgment =
  | '안정'
  | '적정'
  | '소신'
  | '상향'
  | '참고(1등급내 경합)'
  | '참고(컷미공개)';

export type JeongsiJudgment =
  | '안정'
  | '적정'
  | '소신'
  | '상향'
  | '참고(미공개)';

export interface StudentProfile {
  /** ① 학생 5등급제 내신 평균 (1.00 ~ 5.00) */
  grade5: number;
  /** ② 학생 추정 상위 누적 백분위(%) - null이면 미입력(5등급 중앙보간 자동 적용) */
  customCumPct: number | null;
  /** ③ 모의고사 국수탐 평균 백분위 (0 ~ 100) */
  mockPct: number;
}

export interface SusiSimRow {
  id: number;
  u: string;
  t: string; // 교과 | 종합 | 논술
  adm: string;
  tr: string; // 인문 | 자연 | 자유전공 | 예체능
  d: string; // 표준모집단위명
  c24: number | null;
  c25: number | null;
  c26: number | null;
  avg: number | null;
  trend: string;
  reqPct: number | null;
  g5Label: string;
  q26: number | null;
  r26: number | null;
  note: string;
}

export interface JeongsiSimRow {
  id: number;
  u: string;
  gun: string; // 가 | 나 | 다
  adm: string;
  tr: string;
  d: string;
  p24: number | null;
  p25: number | null;
  p26: number | null;
  avg: number | null;
  trend: string;
  q26: number | null;
  r26: number | null;
  note: string;
}

export interface SusiRawRow {
  id: number;
  yr: number;
  u: string;
  t: string;
  adm: string;
  tr: string;
  dept: string;
  stdDept: string;
  quota: number | null;
  app: number | null;
  rate: number | null;
  wait: number | null;
  c50: number | null;
  c70: number | null;
  cAvg: number | null;
  cInit: number | null;
  src: string;
  url: string;
  note: string;
}

export interface JeongsiRawRow {
  id: number;
  yr: number;
  u: string;
  gun: string;
  adm: string;
  tr: string;
  dept: string;
  stdDept: string;
  quota: number | null;
  app: number | null;
  rate: number | null;
  wait: number | null;
  sMax: number | null;
  s50: number | null;
  s70: number | null;
  p50: number | null;
  p70: number | null;
  eng: number | null;
  src: string;
  url: string;
  note: string;
}

export interface Reform2028Item {
  대학명: string;
  수시_교과전형_5등급제반영및정성평가여부: string;
  '수시_학종_주요변화(면접/수능최저등)': string;
  정시_학생부반영여부및비율: string;
  정시_통합수능_영역별반영특징: string;
  '2029학년도_현고1_준비포인트': string;
  출처URL_및_발표시점: string;
}

export interface DashboardUnivRow {
  batch: string;
  univ: string;
  fullName: string;
  s24: number;
  s25: number;
  s26: number;
  sTotal: number;
  j24: number;
  j25: number;
  j26: number;
  jTotal: number;
  has2028Pdf: boolean;
  status: string;
  notes: string;
  url: string;
}

export interface SimMetaPayload {
  meta: {
    generatedAt: string;
    totalSusi: number;
    totalJeongsi: number;
    totalRecords: number;
    susiSimCount: number;
    jeongsiSimCount: number;
    universities: string[];
    batch1: string[];
    batch2: string[];
  };
  dashboard: DashboardUnivRow[];
  reform2028: Reform2028Item[];
  susiSim: SusiSimRow[];
  jeongsiSim: JeongsiSimRow[];
}

export interface CollectionLogPayload {
  universities: Record<
    string,
    {
      url: string;
      raw_files: string[];
      has_2028_pdf: boolean;
      susi_counts: Record<string, number>;
      jeongsi_counts: Record<string, number>;
      status: string;
      missing_or_notes: string;
    }
  >;
  dept_mappings: Array<{
    대학명: string;
    원모집단위명: string;
    표준모집단위명: string;
    변동구분: string;
    비고: string;
  }>;
}
