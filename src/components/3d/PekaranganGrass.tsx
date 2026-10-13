import React, { useMemo } from 'react';

interface GrassTuftData {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  color: string;
}

const GRASS_COLORS = [
  '#15803d', // Dark tropical green
  '#16a34a', // Natural foliage green
  '#22c55e', // Vibrant grass green
  '#65a30d', // Sunlit yellow-green
  '#4d7c0f', // Olive green
];

export const PekaranganGrass: React.FC = () => {
  const tufts = useMemo<GrassTuftData[]>(() => {
    const list: GrassTuftData[] = [];

    // Helper to generate a grass clump with organic jitter
    const addCluster = (centerX: number, centerZ: number, count = 3, spread = 0.35) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.sin(centerX + i) * 0.5;
        const dist = 0.08 + (Math.abs(Math.cos(centerZ * 3 + i)) * spread);
        const x = centerX + Math.cos(angle) * dist;
        const z = centerZ + Math.sin(angle) * dist;

        // Ensure no grass sprouts inside the active swept marble ring (R <= 1.85m)
        const radiusFromCenter = Math.hypot(x, z);
        if (radiusFromCenter <= 1.85) continue;

        const heightScale = 0.16 + (Math.abs(Math.sin(x * 7 + z * 5)) * 0.14);
        const widthScale = 0.18 + (Math.abs(Math.cos(x * 4 + z * 8)) * 0.12);

        list.push({
          position: [x, 0, z],
          scale: [widthScale, heightScale, widthScale],
          rotationY: (x * 3.7 + z * 2.1) % (Math.PI * 2),
          color: GRASS_COLORS[(list.length) % GRASS_COLORS.length],
        });
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
    stoneAnchors.forEach(([x, z]) => addCluster(x, z, 3, 0.28));

    // 2. Grass clusters around Banana Tree Clumps
    addCluster(-3.8, -3.8, 6, 0.65);
    addCluster(-3.4, -3.5, 4, 0.5);
    addCluster(3.9, -1.2, 6, 0.6);
    addCluster(3.6, -4.2, 5, 0.55);

    // 3. Grass clusters around Kersen Shade Tree
    addCluster(-4.2, -4.5, 8, 0.85);
    addCluster(-4.0, -4.0, 5, 0.6);
    addCluster(4.2, -4.2, 6, 0.7);

    // 4. Grass clusters around Terracotta Pots and Bricks
    addCluster(-2.7, -2.4, 4, 0.4);
    addCluster(2.7, -2.2, 4, 0.4);
    addCluster(-3.3, 0.8, 3, 0.35);
    addCluster(-2.6, -2.9, 4, 0.45);
    addCluster(2.6, -2.9, 4, 0.45);

    // 5. Grass fringe along Bamboo Fence bases (North, West, East)
    for (let x = -5.2; x <= 5.2; x += 0.85) {
      addCluster(x, -5.5 + Math.sin(x * 3) * 0.15, 2, 0.2);
    }
    for (let z = -5.0; z <= 5.0; z += 0.9) {
      addCluster(-5.5 + Math.cos(z * 3) * 0.15, z, 2, 0.2);
      addCluster(5.5 + Math.sin(z * 4) * 0.15, z, 2, 0.2);
    }

    // 6. Yard outskirts & behind player line
    for (let x = -4.5; x <= 4.5; x += 1.4) {
      addCluster(x, 4.2 + Math.sin(x * 5) * 0.3, 3, 0.4);
      addCluster(x, 5.2 + Math.cos(x * 4) * 0.2, 3, 0.35);
    }

    return list;
  }, []);

  return (
    <group name="pekarangan-grass">
      {tufts.map((tuft, idx) => (
        <group
          key={`grass-${idx}`}
          position={tuft.position}
          scale={tuft.scale}
          rotation={[0, tuft.rotationY, 0]}
        >
          {/* Blade Pair 1: Front-Back crossed blade fan */}
          <mesh position={[0, 0.48, 0]} castShadow>
            <coneGeometry args={[0.32, 1.0, 4]} />
            <meshStandardMaterial color={tuft.color} roughness={0.85} flatShading />
          </mesh>

          {/* Blade Pair 2: Angled perpendicular blade fan */}
          <mesh position={[0, 0.42, 0]} rotation={[0.15, Math.PI / 3, -0.1]}>
            <coneGeometry args={[0.26, 0.88, 4]} />
            <meshStandardMaterial color={tuft.color} roughness={0.85} flatShading />
          </mesh>

          {/* Blade Pair 3: Lower spreading leaf */}
          <mesh position={[0.04, 0.3, -0.03]} rotation={[-0.2, -Math.PI / 4, 0.25]}>
            <coneGeometry args={[0.22, 0.65, 3]} />
            <meshStandardMaterial color="#65a30d" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};
