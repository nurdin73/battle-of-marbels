import { create } from 'zustand';
import {
  AimingState,
  MarbleMaterialType,
  MarbleEntity,
  ActiveFlightData,
  TurnEvaluationOutcome,
} from '../types/physics.types';
import { ARENA_CONFIG, DEFAULT_SWIRL_COLORS, GAMEPLAY_CONFIG } from '../constants/physics.constants';
import { marbleAudio } from '../utils/soundSynth.utils';
import { useCardStore } from './useCardStore';

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
  preShotTargetPositions: Record<string, [number, number, number]>;
  marblesOutsideRing: string[];
  targetsPocketedThisTurnIds: string[];
  foulRestoredIds: string[];
  foulRestoreRevision: number;
  score: number;
  flickCount: number;
  turnCount: number;
  comboStreak: number;
  turnTimer: number;
  isTimerActive: boolean;
  isGameOver: boolean;
  starsAwarded: number;
  currentPar: number;
  lastTurnOutcome: TurnEvaluationOutcome | null;
  targetsPocketedThisTurn: number;
  isMuted: boolean;
  showTrajectory: boolean;
  resetRevision: number;
  evaluationEpoch: number;
  flightData: ActiveFlightData | null;

  // Actions
  loadLevelConfig: (level: import('../types/level.types').LevelConfig) => void;
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
  tickTimer: () => void;
  resetTurnTimer: () => void;
  handleTurnTimeout: () => void;
  evaluateTurnOutcome: (gacoanPos: [number, number, number]) => void;
  clearTurnOutcome: () => void;
  toggleMute: () => void;
  toggleTrajectory: () => void;
  resetArena: () => void;
  restartGame: () => void;
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

const INITIAL_GACOAN_POS: [number, number, number] = GAMEPLAY_CONFIG.foulResetPosition;

