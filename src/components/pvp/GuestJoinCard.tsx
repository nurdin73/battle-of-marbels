import React, { useState } from 'react';
import { Users, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { marbleAudio } from '../../utils/soundSynth.utils';
import { usePlayerWalletStore } from '../../store/usePlayerWalletStore';

interface GuestJoinCardProps {
  roomCode: string;
  isConnecting: boolean;
  errorMessage: string | null;
  onJoin: (playerName: string) => void;
  onCancel: () => void;
}

export const GuestJoinCard: React.FC<GuestJoinCardProps> = ({
  roomCode,
  isConnecting,
  errorMessage,
  onJoin,
  onCancel,
}) => {
  const walletBalance = usePlayerWalletStore((s) => s.balance);
  const refillBalance = usePlayerWalletStore((s) => s.refillBalance);
  const [playerName, setPlayerName] = useState<string>('Jawara Merah');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConnecting) return;
    marbleAudio.playWoodKnockSound(1.2);
    onJoin(playerName);
  };

  return (
    <div
      data-testid="guest-join-card-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none"
    >
      <div
        data-testid="guest-join-card"
        className="relative w-full max-w-md bg-[#fdfbf7] rounded-3xl border-4 border-[#eee6dc] border-b-[8px] border-b-[#ded4c5] shadow-2xl p-5 sm:p-6 flex flex-col gap-4 text-stone-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 border-2 border-red-300 flex items-center justify-center text-red-600 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-stone-900 leading-tight">
                UNDANGAN TANDING
              </h2>
              <p className="text-xs font-semibold text-stone-500">Tantangan Duel Kelereng 1-vs-1</p>
            </div>
          </div>

          <button
            data-testid="guest-join-close-btn"
            onClick={onCancel}
            className="w-9 h-9 rounded-xl bg-stone-200 hover:bg-stone-300 active:translate-y-[1px] flex items-center justify-center text-stone-600 font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center justify-between bg-stone-100 p-3 rounded-2xl border-2 border-stone-300">
          <span className="text-xs font-heading font-black text-stone-600">KODE RUANG TANDING:</span>
          <span
            data-testid="guest-room-code-badge"
            className="font-heading font-black text-xl text-red-600 tracking-wider"
          >
            {roomCode}
          </span>
        </div>

        {/* Wallet Balance Card */}
        <div
          data-testid="guest-wallet-card"
          className="flex items-center justify-between bg-amber-100/70 border-2 border-amber-300/80 p-2.5 rounded-2xl shadow-inner"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white border border-amber-400 flex items-center justify-center text-sm shadow-sm">
              ⚪
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-heading font-black text-amber-900 leading-none">
                DOMPET KELERENG
              </span>
              <span className="font-heading font-black text-sm text-stone-900 leading-tight">
                {walletBalance} <span className="text-xs font-bold text-stone-600">Butir</span>
              </span>
            </div>
          </div>
          <button
            data-testid="guest-refill-wallet-btn"
            onClick={() => {
              marbleAudio.playWoodKnockSound(1.0);
              refillBalance();
            }}
            className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 active:translate-y-[1px] text-amber-950 font-heading font-black text-[11px] shadow-xs cursor-pointer border border-amber-500"
            title="Isi ulang modal awal ke 50 kelereng"
          >
            + Isi Ulang (50)
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div
            data-testid="guest-error-banner"
            className="flex items-center gap-2 p-3 rounded-2xl bg-red-100 border-2 border-red-300 text-red-800 text-xs font-bold"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80">
            <label className="text-xs font-heading font-black text-amber-900">
              MASUKKAN NAMA PEMAINMU:
            </label>
            <input
              data-testid="guest-player-name-input"
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={isConnecting}
              placeholder="Ketik nama..."
              className="w-full px-3 py-2 rounded-xl border-2 border-amber-300/80 bg-white font-heading font-bold text-stone-800 text-sm focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>

          <button
            data-testid="guest-confirm-join-btn"
            type="submit"
            disabled={isConnecting || !playerName.trim()}
            className="w-full mt-1 bg-[#ef4444] hover:bg-[#f87171] border-2 border-[#dc2626] border-b-[5px] border-b-[#991b1b] text-white font-heading font-black text-base py-3 px-6 rounded-2xl shadow-lg active:translate-y-[2px] active:border-b-[2px] transition-all cursor-pointer flex items-center justify-center text-stroke-black-heavy disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>MENYAMBUNGKAN KE RUANGAN...</span>
              </div>
            ) : (
              <span>GABUNG PERTANDINGAN SEKARANG</span>
            )}
          </button>
        </form>

        {/* Cancel Button */}
        <button
          data-testid="guest-cancel-btn"
          onClick={onCancel}
          className="w-full py-2.5 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 active:translate-y-[1px] text-stone-700 font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Menu Solo</span>
        </button>
      </div>
    </div>
  );
};
