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
    badgeBg: 'bg-[#F2F1F7]',
    badgeText: 'text-[#1F1B2C]',
    accent: '#7D6BB8',
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1F1B2C]/35 p-0 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className={`glass-sheet w-full max-w-2xl overflow-y-auto soft-scrollbar rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 ring-1 ring-[#E6E4EE] animate-sheet-up pb-safe transition-all duration-200 ${
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
          <div className="h-1.5 w-12 rounded-full bg-[#D6D3E0] transition group-hover:bg-[#938DA3]" />
          <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#938DA3]">
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
              <span className="rounded-lg bg-[#F6F5FA] px-2 py-0.5 text-xs font-semibold text-[#5F5A70]">
                {target.mode === 'susi' ? `수시 · ${target.typeLabel}` : `정시 · ${target.gun}군`}
              </span>
              <span className="rounded-lg bg-[#F6F5FA] px-2 py-0.5 text-xs font-medium text-[#686378]">
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
            <h3 className="text-xl font-extrabold tracking-tight text-[#1F1B2C]">
              {target.stdDept}
            </h3>
            <p className="text-xs font-medium text-[#7A748A]">{target.adm}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleFav}
              aria-label="관심학과 저장"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition active:scale-90 ${
                isFav
                  ? 'bg-[#D45D92] text-white ring-[#D45D92]'
                  : 'bg-[#F3F2F7] text-[#938DA3] ring-[#E4E2EC] hover:text-[#D45D92]'
              }`}
            >
              <Heart className={`h-4.5 w-4.5 ${isFav ? 'fill-white' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F2F7] text-[#5F5A70] hover:bg-[#EAE8F2]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Simulator Summary Strip — Clean flat neutral box */}
        {target.mode === 'susi' && target.sim && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#F6F5FA] p-3 text-center ring-1 ring-[#E8E6F0]">
            <div>
              <div className="text-[11px] font-semibold text-[#686378]">3개년 70%컷 (과거 9등급)</div>
              <div className="mt-0.5 text-base font-extrabold text-[#1F1B2C] tabular-nums">
                {fmt(target.sim.avg)}등급
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#686378]">환산 상위 누적(%)</div>
              <div className="mt-0.5 text-base font-extrabold text-[#6350A8] tabular-nums">
                상위 {fmt(target.sim.reqPct, 1)}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#686378]">현 고1 환산 (5등급제)</div>
              <div className="mt-0.5 text-sm font-extrabold text-[#D45D92] tabular-nums">
                {target.sim.g5Label || '-'}
              </div>
            </div>
          </div>
        )}

        {target.mode === 'jeongsi' && target.sim && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#F6F5FA] p-3 text-center ring-1 ring-[#E8E6F0]">
            <div>
              <div className="text-[11px] font-semibold text-[#686378]">국수탐 백분위 70%컷</div>
              <div className="mt-0.5 text-base font-extrabold text-[#1F1B2C] tabular-nums">
                {fmt(target.sim.avg, 2)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#686378]">3개년 추이</div>
              <div className="mt-0.5 text-sm font-extrabold text-[#1F1B2C] tabular-nums">
                {target.sim.trend}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#686378]">26학년도 경쟁률</div>
              <div className="mt-0.5 text-base font-extrabold text-[#1F1B2C] tabular-nums">
                {target.sim.r26 ? `${target.sim.r26.toFixed(2)}:1` : '-'}
              </div>
            </div>
          </div>
        )}

        {/* 3-Year Raw Records Table */}
        <div className="mt-5">
          <h4 className="text-xs font-extrabold text-[#1F1B2C] flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#5F5A70]" />
            {target.mode === 'susi'
              ? '최근 3개년(2024~2026학년도) 공식 원천 입결 · 과거 9등급제 기준'
              : '최근 3개년(2024~2026학년도) 공식 원천 입결 · 환산점수 / 국수탐 백분위'}
          </h4>

          {rawLoading ? (
            <div className="mt-2 rounded-2xl bg-[#F6F5FA] py-8 text-center text-xs font-medium text-[#7A748A]">
              원천 상세 데이터를 불러오는 중입니다...
            </div>
          ) : target.mode === 'susi' ? (
            <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-[#E6E4EE]">
              <table className="w-full text-[11.5px] tabular-nums border-collapse">
                <thead>
                  <tr className="bg-[#F3F2F7] text-[#494459] border-b border-[#E6E4EE] whitespace-nowrap">
                    <th className="py-2 px-1.5 text-center font-bold">연도</th>
                    <th className="py-2 px-1.5 text-right font-bold">모집</th>
                    <th className="py-2 px-1.5 text-right font-bold">경쟁률</th>
                    <th className="py-2 px-1.5 text-right font-bold">충원</th>
                    <th className="py-2 px-1.5 text-right font-bold text-[#6350A8]">50%컷(9등급)</th>
                    <th className="py-2 px-1.5 text-right font-bold text-[#D45D92]">70%컷(9등급)</th>
                    <th className="py-2 px-1.5 text-center font-bold">출처</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFF4] whitespace-nowrap">
                  {matchedSusiRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-5 text-center text-[#938DA3]">
                        일치하는 원천 레코드가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    matchedSusiRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F6F5FA]">
                        <td className="py-2 px-1.5 text-center font-extrabold text-[#1F1B2C]">
                          {r.yr}
                        </td>
                        <td className="py-2 px-1.5 text-right text-[#494459]">{fmtInt(r.quota)}</td>
                        <td className="py-2 px-1.5 text-right text-[#494459]">
                          {r.rate !== null ? `${r.rate.toFixed(1)}:1` : '-'}
                        </td>
                        <td className="py-2 px-1.5 text-right text-[#494459]">{fmtInt(r.wait)}</td>
                        <td className="py-2 px-1.5 text-right font-semibold text-[#6350A8]">
                          {fmt(r.c50)}
                        </td>
                        <td className="py-2 px-1.5 text-right font-extrabold text-[#D45D92]">
                          {fmt(r.c70)}
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          <span className="rounded-md bg-[#F3F2F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#5F5A70]">
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
            <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-[#E6E4EE]">
              <table className="w-full min-w-[540px] text-xs tabular-nums border-collapse">
                <thead>
                  <tr className="bg-[#F3F2F7] text-[#494459] border-b border-[#E6E4EE]">
                    <th className="py-2.5 px-2 text-center font-bold">학년도</th>
                    <th className="py-2.5 px-2 text-right font-bold">모집</th>
                    <th className="py-2.5 px-2 text-right font-bold">경쟁률</th>
                    <th className="py-2.5 px-2 text-right font-bold">충원</th>
                    <th className="py-2.5 px-2 text-right font-bold">환산70%(만점)</th>
                    <th className="py-2.5 px-2 text-right font-bold text-[#6350A8]">백분위50%</th>
                    <th className="py-2.5 px-2 text-right font-bold text-[#D45D92]">백분위70%</th>
                    <th className="py-2.5 px-2 text-right font-bold">영어(9등급)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFF4]">
                  {matchedJeongsiRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-5 text-center text-[#938DA3]">
                        일치하는 원천 레코드가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    matchedJeongsiRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F6F5FA]">
                        <td className="py-2.5 px-2 text-center font-extrabold text-[#1F1B2C]">
                          {r.yr}
                        </td>
                        <td className="py-2.5 px-2 text-right text-[#494459]">{fmtInt(r.quota)}</td>
                        <td className="py-2.5 px-2 text-right text-[#494459]">
                          {r.rate !== null ? `${r.rate.toFixed(2)}:1` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right text-[#494459]">{fmtInt(r.wait)}</td>
                        <td className="py-2.5 px-2 text-right font-semibold text-[#1F1B2C]">
                          {r.s70 !== null
                            ? `${r.s70.toFixed(2)}${r.sMax ? ` / ${r.sMax}` : ''}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold text-[#6350A8]">
                          {fmt(r.p50)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-extrabold text-[#D45D92]">
                          {fmt(r.p70)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-[#494459]">{fmt(r.eng)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Linked 2028 University Reform Highlights — Flat neutral */}
        {reformItem && (
          <div className="mt-5 rounded-2xl bg-[#F6F5FA] p-4 ring-1 ring-[#E6E4EE]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#1F1B2C] flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-[#5F5A70]" />
                {target.univ} · 2028 대입개편(현 고1 적용) 핵심 체크!
              </h4>
              <Sparkles className="h-3.5 w-3.5 text-[#D45D92]" />
            </div>

            <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#494459]">
              {target.mode === 'susi' ? (
                <>
                  <div>
                    <span className="font-bold text-[#1F1B2C]">• 학생부교과: </span>
                    {reformItem.수시_교과전형_5등급제반영및정성평가여부}
                  </div>
                  <div>
                    <span className="font-bold text-[#1F1B2C]">• 학종·논술 변화: </span>
                    {reformItem['수시_학종_주요변화(면접/수능최저등)']}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="font-bold text-[#1F1B2C]">• 정시 학생부 반영: </span>
                    {reformItem.정시_학생부반영여부및비율}
                  </div>
                  <div>
                    <span className="font-bold text-[#1F1B2C]">• 통합수능 영역 반영: </span>
                    {reformItem.정시_통합수능_영역별반영특징}
                  </div>
                </>
              )}
              <div className="rounded-xl bg-white p-2.5 ring-1 ring-[#E6E4EE]">
                <span className="font-extrabold text-[#D45D92]">✦ 고1 수련이 준비 포인트: </span>
                <span className="font-medium text-[#1F1B2C]">
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
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F1B2C] hover:underline"
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
