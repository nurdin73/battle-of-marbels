import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { marbleAudio } from '../../utils/soundSynth.utils';
import { X, Target, Minus, Plus, Users, Sparkles } from 'lucide-react';

interface MatchSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COUNTS = [
  { count: 5, label: '5 Butir', desc: 'Duel Kilat' },
  { count: 9, label: '9 Butir', desc: 'Standar Klasik' },
  { count: 13, label: '13 Butir', desc: 'Tantangan Seru' },
  { count: 17, label: '17 Butir', desc: 'Perang Akbar' },
];

const TIMER_OPTIONS: { seconds: number | null; label: string; desc: string }[] = [
  { seconds: 15, label: '15 Detik', desc: 'Kilat' },
  { seconds: 20, label: '20 Detik', desc: 'Standar' },
  { seconds: 30, label: '30 Detik', desc: 'Taktis' },
  { seconds: null, label: '☕ Santai', desc: 'Tanpa Waktu' },
];

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({ isOpen, onClose }) => {
  const currentCount = useGameStore((s) => s.customMarbleCount);
  const currentTimeLimit = useGameStore((s) => s.turnTimeLimitSeconds);
  const startMatchWithMarbleCount = useGameStore((s) => s.startMatchWithMarbleCount);

  const [selectedCount, setSelectedCount] = useState<number>(currentCount || 9);
  const [selectedTimer, setSelectedTimer] = useState<number | null>(
    currentTimeLimit !== undefined ? currentTimeLimit : 20
  );

  if (!isOpen) return null;

  const handleDecrement = () => {
    if (selectedCount > 3) {
      marbleAudio.playWoodKnockSound(0.8);
      setSelectedCount((prev) => Math.max(3, prev - 2));
    }
  };

  const handleIncrement = () => {
    if (selectedCount < 21) {
      marbleAudio.playWoodKnockSound(0.8);
      setSelectedCount((prev) => Math.min(21, prev + 2));
    }
  };

  const handleSelectPreset = (count: number) => {
    marbleAudio.playWoodKnockSound(1.0);
    setSelectedCount(count);
  };

  const handleSelectTimer = (seconds: number | null) => {
    marbleAudio.playWoodKnockSound(1.0);
    setSelectedTimer(seconds);
  };

  const handleStartMatch = () => {
    marbleAudio.playStoneClackSound(1.4);
    onClose();
    startMatchWithMarbleCount(selectedCount, selectedTimer);
  };

  return (
    <div
      data-testid="match-setup-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none pointer-events-auto"
      onClick={onClose}
    >
      <div
        data-testid="match-setup-modal"
        className="relative w-full max-w-md timbul-card p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-stone-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#eee6dc] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-amber-300 border-b-[3px] border-b-amber-400 flex items-center justify-center text-amber-900 font-bold shadow-sm">
              <Users className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-stone-800">
                PENGATURAN TANDING 🎯
              </h2>
              <p className="text-[11px] text-stone-500 font-bold">Atur Jumlah Kelereng Taruhan (Multiplayer)</p>
            </div>
          </div>

          <button
            data-testid="close-match-setup-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] bg-white hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 active:translate-y-[1px] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Counter Stepper Section */}
        <div className="flex flex-col items-center gap-3 bg-stone-50/80 border-2 border-[#eee6dc] border-b-[4px] border-b-[#ded4c5] rounded-2xl p-4 sm:p-5">
          <span className="text-xs uppercase font-extrabold text-stone-500 tracking-wider">
            Jumlah Kelereng di Lingkaran
          </span>

          <div className="flex items-center justify-center gap-4 w-full">
            {/* Decrement Button */}
            <button
              data-testid="decrement-marble-btn"
              onClick={handleDecrement}
              disabled={selectedCount <= 3}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-stone-700 font-black text-xl transition-all cursor-pointer shadow-sm ${
                selectedCount <= 3
                  ? 'opacity-40 cursor-not-allowed bg-stone-200 border-2 border-stone-300'
                  : 'timbul-btn-cream hover:bg-stone-100 active:translate-y-[2px]'
              }`}
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Central Number Box */}
            <div className="flex flex-col items-center justify-center px-6 py-2 bg-white border-2 border-[#eee6dc] border-b-[4px] border-b-[#ded4c5] rounded-2xl shadow-inner min-w-[120px]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 border border-amber-600 shadow-sm" />
                <span className="font-heading font-black text-4xl sm:text-5xl text-stone-800 font-mono tracking-tight">
                  {selectedCount}
                </span>
              </div>
              <span className="text-[10px] font-bold text-stone-400 -mt-0.5">BUTIR KELERENG</span>
            </div>

            {/* Increment Button */}
            <button
              data-testid="increment-marble-btn"
              onClick={handleIncrement}
              disabled={selectedCount >= 21}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-stone-700 font-black text-xl transition-all cursor-pointer shadow-sm ${
                selectedCount >= 21
                  ? 'opacity-40 cursor-not-allowed bg-stone-200 border-2 border-stone-300'
                  : 'timbul-btn-cream hover:bg-stone-100 active:translate-y-[2px]'
              }`}
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Quick Selection Presets */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase text-stone-500 tracking-wider">
            Pilihan Cepat Kelereng
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_COUNTS.map((preset) => {
              const isSelected = selectedCount === preset.count;
              return (
                <button
                  key={`preset-${preset.count}`}
                  onClick={() => handleSelectPreset(preset.count)}
                  className={`py-2 px-2.5 rounded-xl text-center border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100 border-amber-400 border-b-[3px] border-b-amber-500 text-amber-950 font-black shadow-sm scale-[1.02]'
                      : 'bg-white border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] text-stone-600 font-bold hover:bg-stone-50 active:translate-y-[1px]'
                  }`}
                >
                  <span className="block font-heading text-xs font-black">{preset.label}</span>
                  <span className="block text-[10px] text-stone-400 font-semibold">{preset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Turn Timer Option Buttons */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase text-stone-500 tracking-wider">
            Batas Waktu Giliran (Timer)
          </span>
          <div role="radiogroup" aria-label="Batas Waktu Giliran" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIMER_OPTIONS.map((opt) => {
              const isSelected = selectedTimer === opt.seconds;
              return (
                <button
                  key={`timer-${opt.seconds ?? 'null'}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`match-timer-opt-${opt.seconds ?? 'santai'}`}
                  onClick={() => handleSelectTimer(opt.seconds)}
                  className={`py-2 px-2.5 rounded-xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 border-b-[3px] border-b-emerald-700 text-emerald-950 font-black shadow-sm ring-2 ring-emerald-400/30'
                      : 'bg-white border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] text-stone-600 font-bold hover:bg-stone-50 active:translate-y-[1px]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-heading text-xs font-black">{opt.label}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-emerald-600 bg-white' : 'border-stone-300 bg-stone-100'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                    </div>
                  </div>
                  <span className="block text-[10px] text-stone-400 font-semibold">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Traditional Rule Briefing */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-stone-600 text-[11px] leading-relaxed">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Aturan Pekarangan:</strong> Kelereng akan ditata simetris di dalam lingkaran kapur. Siapa yang berhasil menyentil keluar kelereng terbanyak menjadi pemenang!
          </span>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            data-testid="cancel-match-setup-btn"
            onClick={onClose}
            className="flex-1 timbul-btn-cream py-3 px-4 font-heading font-black text-sm text-stone-700 cursor-pointer shadow-sm active:translate-y-[1px]"
          >
            KEMBALI
          </button>

          <button
            data-testid="confirm-match-setup-btn"
            onClick={handleStartMatch}
            className="flex-[2] bg-[#84cc16] hover:bg-[#94dc26] border-2 border-[#65a30d] border-b-[5px] border-b-[#3f6212] text-white font-heading font-black text-base py-3 px-5 rounded-2xl shadow-lg active:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-2 text-stroke-black-heavy"
          >
            <Target className="w-5 h-5" />
            <span>MASUK ARENA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
