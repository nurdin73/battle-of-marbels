import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BallCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { ARENA_CONFIG, MARBLE_PHYSICAL_CONFIGS, SCENE_PERIMETER_BOUNDS } from '../../constants/physics.constants';
import { useMultiplayerStore, INITIAL_P1_POS, INITIAL_P2_POS } from '../../store/useMultiplayerStore';
import { useGameStore } from '../../store/useGameStore';
import { useSlingshot } from '../../hooks/useSlingshot';
import { marbleAudio } from '../../utils/soundSynth.utils';

export const MultiplayerGacoans: React.FC = () => {
  const p1RigidBodyRef = useRef<RapierRigidBody>(null);
  const p2RigidBodyRef = useRef<RapierRigidBody>(null);

  const role = useMultiplayerStore((s) => s.role);
  const localPlayer = useMultiplayerStore((s) => s.localPlayer);
  const remotePlayer = useMultiplayerStore((s) => s.remotePlayer);
  const matchPhase = useMultiplayerStore((s) => s.matchPhase);
  const currentTurnPlayerId = useMultiplayerStore((s) => s.currentTurnPlayerId);
  const cameraFocusMode = useMultiplayerStore((s) => s.cameraFocusMode);
  const broadcastRestState = useMultiplayerStore((s) => s.broadcastRestState);

  const aimingState = useGameStore((s) => s.aimingState);
  const setAimingState = useGameStore((s) => s.setAimingState);
  const triggerEvaluation = useGameStore((s) => s.triggerEvaluation);
  const evaluateTurnOutcome = useGameStore((s) => s.evaluateTurnOutcome);

  const isHost = role === 'HOST';
  const isMyTurn = currentTurnPlayerId === localPlayer.id;

  const tossShotDoneP1 = useMultiplayerStore((s) => s.tossShotDoneP1);
  const tossShotDoneP2 = useMultiplayerStore((s) => s.tossShotDoneP2);
  const tossBannerMessage = useMultiplayerStore((s) => s.tossBannerMessage);

  // Still frame counters and timers for resting and out-of-bounds detection
  const simulatingFramesRef = useRef<number>(0);
  const stillFramesRef = useRef<number>(0);
  const outOfBoundsTimerRef = useRef<number>(0);
  const simulatingDurationRef = useRef<number>(0);

  // Active rigid body for slingshot: attaches to P1 if Host, P2 if Guest
  const activeLocalRigidBody = isHost ? p1RigidBodyRef : p2RigidBodyRef;
  const { onPointerDown } = useSlingshot(activeLocalRigidBody);

  const physicalConfig = MARBLE_PHYSICAL_CONFIGS.GLASS_CLASSIC;

  // Listen to remote shots and rest state reconciliation
  useEffect(() => {
    const mpStore = useMultiplayerStore.getState();

    // Remote match shot
    mpStore.setRemoteShotListener((payload) => {
      const targetBody = isHost ? p2RigidBodyRef.current : p1RigidBodyRef.current;
      if (!targetBody) return;

      targetBody.setTranslation(
        { x: payload.originPosition.x, y: payload.originPosition.y, z: payload.originPosition.z },
        true
      );
      targetBody.wakeUp();
      targetBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      targetBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
      targetBody.applyImpulse(payload.impulse, true);
      marbleAudio.playLaunchSound(0.7);
      setAimingState('SIMULATING');
    });

    // Remote toss shot
    mpStore.setRemoteTossListener((payload) => {
      const targetBody = isHost ? p2RigidBodyRef.current : p1RigidBodyRef.current;
      if (!targetBody) return;

      targetBody.setTranslation(
        { x: payload.originPosition.x, y: payload.originPosition.y, z: payload.originPosition.z },
        true
      );
      targetBody.wakeUp();
      targetBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      targetBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
      targetBody.applyImpulse(payload.impulse, true);
    });

    // Remote rest state reconciliation (Guest reconciles positions from Host)
    mpStore.setRemoteRestStateListener((payload) => {
      if (!isHost) {
        if (p1RigidBodyRef.current) {
          p1RigidBodyRef.current.setTranslation(
            { x: payload.gacoanP1Position[0], y: payload.gacoanP1Position[1], z: payload.gacoanP1Position[2] },
            true
          );
        }
        if (p2RigidBodyRef.current) {
          p2RigidBodyRef.current.setTranslation(
            { x: payload.gacoanP2Position[0], y: payload.gacoanP2Position[1], z: payload.gacoanP2Position[2] },
            true
          );
        }
      }
    });

    return () => {
      mpStore.setRemoteShotListener(null);
      mpStore.setRemoteRestStateListener(null);
      mpStore.setRemoteTossListener(null);
    };
  }, [isHost, setAimingState]);

  const tossResolutionScheduledRef = useRef<boolean>(false);
  const tossStillFramesRef = useRef<number>(0);
  const tossSimulatingFramesRef = useRef<number>(0);

  useEffect(() => {
    if (matchPhase === 'TOSS_PHASE') {
      tossResolutionScheduledRef.current = false;
      tossStillFramesRef.current = 0;
      tossSimulatingFramesRef.current = 0;
      // Reposition both gacoans physically back to original starting coordinates
      if (p1RigidBodyRef.current) {
        p1RigidBodyRef.current.setTranslation({ x: INITIAL_P1_POS[0], y: INITIAL_P1_POS[1], z: INITIAL_P1_POS[2] }, true);
        p1RigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        p1RigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
      if (p2RigidBodyRef.current) {
        p2RigidBodyRef.current.setTranslation({ x: INITIAL_P2_POS[0], y: INITIAL_P2_POS[1], z: INITIAL_P2_POS[2] }, true);
        p2RigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        p2RigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
      useGameStore.getState().updateGacoanPos(isHost ? INITIAL_P1_POS : INITIAL_P2_POS);
    }
  }, [matchPhase, isHost]);

  // Frame monitoring for ball resting & turn transition
  useFrame((_, delta) => {
    // 1. Real-time gacoan coordinate synchronization to game store for CameraController tracking
    const localRigidBody = isHost ? p1RigidBodyRef.current : p2RigidBodyRef.current;
    const opponentRigidBody = isHost ? p2RigidBodyRef.current : p1RigidBodyRef.current;

    // Determine which gacoan the camera should track:
    // - If cameraFocusMode is 'OPPONENT' or ('AUTO' during opponent's turn), track opponent in real time
    // - Otherwise track local gacoan
    const shouldTrackOpponent =
      cameraFocusMode === 'OPPONENT' || (cameraFocusMode === 'AUTO' && !isMyTurn && matchPhase === 'PLAYING');
    const trackedRigidBody = shouldTrackOpponent ? opponentRigidBody : localRigidBody;

    if (trackedRigidBody) {
      const trans = trackedRigidBody.translation();
      useGameStore.getState().updateGacoanPos([trans.x, trans.y, trans.z]);
    }

    // 2. Direct Toss Phase resolution: strictly wait for BOTH gacoan balls to completely settle before announcing winner
    if (matchPhase === 'TOSS_PHASE') {
      if (isHost && tossShotDoneP1 && tossShotDoneP2 && !tossResolutionScheduledRef.current) {
        tossSimulatingFramesRef.current += 1;

        const vel1 = p1RigidBodyRef.current?.linvel() || { x: 0, y: 0, z: 0 };
        const vel2 = p2RigidBodyRef.current?.linvel() || { x: 0, y: 0, z: 0 };
        const speed1 = Math.hypot(vel1.x, vel1.y, vel1.z);
        const speed2 = Math.hypot(vel2.x, vel2.y, vel2.z);
        const maxSpeed = Math.max(speed1, speed2);

        // Keep dynamic banner updated while waiting for physics to settle
        if (tossBannerMessage !== '⏳ Menunggu kedua gacoan berhenti bergulir...') {
          useMultiplayerStore.setState({
            tossBannerMessage: '⏳ Menunggu kedua gacoan berhenti bergulir...',
          });
        }

        // Both gacoans must have slowed down below rest threshold
        // Require > 15 simulating frames first to allow impulses to register
        if (maxSpeed < ARENA_CONFIG.restVelocityThreshold && tossSimulatingFramesRef.current > 15) {
          tossStillFramesRef.current += 1;
        } else {
          tossStillFramesRef.current = 0;
        }

        // Safety watchdog: max ~9 seconds (540 frames) in case of micro-jitter
        const isWatchdogTriggered = tossSimulatingFramesRef.current > 540;

        // Only declare toss winner once BOTH gacoans have been completely still for 25 consecutive frames (~0.4s)
        if (tossStillFramesRef.current >= 25 || isWatchdogTriggered) {
          tossResolutionScheduledRef.current = true;

          // Halt velocities completely
          p1RigidBodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
          p1RigidBodyRef.current?.setAngvel({ x: 0, y: 0, z: 0 }, true);
          p2RigidBodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
          p2RigidBodyRef.current?.setAngvel({ x: 0, y: 0, z: 0 }, true);

          const t1 = p1RigidBodyRef.current?.translation();
          const t2 = p2RigidBodyRef.current?.translation();
          const p1Pos: [number, number, number] = t1 ? [t1.x, t1.y, t1.z] : [-0.25, ARENA_CONFIG.marbleRadius, 2.3];
          const p2Pos: [number, number, number] = t2 ? [t2.x, t2.y, t2.z] : [0.25, ARENA_CONFIG.marbleRadius, 2.3];

          // Calculate distances to circle ring line (R = 1.8)
          const d1 = Math.abs(Math.hypot(p1Pos[0], p1Pos[2]) - ARENA_CONFIG.ringRadius);
          const d2 = Math.abs(Math.hypot(p2Pos[0], p2Pos[2]) - ARENA_CONFIG.ringRadius);
          const firstTurnId = d1 <= d2 ? localPlayer.id : remotePlayer?.id || localPlayer.id;

          // Broadcast toss result — KEEP matchPhase in TOSS_PHASE so target marbles don't spawn prematurely!
          useMultiplayerStore.setState({
            matchPhase: 'TOSS_PHASE',
            currentTurnPlayerId: firstTurnId,
            gacoanP1Pos: p1Pos,
            gacoanP2Pos: p2Pos,
            tossResult: { firstTurnPlayerId: firstTurnId, p1Distance: d1, p2Distance: d2 },
            tossBannerMessage: `🎉 ${d1 <= d2 ? localPlayer.name : remotePlayer?.name || 'Lawan'} LEBIH DEKAT (${d1.toFixed(2)}m vs ${d2.toFixed(2)}m)! GILIRAN PERTAMA!`,
          });

          import('../../services/peerService').then(({ peerService }) => {
            peerService.sendMessage({
              type: 'TOSS_RESULT',
              payload: { firstTurnPlayerId: firstTurnId, p1Distance: d1, p2Distance: d2 },
            });
          });

          setAimingState('IDLE');

          // Once celebratory banner completes (3.5s), officially start PLAYING and spawn target marbles!
          setTimeout(() => {
            useMultiplayerStore.setState({
              matchPhase: 'PLAYING',
              tossBannerMessage: null,
            });
            import('../../services/peerService').then(({ peerService }) => {
              peerService.sendMessage({
                type: 'MATCH_PLAYING_START',
              });
            });
            setAimingState('IDLE');
          }, 3500);
        }
      }
      return;
    }

    // 3. Official match simulation & rest detection (only in PLAYING phase)
    if (aimingState !== 'SIMULATING') {
      simulatingFramesRef.current = 0;
      stillFramesRef.current = 0;
      outOfBoundsTimerRef.current = 0;
      simulatingDurationRef.current = 0;
      return;
    }

    simulatingFramesRef.current += 1;
    simulatingDurationRef.current += delta;

    const t1 = p1RigidBodyRef.current?.translation();
    const t2 = p2RigidBodyRef.current?.translation();

    // Out-of-Bounds Detection for both gacoans
    const isP1OOB = Boolean(
      t1 &&
        (Math.abs(t1.x) > SCENE_PERIMETER_BOUNDS.maxX ||
          Math.abs(t1.z) > SCENE_PERIMETER_BOUNDS.maxZ ||
          t1.y < SCENE_PERIMETER_BOUNDS.minY)
    );
    const isP2OOB = Boolean(
      t2 &&
        (Math.abs(t2.x) > SCENE_PERIMETER_BOUNDS.maxX ||
          Math.abs(t2.z) > SCENE_PERIMETER_BOUNDS.maxZ ||
          t2.y < SCENE_PERIMETER_BOUNDS.minY)
    );
    const isAnyOOB = isP1OOB || isP2OOB;

    // Helper to resolve match turn outcome and synchronize
    const resolveMatchOutcome = (forceResetP1OOB = false, forceResetP2OOB = false) => {
      setAimingState('EVALUATING');
      stillFramesRef.current = 0;
      simulatingFramesRef.current = 0;
      outOfBoundsTimerRef.current = 0;
      simulatingDurationRef.current = 0;

      // Halt physics velocities immediately
      p1RigidBodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
      p1RigidBodyRef.current?.setAngvel({ x: 0, y: 0, z: 0 }, true);
      p2RigidBodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
      p2RigidBodyRef.current?.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Reposition out-of-bounds gacoans to default legal starting positions
      if (forceResetP1OOB && p1RigidBodyRef.current) {
        p1RigidBodyRef.current.setTranslation({ x: INITIAL_P1_POS[0], y: INITIAL_P1_POS[1], z: INITIAL_P1_POS[2] }, true);
        p1RigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        p1RigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
      if (forceResetP2OOB && p2RigidBodyRef.current) {
        p2RigidBodyRef.current.setTranslation({ x: INITIAL_P2_POS[0], y: INITIAL_P2_POS[1], z: INITIAL_P2_POS[2] }, true);
        p2RigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        p2RigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }

      const delayMs = forceResetP1OOB || forceResetP2OOB ? 150 : 400;

      setTimeout(() => {
        triggerEvaluation();

        setTimeout(() => {
          const curT1 = p1RigidBodyRef.current?.translation();
          const curT2 = p2RigidBodyRef.current?.translation();
          const p1Pos: [number, number, number] = curT1 ? [curT1.x, curT1.y, curT1.z] : INITIAL_P1_POS;
          const p2Pos: [number, number, number] = curT2 ? [curT2.x, curT2.y, curT2.z] : INITIAL_P2_POS;

          const activePos = currentTurnPlayerId === localPlayer.id ? (isHost ? p1Pos : p2Pos) : (isHost ? p2Pos : p1Pos);

          // Read pocketed targets count BEFORE evaluateTurnOutcome resets targetsPocketedThisTurn!
          const targetsPocketed = useGameStore.getState().targetsPocketedThisTurnIds.length;
          evaluateTurnOutcome(activePos);

          // Host broadcasts authoritative rest-state
          if (isHost) {
            const mpStore = useMultiplayerStore.getState();
            const gameState = useGameStore.getState();
            const isCombo = gameState.lastTurnOutcome?.resultType === 'COMBO_EXTRA_TURN';
            const isHostTurn = mpStore.currentTurnPlayerId === mpStore.localPlayer.id;

            const nextScores = {
              host: isHostTurn ? mpStore.scores.host + targetsPocketed : mpStore.scores.host,
              guest: !isHostTurn ? mpStore.scores.guest + targetsPocketed : mpStore.scores.guest,
            };

            const isMatchOver =
              (nextScores.host + nextScores.guest) >= mpStore.targetCount ||
              gameState.marblesOutsideRing.length >= mpStore.targetCount;

            const nextTurnId = isCombo
              ? mpStore.currentTurnPlayerId!
              : isHostTurn
              ? (mpStore.remotePlayer?.id || mpStore.localPlayer.id)
              : mpStore.localPlayer.id;

            broadcastRestState({
              turnIndex: gameState.turnCount,
              gacoanP1Position: p1Pos,
              gacoanP2Position: p2Pos,
              targetPositions: gameState.targetLivePositions,
              marblesOutsideRing: gameState.marblesOutsideRing,
              scores: nextScores,
              nextTurnPlayerId: nextTurnId,
              isMatchOver,
            });

            if (isMatchOver) {
              useMultiplayerStore.setState({ isMatchOver: true });
            }
          }

          setAimingState('IDLE');
        }, 200);
      }, delayMs);
    };

    // If any gacoan is out of bounds, dampen velocity and trigger 2-second reset timer
    if (isAnyOOB) {
      if (isP1OOB && p1RigidBodyRef.current) {
        p1RigidBodyRef.current.setLinvel({ x: 0, y: Math.max(-0.4, p1RigidBodyRef.current.linvel().y), z: 0 }, true);
      }
      if (isP2OOB && p2RigidBodyRef.current) {
        p2RigidBodyRef.current.setLinvel({ x: 0, y: Math.max(-0.4, p2RigidBodyRef.current.linvel().y), z: 0 }, true);
      }
      outOfBoundsTimerRef.current += delta;

      if (outOfBoundsTimerRef.current >= SCENE_PERIMETER_BOUNDS.outOfBoundsResetDelaySeconds) {
        resolveMatchOutcome(isP1OOB, isP2OOB);
        return;
      }
    } else {
      outOfBoundsTimerRef.current = 0;
    }

    // Safety watchdog: if marbles keep rolling/jittering for > 7s, force settlement
    if (simulatingDurationRef.current >= SCENE_PERIMETER_BOUNDS.maxSimulationWatchdogSeconds) {
      resolveMatchOutcome(isP1OOB, isP2OOB);
      return;
    }

    // Standard rest velocity detection
    const vel1 = p1RigidBodyRef.current?.linvel() || { x: 0, y: 0, z: 0 };
    const vel2 = p2RigidBodyRef.current?.linvel() || { x: 0, y: 0, z: 0 };
    const speed1 = Math.hypot(vel1.x, vel1.y, vel1.z);
    const speed2 = Math.hypot(vel2.x, vel2.y, vel2.z);
    const maxSpeed = Math.max(speed1, speed2);

    if (maxSpeed < ARENA_CONFIG.restVelocityThreshold && simulatingFramesRef.current > 15) {
      stillFramesRef.current += 1;

      if (stillFramesRef.current > 20) {
        resolveMatchOutcome(false, false);
      }
    }
  });

  // Pointer down wrapper to handle Toss Phase and Playing Phase
  const handleGacoanPointerDown = (e: import('@react-three/fiber').ThreeEvent<PointerEvent>) => {
    if (matchPhase === 'TOSS_PHASE') {
      const isAlreadyTossed = isHost ? tossShotDoneP1 : tossShotDoneP2;
      if (isAlreadyTossed) {
        marbleAudio.playWoodKnockSound(0.8);
        return;
      }
      onPointerDown(e);
      return;
    }

    if (matchPhase === 'PLAYING') {
      if (!isMyTurn) {
        marbleAudio.playWoodKnockSound(0.8);
        return;
      }
      onPointerDown(e);
    }
  };

  return (
    <>
      {/* ======================================================== */}
      {/* GACOAN P1: TUAN RUMAH / HOST (BLUE BELIMBING VANE)        */}
      {/* ======================================================== */}
      <RigidBody
        ref={p1RigidBodyRef}
        colliders={false}
        position={[-0.25, ARENA_CONFIG.marbleRadius, 2.3]}
        mass={physicalConfig.mass}
        restitution={physicalConfig.restitution}
        friction={physicalConfig.frictionDynamic}
        linearDamping={physicalConfig.linearDamping}
        angularDamping={physicalConfig.angularDamping}
      >
        <BallCollider args={[ARENA_CONFIG.marbleRadius]} />

        <group onPointerDown={isHost ? handleGacoanPointerDown : undefined}>
          {/* Click target mesh */}
          <mesh>
            <sphereGeometry args={[ARENA_CONFIG.marbleRadius * 2.5, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Translucent Glass Sphere */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[ARENA_CONFIG.marbleRadius, 32, 32]} />
            <meshPhysicalMaterial
              roughness={0.04}
              transmission={0.93}
              thickness={0.55}
              ior={1.53}
              clearcoat={1.0}
              attenuationColor={new THREE.Color('#38bdf8')}
              attenuationDistance={0.45}
            />
          </mesh>

          {/* Blue Core Swirls */}
          <mesh rotation={[0.48, 0.35, 0.15]}>
            <torusGeometry args={[ARENA_CONFIG.marbleRadius * 0.52, ARENA_CONFIG.marbleRadius * 0.18, 16, 24]} />
            <meshStandardMaterial color="#2563eb" roughness={0.2} metalness={0.2} />
          </mesh>
          <mesh rotation={[-0.45, -0.55, 0.9]}>
            <torusGeometry args={[ARENA_CONFIG.marbleRadius * 0.46, ARENA_CONFIG.marbleRadius * 0.14, 16, 24]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.25} metalness={0.15} />
          </mesh>

          {/* Active Player Ring Highlight */}
          {aimingState === 'IDLE' && (
            <mesh position={[0, -ARENA_CONFIG.marbleRadius + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[ARENA_CONFIG.marbleRadius * 1.3, ARENA_CONFIG.marbleRadius * 1.6, 32]} />
              <meshBasicMaterial
                color={
                  matchPhase === 'TOSS_PHASE'
                    ? (!tossShotDoneP1 ? '#3b82f6' : '#94a3b8')
                    : currentTurnPlayerId === (isHost ? localPlayer.id : remotePlayer?.id)
                    ? '#3b82f6'
                    : '#94a3b8'
                }
                transparent
                opacity={0.8}
              />
            </mesh>
          )}
        </group>
      </RigidBody>

      {/* ======================================================== */}
      {/* GACOAN P2: TAMU / GUEST (CRIMSON RED SWIRL)              */}
      {/* ======================================================== */}
      <RigidBody
        ref={p2RigidBodyRef}
        colliders={false}
        position={[0.25, ARENA_CONFIG.marbleRadius, 2.3]}
        mass={physicalConfig.mass}
        restitution={physicalConfig.restitution}
        friction={physicalConfig.frictionDynamic}
        linearDamping={physicalConfig.linearDamping}
        angularDamping={physicalConfig.angularDamping}
      >
        <BallCollider args={[ARENA_CONFIG.marbleRadius]} />

        <group onPointerDown={!isHost ? handleGacoanPointerDown : undefined}>
          {/* Click target mesh */}
          <mesh>
            <sphereGeometry args={[ARENA_CONFIG.marbleRadius * 2.5, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Translucent Glass Sphere */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[ARENA_CONFIG.marbleRadius, 32, 32]} />
            <meshPhysicalMaterial
              roughness={0.04}
              transmission={0.93}
              thickness={0.55}
              ior={1.53}
              clearcoat={1.0}
              attenuationColor={new THREE.Color('#f87171')}
              attenuationDistance={0.45}
            />
          </mesh>

          {/* Crimson Red Core Swirls */}
          <mesh rotation={[0.48, 0.35, 0.15]}>
            <torusGeometry args={[ARENA_CONFIG.marbleRadius * 0.52, ARENA_CONFIG.marbleRadius * 0.18, 16, 24]} />
            <meshStandardMaterial color="#dc2626" roughness={0.2} metalness={0.2} />
          </mesh>
          <mesh rotation={[-0.45, -0.55, 0.9]}>
            <torusGeometry args={[ARENA_CONFIG.marbleRadius * 0.46, ARENA_CONFIG.marbleRadius * 0.14, 16, 24]} />
            <meshStandardMaterial color="#f87171" roughness={0.25} metalness={0.15} />
          </mesh>

          {/* Active Player Ring Highlight */}
          {aimingState === 'IDLE' && (
            <mesh position={[0, -ARENA_CONFIG.marbleRadius + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[ARENA_CONFIG.marbleRadius * 1.3, ARENA_CONFIG.marbleRadius * 1.6, 32]} />
              <meshBasicMaterial
                color={
                  matchPhase === 'TOSS_PHASE'
                    ? (!tossShotDoneP2 ? '#ef4444' : '#94a3b8')
                    : currentTurnPlayerId === (!isHost ? localPlayer.id : remotePlayer?.id)
                    ? '#ef4444'
                    : '#94a3b8'
                }
                transparent
                opacity={0.8}
              />
            </mesh>
          )}
        </group>
      </RigidBody>
    </>
  );
};
