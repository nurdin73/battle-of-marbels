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
  mass: 0.013,
  restitution: 0.72,
  frictionStatic: 0.30,
  frictionDynamic: 0.22,
  linearDamping: 0.18,
  angularDamping: 0.40,
};

export const ARENA_CONFIG = {
  ringRadius: 1.8,
  groundSizeX: 12.0,
  groundSizeZ: 20.0,
  marbleRadius: 0.082, // Default / Gacoan radius
  gacoanMarbleRadius: 0.082, // Kelereng gacoan andalan pemain (lebih besar & berbobot)
  targetMarbleRadius: 0.065, // Kelereng taruhan lingkaran (proporsional khas pot)
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
  foulResetPosition: [0, 0.082, 2.3] as [number, number, number],
};

export const SCENE_PERIMETER_BOUNDS = {
  maxX: 5.5,
  maxZ: 9.4,
  minY: -0.1,
  outOfBoundsResetDelaySeconds: 2.0,
  maxSimulationWatchdogSeconds: 7.0,
};

// Exclusive Target/Wager Marble Swirl Colors (bebas dari Biru Host #3b82f6 dan Merah Guest #ef4444)
export const TARGET_SWIRL_COLORS = [
  '#10b981', // Zamrud Hijau
  '#f59e0b', // Amber / Madu Emas
  '#8b5cf6', // Pualam Ungu
  '#06b6d4', // Pirus Cyan
  '#ea580c', // Oranye Jeruk
  '#84cc16', // Belimbing Lime
  '#ec4899', // Mutiara Pink
  '#eab308', // Sitrin Kuning
];

export const DEFAULT_SWIRL_COLORS = TARGET_SWIRL_COLORS;

