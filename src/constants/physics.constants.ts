import { MarbleMaterialType, MarblePhysicalProps } from '../types/physics.types';

export const MARBLE_PHYSICAL_CONFIGS: Record<MarbleMaterialType, MarblePhysicalProps> = {
  GLASS_CLASSIC: {
    mass: 0.020,
    restitution: 0.75,
    frictionStatic: 0.30,
    frictionDynamic: 0.22,
    linearDamping: 0.18,
    angularDamping: 0.15,
  },
  MARBLE_STONE: {
    mass: 0.038,
    restitution: 0.60,
    frictionStatic: 0.38,
    frictionDynamic: 0.28,
    linearDamping: 0.22,
    angularDamping: 0.18,
  },
  BEARING_STEEL: {
    mass: 0.055,
    restitution: 0.50,
    frictionStatic: 0.25,
    frictionDynamic: 0.18,
    linearDamping: 0.14,
    angularDamping: 0.12,
  },
};

export const TARGET_MARBLE_PHYSICS: MarblePhysicalProps = {
  mass: 0.015,
  restitution: 0.72,
  frictionStatic: 0.30,
  frictionDynamic: 0.22,
  linearDamping: 0.18,
  angularDamping: 0.15,
};

export const ARENA_CONFIG = {
  ringRadius: 1.8,
  groundSize: 16.0,
  marbleRadius: 0.075,
  maxDragDistance: 1.0,
  forceExponent: 1.2,
  minImpulse: 0.006,
  maxImpulse: 0.14,
  defaultTrajectoryLength: 2.5,
  restVelocityThreshold: 0.025,
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
