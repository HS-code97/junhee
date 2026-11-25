import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Calculator,
  Table2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';
import type { StudentProfile } from '../types';
import {
  G5_TABLE,
  G9_TABLE,
  estimateTopPctFromZScore,
  getEffectiveStudentCumPct,
} from '../lib/simulatorEngine';

interface ScoreControlPanelProps {
  profile: StudentProfile;
  onChange: (next: StudentProfile) => void;
}

export const ScoreControlPanel: React.FC<ScoreControlPanelProps> = ({ profile, onChange }) => {
  const [expanded, setExpanded] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  const [showConvModal, setShowConvModal] = useState(false);

  // Z-score helper state
  const [rawScore, setRawScore] = useState('96');
  const [meanScore, setMeanScore] = useState('78');
  const [stdDev, setStdDev] = useState('10.5');

  // Text states for smooth typing on mobile
  const [g5Text, setG5Text] = useState(profile.grade5.toFixed(2));
  const [cumText, setCumText] = useState(
    profile.customCumPct !== null ? String(profile.customCumPct) : ''
  );
  const [mockText, setMockText] = useState(profile.mockPct.toFixed(1));

  const effectivePct = getEffectiveStudentCumPct(profile.grade5, profile.customCumPct);
  const isCustomActive = profile.customCumPct !== null;

  const updateGrade5 = (val: number) => {
    const clamped = Math.round(Math.max(1.0, Math.min(5.0, val)) * 100) / 100;
    setG5Text(clamped.toFixed(2));
    onChange({ ...profile, grade5: clamped });
  };

  const updateMockPct = (val: number) => {
    const clamped = Math.round(Math.max(0, Math.min(100, val)) * 10) / 10;
    setMockText(clamped.toFixed(1));
    onChange({ ...profile, mockPct: clamped });
  };

  const zResult = estimateTopPctFromZScore(
    parseFloat(rawScore),
    parseFloat(meanScore),
    parseFloat(stdDev)
  );

  return (
    <>
      <section className="rounded-3xl bg-white p-4 shadow-[0_6px_28px_-8px_rgba(25,31,40,0.08)] ring-1 ring-slate-200/80">
        {/* Compact Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-center gap-2.5 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900">현 고1 내 성적 기준</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    isCustomActive
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {isCustomActive ? '직접입력 상위% 적용중' : '5등급 자동보간 적용중'}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-600 tabular-nums">
                <span>
                  내신 <strong className="text-slate-900">{profile.grade5.toFixed(2)}등급</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  적용 상위 <strong className="text-indigo-600">{effectivePct.toFixed(1)}%</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  모의 <strong className="text-teal-700">{profile.mockPct.toFixed(1)}%</strong>
                </span>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowConvModal(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            >
              <Table2 className="h-3.5 w-3.5 text-indigo-600" />
              환산표
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700"
            >
              {expanded ? '접기' : '성적 수정'}
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Input Controls */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-3.5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Input 1: 5등급제 내신 평균 */}
              <div className="rounded-2xl bg-[#F8FAFF] p-3 ring-1 ring-indigo-100/90">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    ① 5등급제 내신 평균 <span className="text-[11px] font-normal text-slate-500">(1~5)</span>
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600 tabular-nums">
                    보간 {getEffectiveStudentCumPct(profile.grade5, null).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateGrade5(profile.grade5 - 0.05)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white text-sm font-bold text-slate-700 shadow-2xs ring-1 ring-slate-200 active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="1"
                    max="5"
                    aria-label="5등급제 내신 평균"
                    value={g5Text}
                    onChange={(e) => {
                      setG5Text(e.target.value);
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v) && v >= 1 && v <= 5) {
                        onChange({ ...profile, grade5: v });
                      }
                    }}
                    onBlur={() => updateGrade5(parseFloat(g5Text) || 1.15)}
                    className="h-9 w-full rounded-xl bg-white px-2 text-center text-sm font-extrabold text-indigo-900 tabular-nums ring-1 ring-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateGrade5(profile.grade5 + 0.05)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white text-sm font-bold text-slate-700 shadow-2xs ring-1 ring-slate-200 active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Input 2: 추정 상위 누적 백분위(%) [선택] */}
              <div className="rounded-2xl bg-[#FAF8FF] p-3 ring-1 ring-violet-200/80">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs font-bold text-slate-800">
                    ② 추정 상위 누적(%) <span className="text-[11px] font-semibold text-violet-600">[선택]</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCalc((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2 py-0.5 text-[10.5px] font-bold text-violet-700 transition hover:bg-violet-200"
                  >
                    <Calculator className="h-3 w-3" />
                    계산기
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0.1"
                    max="100"
                    placeholder="미입력 시 1등급 경합 표시"
                    aria-label="추정 상위 누적 백분위"
                    value={cumText}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setCumText(raw);
                      if (raw.trim() === '') {
                        onChange({ ...profile, customCumPct: null });
                      } else {
                        const num = parseFloat(raw);
                        if (!Number.isNaN(num) && num > 0 && num <= 100) {
                          onChange({ ...profile, customCumPct: num });
                        }
                      }
                    }}
                    className="h-9 w-full rounded-xl bg-white px-2.5 text-center text-sm font-extrabold text-violet-900 placeholder:text-[11px] placeholder:font-medium placeholder:text-slate-400 tabular-nums ring-1 ring-violet-200 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                  {profile.customCumPct !== null && (
                    <button
                      type="button"
                      title="비우기 (자동 보간 복귀)"
                      onClick={() => {
                        setCumText('');
                        onChange({ ...profile, customCumPct: null });
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-800"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Input 3: 모의고사 국수탐 백분위 */}
              <div className="rounded-2xl bg-[#F4FBF9] p-3 ring-1 ring-teal-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    ③ 모의 국수탐 백분위 <span className="text-[11px] font-normal text-slate-500">(정시)</span>
                  </label>
                  <span className="text-[11px] font-bold text-teal-700">0~100</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateMockPct(profile.mockPct - 0.5)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white text-sm font-bold text-slate-700 shadow-2xs ring-1 ring-slate-200 active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    max="100"
                    aria-label="모의고사 국수탐 평균 백분위"
                    value={mockText}
                    onChange={(e) => {
                      setMockText(e.target.value);
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v) && v >= 0 && v <= 100) {
                        onChange({ ...profile, mockPct: v });
                      }
                    }}
                    onBlur={() => updateMockPct(parseFloat(mockText) || 94.0)}
                    className="h-9 w-full rounded-xl bg-white px-2 text-center text-sm font-extrabold text-teal-900 tabular-nums ring-1 ring-teal-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateMockPct(profile.mockPct + 0.5)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white text-sm font-bold text-slate-700 shadow-2xs ring-1 ring-slate-200 active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Z-Score Top % Helper */}
            {showCalc && (
              <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 p-3.5 ring-1 ring-violet-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-violet-900 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                    원점수 · 과목평균 · 표준편차 → 상위 누적(%) 추정 도우미
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCalc(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    닫기
                  </button>
                </div>
                <p className="mt-1 text-[11.5px] text-slate-600">
                  성적표의 주요 과목 원점수·평균·표준편차를 넣으면 정규분포 Z점수 기준 상위 누적 %를 계산해 ②번 칸에 바로 채워줘요.
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600">내 원점수</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={rawScore}
                      onChange={(e) => setRawScore(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg bg-white px-2 text-center text-xs font-bold ring-1 ring-violet-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600">과목 평균</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={meanScore}
                      onChange={(e) => setMeanScore(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg bg-white px-2 text-center text-xs font-bold ring-1 ring-violet-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600">표준편차</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={stdDev}
                      onChange={(e) => setStdDev(e.target.value)}
                      className="mt-1 h-8 w-full rounded-lg bg-white px-2 text-center text-xs font-bold ring-1 ring-violet-200"
                    />
                  </div>
                </div>
                {zResult && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white/90 px-3 py-2 ring-1 ring-violet-100">
                    <div className="text-xs text-slate-700 tabular-nums">
                      Z점수 <strong>{zResult.z.toFixed(2)}</strong> → 추정 상위{' '}
                      <strong className="text-violet-700">{zResult.topPct.toFixed(1)}%</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCumText(String(zResult.topPct));
                        onChange({ ...profile, customCumPct: zResult.topPct });
                        setShowCalc(false);
                      }}
                      className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-bold text-white hover:bg-violet-700"
                    >
                      ②번에 적용하기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Hint Line */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-slate-500">
              <span>
                💡 서울 13개교 수시는 상위 10%(5등급제 1등급) 안쪽 경쟁이 핵심! <strong>② 추정 상위%</strong>를 넣으면 <span className="font-bold text-violet-600">1등급내 경합</span>이 정밀 판정으로 바뀝니다.
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Conversion Reference Modal (Excel Sheet 4 P4:X14) */}
      {showConvModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setShowConvModal(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl animate-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  9등급제 ↔ 5등급제 누적 백분위(%) 대조 환산표
                </h3>
                <p className="text-xs text-slate-500">
                  엑셀 4번 시트(P4:X14)와 동일한 구간 중앙값 선형보간 기준표
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConvModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-bold text-indigo-700">과거 9등급제 누적 비율</h4>
                <table className="w-full text-center text-xs tabular-nums border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="py-1.5 px-2 rounded-tl-lg">등급</th>
                      <th className="py-1.5 px-2">구간(%)</th>
                      <th className="py-1.5 px-2 rounded-tr-lg">중앙(%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {G9_TABLE.map((r) => (
                      <tr key={r.grade}>
                        <td className="py-1.5 font-bold text-slate-800">{r.grade}등급</td>
                        <td className="py-1.5 text-slate-600">
                          {r.start}~{r.end}%
                        </td>
                        <td className="py-1.5 font-semibold text-indigo-600">{r.mid.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="mb-2 text-xs font-bold text-violet-700">현 고1 5등급제 누적 비율</h4>
                  <table className="w-full text-center text-xs tabular-nums border-collapse">
                    <thead>
                      <tr className="bg-violet-50 text-violet-900">
                        <th className="py-1.5 px-2 rounded-tl-lg">등급</th>
                        <th className="py-1.5 px-2">구간(%)</th>
                        <th className="py-1.5 px-2 rounded-tr-lg">중앙(%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {G5_TABLE.map((r) => (
                        <tr key={r.grade}>
                          <td className="py-1.5 font-bold text-slate-800">{r.grade}등급</td>
                          <td className="py-1.5 text-slate-600">
                            {r.start}~{r.end}%
                          </td>
                          <td className="py-1.5 font-semibold text-violet-600">{r.mid.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-2xl bg-amber-50/80 p-3 text-[11.5px] leading-relaxed text-amber-900 ring-1 ring-amber-200/70">
                  <strong>판정 기준 요약</strong>
                  <div className="mt-1 space-y-0.5">
                    <div>• 수시(요구% - 내 상위%): +2.0%p↑ 안정 / -1.0~+2.0 적정 / -4.0~-1.0 소신 / -4.0↓ 상향</div>
                    <div>• 정시(내 백분위 - 70%컷): +1.5↑ 안정 / -0.5~+1.5 적정 / -2.5~-0.5 소신 / -2.5↓ 상향</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
