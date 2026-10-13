import { Vector3D } from '../types/physics.types';

export interface TargetSphere {
  id: string;
  position: [number, number, number];
  radius: number;
}

export interface ObstacleCollider {
  id: string;
  type: 'CIRCLE' | 'BOX';
  center: [number, number]; // [x, z]
  radius?: number;          // for CIRCLE
  halfSize?: [number, number]; // [halfX, halfZ] for BOX
}

export const PEKARANGAN_OBSTACLES: ObstacleCollider[] = [
  // 19 Natural river stones around the chalk ring
  { id: 'stone-0', type: 'CIRCLE', center: [-1.8, -2.6], radius: 0.16 },
  { id: 'stone-1', type: 'CIRCLE', center: [-0.8, -2.8], radius: 0.18 },
  { id: 'stone-2', type: 'CIRCLE', center: [0.9, -2.7], radius: 0.20 },
  { id: 'stone-3', type: 'CIRCLE', center: [2.0, -2.5], radius: 0.22 },
  { id: 'stone-4', type: 'CIRCLE', center: [-2.5, -2.1], radius: 0.16 },
  { id: 'stone-5', type: 'CIRCLE', center: [-3.1, -2.6], radius: 0.18 },
  { id: 'stone-6', type: 'CIRCLE', center: [-2.8, -3.2], radius: 0.20 },
  { id: 'stone-7', type: 'CIRCLE', center: [2.5, -2.0], radius: 0.22 },
  { id: 'stone-8', type: 'CIRCLE', center: [3.2, -2.5], radius: 0.16 },
  { id: 'stone-9', type: 'CIRCLE', center: [2.9, -3.1], radius: 0.18 },
  { id: 'stone-10', type: 'CIRCLE', center: [-2.6, 0.4], radius: 0.20 },
  { id: 'stone-11', type: 'CIRCLE', center: [-2.9, 1.2], radius: 0.22 },
  { id: 'stone-12', type: 'CIRCLE', center: [-2.4, 2.0], radius: 0.16 },
  { id: 'stone-13', type: 'CIRCLE', center: [2.6, 0.3], radius: 0.18 },
  { id: 'stone-14', type: 'CIRCLE', center: [2.9, 1.1], radius: 0.20 },
  { id: 'stone-15', type: 'CIRCLE', center: [2.5, 2.1], radius: 0.22 },
  { id: 'stone-16', type: 'CIRCLE', center: [-1.6, 3.1], radius: 0.16 },
  { id: 'stone-17', type: 'CIRCLE', center: [1.5, 3.2], radius: 0.18 },
  { id: 'stone-18', type: 'CIRCLE', center: [0.2, 3.6], radius: 0.20 },

  // Terracotta pots / ember
  { id: 'pot-0', type: 'CIRCLE', center: [-2.7, -2.4], radius: 0.32 },
  { id: 'pot-1', type: 'CIRCLE', center: [2.7, -2.2], radius: 0.28 },
  { id: 'pot-2', type: 'CIRCLE', center: [-3.3, 0.8], radius: 0.25 },

  // Trees
  { id: 'tree-0', type: 'CIRCLE', center: [-4.2, -4.5], radius: 0.38 },
  { id: 'tree-1', type: 'CIRCLE', center: [4.2, -4.2], radius: 0.28 },

  // Banana Tree Clumps (Pohon Pisang)
  { id: 'banana-0', type: 'CIRCLE', center: [-3.8, -3.8], radius: 0.32 },
  { id: 'banana-1', type: 'CIRCLE', center: [3.9, -1.2], radius: 0.30 },
  { id: 'banana-2', type: 'CIRCLE', center: [3.6, -4.2], radius: 0.30 },

  // Bamboo fences (Cuboid Colliders)
  { id: 'fence-north', type: 'BOX', center: [0, -5.8], halfSize: [5.8, 0.1] },
  { id: 'fence-west', type: 'BOX', center: [-5.8, 0], halfSize: [0.1, 5.8] },
  { id: 'fence-east', type: 'BOX', center: [5.8, 0], halfSize: [0.1, 5.8] },
];

