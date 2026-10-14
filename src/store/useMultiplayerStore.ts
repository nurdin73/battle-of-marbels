import { create } from 'zustand';
import {
  MatchPhase,
  PlayerInfo,
  PlayerRole,
  RestStatePayload,
  RoomStatus,
  ShotNetworkPayload,
  TossResultPayload,
} from '../types/multiplayer.types';
import { peerService, PeerService } from '../services/peerService';
import { useGameStore, createTargetMarblesByCount } from './useGameStore';
import { marbleAudio } from '../utils/soundSynth.utils';
import { ARENA_CONFIG } from '../constants/physics.constants';

export const INITIAL_P1_POS: [number, number, number] = [-0.25, ARENA_CONFIG.marbleRadius, 2.3];
export const INITIAL_P2_POS: [number, number, number] = [0.25, ARENA_CONFIG.marbleRadius, 2.3];

interface MultiplayerStoreState {
  isMultiplayerActive: boolean;
  roomStatus: RoomStatus;
  matchPhase: MatchPhase;
  roomCode: string;
  errorMessage: string | null;
  role: PlayerRole | null;
  localPlayer: PlayerInfo;
  remotePlayer: PlayerInfo | null;
  currentTurnPlayerId: string | null;
  scores: { host: number; guest: number };
  targetCount: number;
  turnTimeLimitSeconds: number | null;
  pingMs: number;
  isLobbyModalOpen: boolean;
  rematchRequestedBy: string | null;

  // Independent Gacoan positions
  gacoanP1Pos: [number, number, number];
  gacoanP2Pos: [number, number, number];

  // Toss Phase (Nimbang / Lempar Niat) state
  tossShotDoneP1: boolean;
  tossShotDoneP2: boolean;
  tossResult: TossResultPayload | null;
  tossBannerMessage: string | null;

  // Remote listeners
  onRemoteShotReceived: ((payload: ShotNetworkPayload) => void) | null;
  onRemoteRestStateReceived: ((payload: RestStatePayload) => void) | null;
  onRemoteTossReceived: ((payload: ShotNetworkPayload) => void) | null;

  // Match Over state for PvP
  isMatchOver: boolean;

  // Camera tracking mode in multiplayer PvP ('AUTO' tracks active gacoan, 'SELF' locks to local gacoan, 'OPPONENT' locks to opponent gacoan)
  cameraFocusMode: 'AUTO' | 'SELF' | 'OPPONENT';
  setCameraFocusMode: (mode: 'AUTO' | 'SELF' | 'OPPONENT') => void;

  // Free Roam Camera Focus
  cameraFocusTarget: [number, number, number] | null;
  setCameraFocusTarget: (target: [number, number, number] | null) => void;

