import React from 'react';
import { useCardStore, MAX_CHALK_ENERGY } from '../../store/useCardStore';
import { useGameStore } from '../../store/useGameStore';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';
import { X, Sparkles } from 'lucide-react';

export const CardDeckOverlay: React.FC = () => {
  const chalkEnergy = useCardStore((s) => s.chalkEnergy);
  const handCards = useCardStore((s) => s.handCards);
  const activeCardId = useCardStore((s) => s.activeCardId);
  const selectCard = useCardStore((s) => s.selectCard);
  const deselectCard = useCardStore((s) => s.deselectCard);

  const isMultiplayerActive = useMultiplayerStore((s) => s.isMultiplayerActive);
  const matchPhase = useMultiplayerStore((s) => s.matchPhase);

  const aimingState = useGameStore((s) => s.aimingState);
  const isInteracting =
    aimingState === 'AIMING' ||
    aimingState === 'CHARGING' ||
    aimingState === 'AIRBORNE' ||
    aimingState === 'SIMULATING';

  // Power cards are strictly forbidden during multiplayer TOSS_PHASE (Lempar Niat)
  if (isMultiplayerActive && matchPhase === 'TOSS_PHASE') {
    return null;
  }

  return (
    <div
      data-testid="card-deck-overlay"
      className={`fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto transition-all duration-300 flex flex-col items-center max-w-2xl w-auto ${
        isInteracting ? 'opacity-35 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Minimalist Floating Chalk Resource Indicator */}
      <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-stone-900/85 backdrop-blur-md rounded-full border border-stone-700/60 shadow-lg select-none">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] sm:text-[11px] font-bold text-stone-300 uppercase tracking-wider">
            Kapur
          </span>
          <span className="text-[11px] sm:text-xs font-black font-mono text-amber-300">
            {chalkEnergy}/{MAX_CHALK_ENERGY}
          </span>
        </div>

        {activeCardId && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-stone-700">
            <span className="text-[10px] font-extrabold text-[#ff7854] animate-pulse">
              ✨ Jurus Aktif!
            </span>
            <button
              onClick={deselectCard}
              className="text-stone-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
              title="Batal Memakai Jurus"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 4 Cards Arranged in Horizontal Row Exactly Like Reference Screenshot */}
      <div className="flex items-end justify-center gap-2 sm:gap-2.5 w-auto">
        {handCards.map((card) => {
          const isActive = activeCardId === card.id;
          const canAfford = chalkEnergy >= card.cost;

          return (
            <div
              key={card.id}
              data-testid={`card-${card.id}`}
              onClick={() => {
                if (canAfford || isActive) {
                  selectCard(card.id);
                }
              }}
              className={`relative select-none cursor-pointer transition-all duration-200 transform-gpu ${
                isActive
                  ? 'z-20 -translate-y-5 sm:-translate-y-7 -rotate-2 scale-[1.03]'
                  : canAfford
                    ? 'z-10 translate-y-0 rotate-0 hover:-translate-y-2.5'
                    : 'z-10 translate-y-0 rotate-0 opacity-45 grayscale contrast-75 cursor-not-allowed'
              }`}
            >
              {/* Card Container (No outer borders, strictly clipped rounded corners) */}
              <div
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[0.72] w-[86px] sm:w-[108px] md:w-[134px] transition-all duration-200 bg-stone-900 ${
                  isActive
                    ? 'border-[3px] border-white shadow-[0_0_22px_rgba(255,255,255,0.9),0_12px_28px_rgba(0,0,0,0.55)]'
                    : 'border-0 shadow-md'
                }`}
              >
                {/* 
                  scale-[1.16] zooms in past the 6.7% horizontal & 5.17% vertical white padding,
                  guaranteeing 100% elimination of whitespace so the card artwork fills edge-to-edge
                */}
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-cover scale-[1.16] transform-gpu pointer-events-none select-none"
                  loading="lazy"
                />

                {/* Subtle Chalk Cost Indicator (Top-Left) */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm">
                  <span className="text-[10px] sm:text-[11px] font-black font-mono text-amber-300">
                    {card.cost}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-stone-200">
                    🖍️
                  </span>
                </div>

                {/* Insufficient Chalk Overlay */}
                {!canAfford && !isActive && (
                  <div className="absolute inset-0 bg-stone-950/45 backdrop-blur-[0.5px] flex items-center justify-center p-1 text-center">
                    <span className="bg-stone-900/90 text-stone-300 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border border-stone-700/60 shadow-md">
                      Kapur Kurang
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
