import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';
import { useCardStore } from '../store/useCardStore';
import { ARENA_CONFIG } from '../constants/physics.constants';
import { marbleAudio } from '../utils/soundSynth.utils';
import { calculateTrajectory } from '../utils/trajectory.utils';

export function useSlingshot(
  rigidBodyRef: React.RefObject<RapierRigidBody>
) {
  const { camera } = useThree();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -ARENA_CONFIG.marbleRadius));
  const planeIntersection = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());

  const aimingState = useGameStore((s) => s.aimingState);
  const setAimingState = useGameStore((s) => s.setAimingState);
  const setDrag = useGameStore((s) => s.setDrag);
  const clearDrag = useGameStore((s) => s.clearDrag);
  const setFlightData = useGameStore((s) => s.setFlightData);
  const recordFlick = useGameStore((s) => s.recordFlick);
  const setLockedDirection = useGameStore((s) => s.setLockedDirection);
  const setLaunchTriggerCallback = useGameStore((s) => s.setLaunchTriggerCallback);

  const executeLaunch = useCallback(
    (powerPercentage: number) => {
      if (!rigidBodyRef.current) return;
      const storeState = useGameStore.getState();
      const lockedDir = storeState.lockedDirection;
      if (!lockedDir) return;

      const clampedPercentage = Math.max(1, Math.min(100, Math.round(powerPercentage)));
      const ratio = clampedPercentage / 100;
      const powerScale = Math.pow(ratio, ARENA_CONFIG.forceExponent);
      const impulseMagnitude =
        ARENA_CONFIG.minImpulse +
        powerScale * (ARENA_CONFIG.maxImpulse - ARENA_CONFIG.minImpulse);

      // Check for active tactical card modifiers
      const cardStore = useCardStore.getState();
      const activeCardId = cardStore.activeCardId;
      const activeCard = cardStore.handCards.find((c) => c.id === activeCardId);

      let impulseMultiplier = 1.0;
      let distanceMultiplier = 1.0;
      let apexHeightMultiplier = 1.0;

      if (activeCard) {
        const mod = activeCard.modifier;
        if (mod.impulseMultiplier) impulseMultiplier = mod.impulseMultiplier;
        if (mod.trajectoryDistanceMultiplier) distanceMultiplier = mod.trajectoryDistanceMultiplier;
        if (mod.apexHeightMultiplier) apexHeightMultiplier = mod.apexHeightMultiplier;
        if (mod.swapMaterial) {
          storeState.setGacoanMaterial(mod.swapMaterial);
        }
      }

      const effectiveImpulse = impulseMagnitude * impulseMultiplier;

      const currentPos = storeState.gacoanCurrentPos;
      const shooterOrigin = {
        x: currentPos[0],
        y: currentPos[1],
        z: currentPos[2],
      };

      const activeTargets = storeState.targetMarbles
        .filter((m) => !storeState.marblesOutsideRing.includes(m.id))
        .map((m) => ({
          id: m.id,
          position: storeState.targetLivePositions[m.id] || m.initialPosition,
          radius: m.radius,
        }));

      const isLob = activeCard?.id === 'CARD_LOB';
      const normX = lockedDir.x;
      const normZ = lockedDir.z;

      if (isLob) {
        // LOB MODE: Parabolic arch through the air (CARD_LOB exclusive)
        const trajectory = calculateTrajectory(
          shooterOrigin,
          { x: normX * clampedPercentage, y: 0, z: normZ * clampedPercentage },
          clampedPercentage,
          activeTargets,
          ARENA_CONFIG.marbleRadius,
          {
            isLob,
            distanceMultiplier,
            apexHeightMultiplier,
          }
        );

        const flightDuration = 0.55 + ratio * 0.40;
        setFlightData({
          origin: [shooterOrigin.x, shooterOrigin.y, shooterOrigin.z],
          landingPoint: trajectory.landingPoint,
          apexHeight: trajectory.apexHeight,
          direction: { x: normX, z: normZ },
          impulseMagnitude: effectiveImpulse,
          hitTargetId: trajectory.hitTargetId,
          isHit: trajectory.isHit,
          duration: flightDuration,
        });

        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.sleep();

        setAimingState('AIRBORNE');
      } else {
        // AUTHENTIC GROUND ROLL: Native Rapier linear impulse directly on soil plane
        setFlightData(null);
        rigidBodyRef.current.wakeUp();
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.applyImpulse(
          {
            x: normX * effectiveImpulse,
            y: 0.0,
            z: normZ * effectiveImpulse,
          },
          true
        );

        setAimingState('SIMULATING');
      }

      // Consume active card after successful flick release
      if (activeCard) {
        cardStore.consumeActiveCard();
      }

      // Sound & state
      marbleAudio.playLaunchSound(ratio);
      recordFlick();
      setAimingState('AIRBORNE');
      clearDrag();
      setLockedDirection(null);
    },
    [rigidBodyRef, setFlightData, setAimingState, recordFlick, clearDrag, setLockedDirection]
  );

  // Register launch trigger callback in the global store
  useEffect(() => {
    setLaunchTriggerCallback(executeLaunch);
    return () => {
      setLaunchTriggerCallback(null);
    };
  }, [executeLaunch, setLaunchTriggerCallback]);

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // Only allow aiming when game is IDLE
      if (aimingState !== 'IDLE') return;

      e.stopPropagation();
      marbleAudio.startAmbientSound();
      setIsDragging(true);
      setAimingState('AIMING');
    },
    [aimingState, setAimingState]
  );

  // Global window pointer listeners to seamlessly track drags across the entire screen
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (evt: PointerEvent) => {
      // Convert screen client coordinates to Normalized Device Coordinates (NDC)
      const ndcX = (evt.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(evt.clientY / window.innerHeight) * 2 + 1;

      raycaster.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      if (raycaster.current.ray.intersectPlane(dragPlane.current, planeIntersection.current)) {
        const ptr = planeIntersection.current;
        const currentPos = useGameStore.getState().gacoanCurrentPos;
        let gacoanX = currentPos[0];
        let gacoanZ = currentPos[2];

        if (rigidBodyRef.current) {
          const translation = rigidBodyRef.current.translation();
          gacoanX = translation.x;
          gacoanZ = translation.z;
        }

        // Vector pointing FROM pointer TO gacoan (slingshot pull backward = aim forward)
        const deltaX = gacoanX - ptr.x;
        const deltaZ = gacoanZ - ptr.z;
        const dist = Math.hypot(deltaX, deltaZ);

        const clampedDist = Math.min(dist, ARENA_CONFIG.maxDragDistance);
        const percentage = Math.min(100, Math.round((clampedDist / ARENA_CONFIG.maxDragDistance) * 100));

        const dirX = dist > 0.001 ? (deltaX / dist) * clampedDist : 0;
        const dirZ = dist > 0.001 ? (deltaZ / dist) * clampedDist : 0;

        setDrag({ x: dirX, z: dirZ }, clampedDist, percentage);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);

      const storeState = useGameStore.getState();
      const currentDrag = storeState.drag;
      const { distance, vector, percentage } = currentDrag;

      if ((distance >= 0.03 || percentage >= 3) && rigidBodyRef.current) {
        // Lock the direction vector and enter CHARGING (oscillating power barometer) phase
        const distHypot = Math.hypot(vector.x, vector.z) || 1;
        const normX = vector.x / distHypot;
        const normZ = vector.z / distHypot;

        setLockedDirection({ x: normX, z: normZ });
        setAimingState('CHARGING');
      } else {
        // Cancelled pull (too small or accidental tap)
        setAimingState('IDLE');
        clearDrag();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, camera, rigidBodyRef, setDrag, clearDrag, setAimingState, setLockedDirection]);

  return {
    onPointerDown,
  };
}
