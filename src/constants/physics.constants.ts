import { MarbleMaterialType, MarblePhysicalProps } from '../types/physics.types';

export const MARBLE_PHYSICAL_CONFIGS: Record<MarbleMaterialType, MarblePhysicalProps> = {
  GLASS_CLASSIC: {
    mass: 0.020,
    restitution: 0.75,
    frictionStatic: 0.30,
    frictionDynamic: 0.22,
    linearDamping: 0.18,
    angularDamping: 0.40,
  },
  MARBLE_STONE: {
    mass: 0.038,
    restitution: 0.60,
    frictionStatic: 0.38,
    frictionDynamic: 0.28,
    linearDamping: 0.22,
    angularDamping: 0.45,
  },
  BEARING_STEEL: {
    mass: 0.055,
    restitution: 0.50,
    frictionStatic: 0.25,
    frictionDynamic: 0.18,
    linearDamping: 0.14,
    angularDamping: 0.35,
  },
};

export const TARGET_MARBLE_PHYSICS: MarblePhysicalProps = {
  mass: 0.015,
  restitution: 0.72,
  frictionStatic: 0.30,
  frictionDynamic: 0.22,
  linearDamping: 0.18,
  angularDamping: 0.40,
};

export const ARENA_CONFIG = {
  ringRadius: 1.8,
  groundSize: 16.0,
  marbleRadius: 0.075,
  maxDragDistance: 0.75,
  forceExponent: 1.35,
  minImpulse: 0.0035,
  maxImpulse: 0.068,
  defaultTrajectoryLength: 2.5,
  restVelocityThreshold: 0.025,
};

export const GAMEPLAY_CONFIG = {
  turnTimeLimitSeconds: 20,
  parFlicks: 5,
  initialTargetCount: 9,
  foulResetPosition: [0, 0.075, 2.3] as [number, number, number],
};

export const SCENE_PERIMETER_BOUNDS = {
  maxX: 7.5,
  maxZ: 7.5,
  minY: -0.5,
  outOfBoundsResetDelaySeconds: 2.0,
};

export const DEFAULT_SWIRL_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
];
