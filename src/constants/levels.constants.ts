import { LevelConfig } from '../types/level.types';
import { ARENA_CONFIG, DEFAULT_SWIRL_COLORS } from './physics.constants';
import { MarbleEntity } from '../types/physics.types';

const r = ARENA_CONFIG.marbleRadius;

/**
 * Level 1: Pekarangan Rumah (Traditional Cross Formation)
 */
function createLevel1Targets(): MarbleEntity[] {
  const spacing = r * 2.3;
  const positions: [number, number, number][] = [
    [0, r, 0],
    [spacing, r, 0],
    [-spacing, r, 0],
    [0, r, spacing],
    [0, r, -spacing],
    [spacing, r, spacing],
    [-spacing, r, spacing],
    [spacing, r, -spacing],
    [-spacing, r, -spacing],
  ];

  return positions.map((pos, idx) => ({
    id: `l1-target-${idx + 1}`,
    isGacoan: false,
    materialType: 'GLASS_CLASSIC',
    initialPosition: pos,
    radius: r,
    swirlColor: DEFAULT_SWIRL_COLORS[idx % DEFAULT_SWIRL_COLORS.length],
  }));
}

/**
 * Level 2: Lorong Bambu (Chute Corridor)
 * 6 targets lined up down a narrow bamboo rail corridor
 */
function createLevel2Targets(): MarbleEntity[] {
  const positions: [number, number, number][] = [
    [0, r, 0.4],
    [-0.35, r, -0.2],
    [0.35, r, -0.2],
    [0, r, -0.8],
    [-0.3, r, -1.3],
    [0.3, r, -1.3],
  ];

  return positions.map((pos, idx) => ({
    id: `l2-target-${idx + 1}`,
    isGacoan: false,
    materialType: 'GLASS_CLASSIC',
    initialPosition: pos,
    radius: r,
    swirlColor: DEFAULT_SWIRL_COLORS[(idx + 2) % DEFAULT_SWIRL_COLORS.length],
  }));
}

/**
 * Level 3: Labirin Bata Merah & Saklar Emas
 * 5 targets, with 3 behind a locked wooden gate
 */
function createLevel3Targets(): MarbleEntity[] {
  const positions: [number, number, number][] = [
    // Open section target
    [0.8, r, 0.6],
    [-0.6, r, 1.1],
    // Behind gate targets
    [0, r, -1.1],
    [-0.5, r, -1.5],
    [0.5, r, -1.5],
  ];

  return positions.map((pos, idx) => ({
    id: `l3-target-${idx + 1}`,
    isGacoan: false,
    materialType: 'GLASS_CLASSIC',
    initialPosition: pos,
    radius: r,
    swirlColor: DEFAULT_SWIRL_COLORS[(idx + 4) % DEFAULT_SWIRL_COLORS.length],
  }));
}

export const ADVENTURE_LEVELS: LevelConfig[] = [
  {
    id: 'level-1',
    levelNumber: 1,
    title: 'Halaman Depan Rumah',
    subtitle: 'Formasi Kelereng Jadul',
    description: 'Yuk pemanasan sentil kelereng klasik di lingkaran tanah liat! Capai bintang 3 biar makin jago.',
    difficulty: 'MUDAH',
    par: 5,
    initialGacoanPos: [0, r, 2.3],
    targets: createLevel1Targets(),
    obstacles: [],
    initialChalkEnergy: 3,
    starThresholds: {
      star3: 5,
      star2: 7,
      star1: 99,
    },
  },
  {
    id: 'level-2',
    levelNumber: 2,
    title: 'Lorong Pagar Bambu',
    subtitle: 'Pantul-Pantul Asik',
    description: 'Manfaatkan pantulan dinding bambu buat tembakan trik seru! Bersihkan 6 kelereng di lorong.',
    difficulty: 'SEDANG',
    par: 4,
    initialGacoanPos: [0, r, 2.2],
    targets: createLevel2Targets(),
    obstacles: [
      // Left Bamboo Chute Guide Rail
      {
        id: 'obs-chute-left',
        type: 'BAMBOO_CHUTE',
        position: [-1.0, 0.25, -0.4],
        size: [0.12, 0.5, 3.4],
      },
      // Right Bamboo Chute Guide Rail
      {
        id: 'obs-chute-right',
        type: 'BAMBOO_CHUTE',
        position: [1.0, 0.25, -0.4],
        size: [0.12, 0.5, 3.4],
      },
    ],
    initialChalkEnergy: 4,
    starThresholds: {
      star3: 4,
      star2: 6,
      star1: 99,
    },
  },
  {
    id: 'level-3',
    levelNumber: 3,
    title: 'Labirin Bata & Kelereng Emas',
    subtitle: 'Rahasia Gerbang Kayu',
    description: 'Tabrak kelereng emas berkilau biar gerbang kayu rahasia terangkat! Ayo taklukkan labirin bata.',
    difficulty: 'SULIT',
    par: 5,
    initialGacoanPos: [0, r, 2.3],
    targets: createLevel3Targets(),
    obstacles: [
      // Left maze brick wall
      {
        id: 'obs-brick-left',
        type: 'BRICK_WALL',
        position: [-1.2, 0.22, 0.2],
        size: [0.24, 0.44, 2.0],
      },
      // Right maze brick wall
      {
        id: 'obs-brick-right',
        type: 'BRICK_WALL',
        position: [1.2, 0.22, 0.2],
        size: [0.24, 0.44, 2.0],
      },
      // Golden trigger switch marble
      {
        id: 'obs-trigger-switch',
        type: 'TRIGGER_SWITCH',
        position: [-0.9, r, 1.2],
      },
      // Rising wooden gate barrier
      {
        id: 'obs-rising-gate',
        type: 'RISING_GATE',
        position: [0, 0.35, -0.5],
        size: [2.2, 0.7, 0.12],
      },
    ],
    initialChalkEnergy: 4,
    starThresholds: {
      star3: 5,
      star2: 7,
      star1: 99,
    },
  },
];
