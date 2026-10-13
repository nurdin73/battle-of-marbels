import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useLevelStore } from '../../store/useLevelStore';
import { ADVENTURE_LEVELS } from '../../constants/levels.constants';
import { MaterialSwitcher } from './MaterialSwitcher';
import { 
  X, 
  Compass, 
  Trophy, 
  Target, 
  Flame, 
  HelpCircle, 
  Sparkles,
  ChevronRight,
  Home
} from 'lucide-react';

interface GameMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameMenuDrawer: React.FC<GameMenuDrawerProps> = ({ isOpen, onClose }) => {
  const score = useGameStore((s) => s.score);
  const flickCount = useGameStore((s) => s.flickCount);
  const currentPar = useGameStore((s) => s.currentPar);
  const targetMarbles = useGameStore((s) => s.targetMarbles);
  const comboStreak = useGameStore((s) => s.comboStreak);
  const goToMainMenu = useGameStore((s) => s.goToMainMenu);

  const currentLevelId = useLevelStore((s) => s.currentLevelId);
  const openLevelSelectModal = useLevelStore((s) => s.openLevelSelectModal);
  const currentLevel = ADVENTURE_LEVELS.find((l) => l.id === currentLevelId) || ADVENTURE_LEVELS[0];

  if (!isOpen) return null;

  const handleOpenLevelModal = () => {
    onClose();
    openLevelSelectModal();
  };

  let difficultyBadge = 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300 border-b-[2px] border-b-emerald-400';
  if (currentLevel.difficulty === 'SEDANG') {
    difficultyBadge = 'bg-amber-50 text-amber-950 border-2 border-amber-300 border-b-[2px] border-b-amber-400';
  } else if (currentLevel.difficulty === 'SULIT') {
    difficultyBadge = 'bg-orange-50 text-orange-950 border-2 border-orange-300 border-b-[2px] border-b-orange-400';
  }

  return (
    <div
      data-testid="game-menu-drawer-backdrop"
      className="fixed inset-0 z-50 flex pointer-events-auto bg-stone-900/35 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Sliding Drawer Container */}
      <aside
        data-testid="game-menu-drawer"
        className="relative w-full max-w-sm sm:max-w-md h-full bg-[#fdfbf7] border-r-2 border-[#eee6dc] border-r-[6px] border-r-[#ded4c5] p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300 text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b-2 border-[#eee6dc] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 border-2 border-orange-200 border-b-[3px] border-b-orange-400 flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-stone-800">
                  KELERENG CERIA <span className="text-xs text-orange-950 px-1.5 py-0.5 rounded-lg bg-orange-100 border-2 border-orange-300 border-b-[2px] border-b-orange-400 font-extrabold">3D</span>
                </h2>
                <p className="text-[10px] text-stone-500 font-bold">Papan Info & Menu Pekarangan 🏡</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              data-testid="close-drawer-btn"
              onClick={onClose}
              className="w-9 h-9 rounded-2xl border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] bg-white hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 active:translate-y-[1px] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: Level Aktif & Switcher */}
          <div className="timbul-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#d54425] font-black">
                  Level {currentLevel.levelNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${difficultyBadge}`}>
                  {currentLevel.difficulty}
                </span>
              </div>
              <span className="text-[10px] font-bold text-stone-500 font-mono">
                Target: {currentPar} Sentilan
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-stone-800">{currentLevel.title}</h3>
              <p className="text-xs text-[#d54425] font-extrabold">{currentLevel.subtitle}</p>
              <p className="text-[11px] text-stone-500 mt-1 leading-snug font-medium">
                {currentLevel.description}
              </p>
            </div>

            {/* Tombol Ganti Level */}
            <button
              data-testid="drawer-open-level-select-btn"
              onClick={handleOpenLevelModal}
              className="timbul-btn-coral py-2.5 px-4 text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <Compass className="w-4 h-4" />
              <span>Pilih Rintangan Lain</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {/* Section 2: Papan Skor & Statistik Saat Ini */}
          <div className="timbul-card p-4 flex flex-col gap-2.5">
            <span className="text-[11px] font-black text-stone-600 uppercase tracking-wider">
              Statistik Permainan:
            </span>

            <div className="grid grid-cols-3 gap-2">
              {/* Target Kena */}
              <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-xl p-2.5 text-center">
                <Trophy className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span className="text-[9px] uppercase font-bold text-stone-500 block">Kena</span>
                <span className="text-sm font-black text-stone-800 font-mono">
                  {score}/{targetMarbles.length}
                </span>
              </div>

              {/* Total Sentilan */}
              <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-xl p-2.5 text-center">
                <span className="text-sm block mb-0.5">👆</span>
                <span className="text-[9px] uppercase font-bold text-stone-500 block">Sentil</span>
                <span className="text-sm font-black text-[#d54425] font-mono">
                  {flickCount}
                </span>
              </div>

              {/* Runtun Kombo */}
              <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-xl p-2.5 text-center">
                <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                <span className="text-[9px] uppercase font-bold text-stone-500 block">Runtun</span>
                <span className="text-sm font-black text-orange-600 font-mono">
                  x{comboStreak}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Pilihan Kelereng Jagoan */}
          <div className="flex flex-col gap-2">
            <MaterialSwitcher />
          </div>

          {/* Section 4: Panduan Ringkas */}
          <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-2xl p-3.5 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-stone-600 leading-relaxed font-medium">
              <strong className="text-stone-800 block mb-0.5">Tips Santai:</strong>
              Tarik kelereng jagoan ke belakang untuk mengatur daya & arah sentil. Gunakan <em>Kantung Trik</em> di bawah untuk mengeluarkan jurus kapur ajaib!
            </div>
          </div>

          {/* Section 5: Kembali ke Menu Utama */}
          <button
            data-testid="drawer-go-main-menu-btn"
            onClick={() => {
              onClose();
              goToMainMenu();
            }}
            className="w-full timbul-btn-cream py-2.5 px-4 text-xs font-heading font-black text-stone-700 flex items-center justify-center gap-2 shadow-sm cursor-pointer active:translate-y-[1px]"
          >
            <Home className="w-4 h-4 text-stone-600" />
            <span>KEMBALI KE MENU UTAMA</span>
          </button>
        </div>

        {/* Drawer Footer */}
        <div className="border-t-2 border-[#eee6dc] pt-3 mt-4 text-center">
          <p className="text-[10px] text-stone-400 font-bold flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Kelereng Clash 3D Tradisional • Pekarangan Rumah
          </p>
        </div>
      </aside>
    </div>
  );
};
