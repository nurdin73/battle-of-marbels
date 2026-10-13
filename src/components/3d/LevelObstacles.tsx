import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useLevelStore } from '../../store/useLevelStore';
import { ARENA_CONFIG } from '../../constants/physics.constants';
import { marbleAudio } from '../../utils/soundSynth.utils';

export const LevelObstacles: React.FC = () => {
  const currentLevelId = useLevelStore((s) => s.currentLevelId);
  const isGateOpen = useLevelStore((s) => s.isGateOpen);
  const isTriggerHit = useLevelStore((s) => s.isTriggerHit);
  const triggerGateOpen = useLevelStore((s) => s.triggerGateOpen);

  const gateGroupRef = useRef<THREE.Group>(null);
  const gateTargetY = isGateOpen ? 2.8 : 0.35;

  useFrame((_, delta) => {
    if (gateGroupRef.current) {
      gateGroupRef.current.position.y = THREE.MathUtils.damp(
        gateGroupRef.current.position.y,
        gateTargetY,
        4.0,
        delta
      );
    }
  });

  if (currentLevelId === 'level-1') {
    return null;
  }

  return (
    <group name="level-obstacles">
      {/* LEVEL 2: Lorong Bambu Chute Rails */}
      {currentLevelId === 'level-2' && (
        <RigidBody
          type="fixed"
          colliders={false}
          friction={0.28}
          restitution={0.72}
          onCollisionEnter={() => marbleAudio.playWoodKnockSound(1.1)}
        >
          {/* Left Guide Chute Rail */}
          <CuboidCollider args={[0.06, 0.25, 1.7]} position={[-1.0, 0.25, -0.4]} />
          <group position={[-1.0, 0, -0.4]}>
            {/* Visual bamboo rail segments */}
            {[-1.4, -0.7, 0, 0.7, 1.4].map((zOffset, idx) => (
              <mesh key={`chute-l-${idx}`} position={[0, 0.35, zOffset]} castShadow receiveShadow>
                <cylinderGeometry args={[0.045, 0.048, 0.7, 8]} />
                <meshStandardMaterial color="#ca8a04" roughness={0.75} />
              </mesh>
            ))}
            {/* Horizontal crossbar */}
            <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.038, 0.038, 3.4, 8]} />
              <meshStandardMaterial color="#854d0e" roughness={0.8} />
            </mesh>
          </group>

          {/* Right Guide Chute Rail */}
          <CuboidCollider args={[0.06, 0.25, 1.7]} position={[1.0, 0.25, -0.4]} />
          <group position={[1.0, 0, -0.4]}>
            {[-1.4, -0.7, 0, 0.7, 1.4].map((zOffset, idx) => (
              <mesh key={`chute-r-${idx}`} position={[0, 0.35, zOffset]} castShadow receiveShadow>
                <cylinderGeometry args={[0.045, 0.048, 0.7, 8]} />
                <meshStandardMaterial color="#a16207" roughness={0.75} />
              </mesh>
            ))}
            {/* Horizontal crossbar */}
            <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.038, 0.038, 3.4, 8]} />
              <meshStandardMaterial color="#854d0e" roughness={0.8} />
            </mesh>
          </group>
        </RigidBody>
      )}

      {/* LEVEL 3: Labirin Bata & Saklar Gerbang Kayu */}
      {currentLevelId === 'level-3' && (
        <group>
          {/* Static Brick Walls */}
          <RigidBody
            type="fixed"
            colliders={false}
            friction={0.25}
            restitution={0.75}
            onCollisionEnter={() => marbleAudio.playStoneClackSound(1.2)}
          >
            {/* Left Brick Maze Wall */}
            <CuboidCollider args={[0.12, 0.25, 1.0]} position={[-1.2, 0.25, 0.2]} />
            <mesh position={[-1.2, 0.25, 0.2]} castShadow receiveShadow>
              <boxGeometry args={[0.24, 0.5, 2.0]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.85} />
            </mesh>

            {/* Right Brick Maze Wall */}
            <CuboidCollider args={[0.12, 0.25, 1.0]} position={[1.2, 0.25, 0.2]} />
            <mesh position={[1.2, 0.25, 0.2]} castShadow receiveShadow>
              <boxGeometry args={[0.24, 0.5, 2.0]} />
              <meshStandardMaterial color="#991b1b" roughness={0.85} />
            </mesh>
          </RigidBody>

          {/* Golden Trigger Switch Marble */}
          <RigidBody
            type="fixed"
            colliders="ball"
            position={[-0.9, ARENA_CONFIG.marbleRadius, 1.2]}
            onCollisionEnter={() => {
              triggerGateOpen();
            }}
          >
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[ARENA_CONFIG.marbleRadius * 1.15, 24, 24]} />
              <meshStandardMaterial
                color={isTriggerHit ? '#22c55e' : '#f59e0b'}
                emissive={isTriggerHit ? '#15803d' : '#d97706'}
                emissiveIntensity={isTriggerHit ? 0.8 : 0.6}
                metalness={0.9}
                roughness={0.15}
              />
            </mesh>
            {/* Pulsing ring indicator around trigger */}
            <mesh position={[0, -ARENA_CONFIG.marbleRadius + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.14, 0.18, 24]} />
              <meshBasicMaterial
                color={isTriggerHit ? '#22c55e' : '#fbbf24'}
                transparent
                opacity={0.8}
              />
            </mesh>
          </RigidBody>

          {/* Dynamic Rising Wooden Gate */}
          <group ref={gateGroupRef} position={[0, 0.35, -0.5]}>
            <RigidBody
              type="fixed"
              colliders={false}
              friction={0.35}
              restitution={0.65}
              onCollisionEnter={() => marbleAudio.playWoodKnockSound(1.2)}
            >
              {!isGateOpen && <CuboidCollider args={[1.1, 0.35, 0.06]} />}
              {/* Wooden Gate Planks Visual */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2.2, 0.7, 0.12]} />
                <meshStandardMaterial color="#78350f" roughness={0.8} />
              </mesh>
              {/* Iron Gate Brackets */}
              <mesh position={[0, 0, 0.065]}>
                <boxGeometry args={[2.0, 0.08, 0.02]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
              </mesh>
            </RigidBody>
          </group>
        </group>
      )}
    </group>
  );
};
