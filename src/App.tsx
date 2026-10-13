import { SceneContainer } from './components/3d/SceneContainer';
import { HUDOverlay } from './components/ui/HUDOverlay';
import { MainMenu } from './components/ui/MainMenu';
import { useGameStore } from './store/useGameStore';

export function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);

  return (
    <main
      data-testid="marble-app-root"
      className="relative w-screen h-screen overflow-hidden bg-neutral-950"
    >
      {/* 3D Physics Canvas Layer */}
      <SceneContainer />

      {/* 2D Interactive UI Layer: Main Menu vs In-Game HUD */}
      {currentScreen === 'MAIN_MENU' ? <MainMenu /> : <HUDOverlay />}
    </main>
  );
}

export default App;
