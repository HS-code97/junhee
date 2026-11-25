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
  CornerDownRight,
} from 'lucide-react';
import type { StudentProfile } from '../types';
import {
  G5_TABLE,
  G9_TABLE,
  cumPctToGrade5,
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

  // Draft input values (applied when clicking "맞춤 판정 조회하기")
  const appliedCum = getEffectiveStudentCumPct(profile.grade5, profile.customCumPct);
  const [g5Text, setG5Text] = useState(profile.grade5.toFixed(2));
  const [cumText, setCumText] = useState(appliedCum.toFixed(1));
  const [mockText, setMockText] = useState(profile.mockPct.toFixed(1));

  // Sync draft when external profile changes
  useEffect(() => {
    const nextCum = getEffectiveStudentCumPct(profile.grade5, profile.customCumPct);
    setG5Text(profile.grade5.toFixed(2));
    setCumText(nextCum.toFixed(1));
    setMockText(profile.mockPct.toFixed(1));
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

  const hasChanges =
    Math.abs(parsedG5 - profile.grade5) > 0.001 ||
    Math.abs(parsedCum - appliedCum) > 0.05 ||
    Math.abs(parsedMock - profile.mockPct) > 0.05;

  // Direction 1: 5등급제 내신 평균 변경 -> 추정 상위 누적(%) 즉시 연동
  const applyGrade5Change = (nextVal: number) => {
    const nextG5 = clampGrade5(nextVal);
    const syncedCum = clampCumPct(grade5ToCumPct(nextG5));
    setG5Text(nextG5.toFixed(2));
    setCumText(syncedCum.toFixed(1));
  };

  const handleGrade5InputChange = (raw: string) => {
    setG5Text(raw);
    const num = parseFloat(raw);
    if (!Number.isNaN(num) && num >= 1 && num <= 5) {
      const syncedCum = clampCumPct(grade5ToCumPct(clampGrade5(num)));
      setCumText(syncedCum.toFixed(1));
    }
  };

  // Direction 2: 추정 상위 누적(%) 변경 -> 5등급제 내신 평균 즉시 역산 연동
  const applyCumPctChange = (nextVal: number) => {
    const nextCum = clampCumPct(nextVal);
    const syncedG5 = clampGrade5(cumPctToGrade5(nextCum));
    setCumText(nextCum.toFixed(1));
    setG5Text(syncedG5.toFixed(2));
  };

  const handleCumInputChange = (raw: string) => {
    setCumText(raw);
    const num = parseFloat(raw);
    if (!Number.isNaN(num) && num >= 0.1 && num <= 100) {
      const syncedG5 = clampGrade5(cumPctToGrade5(clampCumPct(num)));
      setG5Text(syncedG5.toFixed(2));
    }
  };

  const stepMockPct = (delta: number) => {
    const nextMock = clampMockPct(parsedMock + delta);
    setMockText(nextMock.toFixed(1));
  };

  const handleApplySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nextG5 = clampGrade5(parseFloat(g5Text) || profile.grade5);
    const nextCum = clampCumPct(parseFloat(cumText) || grade5ToCumPct(nextG5));
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
  };

  const zResult = estimateTopPctFromZScore(
    parseFloat(rawScore),
    parseFloat(meanScore),
    parseFloat(stdDev)
  );

  return (
    <>
      <section className="glass-card rounded-[24px] p-4 ring-1 ring-[#E6E4EE]">
        {/* Compact Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-center gap-2.5 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E4DBFA] text-[#1F1B2C]">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] font-extrabold text-[#1F1B2C]">내 성적 기준 입력</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    hasChanges
                      ? 'bg-[#FCEEF4] text-[#B53F74] ring-1 ring-[#F2C3D8]'
                      : 'bg-[#F2F1F7] text-[#5F5A70]'
                  }`}
                >
                  {hasChanges ? '수정됨 · 조회 버튼을 눌러주세요' : '현재 조회 적용 중'}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-[#5F5A70] tabular-nums">
                <span>
                  수시 5등급 내신 <strong className="text-[#6350A8]">{profile.grade5.toFixed(2)}등급</strong>
                  <span className="ml-1 text-[11px] text-[#7A748A]">(상위 {appliedCum.toFixed(1)}%)</span>
                </span>
                <span className="text-[#D4D1DF]">·</span>
                <span>
                  정시 모의 백분위 <strong className="text-[#22746A]">{profile.mockPct.toFixed(1)}</strong>
                </span>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowConvModal(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#F3F2F7] px-2.5 py-1.5 text-xs font-bold text-[#494459] ring-1 ring-[#E4E2EC] transition hover:bg-[#EAE8F2]"
            >
              <Table2 className="h-3.5 w-3.5 text-[#5F5A70]" />
              환산표
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#1F1B2C] px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#312B44]"
            >
              {expanded ? '접기' : '성적 수정'}
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded Input Controls — Clean 2-Column Layout (① 수시 내신+상위% 연동 / ② 정시 모의 백분위) */}
        {expanded && (
          <form onSubmit={handleApplySubmit} className="mt-4 space-y-3 border-t border-[#EFEFF4] pt-3.5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Card 1: ① 수시 — 5등급제 내신 평균 + 종속 연동된 추정 상위 누적(%) */}
              <div className="rounded-2xl bg-[#F6F5FA] p-3.5 ring-1 ring-[#E8E6F0] flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-[#EAE3FA] px-1.5 py-0.5 text-[10px] font-extrabold text-[#59469B]">
                        수시
                      </span>
                      <label className="text-xs font-extrabold text-[#1F1B2C]">
                        ① 5등급제 내신 평균
                      </label>
                    </div>
                    <span className="text-[10.5px] font-bold text-[#7A748A] tabular-nums">
                      1.00~5.00등급
                    </span>
                  </div>

                  {/* Primary Grade5 Control */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="내신 평균 0.05 감소"
                      onClick={() => applyGrade5Change(parsedG5 - 0.05)}
                      className="h-9 w-9 shrink-0 rounded-xl bg-white text-sm font-bold text-[#1F1B2C] ring-1 ring-[#DFDDE8] transition hover:bg-[#EFEFF4] active:scale-95"
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
                      onBlur={() => setG5Text(parsedG5.toFixed(2))}
                      className="h-9 w-full rounded-xl bg-white px-2 text-center text-[15px] font-extrabold text-[#1F1B2C] tabular-nums ring-1 ring-[#DFDDE8] focus:ring-2 focus:ring-[#1F1B2C] focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="내신 평균 0.05 증가"
                      onClick={() => applyGrade5Change(parsedG5 + 0.05)}
                      className="h-9 w-9 shrink-0 rounded-xl bg-white text-sm font-bold text-[#1F1B2C] ring-1 ring-[#DFDDE8] transition hover:bg-[#EFEFF4] active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subordinate Linked Row: 추정 상위 누적(%) — compact & bidirectionally synced */}
                <div className="rounded-xl bg-white/90 px-2.5 py-2 ring-1 ring-[#E8E6F0]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#5F5A70]">
                      <CornerDownRight className="h-3.5 w-3.5 text-[#6350A8] shrink-0" />
                      <span>추정 상위 누적(%)</span>
                      <span className="text-[10px] font-medium text-[#938DA3]">· 양방향 연동</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="상위 누적 0.5% 감소"
                        onClick={() => applyCumPctChange(parsedCum - 0.5)}
                        className="h-7 w-7 shrink-0 rounded-lg bg-[#F3F2F7] text-xs font-bold text-[#1F1B2C] transition hover:bg-[#EAE8F2] active:scale-95"
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
                        onChange={(e) => handleCumInputChange(e.target.value)}
                        onBlur={() => setCumText(parsedCum.toFixed(1))}
                        className="h-7 w-16 rounded-lg bg-[#F6F5FA] px-1.5 text-center text-xs font-extrabold text-[#6350A8] tabular-nums ring-1 ring-[#E2E0EC] focus:bg-white focus:ring-2 focus:ring-[#1F1B2C] focus:outline-none"
                      />
                      <button
                        type="button"
                        aria-label="상위 누적 0.5% 증가"
                        onClick={() => applyCumPctChange(parsedCum + 0.5)}
                        className="h-7 w-7 shrink-0 rounded-lg bg-[#F3F2F7] text-xs font-bold text-[#1F1B2C] transition hover:bg-[#EAE8F2] active:scale-95"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCalc((v) => !v)}
                        className={`ml-1 inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[10.5px] font-bold transition ${
                          showCalc
                            ? 'bg-[#1F1B2C] text-white'
                            : 'bg-[#F3F2F7] text-[#494459] hover:bg-[#EAE8F2]'
                        }`}
                      >
                        <Calculator className="h-3 w-3" />
                        Z계산기
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] text-[#8C879C]">
                    {parsedCum <= 5.0
                      ? '상위 5.0% 이내는 모두 5등급제 1.00등급 구간이며, 입력한 상위%로 정밀 판정됩니다.'
                      : '내신 평균 또는 상위 누적(%) 중 편한 쪽을 조정하면 다른 쪽이 자동 계산됩니다.'}
                  </div>
                </div>
              </div>

              {/* Card 2: ② 정시 — 모의고사 국수탐 백분위 */}
              <div className="rounded-2xl bg-[#F6F5FA] p-3.5 ring-1 ring-[#E8E6F0] flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-[#DFF2EE] px-1.5 py-0.5 text-[10px] font-extrabold text-[#22746A]">
                        정시
                      </span>
                      <label className="text-xs font-extrabold text-[#1F1B2C]">
                        ② 모의 국수탐 백분위
                      </label>
                    </div>
                    <span className="text-[10.5px] font-bold text-[#22746A] tabular-nums">
                      0~100 (높을수록 상위)
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="모의 백분위 0.5 감소"
                      onClick={() => stepMockPct(-0.5)}
                      className="h-9 w-9 shrink-0 rounded-xl bg-white text-sm font-bold text-[#1F1B2C] ring-1 ring-[#DFDDE8] transition hover:bg-[#EFEFF4] active:scale-95"
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
                      className="h-9 w-full rounded-xl bg-white px-2 text-center text-[15px] font-extrabold text-[#22746A] tabular-nums ring-1 ring-[#DFDDE8] focus:ring-2 focus:ring-[#1F1B2C] focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="모의 백분위 0.5 증가"
                      onClick={() => stepMockPct(0.5)}
                      className="h-9 w-9 shrink-0 rounded-xl bg-white text-sm font-bold text-[#1F1B2C] ring-1 ring-[#DFDDE8] transition hover:bg-[#EFEFF4] active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-white/90 px-3 py-2.5 ring-1 ring-[#E8E6F0] text-[11px] leading-relaxed text-[#5F5A70]">
                  <span className="font-bold text-[#22746A]">정시 비교 기준:</span> 2028 통합수능 개편에 맞춰 과거 3개년{' '}
                  <strong className="text-[#1F1B2C]">국수탐 평균 백분위 70%컷</strong>과 내 모의고사 백분위를 비교합니다.
                </div>
              </div>
            </div>

            {/* Optional Z-Score Top % Helper */}
            {showCalc && (
              <div className="rounded-2xl bg-[#F6F5FA] p-3.5 ring-1 ring-[#DFDDE8] animate-pop-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#1F1B2C] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#D45D92]" />
                    원점수 · 과목평균 · 표준편차 → 상위 누적(%) 계산 도우미
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCalc(false)}
                    className="text-xs font-semibold text-[#5F5A70] hover:text-[#1F1B2C]"
                  >
                    닫기
                  </button>
                </div>
                <p className="mt-1 text-[11.5px] text-[#5F5A70]">
                  성적표의 원점수·평균·표준편차를 넣으면 정규분포 Z점수로 상위 누적 %를 계산해 ①번 수시 기준에 바로 연동해 줘요.
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-[#5F5A70]">내 원점수</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={rawScore}
                      onChange={(e) => setRawScore(e.target.value)}
                      className="mt-1 h-8 w-full rounded-xl bg-white px-2 text-center text-xs font-bold text-[#1F1B2C] ring-1 ring-[#DFDDE8] focus:outline-none focus:ring-2 focus:ring-[#1F1B2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-[#5F5A70]">과목 평균</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={meanScore}
                      onChange={(e) => setMeanScore(e.target.value)}
                      className="mt-1 h-8 w-full rounded-xl bg-white px-2 text-center text-xs font-bold text-[#1F1B2C] ring-1 ring-[#DFDDE8] focus:outline-none focus:ring-2 focus:ring-[#1F1B2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-[#5F5A70]">표준편차</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={stdDev}
                      onChange={(e) => setStdDev(e.target.value)}
                      className="mt-1 h-8 w-full rounded-xl bg-white px-2 text-center text-xs font-bold text-[#1F1B2C] ring-1 ring-[#DFDDE8] focus:outline-none focus:ring-2 focus:ring-[#1F1B2C]"
                    />
                  </div>
                </div>
                {zResult && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-[#E6E4EE]">
                    <div className="text-xs text-[#494459] tabular-nums">
                      Z점수 <strong className="text-[#1F1B2C]">{zResult.z.toFixed(2)}</strong> → 추정 상위{' '}
                      <strong className="text-[#D45D92]">{zResult.topPct.toFixed(1)}%</strong>
                      <span className="ml-1.5 text-[11px] text-[#7A748A]">
                        (환산 {cumPctToGrade5(zResult.topPct).toFixed(2)}등급)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        applyCumPctChange(zResult.topPct);
                        setShowCalc(false);
                      }}
                      className="rounded-xl bg-[#D45D92] px-3 py-1 text-xs font-bold text-white transition hover:bg-[#BE4B7E]"
                    >
                      수시 기준에 적용
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Explicit Apply / Search Action Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-0.5">
              <div className="flex items-center gap-2 text-[11.5px] text-[#5F5A70]">
                <span>
                  수시·정시 성적을 조정한 뒤 <strong className="text-[#1F1B2C]">조회 버튼</strong>을 누르면 아래 판정이 갱신됩니다.
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  title="기본 성적(1.15등급 / 상위 7.5% / 모의 94.0)으로 되돌리기"
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[#F3F2F7] px-3 text-xs font-bold text-[#494459] ring-1 ring-[#E4E2EC] transition hover:bg-[#EAE8F2] active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  기본값
                </button>
                <button
                  type="submit"
                  className={`flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#D45D92] px-5 text-xs font-extrabold text-white transition hover:bg-[#BE4B7E] active:scale-[0.98] ${
                    hasChanges ? 'ring-2 ring-[#F2C3D8] shadow-sm' : ''
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1F1B2C]/35 p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setShowConvModal(false)}
        >
          <div
            className="glass-sheet max-h-[85vh] w-full max-w-lg overflow-y-auto soft-scrollbar rounded-t-[28px] sm:rounded-[28px] p-5 ring-1 ring-[#E6E4EE] animate-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[#D6D3E0] sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEFF4]">
              <div>
                <h3 className="text-base font-extrabold text-[#1F1B2C]">
                  9등급제 ↔ 5등급제 누적 백분위(%) 환산표
                </h3>
                <p className="text-xs text-[#5F5A70]">
                  과거 9등급제 ↔ 현 고1 5등급제 상위 누적(%) 대조 환산표 (엑셀 4번 시트 기준)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConvModal(false)}
                className="rounded-full bg-[#F3F2F7] p-1.5 text-[#5F5A70] hover:bg-[#EAE8F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-extrabold text-[#1F1B2C]">과거 9등급제 누적 비율</h4>
                <table className="w-full text-center text-xs tabular-nums border-collapse overflow-hidden rounded-xl ring-1 ring-[#E8E6F0]">
                  <thead>
                    <tr className="bg-[#F3F2F7] text-[#494459]">
                      <th className="py-1.5 px-2">등급</th>
                      <th className="py-1.5 px-2">구간(%)</th>
                      <th className="py-1.5 px-2">중앙(%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEFF4]">
                    {G9_TABLE.map((r) => (
                      <tr key={r.grade}>
                        <td className="py-1.5 font-bold text-[#1F1B2C]">{r.grade}등급</td>
                        <td className="py-1.5 text-[#5F5A70]">
                          {r.start}~{r.end}%
                        </td>
                        <td className="py-1.5 font-bold text-[#6350A8]">{r.mid.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="mb-2 text-xs font-extrabold text-[#1F1B2C]">현 고1 5등급제 누적 비율</h4>
                  <table className="w-full text-center text-xs tabular-nums border-collapse overflow-hidden rounded-xl ring-1 ring-[#E8E6F0]">
                    <thead>
                      <tr className="bg-[#E4DBFA] text-[#1F1B2C]">
                        <th className="py-1.5 px-2">등급</th>
                        <th className="py-1.5 px-2">구간(%)</th>
                        <th className="py-1.5 px-2">중앙(%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEFF4]">
                      {G5_TABLE.map((r) => (
                        <tr key={r.grade}>
                          <td className="py-1.5 font-bold text-[#1F1B2C]">{r.grade}등급</td>
                          <td className="py-1.5 text-[#5F5A70]">
                            {r.start}~{r.end}%
                          </td>
                          <td className="py-1.5 font-bold text-[#D45D92]">{r.mid.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-2xl bg-[#F6F5FA] p-3 text-[11.5px] leading-relaxed text-[#494459] ring-1 ring-[#E6E4EE]">
                  <strong className="text-[#1F1B2C]">판정 기준 요약</strong>
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
