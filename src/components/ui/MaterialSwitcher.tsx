import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { MarbleMaterialType } from '../../types/physics.types';
import { Sparkles, Shield, CircleDot } from 'lucide-react';

interface MaterialOption {
  type: MarbleMaterialType;
  name: string;
  tagline: string;
  weight: string;
  icon: React.ReactNode;
}

const MATERIALS: MaterialOption[] = [
  {
    type: 'GLASS_CLASSIC',
    name: 'Kaca',
    tagline: 'Lincah Mantul',
    weight: '20g',
    icon: <Sparkles className="w-4 h-4 text-sky-700" />,
  },
  {
    type: 'MARBLE_STONE',
    name: 'Batu Kali',
    tagline: 'Mantap Berbobot',
    weight: '38g',
    icon: <Shield className="w-4 h-4 text-emerald-700" />,
  },
  {
    type: 'BEARING_STEEL',
    name: 'Gotri Besi',
    tagline: 'Keras Menabrak',
    weight: '55g',
    icon: <CircleDot className="w-4 h-4 text-stone-700" />,
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
      className="timbul-card p-3.5 flex flex-col gap-2.5 w-full"
    >
      <div className="text-[11px] font-black text-stone-600 uppercase tracking-wider px-1 flex items-center justify-between">
        <span>Kelereng Jagoan:</span>
        <span className="text-[10px] text-stone-400 font-bold normal-case">Pilih jenis untuk sentilan</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {MATERIALS.map((mat) => {
          const isActive = gacoanMaterial === mat.type;
          return (
            <button
              key={mat.type}
              data-testid={`material-btn-${mat.type.toLowerCase()}`}
              disabled={disabled}
              onClick={() => setGacoanMaterial(mat.type)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all w-full ${
                isActive
                  ? 'bg-[#fff8f5] border-2 border-[#ff6242] border-b-[4px] border-b-[#d54425] text-stone-900 shadow-sm font-black ring-1 ring-orange-200'
                  : 'bg-white hover:bg-[#faf7f2] border-2 border-[#eee6dc] border-b-[3px] border-b-[#ded4c5] text-stone-600 font-bold active:translate-y-[1px] active:border-b-[2px]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {mat.icon}
              <div className="flex flex-col text-left">
                <span className="font-extrabold leading-tight">{mat.name}</span>
                <span className="text-[10px] text-stone-500 font-semibold">
                  {mat.tagline} ({mat.weight})
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
