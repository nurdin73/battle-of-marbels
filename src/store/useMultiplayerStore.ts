import { create } from 'zustand';
import {
  MultiplayerRole,
  MultiplayerStatus,
  PeerMessage,
  PlayerProfile,
} from '../types/multiplayer.types';
import { MarbleMaterialType } from '../types/physics.types';
import { peerService } from '../services/multiplayer/peer.service';
import { marbleAudio } from '../utils/soundSynth.utils';
import { useGameStore } from './useGameStore';

function generateRandomPlayerId(): string {
  return `p_${Math.random().toString(36).substring(2, 9)}`;
}

interface MultiplayerStoreState {
  isMultiplayer: boolean;
  role: MultiplayerRole;
  status: MultiplayerStatus;
  errorMessage: string | null;
  roomId: string | null;
  isLobbyModalOpen: boolean;

  localPlayer: PlayerProfile;
  opponentPlayer: PlayerProfile | null;
  currentTurnPlayerId: string | null;

  opponentAim: {
    direction: { x: number; z: number } | null;
    powerPercentage: number;
  } | null;

  p1Score: number;
  p2Score: number;

  isRematchRequestedByMe: boolean;
  isRematchRequestedByOpponent: boolean;

  onOpponentShotCallback: ((data: {
    impulse: { x: number; y: number; z: number };
    powerPercentage: number;
    isLob: boolean;
    shooterPos: [number, number, number];
  }) => void) | null;

  // Actions
  openLobbyModal: () => void;
  closeLobbyModal: () => void;
  setLocalPlayerName: (name: string) => void;
  setLocalGacoanMaterial: (mat: MarbleMaterialType) => void;
  createRoom: () => Promise<string>;
  joinRoom: (roomIdInput: string) => Promise<void>;
  toggleReady: () => void;
  startPvPMatch: (targetCount?: number) => void;
  broadcastAim: (direction: { x: number; z: number } | null, powerPercentage: number) => void;
  broadcastShot: (
    impulse: { x: number; y: number; z: number },
    powerPercentage: number,
    isLob: boolean,
    shooterPos: [number, number, number]
  ) => void;
  broadcastHostSync: (data: Extract<PeerMessage, { type: 'HOST_STATE_SYNC' }>) => void;
  setOnOpponentShotCallback: (
    cb: ((data: {
      impulse: { x: number; y: number; z: number };
      powerPercentage: number;
      isLob: boolean;
      shooterPos: [number, number, number];
    }) => void) | null
  ) => void;
  switchTurn: (nextPlayerId: string) => void;
  requestRematch: () => void;
  acceptRematch: () => void;
  leaveMatch: () => void;
  handleIncomingMessage: (msg: PeerMessage) => void;
  isMyTurn: () => boolean;
}

