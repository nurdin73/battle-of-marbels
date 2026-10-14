import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';
import { RotateCcw, Volume2, VolumeX, Eye, EyeOff, HelpCircle } from 'lucide-react';

interface DebugControlsProps {
  onOpenHelp?: () => void;
}

export const DebugControls: React.FC<DebugControlsProps> = ({ onOpenHelp }) => {
  const isMultiplayerActive = useMultiplayerStore((s) => s.isMultiplayerActive);
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

      {/* Reset Arena Button (Reset - Solo Mode Only) */}
      {!isMultiplayerActive && (
        <button
          data-testid="reset-arena-btn"
          onClick={resetArena}
          title="Tata Ulang Kelereng ke Posisi Awal"
          className="timbul-btn-coral flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer h-9"
        >
          <RotateCcw className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Tata Ulang</span>
        </button>
      )}

      {/* Help & Guide Modal Trigger (?) */}
      {onOpenHelp && (
        <button
          data-testid="open-help-modal-btn"
          onClick={onOpenHelp}
          title="Panduan Bermain & Tombol Pintasan (?)"
          className="w-9 h-9 rounded-2xl border-2 border-[#ffd3c9] border-b-[3px] border-b-[#f57b64] bg-[#fff7f4] hover:bg-[#ffede8] flex items-center justify-center text-[#d54425] active:translate-y-[1px] active:border-b-[2px] transition-all cursor-pointer shadow-sm"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

