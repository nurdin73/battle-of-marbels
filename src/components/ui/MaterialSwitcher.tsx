import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { MarbleMaterialType } from '../../types/physics.types';
import { Sparkles, Shield, CircleDot } from 'lucide-react';

interface MaterialOption {
  type: MarbleMaterialType;
  name: string;
  weight: string;
  restitution: string;
  icon: React.ReactNode;
}

const MATERIALS: MaterialOption[] = [
  {
    type: 'GLASS_CLASSIC',
    name: 'Kaca',
    weight: '20g',
    restitution: '78%',
    icon: <Sparkles className="w-4 h-4 text-sky-400" />,
  },
  {
    type: 'MARBLE_STONE',
    name: 'Batu',
    weight: '38g',
    restitution: '62%',
    icon: <Shield className="w-4 h-4 text-emerald-400" />,
  },
  {
    type: 'BEARING_STEEL',
    name: 'Gotri Besi',
    weight: '55g',
    restitution: '50%',
    icon: <CircleDot className="w-4 h-4 text-amber-400" />,
  },
];

export const MaterialSwitcher: React.FC = () => {
  const gacoanMaterial = useGameStore((s) => s.gacoanMaterial);
  const setGacoanMaterial = useGameStore((s) => s.setGacoanMaterial);
  const aimingState = useGameStore((s) => s.aimingState);

  const disabled = aimingState !== 'IDLE';

  return (
    <div
      data-testid="hud-material-switcher"
      className="bg-neutral-900/80 backdrop-blur-md border border-neutral-700/60 rounded-2xl p-2 shadow-xl flex items-center gap-1.5"
    >
      <div className="hidden sm:block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
        Gacoan:
      </div>

      <div className="flex gap-1.5">
        {MATERIALS.map((mat) => {
          const isActive = gacoanMaterial === mat.type;
          return (
            <button
              key={mat.type}
              data-testid={`material-btn-${mat.type.toLowerCase()}`}
              disabled={disabled}
              onClick={() => setGacoanMaterial(mat.type)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-neutral-800 border border-sky-500/60 text-neutral-100 shadow-md ring-1 ring-sky-500/30'
                  : 'bg-neutral-800/40 border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {mat.icon}
              <div className="flex flex-col text-left">
                <span className="font-semibold">{mat.name}</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {mat.weight} • e={mat.restitution}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