  // Actions
  openLobbyModal: () => void;
  closeLobbyModal: () => void;
  setLocalPlayerName: (name: string) => void;
  hostRoom: (targetCount?: number, timeLimit?: number | null) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => void;
  broadcastShot: (payload: ShotNetworkPayload) => void;
  broadcastTossShot: (payload: ShotNetworkPayload) => void;
  broadcastRestState: (payload: RestStatePayload) => void;
  updateGacoanP1Pos: (pos: [number, number, number]) => void;
  updateGacoanP2Pos: (pos: [number, number, number]) => void;
  requestRematch: () => void;
  acceptRematch: () => void;
  setRemoteShotListener: (cb: ((payload: ShotNetworkPayload) => void) | null) => void;
  setRemoteRestStateListener: (cb: ((payload: RestStatePayload) => void) | null) => void;
  setRemoteTossListener: (cb: ((payload: ShotNetworkPayload) => void) | null) => void;
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
          turnTimeLimitSeconds: msg.payload.turnTimeLimitSeconds,
          remotePlayer: msg.payload.hostPlayer,
          matchPhase: 'TOSS_PHASE',
          isMatchOver: false,
          cameraFocusMode: 'AUTO',
          tossShotDoneP1: false,
          tossShotDoneP2: false,
          tossResult: null,
          tossBannerMessage: 'FASE LEMPAR NIAT: Lempar gacoan mendekati lingkaran!',
          gacoanP1Pos: INITIAL_P1_POS,
          gacoanP2Pos: INITIAL_P2_POS,
          scores: { host: 0, guest: 0 },
        });

        // Initialize game arena with the exact target marbles & timer from Host
        useGameStore.getState().startMatchWithMarbleCount(msg.payload.targetCount, msg.payload.turnTimeLimitSeconds);
        useGameStore.setState({
          targetMarbles: msg.payload.initialTargetMarbles,
          gacoanCurrentPos: INITIAL_P2_POS,
        });

        // Send back guest info
        peerService.sendMessage({
          type: 'MATCH_START',
          payload: { guestPlayer: state.localPlayer },
        });
        break;
      }

      case 'MATCH_START': {
        // Host receives guest player info -> both enter TOSS_PHASE!
        set({
          remotePlayer: msg.payload.guestPlayer,
          matchPhase: 'TOSS_PHASE',
          isMatchOver: false,
          cameraFocusMode: 'AUTO',
          tossShotDoneP1: false,
          tossShotDoneP2: false,
          tossResult: null,
          tossBannerMessage: 'FASE LEMPAR NIAT: Lempar gacoan mendekati lingkaran!',
          gacoanP1Pos: INITIAL_P1_POS,
          gacoanP2Pos: INITIAL_P2_POS,
          scores: { host: 0, guest: 0 },
        });

        // Initialize game arena on Host
        useGameStore.getState().startMatchWithMarbleCount(state.targetCount, state.turnTimeLimitSeconds);
        useGameStore.setState({ gacoanCurrentPos: INITIAL_P1_POS });
        break;
      }

      case 'TOSS_SHOT': {
        // Opponent threw their toss shot
        marbleAudio.playLaunchSound(0.7);
        const isHost = state.role === 'HOST';
        const myShotAlreadyDone = isHost ? state.tossShotDoneP1 : state.tossShotDoneP2;

        if (isHost) {
          set({
            tossShotDoneP2: true,
            tossBannerMessage: myShotAlreadyDone
              ? '⏳ Menunggu kedua gacoan berhenti bergulir...'
              : 'Lawan telah melempar! Giliranmu melempar gacoan...',
          });
        } else {
          set({
            tossShotDoneP1: true,
            tossBannerMessage: myShotAlreadyDone
              ? '⏳ Menunggu kedua gacoan berhenti bergulir...'
              : 'Lawan telah melempar! Giliranmu melempar gacoan...',
          });
        }
        if (state.onRemoteTossReceived) {
          state.onRemoteTossReceived(msg.payload);
        }
        break;
      }

      case 'TOSS_RESULT': {
        // Guest receives authoritative toss evaluation from Host
        const winnerName = msg.payload.firstTurnPlayerId === state.localPlayer.id ? 'KAMU' : 'LAWAN';

        // Keep matchPhase in TOSS_PHASE until MATCH_PLAYING_START message arrives
        set({
          matchPhase: 'TOSS_PHASE',
          currentTurnPlayerId: msg.payload.firstTurnPlayerId,
          tossResult: msg.payload,
          tossBannerMessage: `🎉 ${winnerName} LEBIH DEKAT! (${msg.payload.p1Distance.toFixed(2)}m vs ${msg.payload.p2Distance.toFixed(2)}m) — GILIRAN PERTAMA!`,
        });

        useGameStore.getState().setAimingState('IDLE');
        marbleAudio.playComboSound();
        break;
      }

      case 'MATCH_PLAYING_START': {
        // Match officially commences: target marbles appear cleanly now that toss settles
        set({
          matchPhase: 'PLAYING',
          tossBannerMessage: null,
        });
        useGameStore.getState().setAimingState('IDLE');
        break;
      }

      case 'SHOT_FIRED': {
        // Opponent fired an official match shot!
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
          gacoanP1Pos: msg.payload.gacoanP1Position,
          gacoanP2Pos: msg.payload.gacoanP2Position,
          isMatchOver: Boolean(msg.payload.isMatchOver),
        });

        // Reconcile marbles in game store
        useGameStore.setState({
          marblesOutsideRing: msg.payload.marblesOutsideRing,
          targetLivePositions: msg.payload.targetPositions,
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
        // Reset match to Toss Phase again
        set({
          rematchRequestedBy: null,
          matchPhase: 'TOSS_PHASE',
          isMatchOver: false,
          cameraFocusMode: 'AUTO',
          tossShotDoneP1: false,
          tossShotDoneP2: false,
          tossResult: null,
          tossBannerMessage: 'FASE LEMPAR NIAT: Lempar gacoan mendekati lingkaran!',
          scores: { host: 0, guest: 0 },
          gacoanP1Pos: INITIAL_P1_POS,
          gacoanP2Pos: INITIAL_P2_POS,
          currentTurnPlayerId: null,
        });
        useGameStore.getState().startMatchWithMarbleCount(state.targetCount, state.turnTimeLimitSeconds);
        break;
      }
    }
  });

  // Track connection status
  peerService.onConnectionChange((connected) => {
    const state = get();
    if (connected) {
      set({ roomStatus: 'CONNECTED', errorMessage: null });
      // If we are Host, send MATCH_INIT with initialTargetMarbles
      if (state.role === 'HOST') {
        const initialTargets = createTargetMarblesByCount(state.targetCount);
        useGameStore.setState({ targetMarbles: initialTargets });
        peerService.sendMessage({
          type: 'MATCH_INIT',
          payload: {
            roomId: state.roomCode,
            randomSeed: Math.floor(Math.random() * 1000000),
            targetCount: state.targetCount,
            turnTimeLimitSeconds: state.turnTimeLimitSeconds,
            hostPlayer: state.localPlayer,
            initialTargetMarbles: initialTargets,
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
    matchPhase: 'LOBBY',
    roomCode: '',
    errorMessage: null,
    role: null,
    localPlayer: DEFAULT_LOCAL_HOST,
    remotePlayer: null,
    currentTurnPlayerId: null,
    scores: { host: 0, guest: 0 },
    targetCount: 9,
    turnTimeLimitSeconds: 20,
    pingMs: 0,
    isLobbyModalOpen: false,
    rematchRequestedBy: null,
    gacoanP1Pos: INITIAL_P1_POS,
    gacoanP2Pos: INITIAL_P2_POS,
    tossShotDoneP1: false,
    tossShotDoneP2: false,
    tossResult: null,
    tossBannerMessage: null,
    onRemoteShotReceived: null,
    onRemoteRestStateReceived: null,
    onRemoteTossReceived: null,
    isMatchOver: false,
    cameraFocusMode: 'AUTO',
    setCameraFocusMode: (mode) => set({ cameraFocusMode: mode }),
    cameraFocusTarget: null,
    setCameraFocusTarget: (target) => set({ cameraFocusTarget: target }),

    openLobbyModal: () => set({ isLobbyModalOpen: true, errorMessage: null }),
    closeLobbyModal: () => set({ isLobbyModalOpen: false }),

    setLocalPlayerName: (name: string) => {
      const cleanName = name.trim().slice(0, 16) || 'Jawara';
      set((state) => ({
        localPlayer: { ...state.localPlayer, name: cleanName },
      }));
    },

    hostRoom: async (targetCount = 9, timeLimit = 20) => {
      const code = PeerService.generateRoomCode();
      const hostPlayer: PlayerInfo = {
        ...DEFAULT_LOCAL_HOST,
        name: get().localPlayer.name || 'Jawara Biru',
      };

      set({
        isMultiplayerActive: true,
        roomStatus: 'HOSTING',
        matchPhase: 'LOBBY',
        roomCode: code,
        role: 'HOST',
        targetCount,
        turnTimeLimitSeconds: timeLimit,
        localPlayer: hostPlayer,
        remotePlayer: null,
        errorMessage: null,
        scores: { host: 0, guest: 0 },
        gacoanP1Pos: INITIAL_P1_POS,
        gacoanP2Pos: INITIAL_P2_POS,
        currentTurnPlayerId: null,
        isMatchOver: false,
        cameraFocusMode: 'AUTO',
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
        matchPhase: 'LOBBY',
        roomCode: cleanCode,
        role: 'GUEST',
        localPlayer: guestPlayer,
        remotePlayer: null,
        errorMessage: null,
        gacoanP1Pos: INITIAL_P1_POS,
        gacoanP2Pos: INITIAL_P2_POS,
        isMatchOver: false,
        cameraFocusMode: 'AUTO',
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
        matchPhase: 'LOBBY',
        roomCode: '',
        role: null,
        remotePlayer: null,
        errorMessage: null,
        scores: { host: 0, guest: 0 },
        currentTurnPlayerId: null,
        tossResult: null,
        tossBannerMessage: null,
        isMatchOver: false,
        cameraFocusMode: 'AUTO',
      });
      useGameStore.getState().goToMainMenu();
    },

    broadcastTossShot: (payload: ShotNetworkPayload) => {
      const state = get();
      const isHost = state.role === 'HOST';
      const willBothBeDone = isHost ? state.tossShotDoneP2 : state.tossShotDoneP1;

      if (isHost) {
        set({
          tossShotDoneP1: true,
          tossBannerMessage: willBothBeDone
            ? '⏳ Menunggu kedua gacoan berhenti bergulir...'
            : 'Lemparan terkirim! Menunggu lemparan lawan...',
        });
      } else {
        set({
          tossShotDoneP2: true,
          tossBannerMessage: willBothBeDone
            ? '⏳ Menunggu kedua gacoan berhenti bergulir...'
            : 'Lemparan terkirim! Menunggu lemparan lawan...',
        });
      }
      peerService.sendMessage({
        type: 'TOSS_SHOT',
        payload,
      });
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
        gacoanP1Pos: payload.gacoanP1Position,
        gacoanP2Pos: payload.gacoanP2Position,
        isMatchOver: Boolean(payload.isMatchOver),
      });
      peerService.sendMessage({
        type: 'REST_STATE_SYNC',
        payload,
      });
    },

    updateGacoanP1Pos: (pos) => set({ gacoanP1Pos: pos }),
    updateGacoanP2Pos: (pos) => set({ gacoanP2Pos: pos }),

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
      set({
        rematchRequestedBy: null,
        matchPhase: 'TOSS_PHASE',
        isMatchOver: false,
        cameraFocusMode: 'AUTO',
        tossShotDoneP1: false,
        tossShotDoneP2: false,
        tossResult: null,
        tossBannerMessage: 'FASE LEMPAR NIAT: Lempar gacoan mendekati lingkaran!',
        scores: { host: 0, guest: 0 },
        gacoanP1Pos: INITIAL_P1_POS,
        gacoanP2Pos: INITIAL_P2_POS,
        currentTurnPlayerId: null,
      });
      useGameStore.getState().startMatchWithMarbleCount(get().targetCount, get().turnTimeLimitSeconds);
    },

    setRemoteShotListener: (cb) => set({ onRemoteShotReceived: cb }),
    setRemoteRestStateListener: (cb) => set({ onRemoteRestStateReceived: cb }),
    setRemoteTossListener: (cb) => set({ onRemoteTossReceived: cb }),
  };
});
