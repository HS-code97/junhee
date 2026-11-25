import React, { useMemo, useState } from 'react';
import { Search, LayoutGrid, Table, X, Sparkles } from 'lucide-react';
import type { JeongsiRawRow } from '../types';
import { UNIV_THEMES } from '../lib/simulatorEngine';
import type { SelectedDetailTarget } from './DeptDetailSheet';
import { UnivDropdown } from './UnivDropdown';

interface JeongsiDbTabProps {
  universities: string[];
  rows: JeongsiRawRow[] | null;
  loading: boolean;
  onSelectDetail: (target: SelectedDetailTarget) => void;
}

export const JeongsiDbTab: React.FC<JeongsiDbTabProps> = ({
  universities,
  rows,
  loading,
  onSelectDetail,
}) => {
  const [yearFilter, setYearFilter] = useState<string>('전체');
  const [univFilter, setUnivFilter] = useState<string>('전체');
  const [gunFilter, setGunFilter] = useState<string>('전체');
  const [trackFilter, setTrackFilter] = useState<string>('전체');
  const [query, setQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'p70Desc' | 'rateDesc' | 'waitDesc'>('default');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [visibleCount, setVisibleCount] = useState<number>(40);

  const qNorm = query.trim().toLowerCase();

  // Counts per university (reflecting current year/gun/track/query filters)
  const univCounts = useMemo(() => {
    const map: Record<string, number> = {};
    if (!rows) return map;
    for (const r of rows) {
      if (yearFilter !== '전체' && String(r.yr) !== yearFilter) continue;
      if (gunFilter !== '전체' && r.gun !== gunFilter) continue;
      if (trackFilter !== '전체' && r.tr !== trackFilter) continue;
      if (
        qNorm &&
        !r.dept.toLowerCase().includes(qNorm) &&
        !r.stdDept.toLowerCase().includes(qNorm) &&
        !r.u.toLowerCase().includes(qNorm) &&
        !r.adm.toLowerCase().includes(qNorm)
      ) {
        continue;
      }
      map[r.u] = (map[r.u] || 0) + 1;
    }
    return map;
  }, [rows, yearFilter, gunFilter, trackFilter, qNorm]);

  const totalBeforeUniv = useMemo(
    () => Object.values(univCounts).reduce((acc, v) => acc + v, 0),
    [univCounts]
  );

  const filtered = useMemo(() => {
    if (!rows) return [];
    const list = rows.filter((r) => {
      if (yearFilter !== '전체' && String(r.yr) !== yearFilter) return false;
      if (univFilter !== '전체' && r.u !== univFilter) return false;
      if (gunFilter !== '전체' && r.gun !== gunFilter) return false;
      if (trackFilter !== '전체' && r.tr !== trackFilter) return false;
      if (
        qNorm &&
        !r.dept.toLowerCase().includes(qNorm) &&
        !r.stdDept.toLowerCase().includes(qNorm) &&
        !r.u.toLowerCase().includes(qNorm) &&
        !r.adm.toLowerCase().includes(qNorm)
      ) {
        return false;
      }
      return true;
    });

    if (sortBy === 'p70Desc') {
      list.sort((a, b) => (b.p70 ?? -1) - (a.p70 ?? -1));
    } else if (sortBy === 'rateDesc') {
      list.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
    } else if (sortBy === 'waitDesc') {
      list.sort((a, b) => (b.wait ?? -1) - (a.wait ?? -1));
    }
    return list;
  }, [rows, yearFilter, univFilter, gunFilter, trackFilter, qNorm, sortBy]);

  if (loading || !rows) {
    return (
      <div className="glass-card rounded-[26px] py-16 text-center ring-1 ring-[#EAE3F7]/90">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-[#CFE8F0] border-t-[#569DB1]" />
        <p className="mt-3 text-xs font-bold text-[#6F6785]">
          정시 3개년 원천 데이터베이스(2,149건)를 불러오는 중...
        </p>
      </div>
    );
  }

  const fmt = (v: number | null, d = 2) => (v === null ? '-' : v.toFixed(d));
  const fmtInt = (v: number | null) => (v === null ? '-' : v.toLocaleString());

  return (
    <div className="space-y-4">
      {/* Header Banner — Soft Pastel Sky-Mint & Lavender */}
      <div className="rounded-[26px] bg-gradient-to-r from-[#DFF1F6] via-[#E8F4F8] to-[#EEE8FA] p-4.5 text-[#1F2A36] shadow-[0_8px_24px_-12px_rgba(92,155,176,0.26)] ring-1 ring-white/80">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-[10.5px] font-bold text-[#2F6F80]">
              <Sparkles className="h-3 w-3 text-[#5BA2B5]" />
              엑셀 3번 시트 · 환산점수 / 국수탐 백분위 엄격 분리
            </span>
            <h2 className="mt-1.5 text-lg font-extrabold tracking-tight text-[#1F2A36]">
              정시 3개년(2024~2026) 입결 DB 조회
            </h2>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-2xl bg-white/75 px-3 py-1.5 text-xs font-extrabold text-[#2B6B7C] ring-1 ring-white/85 tabular-nums">
            총 {rows.length.toLocaleString()}건
          </span>
        </div>
        <p className="mt-1 text-xs font-medium text-[#4D6370]">
          가·나·다군 대학별 환산점수(50%·70%컷) 및 수능 국수탐 평균 백분위(50%·70%컷) 원천 데이터
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card relative z-20 space-y-3 rounded-[26px] p-3.5 ring-1 ring-[#EAE3F7]/90">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9B93B0]" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(40);
              }}
              placeholder="정시 학과명 · 대학명 · 전형명 검색"
              className="h-10 w-full rounded-2xl bg-[#F7F5FC] pr-8 pl-9 text-xs font-semibold text-[#231E33] placeholder:font-normal placeholder:text-[#9B93B0] ring-1 ring-[#E8E2F4] focus:bg-white focus:ring-2 focus:ring-[#8AC5D6] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#9B93B0] hover:text-[#4C4462]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex rounded-xl bg-[#F2EEF9] p-1 ring-1 ring-[#E7E0F4]">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              title="모바일 카드 보기"
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'card' ? 'bg-white text-[#2F7284] shadow-2xs' : 'text-[#8C83A3]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="표 보기"
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'table' ? 'bg-white text-[#2F7284] shadow-2xs' : 'text-[#8C83A3]'
              }`}
            >
              <Table className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Year Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['전체', '2026', '2025', '2024'].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => {
                setYearFilter(yr);
                setVisibleCount(40);
              }}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                yearFilter === yr
                  ? 'bg-[#2C2540] text-white shadow-2xs'
                  : 'bg-[#F4F1FA] text-[#5F5678] hover:bg-[#EAE4F7]'
              }`}
            >
              {yr === '전체' ? '연도 전체' : `${yr}학년도`}
            </button>
          ))}
        </div>

        {/* Dropdown Filter Row: University (Scrollable) + Gun + Track + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0EBF9]">
          <div className="flex flex-wrap items-center gap-1.5">
            <UnivDropdown
              universities={universities}
              value={univFilter}
              onChange={(u) => {
                setUnivFilter(u);
                setVisibleCount(40);
              }}
              counts={univCounts}
              totalCount={totalBeforeUniv}
              tone="sky"
            />

            <select
              aria-label="모집군 선택"
              value={gunFilter}
              onChange={(e) => {
                setGunFilter(e.target.value);
                setVisibleCount(40);
              }}
              className="rounded-xl bg-[#F5F2FB] px-2.5 py-1.5 text-xs font-bold text-[#4C4462] ring-1 ring-[#E8E2F4] focus:outline-none"
            >
              <option value="전체">모집군: 전체</option>
              <option value="가">가군</option>
              <option value="나">나군</option>
              <option value="다">다군</option>
            </select>

            <select
              aria-label="계열 선택"
              value={trackFilter}
              onChange={(e) => {
                setTrackFilter(e.target.value);
                setVisibleCount(40);
              }}
              className="rounded-xl bg-[#F5F2FB] px-2.5 py-1.5 text-xs font-bold text-[#4C4462] ring-1 ring-[#E8E2F4] focus:outline-none"
            >
              <option value="전체">계열: 전체</option>
              <option value="인문">인문</option>
              <option value="자연">자연</option>
              <option value="자유전공">자유전공</option>
              <option value="예체능">예체능</option>
            </select>
          </div>

          <select
            aria-label="정렬 기준"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl bg-[#F5F2FB] px-2.5 py-1.5 text-xs font-bold text-[#4C4462] ring-1 ring-[#E8E2F4] focus:outline-none"
          >
            <option value="default">대학·연도 기본순</option>
            <option value="p70Desc">국수탐 백분위70% 높은순</option>
            <option value="rateDesc">경쟁률 높은순</option>
            <option value="waitDesc">충원합격 많은순</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-[#6F6785]">
        <span>
          검색 결과 <strong className="text-[#231E33] tabular-nums">{filtered.length.toLocaleString()}</strong>건
          {univFilter !== '전체' && (
            <span className="ml-1.5 rounded-full bg-[#E9F5F8] px-2 py-0.5 text-[10.5px] font-bold text-[#2B6B7C]">
              {univFilter}
            </span>
          )}
        </span>
        {(univFilter !== '전체' || yearFilter !== '전체' || gunFilter !== '전체' || trackFilter !== '전체' || query) && (
          <button
            type="button"
            onClick={() => {
              setYearFilter('전체');
              setUnivFilter('전체');
              setGunFilter('전체');
              setTrackFilter('전체');
              setQuery('');
              setVisibleCount(40);
            }}
            className="text-[11px] font-bold text-[#BD4F82] hover:underline"
          >
            필터 초기화
          </button>
        )}
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {filtered.slice(0, visibleCount).map((r) => {
            const theme = UNIV_THEMES[r.u] ?? {
              badgeBg: 'bg-[#E9F5F8]',
              badgeText: 'text-[#2B6B7C]',
            };
            return (
              <div
                key={r.id}
                onClick={() =>
                  onSelectDetail({
                    mode: 'jeongsi',
                    univ: r.u,
                    gun: r.gun,
                    adm: r.adm,
                    stdDept: r.stdDept,
                    track: r.tr,
                  })
                }
                className="glass-card cursor-pointer rounded-[24px] p-4 ring-1 ring-[#EAE3F7]/90 transition hover:ring-[#B6DCE8] active:scale-[0.995]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-lg bg-[#2C2540] px-2 py-0.5 text-[11px] font-extrabold text-white tabular-nums">
                      {r.yr}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {r.u}
                    </span>
                    <span className="rounded-lg bg-[#E9F5F8] px-2 py-0.5 text-[11px] font-extrabold text-[#2B6B7C]">
                      {r.gun}군
                    </span>
                    <span className="rounded-lg bg-white/80 px-2 py-0.5 text-[11px] text-[#7B7292] ring-1 ring-[#ECE6F7]">
                      {r.tr}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7D7494] tabular-nums">
                    모집 {fmtInt(r.quota)} · 경쟁 {r.rate !== null ? `${r.rate.toFixed(1)}:1` : '-'} · 충원{' '}
                    {fmtInt(r.wait)}
                  </span>
                </div>

                <h3 className="mt-2 text-[15px] font-extrabold text-[#231E33]">{r.dept}</h3>
                <p className="text-xs text-[#7D7494]">{r.adm}</p>

                {/* Strictly Separated 2 Blocks: 대학환산점수 vs 국수탐 백분위 */}
                <div className="mt-3 grid grid-cols-2 gap-2 tabular-nums">
                  <div className="rounded-2xl bg-[#F5F1FD] p-2.5 ring-1 ring-[#E6DCF8]">
                    <div className="text-[10px] font-bold text-[#6D5AA8]">
                      대학환산점수 {r.sMax ? `(만점 ${r.sMax})` : ''}
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-xs">
                      <span className="text-[#7D7494]">50%컷</span>
                      <span className="font-bold text-[#7561B4]">{fmt(r.s50)}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#665D7E]">70%컷</span>
                      <span className="font-extrabold text-[#453573]">{fmt(r.s70)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#EEF8FA] p-2.5 ring-1 ring-[#D2EAF0]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#2B6B7C]">
                      <span>국수탐 백분위</span>
                      <span>영어 {fmt(r.eng, 1)}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-xs">
                      <span className="text-[#6B8088]">50%컷</span>
                      <span className="font-bold text-[#327885]">{fmt(r.p50)}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#4F6872]">70%컷</span>
                      <span className="font-extrabold text-[#1E535F]">{fmt(r.p70)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-[24px] ring-1 ring-[#EAE3F7]/90">
          <table className="w-full min-w-[820px] text-xs tabular-nums border-collapse">
            <thead>
              <tr className="bg-[#EEF7FA] text-[#285B6B] border-b border-[#D5E9F0]">
                <th className="py-2.5 px-2 text-center font-extrabold">연도</th>
                <th className="py-2.5 px-2 text-center font-extrabold">대학</th>
                <th className="py-2.5 px-1.5 text-center font-extrabold">군</th>
                <th className="py-2.5 px-2.5 text-left font-extrabold">모집단위</th>
                <th className="py-2.5 px-2 text-right font-extrabold">모집</th>
                <th className="py-2.5 px-2 text-right font-extrabold">경쟁률</th>
                <th className="py-2.5 px-2 text-right font-extrabold bg-[#EFE9FC] text-[#5B4894]">만점</th>
                <th className="py-2.5 px-2 text-right font-extrabold bg-[#EFE9FC] text-[#5B4894]">환산70%</th>
                <th className="py-2.5 px-2 text-right font-extrabold bg-[#E0F2F7] text-[#225C6B]">백분위50%</th>
                <th className="py-2.5 px-2 text-right font-extrabold bg-[#E0F2F7] text-[#225C6B]">백분위70%</th>
                <th className="py-2.5 px-2 text-right font-extrabold bg-[#E0F2F7] text-[#225C6B]">영어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EEF7]">
              {filtered.slice(0, visibleCount).map((r) => (
                <tr
                  key={r.id}
                  onClick={() =>
                    onSelectDetail({
                      mode: 'jeongsi',
                      univ: r.u,
                      gun: r.gun,
                      adm: r.adm,
                      stdDept: r.stdDept,
                      track: r.tr,
                    })
                  }
                  className="cursor-pointer hover:bg-[#F0F8FA]/80"
                >
                  <td className="py-2 px-2 text-center font-bold text-[#3D3554]">{r.yr}</td>
                  <td className="py-2 px-2 text-center font-bold text-[#231E33]">{r.u}</td>
                  <td className="py-2 px-1.5 text-center font-semibold text-[#2B6B7C]">{r.gun}</td>
                  <td className="py-2 px-2.5 font-bold text-[#231E33]">{r.dept}</td>
                  <td className="py-2 px-2 text-right text-[#4C4462]">{fmtInt(r.quota)}</td>
                  <td className="py-2 px-2 text-right text-[#4C4462]">{fmt(r.rate)}</td>
                  <td className="py-2 px-2 text-right text-[#8A829F]">{fmtInt(r.sMax)}</td>
                  <td className="py-2 px-2 text-right font-bold text-[#6D5AA8]">{fmt(r.s70)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-[#327885]">{fmt(r.p50)}</td>
                  <td className="py-2 px-2 text-right font-extrabold text-[#1E535F]">{fmt(r.p70)}</td>
                  <td className="py-2 px-2 text-right text-[#4C4462]">{fmt(r.eng, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > visibleCount && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + 60)}
          className="glass-card w-full rounded-2xl py-3.5 text-xs font-extrabold text-[#2B6B7C] ring-1 ring-[#D4EAF0] transition hover:bg-[#EEF8FA]"
        >
          더 보기 ({visibleCount.toLocaleString()} / {filtered.length.toLocaleString()})
        </button>
      )}
    </div>
  );
};
