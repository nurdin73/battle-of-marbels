import { Vector3D } from '../types/physics.types';

export interface TargetSphere {
  id: string;
  position: [number, number, number];
  radius: number;
}

export interface ParabolicPoint {
  position: [number, number, number];
  scale: number;
  alpha: number;
}

export interface ParabolicTrajectoryResult {
  points: ParabolicPoint[];
  landingPoint: [number, number, number];
  hitTargetId?: string;
  isHit: boolean;
  apexHeight: number;
  totalDistance: number;
}

/**
 * Calculates a 3D arching ballistic trajectory (Angry Birds style)
 * with a graceful parabolic curve, apex elevation, obstacle detection,
 * and ground landing marker.
 */
export function calculateParabolicTrajectory(
  origin: Vector3D,
  direction: Vector3D,
  powerPercentage: number, // 0..100
  targets: TargetSphere[],
  shooterRadius: number
): ParabolicTrajectoryResult {
  const dirMagnitude = Math.hypot(direction.x, direction.z);
  if (dirMagnitude < 0.0001 || powerPercentage < 3) {
    return {
      points: [],
      landingPoint: [origin.x, origin.y, origin.z],
      isHit: false,
      apexHeight: 0,
      totalDistance: 0,
    };
  }

  const uX = direction.x / dirMagnitude;
  const uZ = direction.z / dirMagnitude;

  // Total flight reach based on power (0.8m minimum up to 8.8m maximum across the arena)
  const powerNorm = Math.min(Math.max(powerPercentage / 100, 0), 1);
  const totalDistance = 0.8 + Math.pow(powerNorm, 1.15) * 8.0;

  // Apex height of the parabolic arch (0.18m to 0.83m above ground)
  const apexHeight = 0.18 + powerNorm * 0.65;

  const segmentCount = 28;
  const points: ParabolicPoint[] = [];

  let hitTargetId: string | undefined;
  let isHit = false;
  const finalDistance = totalDistance;

  // Generate smooth parabolic points across full distance (zero autolock truncation)
  for (let i = 1; i <= segmentCount; i++) {
    const f = i / segmentCount;
    const dist = f * finalDistance;
    const x = origin.x + uX * dist;
    const z = origin.z + uZ * dist;
    const y = origin.y + 4 * apexHeight * (f * (1 - f));

    // Check 3D collision against active targets for visual indicator
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

    // Dynamic scale: start small, peak slightly at apex, taper gracefully towards ground
    const scale = 0.016 + Math.sin(f * Math.PI) * 0.008;
    const alpha = 0.45 + (f * 0.55);

    points.push({
      position: [x, y, z],
      scale,
      alpha,
    });
  }

  const landingPoint: [number, number, number] = [
    origin.x + uX * finalDistance,
    origin.y,
    origin.z + uZ * finalDistance,
  ];

  return {
    points,
    landingPoint,
    hitTargetId,
    isHit,
    apexHeight,
    totalDistance: finalDistance,
  };
}
