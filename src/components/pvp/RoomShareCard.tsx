import React, { useState } from 'react';
import { Copy, Check, Share2, Users, ArrowLeft } from 'lucide-react';
import { marbleAudio } from '../../utils/soundSynth.utils';

interface RoomShareCardProps {
  roomCode: string;
  betAmount: number;
  turnTimeLimit: number | null;
  onCancel: () => void;
}

export const RoomShareCard: React.FC<RoomShareCardProps> = ({
  roomCode,
  betAmount,
  turnTimeLimit,
  onCancel,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const roomUrl = `${window.location.origin}/rooms/${roomCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      marbleAudio.playWoodKnockSound(1.0);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      marbleAudio.playWoodKnockSound(1.0);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareNative = async () => {
    marbleAudio.playWoodKnockSound(1.1);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tanding Kelereng 1-vs-1!',
          text: `Ayo duel kelereng denganku di Battle of Marbles! Kode Kamar: ${roomCode}`,
          url: roomUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      data-testid="room-share-card-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        data-testid="room-share-card"
        className="relative w-full max-w-md bg-[#fdfbf7] rounded-3xl border-4 border-[#eee6dc] border-b-[8px] border-b-[#ded4c5] shadow-2xl p-5 sm:p-6 flex flex-col gap-4 text-stone-800"
      >
        {/* Header: MENUNGGU PEMAIN */}
        <div className="flex items-center justify-between border-b-2 border-stone-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-600 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-stone-900 leading-tight">
                MENUNGGU PEMAIN
              </h2>
              <p className="text-xs font-semibold text-stone-500">Kamar Tanding Kelereng 1-vs-1</p>
            </div>
          </div>
        </div>

        {/* 2 Player Slot Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Slot 1: Host (Kamu) */}
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-blue-50/90 border-2 border-blue-300 shadow-inner text-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center text-2xl shadow-sm">
                👦
              </div>
              <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                HOST
              </span>
            </div>
            <span className="font-heading font-black text-xs text-blue-950 truncate max-w-[120px]">
              Tuan Rumah (Kamu)
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              ✓ Siap Tanding
            </span>
          </div>

          {/* Slot 2: Lawan (Menunggu...) */}
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-stone-100/90 border-2 border-dashed border-stone-300 shadow-inner text-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-stone-200 border-2 border-stone-300 flex items-center justify-center text-xl text-stone-400 animate-pulse">
                👤
              </div>
              <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-stone-400 text-white px-1.5 py-0.2 rounded-full animate-ping">
                ⏳
              </span>
            </div>
            <span className="font-heading font-bold text-xs text-stone-500">
              Lawan (Slot 2)
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
              Menunggu Masuk...
            </span>
          </div>
        </div>

        {/* Room Code Display */}
        <div
          data-testid="room-code-section"
          className="flex flex-col items-center gap-1.5 w-full bg-stone-100/90 p-3.5 rounded-2xl border-2 border-stone-300 shadow-inner"
        >
          <span className="text-[11px] font-heading font-black text-stone-500 uppercase tracking-wider">
            KODE KAMAR:
          </span>
          <div className="flex items-center gap-2.5">
            <span
              data-testid="room-code-display"
              className="font-heading font-black text-3xl tracking-widest text-blue-600 select-all"
            >
              {roomCode}
            </span>
            <button
              data-testid="room-copy-code-btn"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 active:translate-y-[1px] text-amber-950 font-heading font-black text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              title="Salin Kode Saja"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
          </div>
        </div>

        {/* Direct Link Share UI */}
        <div
          data-testid="room-link-share-section"
          className="flex flex-col gap-2 bg-amber-50/80 p-3.5 rounded-2xl border-2 border-amber-200/90"
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-heading font-black text-amber-900 flex items-center gap-1.5">
              <span>🔗 LINK UNDANGAN LANGSUNG:</span>
            </label>
            <span className="text-[10px] font-bold text-amber-700">Tinggal Klik untuk Gabung</span>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl border border-amber-300 px-3 py-2 shadow-inner">
            <input
              data-testid="room-url-input"
              type="text"
              readOnly
              value={roomUrl}
              className="w-full text-xs font-mono text-stone-700 bg-transparent focus:outline-none select-all truncate"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              data-testid="room-copy-link-btn"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-[#84cc16] hover:bg-[#94dc26] border-2 border-[#65a30d] border-b-[4px] border-b-[#3f6212] text-white font-heading font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:translate-y-[1px] active:border-b-[2px] transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link'}</span>
            </button>

            <button
              data-testid="room-native-share-btn"
              onClick={handleShareNative}
              className="py-2.5 px-3 rounded-xl bg-[#0284c7] hover:bg-[#38bdf8] border-2 border-[#0369a1] border-b-[4px] border-b-[#075985] text-white font-heading font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:translate-y-[1px] active:border-b-[2px] transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan Link</span>
            </button>
          </div>
        </div>

        {/* Match Rules Pill */}
        <div className="flex items-center justify-between text-xs font-bold text-stone-600 bg-stone-100/70 px-3 py-2 rounded-xl border border-stone-200">
          <span>
            Taruhan: <strong className="text-amber-900">{betAmount} Butir/Pemain</strong> (Arena: {betAmount * 2})
          </span>
          <span>
            Batas Waktu:{' '}
            <strong className="text-emerald-800">
              {turnTimeLimit !== null ? `${turnTimeLimit} Detik` : 'Santai'}
            </strong>
          </span>
        </div>

        {/* Cancel Button */}
        <button
          data-testid="room-cancel-btn"
          onClick={onCancel}
          className="w-full mt-1 py-2.5 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 active:translate-y-[1px] text-stone-700 font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Batalkan & Kembali ke Menu Solo</span>
        </button>
      </div>
    </div>
  );
};
