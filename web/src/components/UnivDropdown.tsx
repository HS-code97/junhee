import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Search, X } from 'lucide-react';
import { UNIV_THEMES } from '../lib/simulatorEngine';

interface UnivDropdownProps {
  universities: string[];
  value: string;
  onChange: (univ: string) => void;
  counts?: Record<string, number>;
  totalCount?: number;
  tone?: 'lavender' | 'sky';
}

export const UnivDropdown: React.FC<UnivDropdownProps> = ({
  universities,
  value,
  onChange,
  counts,
  totalCount,
  tone = 'lavender',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const filteredUniversities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter((u) => u.toLowerCase().includes(q));
  }, [universities, search]);

  const isSelected = value !== '전체';
  const activeAccent =
    tone === 'sky'
      ? isSelected
        ? 'bg-[#E5F4F8] text-[#28637A] ring-[#BBE0EC]'
        : 'bg-[#F5F2FB] text-[#4C4462] ring-[#E8E2F4] hover:bg-[#EFEAF8]'
      : isSelected
        ? 'bg-[#EFE9FC] text-[#604D99] ring-[#D6C9F3]'
        : 'bg-[#F5F2FB] text-[#4C4462] ring-[#E8E2F4] hover:bg-[#EFEAF8]';

  const selectedItemBg =
    tone === 'sky' ? 'bg-[#EAF5F9] text-[#256077]' : 'bg-[#F3EEFC] text-[#604D99]';
  const selectedCheckColor = tone === 'sky' ? 'text-[#4B93AE]' : 'text-[#8B7AC9]';

  const handleSelect = (univ: string) => {
    onChange(univ);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setSearch('');
        }}
        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ring-1 transition active:scale-[0.98] ${activeAccent}`}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 opacity-80" />
        <span className="max-w-[110px] truncate">
          {isSelected ? value : `대학교: 전체`}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="대학교 선택"
          className="absolute left-0 z-40 mt-2 w-60 origin-top-left rounded-2xl bg-white/96 p-2 shadow-[0_14px_36px_-10px_rgba(110,92,168,0.24)] ring-1 ring-[#E6DFF5] backdrop-blur-xl animate-pop-in"
        >
          {/* Quick filter inside dropdown for fast lookup */}
          <div className="relative mb-1.5">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#9B93B0]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="대학명 빠른 찾기..."
              className="h-8 w-full rounded-xl bg-[#F7F5FC] pr-7 pl-8 text-xs font-semibold text-[#231E33] placeholder:font-normal placeholder:text-[#9B93B0] ring-1 ring-[#EAE3F6] focus:bg-white focus:ring-[#B8A7E6] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                aria-label="대학 검색어 지우기"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-[#9B93B0] hover:text-[#4C4462]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Scrollable university list */}
          <div className="max-h-60 overflow-y-auto soft-scrollbar space-y-0.5 pr-0.5">
            {!search.trim() && (
              <button
                type="button"
                role="option"
                aria-selected={value === '전체'}
                onClick={() => handleSelect('전체')}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                  value === '전체'
                    ? selectedItemBg
                    : 'text-[#3F3854] hover:bg-[#F7F4FC]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#9B89D6] to-[#DE7BA6]" />
                  전체 대학 ({universities.length}개교)
                </span>
                <span className="flex items-center gap-1.5">
                  {totalCount !== undefined && (
                    <span className="text-[10.5px] font-semibold text-[#8A829F] tabular-nums">
                      {totalCount.toLocaleString()}
                    </span>
                  )}
                  {value === '전체' && <Check className={`h-3.5 w-3.5 ${selectedCheckColor}`} />}
                </span>
              </button>
            )}

            {filteredUniversities.length === 0 ? (
              <div className="py-5 text-center text-xs text-[#9B93B0]">
                일치하는 대학이 없어요
              </div>
            ) : (
              filteredUniversities.map((u) => {
                const selected = value === u;
                const theme = UNIV_THEMES[u];
                const cnt = counts?.[u];
                return (
                  <button
                    key={u}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(u)}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                      selected
                        ? selectedItemBg
                        : 'text-[#3F3854] hover:bg-[#F7F4FC]'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: theme?.accent ?? '#9B89D6' }}
                      />
                      <span className="truncate">{u}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {cnt !== undefined && (
                        <span className="text-[10.5px] font-semibold text-[#8A829F] tabular-nums">
                          {cnt.toLocaleString()}
                        </span>
                      )}
                      {selected && <Check className={`h-3.5 w-3.5 ${selectedCheckColor}`} />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
