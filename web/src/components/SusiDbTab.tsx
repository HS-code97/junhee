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
      <div className="glass-card rounded-[24px] py-16 text-center ring-1 ring-[#E6E4EE]">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-[#E4E2EC] border-t-[#1F1B2C]" />
        <p className="mt-3 text-xs font-bold text-[#5F5A70]">
          수시 3개년 원천 데이터베이스(4,396건)를 불러오는 중...
        </p>
      </div>
    );
  }

  const fmt = (v: number | null, d = 2) => (v === null ? '-' : v.toFixed(d));
  const fmtInt = (v: number | null) => (v === null ? '-' : v.toLocaleString());

  return (
    <div className="space-y-4">
      {/* Header Banner — Flat Solid Pastel Lavender */}
      <div className="rounded-[24px] bg-[#E4DBFA] p-4.5 text-[#1F1B2C]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-[10.5px] font-bold text-[#494459]">
              <Sparkles className="h-3 w-3 text-[#D45D92]" />
              엑셀 2번 시트 · 과거 9등급제 원천 데이터
            </span>
            <h2 className="mt-1.5 text-lg font-extrabold tracking-tight text-[#1F1B2C]">
              수시 3개년(2024~2026) 입결 DB 조회
            </h2>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-2xl bg-white/80 px-3 py-1.5 text-xs font-extrabold text-[#1F1B2C] tabular-nums">
            총 {rows.length.toLocaleString()}건
          </span>
        </div>
        <p className="mt-1 text-xs font-medium text-[#4E4766]">
          학생부교과 · 학생부종합 · 논술전형 공식 발표 수치 (과거 9등급제 기준 · 서울 본캠퍼스 일반전형)
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card relative z-20 space-y-3 rounded-[24px] p-3.5 ring-1 ring-[#E6E4EE]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#938DA3]" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(40);
              }}
              placeholder="수시 학과명 · 세부전형명 · 대학명 검색"
              className="h-10 w-full rounded-xl bg-[#F6F5FA] pr-8 pl-9 text-xs font-semibold text-[#1F1B2C] placeholder:font-normal placeholder:text-[#938DA3] ring-1 ring-[#E6E4EE] focus:bg-white focus:ring-2 focus:ring-[#1F1B2C] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#938DA3] hover:text-[#1F1B2C]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex rounded-xl bg-[#EFEFF4] p-1">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              title="모바일 카드 보기"
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'card' ? 'bg-[#1F1B2C] text-white' : 'text-[#7A748A] hover:text-[#1F1B2C]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="표 보기"
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'table' ? 'bg-[#1F1B2C] text-white' : 'text-[#7A748A] hover:text-[#1F1B2C]'
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
                  ? 'bg-[#1F1B2C] text-white'
                  : 'bg-[#F3F2F7] text-[#5F5A70] hover:bg-[#EAE8F2]'
              }`}
            >
              {yr === '전체' ? '연도 전체' : `${yr}학년도`}
            </button>
          ))}
        </div>

        {/* Dropdown Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EFEFF4]">
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
            />

            <select
              aria-label="전형유형 선택"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setVisibleCount(40);
              }}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ring-1 focus:outline-none transition ${
                typeFilter !== '전체'
                  ? 'bg-[#1F1B2C] text-white ring-[#1F1B2C]'
                  : 'bg-[#F3F2F7] text-[#494459] ring-[#E4E2EC]'
              }`}
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
              className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ring-1 focus:outline-none transition ${
                trackFilter !== '전체'
                  ? 'bg-[#1F1B2C] text-white ring-[#1F1B2C]'
                  : 'bg-[#F3F2F7] text-[#494459] ring-[#E4E2EC]'
              }`}
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
            className="rounded-xl bg-[#F3F2F7] px-2.5 py-1.5 text-xs font-bold text-[#494459] ring-1 ring-[#E4E2EC] focus:outline-none"
          >
            <option value="default">대학·연도 기본순</option>
            <option value="c70Asc">70%컷 높은순(9등급 1등급↑)</option>
            <option value="rateDesc">경쟁률 높은순</option>
            <option value="waitDesc">충원합격 많은순</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-[#5F5A70]">
        <span>
          검색 결과 <strong className="text-[#1F1B2C] tabular-nums">{filtered.length.toLocaleString()}</strong>건
          {univFilter !== '전체' && (
            <span className="ml-1.5 rounded-full bg-[#1F1B2C] px-2 py-0.5 text-[10.5px] font-bold text-white">
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
            className="text-[11px] font-bold text-[#D45D92] hover:underline"
          >
            필터 초기화
          </button>
        )}
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {filtered.slice(0, visibleCount).map((r) => {
            const theme = UNIV_THEMES[r.u] ?? {
              badgeBg: 'bg-[#F2F1F7]',
              badgeText: 'text-[#1F1B2C]',
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
                className="glass-card cursor-pointer rounded-[22px] p-4 ring-1 ring-[#E6E4EE] transition hover:ring-[#1F1B2C]/35 active:scale-[0.995]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-lg bg-[#1F1B2C] px-2 py-0.5 text-[11px] font-extrabold text-white tabular-nums">
                      {r.yr}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {r.u}
                    </span>
                    <span className="rounded-lg bg-[#F6F5FA] px-2 py-0.5 text-[11px] font-semibold text-[#5F5A70]">
                      {r.t} · {r.tr}
                    </span>
                  </div>
                  <span className="rounded-md bg-[#F6F5FA] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#8C879C]">
                    {r.src}
                  </span>
                </div>

                <h3 className="mt-2 text-[15px] font-extrabold text-[#1F1B2C]">{r.dept}</h3>
                <p className="text-xs text-[#7A748A]">{r.adm}</p>

                <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-2xl bg-[#F6F5FA] p-2.5 text-center tabular-nums">
                  <div>
                    <div className="text-[10px] text-[#7A748A]">모집/경쟁률</div>
                    <div className="mt-0.5 text-xs font-bold text-[#1F1B2C]">
                      {fmtInt(r.quota)}명 · {r.rate !== null ? `${r.rate.toFixed(1)}:1` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7A748A]">충원순위</div>
                    <div className="mt-0.5 text-xs font-bold text-[#1F1B2C]">{fmtInt(r.wait)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#5F5A70] font-semibold">50%컷(9등급)</div>
                    <div className="mt-0.5 text-sm font-extrabold text-[#6350A8]">{fmt(r.c50)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#1F1B2C] font-semibold">70%컷(9등급)</div>
                    <div className="mt-0.5 text-sm font-extrabold text-[#D45D92]">{fmt(r.c70)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-[22px] ring-1 ring-[#E6E4EE]">
          <table className="w-full min-w-[720px] text-xs tabular-nums border-collapse">
            <thead>
              <tr className="bg-[#F3F2F7] text-[#494459] border-b border-[#E6E4EE]">
                <th className="py-2.5 px-2.5 text-center font-extrabold">연도</th>
                <th className="py-2.5 px-2.5 text-center font-extrabold">대학</th>
                <th className="py-2.5 px-2 text-center font-extrabold">유형</th>
                <th className="py-2.5 px-2.5 text-left font-extrabold">세부전형</th>
                <th className="py-2.5 px-2.5 text-left font-extrabold">모집단위</th>
                <th className="py-2.5 px-2 text-right font-extrabold">모집</th>
                <th className="py-2.5 px-2 text-right font-extrabold">경쟁률</th>
                <th className="py-2.5 px-2 text-right font-extrabold">충원</th>
                <th className="py-2.5 px-2 text-right font-extrabold text-[#6350A8]">50%컷(9등급)</th>
                <th className="py-2.5 px-2.5 text-right font-extrabold text-[#D45D92]">70%컷(9등급)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEFF4]">
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
                  className="cursor-pointer hover:bg-[#F6F5FA]"
                >
                  <td className="py-2 px-2.5 text-center font-bold text-[#494459]">{r.yr}</td>
                  <td className="py-2 px-2.5 text-center font-bold text-[#1F1B2C]">{r.u}</td>
                  <td className="py-2 px-2 text-center text-[#5F5A70]">{r.t}</td>
                  <td className="py-2 px-2.5 text-[#5F5A70]">{r.adm}</td>
                  <td className="py-2 px-2.5 font-bold text-[#1F1B2C]">{r.dept}</td>
                  <td className="py-2 px-2 text-right text-[#494459]">{fmtInt(r.quota)}</td>
                  <td className="py-2 px-2 text-right text-[#494459]">{fmt(r.rate)}</td>
                  <td className="py-2 px-2 text-right text-[#494459]">{fmtInt(r.wait)}</td>
                  <td className="py-2 px-2 text-right font-bold text-[#6350A8]">{fmt(r.c50)}</td>
                  <td className="py-2 px-2.5 text-right font-extrabold text-[#D45D92]">
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
          className="glass-card w-full rounded-2xl py-3.5 text-xs font-extrabold text-[#1F1B2C] ring-1 ring-[#E6E4EE] transition hover:bg-[#F3F2F7]"
        >
          더 보기 ({visibleCount.toLocaleString()} / {filtered.length.toLocaleString()})
        </button>
      )}
    </div>
  );
};
