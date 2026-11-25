import React from 'react';
import { X, Heart, Download, ShieldCheck, Sparkles } from 'lucide-react';
import { EXCEL_DOWNLOAD_FILENAME, EXCEL_DOWNLOAD_URL } from '../lib/simulatorEngine';

interface DedicationModalProps {
  open: boolean;
  onClose: () => void;
}

export const DedicationModal: React.FC<DedicationModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 p-0 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 ring-1 ring-rose-100">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            아빠의 응원 노트
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
            사랑하는 딸 수련이에게
          </h3>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-rose-50/70 p-4 text-[13.5px] leading-relaxed text-slate-700 ring-1 ring-indigo-100/70 space-y-2.5">
            <p>
              고등학교 첫해를 보내며 낯선 5등급제 내신과 2028 대입개편 소식에 막막할 때가 있을까 봐, 수련이가 언제든 스마트폰으로 편하게 길을 찾아볼 수 있는 작은 나침반을 준비했어.
            </p>
            <p>
              숫자와 등급은 어디까지나 방향을 잡는 참고표일 뿐이야. 가장 중요한 건 수련이가 좋아하는 걸 찾고 하루하루 건강하게 자라나는 거란다. 어떤 꿈을 꾸든 아빠는 언제나 수련이의 가장 든든한 응원단이야!
            </p>
            <p className="pt-1 text-right text-xs font-extrabold text-indigo-700">
              — 동탄에서, 아빠 김준희가 ✦
            </p>
          </div>
        </div>

        {/* Verified Data Info */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 ring-1 ring-slate-200/70 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            수록 데이터 기준 및 원본 엑셀 안내
          </div>
          <p className="leading-relaxed">
            서울 주요 13개교 본캠퍼스 정원 내 일반전형 기준, 각 대학 입학처 공식 자료 및 대입정보포털 어디가(adiga.kr)의 2024~2026학년도 수시(4,396건)·정시(2,149건) 입결과 2028 시행계획을 담았습니다.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <a
            href={EXCEL_DOWNLOAD_URL}
            download={EXCEL_DOWNLOAD_FILENAME}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
          >
            <Download className="h-4 w-4" />
            원본 6시트 통합 엑셀(.xlsx) 내려받기
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            시뮬레이터로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
