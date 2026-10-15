import type { RapierRigidBody } from '@react-three/rapier';

/** Linear speed (m/s) below which a target marble is considered stopped. */
export const TARGET_REST_LINEAR_THRESHOLD = 0.01;
/** Angular speed (rad/s) below which a target marble is considered no longer rolling. */
export const TARGET_REST_ANGULAR_THRESHOLD = 0.2;

const targetRigidBodies = new Map<string, RapierRigidBody>();

/**
 * Registers a live target marble's Rapier rigid body into the simulation monitor.
 */
export function registerTargetBody(id: string, body: RapierRigidBody): void {
  targetRigidBodies.set(id, body);
}

/**
 * Unregisters a target marble (e.g. on unmount or after being pocketed/collected).
 */
export function unregisterTargetBody(id: string): void {
  targetRigidBodies.delete(id);
}

/**
 * Clears all registered target bodies (e.g. on arena reset).
 */
export function clearTargetBodies(): void {
  targetRigidBodies.clear();
}

/**
 * Checks whether ALL active target marbles have completely come to rest.
 * A body is at rest if Rapier has put it to sleep, or both its linear and
 * angular speeds are below their respective rest thresholds.
 */
export function areAllTargetsAtRest(
  linearThreshold: number = TARGET_REST_LINEAR_THRESHOLD,
  angularThreshold: number = TARGET_REST_ANGULAR_THRESHOLD
): boolean {
  for (const body of targetRigidBodies.values()) {
    try {
      if (body.isSleeping()) {
        continue;
      }
      const lin = body.linvel();
      const ang = body.angvel();
      const linSpeed = Math.hypot(lin.x, lin.y, lin.z);
      const angSpeed = Math.hypot(ang.x, ang.y, ang.z);

      if (linSpeed >= linearThreshold || angSpeed >= angularThreshold) {
        return false;
      }
    } catch {
      // Body may have been destroyed or unmounted mid-frame; ignore safely
      continue;
    }
  }
  return true;
}

/**
 * Returns the count of registered target bodies currently monitored.
 */
export function getRegisteredTargetCount(): number {
  return targetRigidBodies.size;
}

/**
 * Returns read-only map of currently registered active target bodies.
 */
export function getAllTargetBodies(): ReadonlyMap<string, RapierRigidBody> {
  return targetRigidBodies;
}

/**
 * Applies an attractive magnetic impulse vector toward an origin point for all target marbles within a radius.
 * Returns array of target IDs that were attracted this frame.
 */
export function applyMagneticAttraction(
  origin: { x: number; y: number; z: number },
  radius: number = 1.35,
  maxImpulse: number = 0.0018
): string[] {
  const affectedIds: string[] = [];
  for (const [id, body] of targetRigidBodies.entries()) {
    try {
      const trans = body.translation();
      const dx = origin.x - trans.x;
      const dz = origin.z - trans.z;
      const distSq = dx * dx + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist > 0.05 && dist <= radius) {
        body.wakeUp();
        // Falloff factor: marbles closer to gacoan feel a tighter suction pull
        const falloff = 1 - (dist / radius);
        const forceMagnitude = maxImpulse * falloff;
        const normX = dx / dist;
        const normZ = dz / dist;

        body.applyImpulse(
          {
            x: normX * forceMagnitude,
            y: 0,
            z: normZ * forceMagnitude,
          },
          true
        );
        affectedIds.push(id);
      }
    } catch {
      continue;
    }
  }
  return affectedIds;
}
