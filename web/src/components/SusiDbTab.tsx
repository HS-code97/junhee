import React, { useMemo, useState } from 'react';
import { Search, LayoutGrid, Table, X } from 'lucide-react';
import type { SusiRawRow } from '../types';
import { UNIV_THEMES } from '../lib/simulatorEngine';
import type { SelectedDetailTarget } from './DeptDetailSheet';

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
      <div className="rounded-3xl bg-white py-16 text-center shadow-2xs ring-1 ring-slate-200/80">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
        <p className="mt-3 text-xs font-bold text-slate-600">
          수시 3개년 원천 데이터베이스(4,396건)를 불러오는 중...
        </p>
      </div>
    );
  }

  const fmt = (v: number | null, d = 2) => (v === null ? '-' : v.toFixed(d));
  const fmtInt = (v: number | null) => (v === null ? '-' : v.toLocaleString());

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-100">엑셀 2번 시트 · 무가공 원천 데이터</span>
            <h2 className="mt-0.5 text-lg font-extrabold">수시 3개년(2024~2026) 입결 DB 조회</h2>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-2xl bg-white/18 px-3 py-1.5 text-xs font-extrabold tabular-nums">
            총 {rows.length.toLocaleString()}건
          </span>
        </div>
        <p className="mt-1 text-xs text-indigo-100">
          학생부교과 · 학생부종합 · 논술전형 공식 발표 수치 (서울 본캠퍼스 정원 내 일반전형)
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-2.5 rounded-3xl bg-white p-3.5 shadow-2xs ring-1 ring-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(40);
              }}
              placeholder="수시 학과명 · 세부전형명 · 대학명 검색"
              className="h-10 w-full rounded-2xl bg-slate-50 pr-8 pl-9 text-xs font-semibold text-slate-800 ring-1 ring-slate-200/80 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              title="모바일 카드 보기"
              className={`rounded-lg p-1.5 ${
                viewMode === 'card' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="표 보기"
              className={`rounded-lg p-1.5 ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <Table className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Year + Univ Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['전체', '2026', '2025', '2024'].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => {
                setYearFilter(yr);
                setVisibleCount(40);
              }}
              className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-extrabold transition ${
                yearFilter === yr
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {yr === '전체' ? '연도 전체' : `${yr}학년도`}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-slate-200 shrink-0" />
          {['전체', ...universities].map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                setUnivFilter(u);
                setVisibleCount(40);
              }}
              className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                univFilter === u
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setVisibleCount(40);
              }}
              className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700"
            >
              <option value="전체">전형유형: 전체</option>
              <option value="교과">학생부교과</option>
              <option value="종합">학생부종합</option>
              <option value="논술">논술전형</option>
            </select>
            <select
              value={trackFilter}
              onChange={(e) => {
                setTrackFilter(e.target.value);
                setVisibleCount(40);
              }}
              className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700"
            >
              <option value="전체">계열: 전체</option>
              <option value="인문">인문</option>
              <option value="자연">자연</option>
              <option value="자유전공">자유전공</option>
              <option value="예체능">예체능</option>
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700"
          >
            <option value="default">대학·연도 기본순</option>
            <option value="c70Asc">70%컷 높은순(1등급↑)</option>
            <option value="rateDesc">경쟁률 높은순</option>
            <option value="waitDesc">충원합격 많은순</option>
          </select>
        </div>
      </div>

      <div className="px-1 text-xs text-slate-500">
        검색 결과 <strong className="text-slate-900 tabular-nums">{filtered.length.toLocaleString()}</strong>건
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {filtered.slice(0, visibleCount).map((r) => {
            const theme = UNIV_THEMES[r.u] ?? {
              badgeBg: 'bg-indigo-50',
              badgeText: 'text-indigo-700',
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
                className="cursor-pointer rounded-3xl bg-white p-4 shadow-2xs ring-1 ring-slate-200/80 transition hover:ring-indigo-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-[11px] font-extrabold text-white tabular-nums">
                      {r.yr}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {r.u}
                    </span>
                    <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                      {r.t}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      {r.tr}
                    </span>
                  </div>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-500">
                    {r.src}
                  </span>
                </div>

                <h3 className="mt-2 text-[15px] font-extrabold text-slate-900">{r.dept}</h3>
                <p className="text-xs text-slate-500">{r.adm}</p>

                <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-50 p-2.5 text-center tabular-nums">
                  <div>
                    <div className="text-[10px] text-slate-500">모집/경쟁률</div>
                    <div className="mt-0.5 text-xs font-bold text-slate-800">
                      {fmtInt(r.quota)}명 · {r.rate !== null ? `${r.rate.toFixed(1)}:1` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">충원순위</div>
                    <div className="mt-0.5 text-xs font-bold text-slate-800">{fmtInt(r.wait)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-indigo-600 font-semibold">50%컷(9등급)</div>
                    <div className="mt-0.5 text-sm font-extrabold text-indigo-600">{fmt(r.c50)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-indigo-800 font-semibold">70%컷(9등급)</div>
                    <div className="mt-0.5 text-sm font-extrabold text-indigo-900">{fmt(r.c70)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-2xs ring-1 ring-slate-200/80">
          <table className="w-full min-w-[720px] text-xs tabular-nums border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-2.5 px-2.5 text-center">연도</th>
                <th className="py-2.5 px-2.5 text-center">대학</th>
                <th className="py-2.5 px-2 text-center">유형</th>
                <th className="py-2.5 px-2.5 text-left">세부전형</th>
                <th className="py-2.5 px-2.5 text-left">모집단위</th>
                <th className="py-2.5 px-2 text-right">모집</th>
                <th className="py-2.5 px-2 text-right">경쟁률</th>
                <th className="py-2.5 px-2 text-right">충원</th>
                <th className="py-2.5 px-2 text-right bg-indigo-900">50%컷</th>
                <th className="py-2.5 px-2.5 text-right bg-indigo-900">70%컷</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                  className="cursor-pointer hover:bg-indigo-50/40"
                >
                  <td className="py-2 px-2.5 text-center font-bold">{r.yr}</td>
                  <td className="py-2 px-2.5 text-center font-bold text-slate-900">{r.u}</td>
                  <td className="py-2 px-2 text-center">{r.t}</td>
                  <td className="py-2 px-2.5 text-slate-600">{r.adm}</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">{r.dept}</td>
                  <td className="py-2 px-2 text-right">{fmtInt(r.quota)}</td>
                  <td className="py-2 px-2 text-right">{fmt(r.rate)}</td>
                  <td className="py-2 px-2 text-right">{fmtInt(r.wait)}</td>
                  <td className="py-2 px-2 text-right font-bold text-indigo-600">{fmt(r.c50)}</td>
                  <td className="py-2 px-2.5 text-right font-extrabold text-indigo-800">
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
          className="w-full rounded-2xl bg-white py-3.5 text-xs font-extrabold text-indigo-600 shadow-2xs ring-1 ring-slate-200/80 hover:bg-indigo-50"
        >
          더 보기 ({visibleCount.toLocaleString()} / {filtered.length.toLocaleString()})
        </button>
      )}
    </div>
  );
};
