import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { RotateCcw, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

export const DebugControls: React.FC = () => {
  const resetArena = useGameStore((s) => s.resetArena);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleTrajectory = useGameStore((s) => s.toggleTrajectory);
  const isMuted = useGameStore((s) => s.isMuted);
  const showTrajectory = useGameStore((s) => s.showTrajectory);
  const aimingState = useGameStore((s) => s.aimingState);

  // Status badge styling
  let badgeText = 'SIAP BIDIK';
  let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

  if (aimingState === 'AIMING') {
    badgeText = 'MENARIK SENTILAN';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse';
  } else if (aimingState === 'AIRBORNE') {
    badgeText = 'MELAMBUNG';
    badgeColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 animate-pulse';
  } else if (aimingState === 'SIMULATING') {
    badgeText = 'SIMULASI FISIKA';
    badgeColor = 'bg-sky-500/20 text-sky-400 border-sky-500/40 animate-pulse';
  } else if (aimingState === 'EVALUATING') {
    badgeText = 'MENGEVALUASI... (2s)';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
  }

  return (
    <div
      data-testid="hud-debug-controls"
      className="flex items-center gap-2"
    >
      {/* State Badge */}
      <div
        data-testid="status-badge"
        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold tracking-wide uppercase ${badgeColor}`}
      >
        {badgeText}
      </div>

      {/* Trajectory Toggle */}
      <button
        data-testid="toggle-trajectory-btn"
        onClick={toggleTrajectory}
        title="Beralih Garis Trajektori"
        className={`p-2 rounded-xl border backdrop-blur-md transition-all ${
          showTrajectory
            ? 'bg-neutral-900/80 border-neutral-700/60 text-sky-400 hover:bg-neutral-800'
            : 'bg-neutral-900/40 border-neutral-800 text-neutral-500 hover:text-neutral-300'
        }`}
      >
        {showTrajectory ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {/* Audio Mute Toggle */}
      <button
        data-testid="toggle-mute-btn"
        onClick={toggleMute}
        title="Beralih Suara"
        className={`p-2 rounded-xl border backdrop-blur-md transition-all ${
          !isMuted
            ? 'bg-neutral-900/80 border-neutral-700/60 text-emerald-400 hover:bg-neutral-800'
            : 'bg-neutral-900/40 border-neutral-800 text-neutral-500 hover:text-neutral-300'
        }`}
      >
        {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Reset Arena Button */}
      <button
        data-testid="reset-arena-btn"
        onClick={resetArena}
        title="Reset Kelereng ke Formasi Awal"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-medium transition-all hover:scale-105 active:scale-95 shadow-md"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset</span>
      </button>
    </div>
  );
};
