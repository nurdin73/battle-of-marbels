import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useLevelStore } from '../../store/useLevelStore';
import { LevelSelectModal } from './LevelSelectModal';
import { HelpModal } from './HelpModal';
import { marbleAudio } from '../../utils/soundSynth.utils';
import {
  User,
  Map as MapIcon,
  Layers,
  HelpCircle,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const MainMenu: React.FC = () => {
  const startGame = useGameStore((s) => s.startGame);
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const openLevelSelectModal = useLevelStore((s) => s.openLevelSelectModal);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  const handleStartGame = () => {
    marbleAudio.playStoneClackSound(1.5);
    startGame();
  };

  const handleOpenAdventure = () => {
    marbleAudio.playWoodKnockSound(1.2);
    openLevelSelectModal();
  };

  const handleShowNotice = (msg: string) => {
    marbleAudio.playWoodKnockSound(1.0);
    setProfileNotice(msg);
    setTimeout(() => setProfileNotice(null), 2500);
  };

  // Keyboard shortcut listener: Enter or Space starts game
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleStartGame();
      } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        setIsHelpOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Modals triggered from Main Menu */}
      <LevelSelectModal />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Floating Notice / Toast */}
      {profileNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#fdfbf7] border-2 border-[#eee6dc] border-b-[4px] border-b-[#ded4c5] px-5 py-2.5 rounded-2xl shadow-xl text-stone-800 font-heading font-black text-sm animate-bounce">
          {profileNotice}
        </div>
      )}

      <div
        data-testid="main-menu-overlay"
        className="fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 pointer-events-none select-none"
      >
        {/* ========================================================================= */}
        {/* TOP BAR: Player Profile (Left) & Rival / Friend (Right)                   */}
        {/* ========================================================================= */}
        <header className="flex items-center justify-between w-full pointer-events-auto">
          {/* Left: Player Profile Pill */}
          <div
            onClick={() => handleShowNotice('Profil Pemain: Jawara Kelereng Pekarangan')}
            className="timbul-btn-cream px-3 py-1.5 flex items-center gap-2.5 cursor-pointer shadow-sm active:translate-y-[1px]"
            title="Profil Pemain"
          >
            {/* Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-amber-200 border-2 border-amber-400 flex items-center justify-center overflow-hidden shadow-inner text-amber-900 font-bold text-xs">
              👦
            </div>
            <div className="flex items-center gap-1.5 text-stone-700 font-heading font-black text-xs sm:text-sm">
              <User className="w-4 h-4 text-stone-500" />
              <span>PROFIL</span>
            </div>
          </div>

          {/* Right: Rival / Friend Box */}
          <div
            onClick={() => handleShowNotice('Mode Teman & Lawan segera hadir!')}
            className="timbul-btn-cream px-3 py-1.5 flex items-center gap-2.5 cursor-pointer shadow-sm active:translate-y-[1px]"
            title="Lawan / Teman"
          >
            <User className="w-4 h-4 text-stone-500" />
            <div className="w-8 h-8 rounded-full bg-sky-200 border-2 border-sky-400 flex items-center justify-center overflow-hidden shadow-inner text-sky-900 font-bold text-xs">
              🧑
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: 3D Logo Plate + 5 In-Game Styled Menu Buttons              */}
        {/* ========================================================================= */}
        <main className="pointer-events-auto flex flex-col items-center justify-center my-auto">
          {/* 1. 3D Logo Plaque */}
          <div className="relative flex flex-col items-center justify-center mb-4 sm:mb-6">
            {/* Decorative background aura plate */}
            <div className="absolute -inset-x-8 -inset-y-4 bg-amber-950/20 backdrop-blur-[2px] rounded-[40px] -z-10 border border-amber-900/10 shadow-2xl" />

            {/* Floating Glossy Marble Beads */}
            <div className="absolute -left-6 sm:-left-10 top-2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-300 via-blue-500 to-blue-800 border border-white/60 shadow-lg animate-bounce" />
            <div className="absolute -left-3 sm:-left-6 bottom-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-lime-300 via-lime-500 to-emerald-800 border border-white/60 shadow-lg" />
            <div className="absolute -right-6 sm:-right-10 top-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-orange-300 via-amber-500 to-red-700 border border-white/60 shadow-lg animate-pulse" />
            <div className="absolute -right-3 sm:-right-5 bottom-5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-cyan-200 via-cyan-400 to-blue-600 border border-white/60 shadow-lg" />

            {/* Logo Text: KELERENG CLASH */}
            <div className="text-center leading-[0.88] select-none">
              <div
                className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-[#fde047] text-stroke-black-heavy tracking-wider drop-shadow-[0_6px_0_rgba(180,83,9,0.9)]"
              >
                KELERENG
              </div>
              <div
                className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-[#38bdf8] text-stroke-black-heavy tracking-widest drop-shadow-[0_6px_0_rgba(2,132,199,0.9)]"
              >
                CLASH
              </div>
            </div>

            {/* Subtitle Plaque */}
            <div className="mt-2.5 px-4 py-1 rounded-full bg-[#fdfbf7] border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] shadow-sm text-stone-800 font-heading font-black text-xs sm:text-sm tracking-wide">
              Pertarungan Kelereng Tradisional
            </div>
          </div>

          {/* 2. 5 Stacked Menu Buttons (In-Game Timbul Styling with Reference Colors) */}
          <div className="flex flex-col items-center gap-2.5 w-full max-w-[290px] sm:max-w-[340px]">
            {/* Button 1: MULAI BERMAIN (Lime Green) */}
            <button
              data-testid="main-menu-play-btn"
              onClick={handleStartGame}
              className="w-full bg-[#84cc16] hover:bg-[#94dc26] border-2 border-[#65a30d] border-b-[6px] border-b-[#3f6212] text-white font-heading font-black text-xl sm:text-2xl py-3 px-6 rounded-2xl shadow-xl active:translate-y-[2px] active:border-b-[3px] transition-all cursor-pointer flex items-center justify-center text-stroke-black-heavy group"
            >
              <span>MULAI BERMAIN</span>
            </button>

            {/* Button 2: PETUALANGAN (Sky Blue) */}
            <button
              data-testid="main-menu-adventure-btn"
              onClick={handleOpenAdventure}
              className="w-full bg-[#0284c7] hover:bg-[#38bdf8] border-2 border-[#0369a1] border-b-[5px] border-b-[#075985] text-white font-heading font-black text-sm sm:text-base py-2.5 px-4 rounded-2xl shadow-md active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shadow-inner">
                <MapIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="leading-tight tracking-wide text-stroke-black-heavy text-base sm:text-lg">PETUALANGAN</span>
                <span className="text-[11px] font-bold text-sky-200 -mt-0.5">(Solo Adventure)</span>
              </div>
              <div className="w-9 h-9 opacity-0" />
            </button>

            {/* Button 3: BARTER & KARTU (Warm Amber / Orange) */}
            <button
              data-testid="main-menu-cards-btn"
              onClick={() => handleShowNotice('Dek Kartu Taktis: Kartu dapat digunakan saat in-game')}
              className="w-full bg-[#f59e0b] hover:bg-[#fbbf24] border-2 border-[#d97706] border-b-[5px] border-b-[#92400e] text-white font-heading font-black text-sm sm:text-base py-2.5 px-4 rounded-2xl shadow-md active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-inner">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="leading-tight tracking-wide text-stroke-black-heavy text-base sm:text-lg">BARTER & KARTU</span>
                <span className="text-[11px] font-bold text-amber-100 -mt-0.5">(My Deck)</span>
              </div>
              <div className="w-9 h-9 opacity-0" />
            </button>

            {/* Button 4: MULTIPLAYER (Coral Red) */}
            <button
              data-testid="main-menu-multiplayer-btn"
              onClick={() => handleShowNotice('Mode Multiplayer PvP segera hadir!')}
              className="w-full bg-[#ef4444] hover:bg-[#f87171] border-2 border-[#dc2626] border-b-[5px] border-b-[#991b1b] text-white font-heading font-black text-sm sm:text-base py-2.5 px-4 rounded-2xl shadow-md active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer flex flex-col items-center justify-center"
            >
              <span className="leading-tight tracking-wide text-stroke-black-heavy text-base sm:text-lg">MULTIPLAYER</span>
              <span className="text-[11px] font-bold text-red-200 -mt-0.5">PvP</span>
            </button>

            {/* Button 5: TOKO & KOSMETIK (Purple Pill) */}
            <button
              data-testid="main-menu-shop-btn"
              onClick={() => handleShowNotice('Toko Kosmetik Kelereng segera hadir!')}
              className="w-[85%] bg-[#a855f7] hover:bg-[#c084fc] border-2 border-[#9333ea] border-b-[4px] border-b-[#6b21a8] text-white font-heading font-black text-xs sm:text-sm py-2 px-4 rounded-2xl shadow-sm active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer flex items-center justify-between mt-0.5"
            >
              {/* Marble beads left */}
              <div className="flex items-center -space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-purple-300 border border-white shadow-sm" />
                <div className="w-4 h-4 rounded-full bg-emerald-400 border border-white shadow-sm" />
              </div>
              <span className="tracking-wide text-stroke-black-heavy">TOKO & KOSMETIK</span>
              {/* Marble beads right */}
              <div className="flex items-center -space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-amber-400 border border-white shadow-sm" />
                <div className="w-4 h-4 rounded-full bg-slate-300 border border-white shadow-sm" />
              </div>
            </button>
          </div>
        </main>

        {/* ========================================================================= */}
        {/* BOTTOM BAR: Penghargaan (Left) & Pengaturan + Cara Bermain (Right)        */}
        {/* ========================================================================= */}
        <footer className="flex items-center justify-between w-full pointer-events-auto">
          {/* Bottom Left: PENGHARGAAN */}
          <button
            data-testid="main-menu-achievements-btn"
            onClick={() => handleShowNotice('Papan Penghargaan: 3 Bintang Terkumpul')}
            className="timbul-btn-cream px-3.5 py-2 flex items-center gap-1.5 text-xs font-heading font-black text-stone-700 cursor-pointer shadow-sm active:translate-y-[1px]"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>PENGHARGAAN</span>
          </button>

          {/* Bottom Right: PENGATURAN & CARA BERMAIN */}
          <div className="flex items-center gap-2">
            <button
              data-testid="main-menu-settings-btn"
              onClick={toggleMute}
              className="timbul-btn-cream px-3.5 py-2 flex items-center gap-1.5 text-xs font-heading font-black text-stone-700 cursor-pointer shadow-sm active:translate-y-[1px]"
              title="Atur Suara Permainan"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-500" />
                  <span>SUARA: MATI</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-stone-600" />
                  <span>PENGATURAN</span>
                </>
              )}
            </button>

            <button
              data-testid="main-menu-help-btn"
              onClick={() => setIsHelpOpen(true)}
              className="timbul-btn-cream px-3.5 py-2 flex items-center gap-1.5 text-xs font-heading font-black text-stone-700 cursor-pointer shadow-sm active:translate-y-[1px]"
              title="Panduan Kontrol & Cara Bermain"
            >
              <HelpCircle className="w-4 h-4 text-stone-600" />
              <span>CARA BERMAIN</span>
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};
