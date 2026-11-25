import React, { useMemo, useState } from 'react';
import { Search, LayoutGrid, Table, X, Sparkles } from 'lucide-react';
import type { SusiRawRow } from '../types';
import { UNIV_THEMES } from '../lib/simulatorEngine';
import type { SelectedDetailTarget } from './DeptDetailSheet';
import { UnivDropdown } from './UnivDropdown';

interface SusiDbTabProps {
  universities: string[];
  rows: SusiRawRow[] | null;
  loading: boolean;
  onSelectDetail: (target: SelectedDetailTarget) => void;
}

export const SusiDbTab: React.FC<SusiDbTabProps> = ({
  universities,
  rows,
  loading,
  onSelectDetail,
}) => {
  const [yearFilter, setYearFilter] = useState<string>('전체');
  const [univFilter, setUnivFilter] = useState<string>('전체');
  const [typeFilter, setTypeFilter] = useState<string>('전체');
  const [trackFilter, setTrackFilter] = useState<string>('전체');
  const [query, setQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'c70Asc' | 'rateDesc' | 'waitDesc'>('default');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [visibleCount, setVisibleCount] = useState<number>(40);

  const qNorm = query.trim().toLowerCase();

  // Counts per university (reflecting current year/type/track/query filters)
  const univCounts = useMemo(() => {
    const map: Record<string, number> = {};
    if (!rows) return map;
    for (const r of rows) {
      if (yearFilter !== '전체' && String(r.yr) !== yearFilter) continue;
      if (typeFilter !== '전체' && r.t !== typeFilter) continue;
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
  }, [rows, yearFilter, typeFilter, trackFilter, qNorm]);

  const totalBeforeUniv = useMemo(
    () => Object.values(univCounts).reduce((acc, v) => acc + v, 0),
    [univCounts]
  );

  const filtered = useMemo(() => {
    if (!rows) return [];
    const list = rows.filter((r) => {
      if (yearFilter !== '전체' && String(r.yr) !== yearFilter) return false;
      if (univFilter !== '전체' && r.u !== univFilter) return false;
      if (typeFilter !== '전체' && r.t !== typeFilter) return false;
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

    if (sortBy === 'c70Asc') {
      list.sort((a, b) => (a.c70 ?? 99) - (b.c70 ?? 99));
    } else if (sortBy === 'rateDesc') {
      list.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
    } else if (sortBy === 'waitDesc') {
      list.sort((a, b) => (b.wait ?? -1) - (a.wait ?? -1));
    }
    return list;
  }, [rows, yearFilter, univFilter, typeFilter, trackFilter, qNorm, sortBy]);

  if (loading || !rows) {
    return (
      <div className="glass-card rounded-[26px] py-16 text-center ring-1 ring-[#EAE3F7]/90">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-[#E4D9F8] border-t-[#9683D2]" />
        <p className="mt-3 text-xs font-bold text-[#6F6785]">
          수시 3개년 원천 데이터베이스(4,396건)를 불러오는 중...
        </p>
      </div>
    );
  }

  const fmt = (v: number | null, d = 2) => (v === null ? '-' : v.toFixed(d));
  const fmtInt = (v: number | null) => (v === null ? '-' : v.toLocaleString());

  return (
    <div className="space-y-4">
      {/* Header Banner — Soft Pastel Lavender (no harsh blue-purple) */}
      <div className="rounded-[26px] bg-gradient-to-r from-[#E6DCFB] via-[#DFD2F8] to-[#F3E2F4] p-4.5 text-[#231E33] shadow-[0_8px_24px_-12px_rgba(142,120,204,0.28)] ring-1 ring-white/80">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-0.5 text-[10.5px] font-bold text-[#6A57A5]">
              <Sparkles className="h-3 w-3 text-[#D96B9C]" />
              엑셀 2번 시트 · 무가공 원천 데이터
            </span>
            <h2 className="mt-1.5 text-lg font-extrabold tracking-tight text-[#231E33]">
              수시 3개년(2024~2026) 입결 DB 조회
            </h2>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-2xl bg-white/70 px-3 py-1.5 text-xs font-extrabold text-[#5F4C99] ring-1 ring-white/80 tabular-nums">
            총 {rows.length.toLocaleString()}건
          </span>
        </div>
        <p className="mt-1 text-xs font-medium text-[#5A4F78]">
          학생부교과 · 학생부종합 · 논술전형 공식 발표 수치 (서울 본캠퍼스 정원 내 일반전형)
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
              placeholder="수시 학과명 · 세부전형명 · 대학명 검색"
              className="h-10 w-full rounded-2xl bg-[#F7F5FC] pr-8 pl-9 text-xs font-semibold text-[#231E33] placeholder:font-normal placeholder:text-[#9B93B0] ring-1 ring-[#E8E2F4] focus:bg-white focus:ring-2 focus:ring-[#B3A1E3] focus:outline-none"
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
                viewMode === 'card' ? 'bg-white text-[#6D5AA8] shadow-2xs' : 'text-[#8C83A3]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="표 보기"
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'table' ? 'bg-white text-[#6D5AA8] shadow-2xs' : 'text-[#8C83A3]'
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

        {/* Dropdown Filter Row: University (Scrollable) + Type + Track + Sort */}
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
              tone="lavender"
            />

            <select
              aria-label="전형유형 선택"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setVisibleCount(40);
              }}
              className="rounded-xl bg-[#F5F2FB] px-2.5 py-1.5 text-xs font-bold text-[#4C4462] ring-1 ring-[#E8E2F4] focus:outline-none"
            >
              <option value="전체">전형유형: 전체</option>
              <option value="교과">학생부교과</option>
              <option value="종합">학생부종합</option>
              <option value="논술">논술전형</option>
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
            <option value="c70Asc">70%컷 높은순(1등급↑)</option>
            <option value="rateDesc">경쟁률 높은순</option>
            <option value="waitDesc">충원합격 많은순</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-[#6F6785]">
        <span>
          검색 결과 <strong className="text-[#231E33] tabular-nums">{filtered.length.toLocaleString()}</strong>건
          {univFilter !== '전체' && (
            <span className="ml-1.5 rounded-full bg-[#F3EEFC] px-2 py-0.5 text-[10.5px] font-bold text-[#6A57A5]">
              {univFilter}
            </span>
          )}
        </span>
        {(univFilter !== '전체' || yearFilter !== '전체' || typeFilter !== '전체' || trackFilter !== '전체' || query) && (
          <button
            type="button"
            onClick={() => {
              setYearFilter('전체');
              setUnivFilter('전체');
              setTypeFilter('전체');
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
              badgeBg: 'bg-[#F3EEFC]',
              badgeText: 'text-[#6A57A5]',
            };
            return (
              <div
                key={r.id}
                onClick={() =>
                  onSelectDetail({
                    mode: 'susi',
                    univ: r.u,
                    adm: r.adm,
                    stdDept: r.stdDept,
                    typeLabel: r.t,
                    track: r.tr,
                  })
                }
                className="glass-card cursor-pointer rounded-[24px] p-4 ring-1 ring-[#EAE3F7]/90 transition hover:ring-[#CBBDF0] active:scale-[0.995]"
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
                    <span className="rounded-lg bg-[#F3EEFC] px-2 py-0.5 text-[11px] font-bold text-[#6A57A5]">
                      {r.t}
                    </span>
                    <span className="rounded-lg bg-white/80 px-2 py-0.5 text-[11px] text-[#7B7292] ring-1 ring-[#ECE6F7]">
                      {r.tr}
                    </span>
                  </div>
                  <span className="rounded-md bg-[#F6F3FB] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#8A829F]">
                    {r.src}
                  </span>
                </div>

                <h3 className="mt-2 text-[15px] font-extrabold text-[#231E33]">{r.dept}</h3>
                <p className="text-xs text-[#7D7494]">{r.adm}</p>

                <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-2xl bg-[#F8F6FD] p-2.5 text-center tabular-nums ring-1 ring-[#EFEAF8]">
                  <div>
                    <div className="text-[10px] text-[#7D7494]">모집/경쟁률</div>
                    <div className="mt-0.5 text-xs font-bold text-[#342C48]">
                      {fmtInt(r.quota)}명 · {r.rate !== null ? `${r.rate.toFixed(1)}:1` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7D7494]">충원순위</div>
                    <div className="mt-0.5 text-xs font-bold text-[#342C48]">{fmtInt(r.wait)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7A67B8] font-semibold">50%컷(9등급)</div>
                    <div className="mt-0.5 text-sm font-extrabold text-[#7561B4]">{fmt(r.c50)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#BD4F82] font-semibold">70%컷(9등급)</div>
                    <div className="mt-0.5 text-sm font-extrabold text-[#A83F70]">{fmt(r.c70)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-[24px] ring-1 ring-[#EAE3F7]/90">
          <table className="w-full min-w-[720px] text-xs tabular-nums border-collapse">
            <thead>
              <tr className="bg-[#F2EEFB] text-[#4C3E7A] border-b border-[#E5DCF5]">
                <th className="py-2.5 px-2.5 text-center font-extrabold">연도</th>
                <th className="py-2.5 px-2.5 text-center font-extrabold">대학</th>
                <th className="py-2.5 px-2 text-center font-extrabold">유형</th>
                <th className="py-2.5 px-2.5 text-left font-extrabold">세부전형</th>
                <th className="py-2.5 px-2.5 text-left font-extrabold">모집단위</th>
                <th className="py-2.5 px-2 text-right font-extrabold">모집</th>
                <th className="py-2.5 px-2 text-right font-extrabold">경쟁률</th>
                <th className="py-2.5 px-2 text-right font-extrabold">충원</th>
                <th className="py-2.5 px-2 text-right font-extrabold bg-[#EAE1FA] text-[#5B4894]">50%컷</th>
                <th className="py-2.5 px-2.5 text-right font-extrabold bg-[#FBEAF2] text-[#A23E6E]">70%컷</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EEF9]">
              {filtered.slice(0, visibleCount).map((r) => (
                <tr
                  key={r.id}
                  onClick={() =>
                    onSelectDetail({
                      mode: 'susi',
                      univ: r.u,
                      adm: r.adm,
                      stdDept: r.stdDept,
                      typeLabel: r.t,
                      track: r.tr,
                    })
                  }
                  className="cursor-pointer hover:bg-[#F7F3FD]/70"
                >
                  <td className="py-2 px-2.5 text-center font-bold text-[#3D3554]">{r.yr}</td>
                  <td className="py-2 px-2.5 text-center font-bold text-[#231E33]">{r.u}</td>
                  <td className="py-2 px-2 text-center text-[#5F5678]">{r.t}</td>
                  <td className="py-2 px-2.5 text-[#6F6785]">{r.adm}</td>
                  <td className="py-2 px-2.5 font-bold text-[#231E33]">{r.dept}</td>
                  <td className="py-2 px-2 text-right text-[#4C4462]">{fmtInt(r.quota)}</td>
                  <td className="py-2 px-2 text-right text-[#4C4462]">{fmt(r.rate)}</td>
                  <td className="py-2 px-2 text-right text-[#4C4462]">{fmtInt(r.wait)}</td>
                  <td className="py-2 px-2 text-right font-bold text-[#7561B4]">{fmt(r.c50)}</td>
                  <td className="py-2 px-2.5 text-right font-extrabold text-[#A83F70]">
                    {fmt(r.c70)}
                  </td>
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
          className="glass-card w-full rounded-2xl py-3.5 text-xs font-extrabold text-[#6D5AA8] ring-1 ring-[#E6DFF5] transition hover:bg-[#F5F0FD]"
        >
          더 보기 ({visibleCount.toLocaleString()} / {filtered.length.toLocaleString()})
        </button>
      )}
    </div>
  );
};
