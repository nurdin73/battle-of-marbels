import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PowerMeter } from './PowerMeter';
import { MaterialSwitcher } from './MaterialSwitcher';
import { DebugControls } from './DebugControls';
import { Trophy, Target } from 'lucide-react';

export const HUDOverlay: React.FC = () => {
  const score = useGameStore((s) => s.score);
  const flickCount = useGameStore((s) => s.flickCount);
  const aimingState = useGameStore((s) => s.aimingState);

  return (
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
            <p className="text-[10px] text-neutral-400 font-medium">Rapier WASM 60Hz • Arena Ring 1.8m</p>
          </div>
        </div>

        {/* Score & Flick Tracker */}
        <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 rounded-2xl px-4 py-2 shadow-xl">
          <div className="flex items-center gap-2 border-r border-neutral-800 pr-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">Skor Ring</span>
              <span data-testid="score-value" className="text-sm font-bold text-neutral-100 font-mono">
                {score} <span className="text-xs text-neutral-500 font-normal">/ 9</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col text-left pl-1">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">Sentilan</span>
            <span data-testid="flick-count" className="text-sm font-bold text-sky-400 font-mono">{flickCount}</span>
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
          {aimingState === 'IDLE' && (
            <span>💡 <strong>Klik/Sentuh & Tarik</strong> kelereng gacoan ke belakang untuk menyentil. Drag kamera untuk rotasi pandangan.</span>
          )}
          {aimingState === 'AIMING' && (
            <span className="text-sky-300 font-medium">🎯 Tentukan arah & daya sentil, lalu <strong>lepas</strong> untuk menembak!</span>
          )}
          {aimingState === 'AIRBORNE' && (
            <span className="text-cyan-300 font-medium animate-pulse">🚀 Kelereng melambung menuju sasaran...</span>
          )}
          {aimingState === 'SIMULATING' && (
            <span className="text-amber-300 font-medium">⏳ Kelereng sedang bertumbukan... Menunggu berhenti stabil.</span>
          )}
          {aimingState === 'EVALUATING' && (
            <span className="text-amber-300 font-medium animate-pulse">⏱️ Kelereng berhenti. Menunggu 2 detik untuk evaluasi kelereng keluar ring...</span>
          )}
        </div>
      </footer>
    </div>
  );
};
