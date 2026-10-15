import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { marbleAudio } from '../../utils/soundSynth.utils';

interface RoomReconnectOverlayProps {
  roomCode: string;
  errorMessage: string | null;
  onReconnect: () => Promise<void>;
  onLeave: () => void;
}

export const RoomReconnectOverlay: React.FC<RoomReconnectOverlayProps> = ({
  roomCode,
  errorMessage,
  onReconnect,
  onLeave,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    marbleAudio.playWoodKnockSound(1.1);
    try {
      await onReconnect();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      data-testid="room-reconnect-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in select-none"
    >
      <div
        data-testid="room-reconnect-card"
        className="relative w-full max-w-sm bg-[#fdfbf7] rounded-3xl border-4 border-[#eee6dc] border-b-[8px] border-b-[#ded4c5] shadow-2xl p-6 flex flex-col items-center gap-4 text-center text-stone-800"
      >
        <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-inner text-amber-600">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-heading font-black text-xl text-stone-900">
            KONEKSI TERPUTUS
          </h2>
          <p className="text-xs font-semibold text-stone-500">
            Koneksi dengan kamar {roomCode} terganggu.
          </p>
        </div>

        {errorMessage && (
          <div
            data-testid="reconnect-error-detail"
            className="w-full p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full mt-2">
          <button
            data-testid="pvp-reconnect-btn"
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full bg-[#0284c7] hover:bg-[#38bdf8] border-2 border-[#0369a1] border-b-[4px] border-b-[#075985] text-white font-heading font-black text-sm py-2.5 px-4 rounded-xl shadow-md active:translate-y-[1px] active:border-b-[2px] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyambung Ulang...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Coba Sambung Ulang</span>
              </>
            )}
          </button>

          <button
            data-testid="pvp-reconnect-leave-btn"
            onClick={onLeave}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 active:translate-y-[1px] text-stone-700 font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Menu Solo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
