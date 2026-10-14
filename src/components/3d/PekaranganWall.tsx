import React, { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { marbleAudio } from '../../utils/soundSynth.utils';

const WALL_TEXTURE_URL = '/assets/textures/wall.webp';
useTexture.preload(WALL_TEXTURE_URL);

export const PekaranganWall: React.FC = () => {
  const wallTexture = useTexture(WALL_TEXTURE_URL);

  useMemo(() => {
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(6, 2.5);
    wallTexture.colorSpace = THREE.SRGBColorSpace;
  }, [wallTexture]);

  const handleWallCollision = () => {
    marbleAudio.playStoneClackSound(1.2);
  };

  const wallHeight = 3.2;
  const wallThickness = 0.28;
  const wallLength = 15.2;
  const halfLength = wallLength / 2;
  const wallDistance = 7.5;
  const halfHeight = wallHeight / 2;

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
          args={[halfLength, halfHeight, wallThickness / 2]}
          position={[0, halfHeight, -wallDistance]}
        />
        {/* South Wall Collider */}
        <CuboidCollider
          args={[halfLength, halfHeight, wallThickness / 2]}
          position={[0, halfHeight, wallDistance]}
        />
        {/* West Wall Collider */}
        <CuboidCollider
          args={[wallThickness / 2, halfHeight, halfLength]}
          position={[-wallDistance, halfHeight, 0]}
        />
        {/* East Wall Collider */}
        <CuboidCollider
          args={[wallThickness / 2, halfHeight, halfLength]}
          position={[wallDistance, halfHeight, 0]}
        />
      </RigidBody>

      {/* 2. Visual Brick Walls (North, South, West, East) */}
      {/* North Wall */}
      <group position={[0, halfHeight, -wallDistance]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[wallLength, wallHeight, wallThickness]} />
          <meshStandardMaterial
            map={wallTexture}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
        {/* Concrete Coping Cap */}
        <mesh position={[0, halfHeight + 0.04, 0]} castShadow>
          <boxGeometry args={[wallLength + 0.1, 0.08, wallThickness + 0.08]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      </group>

      {/* South Wall */}
      <group position={[0, halfHeight, wallDistance]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[wallLength, wallHeight, wallThickness]} />
          <meshStandardMaterial
            map={wallTexture}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
        {/* Concrete Coping Cap */}
        <mesh position={[0, halfHeight + 0.04, 0]} castShadow>
          <boxGeometry args={[wallLength + 0.1, 0.08, wallThickness + 0.08]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      </group>

      {/* West Wall */}
      <group position={[-wallDistance, halfHeight, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, wallLength]} />
          <meshStandardMaterial
            map={wallTexture}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
        {/* Concrete Coping Cap */}
        <mesh position={[0, halfHeight + 0.04, 0]} castShadow>
          <boxGeometry args={[wallThickness + 0.08, 0.08, wallLength + 0.1]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      </group>

      {/* East Wall */}
      <group position={[wallDistance, halfHeight, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[wallThickness, wallHeight, wallLength]} />
          <meshStandardMaterial
            map={wallTexture}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
        {/* Concrete Coping Cap */}
        <mesh position={[0, halfHeight + 0.04, 0]} castShadow>
          <boxGeometry args={[wallThickness + 0.08, 0.08, wallLength + 0.1]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

