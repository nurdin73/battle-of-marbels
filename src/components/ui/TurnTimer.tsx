import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Clock, AlertTriangle } from 'lucide-react';

export const TurnTimer: React.FC = () => {
  const turnTimer = useGameStore((s) => s.turnTimer);
  const isTimerActive = useGameStore((s) => s.isTimerActive);
  const aimingState = useGameStore((s) => s.aimingState);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const tickTimer = useGameStore((s) => s.tickTimer);

  useEffect(() => {
    if (!isTimerActive || isGameOver || (aimingState !== 'IDLE' && aimingState !== 'AIMING')) {
      return;
    }

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, isGameOver, aimingState, tickTimer]);

  const isUrgent = turnTimer <= 5;
  const isWarning = turnTimer <= 10 && !isUrgent;

  const colorStyles = isUrgent
    ? 'border-red-500/70 bg-red-950/80 text-red-300 animate-pulse ring-2 ring-red-500/40'
    : isWarning
      ? 'border-amber-500/60 bg-amber-950/70 text-amber-300'
      : 'border-neutral-700/60 bg-neutral-900/80 text-neutral-200';

  return (
    <div
      data-testid="turn-timer"
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-200 ${colorStyles}`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-sky-400" />
      )}
      <div className="flex flex-col text-left">
        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
          {isUrgent ? 'Cepat Tembak!' : 'Batas Waktu'}
        </span>
        <div className="flex items-baseline gap-1">
          <span
            data-testid="turn-timer-value"
            className="text-base font-extrabold font-mono tracking-tight"
          >
            {turnTimer}
          </span>
          <span className="text-[10px] font-normal opacity-60">detik</span>
        </div>
      </div>
    </div>
  );
};
