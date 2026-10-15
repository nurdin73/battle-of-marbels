import { describe, it, expect, beforeEach } from 'bun:test';
import {
  registerTargetBody,
  unregisterTargetBody,
  clearTargetBodies,
  areAllTargetsAtRest,
  getRegisteredTargetCount,
  getAllTargetBodies,
  applyMagneticAttraction,
} from './targetPhysicsRegistry';
import type { RapierRigidBody } from '@react-three/rapier';

function makeMockBody(options: {
  isSleeping?: boolean;
  linvel?: { x: number; y: number; z: number };
  angvel?: { x: number; y: number; z: number };
  translation?: { x: number; y: number; z: number };
  onApplyImpulse?: (impulse: { x: number; y: number; z: number }) => void;
}): RapierRigidBody {
  return {
    isSleeping: () => options.isSleeping ?? false,
    linvel: () => options.linvel ?? { x: 0, y: 0, z: 0 },
    angvel: () => options.angvel ?? { x: 0, y: 0, z: 0 },
    translation: () => options.translation ?? { x: 0, y: 0, z: 0 },
    wakeUp: () => {},
    applyImpulse: (impulse: { x: number; y: number; z: number }) => {
      options.onApplyImpulse?.(impulse);
    },
  } as unknown as RapierRigidBody;
}

describe('targetPhysicsRegistry', () => {
  beforeEach(() => {
    clearTargetBodies();
  });

  it('reports true when no target bodies are registered', () => {
    expect(areAllTargetsAtRest()).toBe(true);
    expect(getRegisteredTargetCount()).toBe(0);
  });

  it('registers and unregisters target bodies correctly', () => {
    const b1 = makeMockBody({ isSleeping: true });
    registerTargetBody('target-1', b1);
    expect(getRegisteredTargetCount()).toBe(1);

    unregisterTargetBody('target-1');
    expect(getRegisteredTargetCount()).toBe(0);
  });

  it('considers sleeping target bodies as at rest', () => {
    const b1 = makeMockBody({ isSleeping: true, linvel: { x: 10, y: 0, z: 0 } });
    registerTargetBody('t1', b1);
    expect(areAllTargetsAtRest()).toBe(true);
  });

  it('returns false if any single registered target marble is moving linearly', () => {
    const b1 = makeMockBody({ isSleeping: false, linvel: { x: 0.001, y: 0, z: 0 }, angvel: { x: 0, y: 0, z: 0 } });
    const b2 = makeMockBody({ isSleeping: false, linvel: { x: 0.08, y: 0, z: 0 }, angvel: { x: 0, y: 0, z: 0 } }); // moving

    registerTargetBody('t1', b1);
    registerTargetBody('t2', b2);

    expect(areAllTargetsAtRest()).toBe(false);
  });

  it('returns false if any registered target marble is rolling/rotating', () => {
    const b1 = makeMockBody({ isSleeping: false, linvel: { x: 0, y: 0, z: 0 }, angvel: { x: 0.8, y: 0, z: 0 } }); // rolling
    registerTargetBody('t1', b1);

    expect(areAllTargetsAtRest()).toBe(false);
  });

  it('returns true when all target bodies have stopped completely', () => {
    const b1 = makeMockBody({ isSleeping: false, linvel: { x: 0.002, y: 0, z: 0 }, angvel: { x: 0.05, y: 0, z: 0 } });
    const b2 = makeMockBody({ isSleeping: true });

    registerTargetBody('t1', b1);
    registerTargetBody('t2', b2);

    expect(areAllTargetsAtRest()).toBe(true);
  });

  it('provides read-only access to all registered bodies via getAllTargetBodies', () => {
    const b1 = makeMockBody({ isSleeping: true });
    registerTargetBody('t1', b1);
    const map = getAllTargetBodies();
    expect(map.size).toBe(1);
    expect(map.get('t1')).toBe(b1);
  });

  it('applies 360-degree circular magnetic impulse within 0.8m radius and outside safe buffer (0.28m)', () => {
    let appliedImpulseNorth: { x: number; y: number; z: number } | null = null;
    let appliedImpulseSouth: { x: number; y: number; z: number } | null = null;

    const northBody = makeMockBody({
      translation: { x: 0, y: 0.08, z: -0.5 }, // North at distance 0.5m (within 0.8m)
      onApplyImpulse: (imp) => {
        appliedImpulseNorth = imp;
      },
    });
    const southBody = makeMockBody({
      translation: { x: 0, y: 0.08, z: 0.5 }, // South at distance 0.5m (within 0.8m)
      onApplyImpulse: (imp) => {
        appliedImpulseSouth = imp;
      },
    });
    const tooCloseBufferBody = makeMockBody({
      translation: { x: 0, y: 0.08, z: -0.15 }, // Inside safe buffer distance (<= 0.28m, should NOT collide)
    });
    const farawayBody = makeMockBody({
      translation: { x: 0, y: 0.08, z: -1.2 }, // Outside 0.8m radius
    });

    registerTargetBody('north', northBody);
    registerTargetBody('south', southBody);
    registerTargetBody('too-close', tooCloseBufferBody);
    registerTargetBody('far', farawayBody);

    // Gacoan origin at [0, 0.08, 0]
    const affected = applyMagneticAttraction(
      { x: 0, y: 0.08, z: 0 },
      0.8,
      0.00065,
      0.28
    );

    // Both north and south 360-degree targets must be pulled
    expect(affected).toContain('north');
    expect(affected).toContain('south');
    expect(affected).not.toContain('too-close');
    expect(affected).not.toContain('far');

    expect(appliedImpulseNorth).not.toBeNull();
    expect(appliedImpulseNorth!.z).toBeGreaterThan(0); // Pulled south towards 0

    expect(appliedImpulseSouth).not.toBeNull();
    expect(appliedImpulseSouth!.z).toBeLessThan(0); // Pulled north towards 0
  });
});
