import { ARENA_CONFIG } from '../../constants/physics.constants';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type Position3 = [number, number, number];

/** Linear speed (m/s) below which a gacoan counts as stopped. */
export const TOSS_REST_LINEAR_THRESHOLD = 0.01;
/** Angular speed (rad/s) below which a gacoan counts as no longer rolling. */
export const TOSS_REST_ANGULAR_THRESHOLD = 0.2;
/** Both gacoans must stay at rest continuously for this long before the winner is decided. */
export const TOSS_REQUIRED_STILL_SECONDS = 1.0;
/** Safety net so the match never hangs on micro-jitter. Does NOT halt the bodies. */
export const TOSS_WATCHDOG_SECONDS = 20;

export function isBodyAtRest(linvel: Vec3, angvel: Vec3, isSleeping: boolean): boolean {
  if (isSleeping) return true;
  const linSpeed = Math.hypot(linvel.x, linvel.y, linvel.z);
  const angSpeed = Math.hypot(angvel.x, angvel.y, angvel.z);
  return linSpeed < TOSS_REST_LINEAR_THRESHOLD && angSpeed < TOSS_REST_ANGULAR_THRESHOLD;
}

/** Absolute distance from a position to the ring line (horizontal plane only). */
export function computeRingDistance(pos: Position3): number {
  return Math.abs(Math.hypot(pos[0], pos[2]) - ARENA_CONFIG.ringRadius);
}

export interface TossResolution {
  winner: 'P1' | 'P2';
  d1: number;
  d2: number;
}

/** Closest gacoan to the ring line wins. Exact ties go to P1 (Host). */
export function resolveTossWinner(p1Pos: Position3, p2Pos: Position3): TossResolution {
  const d1 = computeRingDistance(p1Pos);
  const d2 = computeRingDistance(p2Pos);
  return { winner: d1 <= d2 ? 'P1' : 'P2', d1, d2 };
}
