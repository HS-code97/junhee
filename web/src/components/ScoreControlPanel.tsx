import React, { useEffect, useState } from 'react';
import {
  SlidersHorizontal,
  Calculator,
  Table2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  Sparkles,
  Search,
  RefreshCw,
} from 'lucide-react';
import type { StudentProfile } from '../types';
import {
  G5_TABLE,
  G9_TABLE,
  estimateTopPctFromZScore,
  getEffectiveStudentCumPct,
  grade5ToCumPct,
} from '../lib/simulatorEngine';

interface ScoreControlPanelProps {
  profile: StudentProfile;
  onApply: (next: StudentProfile) => void;
}

const clampGrade5 = (v: number) => Math.round(Math.max(1.0, Math.min(5.0, v)) * 100) / 100;
const clampCumPct = (v: number) => Math.round(Math.max(0.1, Math.min(100.0, v)) * 10) / 10;
const clampMockPct = (v: number) => Math.round(Math.max(0.0, Math.min(100.0, v)) * 10) / 10;

export const ScoreControlPanel: React.FC<ScoreControlPanelProps> = ({ profile, onApply }) => {
  const [expanded, setExpanded] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  const [showConvModal, setShowConvModal] = useState(false);

  // Z-score helper state
  const [rawScore, setRawScore] = useState('96');
  const [meanScore, setMeanScore] = useState('78');
  const [stdDev, setStdDev] = useState('10.5');

  // Draft input values (applied only when user clicks "맞춤 판정 조회하기")
  const appliedCum = getEffectiveStudentCumPct(profile.grade5, profile.customCumPct);
  const [g5Text, setG5Text] = useState(profile.grade5.toFixed(2));
  const [cumText, setCumText] = useState(appliedCum.toFixed(1));
  const [mockText, setMockText] = useState(profile.mockPct.toFixed(1));
  const [cumAutoSynced, setCumAutoSynced] = useState(
    Math.abs(appliedCum - clampCumPct(grade5ToCumPct(profile.grade5))) < 0.06
  );

  // Sync draft when external profile changes
  useEffect(() => {
    const nextCum = getEffectiveStudentCumPct(profile.grade5, profile.customCumPct);
    setG5Text(profile.grade5.toFixed(2));
    setCumText(nextCum.toFixed(1));
    setMockText(profile.mockPct.toFixed(1));
    setCumAutoSynced(Math.abs(nextCum - clampCumPct(grade5ToCumPct(profile.grade5))) < 0.06);
  }, [profile]);

  const parsedG5 = (() => {
    const n = parseFloat(g5Text);
    return Number.isNaN(n) ? profile.grade5 : clampGrade5(n);
  })();

  const parsedCum = (() => {
    const n = parseFloat(cumText);
    return Number.isNaN(n) ? appliedCum : clampCumPct(n);
  })();

  const parsedMock = (() => {
    const n = parseFloat(mockText);
    return Number.isNaN(n) ? profile.mockPct : clampMockPct(n);
  })();

  const autoInterpFromDraftG5 = clampCumPct(grade5ToCumPct(parsedG5));

  const hasChanges =
    Math.abs(parsedG5 - profile.grade5) > 0.001 ||
    Math.abs(parsedCum - appliedCum) > 0.05 ||
    Math.abs(parsedMock - profile.mockPct) > 0.05;

  const stepGrade5 = (delta: number) => {
    const nextG5 = clampGrade5(parsedG5 + delta);
    const syncedCum = clampCumPct(grade5ToCumPct(nextG5));
    setG5Text(nextG5.toFixed(2));
    setCumText(syncedCum.toFixed(1));
    setCumAutoSynced(true);
  };

  const handleGrade5InputChange = (raw: string) => {
    setG5Text(raw);
    const num = parseFloat(raw);
    if (!Number.isNaN(num) && num >= 1 && num <= 5) {
      const syncedCum = clampCumPct(grade5ToCumPct(clampGrade5(num)));
      setCumText(syncedCum.toFixed(1));
      setCumAutoSynced(true);
    }
  };

  const stepCumPct = (delta: number) => {
    const nextCum = clampCumPct(parsedCum + delta);
    setCumText(nextCum.toFixed(1));
    setCumAutoSynced(false);
  };

  const stepMockPct = (delta: number) => {
    const nextMock = clampMockPct(parsedMock + delta);
    setMockText(nextMock.toFixed(1));
  };

  const handleApplySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nextG5 = clampGrade5(parseFloat(g5Text) || profile.grade5);
    const nextCum = clampCumPct(parseFloat(cumText) || autoInterpFromDraftG5);
    const nextMock = clampMockPct(parseFloat(mockText) || profile.mockPct);

    setG5Text(nextG5.toFixed(2));
    setCumText(nextCum.toFixed(1));
    setMockText(nextMock.toFixed(1));

    onApply({
      grade5: nextG5,
      customCumPct: nextCum,
      mockPct: nextMock,
    });
  };

  const handleResetDefaults = () => {
    setG5Text('1.15');
    setCumText('7.5');
    setMockText('94.0');
    setCumAutoSynced(true);
  };

  const zResult = estimateTopPctFromZScore(
    parseFloat(rawScore),
    parseFloat(meanScore),
    parseFloat(stdDev)
  );

  return (
    <>
      <section className="glass-card rounded-[26px] p-4 ring-1 ring-[#EAE3F7]/90">
        {/* Compact Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-center gap-2.5 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EDE4FC] to-[#FCE9F2] text-[#7D68B8] ring-1 ring-[#E4D9F7]">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] font-extrabold text-[#231E33]">내 성적 기준 입력</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    hasChanges
                      ? 'bg-[#FDF0F6] text-[#BD4F82] ring-1 ring-[#F4CBE0]'
                      : 'bg-[#F3EEFC] text-[#6D5AA8]'
                  }`}
                >
                  {hasChanges ? '수정됨 · 조회 버튼을 눌러주세요' : '현재 조회 적용 중'}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-[#6F6785] tabular-nums">
                <span>
                  5등급 내신 <strong className="text-[#231E33]">{profile.grade5.toFixed(2)}등급</strong>
                </span>
                <span className="text-[#DDD6EC]">·</span>
                <span>
                  상위 누적 <strong className="text-[#BD4F82]">{appliedCum.toFixed(1)}%</strong>
                </span>
                <span className="text-[#DDD6EC]">·</span>
                <span>
                  모의 백분위 <strong className="text-[#2C747E]">{profile.mockPct.toFixed(1)}</strong>
                </span>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowConvModal(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#F5F2FB] px-2.5 py-1.5 text-xs font-bold text-[#52486A] ring-1 ring-[#E9E2F6] transition hover:bg-[#EDE7F9]"
            >
              <Table2 className="h-3.5 w-3.5 text-[#8674C4]" />
              환산표
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#EFE9FC] px-2.5 py-1.5 text-xs font-bold text-[#5E4B98] ring-1 ring-[#DFD4F6] transition hover:bg-[#E6DCFA]"
            >
              {expanded ? '접기' : '성적 수정'}
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Input Controls */}
        {expanded && (
          <form onSubmit={handleApplySubmit} className="mt-4 space-y-3 border-t border-[#F0EBF9] pt-3.5">
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {/* Input 1: 5등급제 내신 평균 */}
              <div className="rounded-2xl bg-[#F6F2FE]/85 p-3 ring-1 ring-[#E6DCF8]">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs font-extrabold text-[#2B2440]">
                    ① 5등급제 내신 평균
                  </label>
                  <span className="text-[10.5px] font-bold text-[#7C69B8] tabular-nums">
                    1.00~5.00
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="내신 평균 0.05 감소"
                    onClick={() => stepGrade5(-0.05)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white/95 text-sm font-bold text-[#534A6E] shadow-2xs ring-1 ring-[#E5DDF5] transition hover:bg-[#FAF8FE] active:scale-95"
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
                    onChange={(e) => handleGrade5InputChange(e.target.value)}
                    onBlur={() => {
                      setG5Text(parsedG5.toFixed(2));
                      if (cumAutoSynced) {
                        setCumText(clampCumPct(grade5ToCumPct(parsedG5)).toFixed(1));
                      }
                    }}
                    className="h-9 w-full rounded-xl bg-white/95 px-2 text-center text-sm font-extrabold text-[#2E2547] tabular-nums ring-1 ring-[#DED4F4] focus:ring-2 focus:ring-[#9E8CD8] focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="내신 평균 0.05 증가"
                    onClick={() => stepGrade5(0.05)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white/95 text-sm font-bold text-[#534A6E] shadow-2xs ring-1 ring-[#E5DDF5] transition hover:bg-[#FAF8FE] active:scale-95"
                  >
                    +
                  </button>
                </div>
                <div className="mt-1.5 text-[10.5px] text-[#786E92] tabular-nums">
                  현 고1 5등급 · 변경 시 ②번 자동연동 (<strong>{autoInterpFromDraftG5.toFixed(1)}%</strong>)
                </div>
              </div>

              {/* Input 2: 추정 상위 누적 백분위(%) */}
              <div className="rounded-2xl bg-[#FDF2F7]/90 p-3 ring-1 ring-[#F5D6E6]">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <label className="text-xs font-extrabold text-[#2B2440] truncate">
                      ② 추정 상위 누적(%)
                    </label>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${
                        cumAutoSynced
                          ? 'bg-white/80 text-[#7A67B8] ring-1 ring-[#E6DCF8]'
                          : 'bg-[#FCE3EF] text-[#BD4F82]'
                      }`}
                    >
                      {cumAutoSynced ? '①자동연동' : '직접입력'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCalc((v) => !v)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#FCE3EF] px-2 py-0.5 text-[10.5px] font-bold text-[#B6497C] transition hover:bg-[#F9D3E6]"
                  >
                    <Calculator className="h-3 w-3" />
                    Z계산기
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="상위 누적 0.5% 감소"
                    onClick={() => stepCumPct(-0.5)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white/95 text-sm font-bold text-[#6E445A] shadow-2xs ring-1 ring-[#F3D3E3] transition hover:bg-[#FFF9FC] active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0.1"
                    max="100"
                    aria-label="추정 상위 누적 백분위"
                    value={cumText}
                    onChange={(e) => {
                      setCumText(e.target.value);
                      setCumAutoSynced(false);
                    }}
                    onBlur={() => setCumText(parsedCum.toFixed(1))}
                    className="h-9 w-full rounded-xl bg-white/95 px-2 text-center text-sm font-extrabold text-[#9A3867] tabular-nums ring-1 ring-[#F2CEE0] focus:ring-2 focus:ring-[#DC77A6] focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="상위 누적 0.5% 증가"
                    onClick={() => stepCumPct(0.5)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white/95 text-sm font-bold text-[#6E445A] shadow-2xs ring-1 ring-[#F3D3E3] transition hover:bg-[#FFF9FC] active:scale-95"
                  >
                    +
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-[#8B6278]">
                  <span>낮을수록 상위 · 미세조정 가능</span>
                  {!cumAutoSynced && (
                    <button
                      type="button"
                      onClick={() => {
                        setCumText(autoInterpFromDraftG5.toFixed(1));
                        setCumAutoSynced(true);
                      }}
                      className="inline-flex items-center gap-0.5 font-bold text-[#BD4F82] hover:underline"
                      title="①번 5등급 내신 기준 자동 환산값으로 되돌리기"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      ①연동복구({autoInterpFromDraftG5.toFixed(1)}%)
                    </button>
                  )}
                </div>
              </div>

              {/* Input 3: 모의고사 국수탐 백분위 */}
              <div className="rounded-2xl bg-[#EEF8FA]/90 p-3 ring-1 ring-[#D1EAF0]">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs font-extrabold text-[#23323B]">
                    ③ 모의 국수탐 백분위
                  </label>
                  <span className="text-[10.5px] font-bold text-[#327885]">정시 · 0~100</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="모의 백분위 0.5 감소"
                    onClick={() => stepMockPct(-0.5)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white/95 text-sm font-bold text-[#3D5B66] shadow-2xs ring-1 ring-[#CDE6ED] transition hover:bg-[#F7FCFD] active:scale-95"
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
                    onChange={(e) => setMockText(e.target.value)}
                    onBlur={() => setMockText(parsedMock.toFixed(1))}
                    className="h-9 w-full rounded-xl bg-white/95 px-2 text-center text-sm font-extrabold text-[#235F6B] tabular-nums ring-1 ring-[#C7E4EC] focus:ring-2 focus:ring-[#66B2C2] focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="모의 백분위 0.5 증가"
                    onClick={() => stepMockPct(0.5)}
                    className="h-9 w-9 shrink-0 rounded-xl bg-white/95 text-sm font-bold text-[#3D5B66] shadow-2xs ring-1 ring-[#CDE6ED] transition hover:bg-[#F7FCFD] active:scale-95"
                  >
                    +
                  </button>
                </div>
                <div className="mt-1.5 text-[10.5px] text-[#55747E]">
                  정시 수능 백분위 (높을수록 상위) · 70%컷 비교
                </div>
              </div>
            </div>

            {/* Optional Z-Score Top % Helper */}
            {showCalc && (
              <div className="rounded-2xl bg-gradient-to-r from-[#F9F2FD] via-[#FDF2F8] to-[#F5F1FD] p-3.5 ring-1 ring-[#EBD8F0] animate-pop-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#47335C] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#D96B9C]" />
                    원점수 · 과목평균 · 표준편차 → 상위 누적(%) 계산 도우미
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCalc(false)}
                    className="text-xs font-semibold text-[#7A6F8E] hover:text-[#231E33]"
                  >
                    닫기
                  </button>
                </div>
                <p className="mt-1 text-[11.5px] text-[#6A607E]">
                  성적표의 주요 과목 원점수·평균·표준편차를 넣으면 정규분포 Z점수로 상위 누적 %를 계산해 ②번 칸에 채워줘요.
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-[#6A607E]">내 원점수</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={rawScore}
                      onChange={(e) => setRawScore(e.target.value)}
                      className="mt-1 h-8 w-full rounded-xl bg-white/95 px-2 text-center text-xs font-bold text-[#231E33] ring-1 ring-[#E8D7EE] focus:outline-none focus:ring-2 focus:ring-[#D96B9C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-[#6A607E]">과목 평균</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={meanScore}
                      onChange={(e) => setMeanScore(e.target.value)}
                      className="mt-1 h-8 w-full rounded-xl bg-white/95 px-2 text-center text-xs font-bold text-[#231E33] ring-1 ring-[#E8D7EE] focus:outline-none focus:ring-2 focus:ring-[#D96B9C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-[#6A607E]">표준편차</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={stdDev}
                      onChange={(e) => setStdDev(e.target.value)}
                      className="mt-1 h-8 w-full rounded-xl bg-white/95 px-2 text-center text-xs font-bold text-[#231E33] ring-1 ring-[#E8D7EE] focus:outline-none focus:ring-2 focus:ring-[#D96B9C]"
                    />
                  </div>
                </div>
                {zResult && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white/90 px-3 py-2 ring-1 ring-[#EEDAF0]">
                    <div className="text-xs text-[#4C4261] tabular-nums">
                      Z점수 <strong>{zResult.z.toFixed(2)}</strong> → 추정 상위{' '}
                      <strong className="text-[#BD4F82]">{zResult.topPct.toFixed(1)}%</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCumText(zResult.topPct.toFixed(1));
                        setCumAutoSynced(false);
                        setShowCalc(false);
                      }}
                      className="rounded-xl bg-[#D96B9C] px-3 py-1 text-xs font-bold text-white transition hover:bg-[#C65B8B]"
                    >
                      ②번에 채우기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Explicit Apply / Search Action Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-0.5">
              <div className="flex items-center gap-2 text-[11.5px] text-[#6F6785]">
                <span>
                  ✨ 3개 숫자를 조정한 뒤 <strong className="text-[#231E33]">조회 버튼</strong>을 누르면 아래 판정이 한눈에 갱신돼요.
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  title="기본 성적(1.15 / 7.5% / 94.0%)으로 입력값 되돌리기"
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-2xl bg-[#F5F2FB] px-3 text-xs font-bold text-[#61577A] ring-1 ring-[#E6DFF4] transition hover:bg-[#ECE6F8] active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  기본값
                </button>
                <button
                  type="submit"
                  className={`flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl px-5 text-xs font-extrabold text-white transition active:scale-[0.98] ${
                    hasChanges
                      ? 'bg-gradient-to-r from-[#9582D1] via-[#B47EC5] to-[#DF7BA6] shadow-[0_8px_22px_-6px_rgba(180,126,197,0.65)] ring-2 ring-[#F7D3E4]'
                      : 'bg-gradient-to-r from-[#9E8DD4] to-[#CE7DA4] shadow-[0_6px_18px_-6px_rgba(158,141,212,0.5)] hover:brightness-[1.03]'
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                  {hasChanges ? '변경 성적으로 맞춤 판정 조회하기' : '맞춤 판정 조회하기'}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Conversion Reference Bottom Sheet Modal */}
      {showConvModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#231E33]/35 p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setShowConvModal(false)}
        >
          <div
            className="glass-sheet max-h-[85vh] w-full max-w-lg overflow-y-auto soft-scrollbar rounded-t-[28px] sm:rounded-[28px] p-5 ring-1 ring-[#EAE3F7] animate-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[#D9D0EC] sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAF8]">
              <div>
                <h3 className="text-base font-extrabold text-[#231E33]">
                  9등급제 ↔ 5등급제 누적 백분위(%) 환산표
                </h3>
                <p className="text-xs text-[#6F6785]">
                  과거 9등급제 ↔ 현 고1 5등급제 상위 누적(%) 대조 환산표 (엑셀 4번 시트 기준)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConvModal(false)}
                className="rounded-full bg-[#F5F2FB] p-1.5 text-[#7A6F93] hover:bg-[#ECE6F8]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-bold text-[#6D5AA8]">과거 9등급제 누적 비율</h4>
                <table className="w-full text-center text-xs tabular-nums border-collapse overflow-hidden rounded-xl">
                  <thead>
                    <tr className="bg-[#F3EEFC] text-[#56458C]">
                      <th className="py-1.5 px-2 rounded-tl-xl">등급</th>
                      <th className="py-1.5 px-2">구간(%)</th>
                      <th className="py-1.5 px-2 rounded-tr-xl">중앙(%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EEF9]">
                    {G9_TABLE.map((r) => (
                      <tr key={r.grade}>
                        <td className="py-1.5 font-bold text-[#231E33]">{r.grade}등급</td>
                        <td className="py-1.5 text-[#6F6785]">
                          {r.start}~{r.end}%
                        </td>
                        <td className="py-1.5 font-semibold text-[#7A67B8]">{r.mid.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="mb-2 text-xs font-bold text-[#BD4F82]">현 고1 5등급제 누적 비율</h4>
                  <table className="w-full text-center text-xs tabular-nums border-collapse overflow-hidden rounded-xl">
                    <thead>
                      <tr className="bg-[#FDF0F6] text-[#9E3C6B]">
                        <th className="py-1.5 px-2 rounded-tl-xl">등급</th>
                        <th className="py-1.5 px-2">구간(%)</th>
                        <th className="py-1.5 px-2 rounded-tr-xl">중앙(%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F6ECF2]">
                      {G5_TABLE.map((r) => (
                        <tr key={r.grade}>
                          <td className="py-1.5 font-bold text-[#231E33]">{r.grade}등급</td>
                          <td className="py-1.5 text-[#6F6785]">
                            {r.start}~{r.end}%
                          </td>
                          <td className="py-1.5 font-semibold text-[#BD4F82]">{r.mid.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-2xl bg-[#FEF8EC] p-3 text-[11.5px] leading-relaxed text-[#7F5415] ring-1 ring-[#F5DFB6]">
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
