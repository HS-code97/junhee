import React, { useMemo, useState } from 'react';
import { Search, LayoutGrid, Table, X } from 'lucide-react';
import type { JeongsiRawRow } from '../types';
import { UNIV_THEMES } from '../lib/simulatorEngine';
import type { SelectedDetailTarget } from './DeptDetailSheet';

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
      <div className="rounded-3xl bg-white py-16 text-center shadow-2xs ring-1 ring-slate-200/80">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-3 border-teal-200 border-t-teal-600" />
        <p className="mt-3 text-xs font-bold text-slate-600">
          정시 3개년 원천 데이터베이스(2,149건)를 불러오는 중...
        </p>
      </div>
    );
  }

  const fmt = (v: number | null, d = 2) => (v === null ? '-' : v.toFixed(d));
  const fmtInt = (v: number | null) => (v === null ? '-' : v.toLocaleString());

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-700 to-cyan-700 p-4 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-teal-100">
              엑셀 3번 시트 · 환산점수 / 국수탐 백분위 엄격 분리
            </span>
            <h2 className="mt-0.5 text-lg font-extrabold">정시 3개년(2024~2026) 입결 DB 조회</h2>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-2xl bg-white/18 px-3 py-1.5 text-xs font-extrabold tabular-nums">
            총 {rows.length.toLocaleString()}건
          </span>
        </div>
        <p className="mt-1 text-xs text-teal-100">
          가·나·다군 대학별 환산점수(50%·70%컷) 및 수능 국수탐 평균 백분위(50%·70%컷) 원천 데이터
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
              placeholder="정시 학과명 · 대학명 · 전형명 검색"
              className="h-10 w-full rounded-2xl bg-slate-50 pr-8 pl-9 text-xs font-semibold text-slate-800 ring-1 ring-slate-200/80 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
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
                viewMode === 'card' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="표 보기"
              className={`rounded-lg p-1.5 ${
                viewMode === 'table' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'
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
                  ? 'bg-teal-700 text-white'
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
              value={gunFilter}
              onChange={(e) => {
                setGunFilter(e.target.value);
                setVisibleCount(40);
              }}
              className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700"
            >
              <option value="전체">모집군: 전체</option>
              <option value="가">가군</option>
              <option value="나">나군</option>
              <option value="다">다군</option>
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
            <option value="p70Desc">국수탐 백분위70% 높은순</option>
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
              badgeBg: 'bg-teal-50',
              badgeText: 'text-teal-700',
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
                className="cursor-pointer rounded-3xl bg-white p-4 shadow-2xs ring-1 ring-slate-200/80 transition hover:ring-teal-300"
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
                    <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-extrabold text-teal-800">
                      {r.gun}군
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      {r.tr}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    모집 {fmtInt(r.quota)} · 경쟁 {r.rate !== null ? `${r.rate.toFixed(1)}:1` : '-'} · 충원{' '}
                    {fmtInt(r.wait)}
                  </span>
                </div>

                <h3 className="mt-2 text-[15px] font-extrabold text-slate-900">{r.dept}</h3>
                <p className="text-xs text-slate-500">{r.adm}</p>

                {/* Strictly Separated 2 Blocks: 대학환산점수 vs 국수탐 백분위 */}
                <div className="mt-3 grid grid-cols-2 gap-2 tabular-nums">
                  <div className="rounded-2xl bg-indigo-50/70 p-2.5 ring-1 ring-indigo-100">
                    <div className="text-[10px] font-bold text-indigo-700">
                      대학환산점수 {r.sMax ? `(만점 ${r.sMax})` : ''}
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">50%컷</span>
                      <span className="font-bold text-indigo-700">{fmt(r.s50)}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-600">70%컷</span>
                      <span className="font-extrabold text-indigo-950">{fmt(r.s70)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-teal-50/80 p-2.5 ring-1 ring-teal-100">
                    <div className="flex items-center justify-between text-[10px] font-bold text-teal-800">
                      <span>국수탐 백분위</span>
                      <span>영어 {fmt(r.eng, 1)}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">50%컷</span>
                      <span className="font-bold text-teal-700">{fmt(r.p50)}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-600">70%컷</span>
                      <span className="font-extrabold text-teal-950">{fmt(r.p70)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-2xs ring-1 ring-slate-200/80">
          <table className="w-full min-w-[820px] text-xs tabular-nums border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-2.5 px-2 text-center">연도</th>
                <th className="py-2.5 px-2 text-center">대학</th>
                <th className="py-2.5 px-1.5 text-center">군</th>
                <th className="py-2.5 px-2.5 text-left">모집단위</th>
                <th className="py-2.5 px-2 text-right">모집</th>
                <th className="py-2.5 px-2 text-right">경쟁률</th>
                <th className="py-2.5 px-2 text-right bg-indigo-900">만점</th>
                <th className="py-2.5 px-2 text-right bg-indigo-900">환산70%</th>
                <th className="py-2.5 px-2 text-right bg-teal-800">백분위50%</th>
                <th className="py-2.5 px-2 text-right bg-teal-800">백분위70%</th>
                <th className="py-2.5 px-2 text-right bg-teal-800">영어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                  className="cursor-pointer hover:bg-teal-50/40"
                >
                  <td className="py-2 px-2 text-center font-bold">{r.yr}</td>
                  <td className="py-2 px-2 text-center font-bold text-slate-900">{r.u}</td>
                  <td className="py-2 px-1.5 text-center font-semibold text-teal-800">{r.gun}</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">{r.dept}</td>
                  <td className="py-2 px-2 text-right">{fmtInt(r.quota)}</td>
                  <td className="py-2 px-2 text-right">{fmt(r.rate)}</td>
                  <td className="py-2 px-2 text-right text-slate-500">{fmtInt(r.sMax)}</td>
                  <td className="py-2 px-2 text-right font-bold text-indigo-700">{fmt(r.s70)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-teal-700">{fmt(r.p50)}</td>
                  <td className="py-2 px-2 text-right font-extrabold text-teal-900">{fmt(r.p70)}</td>
                  <td className="py-2 px-2 text-right">{fmt(r.eng, 1)}</td>
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
          className="w-full rounded-2xl bg-white py-3.5 text-xs font-extrabold text-teal-700 shadow-2xs ring-1 ring-slate-200/80 hover:bg-teal-50"
        >
          더 보기 ({visibleCount.toLocaleString()} / {filtered.length.toLocaleString()})
        </button>
      )}
    </div>
  );
};
