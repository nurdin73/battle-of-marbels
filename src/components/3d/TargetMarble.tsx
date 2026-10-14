import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { MarbleEntity } from '../../types/physics.types';
import { TARGET_MARBLE_PHYSICS, ARENA_CONFIG, SCENE_PERIMETER_BOUNDS } from '../../constants/physics.constants';
import { useGameStore } from '../../store/useGameStore';
import { marbleAudio } from '../../utils/soundSynth.utils';

export const TARGET_MARBLE_TEXTURE_URLS = [
  '/assets/textures/marble-green-yellow.png',
  '/assets/textures/marble-orange-cream.png',
];

TARGET_MARBLE_TEXTURE_URLS.forEach((url) => {
  useTexture.preload(url);
});

interface TargetMarbleProps {
  marble: MarbleEntity;
}

export const TargetMarble: React.FC<TargetMarbleProps> = ({ marble }) => {
  const targetTextures = useTexture(TARGET_MARBLE_TEXTURE_URLS);

  useEffect(() => {
    targetTextures.forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
    });
  }, [targetTextures]);

  const selectedTexture = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < marble.id.length; i++) {
      hash = (hash * 31 + marble.id.charCodeAt(i)) >>> 0;
    }
    return targetTextures[hash % targetTextures.length];
  }, [marble.id, targetTextures]);

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
  const targetLivePositions = useGameStore((s) => s.targetLivePositions);
  const marblesOutsideRing = useGameStore((s) => s.marblesOutsideRing);

  // Sync collected state if marble is marked outside ring in store
  useEffect(() => {
    if (marblesOutsideRing.includes(marble.id) && !isCollected) {
      isOutsideRef.current = true;
      setIsCollected(true);
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setEnabled(false);
      }
    }
  }, [marblesOutsideRing, marble.id, isCollected]);

  // Reconcile live position from network store (Guest synchronizes to Host authoritative coordinates)
  useEffect(() => {
    const remotePos = targetLivePositions[marble.id];
    if (remotePos && rigidBodyRef.current && !isCollected) {
      const cur = rigidBodyRef.current.translation();
      const diff = Math.hypot(cur.x - remotePos[0], cur.z - remotePos[2]);
      if (diff > 0.03) {
        rigidBodyRef.current.setTranslation({ x: remotePos[0], y: remotePos[1], z: remotePos[2] }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  }, [targetLivePositions, marble.id, isCollected]);

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
        {/* Polished Glass Target Marble with Green-Yellow / Orange-Cream Texture */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[marble.radius, 40, 40]} />
          <meshPhysicalMaterial
            map={selectedTexture}
            roughness={0.06}
            metalness={0.02}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            reflectivity={0.94}
            ior={1.52}
          />
        </mesh>
      </group>
    </RigidBody>
  );
};
