import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Zap } from 'lucide-react';

export const PowerMeter: React.FC = () => {
  const drag = useGameStore((s) => s.drag);
  const aimingState = useGameStore((s) => s.aimingState);

  if (aimingState !== 'AIMING' || drag.distance < 0.03) {
    return null;
  }

  const percentage = drag.percentage;

  // Dynamic gradient color based on power
  let barColor = 'from-emerald-500 to-teal-400';
  if (percentage > 70) {
    barColor = 'from-amber-500 to-rose-500';
  } else if (percentage > 40) {
    barColor = 'from-emerald-400 to-amber-400';
  }

  const reachDistance = (0.8 + Math.pow(percentage / 100, 1.15) * 8.0).toFixed(1);

  return (
    <div
      data-testid="hud-power-meter"
      className="absolute bottom-28 left-1/2 -translate-x-1/2 w-80 max-w-[90vw] bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 rounded-2xl p-3 shadow-2xl flex flex-col gap-1.5 transition-all animate-fade-in pointer-events-none"
    >
      <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-neutral-300">
        <span className="flex items-center gap-1.5 text-amber-400">
          <Zap className="w-4 h-4 fill-amber-400" />
          DAYA SENTILAN
        </span>
        <span className="font-mono text-neutral-100 font-bold">{percentage}%</span>
      </div>

      <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700/50 p-0.5">
        <div
          data-testid="hud-power-meter-fill"
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-75`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-neutral-400 px-1 font-mono">
        <span>JANGKAUAN: ~{reachDistance}m</span>
        <span>LEPAS UNTUK TEMBAK</span>
      </div>
    </div>
  );
};
