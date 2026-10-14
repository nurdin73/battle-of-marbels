import React, { useEffect, useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { marbleAudio } from '../../utils/soundSynth.utils';

const WALL_TEXTURE_URL = '/assets/textures/wall.webp';
useTexture.preload(WALL_TEXTURE_URL);

export const PekaranganWall: React.FC = () => {
  const wallTexture = useTexture(WALL_TEXTURE_URL);

  // Independent texture mappings to maintain exact brick aspect ratio across asymmetric wall dimensions
  const wallTextureNS = useMemo(() => {
    const t = wallTexture.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4.5, 2.5);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [wallTexture]);

  const wallTextureWE = useMemo(() => {
    const t = wallTexture.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(7.6, 2.5);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [wallTexture]);

  useEffect(() => {
    return () => {
      wallTextureNS.dispose();
      wallTextureWE.dispose();
    };
  }, [wallTextureNS, wallTextureWE]);

  const handleWallCollision = () => {
    marbleAudio.playStoneClackSound(1.2);
  };

  const wallHeight = 3.2;
  const wallThickness = 0.28;
  const halfHeight = wallHeight / 2;

  // Longitudinal Rectangular Dimensions:
  // Horizontal (X): 11.2m wide, walls at X = ±5.6
  // Longitudinal (Z): 19.0m long, walls at Z = ±9.5
  const wallWidthX = 11.2;
  const halfWidthX = wallWidthX / 2;
  const wallLengthZ = 19.0;
  const halfLengthZ = wallLengthZ / 2;
  const wallDistanceX = 5.6;
  const wallDistanceZ = 9.5;

  return (
    <group name="pekarangan-walls">
      {/* 1. Physical Wall Colliders (Stone Clack Audio Response) */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0.3}
        restitution={0.65}
        onCollisionEnter={handleWallCollision}
      >
        {/* North Wall Collider */}
        <CuboidCollider
          args={[halfWidthX, halfHeight, wallThickness / 2]}
          position={[0, halfHeight, -wallDistanceZ]}
        />
        {/* South Wall Collider */}
        <CuboidCollider
          args={[halfWidthX, halfHeight, wallThickness / 2]}
          position={[0, halfHeight, wallDistanceZ]}
        />
        {/* West Wall Collider */}
        <CuboidCollider
          args={[wallThickness / 2, halfHeight, halfLengthZ]}
          position={[-wallDistanceX, halfHeight, 0]}
        />
        {/* East Wall Collider */}
        <CuboidCollider
          args={[wallThickness / 2, halfHeight, halfLengthZ]}
          position={[wallDistanceX, halfHeight, 0]}
        />
      </RigidBody>

      {/* 2. Visual Brick Walls (North, South, West, East) */}
      {/* North Wall */}
      <group position={[0, halfHeight, -wallDistanceZ]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[wallWidthX, wallHeight, wallThickness]} />
          <meshStandardMaterial
            map={wallTextureNS}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
        {/* Concrete Coping Cap */}
        <mesh position={[0, halfHeight + 0.04, 0]} castShadow>
          <boxGeometry args={[wallWidthX + 0.1, 0.08, wallThickness + 0.08]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      </group>

      {/* South Wall */}
      <group position={[0, halfHeight, wallDistanceZ]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[wallWidthX, wallHeight, wallThickness]} />
          <meshStandardMaterial
            map={wallTextureNS}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
        {/* Concrete Coping Cap */}
        <mesh position={[0, halfHeight + 0.04, 0]} castShadow>
          <boxGeometry args={[wallWidthX + 0.1, 0.08, wallThickness + 0.08]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      </group>

      {/* West Wall */}
      <group position={[-wallDistanceX, halfHeight, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, wallLengthZ]} />
          <meshStandardMaterial
            map={wallTextureWE}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
        {/* Concrete Coping Cap */}
        <mesh position={[0, halfHeight + 0.04, 0]} castShadow>
          <boxGeometry args={[wallThickness + 0.08, 0.08, wallLengthZ + 0.1]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      </group>

      {/* East Wall */}
      <group position={[wallDistanceX, halfHeight, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, wallLengthZ]} />
          <meshStandardMaterial
            map={wallTextureWE}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
        {/* Concrete Coping Cap */}
        <mesh position={[0, halfHeight + 0.04, 0]} castShadow>
          <boxGeometry args={[wallThickness + 0.08, 0.08, wallLengthZ + 0.1]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

