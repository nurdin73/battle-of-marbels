import { describe, it, expect } from 'bun:test';
import { useGameStore } from './useGameStore';

describe('useGameStore material swapping and revert', () => {
  it('restores gacoanMaterial back to baseGacoanMaterial upon evaluateTurnOutcome', () => {
    const store = useGameStore.getState();

    // Player selects MARBLE_STONE as base material
    store.setGacoanMaterial('MARBLE_STONE');
    expect(useGameStore.getState().gacoanMaterial).toBe('MARBLE_STONE');
    expect(useGameStore.getState().baseGacoanMaterial).toBe('MARBLE_STONE');

    // CARD_SWAP sets temporary material for 1 shot
    store.setTemporaryGacoanMaterial('BEARING_STEEL');
    expect(useGameStore.getState().gacoanMaterial).toBe('BEARING_STEEL');
    expect(useGameStore.getState().baseGacoanMaterial).toBe('MARBLE_STONE');

    // When turn ends, evaluateTurnOutcome reverts back to baseGacoanMaterial
    store.evaluateTurnOutcome([0, 0.082, 1.5]);
    expect(useGameStore.getState().gacoanMaterial).toBe('MARBLE_STONE');

    // Reset back to GLASS_CLASSIC
    store.setGacoanMaterial('GLASS_CLASSIC');
    expect(useGameStore.getState().gacoanMaterial).toBe('GLASS_CLASSIC');
  });
});
