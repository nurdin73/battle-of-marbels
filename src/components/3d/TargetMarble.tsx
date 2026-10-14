import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { MarbleEntity } from '../../types/physics.types';
import { TARGET_MARBLE_PHYSICS, ARENA_CONFIG, SCENE_PERIMETER_BOUNDS } from '../../constants/physics.constants';
import { useGameStore } from '../../store/useGameStore';
import { marbleAudio } from '../../utils/soundSynth.utils';

interface TargetMarbleProps {
  marble: MarbleEntity;
}

export const TargetMarble: React.FC<TargetMarbleProps> = ({ marble }) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const isOutsideRef = useRef<boolean>(false);
  const outOfSceneTimerRef = useRef<number>(0);
  const [isCollected, setIsCollected] = useState<boolean>(false);

  const markMarbleOutsideRing = useGameStore((s) => s.markMarbleOutsideRing);
  const resetRevision = useGameStore((s) => s.resetRevision);
  const evaluationEpoch = useGameStore((s) => s.evaluationEpoch);
  const updateTargetLivePosition = useGameStore((s) => s.updateTargetLivePosition);
  const aimingState = useGameStore((s) => s.aimingState);
  const foulRestoreRevision = useGameStore((s) => s.foulRestoreRevision);
  const foulRestoredIds = useGameStore((s) => s.foulRestoredIds);
  const preShotTargetPositions = useGameStore((s) => s.preShotTargetPositions);

  // Reset position, scale, and physics when arena is reset
  useEffect(() => {
    isOutsideRef.current = false;
    setIsCollected(false);

    if (groupRef.current) {
      groupRef.current.scale.set(1, 1, 1);
      groupRef.current.visible = true;
    }

    if (rigidBodyRef.current) {
      rigidBodyRef.current.setEnabled(true);
      rigidBodyRef.current.setTranslation(
        {
          x: marble.initialPosition[0],
          y: marble.initialPosition[1],
          z: marble.initialPosition[2],
        },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      updateTargetLivePosition(marble.id, marble.initialPosition);
    }
  }, [resetRevision, marble.initialPosition, marble.id, updateTargetLivePosition]);

  // Restore target marble if it exited during a foul shot (traditional rules)
  useEffect(() => {
    if (foulRestoreRevision <= 0 || !foulRestoredIds.includes(marble.id)) return;

    isOutsideRef.current = false;
    setIsCollected(false);

    if (groupRef.current) {
      groupRef.current.scale.set(1, 1, 1);
      groupRef.current.visible = true;
    }

    if (rigidBodyRef.current) {
      rigidBodyRef.current.setEnabled(true);
      const restorePos = preShotTargetPositions[marble.id] || marble.initialPosition;
      rigidBodyRef.current.setTranslation(
        {
          x: restorePos[0],
          y: restorePos[1],
          z: restorePos[2],
        },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      updateTargetLivePosition(marble.id, restorePos);
    }
  }, [foulRestoreRevision, foulRestoredIds, marble.id, marble.initialPosition, preShotTargetPositions, updateTargetLivePosition]);

  // Evaluated ONLY after 2 seconds after the player's gacoan has completely stopped
  useEffect(() => {
    if (evaluationEpoch <= 0 || isCollected || !rigidBodyRef.current) return;

    const pos = rigidBodyRef.current.translation();
    const distFromOrigin = Math.hypot(pos.x, pos.z);

    if (distFromOrigin > ARENA_CONFIG.ringRadius + marble.radius) {
      isOutsideRef.current = true;
      setIsCollected(true);
      markMarbleOutsideRing(marble.id);
      marbleAudio.playCaptureSound();
    }
  }, [evaluationEpoch, isCollected, marble.id, marble.radius, markMarbleOutsideRing]);

  // Handle shrink animation when collected & track live coordinates when settled/aiming
  useFrame((_, delta) => {
    if (rigidBodyRef.current && !isCollected) {
      const pos = rigidBodyRef.current.translation();

      // Guard: If marble flies over the wall or falls out of scene, freeze after 2 seconds
      const isOutOfScene =
        Math.abs(pos.x) > SCENE_PERIMETER_BOUNDS.maxX ||
        Math.abs(pos.z) > SCENE_PERIMETER_BOUNDS.maxZ ||
        pos.y < SCENE_PERIMETER_BOUNDS.minY;

      if (isOutOfScene) {
        outOfSceneTimerRef.current += delta;
        if (outOfSceneTimerRef.current >= SCENE_PERIMETER_BOUNDS.outOfBoundsResetDelaySeconds) {
          rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      } else {
        outOfSceneTimerRef.current = 0;
      }

      if (aimingState !== 'AIRBORNE' && aimingState !== 'SIMULATING') {
        updateTargetLivePosition(marble.id, [pos.x, pos.y, pos.z]);
      }
    }

    if (isCollected && groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.22);

      if (groupRef.current.scale.x < 0.03) {
        groupRef.current.visible = false;
        if (rigidBodyRef.current) {
          rigidBodyRef.current.setEnabled(false);
          // Move far below ground to guarantee zero residual collisions
          rigidBodyRef.current.setTranslation({ x: 0, y: -50, z: 0 }, true);
        }
      }
    }
  });

  const handleCollision = () => {
    if (isCollected) return;

    // Relative velocity estimation
    const linVel = rigidBodyRef.current?.linvel();
    const speed = linVel ? Math.hypot(linVel.x, linVel.y, linVel.z) : 0.5;

    if (speed > 0.05) {
      marbleAudio.playCollisionSound({
        materialType: marble.materialType,
        relativeVelocity: speed,
      });
    }
  };

  const swirlColor = marble.swirlColor || '#ef4444';
  const swirlColorObj = useMemo(() => new THREE.Color(swirlColor), [swirlColor]);

  // Complementary accent color for dual cat-eye swirl vane
  const secondarySwirlHex = useMemo(() => {
    const c = new THREE.Color(swirlColor);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    hsl.h = (hsl.h + 0.12) % 1.0;
    hsl.l = Math.min(0.82, hsl.l + 0.15);
    return `#${new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l).getHexString()}`;
  }, [swirlColor]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="ball"
      position={marble.initialPosition}
      mass={TARGET_MARBLE_PHYSICS.mass}
      restitution={TARGET_MARBLE_PHYSICS.restitution}
      friction={TARGET_MARBLE_PHYSICS.frictionDynamic}
      linearDamping={TARGET_MARBLE_PHYSICS.linearDamping}
      angularDamping={TARGET_MARBLE_PHYSICS.angularDamping}
      onCollisionEnter={handleCollision}
    >
      <group ref={groupRef}>
        {/* Outer translucent optical glass shell */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[marble.radius, 36, 36]} />
          <meshPhysicalMaterial
            roughness={0.04}
            transmission={0.92}
            thickness={0.5}
            ior={1.52}
            reflectivity={0.92}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            attenuationColor={swirlColorObj}
            attenuationDistance={0.35}
          />
        </mesh>

        {/* Primary Indonesian Cat-Eye Vane (Kelopak Belimbing Utama) */}
        <mesh rotation={[0.45, 0.65, 0.2]}>
          <torusGeometry args={[marble.radius * 0.5, marble.radius * 0.18, 16, 28]} />
          <meshStandardMaterial
            color={swirlColor}
            roughness={0.25}
            metalness={0.15}
          />
        </mesh>

        {/* Secondary Twisted Accent Vane (Kelopak Sayap Kedua) */}
        <mesh rotation={[-0.45, -0.65, 0.85]}>
          <torusGeometry args={[marble.radius * 0.44, marble.radius * 0.14, 16, 24]} />
          <meshStandardMaterial
            color={secondarySwirlHex}
            roughness={0.28}
            metalness={0.12}
          />
        </mesh>

        {/* Central Core Molten Glass Bead */}
        <mesh>
          <sphereGeometry args={[marble.radius * 0.18, 12, 12]} />
          <meshStandardMaterial
            color={swirlColor}
            roughness={0.2}
            metalness={0.2}
          />
        </mesh>
      </group>
    </RigidBody>
  );
};
