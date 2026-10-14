import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Lighting } from './Lighting';
import { ArenaGround } from './ArenaGround';
import { ShooterMarble } from './ShooterMarble';
import { TargetMarble } from './TargetMarble';
import { TrajectoryLine } from './TrajectoryLine';
import { CameraController } from './CameraController';
import { PekaranganProps } from './PekaranganProps';
import { PekaranganGrass } from './PekaranganGrass';
import { PekaranganWall } from './PekaranganWall';
import { SkyEnvironment } from './SkyEnvironment';
import { LevelObstacles } from './LevelObstacles';
import { useGameStore } from '../../store/useGameStore';

export const SceneContainer: React.FC = () => {
  const targetMarbles = useGameStore((s) => s.targetMarbles);

  return (
    <div className="w-full h-full relative" data-testid="scene-container">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 2.2, 3.8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#fed7aa']} />
        <fog attach="fog" args={['#fed7aa', 25, 60]} />

        <Suspense fallback={null}>
          <SkyEnvironment />

          <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
            <Lighting />
            <ArenaGround />
            <PekaranganWall />
            <PekaranganProps />
            <PekaranganGrass />
            <LevelObstacles />
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
