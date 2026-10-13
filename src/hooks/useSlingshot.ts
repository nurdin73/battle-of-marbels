import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';
import { ARENA_CONFIG } from '../constants/physics.constants';
import { marbleAudio } from '../utils/soundSynth.utils';
import { calculateParabolicTrajectory } from '../utils/trajectory.utils';

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

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // Only allow aiming when game is IDLE
      if (aimingState !== 'IDLE') return;

      e.stopPropagation();
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
        // Calculate non-linear impulse force J = Jmin + (d/dmax)^p * (Jmax - Jmin)
        const ratio = distance / ARENA_CONFIG.maxDragDistance;
        const powerScale = Math.pow(ratio, ARENA_CONFIG.forceExponent);
        const impulseMagnitude =
          ARENA_CONFIG.minImpulse +
          powerScale * (ARENA_CONFIG.maxImpulse - ARENA_CONFIG.minImpulse);

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

        const trajectory = calculateParabolicTrajectory(
          shooterOrigin,
          { x: vector.x, y: 0, z: vector.z },
          percentage,
          activeTargets,
          ARENA_CONFIG.marbleRadius
        );

        const distHypot = Math.hypot(vector.x, vector.z) || 1;
        const normX = vector.x / distHypot;
        const normZ = vector.z / distHypot;

        // Set up active flight data for smooth, visible arching flight
        const flightDuration = 0.55 + ratio * 0.40;
        setFlightData({
          origin: [shooterOrigin.x, shooterOrigin.y, shooterOrigin.z],
          landingPoint: trajectory.landingPoint,
          apexHeight: trajectory.apexHeight,
          direction: { x: normX, z: normZ },
          impulseMagnitude,
          hitTargetId: trajectory.hitTargetId,
          isHit: trajectory.isHit,
          duration: flightDuration,
        });

        // Put rigid-body to sleep while airborne to prevent physics interference during flight
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.sleep();

        // Sound & state
        marbleAudio.playLaunchSound(ratio);
        recordFlick();
        setAimingState('AIRBORNE');
      } else {
        // Cancelled pull
        setAimingState('IDLE');
      }

      clearDrag();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, camera, rigidBodyRef, setDrag, clearDrag, setFlightData, recordFlick, setAimingState]);

  return {
    onPointerDown,
  };
}
