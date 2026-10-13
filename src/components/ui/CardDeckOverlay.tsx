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
  const isInteracting = aimingState === 'AIMING' || aimingState === 'CHARGING' || aimingState === 'AIRBORNE' || aimingState === 'SIMULATING';

  const getRarityBadge = (rarity: CardRarity) => {
    switch (rarity) {
      case 'EPIC':
        return 'border-amber-300 bg-amber-100 text-amber-900 font-bold';
      case 'RARE':
        return 'border-purple-200 bg-purple-100 text-purple-900 font-bold';
      case 'UNCOMMON':
        return 'border-emerald-200 bg-emerald-100 text-emerald-900 font-bold';
      default:
        return 'border-stone-200 bg-stone-100 text-stone-700 font-bold';
    }
  };

  const getRarityLabel = (rarity: CardRarity) => {
    switch (rarity) {
      case 'EPIC':
        return 'Legenda';
      case 'RARE':
        return 'Hebat';
      case 'UNCOMMON':
        return 'Apik';
      default:
        return 'Biasa';
    }
  };

  const getCategoryIcon = (category: CardCategory) => {
    switch (category) {
      case 'AIM':
        return <Compass className="w-3.5 h-3.5 text-sky-700" />;
      case 'LAUNCH':
        return <Zap className="w-3.5 h-3.5 text-orange-600" />;
      case 'LOADOUT':
        return <Sliders className="w-3.5 h-3.5 text-purple-700" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-emerald-700" />;
    }
  };

  const getCategoryLabel = (category: CardCategory) => {
    switch (category) {
      case 'AIM':
        return 'Bidikan';
      case 'LAUNCH':
        return 'Daya Sentil';
      case 'LOADOUT':
        return 'Kelereng';
      default:
        return 'Arena';
    }
  };

  return (
    <div
      data-testid="card-deck-overlay"
      className={`fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto transition-all duration-300 flex flex-col items-center max-w-2xl w-[94%] ${
        isInteracting ? 'opacity-40 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Deck Bar: Chalk Energy & Collapse Toggle (Timbul card) */}
      <div className="timbul-card px-4 py-2 mb-2 w-full flex items-center justify-between gap-3">
        {/* Chalk Energy Resource Meter */}
        <div data-testid="chalk-energy-meter" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border-2 border-amber-300 border-b-[3px] border-b-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-800" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-600">
                Kapur Gambar 🖍️
              </span>
              <span className="text-xs font-black font-mono text-[#d54425]">
                {chalkEnergy}/{MAX_CHALK_ENERGY}
              </span>
            </div>
            {/* Visual Chunky Chalk Sticks Indicator */}
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: MAX_CHALK_ENERGY }).map((_, i) => (
                <div
                  key={`chalk-stick-${i}`}
                  className={`w-3.5 h-2 rounded-sm transition-all duration-200 ${
                    i < chalkEnergy
                      ? 'bg-amber-400 border-b-2 border-amber-600 shadow-sm'
                      : 'bg-stone-200 border-b-2 border-stone-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Active Card Notification or Deck Status */}
        {activeCardId && (
          <div className="flex items-center gap-2 bg-[#fff8f5] border-2 border-[#ffcfc4] border-b-[3px] border-b-[#f57b64] rounded-xl px-3 py-1 text-[#d54425] text-xs font-extrabold animate-pulse">
            <span>✨ Jurus Siap Dipakai!</span>
            <button
              onClick={deselectCard}
              className="p-0.5 rounded hover:bg-orange-100 text-[#d54425] transition-colors cursor-pointer"
              title="Batal Memakai Jurus"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toggle Expand / Collapse Button (Timbul cream button) */}
        <button
          data-testid="toggle-deck-btn"
          onClick={toggleDeckExpanded}
          className="timbul-btn-cream px-3 py-1.5 flex items-center gap-1.5 text-xs cursor-pointer"
        >
          <span>{isDeckExpanded ? 'Tutup Kantung' : 'Kantung Trik'}</span>
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
                className={`relative rounded-2xl p-2.5 sm:p-3 text-left transition-all duration-150 flex flex-col justify-between select-none cursor-pointer ${
                  isActive
                    ? 'bg-[#fff8f5] border-2 border-[#ff6242] border-b-[5px] border-b-[#d54425] ring-2 ring-orange-300/40 -translate-y-1'
                    : canAfford
                      ? 'bg-white hover:bg-[#faf7f2] border-2 border-[#eee6dc] border-b-[5px] border-b-[#ded4c5] hover:border-b-[#c9bfae] active:translate-y-[2px] active:border-b-[3px]'
                      : 'bg-stone-100/70 border-2 border-stone-200 border-b-[4px] border-b-stone-300 opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Header: Cost & Rarity */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1 bg-[#fdfbf7] border-2 border-[#eee6dc] border-b-[2px] border-b-[#ded4c5] rounded-lg px-1.5 py-0.5">
                    <span className="text-[10px] font-black font-mono text-[#d54425]">
                      {card.cost}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-stone-500 font-bold">Kapur</span>
                  </div>

                  <span
                    className={`text-[8px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-lg border-2 border-b-[2px] ${getRarityBadge(
                      card.rarity
                    )}`}
                  >
                    {getRarityLabel(card.rarity)}
                  </span>
                </div>

                {/* Card Title & Category */}
                <div className="mb-1">
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(card.category)}
                    <h3 className="text-xs sm:text-sm font-bold text-stone-800 truncate">
                      {card.name}
                    </h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-600 leading-snug line-clamp-2 mt-0.5">
                    {card.description}
                  </p>
                </div>

                {/* Active Status Badge */}
                <div className="mt-1 flex items-center justify-between pt-1 border-t border-stone-200">
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold font-mono">
                    {getCategoryLabel(card.category)}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-extrabold text-amber-700 font-mono tracking-wider animate-pulse">
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
