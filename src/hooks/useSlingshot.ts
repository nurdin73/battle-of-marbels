import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../store/useGameStore';
import { useCardStore } from '../store/useCardStore';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { ARENA_CONFIG } from '../constants/physics.constants';
import { marbleAudio } from '../utils/soundSynth.utils';
import { calculateTrajectory } from '../utils/trajectory.utils';
import { sweepPebblesInCorridor } from '../components/3d/BattlefieldPebbles';

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

      // Check for active tactical card modifiers (strictly disabled during multiplayer TOSS_PHASE)
      const multiplayerStore = useMultiplayerStore.getState();
      const isMultiplayerToss =
        multiplayerStore.isMultiplayerActive &&
        multiplayerStore.matchPhase === 'TOSS_PHASE';

      const cardStore = useCardStore.getState();
      const activeCardId = isMultiplayerToss ? null : cardStore.activeCardId;
      const activeCard = isMultiplayerToss
        ? undefined
        : cardStore.handCards.find((c) => c.id === activeCardId);

      let impulseMultiplier = 1.0;
      let distanceMultiplier = 1.0;
      let apexHeightMultiplier = 1.0;

      if (activeCard) {
        const mod = activeCard.modifier;
        if (mod.impulseMultiplier) impulseMultiplier = mod.impulseMultiplier;
        if (mod.trajectoryDistanceMultiplier) distanceMultiplier = mod.trajectoryDistanceMultiplier;
        if (mod.apexHeightMultiplier) apexHeightMultiplier = mod.apexHeightMultiplier;
        if (mod.swapMaterial) {
          storeState.setTemporaryGacoanMaterial(mod.swapMaterial);
        }
      }

      const effectiveImpulse = impulseMagnitude * impulseMultiplier;

      let shooterOrigin = {
        x: storeState.gacoanCurrentPos[0],
        y: storeState.gacoanCurrentPos[1],
        z: storeState.gacoanCurrentPos[2],
      };
      if (rigidBodyRef.current) {
        const trans = rigidBodyRef.current.translation();
        shooterOrigin = {
          x: trans.x,
          y: trans.y,
          z: trans.z,
        };
      }

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

      const performFlickRelease = () => {
        if (!rigidBodyRef.current) return;

        if (isLob) {
          // LOB MODE: Parabolic arch through the air (CARD_LOB exclusive)
          // Use exact aimed drag percentage so the flight landing point matches the player's aimed trajectory
          const aimedPercentage =
            storeState.drag.percentage > 0 ? storeState.drag.percentage : clampedPercentage;
          const trajectory = calculateTrajectory(
            shooterOrigin,
            {
              x: normX * ARENA_CONFIG.maxDragDistance,
              y: 0,
              z: normZ * ARENA_CONFIG.maxDragDistance,
            },
            aimedPercentage,
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

        // If multiplayer mode is active, broadcast shot to peer
        const multiplayerStore = useMultiplayerStore.getState();
        if (multiplayerStore.isMultiplayerActive) {
          if (multiplayerStore.matchPhase === 'TOSS_PHASE') {
            multiplayerStore.broadcastTossShot({
              turnIndex: 0,
              playerId: multiplayerStore.localPlayer.id,
              timestamp: Date.now(),
              impulse: {
                x: normX * effectiveImpulse,
                y: 0.0,
                z: normZ * effectiveImpulse,
              },
              originPosition: {
                x: shooterOrigin.x,
                y: shooterOrigin.y,
                z: shooterOrigin.z,
              },
            });
          } else {
            multiplayerStore.broadcastShot({
              turnIndex: storeState.turnCount,
              playerId: multiplayerStore.localPlayer.id,
              timestamp: Date.now(),
              impulse: {
                x: normX * effectiveImpulse,
                y: 0.0,
                z: normZ * effectiveImpulse,
              },
              originPosition: {
                x: shooterOrigin.x,
                y: shooterOrigin.y,
                z: shooterOrigin.z,
              },
              appliedCardId: activeCard?.id,
            });
          }
        }

        // Record active turn card in game store for battlefield simulation before consuming from hand
        if (activeCard) {
          storeState.setActiveTurnCard(activeCard);
          cardStore.consumeActiveCard();
        } else {
          storeState.setActiveTurnCard(null);
        }

        // Sound & state
        marbleAudio.playLaunchSound(ratio);
        recordFlick();
        if (isLob) {
          setAimingState('AIRBORNE');
        }
        clearDrag();
        setLockedDirection(null);
      };

      // CARD_BROOM: Perform active pre-launch sweeping sequence before gacoan release
      if (activeCard?.id === 'CARD_BROOM') {
        storeState.setIsBroomSweeping(true);
        storeState.setBroomSweepProgress(0);

        // Physically sweep pebbles away from the shooting lane corridor
        sweepPebblesInCorridor(
          { x: shooterOrigin.x, z: shooterOrigin.z },
          { x: normX, z: normZ },
          0.85,
          3.6
        );

        // Sweeping audio cue
        marbleAudio.playCollisionSound({
          materialType: 'MARBLE_STONE',
          relativeVelocity: 0.35,
        });

        const sweepDurationMs = 850;
        const sweepStart = performance.now();
        let secondSoundPlayed = false;

        const sweepInterval = setInterval(() => {
          const elapsed = performance.now() - sweepStart;
          const progress = Math.min(1.0, elapsed / sweepDurationMs);
          storeState.setBroomSweepProgress(progress);

          if (progress > 0.45 && !secondSoundPlayed) {
            secondSoundPlayed = true;
            marbleAudio.playCollisionSound({
              materialType: 'MARBLE_STONE',
              relativeVelocity: 0.4,
            });
            // Multi-pass sweep: re-clear corridor forward as broom advances
            sweepPebblesInCorridor(
              { x: shooterOrigin.x, z: shooterOrigin.z },
              { x: normX, z: normZ },
              0.85,
              3.6
            );
          }

          if (progress >= 1.0) {
            clearInterval(sweepInterval);
            storeState.setIsBroomSweeping(false);
            storeState.setBroomSweepProgress(0);
            performFlickRelease();
          }
        }, 16);
      } else {
        performFlickRelease();
      }
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

  const currentScreen = useGameStore((s) => s.currentScreen);

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const multiplayerStore = useMultiplayerStore.getState();
      // Only allow aiming when game is active (PLAYING) or multiplayer is active
      if (currentScreen !== 'PLAYING' && !multiplayerStore.isMultiplayerActive) return;

      const isMultiplayerToss = multiplayerStore.isMultiplayerActive && multiplayerStore.matchPhase === 'TOSS_PHASE';

      // In non-toss phase, require aimingState to be strictly IDLE
      if (!isMultiplayerToss && aimingState !== 'IDLE') return;

      // In multiplayer mode, validate turn or toss phase eligibility
      if (multiplayerStore.isMultiplayerActive) {
        if (multiplayerStore.matchPhase === 'TOSS_PHASE') {
          const isP1 = multiplayerStore.role === 'HOST';
          const alreadyTossed = isP1 ? multiplayerStore.tossShotDoneP1 : multiplayerStore.tossShotDoneP2;
          if (alreadyTossed) {
            marbleAudio.playWoodKnockSound(0.8);
            return;
          }
        } else {
          const isMyTurn = multiplayerStore.currentTurnPlayerId === multiplayerStore.localPlayer.id;
          if (!isMyTurn) {
            marbleAudio.playWoodKnockSound(0.8);
            return;
          }
        }
      }

      // Synchronize active marble position to game store for accurate camera & trajectory line
      if (rigidBodyRef.current) {
        const trans = rigidBodyRef.current.translation();
        useGameStore.setState({ gacoanCurrentPos: [trans.x, trans.y, trans.z] });
      }

      e.stopPropagation();
      marbleAudio.startAmbientSound();
      setIsDragging(true);
      setAimingState('AIMING');
    },
    [currentScreen, aimingState, setAimingState, rigidBodyRef]
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
