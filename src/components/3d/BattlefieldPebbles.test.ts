import { describe, it, expect, beforeEach } from 'bun:test';
import { sweepPebblesInCorridor } from './BattlefieldPebbles';

describe('sweepPebblesInCorridor', () => {
  it('handles empty registry gracefully without errors and returns 0', () => {
    const swept = sweepPebblesInCorridor(
      { x: 0, z: 2.3 },
      { x: 0, z: -1 },
      0.85,
      3.6
    );
    expect(swept).toBe(0);
  });

  it('handles degenerate zero-length direction vector safely', () => {
    const swept = sweepPebblesInCorridor(
      { x: 0, z: 2.3 },
      { x: 0, z: 0 },
      0.85,
      3.6
    );
    expect(swept).toBe(0);
  });
});
