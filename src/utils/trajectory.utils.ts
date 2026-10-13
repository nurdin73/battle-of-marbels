import { Vector3D } from '../types/physics.types';

export interface TargetSphere {
  id: string;
  position: [number, number, number];
  radius: number;
}

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
  const totalDistance = (0.8 + Math.pow(powerNorm, 1.15) * 8.0) * distMult;

  // LOB MODE (Exclusive to CARD_LOB)
  if (isLob) {
    const apexHeight = (0.18 + powerNorm * 0.65) * apexMult;
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
  let impactPoint: [number, number, number] | undefined;
  let normalVec: { x: number; z: number } | undefined;

  // 2D horizontal raycast circle intersection against target marbles
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

  const primaryDistance = hitTarget ? closestHitDistance : totalDistance;
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

  // If target hit, compute secondary deflection angles (billiard physics preview)
  let targetKickPoints: TrajectoryPoint[] | undefined;
  let shooterDeflectPoints: TrajectoryPoint[] | undefined;

  if (hitTarget && impactPoint && normalVec) {
    // Target kicks forward along contact normal
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
  }

  return {
    isLob: false,
    points,
    landingPoint: [
      origin.x + uX * primaryDistance,
      origin.y,
      origin.z + uZ * primaryDistance,
    ],
    isHit: !!hitTarget,
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
