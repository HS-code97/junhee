import React, { useState } from 'react';
import {
  Landmark,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Database,
  Download,
} from 'lucide-react';
import type { CollectionLogPayload, DashboardUnivRow, Reform2028Item } from '../types';
import {
  EXCEL_DOWNLOAD_FILENAME,
  EXCEL_DOWNLOAD_URL,
  UNIV_THEMES,
} from '../lib/simulatorEngine';

interface Reform2028TabProps {
  universities: string[];
  reform2028: Reform2028Item[];
  dashboard: DashboardUnivRow[];
  collectionLog: CollectionLogPayload | null;
}

export const Reform2028Tab: React.FC<Reform2028TabProps> = ({
  universities,
  reform2028,
  dashboard,
  collectionLog,
}) => {
  const [subTab, setSubTab] = useState<'reform' | 'coverage'>('reform');
  const [univFilter, setUnivFilter] = useState<string>('전체');

  const filteredReform =
    univFilter === '전체'
      ? reform2028
      : reform2028.filter((item) => item.대학명 === univFilter);

  return (
    <div className="space-y-4">
      {/* Sub-mode Toggle — High-contrast solid active tab */}
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#EAE8F2] p-1.5">
        <button
          type="button"
          onClick={() => setSubTab('reform')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition ${
            subTab === 'reform'
              ? 'bg-[#1F1B2C] text-white shadow-xs'
              : 'text-[#5F5A70] hover:text-[#1F1B2C]'
          }`}
        >
          <Landmark className="h-4 w-4" />
          2028 대입개편 요약 (시트5)
        </button>
        <button
          type="button"
          onClick={() => setSubTab('coverage')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition ${
            subTab === 'coverage'
              ? 'bg-[#1F1B2C] text-white shadow-xs'
              : 'text-[#5F5A70] hover:text-[#1F1B2C]'
          }`}
        >
          <Database className="h-4 w-4" />
          수집 현황 · 출처 검증 (시트1·6)
        </button>
      </div>

      {subTab === 'reform' ? (
        <>
          {/* Flat Solid Pastel Lavender Header Banner */}
          <div className="rounded-[24px] bg-[#E4DBFA] p-4.5 text-[#1F1B2C]">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-[10.5px] font-bold text-[#494459]">
              <Sparkles className="h-3 w-3 text-[#D45D92]" />
              현 고1(2029학년도 대입) 직접 적용 구조
            </span>
            <h2 className="mt-1.5 text-lg font-extrabold tracking-tight text-[#1F1B2C]">
              서울 13개 대학 2028학년도 전형 시행계획 핵심 변화
            </h2>
            <p className="mt-1 text-xs font-medium text-[#4E4766] leading-relaxed">
              내신 5등급제 전환에 따른 교과 서류평가 확대, 정시 학생부 반영 신설, 통합수능 반영 변화와 수련이를 위한 대학별 준비 포인트를 정리했어요.
            </p>
          </div>

          {/* Univ Filter Chips — Solid dark active pill */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {['전체', ...universities].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnivFilter(u)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  univFilter === u
                    ? 'bg-[#1F1B2C] text-white'
                    : 'bg-white text-[#5F5A70] ring-1 ring-[#E6E4EE] hover:bg-[#F3F2F7]'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* 13 Univ Reform Cards */}
          <div className="space-y-3.5">
            {filteredReform.map((item) => {
              const theme = UNIV_THEMES[item.대학명] ?? {
                badgeBg: 'bg-[#F2F1F7]',
                badgeText: 'text-[#1F1B2C]',
              };
              const urlMatch = item.출처URL_및_발표시점
                .split('|')
                .map((s) => s.trim())
                .find((s) => s.startsWith('http'));

              return (
                <article
                  key={item.대학명}
                  className="glass-card rounded-[24px] p-5 ring-1 ring-[#E6E4EE] space-y-3.5"
                >
                  <div className="flex items-center justify-between border-b border-[#EFEFF4] pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-xl px-3 py-1 text-sm font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        {item.대학명}
                      </span>
                      <span className="text-xs font-semibold text-[#8C879C]">
                        2028 시행계획 공식 발표 기준
                      </span>
                    </div>
                    {urlMatch && (
                      <a
                        href={urlMatch}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-[#F3F2F7] px-2.5 py-1 text-[11px] font-bold text-[#494459] ring-1 ring-[#E4E2EC] hover:bg-[#EAE8F2]"
                      >
                        입학처 원문
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 text-xs leading-relaxed">
                    <div className="rounded-2xl bg-[#F6F5FA] p-3">
                      <div className="font-extrabold text-[#1F1B2C]">
                        ① 수시 학생부교과 (5등급제·서류반영)
                      </div>
                      <p className="mt-1 text-[#494459]">
                        {item.수시_교과전형_5등급제반영및정성평가여부}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F6F5FA] p-3">
                      <div className="font-extrabold text-[#1F1B2C]">
                        ② 수시 학종 · 논술 주요 변화
                      </div>
                      <p className="mt-1 text-[#494459]">
                        {item['수시_학종_주요변화(면접/수능최저등)']}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F6F5FA] p-3">
                      <div className="font-extrabold text-[#1F1B2C]">
                        ③ 정시 학생부 반영 여부·비율
                      </div>
                      <p className="mt-1 text-[#494459]">{item.정시_학생부반영여부및비율}</p>
                    </div>

                    <div className="rounded-2xl bg-[#F6F5FA] p-3">
                      <div className="font-extrabold text-[#1F1B2C]">
                        ④ 정시 통합수능 영역별 반영 특징
                      </div>
                      <p className="mt-1 text-[#494459]">{item.정시_통합수능_영역별반영특징}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#FCEEF4] p-3.5 ring-1 ring-[#F2C3D8]">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#B53F74]">
                      <Sparkles className="h-3.5 w-3.5 text-[#D45D92]" />
                      2029학년도(현 고1) 핵심 준비 포인트
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[#1F1B2C]">
                      {item['2029학년도_현고1_준비포인트']}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* KPI Summary */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="glass-card rounded-2xl p-3.5 text-center ring-1 ring-[#E6E4EE]">
              <div className="text-[11px] font-semibold text-[#7A748A]">대상 대학</div>
              <div className="mt-1 text-lg font-extrabold text-[#1F1B2C]">13개교</div>
            </div>
            <div className="glass-card rounded-2xl p-3.5 text-center ring-1 ring-[#E6E4EE]">
              <div className="text-[11px] font-semibold text-[#7A748A]">수시 3개년 레코드</div>
              <div className="mt-1 text-lg font-extrabold text-[#1F1B2C] tabular-nums">4,396건</div>
            </div>
            <div className="glass-card rounded-2xl p-3.5 text-center ring-1 ring-[#E6E4EE]">
              <div className="text-[11px] font-semibold text-[#7A748A]">정시 3개년 레코드</div>
              <div className="mt-1 text-lg font-extrabold text-[#1F1B2C] tabular-nums">2,149건</div>
            </div>
            <div className="glass-card rounded-2xl p-3.5 text-center ring-1 ring-[#E6E4EE]">
              <div className="text-[11px] font-semibold text-[#7A748A]">원본 엑셀(.xlsx)</div>
              <a
                href={EXCEL_DOWNLOAD_URL}
                download={EXCEL_DOWNLOAD_FILENAME}
                className="mt-1 inline-flex items-center gap-1 text-xs font-extrabold text-[#D45D92] hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                6시트 다운로드
              </a>
            </div>
          </div>

          {/* Coverage Table */}
          <div className="glass-card overflow-x-auto rounded-[24px] p-4 ring-1 ring-[#E6E4EE]">
            <h3 className="mb-3 text-sm font-extrabold text-[#1F1B2C] flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#2E9982]" />
              대학별 3개년(2024~2026) 수시·정시 확보 건수 요약 (시트1)
            </h3>
            <table className="w-full min-w-[600px] text-xs tabular-nums border-collapse">
              <thead>
                <tr className="bg-[#F3F2F7] text-[#494459]">
                  <th className="py-2 px-2 text-center rounded-tl-xl">대학명</th>
                  <th className="py-2 px-2 text-right">수시24</th>
                  <th className="py-2 px-2 text-right">수시25</th>
                  <th className="py-2 px-2 text-right">수시26</th>
                  <th className="py-2 px-2 text-right font-extrabold text-[#1F1B2C]">수시합계</th>
                  <th className="py-2 px-2 text-right">정시24</th>
                  <th className="py-2 px-2 text-right">정시25</th>
                  <th className="py-2 px-2 text-right">정시26</th>
                  <th className="py-2 px-2 text-right font-extrabold text-[#1F1B2C]">정시합계</th>
                  <th className="py-2 px-2 text-center rounded-tr-xl">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFF4]">
                {dashboard.map((d) => (
                  <tr key={d.univ} className="hover:bg-[#F6F5FA]">
                    <td className="py-2 px-2 text-center font-extrabold text-[#1F1B2C]">{d.univ}</td>
                    <td className="py-2 px-2 text-right text-[#5F5A70]">{d.s24}</td>
                    <td className="py-2 px-2 text-right text-[#5F5A70]">{d.s25}</td>
                    <td className="py-2 px-2 text-right text-[#5F5A70]">{d.s26}</td>
                    <td className="py-2 px-2 text-right font-bold text-[#6350A8]">{d.sTotal}</td>
                    <td className="py-2 px-2 text-right text-[#5F5A70]">{d.j24}</td>
                    <td className="py-2 px-2 text-right text-[#5F5A70]">{d.j25}</td>
                    <td className="py-2 px-2 text-right text-[#5F5A70]">{d.j26}</td>
                    <td className="py-2 px-2 text-right font-bold text-[#1F1B2C]">{d.jTotal}</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                          d.status === '완료'
                            ? 'bg-[#E8F6F1] text-[#1D6E5C]'
                            : 'bg-[#FDF5E4] text-[#8F5B10]'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dept Mappings (Sheet 6) */}
          {collectionLog && collectionLog.dept_mappings.length > 0 && (
            <div className="glass-card rounded-[24px] p-4 ring-1 ring-[#E6E4EE]">
              <h3 className="mb-2.5 text-sm font-extrabold text-[#1F1B2C]">
                신설 자유전공(무전공) · 학과 통폐합 3개년 추적 매핑 내역 (시트6)
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                {collectionLog.dept_mappings.map((m, idx) => (
                  <div
                    key={`${m.대학명}-${m.원모집단위명}-${idx}`}
                    className="flex items-center justify-between rounded-2xl bg-[#F6F5FA] px-3 py-2"
                  >
                    <div>
                      <span className="font-extrabold text-[#1F1B2C]">{m.대학명}</span>{' '}
                      <span className="font-semibold text-[#494459]">{m.표준모집단위명}</span>
                    </div>
                    <span className="rounded-lg bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[#5F5A70] ring-1 ring-[#E6E4EE]">
                      {m.변동구분}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
