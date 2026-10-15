import { describe, it, expect } from 'bun:test';
import {
  isBodyAtRest,
  computeRingDistance,
  resolveTossWinner,
  TOSS_REST_LINEAR_THRESHOLD,
  TOSS_REST_ANGULAR_THRESHOLD,
} from './multiplayer-toss.utils';
import { ARENA_CONFIG } from '../../constants/physics.constants';

const ZERO = { x: 0, y: 0, z: 0 };

describe('isBodyAtRest', () => {
  it('treats a sleeping body as at rest regardless of reported velocity', () => {
    expect(isBodyAtRest({ x: 1, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }, true)).toBe(true);
  });

  it('is at rest when both linear and angular speed are below threshold', () => {
    expect(isBodyAtRest({ x: 0.005, y: 0, z: 0 }, { x: 0.1, y: 0, z: 0 }, false)).toBe(true);
  });

  it('is NOT at rest when still sliding slowly', () => {
    expect(isBodyAtRest({ x: TOSS_REST_LINEAR_THRESHOLD * 2, y: 0, z: 0 }, ZERO, false)).toBe(false);
  });

  it('is NOT at rest when still rolling in place (angular only)', () => {
    expect(isBodyAtRest(ZERO, { x: TOSS_REST_ANGULAR_THRESHOLD * 2, y: 0, z: 0 }, false)).toBe(false);
  });
});

describe('computeRingDistance', () => {
  it('is zero on the ring line', () => {
    expect(computeRingDistance([ARENA_CONFIG.ringRadius, 0.08, 0])).toBeCloseTo(0, 6);
  });

  it('ignores height (y)', () => {
    expect(computeRingDistance([0, 5, ARENA_CONFIG.ringRadius])).toBeCloseTo(0, 6);
  });

  it('measures absolute distance inside and outside the ring', () => {
    expect(computeRingDistance([0, 0, ARENA_CONFIG.ringRadius - 0.3])).toBeCloseTo(0.3, 6);
    expect(computeRingDistance([0, 0, ARENA_CONFIG.ringRadius + 0.3])).toBeCloseTo(0.3, 6);
  });
});

describe('resolveTossWinner', () => {
  const R = ARENA_CONFIG.ringRadius;

  it('awards P2 when P2 is closer to the ring line', () => {
    const res = resolveTossWinner([0, 0, R + 0.5], [0, 0, R + 0.1]);
    expect(res.winner).toBe('P2');
    expect(res.d1).toBeCloseTo(0.5, 6);
    expect(res.d2).toBeCloseTo(0.1, 6);
  });

  it('awards P1 when P1 is closer', () => {
    expect(resolveTossWinner([0, 0, R - 0.05], [0, 0, R + 0.4]).winner).toBe('P1');
  });

  it('awards exact ties to P1', () => {
    expect(resolveTossWinner([0, 0, R + 0.2], [0, 0, R - 0.2]).winner).toBe('P1');
  });
});
