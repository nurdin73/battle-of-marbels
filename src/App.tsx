import { SceneContainer } from './components/3d/SceneContainer';
import { HUDOverlay } from './components/ui/HUDOverlay';
import { MainMenu } from './components/ui/MainMenu';
import { MultiplayerLobbyModal } from './components/ui/MultiplayerLobbyModal';
import { PvPRoomPage } from './components/pvp/PvPRoomPage';
import { useGameStore } from './store/useGameStore';
import { useRouter } from './router';

export function App() {
  const { route } = useRouter();
  const currentScreen = useGameStore((s) => s.currentScreen);

  // Dedicated Route: /rooms/:roomCode
  if (route.name === 'ROOM') {
    return <PvPRoomPage roomCode={route.roomCode} />;
  }

  // Standard Solo Route: /
  return (
    <main
      data-testid="marble-app-root"
      className="relative w-screen h-screen overflow-hidden bg-neutral-950"
    >
      {/* 3D Physics Canvas Layer */}
      <SceneContainer />

      {/* 2D Interactive UI Layer: Main Menu vs In-Game HUD */}
      {currentScreen === 'MAIN_MENU' ? <MainMenu /> : <HUDOverlay />}

      {/* Multiplayer Lobby Launcher Modal */}
      <MultiplayerLobbyModal />
    </main>
  );
}

export default App;
