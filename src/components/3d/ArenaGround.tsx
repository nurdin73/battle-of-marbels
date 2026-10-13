import React from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { ARENA_CONFIG } from '../../constants/physics.constants';

export const ArenaGround: React.FC = () => {
  const ringRadius = ARENA_CONFIG.ringRadius;
  const boundaryHalfSize = ARENA_CONFIG.groundSize / 2;

  return (
    <group>
      {/* Ground Physical Body */}
      <RigidBody type="fixed" colliders={false} friction={0.35} restitution={0.35}>
        {/* Solid Ground Plane Collider: Top surface exactly at Y = 0.0 */}
        <CuboidCollider args={[boundaryHalfSize, 0.05, boundaryHalfSize]} position={[0, -0.05, 0]} />

        {/* Main soil plane visual */}
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ARENA_CONFIG.groundSize, ARENA_CONFIG.groundSize]} />
          <meshStandardMaterial
            color="#5c2f16"
            roughness={0.92}
            metalness={0.02}
          />
        </mesh>

        {/* South boundary wall behind player */}
        <CuboidCollider args={[6.0, 0.5, 0.2]} position={[0, 0.5, 6.0]} />
      </RigidBody>

      {/* Decorative Ground Soil Circle (subtle swept play ring area) */}
      <mesh receiveShadow position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ringRadius * 1.35, 48]} />
        <meshStandardMaterial
          color="#6e391b"
          roughness={0.94}
        />
      </mesh>

      {/* Chalk Ring Marker Line */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius - 0.015, ringRadius + 0.015, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      {/* Chalk Ring Ground Glow / Texture Ribbon */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius - 0.03, ringRadius + 0.03, 64]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.4} />
      </mesh>

      {/* South wooden border curb behind player */}
      <mesh position={[0, 0.12, 6.0]}>
        <boxGeometry args={[12.0, 0.24, 0.2]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
    </group>
  );
};
