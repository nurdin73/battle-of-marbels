import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { RotateCcw, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

export const DebugControls: React.FC = () => {
  const resetArena = useGameStore((s) => s.resetArena);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleTrajectory = useGameStore((s) => s.toggleTrajectory);
  const isMuted = useGameStore((s) => s.isMuted);
  const showTrajectory = useGameStore((s) => s.showTrajectory);

  return (
    <div
      data-testid="hud-debug-controls"
      className="flex items-center gap-2 pointer-events-auto"
    >
      {/* Trajectory Toggle (Eye) */}
      <button
        data-testid="toggle-trajectory-btn"
        onClick={toggleTrajectory}
        title="Beralih Garis Bidik Kelereng"
        className={`w-9 h-9 rounded-2xl border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] flex items-center justify-center transition-all active:translate-y-[1px] active:border-b-[2px] cursor-pointer ${
          showTrajectory
            ? 'bg-amber-100 text-amber-900 border-amber-300 border-b-amber-500'
            : 'bg-[#fdfbf7] text-stone-400 hover:text-stone-700'
        }`}
      >
        {showTrajectory ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {/* Audio Mute Toggle (Sound) */}
      <button
        data-testid="toggle-mute-btn"
        onClick={toggleMute}
        title="Beralih Suara Sentilan"
        className={`w-9 h-9 rounded-2xl border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] flex items-center justify-center transition-all active:translate-y-[1px] active:border-b-[2px] cursor-pointer ${
          !isMuted
            ? 'bg-amber-100 text-amber-900 border-amber-300 border-b-amber-500'
            : 'bg-[#fdfbf7] text-stone-400 hover:text-stone-700'
        }`}
      >
        {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Reset Arena Button (Reset) */}
      <button
        data-testid="reset-arena-btn"
        onClick={resetArena}
        title="Tata Ulang Kelereng ke Posisi Awal"
        className="timbul-btn-coral flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer h-9"
      >
        <RotateCcw className="w-3.5 h-3.5 text-white" />
        <span>Tata Ulang</span>
      </button>
    </div>
  );
};

