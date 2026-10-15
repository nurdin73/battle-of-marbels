import { describe, it, expect, beforeEach } from 'bun:test';
import {
  registerTargetBody,
  unregisterTargetBody,
  clearTargetBodies,
  areAllTargetsAtRest,
  getRegisteredTargetCount,
} from './targetPhysicsRegistry';
import type { RapierRigidBody } from '@react-three/rapier';

function makeMockBody(options: {
  isSleeping?: boolean;
  linvel?: { x: number; y: number; z: number };
  angvel?: { x: number; y: number; z: number };
}): RapierRigidBody {
  return {
    isSleeping: () => options.isSleeping ?? false,
    linvel: () => options.linvel ?? { x: 0, y: 0, z: 0 },
    angvel: () => options.angvel ?? { x: 0, y: 0, z: 0 },
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
});
