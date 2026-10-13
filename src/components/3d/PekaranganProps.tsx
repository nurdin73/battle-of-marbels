import React, { useMemo } from 'react';
import { CylinderCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import { marbleAudio } from '../../utils/soundSynth.utils';

interface BambooPole {
  x: number;
  z: number;
  height: number;
  radius: number;
  rotationY: number;
  rotationZ: number;
}

interface StoneData {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

interface BrickData {
  position: [number, number, number];
  rotationY: number;
}

export const PekaranganProps: React.FC = () => {
  // Generate procedural bamboo fence poles along north, west, and east boundaries
  const bambooPoles = useMemo<BambooPole[]>(() => {
    const poles: BambooPole[] = [];

    // North Fence (Z = -5.8, X from -5.6 to 5.6)
    for (let x = -5.6; x <= 5.6; x += 0.26) {
      poles.push({
        x,
        z: -5.8 + (Math.sin(x * 5) * 0.04),
        height: 1.65 + (Math.sin(x * 7) * 0.22),
        radius: 0.045 + (Math.cos(x * 6) * 0.008),
        rotationY: Math.sin(x) * 0.2,
        rotationZ: (Math.sin(x * 3) * 0.04),
      });
    }

    // West Fence (X = -5.8, Z from -5.6 to 5.6)
    for (let z = -5.6; z <= 5.6; z += 0.3) {
      poles.push({
        x: -5.8 + (Math.cos(z * 4) * 0.04),
        z,
        height: 1.55 + (Math.cos(z * 6) * 0.2),
        radius: 0.042 + (Math.sin(z * 5) * 0.007),
        rotationY: Math.cos(z) * 0.2,
        rotationZ: (Math.cos(z * 3) * 0.04),
      });
    }

    // East Fence (X = 5.8, Z from -5.6 to 5.6)
    for (let z = -5.6; z <= 5.6; z += 0.3) {
      poles.push({
        x: 5.8 + (Math.sin(z * 4) * 0.04),
        z,
        height: 1.58 + (Math.sin(z * 6) * 0.2),
        radius: 0.043 + (Math.cos(z * 5) * 0.007),
        rotationY: Math.sin(z) * 0.2,
        rotationZ: (Math.sin(z * 3) * 0.04),
      });
    }

    return poles;
  }, []);

  // Natural River Stones scattered in pekarangan around the chalk ring
  const stones = useMemo<StoneData[]>(() => {
    const stoneColors = ['#475569', '#334155', '#64748b', '#52525b', '#3f3f46'];
    const data: StoneData[] = [];

    // Natural pebble clusters framing the outer ring
    const positions: [number, number][] = [
      // North arc
      [-1.8, -2.6], [-0.8, -2.8], [0.9, -2.7], [2.0, -2.5],
      // North-West & North-East clusters
      [-2.5, -2.1], [-3.1, -2.6], [-2.8, -3.2],
      [2.5, -2.0], [3.2, -2.5], [2.9, -3.1],
      // East & West flanks
      [-2.6, 0.4], [-2.9, 1.2], [-2.4, 2.0],
      [2.6, 0.3], [2.9, 1.1], [2.5, 2.1],
      // South flanks (behind gacoan)
      [-1.6, 3.1], [1.5, 3.2], [0.2, 3.6],
    ];

    positions.forEach(([x, z], i) => {
      const s = 0.10 + (i % 5) * 0.04;
      data.push({
        position: [x, s * 0.4, z],
        scale: [s * 1.3, s * 0.8, s * 1.1],
        rotation: [Math.sin(i) * 0.3, i * 0.7, Math.cos(i) * 0.2],
        color: stoneColors[i % stoneColors.length],
      });
    });

    return data;
  }, []);

  // Red clay bricks outlining garden corner edges
  const bricks = useMemo<BrickData[]>(() => {
    const list: BrickData[] = [];
    // Brick row along garden border near (-2.7, -2.9)
    for (let i = 0; i < 4; i++) {
      list.push({
        position: [-2.4 - i * 0.28, 0.045, -2.8 - i * 0.08],
        rotationY: 0.3,
      });
    }
    // Brick row along right garden border near (2.7, -2.8)
    for (let i = 0; i < 4; i++) {
      list.push({
        position: [2.4 + i * 0.28, 0.045, -2.8 - i * 0.08],
        rotationY: -0.3,
      });
      // Second layer stack
      if (i < 2) {
        list.push({
          position: [2.5 + i * 0.28, 0.135, -2.8],
          rotationY: -0.3,
        });
      }
    }
    return list;
  }, []);

  const handleFenceCollision = () => {
    marbleAudio.playWoodKnockSound(1.2);
  };

  return (
    <group name="pekarangan-props">
      {/* Physical Collider Layer for Pekarangan Props */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0.35}
        restitution={0.65}
        onCollisionEnter={handleFenceCollision}
      >
        {/* 1. Bamboo Pole Physical Colliders */}
        {bambooPoles.map((pole, idx) => (
          <CylinderCollider
            key={`pole-col-${idx}`}
            args={[pole.height / 2, pole.radius * 1.15]}
            position={[pole.x, pole.height / 2, pole.z]}
            rotation={[0, pole.rotationY, pole.rotationZ]}
          />
        ))}

        {/* Low fence backstop ensuring zero marble penetration through any gaps */}
        <CuboidCollider args={[5.8, 0.5, 0.05]} position={[0, 0.5, -5.8]} />
        <CuboidCollider args={[0.05, 0.5, 5.8]} position={[-5.8, 0.5, 0]} />
        <CuboidCollider args={[0.05, 0.5, 5.8]} position={[5.8, 0.5, 0]} />

        {/* 2. Tree Trunk Colliders */}
        <CylinderCollider args={[1.8, 0.38]} position={[-4.2, 1.8, -4.5]} />
        <CylinderCollider args={[1.5, 0.28]} position={[4.2, 1.5, -4.2]} />

        {/* 3. Terracotta Pot Colliders */}
        <CylinderCollider args={[0.28, 0.32]} position={[-2.7, 0.28, -2.4]} />
        <CylinderCollider args={[0.24, 0.28]} position={[2.7, 0.24, -2.2]} />
        <CylinderCollider args={[0.22, 0.25]} position={[-3.3, 0.22, 0.8]} />
      </RigidBody>

      {/* 1. Bamboo Fence (Pagar Bambu) Visuals */}
      <group>
        {bambooPoles.map((pole, idx) => (
          <mesh
            key={`pole-${idx}`}
            position={[pole.x, pole.height / 2, pole.z]}
            rotation={[0, pole.rotationY, pole.rotationZ]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[pole.radius, pole.radius * 1.08, pole.height, 8]} />
            <meshStandardMaterial
              color={idx % 3 === 0 ? '#ca8a04' : idx % 3 === 1 ? '#a16207' : '#65a30d'}
              roughness={0.75}
              metalness={0.05}
            />
          </mesh>
        ))}

        {/* Horizontal Bamboo Crossbars (North) */}
        <mesh position={[0, 0.55, -5.8]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.038, 0.038, 11.6, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.15, -5.8]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.035, 0.035, 11.6, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>

        {/* Horizontal Bamboo Crossbars (West) */}
        <mesh position={[-5.8, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.036, 0.036, 11.6, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
        <mesh position={[-5.8, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.034, 0.034, 11.6, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>

        {/* Horizontal Bamboo Crossbars (East) */}
        <mesh position={[5.8, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.036, 0.036, 11.6, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
        <mesh position={[5.8, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.034, 0.034, 11.6, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
      </group>

      {/* 2. Tropical Village Shade Tree (Pohon Kersen Pekarangan) - North-West Framing */}
      <group position={[-4.2, 0, -4.5]}>
        {/* Main Tree Trunk */}
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.28, 0.42, 3.6, 8]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>

        {/* Angled Branch 1 */}
        <mesh position={[0.4, 2.7, 0.3]} rotation={[0.4, 0.3, -0.5]} castShadow>
          <cylinderGeometry args={[0.16, 0.22, 1.6, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>

        {/* Angled Branch 2 */}
        <mesh position={[-0.3, 2.9, -0.3]} rotation={[-0.3, 0.5, 0.6]} castShadow>
          <cylinderGeometry args={[0.14, 0.2, 1.4, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>

        {/* Lush Layered Foliage Canopy */}
        <mesh position={[0.4, 3.6, 0.4]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.6, 1]} />
          <meshStandardMaterial color="#15803d" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[-0.6, 3.3, 0.7]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial color="#166534" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[1.1, 3.4, -0.4]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.4, 1]} />
          <meshStandardMaterial color="#14532d" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.2, 4.5, 0.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial color="#22c55e" roughness={0.8} flatShading />
        </mesh>
      </group>

      {/* 3. Secondary Smaller Fruit Tree / Sapling - North-East Framing */}
      <group position={[4.2, 0, -4.2]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.3, 3.0, 7]} />
          <meshStandardMaterial color="#502808" roughness={0.9} />
        </mesh>
        <mesh position={[-0.3, 3.0, 0.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.4, 1]} />
          <meshStandardMaterial color="#15803d" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.5, 3.3, -0.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.1, 1]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} flatShading />
        </mesh>
      </group>

      {/* 4. Traditional Terracotta Clay Pots (Pot Gerabah / Gentong) */}
      {/* Pot Group A: Left Side Ring Flank */}
      <group position={[-2.7, 0, -2.4]}>
        {/* Pot Base & Body */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.2, 0.56, 12]} />
          <meshStandardMaterial color="#c2410c" roughness={0.78} />
        </mesh>
        {/* Pot Rim */}
        <mesh position={[0, 0.57, 0]} castShadow>
          <torusGeometry args={[0.32, 0.04, 8, 16]} />
          <meshStandardMaterial color="#9a3412" roughness={0.8} />
        </mesh>
        {/* Pot Soil */}
        <mesh position={[0, 0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 12]} />
          <meshStandardMaterial color="#271c19" roughness={0.95} />
        </mesh>
        {/* Tropical Caladium / Sansiviera Plant */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <coneGeometry args={[0.26, 0.45, 5]} />
          <meshStandardMaterial color="#15803d" roughness={0.7} flatShading />
        </mesh>
      </group>

      {/* Pot Group B: Right Side Ring Flank */}
      <group position={[2.7, 0, -2.2]}>
        <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.28, 0.18, 0.48, 12]} />
          <meshStandardMaterial color="#ea580c" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.49, 0]} castShadow>
          <torusGeometry args={[0.28, 0.035, 8, 16]} />
          <meshStandardMaterial color="#c2410c" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 12]} />
          <meshStandardMaterial color="#271c19" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.65, 0]} castShadow>
          <coneGeometry args={[0.24, 0.4, 6]} />
          <meshStandardMaterial color="#22c55e" roughness={0.7} flatShading />
        </mesh>
      </group>

      {/* Pot Group C: Left Outer Flank */}
      <group position={[-3.3, 0, 0.8]}>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.25, 0.16, 0.44, 12]} />
          <meshStandardMaterial color="#c2410c" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow>
          <torusGeometry args={[0.25, 0.03, 8, 16]} />
          <meshStandardMaterial color="#9a3412" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <coneGeometry args={[0.22, 0.38, 5]} />
          <meshStandardMaterial color="#16a34a" roughness={0.7} flatShading />
        </mesh>
      </group>

      {/* 5. Indonesian Red Clay Bricks (Batu Bata Merah) */}
      <group>
        {bricks.map((brick, idx) => (
          <mesh
            key={`brick-${idx}`}
            position={brick.position}
            rotation={[0, brick.rotationY, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.24, 0.09, 0.12]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.88} />
          </mesh>
        ))}
      </group>

      {/* 6. River Pebbles & Yard Stones (Batu Kali) */}
      <group>
        {stones.map((stone, idx) => (
          <mesh
            key={`stone-${idx}`}
            position={stone.position}
            scale={stone.scale}
            rotation={stone.rotation}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={stone.color} roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
