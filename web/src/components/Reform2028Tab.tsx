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
      {/* Sub-mode Toggle */}
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#EFEAF8]/90 p-1.5 ring-1 ring-[#E4DCF3]">
        <button
          type="button"
          onClick={() => setSubTab('reform')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition ${
            subTab === 'reform'
              ? 'bg-white text-[#6753A4] shadow-xs ring-1 ring-[#E6DDF7]'
              : 'text-[#6F6785] hover:text-[#231E33]'
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
              ? 'bg-white text-[#6753A4] shadow-xs ring-1 ring-[#E6DDF7]'
              : 'text-[#6F6785] hover:text-[#231E33]'
          }`}
        >
          <Database className="h-4 w-4" />
          수집 현황 · 출처 검증 (시트1·6)
        </button>
      </div>

      {subTab === 'reform' ? (
        <>
          {/* Pastel Rose-Lavender Header Banner */}
          <div className="rounded-[26px] bg-gradient-to-r from-[#FCE7F1] via-[#F2E6FA] to-[#E6DCFB] p-4.5 text-[#231E33] shadow-[0_8px_24px_-12px_rgba(180,126,197,0.28)] ring-1 ring-white/80">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-[10.5px] font-bold text-[#BD4F82]">
              <Sparkles className="h-3 w-3 text-[#D96B9C]" />
              현 고1(2029학년도 대입) 직접 적용 구조
            </span>
            <h2 className="mt-1.5 text-lg font-extrabold tracking-tight text-[#231E33]">
              서울 13개 대학 2028학년도 전형 시행계획 핵심 변화
            </h2>
            <p className="mt-1 text-xs font-medium text-[#5E4E6E] leading-relaxed">
              내신 5등급제 전환에 따른 교과 서류평가 확대, 정시 학생부 반영 신설, 통합수능 반영 변화와 수련이를 위한 대학별 준비 포인트를 정리했어요.
            </p>
          </div>

          {/* Univ Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {['전체', ...universities].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnivFilter(u)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  univFilter === u
                    ? 'bg-[#8B7AC9] text-white shadow-2xs'
                    : 'bg-white/85 text-[#5F5678] ring-1 ring-[#E8E1F5] hover:bg-[#F5F1FD]'
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
                badgeBg: 'bg-[#F3EEFC]',
                badgeText: 'text-[#6A57A5]',
              };
              const urlMatch = item.출처URL_및_발표시점
                .split('|')
                .map((s) => s.trim())
                .find((s) => s.startsWith('http'));

              return (
                <article
                  key={item.대학명}
                  className="glass-card rounded-[26px] p-5 ring-1 ring-[#EAE3F7]/90 space-y-3.5"
                >
                  <div className="flex items-center justify-between border-b border-[#F0EBF9] pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-xl px-3 py-1 text-sm font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                      >
                        {item.대학명}
                      </span>
                      <span className="text-xs font-semibold text-[#8E86A3]">
                        2028 시행계획 공식 발표 기준
                      </span>
                    </div>
                    {urlMatch && (
                      <a
                        href={urlMatch}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-[#F5F2FB] px-2.5 py-1 text-[11px] font-bold text-[#52486A] ring-1 ring-[#E8E2F4] hover:bg-[#ECE6F8]"
                      >
                        입학처 원문
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 text-xs leading-relaxed">
                    <div className="rounded-2xl bg-[#F8F6FD] p-3 ring-1 ring-[#EFEAF8]">
                      <div className="font-extrabold text-[#6D5AA8]">
                        ① 수시 학생부교과 (5등급제·서류반영)
                      </div>
                      <p className="mt-1 text-[#4C4462]">
                        {item.수시_교과전형_5등급제반영및정성평가여부}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#FDF4F8] p-3 ring-1 ring-[#F7DFEB]">
                      <div className="font-extrabold text-[#BD4F82]">
                        ② 수시 학종 · 논술 주요 변화
                      </div>
                      <p className="mt-1 text-[#4C4462]">
                        {item['수시_학종_주요변화(면접/수능최저등)']}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F1F9FB] p-3 ring-1 ring-[#DCEEF3]">
                      <div className="font-extrabold text-[#2B6B7C]">
                        ③ 정시 학생부 반영 여부·비율
                      </div>
                      <p className="mt-1 text-[#4C4462]">{item.정시_학생부반영여부및비율}</p>
                    </div>

                    <div className="rounded-2xl bg-[#F8F6FD] p-3 ring-1 ring-[#EFEAF8]">
                      <div className="font-extrabold text-[#3D3554]">
                        ④ 정시 통합수능 영역별 반영 특징
                      </div>
                      <p className="mt-1 text-[#4C4462]">{item.정시_통합수능_영역별반영특징}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-r from-[#F6F1FE] via-[#FAF2FB] to-[#FDF2F7] p-3.5 ring-1 ring-[#EDDDF5]">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#BD4F82]">
                      <Sparkles className="h-3.5 w-3.5 text-[#DF7BA6]" />
                      2029학년도(현 고1) 핵심 준비 포인트
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-[#2B2440]">
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
            <div className="glass-card rounded-2xl p-3.5 text-center ring-1 ring-[#EAE3F7]/90">
              <div className="text-[11px] font-semibold text-[#7D7494]">대상 대학</div>
              <div className="mt-1 text-lg font-extrabold text-[#231E33]">13개교</div>
            </div>
            <div className="glass-card rounded-2xl p-3.5 text-center ring-1 ring-[#EAE3F7]/90">
              <div className="text-[11px] font-semibold text-[#7D7494]">수시 3개년 레코드</div>
              <div className="mt-1 text-lg font-extrabold text-[#7561B4] tabular-nums">4,396건</div>
            </div>
            <div className="glass-card rounded-2xl p-3.5 text-center ring-1 ring-[#EAE3F7]/90">
              <div className="text-[11px] font-semibold text-[#7D7494]">정시 3개년 레코드</div>
              <div className="mt-1 text-lg font-extrabold text-[#2B6B7C] tabular-nums">2,149건</div>
            </div>
            <div className="glass-card rounded-2xl p-3.5 text-center ring-1 ring-[#EAE3F7]/90">
              <div className="text-[11px] font-semibold text-[#7D7494]">원본 엑셀(.xlsx)</div>
              <a
                href={EXCEL_DOWNLOAD_URL}
                download={EXCEL_DOWNLOAD_FILENAME}
                className="mt-1 inline-flex items-center gap-1 text-xs font-extrabold text-[#257466] hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                6시트 다운로드
              </a>
            </div>
          </div>

          {/* Coverage Table */}
          <div className="glass-card overflow-x-auto rounded-[26px] p-4 ring-1 ring-[#EAE3F7]/90">
            <h3 className="mb-3 text-sm font-extrabold text-[#231E33] flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#42A896]" />
              대학별 3개년(2024~2026) 수시·정시 확보 건수 요약 (시트1)
            </h3>
            <table className="w-full min-w-[600px] text-xs tabular-nums border-collapse">
              <thead>
                <tr className="bg-[#F3EEFC] text-[#4C3E7A]">
                  <th className="py-2 px-2 text-center rounded-tl-xl">대학명</th>
                  <th className="py-2 px-2 text-right">수시24</th>
                  <th className="py-2 px-2 text-right">수시25</th>
                  <th className="py-2 px-2 text-right">수시26</th>
                  <th className="py-2 px-2 text-right font-extrabold text-[#6D5AA8]">수시합계</th>
                  <th className="py-2 px-2 text-right">정시24</th>
                  <th className="py-2 px-2 text-right">정시25</th>
                  <th className="py-2 px-2 text-right">정시26</th>
                  <th className="py-2 px-2 text-right font-extrabold text-[#2B6B7C]">정시합계</th>
                  <th className="py-2 px-2 text-center rounded-tr-xl">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EEF9]">
                {dashboard.map((d) => (
                  <tr key={d.univ} className="hover:bg-[#FAF8FE]">
                    <td className="py-2 px-2 text-center font-extrabold text-[#231E33]">{d.univ}</td>
                    <td className="py-2 px-2 text-right text-[#6F6785]">{d.s24}</td>
                    <td className="py-2 px-2 text-right text-[#6F6785]">{d.s25}</td>
                    <td className="py-2 px-2 text-right text-[#6F6785]">{d.s26}</td>
                    <td className="py-2 px-2 text-right font-bold text-[#7561B4]">{d.sTotal}</td>
                    <td className="py-2 px-2 text-right text-[#6F6785]">{d.j24}</td>
                    <td className="py-2 px-2 text-right text-[#6F6785]">{d.j25}</td>
                    <td className="py-2 px-2 text-right text-[#6F6785]">{d.j26}</td>
                    <td className="py-2 px-2 text-right font-bold text-[#2B6B7C]">{d.jTotal}</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                          d.status === '완료'
                            ? 'bg-[#E9F7F3] text-[#247366]'
                            : 'bg-[#FEF6E6] text-[#9A6518]'
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
            <div className="glass-card rounded-[26px] p-4 ring-1 ring-[#EAE3F7]/90">
              <h3 className="mb-2.5 text-sm font-extrabold text-[#231E33]">
                신설 자유전공(무전공) · 학과 통폐합 3개년 추적 매핑 내역 (시트6)
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                {collectionLog.dept_mappings.map((m, idx) => (
                  <div
                    key={`${m.대학명}-${m.원모집단위명}-${idx}`}
                    className="flex items-center justify-between rounded-2xl bg-[#F8F6FD] px-3 py-2 ring-1 ring-[#EFEAF8]"
                  >
                    <div>
                      <span className="font-extrabold text-[#6D5AA8]">{m.대학명}</span>{' '}
                      <span className="font-bold text-[#231E33]">{m.표준모집단위명}</span>
                    </div>
                    <span className="rounded-lg bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[#6F6785] ring-1 ring-[#EAE3F7]">
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
