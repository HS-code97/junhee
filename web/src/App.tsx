import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Heart } from 'lucide-react';
import type {
  CollectionLogPayload,
  JeongsiRawRow,
  SimMetaPayload,
  StudentProfile,
  SusiRawRow,
} from './types';
import { Header, type ActiveTab } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { IntroOnboarding } from './components/IntroOnboarding';
import { DedicationModal } from './components/DedicationModal';
import {
  SimulatorTab,
  makeJeongsiFavKey,
  makeSusiFavKey,
} from './components/SimulatorTab';
import { SusiDbTab } from './components/SusiDbTab';
import { JeongsiDbTab } from './components/JeongsiDbTab';
import { Reform2028Tab } from './components/Reform2028Tab';
import {
  DeptDetailSheet,
  type SelectedDetailTarget,
} from './components/DeptDetailSheet';
import {
  EXCEL_DOWNLOAD_FILENAME,
  EXCEL_DOWNLOAD_URL,
  grade5ToCumPct,
} from './lib/simulatorEngine';

const STORAGE_PROFILE_KEY = 'suryeon2029_profile_v1';
const STORAGE_FAV_KEY = 'suryeon2029_favs_v1';
const STORAGE_SKIP_INTRO_KEY = 'suryeon2029_skip_intro_v1';

const DEFAULT_PROFILE: StudentProfile = {
  grade5: 1.15,
  customCumPct: 7.5,
  mockPct: 94.0,
};

