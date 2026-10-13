import { MarbleEntity } from './physics.types';

export type LevelDifficulty = 'MUDAH' | 'SEDANG' | 'SULIT';

export type ObstacleType = 'BAMBOO_CHUTE' | 'BRICK_WALL' | 'RISING_GATE' | 'TRIGGER_SWITCH';

export interface LevelObstacleConfig {
  id: string;
  type: ObstacleType;
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: [number, number, number];
}

export interface LevelConfig {
  id: string;
  levelNumber: number;
  title: string;
  subtitle: string;
  description: string;
  difficulty: LevelDifficulty;
  par: number;
  initialGacoanPos: [number, number, number];
  targets: MarbleEntity[];
  obstacles: LevelObstacleConfig[];
  initialChalkEnergy: number;
  starThresholds: {
    star3: number; // <= par
    star2: number; // <= par + 2
    star1: number; // any completion
  };
}

export interface LevelRecord {
  completed: boolean;
  stars: number;
  bestFlicks: number;
}
