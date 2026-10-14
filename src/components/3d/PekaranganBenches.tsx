import React from 'react';
import { Gltf, useGLTF } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { marbleAudio } from '../../utils/soundSynth.utils';

const BENCH_MODEL_URL = '/assets/playground/Extras/low-poly-city-bench.glb';
useGLTF.preload(BENCH_MODEL_URL);

interface BenchConfig {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  seatColliderPos: [number, number, number];
  backrestColliderPos: [number, number, number];
}

const BENCH_CONFIGS: BenchConfig[] = [
  // 1. Front Bench (North Yard): Positioned at Z = -6.4, facing South towards the marble ring
  {
    id: 'bench-front',
    position: [0, 0, -6.4],
    rotation: [0, 0, 0],
    seatColliderPos: [0, 0.22, -6.4],
    backrestColliderPos: [0, 0.70, -6.65],
  },
  // 2. Back Bench (South Yard): Positioned at Z = 6.4, facing North towards the player & ring
  {
    id: 'bench-back',
    position: [0, 0, 6.4],
    rotation: [0, Math.PI, 0],
    seatColliderPos: [0, 0.22, 6.4],
    backrestColliderPos: [0, 0.70, 6.65],
  },
];

export const PekaranganBenches: React.FC = () => {
  const handleBenchCollision = () => {
    marbleAudio.playWoodKnockSound(1.15);
  };

  return (
    <group name="pekarangan-benches">
      {/* Physical Collider Layer for Benches */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0.38}
        restitution={0.55}
        onCollisionEnter={handleBenchCollision}
      >
        {BENCH_CONFIGS.map((bench) => (
          <React.Fragment key={`collider-${bench.id}`}>
            {/* Bench Seat Collider */}
            <CuboidCollider
              args={[0.85, 0.22, 0.24]}
              position={bench.seatColliderPos}
            />
            {/* Bench Backrest Collider */}
            <CuboidCollider
              args={[0.85, 0.20, 0.05]}
              position={bench.backrestColliderPos}
            />
          </React.Fragment>
        ))}
      </RigidBody>

      {/* Visual GLTF Bench Models */}
      {BENCH_CONFIGS.map((bench) => (
        <group
          key={bench.id}
          position={bench.position}
          rotation={bench.rotation}
        >
          <Gltf
            src={BENCH_MODEL_URL}
            castShadow
            receiveShadow
          />
        </group>
      ))}
    </group>
  );
};

