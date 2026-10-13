import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Flame, AlertOctagon, Clock, CheckCircle2 } from 'lucide-react';

export const TurnFeedbackBanner: React.FC = () => {
  const lastTurnOutcome = useGameStore((s) => s.lastTurnOutcome);
  const clearTurnOutcome = useGameStore((s) => s.clearTurnOutcome);

  useEffect(() => {
    if (!lastTurnOutcome) return;

    const timer = setTimeout(() => {
      clearTurnOutcome();
    }, 4000);

    return () => clearTimeout(timer);
  }, [lastTurnOutcome, clearTurnOutcome]);

  if (!lastTurnOutcome) return null;

  const { resultType, message } = lastTurnOutcome;

  let bgStyles = 'timbul-card';
  let IconComponent = CheckCircle2;
  let title = '✨ HASIL SENTILAN';

  if (resultType === 'COMBO_EXTRA_TURN') {
    bgStyles = 'bg-amber-50 border-2 border-amber-300 border-b-[5px] border-b-amber-500 text-amber-950 shadow-md';
    IconComponent = Flame;
    title = '💥 JOSS GANDOS! GILIRAN BONUS!';
  } else if (resultType === 'FOUL_OUT_OF_BOUNDS') {
    bgStyles = 'bg-[#fff8f5] border-2 border-[#ff6242] border-b-[5px] border-b-[#d54425] text-stone-900 shadow-md';
    IconComponent = AlertOctagon;
    title = '🙈 ADUH, KELUAR GARIS!';
  } else if (resultType === 'TIMEOUT') {
    bgStyles = 'bg-orange-50 border-2 border-orange-300 border-b-[5px] border-b-orange-400 text-orange-950 shadow-md';
    IconComponent = Clock;
    title = '⏳ WADUH, KELAMAAN BENGONG!';
  }

  return (
    <div
      data-testid="turn-feedback-banner"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-auto transition-all transform animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-[92%]"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl ${bgStyles}`}
      >
        <div className="p-2 rounded-xl bg-white/10 shrink-0">
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex flex-col text-left flex-1 min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80 font-mono">
            {title}
          </span>
          <span className="text-xs sm:text-sm font-semibold truncate leading-snug">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
