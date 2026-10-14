import React, { useMemo } from 'react';
import { CylinderCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import { Gltf, useGLTF } from '@react-three/drei';
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
  modelSrc: string;
}

interface BrickData {
  position: [number, number, number];
  rotationY: number;
}

const ROCK_MODELS = [
  '/assets/gltf/Rock_1_A_Color1.gltf',
  '/assets/gltf/Rock_1_B_Color1.gltf',
  '/assets/gltf/Rock_2_A_Color1.gltf',
  '/assets/gltf/Rock_3_A_Color1.gltf',
  '/assets/gltf/Rock_3_B_Color1.gltf',
];

const TREE_MODELS = [
  '/assets/playground/Trees/oak/Flat_Tree_Oak_large_green.glb',
  '/assets/playground/Trees/oak/Flat_Tree_Oak_medium_green.glb',
];

ROCK_MODELS.forEach((src) => useGLTF.preload(src));
TREE_MODELS.forEach((src) => useGLTF.preload(src));

export const PekaranganProps: React.FC = () => {
  // Generate procedural bamboo fence poles along north, west, and east boundaries
  const bambooPoles = useMemo<BambooPole[]>(() => {
    const poles: BambooPole[] = [];

    // North Fence (Z = -7.6, X from -4.2 to 4.2)
    for (let x = -4.2; x <= 4.2; x += 0.26) {
      poles.push({
        x,
        z: -7.6 + (Math.sin(x * 5) * 0.04),
        height: 1.65 + (Math.sin(x * 7) * 0.22),
        radius: 0.045 + (Math.cos(x * 6) * 0.008),
        rotationY: Math.sin(x) * 0.2,
        rotationZ: (Math.sin(x * 3) * 0.04),
      });
    }

    // West Fence (X = -4.4, Z from -7.6 to 7.6)
    for (let z = -7.6; z <= 7.6; z += 0.3) {
      poles.push({
        x: -4.4 + (Math.cos(z * 4) * 0.04),
        z,
        height: 1.55 + (Math.cos(z * 6) * 0.2),
        radius: 0.042 + (Math.sin(z * 5) * 0.007),
        rotationY: Math.cos(z) * 0.2,
        rotationZ: (Math.cos(z * 3) * 0.04),
      });
    }

    // East Fence (X = 4.4, Z from -7.6 to 7.6)
    for (let z = -7.6; z <= 7.6; z += 0.3) {
      poles.push({
        x: 4.4 + (Math.sin(z * 4) * 0.04),
        z,
        height: 1.58 + (Math.sin(z * 6) * 0.2),
        radius: 0.043 + (Math.cos(z * 5) * 0.007),
        rotationY: Math.sin(z) * 0.2,
        rotationZ: (Math.cos(z * 3) * 0.04),
      });
    }

    return poles;
  }, []);

  // Natural River Stones scattered in pekarangan around the chalk ring
  const stones = useMemo<StoneData[]>(() => {
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
      const s = 0.50 + (i % 4) * 0.12;
      data.push({
        position: [x, 0, z],
        scale: [s, s * 0.85, s],
        rotation: [0, (i * 1.3) % (Math.PI * 2), 0],
        modelSrc: ROCK_MODELS[i % ROCK_MODELS.length],
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

  const handleTreeCollision = () => {
    marbleAudio.playTreeThudSound(1.2);
  };

  const handlePotCollision = () => {
    marbleAudio.playCeramicClinkSound(1.2);
  };

  const handleStoneCollision = () => {
    marbleAudio.playStoneClackSound(1.2);
  };

  return (
    <group name="pekarangan-props">
      {/* 1. Bamboo Fence Physical Layer (Elastic, Hollow Wood Knock) */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0.35}
        restitution={0.65}
        onCollisionEnter={handleFenceCollision}
      >
        {bambooPoles.map((pole, idx) => (
          <CylinderCollider
            key={`pole-col-${idx}`}
            args={[pole.height / 2, pole.radius * 1.15]}
            position={[pole.x, pole.height / 2, pole.z]}
            rotation={[0, pole.rotationY, pole.rotationZ]}
          />
        ))}

        {/* Low fence backstop ensuring zero marble penetration through any gaps */}
        <CuboidCollider args={[4.4, 0.5, 0.05]} position={[0, 0.5, -7.6]} />
        <CuboidCollider args={[0.05, 0.5, 7.6]} position={[-4.4, 0.5, 0]} />
        <CuboidCollider args={[0.05, 0.5, 7.6]} position={[4.4, 0.5, 0]} />
      </RigidBody>

      {/* 2. Tree Trunks Physical Layer (Damped / Low Restitution Bark Absorption, Deep Thud) */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0.45}
        restitution={0.42}
        onCollisionEnter={handleTreeCollision}
      >
        <CylinderCollider args={[1.8, 0.36]} position={[-3.6, 1.8, -6.5]} />
        <CylinderCollider args={[1.5, 0.32]} position={[3.6, 1.5, -6.2]} />
      </RigidBody>

      {/* 3. Terracotta Pots Physical Layer (Hollow Earthenware Resonance, Moderate Bounce) */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0.32}
        restitution={0.58}
        onCollisionEnter={handlePotCollision}
      >
        <CylinderCollider args={[0.28, 0.32]} position={[-2.7, 0.28, -2.4]} />
        <CylinderCollider args={[0.24, 0.28]} position={[2.7, 0.24, -2.2]} />
        <CylinderCollider args={[0.22, 0.25]} position={[-3.3, 0.22, 0.8]} />
      </RigidBody>

      {/* 4. River Stones & Red Bricks Physical Layer (Hard Mineral, High Restitution Elastic Ping) */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0.22}
        restitution={0.78}
        onCollisionEnter={handleStoneCollision}
      >
        {stones.map((stone, idx) => (
          <CylinderCollider
            key={`stone-col-${idx}`}
            args={[0.10, stone.scale[0] * 0.36]}
            position={[stone.position[0], 0.10, stone.position[2]]}
          />
        ))}
        {bricks.map((brick, idx) => (
          <CuboidCollider
            key={`brick-col-${idx}`}
            args={[0.12, 0.045, 0.06]}
            position={brick.position}
            rotation={[0, brick.rotationY, 0]}
          />
        ))}
      </RigidBody>

      {/* 1. Bamboo Fence (Pagar Bambu) Visuals */}
      <group name="bamboo-fences">
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
        <mesh position={[0, 0.55, -7.6]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.038, 0.038, 8.8, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.15, -7.6]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.035, 0.035, 8.8, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>

        {/* Horizontal Bamboo Crossbars (West) */}
        <mesh position={[-4.4, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.036, 0.036, 15.4, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
        <mesh position={[-4.4, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.034, 0.034, 15.4, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>

        {/* Horizontal Bamboo Crossbars (East) */}
        <mesh position={[4.4, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.036, 0.036, 15.4, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
        <mesh position={[4.4, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.034, 0.034, 15.4, 8]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
      </group>

      {/* 2. Playground Flat Trees */}
      <group name="village-trees">
        {/* Main Shade Tree (North-West Framing) */}
        <group position={[-3.6, 0, -6.5]}>
          <Gltf
            src="/assets/playground/Trees/oak/Flat_Tree_Oak_small_green.glb"
            scale={0.55}
            castShadow
            receiveShadow
          />
        </group>

        {/* Secondary Fruit Tree (North-East Framing) */}
        <group position={[3.6, 0, -6.2]}>
          <Gltf
            src="/assets/playground/Trees/oak/Flat_Tree_Oak_large_green.glb"
            scale={0.58}
            rotation={[0, 1.2, 0]}
            castShadow
            receiveShadow
          />
        </group>
      </group>

      {/* 3. Traditional Terracotta Clay Pots (Pot Gerabah / Gentong) */}
      <group name="terracotta-pots">
        {/* Pot Group A: Left Side Ring Flank */}
        <group position={[-2.7, 0, -2.4]}>
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.32, 0.2, 0.56, 12]} />
            <meshStandardMaterial color="#c2410c" roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.57, 0]} castShadow>
            <torusGeometry args={[0.32, 0.04, 8, 16]} />
            <meshStandardMaterial color="#9a3412" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3, 12]} />
            <meshStandardMaterial color="#271c19" roughness={0.95} />
          </mesh>
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
      </group>

      {/* 4. Indonesian Red Clay Bricks (Batu Bata Merah) */}
      <group name="red-bricks">
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

      {/* 5. Authentic GLTF River Pebbles & Yard Stones (Batu Kali) */}
      <group name="yard-rocks">
        {stones.map((stone, idx) => (
          <Gltf
            key={`stone-${idx}`}
            src={stone.modelSrc}
            position={stone.position}
            scale={stone.scale}
            rotation={stone.rotation}
            castShadow
            receiveShadow
          />
        ))}
      </group>
    </group>
  );
};
