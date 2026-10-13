import React, { useMemo } from 'react';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import { marbleAudio } from '../../utils/soundSynth.utils';

interface BananaLeafProps {
  rotationY: number;
  pitch: number;
  scale?: number;
  droop?: number;
}

const BananaLeaf: React.FC<BananaLeafProps> = ({ rotationY, pitch, scale = 1, droop = 0.35 }) => {
  return (
    <group rotation={[0, rotationY, 0]}>
      <group rotation={[pitch, 0, 0]} scale={scale}>
        {/* Leaf Stalk / Midrib (Pelepah & Lidi Daun) */}
        <mesh position={[0, 0.45, 0.55]} rotation={[0.4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.035, 1.3, 6]} />
          <meshStandardMaterial color="#84cc16" roughness={0.7} />
        </mesh>

        {/* Inner Broad Leaf Blade */}
        <mesh position={[0, 0.52, 0.52]} rotation={[0.4, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.015, 1.1]} />
          <meshStandardMaterial color="#16a34a" roughness={0.75} />
        </mesh>

        {/* Drooping Leaf Tip (Ujung Daun Melengkung ke Bawah) */}
        <group position={[0, 0.72, 1.0]} rotation={[droop, 0, 0]}>
          <mesh position={[0, -0.15, 0.32]} rotation={[0.3, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.34, 0.012, 0.75]} />
            <meshStandardMaterial color="#22c55e" roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.32, 0.72]} rotation={[0.6, 0, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.15, 0.5, 4]} />
            <meshStandardMaterial color="#15803d" roughness={0.75} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

interface SingleBananaTreeProps {
  height?: number;
  trunkRadius?: number;
  hasBlossom?: boolean;
}

const SingleBananaTree: React.FC<SingleBananaTreeProps> = ({
  height = 2.6,
  trunkRadius = 0.14,
  hasBlossom = false,
}) => {
  const leaves = useMemo(() => [
    { rotationY: 0, pitch: 0.55, scale: 1.1, droop: 0.4 },
    { rotationY: (Math.PI * 2) / 7, pitch: 0.5, scale: 1.05, droop: 0.35 },
    { rotationY: ((Math.PI * 2) / 7) * 2, pitch: 0.6, scale: 1.15, droop: 0.45 },
    { rotationY: ((Math.PI * 2) / 7) * 3, pitch: 0.48, scale: 1.0, droop: 0.32 },
    { rotationY: ((Math.PI * 2) / 7) * 4, pitch: 0.58, scale: 1.12, droop: 0.42 },
    { rotationY: ((Math.PI * 2) / 7) * 5, pitch: 0.52, scale: 1.08, droop: 0.38 },
    { rotationY: ((Math.PI * 2) / 7) * 6, pitch: 0.62, scale: 1.14, droop: 0.44 },
  ], []);

  return (
    <group>
      {/* Lower Trunk Base (Pangkal Batang dengan Serat Kering) */}
      <mesh position={[0, height * 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkRadius * 1.05, trunkRadius * 1.25, height * 0.44, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.88} />
      </mesh>

      {/* Mid Trunk (Batang Semu Hijau Kecokelatan) */}
      <mesh position={[0, height * 0.58, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkRadius * 0.9, trunkRadius * 1.05, height * 0.42, 8]} />
        <meshStandardMaterial color="#65a30d" roughness={0.82} />
      </mesh>

      {/* Upper Trunk Crown (Pangkal Mahkota Daun) */}
      <mesh position={[0, height * 0.88, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkRadius * 0.75, trunkRadius * 0.9, height * 0.26, 8]} />
        <meshStandardMaterial color="#84cc16" roughness={0.8} />
      </mesh>

      {/* Upright Center Shoot (Pucuk Daun Muda Menggulung) */}
      <mesh position={[0, height + 0.35, 0]} rotation={[0.05, 0, 0.05]} castShadow>
        <cylinderGeometry args={[0.02, 0.045, 0.9, 6]} />
        <meshStandardMaterial color="#bef264" roughness={0.7} />
      </mesh>

      {/* Crown of Radiating Arched Leaves */}
      <group position={[0, height * 0.94, 0]}>
        {leaves.map((leaf, idx) => (
          <BananaLeaf
            key={`leaf-${idx}`}
            rotationY={leaf.rotationY}
            pitch={leaf.pitch}
            scale={leaf.scale}
            droop={leaf.droop}
          />
        ))}

        {/* Optional Hanging Banana Blossom (Jantung Pisang) */}
        {hasBlossom && (
          <group position={[0.2, 0.1, 0.25]} rotation={[0.4, 0.3, 0]}>
            {/* Hanging stalk */}
            <mesh position={[0, -0.25, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.025, 0.5, 6]} />
              <meshStandardMaterial color="#4d7c0f" roughness={0.8} />
            </mesh>
            {/* Young green bananas row */}
            <mesh position={[0, -0.15, 0]} castShadow>
              <torusGeometry args={[0.08, 0.03, 6, 10]} />
              <meshStandardMaterial color="#65a30d" roughness={0.75} />
            </mesh>
            {/* Purple blossom bell (Jantung) */}
            <mesh position={[0, -0.42, 0]} castShadow>
              <coneGeometry args={[0.08, 0.26, 7]} />
              <meshStandardMaterial color="#701a75" roughness={0.7} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

export interface BananaClumpProps {
  position: [number, number, number];
  rotationY?: number;
}

export const BananaClump: React.FC<BananaClumpProps> = ({ position, rotationY = 0 }) => {
  const handleCollision = () => {
    marbleAudio.playTreeThudSound(1.1);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Physical Collider for Tree Trunks */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0.42}
        restitution={0.4}
        onCollisionEnter={handleCollision}
      >
        {/* Main Tree Trunk Collider */}
        <CylinderCollider args={[1.3, 0.26]} position={[0, 1.3, 0]} />
        {/* Sapling Trunk Collider */}
        <CylinderCollider args={[0.85, 0.16]} position={[-0.45, 0.85, 0.25]} />
      </RigidBody>

      {/* Main Mature Banana Tree */}
      <SingleBananaTree height={2.8} trunkRadius={0.16} hasBlossom={true} />

      {/* Secondary Banana Sapling (Tunas / Anakan Pohon Pisang) */}
      <group position={[-0.45, 0, 0.25]} rotation={[0.1, 1.2, -0.1]}>
        <SingleBananaTree height={1.7} trunkRadius={0.10} hasBlossom={false} />
      </group>

      {/* Soil Mound around Trunk Roots */}
      <mesh position={[-0.15, 0.05, 0.08]} scale={[0.85, 0.16, 0.75]}>
        <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3f1e0d" roughness={0.96} />
      </mesh>
    </group>
  );
};

export const BananaTrees: React.FC = () => {
  return (
    <group name="banana-trees">
      {/* Clump 1: North-West Corner (Near the Kersen Tree) */}
      <BananaClump position={[-3.8, 0, -3.8]} rotationY={0.4} />

      {/* Clump 2: East Flank Along Yard Border */}
      <BananaClump position={[3.9, 0, -1.2]} rotationY={-1.1} />

      {/* Clump 3: Far North-East Corner */}
      <BananaClump position={[3.6, 0, -4.2]} rotationY={2.2} />
    </group>
  );
};
