import React from 'react';
import { Sparkles, BookOpen, BarChart3, Landmark } from 'lucide-react';
import type { ActiveTab } from './Header';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: Array<{
    id: ActiveTab;
    label: string;
    sub: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'sim', label: '맞춤 판정', sub: '시트4 메인', icon: Sparkles },
    { id: 'susi', label: '수시 DB', sub: '4,396건', icon: BookOpen },
    { id: 'jeongsi', label: '정시 DB', sub: '2,149건', icon: BarChart3 },
    { id: 'reform', label: '2028 개편', sub: '13개교 요약', icon: Landmark },
  ];

  return (
    <nav className="glass-bar fixed inset-x-0 bottom-0 z-30 border-t border-[#E6E4EE] rounded-t-[24px] shadow-[0_-6px_24px_-12px_rgba(31,27,44,0.16)] md:hidden pb-safe">
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTab(t.id)}
              className={`flex flex-col items-center justify-center rounded-2xl py-1.5 transition active:scale-95 ${
                isActive ? 'text-[#1F1B2C]' : 'text-[#938DA3] hover:text-[#494459]'
              }`}
            >
              <div
                className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                  isActive ? 'bg-[#1F1B2C] text-white' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`mt-0.5 text-[11px] ${isActive ? 'font-extrabold text-[#1F1B2C]' : 'font-semibold'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
