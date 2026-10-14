import React, { useEffect, useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ARENA_CONFIG } from '../../constants/physics.constants';
import { createChalkRingTexture } from '../../utils/chalkTexture.utils';

const GROUND_TEXTURE_URL = '/assets/textures/ground.webp';
useTexture.preload(GROUND_TEXTURE_URL);

export const ArenaGround: React.FC = () => {
  const ringRadius = ARENA_CONFIG.ringRadius;
  const boundaryHalfSizeX = ARENA_CONFIG.groundSizeX / 2;
  const boundaryHalfSizeZ = ARENA_CONFIG.groundSizeZ / 2;
  const chalkPlaneSize = ringRadius * 2 + 0.8;

  const groundTexture = useTexture(GROUND_TEXTURE_URL);

  useMemo(() => {
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(4, 7);
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

  return (
    <group name="arena-ground">
      {/* 1. Main Physical Ground Layer (Solid Flat Surface at Y = 0.0) */}
      <RigidBody type="fixed" colliders={false} friction={0.35} restitution={0.35}>
        {/* Solid Ground Plane Collider: Top surface exactly at Y = 0.0 */}
        <CuboidCollider
          args={[boundaryHalfSizeX, 0.05, boundaryHalfSizeZ]}
          position={[0, -0.05, 0]}
        />

        {/* Base flat yard soil plane with uniform texture mapping */}
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ARENA_CONFIG.groundSizeX, ARENA_CONFIG.groundSizeZ]} />
          <meshStandardMaterial
            map={groundTexture}
            roughness={0.92}
            metalness={0.02}
          />
        </mesh>
      </RigidBody>

      {/* 2. Authentic Chalk Ring Marker (Garis kapur batas sah arena kelereng tradisional tanpa pembeda warna tanah) */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[chalkPlaneSize, chalkPlaneSize]} />
        <meshBasicMaterial
          map={chalkTexture}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* 3. South wooden border curb lining the south brick wall */}
      <mesh position={[0, 0.12, 9.35]}>
        <boxGeometry args={[11.0, 0.24, 0.2]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
    </group>
  );
};

