import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';

export const PowerMeter: React.FC = () => {
  const aimingState = useGameStore((s) => s.aimingState);
  const fireFlick = useGameStore((s) => s.fireFlick);
  const cancelAiming = useGameStore((s) => s.cancelAiming);
  const setOscillatingPower = useGameStore((s) => s.setOscillatingPower);

  const [displayPower, setDisplayPower] = useState(50);
  const powerRef = useRef(50);

  // Oscillating barometer animation loop during CHARGING
  useEffect(() => {
    if (aimingState !== 'CHARGING') {
      return;
    }

    let animId: number;
    const startTime = performance.now();
    const periodMs = 1200; // 1.2s per complete 0 -> 100 -> 0 oscillation cycle

    const loop = (now: number) => {
      const elapsed = (now - startTime) % periodMs;
      const halfPeriod = periodMs / 2;
      let val: number;

      if (elapsed <= halfPeriod) {
        val = Math.round((elapsed / halfPeriod) * 100);
      } else {
        val = Math.round(((periodMs - elapsed) / halfPeriod) * 100);
      }

      val = Math.max(1, Math.min(100, val));
      powerRef.current = val;
      setDisplayPower(val);
      setOscillatingPower(val);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [aimingState, setOscillatingPower]);

  const handleRelease = useCallback(() => {
    if (aimingState !== 'CHARGING') return;
    fireFlick(powerRef.current);
  }, [aimingState, fireFlick]);

  // Keyboard shortcut listeners (Spacebar to shoot, Escape to re-aim)
  useEffect(() => {
    if (aimingState !== 'CHARGING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleRelease();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        cancelAiming();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aimingState, handleRelease, cancelAiming]);

  if (aimingState !== 'CHARGING') {
    return null;
  }

  let barColor = 'from-emerald-400 to-amber-300';
  if (displayPower > 75) {
    barColor = 'from-amber-400 to-[#ff6242]';
  } else if (displayPower > 40) {
    barColor = 'from-emerald-400 to-amber-400';
  }

  return (
    <div
      data-testid="hud-power-meter"
      onClick={handleRelease}
      className="absolute bottom-28 left-1/2 -translate-x-1/2 w-64 sm:w-80 flex flex-col items-center gap-1.5 transition-all animate-fade-in pointer-events-auto select-none z-30 cursor-pointer"
      title="Klik atau tekan Spasi untuk melepaskan sentilan"
    >
      {/* Floating Pure Progress Bar */}
      <div className="relative w-full h-5 bg-[#ede6dc]/95 rounded-full overflow-hidden border-2 border-stone-800 shadow-[0_4px_12px_rgba(0,0,0,0.35)] p-0.5 backdrop-blur-xs">
        <div
          data-testid="hud-power-meter-fill"
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-none shadow-sm`}
          style={{ width: `${displayPower}%` }}
        />
        {/* Moving Needle Indicator */}
        <div
          className="absolute top-0 bottom-0 w-2.5 bg-white border-2 border-stone-900 rounded-full shadow-md -translate-x-1/2 pointer-events-none"
          style={{ left: `${displayPower}%` }}
        />
      </div>

      {/* Clean high-contrast text percentage */}
      <span
        data-testid="hud-power-percentage"
        className="font-mono text-sm font-black text-white text-stroke-black-heavy tracking-wider"
      >
        {displayPower}%
      </span>
    </div>
  );
};
