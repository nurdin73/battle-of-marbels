import { create } from 'zustand';
import {
  AimingState,
  AppScreen,
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
  currentScreen: AppScreen;
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
  turnTimeLimitSeconds: number | null;
  turnTimer: number | null;
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
  lockedDirection: { x: number; z: number } | null;
  customMarbleCount: number;
  oscillatingPower: number;
  launchTriggerCallback: ((powerPercentage: number) => void) | null;

  // Actions
  startGame: () => void;
  goToMainMenu: () => void;
  setTurnTimeLimit: (seconds: number | null) => void;
  startMatchWithMarbleCount: (count: number, timeLimit?: number | null) => void;
  loadLevelConfig: (level: import('../types/level.types').LevelConfig) => void;
  setAimingState: (state: AimingState) => void;
  setLockedDirection: (dir: { x: number; z: number } | null) => void;
  setOscillatingPower: (power: number) => void;
  setLaunchTriggerCallback: (cb: ((powerPercentage: number) => void) | null) => void;
  fireFlick: (powerPercentage: number) => void;
  cancelAiming: () => void;
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
 * Procedural concentric ring cluster layout for any number of target marbles (3 to 25)
 */
export function createTargetMarblesByCount(count: number): MarbleEntity[] {
  const clampedCount = Math.max(3, Math.min(25, count));
  const r = ARENA_CONFIG.marbleRadius;
  const positions: [number, number, number][] = [];

  // Center marble
  positions.push([0, r, 0]);

  let remaining = clampedCount - 1;
  let ringIndex = 1;
  const ringSpacing = r * 2.3;

  while (remaining > 0) {
    const ringRadius = ringIndex * ringSpacing;
    const countInRing = Math.min(remaining, Math.round(6 * ringIndex));
    for (let i = 0; i < countInRing; i++) {
      const angle = (i / countInRing) * Math.PI * 2 + (ringIndex % 2 === 0 ? Math.PI / countInRing : 0);
      positions.push([
        Math.cos(angle) * ringRadius,
        r,
        Math.sin(angle) * ringRadius,
      ]);
    }
    remaining -= countInRing;
    ringIndex++;
  }

  return positions.map((pos, idx) => ({
    id: `target-marble-${idx + 1}`,
    isGacoan: false,
    materialType: 'GLASS_CLASSIC',
    initialPosition: pos,
    radius: r,
    swirlColor: DEFAULT_SWIRL_COLORS[idx % DEFAULT_SWIRL_COLORS.length],
  }));
}

function createDefaultTargetMarbles(): MarbleEntity[] {
  return createTargetMarblesByCount(GAMEPLAY_CONFIG.initialTargetCount);
}

const INITIAL_GACOAN_POS: [number, number, number] = GAMEPLAY_CONFIG.foulResetPosition;

export const useGameStore = create<GameStoreState>((set, get) => ({
  currentScreen: 'MAIN_MENU',
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
  turnTimeLimitSeconds: GAMEPLAY_CONFIG.turnTimeLimitSeconds,
  turnTimer: GAMEPLAY_CONFIG.turnTimeLimitSeconds,
  isTimerActive: false,
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
  lockedDirection: null,
  customMarbleCount: 9,
  oscillatingPower: 0,
  launchTriggerCallback: null,

  startGame: () => {
    const limit = get().turnTimeLimitSeconds;
    set({
      currentScreen: 'PLAYING',
      isTimerActive: limit !== null,
      turnTimer: limit,
      aimingState: 'IDLE',
      isGameOver: false,
      lockedDirection: null,
      oscillatingPower: 0,
    });
  },

  setTurnTimeLimit: (seconds: number | null) =>
    set({
      turnTimeLimitSeconds: seconds,
      turnTimer: seconds,
      isTimerActive: seconds !== null,
    }),

  startMatchWithMarbleCount: (count: number, timeLimit?: number | null) => {
    useCardStore.getState().resetCardStore();
    const targets = createTargetMarblesByCount(count);
    const effectiveLimit = timeLimit !== undefined ? timeLimit : get().turnTimeLimitSeconds;
    set((state) => ({
      customMarbleCount: count,
      targetMarbles: targets,
      currentPar: Math.max(4, Math.ceil(count * 0.65)),
      currentScreen: 'PLAYING',
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
      turnTimeLimitSeconds: effectiveLimit,
      turnTimer: effectiveLimit,
      isTimerActive: effectiveLimit !== null,
      isGameOver: false,
      starsAwarded: 0,
      lastTurnOutcome: null,
      targetsPocketedThisTurn: 0,
      resetRevision: state.resetRevision + 1,
      evaluationEpoch: 0,
      flightData: null,
      lockedDirection: null,
      oscillatingPower: 0,
    }));
  },

  goToMainMenu: () => {
    set({
      currentScreen: 'MAIN_MENU',
      isTimerActive: false,
      aimingState: 'IDLE',
      isGameOver: false,
      lockedDirection: null,
      oscillatingPower: 0,
    });
  },

  setAimingState: (aimingState) => {
    const { currentScreen } = get();
    // Timer only ticks during IDLE, AIMING, or CHARGING when PLAYING
    const isTimerActive = currentScreen === 'PLAYING' && (aimingState === 'IDLE' || aimingState === 'AIMING' || aimingState === 'CHARGING');
    set({ aimingState, isTimerActive });
  },

  setLockedDirection: (lockedDirection) => set({ lockedDirection }),

  setOscillatingPower: (oscillatingPower) => set({ oscillatingPower }),

  setLaunchTriggerCallback: (launchTriggerCallback) => set({ launchTriggerCallback }),

  fireFlick: (powerPercentage) => {
    const { launchTriggerCallback } = get();
    if (launchTriggerCallback) {
      launchTriggerCallback(powerPercentage);
    }
  },

  cancelAiming: () => {
    set({
      aimingState: 'IDLE',
      lockedDirection: null,
      oscillatingPower: 0,
      drag: { vector: { x: 0, z: 0 }, distance: 0, percentage: 0 },
      isTimerActive: true,
    });
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
    if (!isTimerActive || turnTimer === null || (aimingState !== 'IDLE' && aimingState !== 'AIMING' && aimingState !== 'CHARGING')) return;

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

  resetTurnTimer: () => {
    const limit = get().turnTimeLimitSeconds;
    set({
      turnTimer: limit,
      isTimerActive: limit !== null,
    });
  },

  handleTurnTimeout: () => {
    marbleAudio.playFoulSound();
    useCardStore.getState().regenerateChalk(1);
    const limit = get().turnTimeLimitSeconds;
    set((state) => ({
      turnTimer: limit,
      isTimerActive: limit !== null,
      comboStreak: 0,
      turnCount: state.turnCount + 1,
      drag: { vector: { x: 0, z: 0 }, distance: 0, percentage: 0 },
      aimingState: 'IDLE',
      lastTurnOutcome: {
        resultType: 'TIMEOUT',
        targetsPocketed: 0,
        gacoanFouled: false,
        message: 'WAKTU HABIS! Giliran berpindah.',
      },
    }));
  },

  evaluateTurnOutcome: (gacoanPos) => {
    const state = get();
    const targetsPocketedIds = state.targetsPocketedThisTurnIds;
    const targetsPocketedCount = targetsPocketedIds.length;

    let resultOutcome: TurnEvaluationOutcome;
    let nextComboStreak = 0;
    // Game CONTINUES: Player shoots next from wherever the gacoan stopped
    const nextGacoanPos: [number, number, number] = gacoanPos;
    let finalScore = state.score;
    let nextMarblesOutside = state.marblesOutsideRing;

    if (targetsPocketedCount > 0) {
      // COMBO: Valid shot knocked out target marble(s)!
      marbleAudio.playComboSound();
      finalScore = state.score + targetsPocketedCount;
      nextMarblesOutside = Array.from(new Set([...state.marblesOutsideRing, ...targetsPocketedIds]));
      nextComboStreak = state.comboStreak + 1;
      resultOutcome = {
        resultType: 'COMBO_EXTRA_TURN',
        targetsPocketed: targetsPocketedCount,
        gacoanFouled: false,
        message: `KOMBO SENTILAN! +${targetsPocketedCount} Kelereng Keluar! Dapat Giliran Tambahan!`,
      };
    } else {
      // Normal Shot without score - Gacoan stays at resting position
      nextComboStreak = 0;
      resultOutcome = {
        resultType: 'NORMAL_SHOT',
        targetsPocketed: 0,
        gacoanFouled: false,
        message: 'Sentilan Sah. Menembak dari titik berhenti.',
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

    const timerLimit = state.turnTimeLimitSeconds;

    set({
      score: finalScore,
      marblesOutsideRing: nextMarblesOutside,
      foulRestoredIds: [],
      lastTurnOutcome: resultOutcome,
      comboStreak: nextComboStreak,
      gacoanCurrentPos: nextGacoanPos,
      turnTimer: timerLimit,
      isTimerActive: !isGameOver && timerLimit !== null,
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
      lockedDirection: null,
      oscillatingPower: 0,
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
      lockedDirection: null,
      oscillatingPower: 0,
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
      lockedDirection: null,
      oscillatingPower: 0,
    }));
  },
}));
