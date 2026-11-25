import React, { useMemo, useRef, useState } from 'react';
import {
  Search,
  Heart,
  AlertTriangle,
  ChevronRight,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import type {
  JeongsiJudgment,
  JeongsiSimRow,
  StudentProfile,
  SusiJudgment,
  SusiSimRow,
} from '../types';
import {
  JUDGMENT_STYLES,
  UNIV_THEMES,
  evaluateJeongsiJudgment,
  evaluateSusiJudgment,
  getEffectiveStudentCumPct,
} from '../lib/simulatorEngine';
import { ScoreControlPanel } from './ScoreControlPanel';
import type { SelectedDetailTarget } from './DeptDetailSheet';

interface SimulatorTabProps {
  universities: string[];
  susiSim: SusiSimRow[];
  jeongsiSim: JeongsiSimRow[];
  profile: StudentProfile;
  onChangeProfile: (p: StudentProfile) => void;
  favorites: Set<string>;
  onToggleFavorite: (favKey: string) => void;
  onSelectDetail: (target: SelectedDetailTarget) => void;
}

export function makeSusiFavKey(r: { u: string; adm: string; d: string }) {
  return `susi|${r.u}|${r.adm}|${r.d}`;
}

export function makeJeongsiFavKey(r: { u: string; gun: string; adm: string; d: string }) {
  return `jeongsi|${r.u}|${r.gun}|${r.adm}|${r.d}`;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  universities,
  susiSim,
  jeongsiSim,
  profile,
  onChangeProfile,
  favorites,
  onToggleFavorite,
  onSelectDetail,
}) => {
  const [mode, setMode] = useState<'susi' | 'jeongsi'>('susi');
  const [univFilter, setUnivFilter] = useState<string>('전체');
  const [trackFilter, setTrackFilter] = useState<string>('전체');
  const [typeFilter, setTypeFilter] = useState<string>('전체'); // 교과|종합|논술
  const [gunFilter, setGunFilter] = useState<string>('전체'); // 가|나|다
  const [judgmentFilter, setJudgmentFilter] = useState<string>('전체');
  const [onlyFavs, setOnlyFavs] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'fit' | 'cutHigh' | 'cutLow' | 'univ'>('fit');
  const [visibleCount, setVisibleCount] = useState<number>(36);

  // Explicit lookup visual feedback
  const [pulseKey, setPulseKey] = useState<number>(0);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);
  const resultAnchorRef = useRef<HTMLDivElement | null>(null);
  const bannerTimerRef = useRef<number | null>(null);

  const effectivePct = getEffectiveStudentCumPct(profile.grade5, profile.customCumPct);

  // Reset pagination when filters change
  const resetPage = () => setVisibleCount(36);

  const handleApplyProfile = (next: StudentProfile) => {
    onChangeProfile(next);
    setPulseKey((k) => k + 1);
    resetPage();

    const nextEff = getEffectiveStudentCumPct(next.grade5, next.customCumPct);
    setAppliedBanner(
      `5등급 내신 ${next.grade5.toFixed(2)}등급 · 상위 ${nextEff.toFixed(1)}% · 모의 백분위 ${next.mockPct.toFixed(1)} 기준으로 판정을 새로 조회했어요!`
    );

    if (bannerTimerRef.current) {
      window.clearTimeout(bannerTimerRef.current);
    }
    bannerTimerRef.current = window.setTimeout(() => {
      setAppliedBanner(null);
    }, 4500);

    // Smoothly bring the judgment summary into view if scrolled above it on mobile
    if (resultAnchorRef.current) {
      const rect = resultAnchorRef.current.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.65 || rect.top < 64) {
        resultAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Enrich Susi rows with live judgment
  const susiEvaluated = useMemo(() => {
    return susiSim.map((r) => {
      const judgment = evaluateSusiJudgment(
        r.reqPct,
        profile.grade5,
        profile.customCumPct,
        effectivePct
      );
      const diffPct = r.reqPct !== null ? r.reqPct - effectivePct : null;
      return { ...r, judgment, diffPct, favKey: makeSusiFavKey(r) };
    });
  }, [susiSim, profile.grade5, profile.customCumPct, effectivePct]);

  // Enrich Jeongsi rows with live judgment
  const jeongsiEvaluated = useMemo(() => {
    return jeongsiSim.map((r) => {
      const judgment = evaluateJeongsiJudgment(r.avg, profile.mockPct);
      const diffPct = r.avg !== null ? profile.mockPct - r.avg : null;
      return { ...r, judgment, diffPct, favKey: makeJeongsiFavKey(r) };
    });
  }, [jeongsiSim, profile.mockPct]);

  // Base filtered (before judgment chip filter) so judgment chip counts reflect Univ/Track/Type/Search filters
  const qNorm = query.trim().toLowerCase();

  const susiBaseFiltered = useMemo(() => {
    return susiEvaluated.filter((r) => {
      if (onlyFavs && !favorites.has(r.favKey)) return false;
      if (univFilter !== '전체' && r.u !== univFilter) return false;
      if (trackFilter !== '전체' && r.tr !== trackFilter) return false;
      if (typeFilter !== '전체' && r.t !== typeFilter) return false;
      if (
        qNorm &&
        !r.d.toLowerCase().includes(qNorm) &&
        !r.u.toLowerCase().includes(qNorm) &&
        !r.adm.toLowerCase().includes(qNorm)
      ) {
        return false;
      }
      return true;
    });
  }, [susiEvaluated, onlyFavs, favorites, univFilter, trackFilter, typeFilter, qNorm]);

  const jeongsiBaseFiltered = useMemo(() => {
    return jeongsiEvaluated.filter((r) => {
      if (onlyFavs && !favorites.has(r.favKey)) return false;
      if (univFilter !== '전체' && r.u !== univFilter) return false;
      if (trackFilter !== '전체' && r.tr !== trackFilter) return false;
      if (gunFilter !== '전체' && r.gun !== gunFilter) return false;
      if (
        qNorm &&
        !r.d.toLowerCase().includes(qNorm) &&
        !r.u.toLowerCase().includes(qNorm) &&
        !r.adm.toLowerCase().includes(qNorm)
      ) {
        return false;
      }
      return true;
    });
  }, [jeongsiEvaluated, onlyFavs, favorites, univFilter, trackFilter, gunFilter, qNorm]);

  // Judgment counts
  const judgmentCounts = useMemo(() => {
    const counts: Record<string, number> = {
      전체: mode === 'susi' ? susiBaseFiltered.length : jeongsiBaseFiltered.length,
      안정: 0,
      적정: 0,
      소신: 0,
      상향: 0,
      '참고(1등급내 경합)': 0,
    };
    const list = mode === 'susi' ? susiBaseFiltered : jeongsiBaseFiltered;
    for (const item of list) {
      counts[item.judgment] = (counts[item.judgment] || 0) + 1;
    }
    return counts;
  }, [mode, susiBaseFiltered, jeongsiBaseFiltered]);

  // Final filtered + sorted list
  const finalSusiList = useMemo(() => {
    const arr =
      judgmentFilter === '전체'
        ? [...susiBaseFiltered]
        : susiBaseFiltered.filter((r) => r.judgment === judgmentFilter);

    const rankOrder: Record<SusiJudgment, number> = {
      적정: 0,
      안정: 1,
      소신: 2,
      '참고(1등급내 경합)': 3,
      상향: 4,
      '참고(컷미공개)': 5,
    };

    arr.sort((a, b) => {
      if (sortBy === 'fit') {
        const ra = rankOrder[a.judgment] ?? 9;
        const rb = rankOrder[b.judgment] ?? 9;
        if (ra !== rb) return ra - rb;
        return Math.abs(a.diffPct ?? 99) - Math.abs(b.diffPct ?? 99);
      }
      if (sortBy === 'cutHigh') {
        return (a.avg ?? 99) - (b.avg ?? 99);
      }
      if (sortBy === 'cutLow') {
        return (b.avg ?? -1) - (a.avg ?? -1);
      }
      return a.id - b.id;
    });
    return arr;
  }, [susiBaseFiltered, judgmentFilter, sortBy]);

  const finalJeongsiList = useMemo(() => {
    const arr =
      judgmentFilter === '전체'
        ? [...jeongsiBaseFiltered]
        : jeongsiBaseFiltered.filter((r) => r.judgment === judgmentFilter);

    const rankOrder: Record<JeongsiJudgment, number> = {
      적정: 0,
      안정: 1,
      소신: 2,
      상향: 3,
      '참고(미공개)': 4,
    };

    arr.sort((a, b) => {
      if (sortBy === 'fit') {
        const ra = rankOrder[a.judgment] ?? 9;
        const rb = rankOrder[b.judgment] ?? 9;
        if (ra !== rb) return ra - rb;
        return Math.abs(a.diffPct ?? 99) - Math.abs(b.diffPct ?? 99);
      }
      if (sortBy === 'cutHigh') {
        return (b.avg ?? -1) - (a.avg ?? -1);
      }
      if (sortBy === 'cutLow') {
        return (a.avg ?? 999) - (b.avg ?? 999);
      }
      return a.id - b.id;
    });
    return arr;
  }, [jeongsiBaseFiltered, judgmentFilter, sortBy]);

  const favCountInMode = useMemo(() => {
    const prefix = mode === 'susi' ? 'susi|' : 'jeongsi|';
    let c = 0;
    favorites.forEach((k) => {
      if (k.startsWith(prefix)) c += 1;
    });
    return c;
  }, [favorites, mode]);

  const judgmentChips = useMemo(() => {
    if (mode === 'jeongsi') {
      return [
        { key: '전체', label: '전체' },
        { key: '적정', label: '적정' },
        { key: '안정', label: '안정' },
        { key: '소신', label: '소신' },
        { key: '상향', label: '상향' },
      ];
    }
    const base = [
      { key: '전체', label: '전체' },
      { key: '적정', label: '적정' },
      { key: '안정', label: '안정' },
      { key: '소신', label: '소신' },
      { key: '상향', label: '상향' },
    ];
    if ((judgmentCounts['참고(1등급내 경합)'] ?? 0) > 0) {
      base.splice(4, 0, { key: '참고(1등급내 경합)', label: '1등급내 경합' });
    }
    return base;
  }, [mode, judgmentCounts]);

  const activeTotal = mode === 'susi' ? finalSusiList.length : finalJeongsiList.length;

  return (
    <div className="space-y-4">
      {/* 0. Soft Pastel Hero Banner (inspired by reference image's top lavender card) */}
      <div className="rounded-[26px] bg-gradient-to-r from-[#E6DCFB] via-[#DFD3F8] to-[#F3E1F5] px-5 py-4 text-[#231E33] shadow-[0_8px_24px_-12px_rgba(142,120,204,0.3)] ring-1 ring-white/75">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-0.5 text-[10.5px] font-bold text-[#6A57A5]">
              <Sparkles className="h-3 w-3 text-[#D96B9C]" />
              2029학년도 현 고1 맞춤 시뮬레이터
            </span>
            <h2 className="mt-1 text-[17px] sm:text-lg font-extrabold tracking-tight text-[#231E33]">
              내 성적으로 서울 13개교 한눈에 판정하기
            </h2>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right text-[11px] font-bold text-[#5C507D] tabular-nums">
            <span className="rounded-xl bg-white/65 px-2.5 py-1">
              수시 {susiSim.length.toLocaleString()} · 정시 {jeongsiSim.length.toLocaleString()}
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs font-medium text-[#5A4F78]">
          아래 3개 성적을 입력하고 <strong>[맞춤 판정 조회하기]</strong>를 누르면 안정·적정·소신·상향 결과를 바로 확인할 수 있어요.
        </p>
      </div>

      {/* 1. Student Score Input Card */}
      <ScoreControlPanel profile={profile} onApply={handleApplyProfile} />

      {/* Lookup Confirmation Banner (animates on each click of 조회하기) */}
      {appliedBanner && (
        <div
          key={`banner-${pulseKey}`}
          className="flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#F5EEFC] via-[#FDF0F6] to-[#EEF8FA] px-4 py-2.5 text-xs font-bold text-[#3C2F59] ring-1 ring-[#E5D4F0] shadow-xs animate-pop-in"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D46A9A]" />
            {appliedBanner}
          </span>
          <button
            type="button"
            onClick={() => setAppliedBanner(null)}
            aria-label="안내 닫기"
            className="text-[#8E82A6] hover:text-[#231E33]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Mode Switcher: 수시 vs 정시 */}
      <div
        ref={resultAnchorRef}
        className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#EFEAF8]/90 p-1.5 ring-1 ring-[#E4DCF3]"
      >
        <button
          type="button"
          onClick={() => {
            setMode('susi');
            setJudgmentFilter('전체');
            resetPage();
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-extrabold transition ${
            mode === 'susi'
              ? 'bg-white text-[#6753A4] shadow-xs ring-1 ring-[#E6DDF7]'
              : 'text-[#6F6785] hover:text-[#231E33]'
          }`}
        >
          수시 맞춤 판정
          <span className="rounded-full bg-[#F3EEFC] px-2 py-0.5 text-[11px] font-bold text-[#7A67B8] tabular-nums">
            {susiSim.length.toLocaleString()}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('jeongsi');
            if (judgmentFilter === '참고(1등급내 경합)') setJudgmentFilter('전체');
            resetPage();
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-extrabold transition ${
            mode === 'jeongsi'
              ? 'bg-white text-[#296D7D] shadow-xs ring-1 ring-[#D2EBF1]'
              : 'text-[#6F6785] hover:text-[#231E33]'
          }`}
        >
          정시 맞춤 판정
          <span className="rounded-full bg-[#E9F5F8] px-2 py-0.5 text-[11px] font-bold text-[#2F7888] tabular-nums">
            {jeongsiSim.length.toLocaleString()}
          </span>
        </button>
      </div>

      {/* Susi 9-grade vs 5-grade Notation Guide Banner / Jeongsi CSAT Notice Banner */}
      {mode === 'susi' ? (
        <div className="flex items-start gap-2.5 rounded-2xl bg-[#F5F1FD]/90 px-4 py-2.5 text-xs leading-relaxed text-[#4C3F73] ring-1 ring-[#E5DCF8]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8674C4]" />
          <div>
            <strong>등급 표기 안내:</strong> 학과 카드의 등급은 <strong>과거 선배들의 9등급제</strong> 입결이며, 이를 <strong>전교 상위 누적(% · 낮을수록 상위)</strong>으로 환산해 현 고1(5등급제) 성적과 비교합니다.
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-2xl bg-[#FEF8EC]/95 px-4 py-3 text-xs leading-relaxed text-[#7F5415] ring-1 ring-[#F4DEB5]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D8942B]" />
          <div>
            <strong>2028 통합수능 개편 안내:</strong> 선택과목 폐지·통합수능 도입으로 과거 대학별 환산점수는 직접 비교할 수 없어요.{' '}
            <strong>3개년 국수탐 평균 백분위(70%컷 · 100에 가까울수록 상위)</strong> 기준 상대 위치 참고용으로 활용해 주세요.
          </div>
        </div>
      )}

      {/* 3. Filter & Search Box (pulses subtly when lookup is applied) */}
      <div
        key={`panel-${pulseKey}`}
        className={`glass-card space-y-2.5 rounded-[26px] p-3.5 ring-1 ring-[#EAE3F7]/90 ${
          pulseKey > 0 ? 'animate-result-pulse' : ''
        }`}
      >
        {/* Search + Favorites Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9B93B0]" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder="학과명, 대학명, 전형명 검색 (예: 컴퓨터, 의예, 자유전공)"
              className="h-10 w-full rounded-2xl bg-[#F7F5FC] pr-8 pl-9 text-xs font-semibold text-[#231E33] placeholder:font-normal placeholder:text-[#9B93B0] ring-1 ring-[#E8E2F4] focus:bg-white focus:ring-2 focus:ring-[#B3A1E3] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => {
                  setQuery('');
                  resetPage();
                }}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#9B93B0] hover:text-[#4C4462]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOnlyFavs((v) => !v);
              resetPage();
            }}
            className={`inline-flex h-10 shrink-0 items-center gap-1 rounded-2xl px-3 text-xs font-bold ring-1 transition ${
              onlyFavs
                ? 'bg-[#D96B9C] text-white ring-[#D96B9C]'
                : 'bg-[#FDF0F6] text-[#BD4F82] ring-[#F4CCE0] hover:bg-[#FBE4EF]'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${onlyFavs ? 'fill-white' : 'fill-[#E488B2]'}`} />
            관심 {favCountInMode}
          </button>
        </div>

        {/* Judgment Live Count Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {judgmentChips.map((chip) => {
            const cnt = judgmentCounts[chip.key] ?? 0;
            const active = judgmentFilter === chip.key;
            const st = JUDGMENT_STYLES[chip.key];
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  setJudgmentFilter(chip.key);
                  resetPage();
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'bg-[#2C2540] text-white shadow-xs'
                    : st
                      ? `${st.bg} ${st.text} ring-1 ${st.ring}`
                      : 'bg-[#F3F0FA] text-[#534A6C]'
                }`}
              >
                {st && !active && <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />}
                {chip.label}
                <span className="tabular-nums opacity-85">{cnt.toLocaleString()}</span>
              </button>
            );
          })}
        </div>

        {/* University Horizontal Chips (kept in Simulator tab per user instruction) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['전체', ...universities].map((u) => {
            const active = univFilter === u;
            return (
              <button
                key={u}
                type="button"
                onClick={() => {
                  setUnivFilter(u);
                  resetPage();
                }}
                className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                  active
                    ? 'bg-[#8B7AC9] text-white shadow-2xs'
                    : 'bg-[#F4F1FA] text-[#5F5678] hover:bg-[#EAE4F7]'
                }`}
              >
                {u}
              </button>
            );
          })}
        </div>

        {/* Sub-filters: Track + Type/Gun + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#F0EBF9]">
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="희망 계열 선택"
              value={trackFilter}
              onChange={(e) => {
                setTrackFilter(e.target.value);
                resetPage();
              }}
              className="rounded-xl bg-[#F5F2FB] px-2.5 py-1.5 text-xs font-bold text-[#4C4462] ring-1 ring-[#E8E2F4] focus:outline-none"
            >
              <option value="전체">계열: 전체</option>
              <option value="인문">인문계열</option>
              <option value="자연">자연계열</option>
              <option value="자유전공">자유전공·무전공</option>
              <option value="예체능">예체능</option>
            </select>

            {mode === 'susi' ? (
              <select
                aria-label="수시 전형유형 선택"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  resetPage();
                }}
                className="rounded-xl bg-[#F5F2FB] px-2.5 py-1.5 text-xs font-bold text-[#4C4462] ring-1 ring-[#E8E2F4] focus:outline-none"
              >
                <option value="전체">전형: 전체</option>
                <option value="교과">학생부교과</option>
                <option value="종합">학생부종합</option>
                <option value="논술">논술전형</option>
              </select>
            ) : (
              <select
                aria-label="정시 모집군 선택"
                value={gunFilter}
                onChange={(e) => {
                  setGunFilter(e.target.value);
                  resetPage();
                }}
                className="rounded-xl bg-[#F5F2FB] px-2.5 py-1.5 text-xs font-bold text-[#4C4462] ring-1 ring-[#E8E2F4] focus:outline-none"
              >
                <option value="전체">모집군: 전체</option>
                <option value="가">가군</option>
                <option value="나">나군</option>
                <option value="다">다군</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#9B93B0]" />
            <select
              aria-label="정렬 기준"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl bg-[#F5F2FB] px-2.5 py-1.5 text-xs font-bold text-[#4C4462] ring-1 ring-[#E8E2F4] focus:outline-none"
            >
              <option value="fit">내 성적 적합순</option>
              <option value="cutHigh">입결 높은순</option>
              <option value="cutLow">입결 여유순</option>
              <option value="univ">대학 기본순</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result Count Caption + Applied Criteria Pill */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-1 text-xs text-[#6F6785]">
        <span className="flex items-center gap-1.5">
          조회 결과 <strong className="text-[#231E33] tabular-nums">{activeTotal.toLocaleString()}</strong>개 모집단위
          <span className="rounded-full bg-[#F3EEFC] px-2 py-0.5 text-[10.5px] font-bold text-[#6D5AA8] tabular-nums">
            {mode === 'susi'
              ? `내 상위 누적 ${effectivePct.toFixed(1)}% 기준`
              : `내 모의 백분위 ${profile.mockPct.toFixed(1)} 기준`}
          </span>
        </span>
        <span className="text-[11px] text-[#BD4F82] font-semibold">
          카드를 누르면 바텀시트가 열려요
        </span>
      </div>

      {/* 4. Department Cards Grid */}
      {activeTotal === 0 ? (
        <div className="glass-card rounded-[26px] py-14 text-center ring-1 ring-[#EAE3F7]/90">
          <p className="text-sm font-bold text-[#3D3554]">조건에 맞는 모집단위가 없어요</p>
          <p className="mt-1 text-xs text-[#9B93B0]">필터나 검색어를 초기화해 다시 찾아보세요.</p>
          <button
            type="button"
            onClick={() => {
              setUnivFilter('전체');
              setTrackFilter('전체');
              setTypeFilter('전체');
              setGunFilter('전체');
              setJudgmentFilter('전체');
              setOnlyFavs(false);
              setQuery('');
            }}
            className="mt-4 rounded-xl bg-[#F3EEFC] px-4 py-2 text-xs font-bold text-[#6A57A5] ring-1 ring-[#DFD5F5]"
          >
            필터 전체 초기화
          </button>
        </div>
      ) : mode === 'susi' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {finalSusiList.slice(0, visibleCount).map((r) => {
            const theme = UNIV_THEMES[r.u] ?? {
              badgeBg: 'bg-[#F3EEFC]',
              badgeText: 'text-[#6A57A5]',
            };
            const jSt = JUDGMENT_STYLES[r.judgment] ?? JUDGMENT_STYLES['참고(컷미공개)'];
            const isFav = favorites.has(r.favKey);

            return (
              <div
                key={r.id}
                onClick={() =>
                  onSelectDetail({
                    mode: 'susi',
                    sim: r,
                    univ: r.u,
                    adm: r.adm,
                    stdDept: r.d,
                    typeLabel: r.t,
                    track: r.tr,
                    judgment: r.judgment,
                  })
                }
                className="glass-card group cursor-pointer rounded-[24px] p-4 ring-1 ring-[#EAE3F7]/90 transition hover:ring-[#CBBDF0] active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {r.u}
                    </span>
                    <span className="rounded-lg bg-[#F5F2FB] px-2 py-0.5 text-[11px] font-bold text-[#564D70]">
                      {r.t}
                    </span>
                    <span className="rounded-lg bg-white/80 px-2 py-0.5 text-[11px] font-medium text-[#7B7292] ring-1 ring-[#ECE6F7]">
                      {r.tr}
                    </span>
                    {r.note && (
                      <span className="rounded-lg bg-[#FDF0F6] px-2 py-0.5 text-[10.5px] font-semibold text-[#BD4F82]">
                        {r.note}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1 ${jSt.bg} ${jSt.text} ${jSt.ring}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${jSt.dot}`} />
                      {jSt.shortLabel}
                    </span>
                    <button
                      type="button"
                      aria-label="관심학과 토글"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(r.favKey);
                      }}
                      className="rounded-full p-1 text-[#C6BED8] transition hover:text-[#DF7BA6]"
                    >
                      <Heart
                        className={`h-4 w-4 ${isFav ? 'fill-[#DB6F9E] text-[#DB6F9E]' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15.5px] font-extrabold tracking-tight text-[#231E33] group-hover:text-[#6B57A8]">
                      {r.d}
                    </h3>
                    <p className="truncate text-xs text-[#7D7494]">{r.adm}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#C6BED8] group-hover:text-[#9683D2]" />
                </div>

                {/* Numeric Metric Grid */}
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#F8F6FD] p-2.5 text-center tabular-nums ring-1 ring-[#EFEAF8]">
                  <div>
                    <div className="text-[10px] font-semibold text-[#7D7494]">3개년 70%컷(9등급)</div>
                    <div className="mt-0.5 text-sm font-extrabold text-[#231E33]">
                      {r.avg !== null ? `${r.avg.toFixed(2)}등급` : '-'}
                    </div>
                    <div className="text-[9.5px] font-medium text-[#9B93B0]">과거 9등급제</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[#7D7494]">환산 상위 누적</div>
                    <div className="mt-0.5 text-sm font-extrabold text-[#7561B4]">
                      {r.reqPct !== null ? `상위 ${r.reqPct.toFixed(1)}%` : '-'}
                    </div>
                    <div className="text-[9.5px] font-bold text-[#BD4F82]">
                      {r.g5Label ? `현 5등급: ${r.g5Label.split(' ')[0]}` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[#7D7494]">내 상위% 대비</div>
                    <div
                      className={`mt-0.5 text-xs font-extrabold ${
                        r.diffPct !== null && r.diffPct >= -0.05 ? 'text-[#287B6C]' : 'text-[#BD4F82]'
                      }`}
                    >
                      {r.diffPct === null
                        ? '-'
                        : Math.abs(r.diffPct) < 0.05
                          ? '컷 동일(0.0%p)'
                          : r.diffPct > 0
                            ? `+${r.diffPct.toFixed(1)}%p 여유`
                            : `${r.diffPct.toFixed(1)}%p 부족`}
                    </div>
                    <div className="text-[9.5px] font-medium text-[#9B93B0]">내 {effectivePct.toFixed(1)}% 비교</div>
                  </div>
                </div>

                {/* Bottom 3-year mini timeline */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#7D7494] tabular-nums px-0.5">
                  <span>
                    <span className="font-semibold text-[#8A7FB0]">9등급 컷</span>{' '}
                    24년 <strong>{r.c24 !== null ? r.c24.toFixed(2) : '-'}</strong> → 25년{' '}
                    <strong>{r.c25 !== null ? r.c25.toFixed(2) : '-'}</strong> → 26년{' '}
                    <strong className="text-[#231E33]">
                      {r.c26 !== null ? r.c26.toFixed(2) : '-'}
                    </strong>
                  </span>
                  <span className="font-semibold text-[#665D7E]">{r.trend}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {finalJeongsiList.slice(0, visibleCount).map((r) => {
            const theme = UNIV_THEMES[r.u] ?? {
              badgeBg: 'bg-[#E9F5F8]',
              badgeText: 'text-[#2C747E]',
            };
            const jSt = JUDGMENT_STYLES[r.judgment] ?? JUDGMENT_STYLES['참고(미공개)'];
            const isFav = favorites.has(r.favKey);

            return (
              <div
                key={r.id}
                onClick={() =>
                  onSelectDetail({
                    mode: 'jeongsi',
                    sim: r,
                    univ: r.u,
                    gun: r.gun,
                    adm: r.adm,
                    stdDept: r.d,
                    track: r.tr,
                    judgment: r.judgment,
                  })
                }
                className="glass-card group cursor-pointer rounded-[24px] p-4 ring-1 ring-[#EAE3F7]/90 transition hover:ring-[#B6DCE8] active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {r.u}
                    </span>
                    <span className="rounded-lg bg-[#E9F5F8] px-2 py-0.5 text-[11px] font-extrabold text-[#296E7E]">
                      {r.gun}군
                    </span>
                    <span className="rounded-lg bg-white/80 px-2 py-0.5 text-[11px] font-medium text-[#7B7292] ring-1 ring-[#ECE6F7]">
                      {r.tr}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1 ${jSt.bg} ${jSt.text} ${jSt.ring}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${jSt.dot}`} />
                      {jSt.shortLabel}
                    </span>
                    <button
                      type="button"
                      aria-label="관심학과 토글"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(r.favKey);
                      }}
                      className="rounded-full p-1 text-[#C6BED8] transition hover:text-[#DF7BA6]"
                    >
                      <Heart
                        className={`h-4 w-4 ${isFav ? 'fill-[#DB6F9E] text-[#DB6F9E]' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15.5px] font-extrabold tracking-tight text-[#231E33] group-hover:text-[#296E7E]">
                      {r.d}
                    </h3>
                    <p className="truncate text-xs text-[#7D7494]">{r.adm}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#C6BED8] group-hover:text-[#589EB0]" />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#F2F9FB] p-2.5 text-center tabular-nums ring-1 ring-[#DCEEF3]">
                  <div>
                    <div className="text-[10px] font-semibold text-[#6B8088]">국수탐 백분위 70%컷</div>
                    <div className="mt-0.5 text-sm font-extrabold text-[#256776]">
                      {r.avg !== null ? `${r.avg.toFixed(2)}` : '-'}
                    </div>
                    <div className="text-[9.5px] font-medium text-[#7D959E]">높을수록 상위</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[#6B8088]">내 모의 백분위</div>
                    <div className="mt-0.5 text-sm font-extrabold text-[#231E33]">
                      {profile.mockPct.toFixed(1)}
                    </div>
                    <div className="text-[9.5px] font-medium text-[#7D959E]">만점 100</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[#6B8088]">백분위 차이</div>
                    <div
                      className={`mt-0.5 text-xs font-extrabold ${
                        r.diffPct !== null && r.diffPct >= 0 ? 'text-[#287B6C]' : 'text-[#BD4F82]'
                      }`}
                    >
                      {r.diffPct === null
                        ? '-'
                        : r.diffPct >= 0
                          ? `+${r.diffPct.toFixed(1)}p 여유`
                          : `${r.diffPct.toFixed(1)}p 부족`}
                    </div>
                    <div className="text-[9.5px] font-medium text-[#7D959E]">3개년 70%컷 대비</div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#7D7494] tabular-nums px-0.5">
                  <span>
                    <span className="font-semibold text-[#478191]">백분위 70%</span>{' '}
                    24년 <strong>{r.p24 !== null ? r.p24.toFixed(1) : '-'}</strong> → 25년{' '}
                    <strong>{r.p25 !== null ? r.p25.toFixed(1) : '-'}</strong> → 26년{' '}
                    <strong className="text-[#231E33]">
                      {r.p26 !== null ? r.p26.toFixed(1) : '-'}
                    </strong>
                  </span>
                  <span className="font-semibold text-[#665D7E]">{r.trend}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Pagination */}
      {activeTotal > visibleCount && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + 48)}
          className="glass-card w-full rounded-2xl py-3.5 text-xs font-extrabold text-[#6D5AA8] ring-1 ring-[#E6DFF5] transition hover:bg-[#F5F0FD]"
        >
          더 보기 ({visibleCount.toLocaleString()} / {activeTotal.toLocaleString()})
        </button>
      )}
    </div>
  );
};
