import React, { useMemo } from 'react';
import { Gltf, useGLTF } from '@react-three/drei';

interface FoliageData {
  modelSrc: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
}

const GRASS_MODELS = [
  '/assets/playground/Grass/Flat_Grass_small.glb',
  '/assets/playground/Grass/Flat_Grass_medium.glb',
  '/assets/playground/Extras/Flat_Flowers_red.glb',
];

const BUSH_MODELS = [
  '/assets/playground/Bushes/Flat_Bush_small.glb',
  '/assets/playground/Bushes/Flat_Bush_with_Flowers.glb',
];

// Preload assets for instant rendering without hitching
GRASS_MODELS.forEach((src) => useGLTF.preload(src));
BUSH_MODELS.forEach((src) => useGLTF.preload(src));

export const PekaranganGrass: React.FC = () => {
  const foliageItems = useMemo<FoliageData[]>(() => {
    const list: FoliageData[] = [];

    // Helper to generate a grass & bush cluster with organic jitter
    const addCluster = (centerX: number, centerZ: number, count = 3, spread = 0.35, isBush = false) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.sin(centerX + i) * 0.5;
        const dist = 0.08 + Math.abs(Math.cos(centerZ * 3 + i)) * spread;
        const x = centerX + Math.cos(angle) * dist;
        const z = centerZ + Math.sin(angle) * dist;

        // Ensure zero foliage inside the active swept marble arena ring (R <= 1.85m)
        const radiusFromCenter = Math.hypot(x, z);
        if (radiusFromCenter <= 1.85) continue;

        if (isBush && i === 0) {
          // Add a low-poly playground bush (scaled to natural garden bush size ~45-55cm)
          const bScale = 0.32 + Math.abs(Math.sin(x * 5 + z * 3)) * 0.12;
          list.push({
            modelSrc: BUSH_MODELS[list.length % BUSH_MODELS.length],
            position: [x, 0, z],
            scale: [bScale, bScale, bScale],
            rotationY: (x * 4.3 + z * 2.7) % (Math.PI * 2),
          });
        } else {
          // Add playground grass tuft (scaled to natural lawn / backyard height ~18-24cm)
          const gScale = 0.14 + Math.abs(Math.cos(x * 4 + z * 7)) * 0.06;
          list.push({
            modelSrc: GRASS_MODELS[list.length % GRASS_MODELS.length],
            position: [x, 0, z],
            scale: [gScale, gScale, gScale],
            rotationY: (x * 3.7 + z * 2.1) % (Math.PI * 2),
          });
        }
      }
    };

    // 1. Grass clusters around River Stones
    const stoneAnchors: [number, number][] = [
      [-1.8, -2.6], [-0.8, -2.8], [0.9, -2.7], [2.0, -2.5],
      [-2.5, -2.1], [-3.1, -2.6], [-2.8, -3.2],
      [2.5, -2.0], [3.2, -2.5], [2.9, -3.1],
      [-2.6, 0.4], [-2.9, 1.2], [-2.4, 2.0],
      [2.6, 0.3], [2.9, 1.1], [2.5, 2.1],
      [-1.6, 3.1], [1.5, 3.2], [0.2, 3.6],
    ];
    stoneAnchors.forEach(([x, z], idx) => {
      addCluster(x, z, 3, 0.32, idx % 4 === 0);
    });

    // 2. Bushes & Grass around Banana Tree Clumps
    addCluster(-3.8, -3.8, 5, 0.7, true);
    addCluster(-3.3, -3.4, 4, 0.5, false);
    addCluster(3.9, -1.2, 5, 0.65, true);
    addCluster(3.6, -4.2, 5, 0.6, true);

    // 3. Grass & Bushes around Main Trees
    addCluster(-4.2, -4.5, 6, 0.85, true);
    addCluster(-4.0, -4.0, 4, 0.6, false);
    addCluster(4.2, -4.2, 5, 0.7, true);

    // 4. Foliage near Terracotta Pots and Bricks
    addCluster(-2.7, -2.4, 3, 0.4, false);
    addCluster(2.7, -2.2, 3, 0.4, false);
    addCluster(-3.3, 0.8, 3, 0.35, true);
    addCluster(-2.6, -2.9, 3, 0.45, false);
    addCluster(2.6, -2.9, 3, 0.45, false);

    // 5. Grass & Bushes along Bamboo Fence perimeter (North, West, East)
    for (let x = -5.0; x <= 5.0; x += 1.2) {
      addCluster(x, -5.5 + Math.sin(x * 3) * 0.15, 2, 0.25, Math.abs(x) > 2);
    }
    for (let z = -4.8; z <= 4.8; z += 1.3) {
      addCluster(-5.5 + Math.cos(z * 3) * 0.15, z, 2, 0.25, Math.abs(z) > 1.5);
      addCluster(5.5 + Math.sin(z * 4) * 0.15, z, 2, 0.25, Math.abs(z) > 1.5);
    }

    // 6. Yard outskirts & behind player starting line
    for (let x = -4.2; x <= 4.2; x += 1.8) {
      addCluster(x, 4.4 + Math.sin(x * 5) * 0.25, 2, 0.35, false);
    }

    return list;
  }, []);

  return (
    <group name="pekarangan-foliage">
      {foliageItems.map((item, idx) => (
        <Gltf
          key={`foliage-${idx}`}
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
