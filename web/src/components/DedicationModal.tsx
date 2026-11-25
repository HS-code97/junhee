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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#231E33]/35 p-0 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="glass-sheet w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 ring-1 ring-[#EAE3F7] animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[#D9D0EC] sm:hidden" />

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF0F6] px-3 py-1 text-xs font-bold text-[#BD4F82] ring-1 ring-[#F4CBE0]">
            <Heart className="h-3.5 w-3.5 fill-[#DF7BA6] text-[#DF7BA6]" />
            아빠의 응원 노트
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full bg-[#F5F2FB] p-1.5 text-[#7A6F93] hover:bg-[#ECE6F8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <h3 className="text-xl font-extrabold tracking-tight text-[#231E33]">
            사랑하는 딸 수련이에게
          </h3>
          <div className="rounded-2xl bg-gradient-to-br from-[#F6F1FE] via-[#FAF3FC] to-[#FDF2F7] p-4 text-[13.5px] leading-relaxed text-[#4C4462] ring-1 ring-[#EDDDF5] space-y-2.5">
            <p>
              고등학교 첫해를 보내며 낯선 5등급제 내신과 2028 대입개편 소식에 막막할 때가 있을까 봐, 수련이가 언제든 스마트폰으로 편하게 길을 찾아볼 수 있는 작은 나침반을 준비했어.
            </p>
            <p>
              숫자와 등급은 어디까지나 방향을 잡는 참고표일 뿐이야. 가장 중요한 건 수련이가 좋아하는 걸 찾고 하루하루 건강하게 자라나는 거란다. 어떤 꿈을 꾸든 아빠는 언제나 수련이의 가장 든든한 응원단이야!
            </p>
            <p className="pt-1 text-right text-xs font-extrabold text-[#7561B4]">
              — 동탄에서, 아빠 김준희가 ✦
            </p>
          </div>
        </div>

        {/* Verified Data Info */}
        <div className="mt-4 rounded-2xl bg-[#F8F6FD] p-3.5 text-xs text-[#6F6785] ring-1 ring-[#EFEAF8] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#231E33]">
            <ShieldCheck className="h-4 w-4 text-[#8B7AC9]" />
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4CA288] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#3F9178] active:scale-[0.99]"
          >
            <Download className="h-4 w-4" />
            원본 6시트 통합 엑셀(.xlsx) 내려받기
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#F5F2FB] py-3 text-xs font-bold text-[#52486A] ring-1 ring-[#EAE3F7] hover:bg-[#ECE6F8]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#DF7BA6]" />
            시뮬레이터로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
