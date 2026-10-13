import React, { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { ARENA_CONFIG } from '../../constants/physics.constants';

interface SoilMound {
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
  height: number;
  color: string;
}

export const ArenaGround: React.FC = () => {
  const ringRadius = ARENA_CONFIG.ringRadius;
  const boundaryHalfSize = ARENA_CONFIG.groundSize / 2;

  // Curated natural soil mounds creating an authentic uneven backyard (tanah pekarangan bergelombang)
  const soilMounds = useMemo<SoilMound[]>(() => [
    // North-West hummock (under kersen tree & banana clump)
    { x: -3.8, z: -4.0, radiusX: 2.4, radiusZ: 2.1, height: 0.11, color: '#3f1e0d' },
    { x: -2.8, z: -3.2, radiusX: 1.6, radiusZ: 1.4, height: 0.07, color: '#4a240e' },

    // North border undulations
    { x: 0.2, z: -4.5, radiusX: 2.2, radiusZ: 1.5, height: 0.08, color: '#38180a' },
    { x: -1.2, z: -3.6, radiusX: 1.5, radiusZ: 1.2, height: 0.06, color: '#4d2610' },

    // North-East hummock (near fruit tree & banana clump)
    { x: 3.6, z: -3.8, radiusX: 2.3, radiusZ: 1.9, height: 0.09, color: '#3f1e0d' },
    { x: 2.2, z: -3.2, radiusX: 1.4, radiusZ: 1.3, height: 0.06, color: '#4a240e' },

    // East flank mound (under east banana clump)
    { x: 4.1, z: -1.0, radiusX: 2.2, radiusZ: 2.5, height: 0.10, color: '#421f0e' },
    { x: 3.2, z: 0.8, radiusX: 1.5, radiusZ: 1.8, height: 0.06, color: '#522912' },

    // West flank mound (near garden bricks and pot)
    { x: -4.0, z: 0.5, radiusX: 2.1, radiusZ: 2.4, height: 0.09, color: '#421f0e' },
    { x: -3.2, z: 2.2, radiusX: 1.6, radiusZ: 1.5, height: 0.06, color: '#4a240e' },

    // South flanks & backyard borders (behind starting line)
    { x: -2.8, z: 4.2, radiusX: 2.0, radiusZ: 1.6, height: 0.07, color: '#38180a' },
    { x: 2.6, z: 4.0, radiusX: 2.1, radiusZ: 1.7, height: 0.07, color: '#38180a' },
    { x: 0.0, z: 4.8, radiusX: 2.8, radiusZ: 1.3, height: 0.08, color: '#3f1e0d' },
  ], []);

  return (
    <group name="arena-ground">
      {/* 1. Main Physical Ground Layer */}
      <RigidBody type="fixed" colliders={false} friction={0.35} restitution={0.35}>
        {/* Solid Ground Plane Collider: Top surface exactly at Y = 0.0 */}
        <CuboidCollider args={[boundaryHalfSize, 0.05, boundaryHalfSize]} position={[0, -0.05, 0]} />

        {/* Base flat yard soil plane */}
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

      {/* 2. Uneven Terrain: Organic Soil Mounds (Gundukan Tanah Bergelombang Luar) */}
      <group name="soil-mounds">
        {soilMounds.map((mound, idx) => (
          <mesh
            key={`mound-${idx}`}
            position={[mound.x, 0, mound.z]}
            scale={[mound.radiusX, mound.height, mound.radiusZ]}
            receiveShadow
          >
            {/* Half-sphere dome creating smooth, natural low-poly soil mounds */}
            <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color={mound.color}
              roughness={0.94}
              metalness={0.01}
            />
          </mesh>
        ))}
      </group>

      {/* 3. Swept Traditional Play Ring (Tanah yang Disapu Rata & Halus) */}
      <mesh receiveShadow position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ringRadius * 1.05, 48]} />
        <meshStandardMaterial
          color="#6e391b"
          roughness={0.95}
        />
      </mesh>

      {/* 4. Raised Soil Rim (Bibir Tanggul Tanah Halus Pembatas Sapuan) */}
      <mesh receiveShadow position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius * 1.02, ringRadius * 1.18, 48]} />
        <meshStandardMaterial
          color="#451a03"
          roughness={0.96}
        />
      </mesh>

      {/* 5. Chalk Ring Marker Line */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius - 0.015, ringRadius + 0.015, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      {/* 6. Chalk Ring Ground Glow / Texture Ribbon */}
      <mesh position={[0, 0.010, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius - 0.03, ringRadius + 0.03, 64]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.35} />
      </mesh>

      {/* 7. South wooden border curb behind player */}
      <mesh position={[0, 0.12, 6.0]}>
        <boxGeometry args={[12.0, 0.24, 0.2]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
    </group>
  );
};
