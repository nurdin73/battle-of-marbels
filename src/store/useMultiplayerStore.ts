import { create } from 'zustand';
import {
  PlayerInfo,
  PlayerRole,
  RestStatePayload,
  RoomStatus,
  ShotNetworkPayload,
} from '../types/multiplayer.types';
import { peerService, PeerService } from '../services/peerService';
import { useGameStore } from './useGameStore';
import { marbleAudio } from '../utils/soundSynth.utils';

interface MultiplayerStoreState {
  isMultiplayerActive: boolean;
  roomStatus: RoomStatus;
  roomCode: string;
  errorMessage: string | null;
  role: PlayerRole | null;
  localPlayer: PlayerInfo;
  remotePlayer: PlayerInfo | null;
  currentTurnPlayerId: string | null;
  scores: { host: number; guest: number };
  targetCount: number;
  pingMs: number;
  isLobbyModalOpen: boolean;
  rematchRequestedBy: string | null;

  // Remote listeners
  onRemoteShotReceived: ((payload: ShotNetworkPayload) => void) | null;
  onRemoteRestStateReceived: ((payload: RestStatePayload) => void) | null;

  // Actions
  openLobbyModal: () => void;
  closeLobbyModal: () => void;
  setLocalPlayerName: (name: string) => void;
  hostRoom: (targetCount?: number) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => void;
  broadcastShot: (payload: ShotNetworkPayload) => void;
  broadcastRestState: (payload: RestStatePayload) => void;
  requestRematch: () => void;
  acceptRematch: () => void;
  setRemoteShotListener: (cb: ((payload: ShotNetworkPayload) => void) | null) => void;
  setRemoteRestStateListener: (cb: ((payload: RestStatePayload) => void) | null) => void;
}

const DEFAULT_LOCAL_HOST: PlayerInfo = {
  id: 'player-host-' + Math.random().toString(36).substring(2, 7),
  name: 'Jawara Biru',
  avatar: '👦',
  role: 'HOST',
  gacoanColor: '#2563eb', // Blue
};

const DEFAULT_LOCAL_GUEST: PlayerInfo = {
  id: 'player-guest-' + Math.random().toString(36).substring(2, 7),
  name: 'Jawara Merah',
  avatar: '🧑',
  role: 'GUEST',
  gacoanColor: '#dc2626', // Red
};

