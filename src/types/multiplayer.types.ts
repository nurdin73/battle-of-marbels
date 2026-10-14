import { MarbleEntity } from './physics.types';

/**
 * Type definitions for Multiplayer PvP Real-Time (WebRTC PeerJS)
 */

export type RoomStatus =
  | 'IDLE'
  | 'HOSTING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR';

export type PlayerRole = 'HOST' | 'GUEST';

export type MatchPhase = 'LOBBY' | 'TOSS_PHASE' | 'PLAYING' | 'MATCH_OVER';

export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  role: PlayerRole;
  gacoanColor: string; // e.g., '#2563eb' for Host, '#dc2626' for Guest
}

export interface ShotNetworkPayload {
  turnIndex: number;
  playerId: string;
  timestamp: number;
  impulse: { x: number; y: number; z: number };
  originPosition: { x: number; y: number; z: number };
  appliedCardId?: string;
  expectedStateChecksum?: number;
  isTossShot?: boolean;
}

export interface RestStatePayload {
  turnIndex: number;
  gacoanP1Position: [number, number, number];
  gacoanP2Position: [number, number, number];
  targetPositions: Record<string, [number, number, number]>;
  marblesOutsideRing: string[];
  scores: {
    host: number;
    guest: number;
  };
  nextTurnPlayerId: string;
  isMatchOver?: boolean;
}

export interface MatchInitPayload {
  roomId: string;
  randomSeed: number;
  targetCount: number;
  turnTimeLimitSeconds: number | null; // 15, 20, 30, or null (Santai)
  hostPlayer: PlayerInfo;
  initialTargetMarbles: MarbleEntity[];
}

export interface MatchStartPayload {
  guestPlayer: PlayerInfo;
}

export interface TossResultPayload {
  firstTurnPlayerId: string;
  p1Distance: number;
  p2Distance: number;
}

export type NetworkMessage =
  | { type: 'MATCH_INIT'; payload: MatchInitPayload }
  | { type: 'MATCH_START'; payload: MatchStartPayload }
  | { type: 'TOSS_SHOT'; payload: ShotNetworkPayload }
  | { type: 'TOSS_RESULT'; payload: TossResultPayload }
  | { type: 'MATCH_PLAYING_START' }
  | { type: 'SHOT_FIRED'; payload: ShotNetworkPayload }
  | { type: 'REST_STATE_SYNC'; payload: RestStatePayload }
  | { type: 'PING'; timestamp: number }
  | { type: 'PONG'; timestamp: number }
  | { type: 'EMOTE'; emote: string; senderId: string }
  | { type: 'REMATCH_REQUEST'; senderId: string }
  | { type: 'REMATCH_ACCEPT' };
