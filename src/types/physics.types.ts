export type MarbleMaterialType = 'GLASS_CLASSIC' | 'MARBLE_STONE' | 'BEARING_STEEL';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface MarblePhysicalProps {
  mass: number;
  restitution: number;
  frictionStatic: number;
  frictionDynamic: number;
  linearDamping: number;
  angularDamping: number;
}

export interface MarbleEntity {
  id: string;
  isGacoan: boolean;
  materialType: MarbleMaterialType;
  initialPosition: [number, number, number];
  radius: number;
  swirlColor?: string;
}

export interface RaycastHitResult {
  hit: boolean;
  hitPoint: Vector3D;
  normal: Vector3D;
  targetId?: string;
  distance: number;
}

export interface TrajectoryProjection {
  start: Vector3D;
  end: Vector3D;
  secondaryStart?: Vector3D;
  secondaryEnd?: Vector3D;
  hitTargetId?: string;
  impactPoint?: Vector3D;
}

export type AppScreen = 'MAIN_MENU' | 'PLAYING';

export type AimingState = 'IDLE' | 'AIMING' | 'CHARGING' | 'LAUNCHED' | 'AIRBORNE' | 'SIMULATING' | 'EVALUATING';

export interface ActiveFlightData {
  origin: [number, number, number];
  landingPoint: [number, number, number];
  apexHeight: number;
  direction: { x: number; z: number };
  impulseMagnitude: number;
  hitTargetId?: string;
  isHit: boolean;
  duration: number;
}

export type TurnResultType = 'COMBO_EXTRA_TURN' | 'NORMAL_SHOT' | 'FOUL_OUT_OF_BOUNDS' | 'TIMEOUT';

export interface TurnEvaluationOutcome {
  resultType: TurnResultType;
  targetsPocketed: number;
  gacoanFouled: boolean;
  message: string;
}

