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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F6F5F9] overflow-y-auto">
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-between px-5 pt-6 pb-6">
        {/* Top bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold tracking-tight text-[#1F1B2C] ring-1 ring-[#E6E4EE]">
              <Sparkles className="h-3.5 w-3.5 text-[#D45D92]" />
              SURYEON&apos;S COMPASS 2029
            </span>
            {!loading && (
              <button
                type="button"
                onClick={onStart}
                className="rounded-full px-3 py-1 text-xs font-semibold text-[#5F5A70] transition hover:bg-white hover:text-[#1F1B2C]"
              >
                건너뛰기
              </button>
            )}
          </div>

          {/* Data Loading Progress Bar — Flat solid fill */}
          <div className="glass-card rounded-2xl px-3.5 py-2.5 ring-1 ring-[#E6E4EE]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#494459] flex items-center gap-1.5">
                {loading ? (
                  <>
                    <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#D45D92]" />
                    서울 13개 대학 공식 입결 DB 불러오는 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2E9982]" />
                    서울 13개교 · {totalRecords.toLocaleString()}건 공식 데이터 준비 완료
                  </>
                )}
              </span>
              <span className="tabular-nums font-bold text-[#1F1B2C]">{Math.round(loadProgress)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EAE8F2]">
              <div
                className="h-full rounded-full bg-[#1F1B2C] transition-all duration-300"
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
          <div className="glass-card rounded-[26px] p-6 ring-1 ring-[#E6E4EE] transition-all">
            {step === 0 && (
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4DBFA] text-[#D45D92] animate-float-slow">
                  <Heart className="h-6 w-6 fill-[#D45D92]" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-bold tracking-wide text-[#D45D92]">
                    2029학년도 대입 맞춤 입결 &amp; 전형 나침반
                  </p>
                  <h1 className="text-[22px] leading-snug font-extrabold tracking-tight text-[#1F1B2C]">
                    수련이의 빛나는
                    <br />
                    스무 살 봄을 응원하며
                  </h1>
                </div>

                <div className="rounded-2xl bg-[#F6F5FA] p-4 ring-1 ring-[#E8E6F0]">
                  <p className="text-[13.5px] leading-relaxed text-[#494459]">
                    &ldquo;2028 대입개편이라는 새로운 길 앞에서, 수련이가 흔들림 없이 자기만의 속도로 꿈을 그려갈 수 있도록 서울 13개 대학의 최근 3개년 공식 입결과 개편 계획을 하나하나 모아 담았어.&rdquo;
                  </p>
                  <p className="mt-2.5 text-right text-xs font-bold text-[#1F1B2C]">
                    — 동탄에서, 언제나 수련이 편인 아빠 준희가
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="rounded-2xl bg-[#F6F5FA] px-2 py-2.5">
                    <div className="text-sm font-extrabold text-[#1F1B2C] tabular-nums whitespace-nowrap">13개교</div>
                    <div className="text-[11px] text-[#7A748A] whitespace-nowrap">서울 주요 대학</div>
                  </div>
                  <div className="rounded-2xl bg-[#F6F5FA] px-2 py-2.5">
                    <div className="text-sm font-extrabold text-[#1F1B2C] tabular-nums whitespace-nowrap">2024~26</div>
                    <div className="text-[11px] text-[#7A748A] whitespace-nowrap">3개년 공식 입결</div>
                  </div>
                  <div className="rounded-2xl bg-[#F6F5FA] px-2 py-2.5">
                    <div className="text-sm font-extrabold text-[#D45D92] tabular-nums whitespace-nowrap">5등급·통합</div>
                    <div className="text-[11px] text-[#7A748A] whitespace-nowrap">2028 개편 맞춤</div>
                  </div>
                </div>

                <p className="text-center text-[11.5px] font-medium text-[#938DA3]">
                  옆으로 넘기면 30초 만에 끝나는 사용법 안내가 이어져요 →
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E4DBFA] text-[#1F1B2C]">
                  <Compass className="h-5.5 w-5.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6350A8]">사용법 1 / 3 · 환산 원리</span>
                  <h2 className="mt-1 text-lg font-extrabold text-[#1F1B2C]">
                    과거 9등급제 입결을
                    <br />
                    현 고1 &lsquo;5등급제·누적 백분위&rsquo;로 연결해요
                  </h2>
                </div>
                <p className="text-[13px] leading-relaxed text-[#5F5A70]">
                  2024~2026 선배들의 입결은 <strong>9등급제</strong>지만, 수련이 학년(2029 대입)은 <strong>5등급제</strong>예요. 두 제도를 정확히 이어주는 열쇠는 <strong>상위 누적 백분위(%)</strong>입니다.
                </p>

                <div className="space-y-2.5 rounded-2xl bg-[#F6F5FA] p-3.5 ring-1 ring-[#E8E6F0]">
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] font-bold text-[#5F5A70]">
                      <span>과거 9등급제</span>
                      <span>1등급(4%) · 2등급(11%) · 3등급(23%)</span>
                    </div>
                    <div className="flex h-6 overflow-hidden rounded-xl text-[10px] font-bold text-white">
                      <div className="flex w-[16%] items-center justify-center bg-[#1F1B2C]">1등급 4%</div>
                      <div className="flex w-[24%] items-center justify-center bg-[#5F5A70]">2등급 11%</div>
                      <div className="flex w-[30%] items-center justify-center bg-[#938DA3]">3등급 23%</div>
                      <div className="flex flex-1 items-center justify-center bg-[#E4E2EC] text-[#494459]">4~9등급</div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] font-bold text-[#D45D92]">
                      <span>현 고1 5등급제</span>
                      <span>1등급(상위 10%) · 2등급(상위 34%)</span>
                    </div>
                    <div className="flex h-6 overflow-hidden rounded-xl text-[10px] font-bold text-white">
                      <div className="flex w-[36%] items-center justify-center bg-[#D45D92]">
                        1등급 (상위 10%)
                      </div>
                      <div className="flex w-[38%] items-center justify-center bg-[#E8A5C2] text-[#1F1B2C]">
                        2등급 (34%)
                      </div>
                      <div className="flex flex-1 items-center justify-center bg-[#E4E2EC] text-[#494459]">3~5등급</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#F6F5FA] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#494459] ring-1 ring-[#E6E4EE]">
                  💡 <strong className="text-[#1F1B2C]">핵심 포인트:</strong> 과거 9등급제 <strong>1.80등급</strong> 학과는 상위 약 <strong>6.4%</strong> 수준이라, 현 5등급제에서는 <strong>1등급(10% 이내)</strong> 안에서 승부가 갈려요!
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E4DBFA] text-[#1F1B2C]">
                  <SlidersHorizontal className="h-5.5 w-5.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6350A8]">사용법 2 / 3 · 내 성적 입력 팁</span>
                  <h2 className="mt-1 text-lg font-extrabold text-[#1F1B2C]">
                    3개 숫자를 넣고 조회 버튼을 누르면
                    <br />
                    1,854개 학과를 한눈에 판정해요
                  </h2>
                </div>

                <div className="space-y-2 text-[12.5px]">
                  <div className="rounded-xl bg-[#F6F5FA] p-3">
                    <div className="font-bold text-[#1F1B2C]">① 5등급제 내신 평균 (1.00 ~ 5.00)</div>
                    <p className="mt-0.5 text-[#5F5A70]">내신 평균을 바꾸면 ②번 추정 상위 누적(%)도 자동으로 연동됩니다.</p>
                  </div>
                  <div className="rounded-xl bg-[#F6F5FA] p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F1B2C]">② 추정 상위 누적 백분위(%)</span>
                      <span className="rounded-full bg-[#1F1B2C] px-2 py-0.5 text-[10px] font-bold text-white">
                        Z계산기 내장
                      </span>
                    </div>
                    <p className="mt-1 text-[#5F5A70] leading-relaxed">
                      1등급(상위 10%) 안에서 더 정밀하게 보고 싶을 때 <strong>[Z계산기]</strong>나 직접 입력으로 미세 조정할 수 있어요.
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F6F5FA] p-3">
                    <div className="font-bold text-[#1F1B2C]">③ 모의고사 국수탐 평균 백분위 (정시용)</div>
                    <p className="mt-0.5 text-[#5F5A70]">
                      통합수능 개편으로 과거 환산점수 대신 <strong>3개년 국수탐 백분위 70%컷</strong>과 비교해 상대 위치를 알려줘요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E4DBFA] text-[#1F1B2C]">
                  <BookOpenCheck className="h-5.5 w-5.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6350A8]">사용법 3 / 3 · 200% 활용하기</span>
                  <h2 className="mt-1 text-lg font-extrabold text-[#1F1B2C]">
                    판정 배지 · 3개년 상세 바텀시트 ·
                    <br />
                    원본 엑셀까지 한곳에서!
                  </h2>
                </div>

                {/* Badges preview */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#E8F6F1] px-2.5 py-1 text-xs font-bold text-[#1D6E5C] ring-1 ring-[#BEE4D7]">
                    안정 (여유 충분)
                  </span>
                  <span className="rounded-full bg-[#EBF3FC] px-2.5 py-1 text-xs font-bold text-[#245D94] ring-1 ring-[#C3DBF4]">
                    적정 (합격권)
                  </span>
                  <span className="rounded-full bg-[#FDF5E4] px-2.5 py-1 text-xs font-bold text-[#8F5B10] ring-1 ring-[#F2D7A4]">
                    소신 (도전권)
                  </span>
                  <span className="rounded-full bg-[#FCEEF4] px-2.5 py-1 text-xs font-bold text-[#B53F74] ring-1 ring-[#F2C3D8]">
                    상향
                  </span>
                </div>

                <ul className="space-y-2 text-[12.5px] text-[#5F5A70]">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-[#1F1B2C]">•</span>
                    <span>
                      <strong className="text-[#1F1B2C]">학과 카드 터치:</strong> 부드럽게 밀어 올릴 수 있는 <strong>바텀시트</strong>로 3개년 상세 입결과 2028 개편 변화를 확인해요.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-[#D45D92]">•</span>
                    <span>
                      <strong className="text-[#1F1B2C]">♥ 관심학과 보관함:</strong> 눈여겨보는 학과에 하트를 눌러 나만의 목표 리스트를 만들 수 있어요.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-[#1F1B2C]">•</span>
                    <span>
                      <strong className="text-[#1F1B2C]">수시·정시 DB &amp; 원본 엑셀:</strong> 대학교 드롭다운 필터로 빠르게 검색하고 6시트 원본 엑셀도 내려받을 수 있어요.
                    </span>
                  </li>
                </ul>

                <div className="flex items-center justify-between rounded-2xl bg-[#F6F5FA] px-3.5 py-2.5 ring-1 ring-[#E6E4EE]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#494459]">
                    <AlertCircle className="h-4 w-4 text-[#5F5A70] shrink-0" />
                    상단 <strong className="text-[#1F1B2C]">[사용법 ?]</strong> 버튼으로 언제든 다시 볼 수 있어요
                  </div>
                </div>
              </div>
            )}

            {/* Step Dots + Prev/Next controls */}
            <div className="mt-6 flex items-center justify-between border-t border-[#EFEFF4] pt-4">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#5F5A70] transition hover:bg-[#F3F2F7] disabled:opacity-30"
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
                      step === idx ? 'w-6 bg-[#1F1B2C]' : 'w-2 bg-[#DFDDE8] hover:bg-[#BDB8CC]'
                    }`}
                  />
                ))}
              </div>

              {step < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#1F1B2C] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#312B44]"
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <a
                  href={EXCEL_DOWNLOAD_URL}
                  download={EXCEL_DOWNLOAD_FILENAME}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#F3F2F7] px-2.5 py-1.5 text-xs font-bold text-[#1F1B2C] ring-1 ring-[#E4E2EC] transition hover:bg-[#EAE8F2]"
                >
                  <Download className="h-3.5 w-3.5" />
                  엑셀받기
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA Area — Solid Rose Pink */}
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-center gap-2 text-xs font-medium text-[#5F5A70] select-none">
            <input
              type="checkbox"
              checked={skipNextTime}
              onChange={(e) => onToggleSkipNextTime(e.target.checked)}
              className="h-4 w-4 rounded border-[#D4D1DF] accent-[#1F1B2C]"
            />
            다음 방문부터는 사용법 건너뛰고 바로 시뮬레이터 열기
          </label>

          <button
            type="button"
            disabled={loading}
            onClick={onStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D45D92] py-4 text-[15px] font-extrabold text-white shadow-sm transition hover:bg-[#BE4B7E] active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? '입결 데이터 준비 중...' : '맞춤 시뮬레이터 시작하기'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
