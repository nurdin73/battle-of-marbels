import React, { useEffect, useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ARENA_CONFIG } from '../../constants/physics.constants';
import { createChalkRingTexture } from '../../utils/chalkTexture.utils';

interface DirtPatch {
  x: number;
  z: number;
  radius: number;
  color: string;
}

const GROUND_TEXTURE_URL = '/assets/textures/ground.webp';
useTexture.preload(GROUND_TEXTURE_URL);

export const ArenaGround: React.FC = () => {
  const ringRadius = ARENA_CONFIG.ringRadius;
  const boundaryHalfSize = ARENA_CONFIG.groundSize / 2;
  const chalkPlaneSize = ringRadius * 2 + 0.8;

  const groundTexture = useTexture(GROUND_TEXTURE_URL);

  useMemo(() => {
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(5, 5);
    groundTexture.colorSpace = THREE.SRGBColorSpace;
  }, [groundTexture]);

  const chalkTexture = useMemo(() => {
    return createChalkRingTexture(ringRadius, chalkPlaneSize);
  }, [ringRadius, chalkPlaneSize]);

  useEffect(() => {
    return () => {
      chalkTexture.dispose();
    };
  }, [chalkTexture]);

  // Organic flat soil patches creating natural dirt variation without protruding into marbles
  const dirtPatches = useMemo<DirtPatch[]>(() => [
    // North-West area
    { x: -3.8, z: -4.0, radius: 2.2, color: '#3f1e0d' },
    { x: -2.8, z: -3.2, radius: 1.5, color: '#4a240e' },

    // North border area
    { x: 0.2, z: -4.5, radius: 2.0, color: '#38180a' },
    { x: -1.2, z: -3.6, radius: 1.4, color: '#4d2610' },

    // North-East area
    { x: 3.6, z: -3.8, radius: 2.1, color: '#3f1e0d' },
    { x: 2.2, z: -3.2, radius: 1.3, color: '#4a240e' },

    // East flank
    { x: 4.1, z: -1.0, radius: 2.2, color: '#421f0e' },
    { x: 3.2, z: 0.8, radius: 1.6, color: '#4d2610' },

    // West flank
    { x: -4.0, z: 0.5, radius: 2.0, color: '#421f0e' },
    { x: -3.2, z: 2.2, radius: 1.5, color: '#4a240e' },

    // South flanks (behind player starting position)
    { x: -2.8, z: 4.2, radius: 1.8, color: '#38180a' },
    { x: 2.6, z: 4.0, radius: 1.9, color: '#38180a' },
    { x: 0.0, z: 4.8, radius: 2.4, color: '#3f1e0d' },
  ], []);

  return (
    <group name="arena-ground">
      {/* 1. Main Physical Ground Layer (Solid Flat Surface at Y = 0.0) */}
      <RigidBody type="fixed" colliders={false} friction={0.35} restitution={0.35}>
        {/* Solid Ground Plane Collider: Top surface exactly at Y = 0.0 */}
        <CuboidCollider args={[boundaryHalfSize, 0.05, boundaryHalfSize]} position={[0, -0.05, 0]} />

        {/* Base flat yard soil plane with texture mapping */}
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ARENA_CONFIG.groundSize, ARENA_CONFIG.groundSize]} />
          <meshStandardMaterial
            map={groundTexture}
            roughness={0.92}
            metalness={0.02}
          />
        </mesh>

        {/* South boundary wall behind player */}
        <CuboidCollider args={[6.0, 0.5, 0.2]} position={[0, 0.5, 6.0]} />
      </RigidBody>

      {/* 2. Flat Organic Soil Patches (Blended smoothly with base texture at Y = 0.001) */}
      <group name="dirt-patches">
        {dirtPatches.map((patch, idx) => (
          <mesh
            key={`patch-${idx}`}
            position={[patch.x, 0.001, patch.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <circleGeometry args={[patch.radius, 32]} />
            <meshStandardMaterial
              color={patch.color}
              roughness={0.95}
              transparent
              opacity={0.35}
            />
          </mesh>
        ))}
      </group>

      {/* 3. Swept Traditional Play Ring (Tanah Bersih Disapu Rata - semi-transparan di atas tekstur) */}
      <mesh receiveShadow position={[0, 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ringRadius * 1.05, 48]} />
        <meshStandardMaterial
          color="#6e391b"
          roughness={0.95}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* 4. Natural Earthen Rim (Bibir Lingkaran Sapuan Rata) */}
      <mesh receiveShadow position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius * 1.02, ringRadius * 1.15, 48]} />
        <meshStandardMaterial
          color="#451a03"
          roughness={0.96}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* 5. Authentic Chalk Ring Marker (Procedural chalk dust & stroke on dirt) */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[chalkPlaneSize, chalkPlaneSize]} />
        <meshBasicMaterial
          map={chalkTexture}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* 7. South wooden border curb behind player */}
      <mesh position={[0, 0.12, 6.0]}>
        <boxGeometry args={[12.0, 0.24, 0.2]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
    </group>
  );
};