export interface TrajectoryPoint {
  position: [number, number, number];
  scale: number;
  alpha: number;
}

export interface TrajectoryResult {
  isLob: boolean;
  points: TrajectoryPoint[];
  landingPoint: [number, number, number];
  isHit: boolean;
  hitTargetId?: string;
  impactPoint?: [number, number, number];
  targetKickPoints?: TrajectoryPoint[];
  shooterDeflectPoints?: TrajectoryPoint[];
  apexHeight: number;
  totalDistance: number;
}

export interface TrajectoryOptions {
  isLob?: boolean;
  distanceMultiplier?: number;
  apexHeightMultiplier?: number;
  obstacles?: ObstacleCollider[];
}

/**
 * Calculates authentic marble trajectory:
 * 1. Default Mode (isLob = false): Flat ground raycast with target collision,
 *    contact marker, and billiard-style deflection angles.
 * 2. Lob Mode (isLob = true, CARD_LOB): 3D parabolic arch over obstacles.
 */
export function calculateTrajectory(
  origin: Vector3D,
  direction: Vector3D,
  powerPercentage: number, // 0..100
  targets: TargetSphere[],
  shooterRadius: number,
  options?: TrajectoryOptions
): TrajectoryResult {
  const dirMagnitude = Math.hypot(direction.x, direction.z);
  if (dirMagnitude < 0.0001 || powerPercentage < 3) {
    return {
      isLob: false,
      points: [],
      landingPoint: [origin.x, origin.y, origin.z],
      isHit: false,
      apexHeight: 0,
      totalDistance: 0,
    };
  }

  const uX = direction.x / dirMagnitude;
  const uZ = direction.z / dirMagnitude;

  const isLob = options?.isLob ?? false;
  const distMult = options?.distanceMultiplier ?? 1.0;
  const apexMult = options?.apexHeightMultiplier ?? 1.0;

  const powerNorm = Math.min(Math.max(powerPercentage / 100, 0), 1);
  const totalDistance = (0.35 + Math.pow(powerNorm, 1.35) * 3.65) * distMult;

  // LOB MODE (Exclusive to CARD_LOB)
  if (isLob) {
    const apexHeight = (0.12 + powerNorm * 0.45) * apexMult;
    const segmentCount = 28;
    const points: TrajectoryPoint[] = [];

    let hitTargetId: string | undefined;
    let isHit = false;

    for (let i = 1; i <= segmentCount; i++) {
      const f = i / segmentCount;
      const dist = f * totalDistance;
      const x = origin.x + uX * dist;
      const z = origin.z + uZ * dist;
      const y = origin.y + 4 * apexHeight * (f * (1 - f));

      if (!isHit) {
        for (const target of targets) {
          const cX = target.position[0];
          const cY = target.position[1];
          const cZ = target.position[2];

          const dist3D = Math.hypot(x - cX, y - cY, z - cZ);
          const effectiveRadius = target.radius + shooterRadius;

          if (dist3D <= effectiveRadius) {
            hitTargetId = target.id;
            isHit = true;
            break;
          }
        }
      }

      const scale = 0.016 + Math.sin(f * Math.PI) * 0.008;
      const alpha = 0.45 + f * 0.55;

      points.push({
        position: [x, y, z],
        scale,
        alpha,
      });
    }

    return {
      isLob: true,
      points,
      landingPoint: [origin.x + uX * totalDistance, origin.y, origin.z + uZ * totalDistance],
      hitTargetId,
      isHit,
      apexHeight,
      totalDistance,
    };
  }

  // DEFAULT GROUND MODE (Billiard / Raycast on soil surface)
  const groundY = 0.006;
  let closestHitDistance = totalDistance;
  let hitTarget: TargetSphere | null = null;
  let hitObstacle: ObstacleCollider | null = null;
  let impactPoint: [number, number, number] | undefined;
  let normalVec: { x: number; z: number } | undefined;

  // 1. Raycast circle intersection against target marbles
  for (const target of targets) {
    const cX = target.position[0];
    const cZ = target.position[2];
    const effRadius = target.radius + shooterRadius;

    const vX = cX - origin.x;
    const vZ = cZ - origin.z;

    const proj = vX * uX + vZ * uZ;
    if (proj <= 0) continue;

    const perpSq = vX * vX + vZ * vZ - proj * proj;
    if (perpSq > effRadius * effRadius) continue;

    const hitDist = proj - Math.sqrt(Math.max(0, effRadius * effRadius - perpSq));
    if (hitDist > 0 && hitDist < closestHitDistance) {
      closestHitDistance = hitDist;
      hitTarget = target;
      hitObstacle = null;

      const impX = origin.x + uX * hitDist;
      const impZ = origin.z + uZ * hitDist;
      impactPoint = [impX, groundY, impZ];

      const normDist = Math.hypot(cX - impX, cZ - impZ) || 1;
      normalVec = {
        x: (cX - impX) / normDist,
        z: (cZ - impZ) / normDist,
      };
    }
  }

  // 2. Raycast circle and box intersections against static obstacles (rocks, pots, trees, fences)
  const activeObstacles = options?.obstacles ?? PEKARANGAN_OBSTACLES;
  for (const obs of activeObstacles) {
    if (obs.type === 'CIRCLE' && obs.radius) {
      const cX = obs.center[0];
      const cZ = obs.center[1];
      const effRadius = obs.radius + shooterRadius;

      const vX = cX - origin.x;
      const vZ = cZ - origin.z;

      const proj = vX * uX + vZ * uZ;
      if (proj <= 0) continue;

      const perpSq = vX * vX + vZ * vZ - proj * proj;
      if (perpSq > effRadius * effRadius) continue;

      const hitDist = proj - Math.sqrt(Math.max(0, effRadius * effRadius - perpSq));
      if (hitDist > 0 && hitDist < closestHitDistance) {
        closestHitDistance = hitDist;
        hitObstacle = obs;
        hitTarget = null;

        const impX = origin.x + uX * hitDist;
        const impZ = origin.z + uZ * hitDist;
        impactPoint = [impX, groundY, impZ];

        // Normal points from obstacle center outwards to contact point
        const normDist = Math.hypot(impX - cX, impZ - cZ) || 1;
        normalVec = {
          x: (impX - cX) / normDist,
          z: (impZ - cZ) / normDist,
        };
      }
    } else if (obs.type === 'BOX' && obs.halfSize) {
      const cX = obs.center[0];
      const cZ = obs.center[1];
      const hX = obs.halfSize[0] + shooterRadius;
      const hZ = obs.halfSize[1] + shooterRadius;

      const minX = cX - hX;
      const maxX = cX + hX;
      const minZ = cZ - hZ;
      const maxZ = cZ + hZ;

      const invDirX = Math.abs(uX) > 1e-6 ? 1 / uX : 1e6;
      const invDirZ = Math.abs(uZ) > 1e-6 ? 1 / uZ : 1e6;

      let tMinX = (minX - origin.x) * invDirX;
      let tMaxX = (maxX - origin.x) * invDirX;
      if (tMinX > tMaxX) [tMinX, tMaxX] = [tMaxX, tMinX];

      let tMinZ = (minZ - origin.z) * invDirZ;
      let tMaxZ = (maxZ - origin.z) * invDirZ;
      if (tMinZ > tMaxZ) [tMinZ, tMaxZ] = [tMaxZ, tMinZ];

      const tEnter = Math.max(tMinX, tMinZ);
      const tExit = Math.min(tMaxX, tMaxZ);

      if (tEnter <= tExit && tEnter > 0 && tEnter < closestHitDistance) {
        closestHitDistance = tEnter;
        hitObstacle = obs;
        hitTarget = null;

        const impX = origin.x + uX * tEnter;
        const impZ = origin.z + uZ * tEnter;
        impactPoint = [impX, groundY, impZ];

        if (tEnter === tMinX) {
          normalVec = { x: uX > 0 ? -1 : 1, z: 0 };
        } else {
          normalVec = { x: 0, z: uZ > 0 ? -1 : 1 };
        }
      }
    }
  }

  const isCollision = !!(hitTarget || hitObstacle);
  const primaryDistance = isCollision ? closestHitDistance : totalDistance;
  const primaryStep = 0.12; // Segment spacing
  const primarySegments = Math.max(3, Math.floor(primaryDistance / primaryStep));
  const points: TrajectoryPoint[] = [];

  for (let i = 1; i <= primarySegments; i++) {
    const dist = (i / primarySegments) * primaryDistance;
    const x = origin.x + uX * dist;
    const z = origin.z + uZ * dist;

    points.push({
      position: [x, groundY, z],
      scale: 0.018,
      alpha: 0.65 + (i / primarySegments) * 0.35,
    });
  }

  // If collision occurs, compute deflection / bounce lines
  let targetKickPoints: TrajectoryPoint[] | undefined;
  let shooterDeflectPoints: TrajectoryPoint[] | undefined;

  if (hitTarget && impactPoint && normalVec) {
    // Target marble kicks forward along contact normal
    const kickDist = 0.85;
    const kickSegments = 6;
    targetKickPoints = [];
    for (let k = 1; k <= kickSegments; k++) {
      const d = (k / kickSegments) * kickDist;
      targetKickPoints.push({
        position: [
          hitTarget.position[0] + normalVec.x * d,
          groundY,
          hitTarget.position[2] + normalVec.z * d,
        ],
        scale: 0.015,
        alpha: 0.8 - (k / kickSegments) * 0.5,
      });
    }

    // Shooter deflects tangentially
    const dot = uX * normalVec.x + uZ * normalVec.z;
    const defX = uX - dot * normalVec.x;
    const defZ = uZ - dot * normalVec.z;
    const defMag = Math.hypot(defX, defZ);

    if (defMag > 0.01) {
      const defNormX = defX / defMag;
      const defNormZ = defZ / defMag;
      const deflectDist = 0.6;
      const defSegments = 5;
      shooterDeflectPoints = [];

      for (let s = 1; s <= defSegments; s++) {
        const d = (s / defSegments) * deflectDist;
        shooterDeflectPoints.push({
          position: [
            impactPoint[0] + defNormX * d,
            groundY,
            impactPoint[2] + defNormZ * d,
          ],
          scale: 0.014,
          alpha: 0.7 - (s / defSegments) * 0.45,
        });
      }
    }
  } else if (hitObstacle && impactPoint && normalVec) {
    // Physical specular reflection off static obstacle (rock, pot, tree, wall)
    // d_refl = u - 2 * (u . n) * n
    const dot = uX * normalVec.x + uZ * normalVec.z;
    const reflX = uX - 2 * dot * normalVec.x;
    const reflZ = uZ - 2 * dot * normalVec.z;
    const reflMag = Math.hypot(reflX, reflZ);

    if (reflMag > 0.01) {
      const normReflX = reflX / reflMag;
      const normReflZ = reflZ / reflMag;
      const bounceDist = 0.85;
      const bounceSegments = 6;
      shooterDeflectPoints = [];

      for (let s = 1; s <= bounceSegments; s++) {
        const d = (s / bounceSegments) * bounceDist;
        shooterDeflectPoints.push({
          position: [
            impactPoint[0] + normReflX * d,
            groundY,
            impactPoint[2] + normReflZ * d,
          ],
          scale: 0.016,
          alpha: 0.85 - (s / bounceSegments) * 0.45,
        });
      }
    }
  }

  return {
    isLob: false,
    points,
    landingPoint: [
      origin.x + uX * primaryDistance,
      origin.y,
      origin.z + uZ * primaryDistance,
    ],
    isHit: isCollision,
    hitTargetId: hitTarget ? hitTarget.id : undefined,
    impactPoint,
    targetKickPoints,
    shooterDeflectPoints,
    apexHeight: 0,
    totalDistance: primaryDistance,
  };
}

// Backward-compatible alias for existing callers
export const calculateParabolicTrajectory = calculateTrajectory;