export const useMultiplayerStore = create<MultiplayerStoreState>((set, get) => {
  // Subscribe to peerService messages
  peerService.onMessage((msg) => {
    const state = get();

    switch (msg.type) {
      case 'MATCH_INIT': {
        // Guest receives init from Host
        set({
          targetCount: msg.payload.targetCount,
          remotePlayer: msg.payload.hostPlayer,
          currentTurnPlayerId: msg.payload.hostPlayer.id, // Host starts first
          scores: { host: 0, guest: 0 },
        });

        // Initialize game arena with the agreed target count on Guest
        useGameStore.getState().startMatchWithMarbleCount(msg.payload.targetCount);

        // Send back guest info
        peerService.sendMessage({
          type: 'MATCH_START',
          payload: { guestPlayer: state.localPlayer },
        });
        break;
      }

      case 'MATCH_START': {
        // Host receives guest player info
        set({
          remotePlayer: msg.payload.guestPlayer,
          currentTurnPlayerId: state.localPlayer.id,
          scores: { host: 0, guest: 0 },
        });

        // Initialize game arena on Host
        useGameStore.getState().startMatchWithMarbleCount(state.targetCount);
        break;
      }

      case 'SHOT_FIRED': {
        // Opponent fired a shot!
        marbleAudio.playLaunchSound(0.9);
        if (state.onRemoteShotReceived) {
          state.onRemoteShotReceived(msg.payload);
        }
        break;
      }

      case 'REST_STATE_SYNC': {
        // Guest receives authoritative rest state from Host
        set({
          scores: msg.payload.scores,
          currentTurnPlayerId: msg.payload.nextTurnPlayerId,
        });
        if (state.onRemoteRestStateReceived) {
          state.onRemoteRestStateReceived(msg.payload);
        }
        break;
      }

      case 'REMATCH_REQUEST': {
        set({ rematchRequestedBy: msg.senderId });
        break;
      }

      case 'REMATCH_ACCEPT': {
        // Reset match
        const isHost = state.role === 'HOST';
        set({
          rematchRequestedBy: null,
          scores: { host: 0, guest: 0 },
          currentTurnPlayerId: isHost ? state.localPlayer.id : state.remotePlayer?.id || null,
        });
        useGameStore.getState().startMatchWithMarbleCount(state.targetCount);
        break;
      }
    }
  });

  // Track connection status
  peerService.onConnectionChange((connected) => {
    const state = get();
    if (connected) {
      set({ roomStatus: 'CONNECTED', errorMessage: null });
      // If we are Host, send MATCH_INIT
      if (state.role === 'HOST') {
        peerService.sendMessage({
          type: 'MATCH_INIT',
          payload: {
            roomId: state.roomCode,
            randomSeed: Math.floor(Math.random() * 1000000),
            targetCount: state.targetCount,
            hostPlayer: state.localPlayer,
          },
        });
      }
    } else {
      set({
        roomStatus: 'DISCONNECTED',
        errorMessage: 'Koneksi dengan lawan terputus.',
      });
    }
  });

  // Track errors
  peerService.onError((err) => {
    console.error('Peer error:', err);
    set({
      roomStatus: 'ERROR',
      errorMessage: err.message || 'Gagal menyambung ke jaringan PeerJS.',
    });
  });

  return {
    isMultiplayerActive: false,
    roomStatus: 'IDLE',
    roomCode: '',
    errorMessage: null,
    role: null,
    localPlayer: DEFAULT_LOCAL_HOST,
    remotePlayer: null,
    currentTurnPlayerId: null,
    scores: { host: 0, guest: 0 },
    targetCount: 9,
    pingMs: 0,
    isLobbyModalOpen: false,
    rematchRequestedBy: null,
    onRemoteShotReceived: null,
    onRemoteRestStateReceived: null,

    openLobbyModal: () => set({ isLobbyModalOpen: true, errorMessage: null }),
    closeLobbyModal: () => set({ isLobbyModalOpen: false }),

    setLocalPlayerName: (name: string) => {
      const cleanName = name.trim().slice(0, 16) || 'Jawara';
      set((state) => ({
        localPlayer: { ...state.localPlayer, name: cleanName },
      }));
    },

    hostRoom: async (targetCount = 9) => {
      const code = PeerService.generateRoomCode();
      const hostPlayer: PlayerInfo = {
        ...DEFAULT_LOCAL_HOST,
        name: get().localPlayer.name || 'Jawara Biru',
      };

      set({
        isMultiplayerActive: true,
        roomStatus: 'HOSTING',
        roomCode: code,
        role: 'HOST',
        targetCount,
        localPlayer: hostPlayer,
        remotePlayer: null,
        errorMessage: null,
        scores: { host: 0, guest: 0 },
        currentTurnPlayerId: hostPlayer.id,
      });

      try {
        await peerService.createHost(code);
      } catch (err) {
        set({
          roomStatus: 'ERROR',
          errorMessage: 'Gagal membuat ruang tanding: ' + (err instanceof Error ? err.message : String(err)),
        });
      }
    },

    joinRoom: async (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        set({ errorMessage: 'Masukkan kode kamar terlebih dahulu!' });
        return;
      }

      const guestPlayer: PlayerInfo = {
        ...DEFAULT_LOCAL_GUEST,
        name: get().localPlayer.name || 'Jawara Merah',
      };

      set({
        isMultiplayerActive: true,
        roomStatus: 'CONNECTING',
        roomCode: cleanCode,
        role: 'GUEST',
        localPlayer: guestPlayer,
        remotePlayer: null,
        errorMessage: null,
      });

      try {
        await peerService.joinRoom(cleanCode);
      } catch (err) {
        set({
          roomStatus: 'ERROR',
          errorMessage: 'Gagal bergabung ke kamar: ' + (err instanceof Error ? err.message : String(err)),
        });
      }
    },

    leaveRoom: () => {
      peerService.destroy();
      set({
        isMultiplayerActive: false,
        roomStatus: 'IDLE',
        roomCode: '',
        role: null,
        remotePlayer: null,
        errorMessage: null,
        scores: { host: 0, guest: 0 },
        currentTurnPlayerId: null,
      });
      useGameStore.getState().goToMainMenu();
    },

    broadcastShot: (payload: ShotNetworkPayload) => {
      peerService.sendMessage({
        type: 'SHOT_FIRED',
        payload,
      });
    },

    broadcastRestState: (payload: RestStatePayload) => {
      set({
        scores: payload.scores,
        currentTurnPlayerId: payload.nextTurnPlayerId,
      });
      peerService.sendMessage({
        type: 'REST_STATE_SYNC',
        payload,
      });
    },

    requestRematch: () => {
      const localId = get().localPlayer.id;
      peerService.sendMessage({
        type: 'REMATCH_REQUEST',
        senderId: localId,
      });
    },

    acceptRematch: () => {
      peerService.sendMessage({
        type: 'REMATCH_ACCEPT',
      });
      const isHost = get().role === 'HOST';
      set({
        rematchRequestedBy: null,
        scores: { host: 0, guest: 0 },
        currentTurnPlayerId: isHost ? get().localPlayer.id : get().remotePlayer?.id || null,
      });
      useGameStore.getState().startMatchWithMarbleCount(get().targetCount);
    },

    setRemoteShotListener: (cb) => set({ onRemoteShotReceived: cb }),
    setRemoteRestStateListener: (cb) => set({ onRemoteRestStateReceived: cb }),
  };
});