export const useMultiplayerStore = create<MultiplayerStoreState>((set, get) => {
  const initialLocalId = generateRandomPlayerId();

  // Wire up peer service callbacks once
  peerService.onStatusChange = (status, errorMsg) => {
    set({
      status,
      errorMessage: errorMsg || null,
    });
  };

  peerService.onMessage = (message) => {
    get().handleIncomingMessage(message);
  };

  return {
    isMultiplayer: false,
    role: 'OFFLINE',
    status: 'IDLE',
    errorMessage: null,
    roomId: null,
    isLobbyModalOpen: false,

    localPlayer: {
      id: initialLocalId,
      name: 'Pemain 1',
      gacoanMaterial: 'GLASS_CLASSIC',
      score: 0,
      isReady: false,
    },
    opponentPlayer: null,
    currentTurnPlayerId: null,
    opponentAim: null,

    p1Score: 0,
    p2Score: 0,

    isRematchRequestedByMe: false,
    isRematchRequestedByOpponent: false,

    onOpponentShotCallback: null,

    openLobbyModal: () => set({ isLobbyModalOpen: true, errorMessage: null }),
    closeLobbyModal: () => set({ isLobbyModalOpen: false }),

    setLocalPlayerName: (name) =>
      set((state) => {
        const updated = { ...state.localPlayer, name: name.trim() || 'Pemain' };
        if (state.isMultiplayer && peerService.isConnected()) {
          peerService.send({ type: 'HANDSHAKE', player: updated });
        }
        return { localPlayer: updated };
      }),

    setLocalGacoanMaterial: (gacoanMaterial) =>
      set((state) => {
        const updated = { ...state.localPlayer, gacoanMaterial };
        if (state.isMultiplayer && peerService.isConnected()) {
          peerService.send({ type: 'HANDSHAKE', player: updated });
        }
        return { localPlayer: updated };
      }),

    createRoom: async () => {
      try {
        const roomId = await peerService.initHost();
        set({
          isMultiplayer: true,
          role: 'HOST',
          roomId,
          errorMessage: null,
        });

        // Setup listener for when guest connects
        peerService.onStatusChange = (status, errorMsg) => {
          set({ status, errorMessage: errorMsg || null });
          if (status === 'CONNECTED') {
            // Send our handshake to the newly connected guest
            peerService.send({ type: 'HANDSHAKE', player: get().localPlayer });
          }
        };

        return roomId;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal membuat kamar';
        set({ errorMessage: message });
        throw err;
      }
    },

    joinRoom: async (roomIdInput: string) => {
      const state = get();
      const cleanRoomId = roomIdInput.trim().toUpperCase();
      if (!cleanRoomId) return;

      try {
        await peerService.connectToHost(cleanRoomId);
        set({
          isMultiplayer: true,
          role: 'GUEST',
          roomId: cleanRoomId,
          errorMessage: null,
        });

        // Send our handshake to the host
        peerService.send({ type: 'HANDSHAKE', player: state.localPlayer });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal bergabung ke kamar';
        set({ errorMessage: message });
        throw err;
      }
    },

    toggleReady: () => {
      set((state) => {
        const nextReady = !state.localPlayer.isReady;
        const updatedLocal = { ...state.localPlayer, isReady: nextReady };
        peerService.send({ type: 'READY_STATE', isReady: nextReady });
        return { localPlayer: updatedLocal };
      });
    },

    startPvPMatch: (targetCount = 9) => {
      const { role, localPlayer, opponentPlayer } = get();
      if (role !== 'HOST' || !opponentPlayer) return;

      // Host starts first
      const firstTurnPlayerId = localPlayer.id;

      peerService.send({
        type: 'GAME_START',
        targetCount,
        currentTurnPlayerId: firstTurnPlayerId,
        initialGacoanPos: [0, 0.075, 2.3],
      });

      set({
        status: 'IN_GAME',
        currentTurnPlayerId: firstTurnPlayerId,
        isLobbyModalOpen: false,
        opponentAim: null,
        isRematchRequestedByMe: false,
        isRematchRequestedByOpponent: false,
      });

      marbleAudio.playComboSound();
    },

    broadcastAim: (direction, powerPercentage) => {
      const { isMultiplayer, currentTurnPlayerId, localPlayer } = get();
      if (!isMultiplayer || currentTurnPlayerId !== localPlayer.id) return;

      peerService.send({
        type: 'AIM_UPDATE',
        direction,
        powerPercentage,
      });
    },

    broadcastShot: (impulse, powerPercentage, isLob, shooterPos) => {
      const { isMultiplayer, currentTurnPlayerId, localPlayer } = get();
      if (!isMultiplayer || currentTurnPlayerId !== localPlayer.id) return;

      peerService.send({
        type: 'SHOT_FIRED',
        impulse,
        powerPercentage,
        isLob,
        shooterPos,
      });

      // Clear opponent aim preview
      set({ opponentAim: null });
    },

    broadcastHostSync: (syncData) => {
      peerService.send(syncData);
    },

    setOnOpponentShotCallback: (cb) => {
      set({ onOpponentShotCallback: cb });
    },

    switchTurn: (nextPlayerId) => {
      set({
        currentTurnPlayerId: nextPlayerId,
        opponentAim: null,
      });
    },

    requestRematch: () => {
      peerService.send({ type: 'REMATCH_REQUEST' });
      set({ isRematchRequestedByMe: true });
    },

    acceptRematch: () => {
      peerService.send({ type: 'REMATCH_ACCEPT' });
      const { role, startPvPMatch } = get();
      if (role === 'HOST') {
        startPvPMatch();
      }
    },

    leaveMatch: () => {
      peerService.disconnect();
      set({
        isMultiplayer: false,
        role: 'OFFLINE',
        status: 'IDLE',
        errorMessage: null,
        roomId: null,
        opponentPlayer: null,
        currentTurnPlayerId: null,
        opponentAim: null,
        isLobbyModalOpen: false,
        isRematchRequestedByMe: false,
        isRematchRequestedByOpponent: false,
      });
    },

    isMyTurn: () => {
      const state = get();
      if (!state.isMultiplayer) return true;
      return state.currentTurnPlayerId === state.localPlayer.id;
    },

    handleIncomingMessage: (msg: PeerMessage) => {
      const state = get();

      switch (msg.type) {
        case 'HANDSHAKE': {
          set({
            opponentPlayer: msg.player,
            status: 'CONNECTED',
          });
          // If we are Host, respond with our profile so Guest has it immediately
          if (state.role === 'HOST') {
            peerService.send({ type: 'HANDSHAKE', player: state.localPlayer });
          }
          break;
        }

        case 'READY_STATE': {
          if (state.opponentPlayer) {
            set({
              opponentPlayer: {
                ...state.opponentPlayer,
                isReady: msg.isReady,
              },
            });
          }
          break;
        }

        case 'GAME_START': {
          set({
            status: 'IN_GAME',
            currentTurnPlayerId: msg.currentTurnPlayerId,
            isLobbyModalOpen: false,
            opponentAim: null,
            isRematchRequestedByMe: false,
            isRematchRequestedByOpponent: false,
          });
          // Start matching game session on Guest
          useGameStore.getState().startMatchWithMarbleCount(msg.targetCount);
          useGameStore.getState().setGacoanMaterial(state.localPlayer.gacoanMaterial);
          marbleAudio.playComboSound();
          break;
        }

        case 'AIM_UPDATE': {
          // If opponent is aiming, store their aim state for live preview
          set({
            opponentAim: {
              direction: msg.direction,
              powerPercentage: msg.powerPercentage,
            },
          });
          break;
        }

        case 'SHOT_FIRED': {
          // Opponent fired! Clear aim preview and trigger opponent launch callback
          set({ opponentAim: null });
          if (state.onOpponentShotCallback) {
            state.onOpponentShotCallback(msg);
          }
          break;
        }

        case 'HOST_STATE_SYNC': {
          // Guest receives authoritative state sync from Host
          set((s) => ({
            currentTurnPlayerId: msg.nextTurnPlayerId,
            p1Score: msg.p1Score,
            p2Score: msg.p2Score,
            localPlayer: {
              ...s.localPlayer,
              score: s.role === 'HOST' ? msg.p1Score : msg.p2Score,
            },
            opponentPlayer: s.opponentPlayer
              ? {
                  ...s.opponentPlayer,
                  score: s.role === 'HOST' ? msg.p2Score : msg.p1Score,
                }
              : null,
          }));

          // Reconcile GameStore state on Guest
          useGameStore.setState({
            targetLivePositions: msg.targetLivePositions,
            marblesOutsideRing: msg.marblesOutsideRing,
            gacoanCurrentPos: msg.gacoanPos,
            isGameOver: msg.isGameOver,
            lastTurnOutcome: {
              resultType: 'NORMAL_SHOT',
              targetsPocketed: 0,
              gacoanFouled: false,
              message: msg.outcomeMessage,
            },
          });
          break;
        }

        case 'REMATCH_REQUEST': {
          set({ isRematchRequestedByOpponent: true });
          break;
        }

        case 'REMATCH_ACCEPT': {
          set({
            isRematchRequestedByMe: false,
            isRematchRequestedByOpponent: false,
          });
          break;
        }

        case 'PLAYER_DISCONNECT': {
          set({
            status: 'DISCONNECTED',
            errorMessage: msg.reason,
            opponentPlayer: null,
          });
          break;
        }
      }
    },
  };
});
