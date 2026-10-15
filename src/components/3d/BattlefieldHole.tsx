import React, { useRef } from 'react';
import * as THREE from 'three';
import { CylinderCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { marbleAudio } from '../../utils/soundSynth.utils';

interface BattlefieldHoleProps {
  position?: [number, number, number];
  radius?: number;
}

export const BattlefieldHole: React.FC<BattlefieldHoleProps> = ({
  position = [1.35, 0, 0.5],
  radius = 0.22,
}) => {
  const lastSoundPlayedRef = useRef<number>(0);

  const handleIntersectionEnter = (event: { other: { rigidBody?: RapierRigidBody | null } }) => {
    const otherBody = event.other.rigidBody;
    if (!otherBody) return;

    try {
      const lin = otherBody.linvel();
      const currentSpeed = Math.hypot(lin.x, lin.y, lin.z);

      if (currentSpeed > 0.04) {
        // Authentic sand/soil pit resistance: dampens forward velocity by 60%
        otherBody.setLinvel(
          {
            x: lin.x * 0.40,
            y: lin.y * 0.20,
            z: lin.z * 0.40,
          },
          true
        );

        // Sound effect throttling (250ms debounce)
        const now = Date.now();
        if (now - lastSoundPlayedRef.current > 250) {
          lastSoundPlayedRef.current = now;
          marbleAudio.playCollisionSound({
            materialType: 'MARBLE_STONE',
            relativeVelocity: currentSpeed * 0.5,
          });
        }
      }
    } catch {
      // Ignore if body is disposed mid-intersection
    }
  };

  return (
    <group position={position} name="battlefield-hole">
      {/* Rapier Physics Sensor: Detects rolling marbles entering the pit trap */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider
          args={[0.04, radius]}
          position={[0, 0.02, 0]}
          sensor
          onIntersectionEnter={handleIntersectionEnter}
        />
      </RigidBody>

      {/* Visual: Outer raised earthy soil ring berm */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <ringGeometry args={[radius * 0.82, radius * 1.35, 32]} />
        <meshStandardMaterial
          color="#5c3a21"
          roughness={0.96}
          metalness={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Visual: Deep dark recessed pit center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[radius * 0.82, 32]} />
        <meshBasicMaterial color="#170c04" />
      </mesh>

      {/* Traditional rustic bamboo marker peg ("Pancang Eak") */}
      <group position={[radius * 1.15, 0, 0]} rotation={[0.04, 0.2, -0.06]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.014, 0.32, 6]} />
          <meshStandardMaterial color="#854d0e" roughness={0.85} />
        </mesh>
        {/* Red cloth pennant flag ("Bendera Eak") */}
        <mesh position={[0.045, 0.28, 0]}>
          <planeGeometry args={[0.08, 0.05]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};
