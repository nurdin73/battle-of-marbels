import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { MarbleEntity } from '../../types/physics.types';
import { TARGET_MARBLE_PHYSICS, ARENA_CONFIG } from '../../constants/physics.constants';
import { useGameStore } from '../../store/useGameStore';
import { marbleAudio } from '../../utils/soundSynth.utils';

interface TargetMarbleProps {
  marble: MarbleEntity;
}

export const TargetMarble: React.FC<TargetMarbleProps> = ({ marble }) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const isOutsideRef = useRef<boolean>(false);
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
  useFrame(() => {
    if (rigidBodyRef.current && !isCollected && aimingState !== 'AIRBORNE' && aimingState !== 'SIMULATING') {
      const pos = rigidBodyRef.current.translation();
      updateTargetLivePosition(marble.id, [pos.x, pos.y, pos.z]);
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

  const swirlColorObj = marble.swirlColor ? new THREE.Color(marble.swirlColor) : new THREE.Color('#ef4444');

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
        {/* Outer translucent glass shell */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[marble.radius, 32, 32]} />
          <meshPhysicalMaterial
            roughness={0.05}
            transmission={0.88}
            thickness={0.6}
            ior={1.52}
            reflectivity={0.9}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            attenuationColor={swirlColorObj}
            attenuationDistance={0.3}
          />
        </mesh>

        {/* Inner colored glass swirl spiral */}
        <mesh rotation={[0.4, 0.6, 0]}>
          <torusGeometry args={[marble.radius * 0.45, marble.radius * 0.22, 16, 24]} />
          <meshStandardMaterial
            color={marble.swirlColor || '#ef4444'}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      </group>
    </RigidBody>
  );
};
