import React, { useEffect, useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ARENA_CONFIG } from '../../constants/physics.constants';
import { createChalkRingTexture } from '../../utils/chalkTexture.utils';

interface SoilMoundData {
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
  height: number;
}

const GROUND_TEXTURE_URL = '/assets/textures/ground.webp';
useTexture.preload(GROUND_TEXTURE_URL);

// Curated 3D soil mound contours in outer pekarangan perimeter (strictly R >= 2.9m outside active arena ring R = 1.8m)
const SOIL_MOUNDS: SoilMoundData[] = [
  // North-West shade tree root hummock
  { x: -3.8, z: -6.5, radiusX: 2.0, radiusZ: 2.2, height: 0.14 },
  // North border undulation along bamboo fence
  { x: 0.0, z: -7.5, radiusX: 2.4, radiusZ: 1.5, height: 0.10 },
  // North-East fruit tree root hummock
  { x: 3.8, z: -6.5, radiusX: 2.0, radiusZ: 2.2, height: 0.12 },
  // East flank garden undulation behind terracotta pot and rocks
  { x: 4.2, z: 0.0, radiusX: 1.5, radiusZ: 2.4, height: 0.10 },
  // West flank garden undulation behind red bricks and pot
  { x: -4.2, z: 0.0, radiusX: 1.5, radiusZ: 2.4, height: 0.10 },
  // South-West backyard border behind player starting line
  { x: -3.2, z: 7.2, radiusX: 1.8, radiusZ: 1.8, height: 0.10 },
  // South-East backyard border behind player starting line
  { x: 3.2, z: 7.2, radiusX: 1.8, radiusZ: 1.8, height: 0.10 },
];

/**
 * Creates hemisphere mound geometry with planar UV coordinates aligned exactly with the base ground plane.
 * This guarantees seamless ground texture continuation across 3D elevations without texture pinching or seams.
 */
function createMoundGeometry(
  mound: SoilMoundData,
  groundSizeX: number,
  groundSizeZ: number
): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  geom.scale(mound.radiusX, mound.height, mound.radiusZ);
  geom.translate(mound.x, 0, mound.z);

  const pos = geom.attributes.position;
  const uvs = geom.attributes.uv;
  const halfSizeX = groundSizeX / 2;
  const halfSizeZ = groundSizeZ / 2;

  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i);
    const wz = pos.getZ(i);
    const u = (wx + halfSizeX) / groundSizeX;
    const v = (-wz + halfSizeZ) / groundSizeZ;
    uvs.setXY(i, u, v);
  }

  uvs.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

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

  const moundGeometries = useMemo(() => {
    return SOIL_MOUNDS.map((mound) =>
      createMoundGeometry(mound, ARENA_CONFIG.groundSizeX, ARENA_CONFIG.groundSizeZ)
    );
  }, []);

  useEffect(() => {
    return () => {
      chalkTexture.dispose();
      moundGeometries.forEach((geom) => geom.dispose());
    };
  }, [chalkTexture, moundGeometries]);

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

      {/* 2. Natural 3D Soil Mound Contours (Differentiated solely by 3D elevation, sharing exact ground texture) */}
      <group name="soil-mounds">
        {moundGeometries.map((geometry, idx) => (
          <RigidBody
            key={`mound-${idx}`}
            type="fixed"
            colliders="hull"
            friction={0.35}
            restitution={0.35}
          >
            <mesh
              geometry={geometry}
              receiveShadow
              castShadow
            >
              <meshStandardMaterial
                map={groundTexture}
                roughness={0.92}
                metalness={0.02}
              />
            </mesh>
          </RigidBody>
        ))}
      </group>

      {/* 3. Authentic Chalk Ring Marker (Garis kapur batas sah arena kelereng tradisional tanpa pembeda warna tanah) */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[chalkPlaneSize, chalkPlaneSize]} />
        <meshBasicMaterial
          map={chalkTexture}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* 4. South wooden border curb lining the south brick wall */}
      <mesh position={[0, 0.12, 9.35]}>
        <boxGeometry args={[11.0, 0.24, 0.2]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
    </group>
  );
};

