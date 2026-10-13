import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PowerMeter } from './PowerMeter';
import { MaterialSwitcher } from './MaterialSwitcher';
import { DebugControls } from './DebugControls';
import { TurnTimer } from './TurnTimer';
import { TurnFeedbackBanner } from './TurnFeedbackBanner';
import { GameOverModal } from './GameOverModal';
import { CardDeckOverlay } from './CardDeckOverlay';
import { Trophy, Target, Flame } from 'lucide-react';
import { GAMEPLAY_CONFIG } from '../../constants/physics.constants';
import { useCardStore } from '../../store/useCardStore';

export const HUDOverlay: React.FC = () => {
  const score = useGameStore((s) => s.score);
  const flickCount = useGameStore((s) => s.flickCount);
  const comboStreak = useGameStore((s) => s.comboStreak);
  const aimingState = useGameStore((s) => s.aimingState);

  const activeCardId = useCardStore((s) => s.activeCardId);
  const handCards = useCardStore((s) => s.handCards);
  const activeCard = handCards.find((c) => c.id === activeCardId);

  return (
    <>
      {/* Dynamic Feedback Banner */}
      <TurnFeedbackBanner />

      {/* Game Over Victory Modal */}
      <GameOverModal />

      {/* Tactical Card Deck Overlay */}
      <CardDeckOverlay />

      <div
        data-testid="hud-overlay"
        className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none"
      >
        {/* Top Bar Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-auto">
          {/* Brand / Title */}
          <div className="flex items-center gap-3 bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 rounded-2xl px-4 py-2.5 shadow-xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-inner">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-neutral-100 flex items-center gap-2">
                KELERENG CLASH <span className="text-sky-400 font-mono text-xs px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30">3D</span>
              </h1>
              <p className="text-[10px] text-neutral-400 font-medium">Sprint 3 • Kartu Taktis & Energi Kapur</p>
            </div>
          </div>

          {/* Central Turn Timer & Score Tracker */}
          <div className="flex items-center gap-2 sm:gap-3">
            <TurnTimer />

            {/* Score, Flick & Combo Tracker */}
            <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 rounded-2xl px-4 py-2 shadow-xl">
              <div className="flex items-center gap-2 border-r border-neutral-800 pr-3">
                <Trophy className="w-4 h-4 text-amber-400" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">Skor Ring</span>
                  <span data-testid="score-value" className="text-sm font-bold text-neutral-100 font-mono">
                    {score} <span className="text-xs text-neutral-500 font-normal">/ {GAMEPLAY_CONFIG.initialTargetCount}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-r border-neutral-800 pr-3 pl-1">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">Sentilan</span>
                  <span data-testid="flick-count" className="text-sm font-bold text-sky-400 font-mono">
                    {flickCount}
                  </span>
                </div>
              </div>

              {/* Combo Streak Indicator */}
              <div className="flex items-center gap-1.5 pl-1">
                <Flame
                  className={`w-4 h-4 transition-colors ${
                    comboStreak > 0 ? 'text-amber-400 animate-pulse' : 'text-neutral-600'
                  }`}
                />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">Kombo</span>
                  <span
                    data-testid="combo-streak"
                    className={`text-sm font-bold font-mono ${
                      comboStreak > 0 ? 'text-amber-400 font-extrabold' : 'text-neutral-500'
                    }`}
                  >
                    x{comboStreak}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Debug & Arena Controls */}
          <DebugControls />
        </header>

        {/* Center Dynamic Power Meter */}
        <PowerMeter />

        {/* Bottom Bar Footer Dock */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto">
          <MaterialSwitcher />

          {/* Interactive Instruction Hint */}
          <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 rounded-xl px-3 py-1.5 text-[11px] text-neutral-400 max-w-md text-center sm:text-right">
            {activeCard && aimingState === 'IDLE' && (
              <span className="text-amber-300 font-medium">
                ✨ Kartu <strong>{activeCard.name}</strong> aktif! Tarik gacoan untuk melepaskan sentilan bertrik.
              </span>
            )}
            {!activeCard && aimingState === 'IDLE' && (
              <span>💡 Gunakan <strong>kartu taktis</strong> di bawah atau tarik gacoan langsung dalam 20 detik!</span>
            )}
            {aimingState === 'AIMING' && (
              <span className="text-sky-300 font-medium">🎯 Tentukan arah & daya sentil, lalu <strong>lepas</strong> untuk melambungkan kelereng!</span>
            )}
            {aimingState === 'AIRBORNE' && (
              <span className="text-cyan-300 font-medium animate-pulse">🚀 Kelereng melambung menuju sasaran...</span>
            )}
            {aimingState === 'SIMULATING' && (
              <span className="text-amber-300 font-medium">⏳ Kelereng sedang bertumbukan... Menunggu berhenti stabil.</span>
            )}
            {aimingState === 'EVALUATING' && (
              <span className="text-amber-300 font-medium animate-pulse">⏱️ Mengevaluasi hasil sentilan (kelereng keluar ring & validasi foul)...</span>
            )}
          </div>
        </footer>
      </div>
    </>
  );
};
