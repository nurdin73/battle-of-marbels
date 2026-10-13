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
  let barColor = 'from-emerald-400 to-amber-300';
  if (percentage > 70) {
    barColor = 'from-amber-400 to-orange-500';
  } else if (percentage > 40) {
    barColor = 'from-emerald-400 to-amber-400';
  }

  const reachDistance = (0.35 + Math.pow(percentage / 100, 1.35) * 3.65).toFixed(1);

  return (
    <div
      data-testid="hud-power-meter"
      className="absolute bottom-28 left-1/2 -translate-x-1/2 w-80 max-w-[90vw] timbul-card p-3.5 flex flex-col gap-2 transition-all animate-fade-in pointer-events-none"
    >
      <div className="flex items-center justify-between text-xs font-black tracking-wider text-stone-700">
        <span className="flex items-center gap-1.5 text-[#d54425]">
          <Zap className="w-4 h-4 fill-[#ff6242] text-[#d54425]" />
          TENAGA SENTIL 👆
        </span>
        <span className="font-mono text-stone-900 font-black">{percentage}%</span>
      </div>

      <div className="w-full h-3.5 bg-[#ede6dc] rounded-full overflow-hidden border border-[#ded5c7] p-0.5 shadow-inner">
        <div
          data-testid="hud-power-meter-fill"
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-75 shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-stone-500 px-1 font-bold">
        <span>Jangkauan: ~{reachDistance}m</span>
        <span>Lepas buat nyentil! ✨</span>
      </div>
    </div>
  );
};
