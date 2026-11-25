import React from 'react';
import { Compass, Download, Heart, HelpCircle } from 'lucide-react';
import { EXCEL_DOWNLOAD_FILENAME, EXCEL_DOWNLOAD_URL } from '../lib/simulatorEngine';

export type ActiveTab = 'sim' | 'susi' | 'jeongsi' | 'reform';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenGuide: () => void;
  onOpenDedication: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenGuide,
  onOpenDedication,
}) => {
  const navItems: Array<{ id: ActiveTab; label: string }> = [
    { id: 'sim', label: '2029 맞춤판정' },
    { id: 'susi', label: '수시 DB' },
    { id: 'jeongsi', label: '정시 DB' },
    { id: 'reform', label: '2028 개편·현황' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/75 bg-white/88 backdrop-blur-xl pt-safe">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onSelectTab('sim')}
          className="flex min-w-0 items-center gap-2.5 text-left group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-rose-400 text-white shadow-xs transition group-active:scale-95">
            <Compass className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                수련 2029 나침반
              </span>
              <span className="hidden sm:inline-block rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 whitespace-nowrap">
                서울 13개교
              </span>
            </div>
            <p className="truncate text-[11px] font-medium text-slate-500 whitespace-nowrap">
              서울 13개교 · 5등급·통합수능 맞춤 DB
            </p>
          </div>
        </button>

        {/* Desktop Center Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === item.id
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Actions: Excel Download + Dedication Heart + Guide */}
        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={EXCEL_DOWNLOAD_URL}
            download={EXCEL_DOWNLOAD_FILENAME}
            title="6시트 완성형 원본 엑셀(.xlsx) 내려받기"
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 whitespace-nowrap ring-1 ring-emerald-200/80 transition hover:bg-emerald-100 active:scale-95"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">원본 엑셀(.xlsx)</span>
            <span className="sm:hidden">엑셀받기</span>
          </a>

          <button
            type="button"
            onClick={onOpenDedication}
            title="동탄 아빠 준희의 응원 노트"
            aria-label="응원 노트 열기"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-500 ring-1 ring-rose-200/70 transition hover:bg-rose-100 active:scale-95"
          >
            <Heart className="h-4 w-4 fill-rose-400" />
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            title="사용법 가이드 다시 보기"
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95"
          >
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">사용법</span>
          </button>
        </div>
      </div>
    </header>
  );
};
