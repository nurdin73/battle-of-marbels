import React from 'react';
import { useCardStore, MAX_CHALK_ENERGY } from '../../store/useCardStore';
import { useGameStore } from '../../store/useGameStore';
import { Sparkles, X, ChevronUp, ChevronDown, Zap, Shield, Compass, Sliders } from 'lucide-react';
import { CardRarity, CardCategory } from '../../types/card.types';

export const CardDeckOverlay: React.FC = () => {
  const chalkEnergy = useCardStore((s) => s.chalkEnergy);
  const handCards = useCardStore((s) => s.handCards);
  const activeCardId = useCardStore((s) => s.activeCardId);
  const isDeckExpanded = useCardStore((s) => s.isDeckExpanded);
  const selectCard = useCardStore((s) => s.selectCard);
  const deselectCard = useCardStore((s) => s.deselectCard);
  const toggleDeckExpanded = useCardStore((s) => s.toggleDeckExpanded);

  const aimingState = useGameStore((s) => s.aimingState);
  const isInteracting = aimingState === 'AIMING' || aimingState === 'AIRBORNE' || aimingState === 'SIMULATING';

  const getRarityBadge = (rarity: CardRarity) => {
    switch (rarity) {
      case 'EPIC':
        return 'border-amber-500/70 bg-amber-950/80 text-amber-300 ring-1 ring-amber-500/40';
      case 'RARE':
        return 'border-purple-500/70 bg-purple-950/80 text-purple-300 ring-1 ring-purple-500/40';
      case 'UNCOMMON':
        return 'border-emerald-500/70 bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/40';
      default:
        return 'border-sky-500/70 bg-sky-950/80 text-sky-300 ring-1 ring-sky-500/40';
    }
  };

  const getCategoryIcon = (category: CardCategory) => {
    switch (category) {
      case 'AIM':
        return <Compass className="w-3 h-3 text-sky-400" />;
      case 'LAUNCH':
        return <Zap className="w-3 h-3 text-amber-400" />;
      case 'LOADOUT':
        return <Sliders className="w-3 h-3 text-purple-400" />;
      default:
        return <Shield className="w-3 h-3 text-emerald-400" />;
    }
  };

  return (
    <div
      data-testid="card-deck-overlay"
      className={`fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto transition-all duration-300 flex flex-col items-center max-w-2xl w-[94%] ${
        isInteracting ? 'opacity-40 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Deck Bar: Chalk Energy & Collapse Toggle */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 rounded-2xl px-4 py-2 shadow-2xl mb-2 w-full">
        {/* Chalk Energy Resource Meter */}
        <div data-testid="chalk-energy-meter" className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-300">
                Kapur Taktis
              </span>
              <span className="text-xs font-extrabold font-mono text-yellow-400">
                {chalkEnergy}/{MAX_CHALK_ENERGY}
              </span>
            </div>
            {/* Visual Chalk Sticks Indicator */}
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: MAX_CHALK_ENERGY }).map((_, i) => (
                <div
                  key={`chalk-stick-${i}`}
                  className={`w-3.5 h-1.5 rounded-sm transition-all duration-200 ${
                    i < chalkEnergy
                      ? 'bg-yellow-300 shadow-sm shadow-yellow-300/50'
                      : 'bg-neutral-800 border border-neutral-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Active Card Notification or Deck Status */}
        {activeCardId && (
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 rounded-xl px-2.5 py-1 text-amber-300 text-xs font-semibold animate-pulse">
            <span>✨ Kartu Aktif Siap Tembak</span>
            <button
              onClick={deselectCard}
              className="p-0.5 rounded hover:bg-amber-500/30 text-amber-200 transition-colors cursor-pointer"
              title="Batalkan Kartu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toggle Expand / Collapse Button */}
        <button
          data-testid="toggle-deck-btn"
          onClick={toggleDeckExpanded}
          className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-neutral-200 bg-neutral-800/80 hover:bg-neutral-800 px-2.5 py-1 rounded-xl border border-neutral-700/60 transition-all cursor-pointer"
        >
          <span>{isDeckExpanded ? 'Tutup Deck' : 'Buka Deck'}</span>
          {isDeckExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Hand of 3 Cards */}
      {isDeckExpanded && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                className={`relative rounded-2xl p-2.5 sm:p-3 text-left transition-all duration-200 flex flex-col justify-between border select-none cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900/95 border-amber-400 ring-2 ring-amber-400/60 shadow-xl shadow-amber-500/20 -translate-y-1'
                    : canAfford
                      ? 'bg-neutral-900/85 hover:bg-neutral-850 border-neutral-700/80 hover:border-neutral-500 hover:-translate-y-0.5 shadow-lg'
                      : 'bg-neutral-950/60 border-neutral-800/60 opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Header: Cost & Rarity */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1 bg-neutral-800/90 border border-neutral-700 rounded-lg px-1.5 py-0.5">
                    <span className="text-[10px] font-extrabold font-mono text-yellow-400">
                      {card.cost}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-neutral-400">Kapur</span>
                  </div>

                  <span
                    className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md ${getRarityBadge(
                      card.rarity
                    )}`}
                  >
                    {card.rarity}
                  </span>
                </div>

                {/* Card Title & Category */}
                <div className="mb-1">
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(card.category)}
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
                      {card.name}
                    </h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-400 leading-snug line-clamp-2 mt-0.5">
                    {card.description}
                  </p>
                </div>

                {/* Active Status Badge */}
                <div className="mt-1 flex items-center justify-between pt-1 border-t border-neutral-800/60">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold font-mono">
                    {card.category}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-extrabold text-amber-400 font-mono tracking-wider animate-pulse">
                      ● AKTIF
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
