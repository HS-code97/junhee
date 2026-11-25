import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Compass,
  BookOpenCheck,
  Download,
  Heart,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { EXCEL_DOWNLOAD_FILENAME, EXCEL_DOWNLOAD_URL } from '../lib/simulatorEngine';

interface IntroOnboardingProps {
  loading: boolean;
  loadProgress: number;
  totalRecords: number;
  skipNextTime: boolean;
  onToggleSkipNextTime: (val: boolean) => void;
  onStart: () => void;
}

export const IntroOnboarding: React.FC<IntroOnboardingProps> = ({
  loading,
  loadProgress,
  totalRecords,
  skipNextTime,
  onToggleSkipNextTime,
  onStart,
}) => {
  const [step, setStep] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const totalSteps = 4;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx < -45 && step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else if (dx > 45 && step > 0) {
      setStep((s) => s - 1);
    }
    setTouchStartX(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#F6F7FF] via-[#FAF8FF] to-[#FFF5F7] overflow-y-auto">
      {/* Subtle decorative ambient blobs */}
      <div className="pointer-events-none fixed -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-24 -left-24 h-72 w-72 rounded-full bg-rose-200/35 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-between px-5 pt-6 pb-6">
        {/* Top bar: brand + skip + loading status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold tracking-tight text-indigo-600 shadow-xs ring-1 ring-indigo-100">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              SURYEON&apos;S COMPASS 2029
            </span>
            {!loading && (
              <button
                type="button"
                onClick={onStart}
                className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-white/70 hover:text-slate-800"
              >
                건너뛰기
              </button>
            )}
          </div>

          {/* Data Loading Progress Bar */}
          <div className="rounded-2xl bg-white/80 px-3.5 py-2.5 shadow-xs ring-1 ring-slate-200/70 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                {loading ? (
                  <>
                    <span className="inline-block h-2 w-2 animate-ping rounded-full bg-indigo-500" />
                    서울 13개 대학 공식 입결 DB 불러오는 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    서울 13개교 · {totalRecords.toLocaleString()}건 공식 데이터 준비 완료
                  </>
                )}
              </span>
              <span className="tabular-nums font-bold text-indigo-600">{Math.round(loadProgress)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-400 transition-all duration-300"
                style={{ width: `${Math.max(8, loadProgress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Swipeable Onboarding Card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="my-4 flex-1 flex flex-col justify-center"
        >
          <div className="rounded-3xl bg-white/92 p-6 shadow-[0_12px_40px_-12px_rgba(79,70,229,0.14)] ring-1 ring-indigo-100/80 backdrop-blur-xl transition-all">
            {step === 0 && (
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-400 text-white shadow-md animate-float-slow">
                  <Heart className="h-6 w-6 fill-white/90" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-bold tracking-wide text-indigo-500">
                    2029학년도 대입 맞춤 입결 &amp; 전형 나침반
                  </p>
                  <h1 className="text-[22px] leading-snug font-extrabold tracking-tight text-slate-900">
                    수련이의 빛나는
                    <br />
                    스무 살 봄을 응원하며
                  </h1>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-indigo-50/70 via-violet-50/50 to-rose-50/70 p-4 ring-1 ring-indigo-100/60">
                  <p className="text-[13.5px] leading-relaxed text-slate-700">
                    &ldquo;2028 대입개편이라는 새로운 길 앞에서, 수련이가 흔들림 없이 자기만의 속도로 꿈을 그려갈 수 있도록 서울 13개 대학의 최근 3개년 공식 입결과 개편 계획을 하나하나 모아 담았어.&rdquo;
                  </p>
                  <p className="mt-2.5 text-right text-xs font-bold text-indigo-700">
                    — 동탄에서, 언제나 수련이 편인 아빠 준희가
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="rounded-xl bg-slate-50 px-2 py-2.5 ring-1 ring-slate-100">
                    <div className="text-sm font-extrabold text-slate-900 tabular-nums whitespace-nowrap">13개교</div>
                    <div className="text-[11px] text-slate-500 whitespace-nowrap">서울 주요 대학</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2 py-2.5 ring-1 ring-slate-100">
                    <div className="text-sm font-extrabold text-indigo-600 tabular-nums whitespace-nowrap">2024~26</div>
                    <div className="text-[11px] text-slate-500 whitespace-nowrap">3개년 공식 입결</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-2 py-2.5 ring-1 ring-slate-100">
                    <div className="text-sm font-extrabold text-rose-500 tabular-nums whitespace-nowrap">5등급·통합</div>
                    <div className="text-[11px] text-slate-500 whitespace-nowrap">2028 개편 맞춤</div>
                  </div>
                </div>

                <p className="text-center text-[11.5px] font-medium text-slate-400">
                  옆으로 넘기면 30초 만에 끝나는 사용법 안내가 이어져요 →
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <Compass className="h-5.5 w-5.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600">사용법 1 / 3 · 환산 원리</span>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                    과거 9등급제 입결을
                    <br />
                    현 고1 &lsquo;5등급제·누적 백분위&rsquo;로 연결해요
                  </h2>
                </div>
                <p className="text-[13px] leading-relaxed text-slate-600">
                  2024~2026 선배들의 입결은 <strong>9등급제</strong>지만, 수련이 학년(2029 대입)은 <strong>5등급제</strong>예요. 두 제도를 정확히 이어주는 열쇠는 <strong>상위 누적 백분위(%)</strong>입니다.
                </p>

                <div className="space-y-2.5 rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-200/70">
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] font-bold text-slate-600">
                      <span>과거 9등급제</span>
                      <span>1등급(4%) · 2등급(11%) · 3등급(23%)</span>
                    </div>
                    <div className="flex h-6 overflow-hidden rounded-lg text-[10px] font-bold text-white">
                      <div className="flex w-[16%] items-center justify-center bg-indigo-600">1등급 4%</div>
                      <div className="flex w-[24%] items-center justify-center bg-indigo-400">2등급 11%</div>
                      <div className="flex w-[30%] items-center justify-center bg-sky-400">3등급 23%</div>
                      <div className="flex flex-1 items-center justify-center bg-slate-300 text-slate-700">4~9등급</div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] font-bold text-indigo-700">
                      <span>현 고1 5등급제</span>
                      <span>1등급(상위 10%) · 2등급(상위 34%)</span>
                    </div>
                    <div className="flex h-6 overflow-hidden rounded-lg text-[10px] font-bold text-white">
                      <div className="flex w-[36%] items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-500">
                        1등급 (상위 10%)
                      </div>
                      <div className="flex w-[38%] items-center justify-center bg-violet-400">
                        2등급 (34%)
                      </div>
                      <div className="flex flex-1 items-center justify-center bg-slate-300 text-slate-700">3~5등급</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50/80 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-900 ring-1 ring-amber-200/70">
                  💡 <strong>핵심 포인트:</strong> 과거 9등급제 <strong>1.80등급</strong> 학과는 상위 약 <strong>6.4%</strong> 수준이라, 현 5등급제에서는 <strong>1등급(10% 이내)</strong> 안에서 승부가 갈려요!
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                  <SlidersHorizontal className="h-5.5 w-5.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-violet-600">사용법 2 / 3 · 내 성적 입력 팁</span>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                    내신 · 상위% · 모의백분위만 넣으면
                    <br />
                    1,854개 학과를 즉시 판정해요
                  </h2>
                </div>

                <div className="space-y-2 text-[12.5px]">
                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                    <div className="font-bold text-slate-900">① 5등급제 내신 평균 (1.00 ~ 5.00)</div>
                    <p className="mt-0.5 text-slate-600">학교 성적표의 5등급제 평균 등급을 입력해요.</p>
                  </div>
                  <div className="rounded-xl bg-violet-50/70 p-3 ring-1 ring-violet-200/80">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-violet-900">② 추정 상위 누적 백분위(%) [선택·강력추천]</span>
                      <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        계산기 내장
                      </span>
                    </div>
                    <p className="mt-1 text-violet-800 leading-relaxed">
                      비워두면 상위 10% 이내 학과들이 <strong className="underline">1등급내 경합</strong>으로 표시돼요. 내장된 <strong>[원점수·평균·표준편차 계산기]</strong>로 내 실제 상위 %를 넣으면 <strong>안정/적정/소신</strong>까지 정밀 진단됩니다!
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                    <div className="font-bold text-slate-900">③ 모의고사 국수탐 평균 백분위 (정시 비교용)</div>
                    <p className="mt-0.5 text-slate-600">
                      통합수능 개편으로 과거 환산점수 대신 <strong>3개년 국수탐 백분위 70%컷</strong>과 비교해 상대 위치를 알려줘요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <BookOpenCheck className="h-5.5 w-5.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600">사용법 3 / 3 · 200% 활용하기</span>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                    판정 배지 · 3개년 상세 바텀시트 ·
                    <br />
                    원본 엑셀까지 한곳에서!
                  </h2>
                </div>

                {/* Badges preview */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    안정 (여유 충분)
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                    적정 (합격권)
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                    소신 (도전권)
                  </span>
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                    상향
                  </span>
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-200">
                    1등급내 경합
                  </span>
                </div>

                <ul className="space-y-2 text-[12.5px] text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-indigo-600">•</span>
                    <span>
                      <strong>학과 카드 터치:</strong> 2024~2026 연도별 경쟁률·충원합격·50%컷과 해당 대학의 <strong>2028 개편 핵심 변화</strong>가 바텀시트로 열려요.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-rose-500">•</span>
                    <span>
                      <strong>♥ 관심학과 보관함:</strong> 눈여겨보는 학과에 하트를 눌러 나만의 목표 리스트를 만들 수 있어요.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-emerald-600">•</span>
                    <span>
                      <strong>하단 탭 &amp; 원본 엑셀 다운로드:</strong> 수시(4,396건)·정시(2,149건) 전체 원본 조회는 물론, PC에서 볼 수 있는 6시트 엑셀 파일도 바로 내려받을 수 있어요.
                    </span>
                  </li>
                </ul>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                    상단 <strong className="text-indigo-600">[사용법 ?]</strong> 버튼으로 언제든 다시 볼 수 있어요
                  </div>
                </div>
              </div>
            )}

            {/* Step Dots + Prev/Next mini controls */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </button>

              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`안내 ${idx + 1}페이지`}
                    onClick={() => setStep(idx)}
                    className={`h-2 rounded-full transition-all ${
                      step === idx ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              {step < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100"
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <a
                  href={EXCEL_DOWNLOAD_URL}
                  download={EXCEL_DOWNLOAD_FILENAME}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  엑셀받기
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA Area */}
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-center gap-2 text-xs font-medium text-slate-600 select-none">
            <input
              type="checkbox"
              checked={skipNextTime}
              onChange={(e) => onToggleSkipNextTime(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            다음 방문부터는 사용법 건너뛰고 바로 시뮬레이터 열기
          </label>

          <button
            type="button"
            disabled={loading}
            onClick={onStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 py-4 text-[15px] font-extrabold text-white shadow-[0_10px_25px_-6px_rgba(79,70,229,0.55)] transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? '입결 데이터 준비 중...' : '맞춤 시뮬레이터 시작하기'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
