import React from 'react';
import { X, HelpCircle, Keyboard, Target, Sparkles, Check } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="help-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none pointer-events-auto"
      onClick={onClose}
    >
      <div
        data-testid="help-modal"
        className="relative w-full max-w-lg timbul-card p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#eee6dc] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 border-2 border-orange-200 border-b-[3px] border-b-orange-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-stone-800">
                PANDUAN MAIN & KONTROL 🎮
              </h2>
              <p className="text-[11px] text-stone-500 font-bold">Kelereng Clash 3D Tradisional</p>
            </div>
          </div>

          <button
            data-testid="close-help-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] bg-white hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 active:translate-y-[1px] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Keyboard & Input Shortcuts */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-stone-700 uppercase tracking-wider">
            <Keyboard className="w-3.5 h-3.5 text-[#d54425]" />
            <span>Tombol Pintasan & Kontrol:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Control item 1 */}
            <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-xl p-2.5 flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-orange-100 border border-orange-300 font-mono font-bold text-[10px] text-orange-950 shrink-0">
                Drag & Lepas
              </span>
              <span className="text-stone-600 font-medium text-[11px] leading-tight">
                Tarik gacoan ke belakang untuk mengatur sudut bidik & kunci arah.
              </span>
            </div>

            {/* Control item 2 */}
            <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-xl p-2.5 flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 font-mono font-bold text-[10px] text-emerald-950 shrink-0">
                Spasi / Klik
              </span>
              <span className="text-stone-600 font-medium text-[11px] leading-tight">
                Tekan tombol Spasi atau klik barometer untuk melepaskan sentilan.
              </span>
            </div>

            {/* Control item 3 */}
            <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-xl p-2.5 flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-stone-100 border border-stone-300 font-mono font-bold text-[10px] text-stone-800 shrink-0">
                Esc
              </span>
              <span className="text-stone-600 font-medium text-[11px] leading-tight">
                Batalkan & atur ulang arah bidikan kelereng.
              </span>
            </div>

            {/* Control item 4 */}
            <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-xl p-2.5 flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-purple-100 border border-purple-300 font-mono font-bold text-[10px] text-purple-950 shrink-0">
                1 / 2 / 3
              </span>
              <span className="text-stone-600 font-medium text-[11px] leading-tight">
                Pilih dan aktifkan Kartu Jurus Trik dari kantung tangan.
              </span>
            </div>

            {/* Control item 5 */}
            <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-xl p-2.5 flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300 font-mono font-bold text-[10px] text-amber-950 shrink-0">
                R
              </span>
              <span className="text-stone-600 font-medium text-[11px] leading-tight">
                Tata ulang posisi arena kelereng ke formasi awal.
              </span>
            </div>

            {/* Control item 6 */}
            <div className="bg-white border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] rounded-xl p-2.5 flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-stone-100 border border-stone-300 font-mono font-bold text-[10px] text-stone-800 shrink-0">
                M
              </span>
              <span className="text-stone-600 font-medium text-[11px] leading-tight">
                Beralih mode suara sentilan (Mute / Unmute).
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Aturan Permainan */}
        <div className="bg-[#fff9f6] border-2 border-[#ffdcd2] border-b-[3px] border-b-[#f5a18d] rounded-2xl p-3.5 flex items-start gap-3">
          <Target className="w-4 h-4 text-[#d54425] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-[11px] text-stone-700 leading-relaxed font-medium">
            <strong className="text-stone-900 flex items-center gap-1 font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Tujuan & Skor:
            </strong>
            Keluarkan semua kelereng target dari lingkaran ring tanah. Selesaikan dengan jumlah sentilan di bawah target (Par) untuk mengumpulkan bintang penuh!
          </div>
        </div>

        {/* Footer Button */}
        <div className="pt-1">
          <button
            data-testid="help-modal-confirm-btn"
            onClick={onClose}
            className="w-full timbul-btn-coral py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Siap, Saya Mengerti!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
