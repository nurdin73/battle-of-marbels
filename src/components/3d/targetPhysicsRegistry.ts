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
 * Applies an attractive magnetic impulse vector toward an origin point for all target marbles
 * in a 360-degree circle radius, maintaining a safe buffer distance to prevent target
 * and gacoan from colliding.
 *
 * @param origin - Current 3D position of the gacoan marble
 * @param radius - Maximum reach distance of the magnetic field (default 0.8m)
 * @param maxImpulse - Gentle suction force magnitude (default 0.00065)
 * @param minDistance - Stop-suction buffer distance so marbles do not collide (default 0.28m)
 * @returns array of target IDs attracted this frame
 */
export function applyMagneticAttraction(
  origin: { x: number; y: number; z: number },
  radius: number = 0.8,
  maxImpulse: number = 0.00065,
  minDistance: number = 0.28
): string[] {
  const affectedIds: string[] = [];

  for (const [id, body] of targetRigidBodies.entries()) {
    try {
      const trans = body.translation();
      // Vector from gacoan to target marble
      const toTargetX = trans.x - origin.x;
      const toTargetZ = trans.z - origin.z;
      const dist = Math.hypot(toTargetX, toTargetZ);

      // Must be within reach radius (0.8m) and outside the safe buffer distance (0.28m, prevents collision)
      if (dist > minDistance && dist <= radius) {
        body.wakeUp();

        // Smooth falloff factor: gently eases as target approaches minDistance
        const range = radius - minDistance;
        const falloff = range > 0.001 ? (dist - minDistance) / range : 1.0;
        const forceMagnitude = maxImpulse * Math.min(1.0, Math.max(0.15, falloff));

        // Pull direction: target is pulled toward gacoan origin (-toTarget)
        const normPullX = -toTargetX / dist;
        const normPullZ = -toTargetZ / dist;

        body.applyImpulse(
          {
            x: normPullX * forceMagnitude,
            y: 0,
            z: normPullZ * forceMagnitude,
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
