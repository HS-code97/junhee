import React, { useMemo, useState } from 'react';
import {
  Search,
  Heart,
  AlertTriangle,
  ChevronRight,
  SlidersHorizontal,
  X,
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

  const effectivePct = getEffectiveStudentCumPct(profile.grade5, profile.customCumPct);

  // Reset pagination when filters change
  const resetPage = () => setVisibleCount(36);

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

  // Base filtered (before judgment chip filter) so judgment chip counts reflect Univ/Track/Type/Search filters!
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
        return (a.avg ?? 99) - (b.avg ?? 99); // 낮은 등급 = 높은 입결
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
        return (b.avg ?? -1) - (a.avg ?? -1); // 높은 백분위 = 높은 입결
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

  const judgmentChips =
    mode === 'susi'
      ? [
          { key: '전체', label: '전체' },
          { key: '적정', label: '적정' },
          { key: '안정', label: '안정' },
          { key: '소신', label: '소신' },
          { key: '참고(1등급내 경합)', label: '1등급내 경합' },
          { key: '상향', label: '상향' },
        ]
      : [
          { key: '전체', label: '전체' },
          { key: '적정', label: '적정' },
          { key: '안정', label: '안정' },
          { key: '소신', label: '소신' },
          { key: '상향', label: '상향' },
        ];

  const activeTotal = mode === 'susi' ? finalSusiList.length : finalJeongsiList.length;

  return (
    <div className="space-y-4">
      {/* 1. Student Score Input Card */}
      <ScoreControlPanel profile={profile} onChange={onChangeProfile} />

      {/* 2. Mode Switcher: 수시 vs 정시 */}
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-200/75 p-1.5">
        <button
          type="button"
          onClick={() => {
            setMode('susi');
            setJudgmentFilter('전체');
            resetPage();
          }}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-extrabold transition ${
            mode === 'susi'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          수시 맞춤 판정
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600 tabular-nums">
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
              ? 'bg-white text-teal-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          정시 맞춤 판정
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 tabular-nums">
            {jeongsiSim.length.toLocaleString()}
          </span>
        </button>
      </div>

      {/* Mandatory 2028 CSAT Notice Banner in Jeongsi Mode */}
      {mode === 'jeongsi' && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/90 px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200/80">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <strong>2028 통합수능 개편 안내:</strong> 선택과목 폐지·통합수능 도입으로 과거 대학별 환산점수는 직접 비교할 수 없어요.{' '}
            <strong>3개년 국수탐 평균 백분위(70% 컷)</strong> 기준 상대 위치 참고용으로 활용해 주세요.
          </div>
        </div>
      )}

      {/* 3. Filter & Search Box */}
      <div className="space-y-2.5 rounded-3xl bg-white p-3.5 shadow-2xs ring-1 ring-slate-200/80">
        {/* Search + Favorites Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder="학과명, 대학명, 전형명 검색 (예: 컴퓨터, 의예, 자유전공)"
              className="h-10 w-full rounded-2xl bg-slate-50 pr-8 pl-9 text-xs font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 ring-1 ring-slate-200/80 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => {
                  setQuery('');
                  resetPage();
                }}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                ? 'bg-rose-500 text-white ring-rose-500'
                : 'bg-rose-50/70 text-rose-600 ring-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${onlyFavs ? 'fill-white' : 'fill-rose-400'}`} />
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
                    ? 'bg-slate-900 text-white shadow-xs'
                    : st
                      ? `${st.bg} ${st.text} ring-1 ${st.ring}`
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                {st && !active && <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />}
                {chip.label}
                <span className="tabular-nums opacity-85">{cnt.toLocaleString()}</span>
              </button>
            );
          })}
        </div>

        {/* University Horizontal Chips */}
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
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {u}
              </button>
            );
          })}
        </div>

        {/* Sub-filters: Track + Type/Gun + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="희망 계열 선택"
              value={trackFilter}
              onChange={(e) => {
                setTrackFilter(e.target.value);
                resetPage();
              }}
              className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
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
                className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
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
                className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="전체">모집군: 전체</option>
                <option value="가">가군</option>
                <option value="나">나군</option>
                <option value="다">다군</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <select
              aria-label="정렬 기준"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="fit">내 성적 적합순</option>
              <option value="cutHigh">입결 높은순</option>
              <option value="cutLow">입결 여유순</option>
              <option value="univ">대학 기본순</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result Count Caption */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span>
          조회 결과 <strong className="text-slate-900 tabular-nums">{activeTotal.toLocaleString()}</strong>개 모집단위
        </span>
        <span className="text-[11px] text-indigo-600 font-semibold">
          카드를 누르면 3개년 상세·2028 개편안이 열려요
        </span>
      </div>

      {/* 4. Department Cards Grid */}
      {activeTotal === 0 ? (
        <div className="rounded-3xl bg-white py-14 text-center shadow-2xs ring-1 ring-slate-200/80">
          <p className="text-sm font-bold text-slate-700">조건에 맞는 모집단위가 없어요</p>
          <p className="mt-1 text-xs text-slate-400">필터나 검색어를 초기화해 다시 찾아보세요.</p>
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
            className="mt-4 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600"
          >
            필터 전체 초기화
          </button>
        </div>
      ) : mode === 'susi' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {finalSusiList.slice(0, visibleCount).map((r) => {
            const theme = UNIV_THEMES[r.u] ?? {
              badgeBg: 'bg-indigo-50',
              badgeText: 'text-indigo-700',
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
                className="group cursor-pointer rounded-3xl bg-white p-4 shadow-[0_2px_14px_-4px_rgba(25,31,40,0.06)] ring-1 ring-slate-200/80 transition hover:ring-indigo-300 active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {r.u}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                      {r.t}
                    </span>
                    <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/70">
                      {r.tr}
                    </span>
                    {r.note && (
                      <span className="rounded-lg bg-indigo-50/80 px-2 py-0.5 text-[10.5px] font-semibold text-indigo-600">
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
                      className="rounded-full p-1 text-slate-300 transition hover:text-rose-400"
                    >
                      <Heart
                        className={`h-4 w-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15.5px] font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-700">
                      {r.d}
                    </h3>
                    <p className="truncate text-xs text-slate-500">{r.adm}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-indigo-500" />
                </div>

                {/* Numeric Metric Grid */}
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#F8F9FC] p-2.5 text-center tabular-nums ring-1 ring-slate-100">
                  <div>
                    <div className="text-[10.5px] font-medium text-slate-500">3개년 평균 70%컷</div>
                    <div className="mt-0.5 text-sm font-extrabold text-slate-900">
                      {r.avg !== null ? `${r.avg.toFixed(2)}등급` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-medium text-slate-500">요구 상위 누적</div>
                    <div className="mt-0.5 text-sm font-extrabold text-indigo-600">
                      {r.reqPct !== null ? `상위 ${r.reqPct.toFixed(1)}%` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-medium text-slate-500">내 성적 대비</div>
                    <div
                      className={`mt-0.5 text-xs font-extrabold ${
                        r.diffPct !== null && r.diffPct >= -0.05 ? 'text-emerald-600' : 'text-rose-600'
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
                  </div>
                </div>

                {/* Bottom 3-year mini timeline */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 tabular-nums px-0.5">
                  <span>
                    24년 <strong>{r.c24 !== null ? r.c24.toFixed(2) : '-'}</strong> → 25년{' '}
                    <strong>{r.c25 !== null ? r.c25.toFixed(2) : '-'}</strong> → 26년{' '}
                    <strong className="text-slate-800">
                      {r.c26 !== null ? r.c26.toFixed(2) : '-'}
                    </strong>
                  </span>
                  <span className="font-semibold text-slate-600">{r.trend}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {finalJeongsiList.slice(0, visibleCount).map((r) => {
            const theme = UNIV_THEMES[r.u] ?? {
              badgeBg: 'bg-teal-50',
              badgeText: 'text-teal-700',
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
                className="group cursor-pointer rounded-3xl bg-white p-4 shadow-[0_2px_14px_-4px_rgba(25,31,40,0.06)] ring-1 ring-slate-200/80 transition hover:ring-teal-300 active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {r.u}
                    </span>
                    <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-extrabold text-teal-800">
                      {r.gun}군
                    </span>
                    <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/70">
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
                      className="rounded-full p-1 text-slate-300 transition hover:text-rose-400"
                    >
                      <Heart
                        className={`h-4 w-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15.5px] font-extrabold tracking-tight text-slate-900 group-hover:text-teal-700">
                      {r.d}
                    </h3>
                    <p className="truncate text-xs text-slate-500">{r.adm}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-teal-600" />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#F6FBFA] p-2.5 text-center tabular-nums ring-1 ring-teal-100/70">
                  <div>
                    <div className="text-[10.5px] font-medium text-slate-500">3개년 백분위70%</div>
                    <div className="mt-0.5 text-sm font-extrabold text-teal-800">
                      {r.avg !== null ? `${r.avg.toFixed(2)}%` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-medium text-slate-500">내 모의 백분위</div>
                    <div className="mt-0.5 text-sm font-extrabold text-slate-800">
                      {profile.mockPct.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-medium text-slate-500">백분위 차이</div>
                    <div
                      className={`mt-0.5 text-xs font-extrabold ${
                        r.diffPct !== null && r.diffPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {r.diffPct === null
                        ? '-'
                        : r.diffPct >= 0
                          ? `+${r.diffPct.toFixed(1)}p 여유`
                          : `${r.diffPct.toFixed(1)}p 부족`}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 tabular-nums px-0.5">
                  <span>
                    24년 <strong>{r.p24 !== null ? r.p24.toFixed(1) : '-'}</strong> → 25년{' '}
                    <strong>{r.p25 !== null ? r.p25.toFixed(1) : '-'}</strong> → 26년{' '}
                    <strong className="text-slate-800">
                      {r.p26 !== null ? r.p26.toFixed(1) : '-'}
                    </strong>
                  </span>
                  <span className="font-semibold text-slate-600">{r.trend}</span>
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
          className="w-full rounded-2xl bg-white py-3.5 text-xs font-extrabold text-indigo-600 shadow-2xs ring-1 ring-slate-200/80 transition hover:bg-indigo-50"
        >
          더 보기 ({visibleCount.toLocaleString()} / {activeTotal.toLocaleString()})
        </button>
      )}
    </div>
  );
};
