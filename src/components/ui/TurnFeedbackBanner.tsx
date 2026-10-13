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

  let bgStyles = 'bg-neutral-900/90 border-neutral-700 text-neutral-200';
  let IconComponent = CheckCircle2;
  let title = 'HASIL SENTILAN';

  if (resultType === 'COMBO_EXTRA_TURN') {
    bgStyles = 'bg-gradient-to-r from-amber-950/90 to-emerald-950/90 border-amber-500/80 text-amber-200 ring-2 ring-amber-500/30';
    IconComponent = Flame;
    title = '🔥 KOMBO SENTILAN!';
  } else if (resultType === 'FOUL_OUT_OF_BOUNDS') {
    bgStyles = 'bg-red-950/90 border-red-500/80 text-red-200 ring-2 ring-red-500/30';
    IconComponent = AlertOctagon;
    title = '⚠️ PELANGGARAN (FOUL)';
  } else if (resultType === 'TIMEOUT') {
    bgStyles = 'bg-orange-950/90 border-orange-500/80 text-orange-200 ring-2 ring-orange-500/30';
    IconComponent = Clock;
    title = '⏱️ WAKTU HABIS';
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