export const useGameStore = create<GameStoreState>((set, get) => ({
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
  preShotTargetPositions: {},
  marblesOutsideRing: [],
  targetsPocketedThisTurnIds: [],
  foulRestoredIds: [],
  foulRestoreRevision: 0,
  score: 0,
  flickCount: 0,
  turnCount: 1,
  comboStreak: 0,
  turnTimer: GAMEPLAY_CONFIG.turnTimeLimitSeconds,
  isTimerActive: true,
  isGameOver: false,
  starsAwarded: 0,
  currentPar: GAMEPLAY_CONFIG.parFlicks,
  lastTurnOutcome: null,
  targetsPocketedThisTurn: 0,
  isMuted: false,
  showTrajectory: true,
  resetRevision: 0,
  evaluationEpoch: 0,
  flightData: null,

  setAimingState: (aimingState) => {
    // Timer only ticks during IDLE or AIMING
    const isTimerActive = aimingState === 'IDLE' || aimingState === 'AIMING';
    set({ aimingState, isTimerActive });
  },

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
        targetsPocketedThisTurn: state.targetsPocketedThisTurn + 1,
        targetsPocketedThisTurnIds: [...state.targetsPocketedThisTurnIds, id],
      };
    }),

  recordFlick: () =>
    set((state) => {
      // Snapshot active target positions right before release for potential foul rollback
      const preShot: Record<string, [number, number, number]> = {};
      state.targetMarbles.forEach((m) => {
        if (!state.marblesOutsideRing.includes(m.id)) {
          preShot[m.id] = state.targetLivePositions[m.id] || m.initialPosition;
        }
      });

      return {
        flickCount: state.flickCount + 1,
        turnCount: state.turnCount + 1,
        isTimerActive: false,
        targetsPocketedThisTurn: 0,
        targetsPocketedThisTurnIds: [],
        foulRestoredIds: [],
        preShotTargetPositions: preShot,
      };
    }),

  triggerEvaluation: () =>
    set((state) => ({
      evaluationEpoch: state.evaluationEpoch + 1,
    })),

  tickTimer: () => {
    const { turnTimer, isTimerActive, aimingState, handleTurnTimeout } = get();
    if (!isTimerActive || (aimingState !== 'IDLE' && aimingState !== 'AIMING')) return;

    if (turnTimer <= 1) {
      handleTurnTimeout();
      return;
    }

    const nextTime = turnTimer - 1;
    if (nextTime <= 5) {
      marbleAudio.playTickSound(nextTime <= 3);
    }
    set({ turnTimer: nextTime });
  },

  resetTurnTimer: () =>
    set({
      turnTimer: GAMEPLAY_CONFIG.turnTimeLimitSeconds,
      isTimerActive: true,
    }),

  handleTurnTimeout: () => {
    marbleAudio.playFoulSound();
    useCardStore.getState().regenerateChalk(1);
    set((state) => ({
      turnTimer: GAMEPLAY_CONFIG.turnTimeLimitSeconds,
      isTimerActive: true,
      comboStreak: 0,
      turnCount: state.turnCount + 1,
      drag: { vector: { x: 0, z: 0 }, distance: 0, percentage: 0 },
      aimingState: 'IDLE',
      lastTurnOutcome: {
        resultType: 'TIMEOUT',
        targetsPocketed: 0,
        gacoanFouled: false,
        message: 'WAKTU HABIS! Batas 20 detik terlewati.',
      },
    }));
  },

  evaluateTurnOutcome: (gacoanPos) => {
    const state = get();
    const gacoanDist = Math.hypot(gacoanPos[0], gacoanPos[2]);
    const isGacoanFouled = gacoanDist > ARENA_CONFIG.ringRadius + ARENA_CONFIG.marbleRadius;
    const targetsPocketedIds = state.targetsPocketedThisTurnIds;
    const targetsPocketedCount = targetsPocketedIds.length;

    let resultOutcome: TurnEvaluationOutcome;
    let nextComboStreak = 0;
    let nextGacoanPos = gacoanPos;
    let finalScore = state.score;
    let nextMarblesOutside = state.marblesOutsideRing;
    let nextFoulRestoredIds: string[] = [];
    let nextFoulRestoreRevision = state.foulRestoreRevision;

    if (isGacoanFouled) {
      // FOUL: Player marble flew out of the ring
      marbleAudio.playFoulSound();
      nextComboStreak = 0;
      nextGacoanPos = GAMEPLAY_CONFIG.foulResetPosition;

      if (targetsPocketedCount > 0) {
        // Rollback: Cancel score and return all target marbles that were knocked out during this foul turn
        finalScore = Math.max(0, state.score - targetsPocketedCount);
        nextMarblesOutside = state.marblesOutsideRing.filter((id) => !targetsPocketedIds.includes(id));
        nextFoulRestoredIds = [...targetsPocketedIds];
        nextFoulRestoreRevision = state.foulRestoreRevision + 1;

        resultOutcome = {
          resultType: 'FOUL_OUT_OF_BOUNDS',
          targetsPocketed: 0,
          gacoanFouled: true,
          message: `FOUL! Gacoan keluar ring. ${targetsPocketedCount} kelereng target dikembalikan ke posisi semula!`,
        };
      } else {
        resultOutcome = {
          resultType: 'FOUL_OUT_OF_BOUNDS',
          targetsPocketed: 0,
          gacoanFouled: true,
          message: 'FOUL! Gacoan terpental keluar arena! Posisi gacoan di-reset.',
        };
      }
    } else if (targetsPocketedCount > 0) {
      // COMBO: Valid shot, knocked out target marble(s)
      marbleAudio.playComboSound();
      nextComboStreak = state.comboStreak + 1;
      resultOutcome = {
        resultType: 'COMBO_EXTRA_TURN',
        targetsPocketed: targetsPocketedCount,
        gacoanFouled: false,
        message: `KOMBO SENTILAN! +${targetsPocketedCount} Kelereng Keluar! Dapat Giliran Tambahan!`,
      };
    } else {
      // Normal Shot without score
      nextComboStreak = 0;
      resultOutcome = {
        resultType: 'NORMAL_SHOT',
        targetsPocketed: 0,
        gacoanFouled: false,
        message: 'Sentilan Sah. Gacoan bertahan di dalam arena.',
      };
    }

    // Regenerate +1 chalk energy for new turn
    useCardStore.getState().regenerateChalk(1);

    // Check Win Condition: All target marbles pocketed for current level
    const totalTargets = state.targetMarbles.length;
    const isGameOver = finalScore >= totalTargets;
    let starsAwarded = 0;
    if (isGameOver) {
      marbleAudio.playVictorySound();
      const par = state.currentPar || GAMEPLAY_CONFIG.parFlicks;
      if (state.flickCount <= par) {
        starsAwarded = 3;
      } else if (state.flickCount <= par + 2) {
        starsAwarded = 2;
      } else {
        starsAwarded = 1;
      }
    }

    set({
      score: finalScore,
      marblesOutsideRing: nextMarblesOutside,
      foulRestoredIds: nextFoulRestoredIds,
      foulRestoreRevision: nextFoulRestoreRevision,
      lastTurnOutcome: resultOutcome,
      comboStreak: nextComboStreak,
      gacoanCurrentPos: nextGacoanPos,
      turnTimer: GAMEPLAY_CONFIG.turnTimeLimitSeconds,
      isTimerActive: !isGameOver,
      isGameOver,
      starsAwarded,
      targetsPocketedThisTurn: 0,
      targetsPocketedThisTurnIds: [],
    });
  },

  clearTurnOutcome: () => set({ lastTurnOutcome: null }),

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

  loadLevelConfig: (level) => {
    useCardStore.getState().resetCardStore();
    set((state) => ({
      aimingState: 'IDLE',
      currentPar: level.par,
      targetMarbles: level.targets,
      gacoanCurrentPos: level.initialGacoanPos,
      targetLivePositions: {},
      preShotTargetPositions: {},
      drag: { vector: { x: 0, z: 0 }, distance: 0, percentage: 0 },
      marblesOutsideRing: [],
      targetsPocketedThisTurnIds: [],
      foulRestoredIds: [],
      foulRestoreRevision: 0,
      score: 0,
      flickCount: 0,
      turnCount: 1,
      comboStreak: 0,
      turnTimer: GAMEPLAY_CONFIG.turnTimeLimitSeconds,
      isTimerActive: true,
      isGameOver: false,
      starsAwarded: 0,
      lastTurnOutcome: null,
      targetsPocketedThisTurn: 0,
      resetRevision: state.resetRevision + 1,
      evaluationEpoch: 0,
      flightData: null,
    }));
  },

  resetArena: () =>
    set((state) => ({
      aimingState: 'IDLE',
      gacoanCurrentPos: INITIAL_GACOAN_POS,
      targetLivePositions: {},
      preShotTargetPositions: {},
      drag: { vector: { x: 0, z: 0 }, distance: 0, percentage: 0 },
      marblesOutsideRing: [],
      targetsPocketedThisTurnIds: [],
      foulRestoredIds: [],
      foulRestoreRevision: 0,
      score: 0,
      comboStreak: 0,
      turnTimer: GAMEPLAY_CONFIG.turnTimeLimitSeconds,
      isTimerActive: true,
      lastTurnOutcome: null,
      targetsPocketedThisTurn: 0,
      resetRevision: state.resetRevision + 1,
      evaluationEpoch: 0,
      flightData: null,
    })),

  restartGame: () => {
    useCardStore.getState().resetCardStore();
    set((state) => ({
      aimingState: 'IDLE',
      gacoanCurrentPos: INITIAL_GACOAN_POS,
      targetLivePositions: {},
      preShotTargetPositions: {},
      drag: { vector: { x: 0, z: 0 }, distance: 0, percentage: 0 },
      marblesOutsideRing: [],
      targetsPocketedThisTurnIds: [],
      foulRestoredIds: [],
      foulRestoreRevision: 0,
      score: 0,
      flickCount: 0,
      turnCount: 1,
      comboStreak: 0,
      turnTimer: GAMEPLAY_CONFIG.turnTimeLimitSeconds,
      isTimerActive: true,
      isGameOver: false,
      starsAwarded: 0,
      lastTurnOutcome: null,
      targetsPocketedThisTurn: 0,
      resetRevision: state.resetRevision + 1,
      evaluationEpoch: 0,
      flightData: null,
    }));
  },
}));
