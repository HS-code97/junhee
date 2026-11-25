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
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#F8F6FC] via-[#FCF8FC] to-[#FFF5F9] overflow-y-auto">
      {/* Subtle decorative pastel ambient blobs */}
      <div className="pointer-events-none fixed -top-24 -right-24 h-72 w-72 rounded-full bg-[#DFD2F8]/55 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#FBE0EC]/60 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-between px-5 pt-6 pb-6">
        {/* Top bar: brand + skip + loading status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold tracking-tight text-[#6A57A5] shadow-xs ring-1 ring-[#EAE3F7]">
              <Sparkles className="h-3.5 w-3.5 text-[#DF7BA6]" />
              SURYEON&apos;S COMPASS 2029
            </span>
            {!loading && (
              <button
                type="button"
                onClick={onStart}
                className="rounded-full px-3 py-1 text-xs font-semibold text-[#7D7494] transition hover:bg-white/80 hover:text-[#231E33]"
              >
                건너뛰기
              </button>
            )}
          </div>

          {/* Data Loading Progress Bar */}
          <div className="glass-card rounded-2xl px-3.5 py-2.5 ring-1 ring-[#EAE3F7]/90">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#4C4462] flex items-center gap-1.5">
                {loading ? (
                  <>
                    <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#D96B9C]" />
                    서울 13개 대학 공식 입결 DB 불러오는 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#42A896]" />
                    서울 13개교 · {totalRecords.toLocaleString()}건 공식 데이터 준비 완료
                  </>
                )}
              </span>
              <span className="tabular-nums font-bold text-[#7561B4]">{Math.round(loadProgress)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EFEBF9]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#A592DE] via-[#C989CB] to-[#E685B0] transition-all duration-300"
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
          <div className="glass-card rounded-[28px] p-6 ring-1 ring-[#EAE3F7] transition-all">
            {step === 0 && (
              <div className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C8B8F2] via-[#DCACE2] to-[#F3B0CE] text-white shadow-[0_8px_20px_-6px_rgba(180,126,197,0.5)] animate-float-slow">
                  <Heart className="h-6 w-6 fill-white/90" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-bold tracking-wide text-[#BD4F82]">
                    2029학년도 대입 맞춤 입결 &amp; 전형 나침반
                  </p>
                  <h1 className="text-[22px] leading-snug font-extrabold tracking-tight text-[#231E33]">
                    수련이의 빛나는
                    <br />
                    스무 살 봄을 응원하며
                  </h1>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-[#F6F1FE] via-[#FAF3FC] to-[#FDF2F7] p-4 ring-1 ring-[#EDDDF5]">
                  <p className="text-[13.5px] leading-relaxed text-[#4C4462]">
                    &ldquo;2028 대입개편이라는 새로운 길 앞에서, 수련이가 흔들림 없이 자기만의 속도로 꿈을 그려갈 수 있도록 서울 13개 대학의 최근 3개년 공식 입결과 개편 계획을 하나하나 모아 담았어.&rdquo;
                  </p>
                  <p className="mt-2.5 text-right text-xs font-bold text-[#7561B4]">
                    — 동탄에서, 언제나 수련이 편인 아빠 준희가
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="rounded-2xl bg-[#F8F6FD] px-2 py-2.5 ring-1 ring-[#EFEAF8]">
                    <div className="text-sm font-extrabold text-[#231E33] tabular-nums whitespace-nowrap">13개교</div>
                    <div className="text-[11px] text-[#7D7494] whitespace-nowrap">서울 주요 대학</div>
                  </div>
                  <div className="rounded-2xl bg-[#F5F1FD] px-2 py-2.5 ring-1 ring-[#E6DCF8]">
                    <div className="text-sm font-extrabold text-[#7561B4] tabular-nums whitespace-nowrap">2024~26</div>
                    <div className="text-[11px] text-[#7D7494] whitespace-nowrap">3개년 공식 입결</div>
                  </div>
                  <div className="rounded-2xl bg-[#FDF2F7] px-2 py-2.5 ring-1 ring-[#F5D6E6]">
                    <div className="text-sm font-extrabold text-[#BD4F82] tabular-nums whitespace-nowrap">5등급·통합</div>
                    <div className="text-[11px] text-[#7D7494] whitespace-nowrap">2028 개편 맞춤</div>
                  </div>
                </div>

                <p className="text-center text-[11.5px] font-medium text-[#9B93B0]">
                  옆으로 넘기면 30초 만에 끝나는 사용법 안내가 이어져요 →
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EEFC] text-[#7561B4] ring-1 ring-[#E4D9F7]">
                  <Compass className="h-5.5 w-5.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#7561B4]">사용법 1 / 3 · 환산 원리</span>
                  <h2 className="mt-1 text-lg font-extrabold text-[#231E33]">
                    과거 9등급제 입결을
                    <br />
                    현 고1 &lsquo;5등급제·누적 백분위&rsquo;로 연결해요
                  </h2>
                </div>
                <p className="text-[13px] leading-relaxed text-[#5F5678]">
                  2024~2026 선배들의 입결은 <strong>9등급제</strong>지만, 수련이 학년(2029 대입)은 <strong>5등급제</strong>예요. 두 제도를 정확히 이어주는 열쇠는 <strong>상위 누적 백분위(%)</strong>입니다.
                </p>

                <div className="space-y-2.5 rounded-2xl bg-[#F8F6FD] p-3.5 ring-1 ring-[#EFEAF8]">
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] font-bold text-[#5F5678]">
                      <span>과거 9등급제</span>
                      <span>1등급(4%) · 2등급(11%) · 3등급(23%)</span>
                    </div>
                    <div className="flex h-6 overflow-hidden rounded-xl text-[10px] font-bold text-white">
                      <div className="flex w-[16%] items-center justify-center bg-[#9785D1]">1등급 4%</div>
                      <div className="flex w-[24%] items-center justify-center bg-[#B5A5E3]">2등급 11%</div>
                      <div className="flex w-[30%] items-center justify-center bg-[#8CC5D9]">3등급 23%</div>
                      <div className="flex flex-1 items-center justify-center bg-[#E4DFEF] text-[#5C5374]">4~9등급</div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-[11px] font-bold text-[#BD4F82]">
                      <span>현 고1 5등급제</span>
                      <span>1등급(상위 10%) · 2등급(상위 34%)</span>
                    </div>
                    <div className="flex h-6 overflow-hidden rounded-xl text-[10px] font-bold text-white">
                      <div className="flex w-[36%] items-center justify-center bg-gradient-to-r from-[#A592DE] to-[#DF7BA6]">
                        1등급 (상위 10%)
                      </div>
                      <div className="flex w-[38%] items-center justify-center bg-[#E7A2C1]">
                        2등급 (34%)
                      </div>
                      <div className="flex flex-1 items-center justify-center bg-[#E4DFEF] text-[#5C5374]">3~5등급</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#FEF8EC] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#7F5415] ring-1 ring-[#F4DEB5]">
                  💡 <strong>핵심 포인트:</strong> 과거 9등급제 <strong>1.80등급</strong> 학과는 상위 약 <strong>6.4%</strong> 수준이라, 현 5등급제에서는 <strong>1등급(10% 이내)</strong> 안에서 승부가 갈려요!
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDF0F6] text-[#BD4F82] ring-1 ring-[#F5D6E6]">
                  <SlidersHorizontal className="h-5.5 w-5.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#BD4F82]">사용법 2 / 3 · 내 성적 입력 팁</span>
                  <h2 className="mt-1 text-lg font-extrabold text-[#231E33]">
                    3개 숫자를 넣고 조회 버튼을 누르면
                    <br />
                    1,854개 학과를 한눈에 판정해요
                  </h2>
                </div>

                <div className="space-y-2 text-[12.5px]">
                  <div className="rounded-xl bg-[#F6F2FE] p-3 ring-1 ring-[#E6DCF8]">
                    <div className="font-bold text-[#231E33]">① 5등급제 내신 평균 (1.00 ~ 5.00)</div>
                    <p className="mt-0.5 text-[#5F5678]">학교 성적표의 5등급제 평균 등급을 입력해요.</p>
                  </div>
                  <div className="rounded-xl bg-[#FDF2F7] p-3 ring-1 ring-[#F5D6E6]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#8E3560]">② 추정 상위 누적 백분위(%)</span>
                      <span className="rounded-full bg-[#D96B9C] px-2 py-0.5 text-[10px] font-bold text-white">
                        Z계산기 내장
                      </span>
                    </div>
                    <p className="mt-1 text-[#784A61] leading-relaxed">
                      내신 기준 보간값이 기본 채워져 있어요. 내장된 <strong>[Z계산기]</strong>로 내 실제 상위 %를 넣으면 <strong>안정/적정/소신</strong>까지 더 정밀하게 조회됩니다!
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#EEF8FA] p-3 ring-1 ring-[#D1EAF0]">
                    <div className="font-bold text-[#1F3A44]">③ 모의고사 국수탐 평균 백분위 (정시용)</div>
                    <p className="mt-0.5 text-[#4D6872]">
                      통합수능 개편으로 과거 환산점수 대신 <strong>3개년 국수탐 백분위 70%컷</strong>과 비교해 상대 위치를 알려줘요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9F7F3] text-[#287B6C] ring-1 ring-[#C2E7DC]">
                  <BookOpenCheck className="h-5.5 w-5.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#287B6C]">사용법 3 / 3 · 200% 활용하기</span>
                  <h2 className="mt-1 text-lg font-extrabold text-[#231E33]">
                    판정 배지 · 3개년 상세 바텀시트 ·
                    <br />
                    원본 엑셀까지 한곳에서!
                  </h2>
                </div>

                {/* Badges preview */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#E9F7F3] px-2.5 py-1 text-xs font-bold text-[#247366] ring-1 ring-[#BCE6DA]">
                    안정 (여유 충분)
                  </span>
                  <span className="rounded-full bg-[#EAF4FB] px-2.5 py-1 text-xs font-bold text-[#2D6A96] ring-1 ring-[#C5E0F3]">
                    적정 (합격권)
                  </span>
                  <span className="rounded-full bg-[#FEF6E6] px-2.5 py-1 text-xs font-bold text-[#9A6518] ring-1 ring-[#F5DDB0]">
                    소신 (도전권)
                  </span>
                  <span className="rounded-full bg-[#FDF0F5] px-2.5 py-1 text-xs font-bold text-[#B9467A] ring-1 ring-[#F4C8DC]">
                    상향
                  </span>
                </div>

                <ul className="space-y-2 text-[12.5px] text-[#5F5678]">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-[#8B7AC9]">•</span>
                    <span>
                      <strong>학과 카드 터치:</strong> 부드럽게 밀어 올릴 수 있는 글래스 <strong>바텀시트</strong>로 3개년 상세 입결과 2028 개편 변화를 확인해요.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-[#DF7BA6]">•</span>
                    <span>
                      <strong>♥ 관심학과 보관함:</strong> 눈여겨보는 학과에 하트를 눌러 나만의 목표 리스트를 만들 수 있어요.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-[#42A896]">•</span>
                    <span>
                      <strong>수시·정시 DB &amp; 원본 엑셀:</strong> 대학교 드롭다운 필터로 빠르게 검색하고 6시트 원본 엑셀도 내려받을 수 있어요.
                    </span>
                  </li>
                </ul>

                <div className="flex items-center justify-between rounded-2xl bg-[#F8F6FD] px-3.5 py-2.5 ring-1 ring-[#EAE3F7]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#4C4462]">
                    <AlertCircle className="h-4 w-4 text-[#8B7AC9] shrink-0" />
                    상단 <strong className="text-[#6D5AA8]">[사용법 ?]</strong> 버튼으로 언제든 다시 볼 수 있어요
                  </div>
                </div>
              </div>
            )}

            {/* Step Dots + Prev/Next mini controls */}
            <div className="mt-6 flex items-center justify-between border-t border-[#F0EBF9] pt-4">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#7D7494] transition hover:bg-[#F5F2FB] disabled:opacity-30"
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
                      step === idx ? 'w-6 bg-gradient-to-r from-[#9B89D6] to-[#DF7BA6]' : 'w-2 bg-[#E3DCEF] hover:bg-[#CFC4E6]'
                    }`}
                  />
                ))}
              </div>

              {step < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#F3EEFC] px-3 py-1.5 text-xs font-bold text-[#6A57A5] transition hover:bg-[#E8DFFA]"
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <a
                  href={EXCEL_DOWNLOAD_URL}
                  download={EXCEL_DOWNLOAD_FILENAME}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#E9F7F3] px-2.5 py-1.5 text-xs font-bold text-[#257466] transition hover:bg-[#DCF2EC]"
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
          <label className="flex cursor-pointer items-center justify-center gap-2 text-xs font-medium text-[#6F6785] select-none">
            <input
              type="checkbox"
              checked={skipNextTime}
              onChange={(e) => onToggleSkipNextTime(e.target.checked)}
              className="h-4 w-4 rounded border-[#D8D0EB] accent-[#8B7AC9]"
            />
            다음 방문부터는 사용법 건너뛰고 바로 시뮬레이터 열기
          </label>

          <button
            type="button"
            disabled={loading}
            onClick={onStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9582D1] via-[#B47EC5] to-[#DF7BA6] py-4 text-[15px] font-extrabold text-white shadow-[0_10px_26px_-6px_rgba(180,126,197,0.55)] transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? '입결 데이터 준비 중...' : '맞춤 시뮬레이터 시작하기'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
