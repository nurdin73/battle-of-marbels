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
            color="#78350f"
            roughness={0.88}
            metalness={0.02}
          />
        </mesh>

        {/* Outer arena walls (low invisible & visible wooden curb) */}
        {/* North Wall */}
        <CuboidCollider args={[boundaryHalfSize, 0.5, 0.2]} position={[0, 0.5, -boundaryHalfSize]} />
        {/* South Wall */}
        <CuboidCollider args={[boundaryHalfSize, 0.5, 0.2]} position={[0, 0.5, boundaryHalfSize]} />
        {/* East Wall */}
        <CuboidCollider args={[0.2, 0.5, boundaryHalfSize]} position={[boundaryHalfSize, 0.5, 0]} />
        {/* West Wall */}
        <CuboidCollider args={[0.2, 0.5, boundaryHalfSize]} position={[-boundaryHalfSize, 0.5, 0]} />
      </RigidBody>

      {/* Decorative Ground Soil Circle (inner pekarangan circle) */}
      <mesh receiveShadow position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ringRadius * 1.5, 48]} />
        <meshStandardMaterial
          color="#92400e"
          roughness={0.92}
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

      {/* Low wooden border curb visuals */}
      <mesh position={[0, 0.15, -boundaryHalfSize]}>
        <boxGeometry args={[ARENA_CONFIG.groundSize, 0.3, 0.2]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.15, boundaryHalfSize]}>
        <boxGeometry args={[ARENA_CONFIG.groundSize, 0.3, 0.2]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
      <mesh position={[boundaryHalfSize, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.3, ARENA_CONFIG.groundSize]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
      <mesh position={[-boundaryHalfSize, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.3, ARENA_CONFIG.groundSize]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
    </group>
  );
};
