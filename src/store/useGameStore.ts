import { create } from 'zustand';
import { AimingState, MarbleMaterialType, MarbleEntity, ActiveFlightData } from '../types/physics.types';
import { ARENA_CONFIG, DEFAULT_SWIRL_COLORS } from '../constants/physics.constants';
import { marbleAudio } from '../utils/soundSynth.utils';

interface DragState {
  vector: { x: number; z: number };
  distance: number;
  percentage: number;
}

interface GameStoreState {
  aimingState: AimingState;
  gacoanMaterial: MarbleMaterialType;
  gacoanCurrentPos: [number, number, number];
  drag: DragState;
  targetMarbles: MarbleEntity[];
  targetLivePositions: Record<string, [number, number, number]>;
  marblesOutsideRing: string[];
  score: number;
  flickCount: number;
  isMuted: boolean;
  showTrajectory: boolean;
  resetRevision: number;
  evaluationEpoch: number;
  flightData: ActiveFlightData | null;

  // Actions
  setAimingState: (state: AimingState) => void;
  setGacoanMaterial: (material: MarbleMaterialType) => void;
  updateGacoanPos: (pos: [number, number, number]) => void;
  updateTargetLivePosition: (id: string, pos: [number, number, number]) => void;
  setDrag: (vector: { x: number; z: number }, distance: number, percentage: number) => void;
  clearDrag: () => void;
  setFlightData: (data: ActiveFlightData | null) => void;
  markMarbleOutsideRing: (id: string) => void;
  recordFlick: () => void;
  triggerEvaluation: () => void;
  toggleMute: () => void;
  toggleTrajectory: () => void;
  resetArena: () => void;
}

/**
 * Creates 9 target marbles arranged in a traditional cross pattern at the center
 */
function createDefaultTargetMarbles(): MarbleEntity[] {
  const r = ARENA_CONFIG.marbleRadius;
  const spacing = r * 2.3;

  const positions: [number, number, number][] = [
    [0, r, 0], // Center
    [spacing, r, 0], // Right
    [-spacing, r, 0], // Left
    [0, r, spacing], // Down
    [0, r, -spacing], // Up
    [spacing, r, spacing], // Bottom-Right
    [-spacing, r, spacing], // Bottom-Left
    [spacing, r, -spacing], // Top-Right
    [-spacing, r, -spacing], // Top-Left
  ];

  return positions.map((pos, idx) => ({
    id: `target-marble-${idx + 1}`,
    isGacoan: false,
    materialType: 'GLASS_CLASSIC',
    initialPosition: pos,
    radius: r,
    swirlColor: DEFAULT_SWIRL_COLORS[idx % DEFAULT_SWIRL_COLORS.length],
  }));
}

const INITIAL_GACOAN_POS: [number, number, number] = [0, ARENA_CONFIG.marbleRadius, 2.3];

export const useGameStore = create<GameStoreState>((set) => ({
  aimingState: 'IDLE',
  gacoanMaterial: 'GLASS_CLASSIC',
  gacoanCurrentPos: INITIAL_GACOAN_POS,
  drag: {
    vector: { x: 0, z: 0 },
    distance: 0,
    percentage: 0,
  },
  targetMarbles: createDefaultTargetMarbles(),
  targetLivePositions: {},
  marblesOutsideRing: [],
  score: 0,
  flickCount: 0,
  isMuted: false,
  showTrajectory: true,
  resetRevision: 0,
  evaluationEpoch: 0,
  flightData: null,

  setAimingState: (aimingState) => set({ aimingState }),

  setGacoanMaterial: (gacoanMaterial) => set({ gacoanMaterial }),

  updateGacoanPos: (gacoanCurrentPos) => set({ gacoanCurrentPos }),

  updateTargetLivePosition: (id, pos) =>
    set((state) => ({
      targetLivePositions: {
        ...state.targetLivePositions,
        [id]: pos,
      },
    })),

  setDrag: (vector, distance, percentage) =>
    set({
      drag: { vector, distance, percentage },
    }),

  clearDrag: () =>
    set({
      drag: { vector: { x: 0, z: 0 }, distance: 0, percentage: 0 },
    }),

  setFlightData: (flightData) => set({ flightData }),

  markMarbleOutsideRing: (id) =>
    set((state) => {
      if (state.marblesOutsideRing.includes(id)) return state;
      return {
        marblesOutsideRing: [...state.marblesOutsideRing, id],
        score: state.score + 1,
      };
    }),

  recordFlick: () =>
    set((state) => ({
      flickCount: state.flickCount + 1,
    })),

  triggerEvaluation: () =>
    set((state) => ({
      evaluationEpoch: state.evaluationEpoch + 1,
    })),

  toggleMute: () =>
    set((state) => {
      const nextMuted = !state.isMuted;
      marbleAudio.setMuted(nextMuted);
      return { isMuted: nextMuted };
    }),

  toggleTrajectory: () =>
    set((state) => ({
      showTrajectory: !state.showTrajectory,
    })),

  resetArena: () =>
    set((state) => ({
      aimingState: 'IDLE',
      gacoanCurrentPos: INITIAL_GACOAN_POS,
      targetLivePositions: {},
      drag: { vector: { x: 0, z: 0 }, distance: 0, percentage: 0 },
      marblesOutsideRing: [],
      score: 0,
      resetRevision: state.resetRevision + 1,
      evaluationEpoch: 0,
      flightData: null,
    })),
}));
