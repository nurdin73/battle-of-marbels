import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';

export const TurnTimer: React.FC = () => {
  const turnTimer = useGameStore((s) => s.turnTimer);
  const isTimerActive = useGameStore((s) => s.isTimerActive);
  const aimingState = useGameStore((s) => s.aimingState);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const tickTimer = useGameStore((s) => s.tickTimer);

  useEffect(() => {
    if (!isTimerActive || isGameOver || (aimingState !== 'IDLE' && aimingState !== 'AIMING' && aimingState !== 'CHARGING')) {
      return;
    }

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, isGameOver, aimingState, tickTimer]);

  const isUrgent = turnTimer <= 5;
  const formattedSeconds = turnTimer.toString().padStart(2, '0');

  return (
    <div
      data-testid="turn-timer"
      className="flex flex-col items-center justify-center select-none pointer-events-none leading-tight"
    >
      <span className="font-heading text-lg sm:text-xl font-black tracking-wider text-[#fde047] text-stroke-black-heavy">
        GILIRAN KAMU!
      </span>
      <span
        data-testid="turn-timer-value"
        className={`font-mono text-base sm:text-lg font-black tracking-wider text-stroke-black-heavy -mt-0.5 ${
          isUrgent ? 'text-[#ff6242] animate-pulse' : 'text-white'
        }`}
      >
        0:{formattedSeconds}s
      </span>
    </div>
  );
};
