import { MarbleMaterialType } from './physics.types';

export type MultiplayerRole = 'HOST' | 'GUEST' | 'OFFLINE';

export type MultiplayerStatus =
  | 'IDLE'
  | 'CREATING_ROOM'
  | 'WAITING_FOR_OPPONENT'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'IN_GAME'
  | 'DISCONNECTED';

export interface PlayerProfile {
  id: string;
  name: string;
  gacoanMaterial: MarbleMaterialType;
  score: number;
  isReady: boolean;
}

export type PeerMessage =
  | {
      type: 'HANDSHAKE';
      player: PlayerProfile;
    }
  | {
      type: 'READY_STATE';
      isReady: boolean;
    }
  | {
      type: 'GAME_START';
      targetCount: number;
      currentTurnPlayerId: string;
      initialGacoanPos: [number, number, number];
    }
  | {
      type: 'AIM_UPDATE';
      direction: { x: number; z: number } | null;
      powerPercentage: number;
    }
  | {
      type: 'SHOT_FIRED';
      impulse: { x: number; y: number; z: number };
      powerPercentage: number;
      isLob: boolean;
      shooterPos: [number, number, number];
    }
  | {
      type: 'HOST_STATE_SYNC';
      targetLivePositions: Record<string, [number, number, number]>;
      marblesOutsideRing: string[];
      gacoanPos: [number, number, number];
      p1Score: number;
      p2Score: number;
      nextTurnPlayerId: string;
      outcomeMessage: string;
      isGameOver: boolean;
      winnerId: string | null;
    }
  | {
      type: 'REMATCH_REQUEST';
    }
  | {
      type: 'REMATCH_ACCEPT';
    }
  | {
      type: 'PLAYER_DISCONNECT';
      reason: string;
    };

