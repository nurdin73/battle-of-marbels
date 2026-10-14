import React, { useMemo } from 'react';
import { Gltf, useGLTF } from '@react-three/drei';

interface CornerFoliageData {
  modelSrc: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
}

const CORNER_GRASS_MODELS = [
  '/assets/playground/Grass/Flat_Grass_large.glb',
  '/assets/playground/Grass/Flat_Grass_medium.glb',
  '/assets/playground/Grass/Flat_Grass_small.glb',
];

const CORNER_BUSH_MODELS = [
  '/assets/playground/Bushes/Flat_Bush_Clumps_small.glb',
  '/assets/playground/Bushes/Flat_Bush_with_Flowers.glb',
  '/assets/playground/Bushes/Flat_Bush_small.glb',
];

// Preload assets for instant rendering without hitching
CORNER_GRASS_MODELS.forEach((src) => useGLTF.preload(src));
CORNER_BUSH_MODELS.forEach((src) => useGLTF.preload(src));

export const PekaranganCornerGrass: React.FC = () => {
  const foliageItems = useMemo<CornerFoliageData[]>(() => {
    const list: CornerFoliageData[] = [];

    // Helper to generate an organic cluster of corner grass and bushes
    const addCornerCluster = (
      centerX: number,
      centerZ: number,
      count = 4,
      spread = 0.45,
      hasBush = false
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.sin(centerX * 3 + i) * 0.6;
        const dist = 0.08 + Math.abs(Math.cos(centerZ * 4 + i * 2)) * spread;
        const x = centerX + Math.cos(angle) * dist;
        const z = centerZ + Math.sin(angle) * dist;

        if (hasBush && i === 0) {
          // Low-poly corner bush / clump with organic variation (~45-55cm)
          const bScale = 0.34 + Math.abs(Math.sin(x * 6 + z * 4)) * 0.12;
          list.push({
            modelSrc: CORNER_BUSH_MODELS[list.length % CORNER_BUSH_MODELS.length],
            position: [x, 0, z],
            scale: [bScale, bScale, bScale],
            rotationY: (x * 4.1 + z * 2.9) % (Math.PI * 2),
          });
        } else {
          // Low-poly wild grass tuft (~18-24cm)
          const gScale = 0.14 + Math.abs(Math.cos(x * 5 + z * 8 + i)) * 0.07;
          list.push({
            modelSrc: CORNER_GRASS_MODELS[list.length % CORNER_GRASS_MODELS.length],
            position: [x, 0, z],
            scale: [gScale, gScale * (0.95 + (i % 2) * 0.15), gScale],
            rotationY: (x * 3.5 + z * 2.3 + i * 1.2) % (Math.PI * 2),
          });
        }
      }
    };

    // 1. North-West Yard Corner (Deep corner behind large Oak tree, bamboo fence, and brick wall junction)
    const nwAnchors: [number, number, boolean][] = [
      [-4.5, -7.8, true],
      [-5.0, -7.5, false],
      [-4.8, -8.4, true],
      [-5.2, -8.8, true],
      [-4.6, -9.1, false],
      [-5.1, -8.2, false],
      [-4.2, -8.6, false],
    ];
    nwAnchors.forEach(([x, z, hasBush]) => addCornerCluster(x, z, 4, 0.42, hasBush));

    // 2. North-East Yard Corner (Corner behind fruit tree, bamboo fence, and brick wall junction)
    const neAnchors: [number, number, boolean][] = [
      [4.5, -7.8, true],
      [5.0, -7.5, false],
      [4.8, -8.4, true],
      [5.2, -8.8, true],
      [4.6, -9.1, false],
      [5.1, -8.2, false],
      [4.2, -8.6, false],
    ];
    neAnchors.forEach(([x, z, hasBush]) => addCornerCluster(x, z, 4, 0.42, hasBush));

    // 3. South-West Yard Corner (Behind player baseline and side brick wall junction)
    const swAnchors: [number, number, boolean][] = [
      [-4.5, 7.8, true],
      [-5.0, 7.5, false],
      [-4.8, 8.4, true],
      [-5.2, 8.8, true],
      [-4.6, 9.1, false],
      [-5.1, 8.2, false],
      [-4.2, 8.6, false],
    ];
    swAnchors.forEach(([x, z, hasBush]) => addCornerCluster(x, z, 4, 0.42, hasBush));

    // 4. South-East Yard Corner (Behind player baseline and side brick wall junction)
    const seAnchors: [number, number, boolean][] = [
      [4.5, 7.8, true],
      [5.0, 7.5, false],
      [4.8, 8.4, true],
      [5.2, 8.8, true],
      [4.6, 9.1, false],
      [5.1, 8.2, false],
      [4.2, 8.6, false],
    ];
    seAnchors.forEach(([x, z, hasBush]) => addCornerCluster(x, z, 4, 0.42, hasBush));

    // 5. Perimeter Wall Crevices (Wild grass sprouting at the ground-wall junction)
    const wallCreviceAnchors: [number, number][] = [
      [-2.6, -9.2],
      [0.0, -9.2],
      [2.6, -9.2],
      [-5.2, -5.5],
      [-5.2, -2.5],
      [-5.2, 0.0],
      [-5.2, 2.5],
      [-5.2, 5.5],
      [5.2, -5.5],
      [5.2, -2.5],
      [5.2, 0.0],
      [5.2, 2.5],
      [5.2, 5.5],
      [-2.6, 9.2],
      [0.0, 9.2],
      [2.6, 9.2],
    ];
    wallCreviceAnchors.forEach(([x, z]) => addCornerCluster(x, z, 3, 0.32, false));

    return list;
  }, []);

  return (
    <group name="pekarangan-corner-grass">
      {foliageItems.map((item, idx) => (
        <Gltf
          key={`corner-foliage-${idx}`}
          src={item.modelSrc}
          position={item.position}
          scale={item.scale}
          rotation={[0, item.rotationY, 0]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
};

