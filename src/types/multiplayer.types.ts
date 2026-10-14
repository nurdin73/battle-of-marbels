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

export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  role: PlayerRole;
  gacoanColor: string; // e.g., '#3b82f6' for Host, '#ef4444' for Guest
}

export interface ShotNetworkPayload {
  turnIndex: number;
  playerId: string;
  timestamp: number;
  impulse: { x: number; y: number; z: number };
  originPosition: { x: number; y: number; z: number };
  appliedCardId?: string;
  expectedStateChecksum?: number;
}

export interface RestStatePayload {
  turnIndex: number;
  gacoanPosition: [number, number, number];
  targetPositions: Record<string, [number, number, number]>;
  marblesOutsideRing: string[];
  scores: {
    host: number;
    guest: number;
  };
  nextTurnPlayerId: string;
}

export interface MatchInitPayload {
  roomId: string;
  randomSeed: number;
  targetCount: number;
  hostPlayer: PlayerInfo;
}

export interface MatchStartPayload {
  guestPlayer: PlayerInfo;
}

export type NetworkMessage =
  | { type: 'MATCH_INIT'; payload: MatchInitPayload }
  | { type: 'MATCH_START'; payload: MatchStartPayload }
  | { type: 'SHOT_FIRED'; payload: ShotNetworkPayload }
  | { type: 'REST_STATE_SYNC'; payload: RestStatePayload }
  | { type: 'PING'; timestamp: number }
  | { type: 'PONG'; timestamp: number }
  | { type: 'EMOTE'; emote: string; senderId: string }
  | { type: 'REMATCH_REQUEST'; senderId: string }
  | { type: 'REMATCH_ACCEPT' };
