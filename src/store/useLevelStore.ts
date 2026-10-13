import { create } from 'zustand';
import { LevelRecord } from '../types/level.types';
import { ADVENTURE_LEVELS } from '../constants/levels.constants';
import { marbleAudio } from '../utils/soundSynth.utils';

interface LevelStoreState {
  currentLevelId: string;
  unlockedLevelIds: string[];
  levelRecords: Record<string, LevelRecord>;
  isGateOpen: boolean;
  isTriggerHit: boolean;
  isLevelSelectOpen: boolean;

  // Actions
  selectLevel: (levelId: string) => void;
  triggerGateOpen: () => void;
  recordLevelCompletion: (levelId: string, flicks: number) => { stars: number; isNextUnlocked: boolean };
  openLevelSelectModal: () => void;
  closeLevelSelectModal: () => void;
  resetProgress: () => void;
}

const STORAGE_KEY_UNLOCKED = 'kelereng_unlocked_levels';
const STORAGE_KEY_RECORDS = 'kelereng_level_records';

function loadInitialUnlocked(): string[] {
  if (typeof window === 'undefined') return ['level-1', 'level-2', 'level-3'];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNLOCKED);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
    }
  } catch {
    // Default fallback
  }
  return ['level-1', 'level-2', 'level-3'];
}

function loadInitialRecords(): Record<string, LevelRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (raw) return JSON.parse(raw) as Record<string, LevelRecord>;
  } catch {
    // Default fallback
  }
  return {};
}

export const useLevelStore = create<LevelStoreState>((set, get) => ({
  currentLevelId: 'level-1',
  unlockedLevelIds: loadInitialUnlocked(),
  levelRecords: loadInitialRecords(),
  isGateOpen: false,
  isTriggerHit: false,
  isLevelSelectOpen: false,

  selectLevel: (levelId: string) => {
    set({
      currentLevelId: levelId,
      isGateOpen: false,
      isTriggerHit: false,
      isLevelSelectOpen: false,
    });
  },

  triggerGateOpen: () => {
    if (get().isGateOpen) return;
    set({ isGateOpen: true, isTriggerHit: true });
    marbleAudio.playComboSound();
  },

  recordLevelCompletion: (levelId: string, flicks: number) => {
    const level = ADVENTURE_LEVELS.find((l) => l.id === levelId) || ADVENTURE_LEVELS[0];
    let stars = 1;
    if (flicks <= level.starThresholds.star3) {
      stars = 3;
    } else if (flicks <= level.starThresholds.star2) {
      stars = 2;
    }

    const prevRecord = get().levelRecords[levelId];
    const bestFlicks = prevRecord ? Math.min(prevRecord.bestFlicks, flicks) : flicks;
    const maxStars = prevRecord ? Math.max(prevRecord.stars, stars) : stars;

    const updatedRecords = {
      ...get().levelRecords,
      [levelId]: {
        completed: true,
        stars: maxStars,
        bestFlicks,
      },
    };

    // Unlock next level
    let isNextUnlocked = false;
    const currentIdx = ADVENTURE_LEVELS.findIndex((l) => l.id === levelId);
    let updatedUnlocked = [...get().unlockedLevelIds];

    if (currentIdx !== -1 && currentIdx < ADVENTURE_LEVELS.length - 1) {
      const nextLevel = ADVENTURE_LEVELS[currentIdx + 1];
      if (!updatedUnlocked.includes(nextLevel.id)) {
        updatedUnlocked.push(nextLevel.id);
        isNextUnlocked = true;
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updatedRecords));
      localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(updatedUnlocked));
    } catch {
      // Ignored
    }

    set({
      levelRecords: updatedRecords,
      unlockedLevelIds: updatedUnlocked,
    });

    return { stars, isNextUnlocked };
  },

  openLevelSelectModal: () => set({ isLevelSelectOpen: true }),
  closeLevelSelectModal: () => set({ isLevelSelectOpen: false }),

  resetProgress: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_RECORDS);
      localStorage.removeItem(STORAGE_KEY_UNLOCKED);
    } catch {
      // Ignored
    }
    set({
      currentLevelId: 'level-1',
      unlockedLevelIds: ['level-1', 'level-2', 'level-3'],
      levelRecords: {},
      isGateOpen: false,
      isTriggerHit: false,
    });
  },
}));
