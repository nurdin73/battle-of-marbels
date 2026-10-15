import React, { useEffect } from 'react';
import { SceneContainer } from '../3d/SceneContainer';
import { MultiplayerHUD } from '../ui/MultiplayerHUD';
import { PowerMeter } from '../ui/PowerMeter';
import { CardDeckOverlay } from '../ui/CardDeckOverlay';
import { TurnFeedbackBanner } from '../ui/TurnFeedbackBanner';
import { RoomShareCard } from './RoomShareCard';
import { GuestJoinCard } from './GuestJoinCard';
import { RoomReconnectOverlay } from './RoomReconnectOverlay';
import { useMultiplayerStore, getSavedPvPSession } from '../../store/useMultiplayerStore';
import { useGameStore } from '../../store/useGameStore';
import { useRouter } from '../../router';

interface PvPRoomPageProps {
  roomCode: string;
}

export const PvPRoomPage: React.FC<PvPRoomPageProps> = ({ roomCode }) => {
  const { navigate } = useRouter();

  const roomStatus = useMultiplayerStore((s) => s.roomStatus);
  const activeRoomCode = useMultiplayerStore((s) => s.roomCode);
  const role = useMultiplayerStore((s) => s.role);
  const betAmount = useMultiplayerStore((s) => s.betAmount);
  const turnTimeLimitSeconds = useMultiplayerStore((s) => s.turnTimeLimitSeconds);
  const errorMessage = useMultiplayerStore((s) => s.errorMessage);
  const hostRoom = useMultiplayerStore((s) => s.hostRoom);
  const joinRoom = useMultiplayerStore((s) => s.joinRoom);
  const reconnectRoom = useMultiplayerStore((s) => s.reconnectRoom);
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom);
  const setLocalPlayerName = useMultiplayerStore((s) => s.setLocalPlayerName);

  // Ensure currentScreen is active 'PLAYING' when entering PvP room, and reset to MAIN_MENU on unmount
  useEffect(() => {
    useGameStore.setState({ currentScreen: 'PLAYING' });
    return () => {
      useGameStore.setState({ currentScreen: 'MAIN_MENU' });
    };
  }, []);

  // Auto-reconnect or initialize session if refreshed or accessed directly
  useEffect(() => {
    const cleanCode = roomCode.toUpperCase();
    if (activeRoomCode !== cleanCode || roomStatus === 'IDLE') {
      const saved = getSavedPvPSession();
      if (saved && saved.roomCode === cleanCode && saved.role === 'HOST') {
        hostRoom(saved.betAmount, saved.turnTimeLimitSeconds, cleanCode);
      }
    }
  }, [roomCode, activeRoomCode, roomStatus, hostRoom]);

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const handleGuestJoin = async (playerName: string) => {
    setLocalPlayerName(playerName);
    await joinRoom(roomCode);
  };

  const handleReconnect = async () => {
    await reconnectRoom(roomCode);
  };

  return (
    <main
      data-testid="pvp-room-page-root"
      className="relative w-screen h-screen overflow-hidden bg-neutral-950 select-none"
    >
      {/* 3D Physics Canvas Layer */}
      <SceneContainer />

      {/* State 1: Host Waiting with Shareable Link */}
      {roomStatus === 'HOSTING' && (
        <RoomShareCard
          roomCode={roomCode}
          betAmount={betAmount}
          turnTimeLimit={turnTimeLimitSeconds}
          onCancel={handleLeave}
        />
      )}

      {/* State 2: Guest Direct Join via URL */}
      {role !== 'HOST' && roomStatus !== 'CONNECTED' && roomStatus !== 'DISCONNECTED' && roomStatus !== 'ERROR' && (
        <GuestJoinCard
          roomCode={roomCode}
          isConnecting={roomStatus === 'CONNECTING'}
          errorMessage={errorMessage}
          onJoin={handleGuestJoin}
          onCancel={handleLeave}
        />
      )}

      {/* State 3: Disconnected / Reconnecting Overlay */}
      {(roomStatus === 'DISCONNECTED' || roomStatus === 'ERROR') && (
        <RoomReconnectOverlay
          roomCode={roomCode}
          errorMessage={errorMessage}
          onReconnect={handleReconnect}
          onLeave={handleLeave}
        />
      )}

      {/* State 4: Connected In-Game HUD Overlays */}
      {roomStatus === 'CONNECTED' && (
        <>
          <MultiplayerHUD />
          <TurnFeedbackBanner />
          <CardDeckOverlay />
          <PowerMeter />
        </>
      )}
    </main>
  );
};
