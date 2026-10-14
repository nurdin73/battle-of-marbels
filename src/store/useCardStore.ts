import { create } from 'zustand';
import { TacticalCard } from '../types/card.types';
import { cardService } from '../services/cardService';

export const MAX_CHALK_ENERGY = 5;
export const INITIAL_CHALK_ENERGY = 3;

interface CardStoreState {
  chalkEnergy: number;
  maxChalkEnergy: number;
  handCards: TacticalCard[];
  activeCardId: string | null;
  isDeckExpanded: boolean;

  // Actions
  selectCard: (id: string) => boolean;
  deselectCard: () => void;
  consumeActiveCard: () => TacticalCard | null;
  regenerateChalk: (amount?: number) => void;
  toggleDeckExpanded: () => void;
  drawNewHand: () => void;
  resetCardStore: () => void;
}

export const useCardStore = create<CardStoreState>((set, get) => ({
  chalkEnergy: INITIAL_CHALK_ENERGY,
  maxChalkEnergy: MAX_CHALK_ENERGY,
  handCards: cardService.drawHand(4),
  activeCardId: null,
  isDeckExpanded: true,

  selectCard: (id: string) => {
    const { chalkEnergy, handCards, activeCardId } = get();

    // Toggle off if already selected
    if (activeCardId === id) {
      set({ activeCardId: null });
      return false;
    }

    const card = handCards.find((c) => c.id === id);
    if (!card) return false;

    if (chalkEnergy < card.cost) {
      return false; // Insufficient chalk energy
    }

    set({ activeCardId: id });
    return true;
  },

  deselectCard: () => set({ activeCardId: null }),

  consumeActiveCard: () => {
    const { activeCardId, handCards, chalkEnergy } = get();
    if (!activeCardId) return null;

    const card = handCards.find((c) => c.id === activeCardId);
    if (!card) return null;

    const nextChalk = Math.max(0, chalkEnergy - card.cost);

    // Replace the consumed card with a fresh card from deck
    const availableCards = cardService.getAllCards();
    const remainingCards = handCards.filter((c) => c.id !== activeCardId);
    const candidateCards = availableCards.filter(
      (c) => !remainingCards.some((rc) => rc.id === c.id)
    );
    const replacementCard =
      candidateCards[Math.floor(Math.random() * candidateCards.length)] ||
      availableCards[0];

    const nextHand = [...remainingCards, replacementCard];

    set({
      chalkEnergy: nextChalk,
      handCards: nextHand,
      activeCardId: null,
    });

    return card;
  },

  regenerateChalk: (amount = 1) => {
    set((state) => ({
      chalkEnergy: Math.min(state.maxChalkEnergy, state.chalkEnergy + amount),
    }));
  },

  toggleDeckExpanded: () => {
    set((state) => ({ isDeckExpanded: !state.isDeckExpanded }));
  },

  drawNewHand: () => {
    set({
      handCards: cardService.drawHand(4),
      activeCardId: null,
    });
  },

  resetCardStore: () => {
    set({
      chalkEnergy: INITIAL_CHALK_ENERGY,
      handCards: cardService.drawHand(4),
      activeCardId: null,
    });
  },
}));
