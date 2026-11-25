import React from 'react';
import { X, Heart, Landmark, Sparkles, ExternalLink, Info } from 'lucide-react';
import type {
  JeongsiRawRow,
  JeongsiSimRow,
  Reform2028Item,
  SusiRawRow,
  SusiSimRow,
} from '../types';
import { JUDGMENT_STYLES, UNIV_THEMES } from '../lib/simulatorEngine';

export type SelectedDetailTarget =
  | {
      mode: 'susi';
      sim?: SusiSimRow;
      univ: string;
      adm: string;
      stdDept: string;
      typeLabel: string;
      track: string;
      judgment?: string;
    }
  | {
      mode: 'jeongsi';
      sim?: JeongsiSimRow;
      univ: string;
      gun: string;
      adm: string;
      stdDept: string;
      track: string;
      judgment?: string;
    };

interface DeptDetailSheetProps {
  target: SelectedDetailTarget | null;
  onClose: () => void;
  susiRaw: SusiRawRow[] | null;
  jeongsiRaw: JeongsiRawRow[] | null;
  rawLoading: boolean;
  reformItem?: Reform2028Item;
  isFav: boolean;
  onToggleFav: () => void;
}

export const DeptDetailSheet: React.FC<DeptDetailSheetProps> = ({
  target,
  onClose,
  susiRaw,
  jeongsiRaw,
  rawLoading,
  reformItem,
  isFav,
  onToggleFav,
}) => {
  if (!target) return null;

  const theme = UNIV_THEMES[target.univ] ?? {
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    accent: '#4F46E5',
  };
  const jStyle = target.judgment ? JUDGMENT_STYLES[target.judgment] : null;

  const matchedSusiRows =
    target.mode === 'susi' && susiRaw
      ? susiRaw
          .filter(
            (r) => r.u === target.univ && r.adm === target.adm && r.stdDept === target.stdDept
          )
          .sort((a, b) => b.yr - a.yr)
      : [];

  const matchedJeongsiRows =
    target.mode === 'jeongsi' && jeongsiRaw
      ? jeongsiRaw
          .filter(
            (r) =>
              r.u === target.univ &&
              r.gun === target.gun &&
              r.adm === target.adm &&
              r.stdDept === target.stdDept
          )
          .sort((a, b) => b.yr - a.yr)
      : [];

  const fmt = (v: number | null | undefined, d = 2) =>
    v === null || v === undefined ? '-' : v.toFixed(d);
  const fmtInt = (v: number | null | undefined) =>
    v === null || v === undefined ? '-' : v.toLocaleString();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl animate-sheet-up pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle bar on mobile */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-lg px-2.5 py-0.5 text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
              >
                {target.univ}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {target.mode === 'susi' ? `수시 · ${target.typeLabel}` : `정시 · ${target.gun}군`}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {target.track}
              </span>
              {jStyle && target.judgment && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1 ${jStyle.bg} ${jStyle.text} ${jStyle.ring}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${jStyle.dot}`} />
                  {jStyle.shortLabel}
                </span>
              )}
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
              {target.stdDept}
            </h3>
            <p className="text-xs font-medium text-slate-500">{target.adm}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleFav}
              aria-label="관심학과 저장"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition active:scale-90 ${
                isFav
                  ? 'bg-rose-50 text-rose-500 ring-rose-200'
                  : 'bg-slate-50 text-slate-400 ring-slate-200 hover:text-rose-400'
              }`}
            >
              <Heart className={`h-4.5 w-4.5 ${isFav ? 'fill-rose-500' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Simulator Summary Strip */}
        {target.mode === 'susi' && target.sim && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-indigo-50/60 p-3 text-center ring-1 ring-indigo-100">
            <div>
              <div className="text-[11px] font-semibold text-slate-500">3개년 평균 70%컷</div>
              <div className="mt-0.5 text-base font-extrabold text-slate-900 tabular-nums">
                {fmt(target.sim.avg)}등급
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">요구 상위 누적(%)</div>
              <div className="mt-0.5 text-base font-extrabold text-indigo-600 tabular-nums">
                상위 {fmt(target.sim.reqPct, 1)}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">5등급제 환산 구간</div>
              <div className="mt-0.5 text-sm font-extrabold text-violet-700 tabular-nums">
                {target.sim.g5Label || '-'}
              </div>
            </div>
          </div>
        )}

        {target.mode === 'jeongsi' && target.sim && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-teal-50/70 p-3 text-center ring-1 ring-teal-100">
            <div>
              <div className="text-[11px] font-semibold text-slate-500">3개년 평균 백분위70%</div>
              <div className="mt-0.5 text-base font-extrabold text-teal-800 tabular-nums">
                {fmt(target.sim.avg, 2)}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">3개년 추이</div>
              <div className="mt-0.5 text-sm font-extrabold text-slate-800 tabular-nums">
                {target.sim.trend}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">26학년도 경쟁률</div>
              <div className="mt-0.5 text-base font-extrabold text-slate-900 tabular-nums">
                {target.sim.r26 ? `${target.sim.r26.toFixed(2)}:1` : '-'}
              </div>
            </div>
          </div>
        )}

        {/* 3-Year Raw Records Table */}
        <div className="mt-5">
          <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-indigo-600" />
            최근 3개년(2024~2026학년도) 공식 원천 입결 상세
          </h4>

          {rawLoading ? (
            <div className="mt-2 rounded-2xl bg-slate-50 py-8 text-center text-xs font-medium text-slate-500">
              원천 상세 데이터를 불러오는 중입니다...
            </div>
          ) : target.mode === 'susi' ? (
            <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-slate-200/80">
              <table className="w-full text-[11.5px] tabular-nums border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200/80 whitespace-nowrap">
                    <th className="py-2 px-1.5 text-center font-bold">연도</th>
                    <th className="py-2 px-1.5 text-right font-bold">모집</th>
                    <th className="py-2 px-1.5 text-right font-bold">경쟁률</th>
                    <th className="py-2 px-1.5 text-right font-bold">충원</th>
                    <th className="py-2 px-1.5 text-right font-bold text-indigo-700">50%컷</th>
                    <th className="py-2 px-1.5 text-right font-bold text-indigo-800">70%컷</th>
                    <th className="py-2 px-1.5 text-center font-bold">출처</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                  {matchedSusiRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-5 text-center text-slate-400">
                        일치하는 원천 레코드가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    matchedSusiRows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-1.5 text-center font-extrabold text-slate-900">
                          {r.yr}
                        </td>
                        <td className="py-2 px-1.5 text-right text-slate-700">{fmtInt(r.quota)}</td>
                        <td className="py-2 px-1.5 text-right text-slate-700">
                          {r.rate !== null ? `${r.rate.toFixed(1)}:1` : '-'}
                        </td>
                        <td className="py-2 px-1.5 text-right text-slate-700">{fmtInt(r.wait)}</td>
                        <td className="py-2 px-1.5 text-right font-semibold text-indigo-600">
                          {fmt(r.c50)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-extrabold text-indigo-800">
                          {fmt(r.c70)}
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {r.src}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-slate-200/80">
              <table className="w-full min-w-[540px] text-xs tabular-nums border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                    <th className="py-2.5 px-2 text-center font-bold">학년도</th>
                    <th className="py-2.5 px-2 text-right font-bold">모집</th>
                    <th className="py-2.5 px-2 text-right font-bold">경쟁률</th>
                    <th className="py-2.5 px-2 text-right font-bold">충원</th>
                    <th className="py-2.5 px-2 text-right font-bold text-indigo-700">환산70%(만점)</th>
                    <th className="py-2.5 px-2 text-right font-bold text-teal-700">백분위50%</th>
                    <th className="py-2.5 px-2 text-right font-bold text-teal-800">백분위70%</th>
                    <th className="py-2.5 px-2 text-right font-bold">영어등급</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matchedJeongsiRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-5 text-center text-slate-400">
                        일치하는 원천 레코드가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    matchedJeongsiRows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-2 text-center font-extrabold text-slate-900">
                          {r.yr}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-700">{fmtInt(r.quota)}</td>
                        <td className="py-2.5 px-2 text-right text-slate-700">
                          {r.rate !== null ? `${r.rate.toFixed(2)}:1` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-700">{fmtInt(r.wait)}</td>
                        <td className="py-2.5 px-2 text-right font-semibold text-indigo-700">
                          {r.s70 !== null
                            ? `${r.s70.toFixed(2)}${r.sMax ? ` / ${r.sMax}` : ''}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold text-teal-700">
                          {fmt(r.p50)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-extrabold text-teal-900">
                          {fmt(r.p70)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-700">{fmt(r.eng)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Linked 2028 University Reform Highlights */}
        {reformItem && (
          <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#F8F9FF] to-[#FFF7FA] p-4 ring-1 ring-indigo-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-indigo-600" />
                {target.univ} · 2028 대입개편(현 고1 적용) 핵심 체크!
              </h4>
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
            </div>

            <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-slate-700">
              {target.mode === 'susi' ? (
                <>
                  <div>
                    <span className="font-bold text-indigo-700">• 학생부교과: </span>
                    {reformItem.수시_교과전형_5등급제반영및정성평가여부}
                  </div>
                  <div>
                    <span className="font-bold text-violet-700">• 학종·논술 변화: </span>
                    {reformItem['수시_학종_주요변화(면접/수능최저등)']}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="font-bold text-teal-700">• 정시 학생부 반영: </span>
                    {reformItem.정시_학생부반영여부및비율}
                  </div>
                  <div>
                    <span className="font-bold text-indigo-700">• 통합수능 영역 반영: </span>
                    {reformItem.정시_통합수능_영역별반영특징}
                  </div>
                </>
              )}
              <div className="rounded-xl bg-white/90 p-2.5 ring-1 ring-indigo-100/80">
                <span className="font-extrabold text-rose-600">✦ 고1 수련이 준비 포인트: </span>
                <span className="font-medium text-slate-800">
                  {reformItem['2029학년도_현고1_준비포인트']}
                </span>
              </div>
            </div>

            {reformItem.출처URL_및_발표시점.includes('http') && (
              <div className="mt-2 text-right">
                <a
                  href={
                    reformItem.출처URL_및_발표시점
                      .split('|')
                      .map((s) => s.trim())
                      .find((s) => s.startsWith('http')) || '#'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  입학처 공식 공지 바로가기
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
