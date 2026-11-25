import React, { useEffect, useState } from 'react';
import { X, Heart, Landmark, Sparkles, ExternalLink, Info, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [expandedSheet, setExpandedSheet] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);

  useEffect(() => {
    setExpandedSheet(false);
    setDragOffsetY(0);
    setDragStartY(null);
  }, [target]);

  if (!target) return null;

  const theme = UNIV_THEMES[target.univ] ?? {
    badgeBg: 'bg-[#F3EEFC]',
    badgeText: 'text-[#6A57A5]',
    accent: '#8B7AC9',
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setDragOffsetY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null) return;
    const dy = e.touches[0].clientY - dragStartY;
    // Allow dragging down freely and subtle pull-up resistance
    if (dy > 0) {
      setDragOffsetY(Math.min(dy, 260));
    } else {
      setDragOffsetY(Math.max(dy * 0.35, -48));
    }
  };

  const handleTouchEnd = () => {
    if (dragStartY === null) return;
    if (dragOffsetY > 95) {
      if (expandedSheet) {
        setExpandedSheet(false);
      } else {
        onClose();
      }
    } else if (dragOffsetY < -20) {
      setExpandedSheet(true);
    }
    setDragStartY(null);
    setDragOffsetY(0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#231E33]/35 p-0 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className={`glass-sheet w-full max-w-2xl overflow-y-auto soft-scrollbar rounded-t-[30px] sm:rounded-[30px] p-5 sm:p-6 ring-1 ring-[#EAE3F7] animate-sheet-up pb-safe transition-all duration-200 ${
          expandedSheet ? 'max-h-[94vh] min-h-[82vh]' : 'max-h-[84vh]'
        }`}
        style={{
          transform: dragOffsetY !== 0 ? `translateY(${dragOffsetY}px)` : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Pull-up / Drag-down Handle Area */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setExpandedSheet((v) => !v)}
          role="button"
          tabIndex={0}
          aria-label={expandedSheet ? '바텀시트 기본 높이로 줄이기' : '바텀시트 위로 밀어 크게 보기'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setExpandedSheet((v) => !v);
          }}
          className="group -mt-2 mb-3 flex flex-col items-center justify-center py-1.5 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="h-1.5 w-12 rounded-full bg-[#D7CEEB] transition group-hover:bg-[#B8A7E2]" />
          <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#9B93B0]">
            {expandedSheet ? (
              <>
                <ChevronDown className="h-3 w-3" />
                아래로 내리면 기본 크기 / 닫기
              </>
            ) : (
              <>
                <ChevronUp className="h-3 w-3" />
                위로 밀어 올려서 더 넓게 보기
              </>
            )}
          </span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-lg px-2.5 py-0.5 text-xs font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
              >
                {target.univ}
              </span>
              <span className="rounded-lg bg-[#F5F2FB] px-2 py-0.5 text-xs font-semibold text-[#534A6C]">
                {target.mode === 'susi' ? `수시 · ${target.typeLabel}` : `정시 · ${target.gun}군`}
              </span>
              <span className="rounded-lg bg-white/80 px-2 py-0.5 text-xs font-medium text-[#7B7292] ring-1 ring-[#ECE6F7]">
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
            <h3 className="text-xl font-extrabold tracking-tight text-[#231E33]">
              {target.stdDept}
            </h3>
            <p className="text-xs font-medium text-[#7D7494]">{target.adm}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleFav}
              aria-label="관심학과 저장"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition active:scale-90 ${
                isFav
                  ? 'bg-[#FDF0F6] text-[#DB6F9E] ring-[#F4CBE0]'
                  : 'bg-[#F7F5FC] text-[#B3ABC8] ring-[#E8E2F4] hover:text-[#DF7BA6]'
              }`}
            >
              <Heart className={`h-4.5 w-4.5 ${isFav ? 'fill-[#DB6F9E]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F2FB] text-[#7A6F93] hover:bg-[#ECE6F8]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Simulator Summary Strip */}
        {target.mode === 'susi' && target.sim && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-gradient-to-r from-[#F5F1FD] via-[#FAF4FC] to-[#FDF2F7] p-3 text-center ring-1 ring-[#E8DDF7]">
            <div>
              <div className="text-[11px] font-semibold text-[#7D7494]">3개년 평균 70%컷</div>
              <div className="mt-0.5 text-base font-extrabold text-[#231E33] tabular-nums">
                {fmt(target.sim.avg)}등급
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#7D7494]">요구 상위 누적(%)</div>
              <div className="mt-0.5 text-base font-extrabold text-[#7561B4] tabular-nums">
                상위 {fmt(target.sim.reqPct, 1)}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#7D7494]">5등급제 환산 구간</div>
              <div className="mt-0.5 text-sm font-extrabold text-[#BD4F82] tabular-nums">
                {target.sim.g5Label || '-'}
              </div>
            </div>
          </div>
        )}

        {target.mode === 'jeongsi' && target.sim && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-gradient-to-r from-[#EEF8FA] to-[#F4F1FD] p-3 text-center ring-1 ring-[#D4EAF0]">
            <div>
              <div className="text-[11px] font-semibold text-[#667D85]">3개년 평균 백분위70%</div>
              <div className="mt-0.5 text-base font-extrabold text-[#256776] tabular-nums">
                {fmt(target.sim.avg, 2)}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#667D85]">3개년 추이</div>
              <div className="mt-0.5 text-sm font-extrabold text-[#231E33] tabular-nums">
                {target.sim.trend}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#667D85]">26학년도 경쟁률</div>
              <div className="mt-0.5 text-base font-extrabold text-[#231E33] tabular-nums">
                {target.sim.r26 ? `${target.sim.r26.toFixed(2)}:1` : '-'}
              </div>
            </div>
          </div>
        )}

        {/* 3-Year Raw Records Table */}
        <div className="mt-5">
          <h4 className="text-xs font-extrabold text-[#2B2440] flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#8674C4]" />
            최근 3개년(2024~2026학년도) 공식 원천 입결 상세
          </h4>

          {rawLoading ? (
            <div className="mt-2 rounded-2xl bg-[#F7F5FC] py-8 text-center text-xs font-medium text-[#7D7494]">
              원천 상세 데이터를 불러오는 중입니다...
            </div>
          ) : target.mode === 'susi' ? (
            <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-[#EAE3F7]">
              <table className="w-full text-[11.5px] tabular-nums border-collapse">
                <thead>
                  <tr className="bg-[#F5F1FD] text-[#5C507A] border-b border-[#EAE3F7] whitespace-nowrap">
                    <th className="py-2 px-1.5 text-center font-bold">연도</th>
                    <th className="py-2 px-1.5 text-right font-bold">모집</th>
                    <th className="py-2 px-1.5 text-right font-bold">경쟁률</th>
                    <th className="py-2 px-1.5 text-right font-bold">충원</th>
                    <th className="py-2 px-1.5 text-right font-bold text-[#6D5AA8]">50%컷</th>
                    <th className="py-2 px-1.5 text-right font-bold text-[#BD4F82]">70%컷</th>
                    <th className="py-2 px-1.5 text-center font-bold">출처</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEF9] whitespace-nowrap">
                  {matchedSusiRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-5 text-center text-[#9B93B0]">
                        일치하는 원천 레코드가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    matchedSusiRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FAF8FE]">
                        <td className="py-2 px-1.5 text-center font-extrabold text-[#231E33]">
                          {r.yr}
                        </td>
                        <td className="py-2 px-1.5 text-right text-[#4C4462]">{fmtInt(r.quota)}</td>
                        <td className="py-2 px-1.5 text-right text-[#4C4462]">
                          {r.rate !== null ? `${r.rate.toFixed(1)}:1` : '-'}
                        </td>
                        <td className="py-2 px-1.5 text-right text-[#4C4462]">{fmtInt(r.wait)}</td>
                        <td className="py-2 px-1.5 text-right font-semibold text-[#7561B4]">
                          {fmt(r.c50)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-extrabold text-[#A83F70]">
                          {fmt(r.c70)}
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          <span className="rounded-md bg-[#F5F2FB] px-1.5 py-0.5 text-[10px] font-semibold text-[#6F6785]">
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
            <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-[#DCEEF3]">
              <table className="w-full min-w-[540px] text-xs tabular-nums border-collapse">
                <thead>
                  <tr className="bg-[#EEF8FA] text-[#356372] border-b border-[#D6EAF0]">
                    <th className="py-2.5 px-2 text-center font-bold">학년도</th>
                    <th className="py-2.5 px-2 text-right font-bold">모집</th>
                    <th className="py-2.5 px-2 text-right font-bold">경쟁률</th>
                    <th className="py-2.5 px-2 text-right font-bold">충원</th>
                    <th className="py-2.5 px-2 text-right font-bold text-[#6D5AA8]">환산70%(만점)</th>
                    <th className="py-2.5 px-2 text-right font-bold text-[#2F7888]">백분위50%</th>
                    <th className="py-2.5 px-2 text-right font-bold text-[#1E535F]">백분위70%</th>
                    <th className="py-2.5 px-2 text-right font-bold">영어등급</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EEF7]">
                  {matchedJeongsiRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-5 text-center text-[#9B93B0]">
                        일치하는 원천 레코드가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    matchedJeongsiRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F5FBFC]">
                        <td className="py-2.5 px-2 text-center font-extrabold text-[#231E33]">
                          {r.yr}
                        </td>
                        <td className="py-2.5 px-2 text-right text-[#4C4462]">{fmtInt(r.quota)}</td>
                        <td className="py-2.5 px-2 text-right text-[#4C4462]">
                          {r.rate !== null ? `${r.rate.toFixed(2)}:1` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right text-[#4C4462]">{fmtInt(r.wait)}</td>
                        <td className="py-2.5 px-2 text-right font-semibold text-[#6D5AA8]">
                          {r.s70 !== null
                            ? `${r.s70.toFixed(2)}${r.sMax ? ` / ${r.sMax}` : ''}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold text-[#2F7888]">
                          {fmt(r.p50)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-extrabold text-[#1E535F]">
                          {fmt(r.p70)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-[#4C4462]">{fmt(r.eng)}</td>
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
          <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#F7F2FE] via-[#FAF4FC] to-[#FDF2F7] p-4 ring-1 ring-[#EBDDF5]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#47335C] flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-[#8674C4]" />
                {target.univ} · 2028 대입개편(현 고1 적용) 핵심 체크!
              </h4>
              <Sparkles className="h-3.5 w-3.5 text-[#DF7BA6]" />
            </div>

            <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#4C4462]">
              {target.mode === 'susi' ? (
                <>
                  <div>
                    <span className="font-bold text-[#6D5AA8]">• 학생부교과: </span>
                    {reformItem.수시_교과전형_5등급제반영및정성평가여부}
                  </div>
                  <div>
                    <span className="font-bold text-[#BD4F82]">• 학종·논술 변화: </span>
                    {reformItem['수시_학종_주요변화(면접/수능최저등)']}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="font-bold text-[#2F7888]">• 정시 학생부 반영: </span>
                    {reformItem.정시_학생부반영여부및비율}
                  </div>
                  <div>
                    <span className="font-bold text-[#6D5AA8]">• 통합수능 영역 반영: </span>
                    {reformItem.정시_통합수능_영역별반영특징}
                  </div>
                </>
              )}
              <div className="rounded-xl bg-white/90 p-2.5 ring-1 ring-[#EFE2F5]">
                <span className="font-extrabold text-[#BD4F82]">✦ 고1 수련이 준비 포인트: </span>
                <span className="font-medium text-[#231E33]">
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
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6D5AA8] hover:underline"
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