export const App: React.FC = () => {
  // Persisted states (backfill customCumPct with interpolated value if older saved profile had null)
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (saved) {
        const parsed = { ...DEFAULT_PROFILE, ...JSON.parse(saved) } as StudentProfile;
        if (parsed.customCumPct === null || Number.isNaN(parsed.customCumPct)) {
          parsed.customCumPct = Math.round(grade5ToCumPct(parsed.grade5) * 10) / 10;
        }
        return parsed;
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_PROFILE;
  });

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAV_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    return new Set();
  });

  const [skipIntroNextTime, setSkipIntroNextTime] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_SKIP_INTRO_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_SKIP_INTRO_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('sim');
  const [showDedication, setShowDedication] = useState<boolean>(false);

  // Core dataset (loaded immediately)
  const [simData, setSimData] = useState<SimMetaPayload | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(18);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Lazy datasets (loaded on demand when opening DB tabs or detail sheet)
  const [susiRaw, setSusiRaw] = useState<SusiRawRow[] | null>(null);
  const [susiLoading, setSusiLoading] = useState<boolean>(false);
  const [jeongsiRaw, setJeongsiRaw] = useState<JeongsiRawRow[] | null>(null);
  const [jeongsiLoading, setJeongsiLoading] = useState<boolean>(false);
  const [collectionLog, setCollectionLog] = useState<CollectionLogPayload | null>(null);

  const [detailTarget, setDetailTarget] = useState<SelectedDetailTarget | null>(null);

  // Save profile & favorites
  const handleChangeProfile = (next: StudentProfile) => {
    setProfile(next);
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const handleToggleFavorite = (favKey: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(favKey)) next.delete(favKey);
      else next.add(favKey);
      try {
        localStorage.setItem(STORAGE_FAV_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleToggleSkipIntro = (val: boolean) => {
    setSkipIntroNextTime(val);
    try {
      localStorage.setItem(STORAGE_SKIP_INTRO_KEY, val ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  // Initial load of sim_meta_2029.json
  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => {
      setLoadProgress((p) => (p < 85 ? p + 14 : p));
    }, 120);

    fetch(`${import.meta.env.BASE_URL}data/sim_meta_2029.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: SimMetaPayload) => {
        if (cancelled) return;
        clearInterval(timer);
        setSimData(json);
        setLoadProgress(100);
        setSimLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        clearInterval(timer);
        setLoadError(String(err));
        setSimLoading(false);
      });

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const ensureSusiRaw = useCallback(() => {
    if (susiRaw || susiLoading) return;
    setSusiLoading(true);
    fetch(`${import.meta.env.BASE_URL}data/susi_raw.json`)
      .then((r) => r.json())
      .then((data: SusiRawRow[]) => setSusiRaw(data))
      .finally(() => setSusiLoading(false));
  }, [susiRaw, susiLoading]);

  const ensureJeongsiRaw = useCallback(() => {
    if (jeongsiRaw || jeongsiLoading) return;
    setJeongsiLoading(true);
    fetch(`${import.meta.env.BASE_URL}data/jeongsi_raw.json`)
      .then((r) => r.json())
      .then((data: JeongsiRawRow[]) => setJeongsiRaw(data))
      .finally(() => setJeongsiLoading(false));
  }, [jeongsiRaw, jeongsiLoading]);

  const ensureCollectionLog = useCallback(() => {
    if (collectionLog) return;
    fetch(`${import.meta.env.BASE_URL}data/collection_log.json`)
      .then((r) => r.json())
      .then((data: CollectionLogPayload) => setCollectionLog(data))
      .catch(() => null);
  }, [collectionLog]);

  // Lazy load when switching tabs
  useEffect(() => {
    if (activeTab === 'susi') ensureSusiRaw();
    if (activeTab === 'jeongsi') ensureJeongsiRaw();
    if (activeTab === 'reform') ensureCollectionLog();
  }, [activeTab, ensureSusiRaw, ensureJeongsiRaw, ensureCollectionLog]);

  const handleOpenDetail = (target: SelectedDetailTarget) => {
    if (target.mode === 'susi') ensureSusiRaw();
    else ensureJeongsiRaw();
    setDetailTarget(target);
  };

  const reformMap = useMemo(() => {
    const m = new Map<string, SimMetaPayload['reform2028'][number]>();
    simData?.reform2028.forEach((item) => m.set(item.대학명, item));
    return m;
  }, [simData]);

  const detailFavKey = useMemo(() => {
    if (!detailTarget) return '';
    if (detailTarget.mode === 'susi') {
      return makeSusiFavKey({
        u: detailTarget.univ,
        adm: detailTarget.adm,
        d: detailTarget.stdDept,
      });
    }
    return makeJeongsiFavKey({
      u: detailTarget.univ,
      gun: detailTarget.gun,
      adm: detailTarget.adm,
      d: detailTarget.stdDept,
    });
  }, [detailTarget]);

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="glass-card max-w-sm rounded-[24px] p-6 ring-1 ring-[#E6E4EE]">
          <p className="text-base font-extrabold text-[#B53F74]">데이터 로드 중 오류가 발생했습니다</p>
          <p className="mt-2 text-xs text-[#5F5A70]">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-[#1F1B2C] px-4 py-2 text-xs font-bold text-white"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-[#1F1B2C] overflow-x-hidden">
      {/* Onboarding / Loading Overlay */}
      {(showOnboarding || simLoading) && (
        <IntroOnboarding
          loading={simLoading}
          loadProgress={loadProgress}
          totalRecords={simData?.meta.totalRecords ?? 6545}
          skipNextTime={skipIntroNextTime}
          onToggleSkipNextTime={handleToggleSkipIntro}
          onStart={() => setShowOnboarding(false)}
        />
      )}

      {/* Sticky Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(t) => {
          setActiveTab(t);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenGuide={() => setShowOnboarding(true)}
        onOpenDedication={() => setShowDedication(true)}
      />

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-3.5 sm:px-5 pt-4 pb-28 md:pb-12">
        {simData && activeTab === 'sim' && (
          <SimulatorTab
            universities={simData.meta.universities}
            susiSim={simData.susiSim}
            jeongsiSim={simData.jeongsiSim}
            profile={profile}
            onChangeProfile={handleChangeProfile}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectDetail={handleOpenDetail}
          />
        )}

        {simData && activeTab === 'susi' && (
          <SusiDbTab
            universities={simData.meta.universities}
            rows={susiRaw}
            loading={susiLoading}
            onSelectDetail={handleOpenDetail}
          />
        )}

        {simData && activeTab === 'jeongsi' && (
          <JeongsiDbTab
            universities={simData.meta.universities}
            rows={jeongsiRaw}
            loading={jeongsiLoading}
            onSelectDetail={handleOpenDetail}
          />
        )}

        {simData && activeTab === 'reform' && (
          <Reform2028Tab
            universities={simData.meta.universities}
            reform2028={simData.reform2028}
            dashboard={simData.dashboard}
            collectionLog={collectionLog}
          />
        )}

        {/* Warm Footer Credit + Secondary Excel Download */}
        <footer className="glass-card mt-10 rounded-[24px] p-5 text-center ring-1 ring-[#E6E4EE] space-y-2.5">
          <button
            type="button"
            onClick={() => setShowDedication(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F2F7] px-3.5 py-1 text-xs font-bold text-[#1F1B2C] ring-1 ring-[#E4E2EC] hover:bg-[#EAE8F2] transition"
          >
            <Heart className="h-3.5 w-3.5 fill-[#D45D92] text-[#D45D92]" />
            동탄에서 아빠 김준희가 딸 김수련의 스무 살 봄을 응원하며 만든 2029 입시 나침반
          </button>
          <p className="text-[11px] leading-relaxed text-[#7A748A]">
            서울 주요 13개 대학 본캠퍼스 정원 내 일반전형 · 각 대학 입학처 공식 자료 및 대입정보포털 어디가(adiga.kr) 기반 · 최종 지원 시 반드시 각 대학 모집요강 원문을 확인하세요.
          </p>
          <div className="pt-1">
            <a
              href={EXCEL_DOWNLOAD_URL}
              download={EXCEL_DOWNLOAD_FILENAME}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E6F5F2] px-3.5 py-2 text-xs font-extrabold text-[#1E6F64] ring-1 ring-[#C3E6DF] hover:bg-[#D6EFEA] transition"
            >
              <Download className="h-3.5 w-3.5 text-[#22746A]" />
              원본 6시트 엑셀 파일(서울13개대학_3개년입결_2029맞춤DB.xlsx) 내려받기
            </a>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(t) => {
          setActiveTab(t);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Department 3-Year Detail + 2028 Reform Glass Bottom Sheet */}
      <DeptDetailSheet
        target={detailTarget}
        onClose={() => setDetailTarget(null)}
        susiRaw={susiRaw}
        jeongsiRaw={jeongsiRaw}
        rawLoading={detailTarget?.mode === 'susi' ? susiLoading : jeongsiLoading}
        reformItem={detailTarget ? reformMap.get(detailTarget.univ) : undefined}
        isFav={detailFavKey ? favorites.has(detailFavKey) : false}
        onToggleFav={() => {
          if (detailFavKey) handleToggleFavorite(detailFavKey);
        }}
      />

      {/* Dad's Warm Dedication Modal */}
      <DedicationModal open={showDedication} onClose={() => setShowDedication(false)} />
    </div>
  );
};
export default App;
