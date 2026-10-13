import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Lighting } from './Lighting';
import { ArenaGround } from './ArenaGround';
import { ShooterMarble } from './ShooterMarble';
import { TargetMarble } from './TargetMarble';
import { TrajectoryLine } from './TrajectoryLine';
import { CameraController } from './CameraController';
import { useGameStore } from '../../store/useGameStore';

export const SceneContainer: React.FC = () => {
  const targetMarbles = useGameStore((s) => s.targetMarbles);

  return (
    <div className="w-full h-full relative" data-testid="scene-container">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 2.6, 4.2], fov: 48 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#1c1917']} />
        <fog attach="fog" args={['#1c1917', 8, 20]} />

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
            <Lighting />
            <ArenaGround />
            <ShooterMarble />

            {/* Target Marbles Cluster */}
            {targetMarbles.map((marble) => (
              <TargetMarble key={marble.id} marble={marble} />
            ))}

            <TrajectoryLine />
          </Physics>

          <CameraController />
        </Suspense>
      </Canvas>
    </div>
  );
};
