import { SceneContainer } from './components/3d/SceneContainer';
import { HUDOverlay } from './components/ui/HUDOverlay';

export function App() {
  return (
    <main
      data-testid="marble-app-root"
      className="relative w-screen h-screen overflow-hidden bg-neutral-950"
    >
      {/* 3D Physics Canvas Layer */}
      <SceneContainer />

      {/* 2D Interactive UI & HUD Layer */}
      <HUDOverlay />
    </main>
  );
}

export default App;
