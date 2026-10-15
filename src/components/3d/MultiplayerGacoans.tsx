import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { BallCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { ARENA_CONFIG, MARBLE_PHYSICAL_CONFIGS, SCENE_PERIMETER_BOUNDS } from '../../constants/physics.constants';
import { useMultiplayerStore, INITIAL_P1_POS, INITIAL_P2_POS } from '../../store/useMultiplayerStore';
import { useGameStore } from '../../store/useGameStore';
import { useSlingshot } from '../../hooks/useSlingshot';
import { marbleAudio } from '../../utils/soundSynth.utils';
import {
  isBodyAtRest,
  resolveTossWinner,
  Position3,
  TOSS_REQUIRED_STILL_SECONDS,
  TOSS_WATCHDOG_SECONDS,
} from './multiplayer-toss.utils';
import { areAllTargetsAtRest } from './targetPhysicsRegistry';
import { GacoanTutorialHint } from './GacoanTutorialHint';

const P1_MARBLE_TEXTURE_URL = '/assets/textures/marble-blue-white.png';
const P2_MARBLE_TEXTURE_URL = '/assets/textures/marble-red-teal.png';
useTexture.preload(P1_MARBLE_TEXTURE_URL);
useTexture.preload(P2_MARBLE_TEXTURE_URL);

export const MultiplayerGacoans: React.FC = () => {
  const p1Texture = useTexture(P1_MARBLE_TEXTURE_URL);
  const p2Texture = useTexture(P2_MARBLE_TEXTURE_URL);

  useEffect(() => {
    p1Texture.colorSpace = THREE.SRGBColorSpace;
    p2Texture.colorSpace = THREE.SRGBColorSpace;
  }, [p1Texture, p2Texture]);

  const p1RigidBodyRef = useRef<RapierRigidBody>(null);
  const p2RigidBodyRef = useRef<RapierRigidBody>(null);
  const p1BadgeRef = useRef<THREE.Group>(null);
  const p1GroundAuraRef = useRef<THREE.Group>(null);
  const p2BadgeRef = useRef<THREE.Group>(null);
  const p2GroundAuraRef = useRef<THREE.Group>(null);

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

  // Still timers for 100% rest and out-of-bounds detection during PLAYING phase
  const matchStillSecondsRef = useRef<number>(0);
  const matchSimulatingSecondsRef = useRef<number>(0);
  const outOfBoundsTimerRef = useRef<number>(0);

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
  // Time-based (seconds, via useFrame delta) so behaviour is identical on 60Hz and 144Hz displays
  const tossStillSecondsRef = useRef<number>(0);
  const tossElapsedSecondsRef = useRef<number>(0);

  useEffect(() => {
    if (matchPhase === 'TOSS_PHASE') {
      tossResolutionScheduledRef.current = false;
      tossStillSecondsRef.current = 0;
      tossElapsedSecondsRef.current = 0;
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

  // Guest: snap both gacoans to the Host-authoritative positions used to decide the toss winner,
  // so both screens show exactly the state the result was computed from.
  const tossResult = useMultiplayerStore((s) => s.tossResult);
  useEffect(() => {
    if (isHost || !tossResult) return;
    const snap = (body: RapierRigidBody | null, pos: Position3) => {
      if (!body) return;
      body.setTranslation({ x: pos[0], y: pos[1], z: pos[2] }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    };
    snap(p1RigidBodyRef.current, tossResult.p1Position);
    snap(p2RigidBodyRef.current, tossResult.p2Position);
  }, [isHost, tossResult]);

  // Frame monitoring for ball resting & turn transition
  useFrame((_, delta) => {
    const gacoanR = ARENA_CONFIG.gacoanMarbleRadius;

    // 0. Synchronize decoupled badge and ground aura positions (strictly isolates them from marble 3D rotation)
    const transP1 = p1RigidBodyRef.current?.translation();
    if (transP1) {
      if (p1BadgeRef.current) {
        p1BadgeRef.current.position.set(transP1.x, transP1.y + gacoanR + 0.14, transP1.z);
      }
      if (p1GroundAuraRef.current) {
        p1GroundAuraRef.current.position.set(transP1.x, 0.002, transP1.z);
      }
    }

    const transP2 = p2RigidBodyRef.current?.translation();
    if (transP2) {
      if (p2BadgeRef.current) {
        p2BadgeRef.current.position.set(transP2.x, transP2.y + gacoanR + 0.14, transP2.z);
      }
      if (p2GroundAuraRef.current) {
        p2GroundAuraRef.current.position.set(transP2.x, 0.002, transP2.z);
      }
    }

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
        const body1 = p1RigidBodyRef.current;
        const body2 = p2RigidBodyRef.current;
        if (!body1 || !body2) return;

        tossElapsedSecondsRef.current += delta;

        const p1AtRest = isBodyAtRest(body1.linvel(), body1.angvel(), body1.isSleeping());
        const p2AtRest = isBodyAtRest(body2.linvel(), body2.angvel(), body2.isSleeping());

        // Keep dynamic banner updated while waiting for physics to settle
        if (tossBannerMessage !== '⏳ Menunggu kedua gacoan berhenti bergulir...') {
          useMultiplayerStore.setState({
            tossBannerMessage: '⏳ Menunggu kedua gacoan berhenti bergulir...',
          });
        }

        // Both gacoans must stay at rest CONTINUOUSLY; any movement resets the timer
        tossStillSecondsRef.current = p1AtRest && p2AtRest ? tossStillSecondsRef.current + delta : 0;

        const isSettled = tossStillSecondsRef.current >= TOSS_REQUIRED_STILL_SECONDS;
        const isWatchdogTriggered = tossElapsedSecondsRef.current >= TOSS_WATCHDOG_SECONDS;

        if (isSettled || isWatchdogTriggered) {
          tossResolutionScheduledRef.current = true;

          // Read real resting positions — no forced velocity halt beforehand
          const t1 = body1.translation();
          const t2 = body2.translation();
          const p1Pos: Position3 = [t1.x, t1.y, t1.z];
          const p2Pos: Position3 = [t2.x, t2.y, t2.z];

          if (isWatchdogTriggered && !isSettled) {
            console.warn('[Toss] Watchdog resolved toss before both gacoans fully settled', {
              p1: { lin: body1.linvel(), ang: body1.angvel(), sleeping: body1.isSleeping() },
              p2: { lin: body2.linvel(), ang: body2.angvel(), sleeping: body2.isSleeping() },
            });
          }
          console.debug('[Toss] resolved', {
            elapsed: tossElapsedSecondsRef.current.toFixed(2),
            p1Sleeping: body1.isSleeping(),
            p2Sleeping: body2.isSleeping(),
            p1Pos,
            p2Pos,
          });

          const { winner, d1, d2 } = resolveTossWinner(p1Pos, p2Pos);
          const firstTurnId = winner === 'P1' ? localPlayer.id : remotePlayer?.id || localPlayer.id;
          const resultPayload = {
            firstTurnPlayerId: firstTurnId,
            p1Distance: d1,
            p2Distance: d2,
            p1Position: p1Pos,
            p2Position: p2Pos,
          };

          // Broadcast toss result — KEEP matchPhase in TOSS_PHASE so target marbles don't spawn prematurely!
          useMultiplayerStore.setState({
            matchPhase: 'TOSS_PHASE',
            currentTurnPlayerId: firstTurnId,
            gacoanP1Pos: p1Pos,
            gacoanP2Pos: p2Pos,
            tossResult: resultPayload,
            tossBannerMessage: `🎉 ${winner === 'P1' ? localPlayer.name : remotePlayer?.name || 'Lawan'} LEBIH DEKAT (${d1.toFixed(2)}m vs ${d2.toFixed(2)}m)! GILIRAN PERTAMA!`,
          });

          import('../../services/peerService').then(({ peerService }) => {
            peerService.sendMessage({
              type: 'TOSS_RESULT',
              payload: resultPayload,
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
      matchStillSecondsRef.current = 0;
      matchSimulatingSecondsRef.current = 0;
      outOfBoundsTimerRef.current = 0;
      return;
    }

    matchSimulatingSecondsRef.current += delta;

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
      matchStillSecondsRef.current = 0;
      matchSimulatingSecondsRef.current = 0;
      outOfBoundsTimerRef.current = 0;

      // Halt physics velocities to settle resting coordinates
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

    // Safety watchdog: if marbles keep rolling/jittering indefinitely, force settlement after 20s
    const MATCH_WATCHDOG_MAX_SECONDS = 20.0;
    if (matchSimulatingSecondsRef.current >= MATCH_WATCHDOG_MAX_SECONDS) {
      console.warn('[Match] Watchdog resolved turn before all marbles fully settled');
      resolveMatchOutcome(isP1OOB, isP2OOB);
      return;
    }

    // 100% COMPLETE REST VERIFICATION:
    // Requires BOTH gacoan marbles AND ALL active target marbles in the arena to stop moving
    const b1 = p1RigidBodyRef.current;
    const b2 = p2RigidBodyRef.current;
    const p1AtRest = b1 ? isBodyAtRest(b1.linvel(), b1.angvel(), b1.isSleeping()) : true;
    const p2AtRest = b2 ? isBodyAtRest(b2.linvel(), b2.angvel(), b2.isSleeping()) : true;
    const targetsAtRest = areAllTargetsAtRest();

    const allMarblesAtRest = p1AtRest && p2AtRest && targetsAtRest;

    // Minimum simulation duration buffer (0.45s) ensures the initial slingshot impulse has registered
    const MATCH_MIN_SIMULATION_SECONDS = 0.45;
    const MATCH_REQUIRED_STILL_SECONDS = 0.85;

    if (matchSimulatingSecondsRef.current >= MATCH_MIN_SIMULATION_SECONDS) {
      if (allMarblesAtRest) {
        matchStillSecondsRef.current += delta;
        if (matchStillSecondsRef.current >= MATCH_REQUIRED_STILL_SECONDS) {
          resolveMatchOutcome(false, false);
        }
      } else {
        matchStillSecondsRef.current = 0;
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

  const gacoanR = ARENA_CONFIG.gacoanMarbleRadius;

  const isP1Turn =
    matchPhase === 'TOSS_PHASE'
      ? !tossShotDoneP1
      : currentTurnPlayerId === (isHost ? localPlayer.id : remotePlayer?.id);

  const isP2Turn =
    matchPhase === 'TOSS_PHASE'
      ? !tossShotDoneP2
      : currentTurnPlayerId === (!isHost ? localPlayer.id : remotePlayer?.id);

  const p1DisplayName = isHost
    ? `${localPlayer.name} (Kamu)`
    : `${remotePlayer?.name || 'Tuan Rumah'} (Tuan Rumah)`;

  const p2DisplayName = !isHost
    ? `${localPlayer.name} (Kamu)`
    : `${remotePlayer?.name || 'Tamu'} (Lawan)`;

  return (
    <>
      {/* ======================================================== */}
      {/* GACOAN P1: TUAN RUMAH / HOST (BLUE BELIMBING VANE)        */}
      {/* ======================================================== */}
      <RigidBody
        ref={p1RigidBodyRef}
        colliders={false}
        position={[-0.25, gacoanR, 2.3]}
        mass={physicalConfig.mass}
        restitution={physicalConfig.restitution}
        friction={physicalConfig.frictionDynamic}
        linearDamping={physicalConfig.linearDamping}
        angularDamping={physicalConfig.angularDamping}
      >
        <BallCollider args={[gacoanR]} />

        <group onPointerDown={isHost ? handleGacoanPointerDown : undefined}>
          {/* Click target mesh */}
          <mesh>
            <sphereGeometry args={[gacoanR * 2.5, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Polished Glass Marble with Blue-White Texture */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[gacoanR, 48, 48]} />
            <meshPhysicalMaterial
              map={p1Texture}
              roughness={0.06}
              metalness={0.02}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              reflectivity={0.96}
              ior={1.53}
            />
          </mesh>
        </group>
      </RigidBody>

      {/* ======================================================== */}
      {/* GACOAN P2: TAMU / GUEST (CRIMSON RED SWIRL)              */}
      {/* ======================================================== */}
      <RigidBody
        ref={p2RigidBodyRef}
        colliders={false}
        position={[0.25, gacoanR, 2.3]}
        mass={physicalConfig.mass}
        restitution={physicalConfig.restitution}
        friction={physicalConfig.frictionDynamic}
        linearDamping={physicalConfig.linearDamping}
        angularDamping={physicalConfig.angularDamping}
      >
        <BallCollider args={[gacoanR]} />

        <group onPointerDown={!isHost ? handleGacoanPointerDown : undefined}>
          {/* Click target mesh */}
          <mesh>
            <sphereGeometry args={[gacoanR * 2.5, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Polished Glass Marble with Red-Teal Texture */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[gacoanR, 48, 48]} />
            <meshPhysicalMaterial
              map={p2Texture}
              roughness={0.06}
              metalness={0.02}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              reflectivity={0.96}
              ior={1.53}
            />
          </mesh>
        </group>
      </RigidBody>

      {/* ======================================================== */}
      {/* ORIENTATION-STABILIZED OVERLAYS (GROUND AURAS & 3D BADGES) */}
      {/* Strictly decoupled from rolling physics so they never roll */}
      {/* ======================================================== */}

      {/* P1 Ground Aura Disc (Flat on dirt floor) */}
      <group ref={p1GroundAuraRef} position={[-0.25, 0.002, 2.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[gacoanR * 1.15, gacoanR * 1.65, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={isP1Turn ? 0.85 : 0.35}
          />
        </mesh>
        <mesh position={[0, 0, -0.001]}>
          <circleGeometry args={[gacoanR * 1.65, 32]} />
          <meshBasicMaterial
            color="#0284c7"
            transparent
            opacity={isP1Turn ? 0.28 : 0.08}
          />
        </mesh>
      </group>

      {/* P1 Floating 3D Identity Badge (Upright above marble with inverted triangle pointer) */}
      <group ref={p1BadgeRef} position={[-0.25, gacoanR * 2 + 0.14, 2.3]}>
        <Html
          center
          distanceFactor={5}
          className="pointer-events-none select-none"
        >
          <div
            data-testid="badge-gacoan-p1"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {/* Pure Player Name Text (No Card Background) */}
            <span
              style={{
                color: '#38bdf8',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                lineHeight: 1,
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.95), 0 0 5px rgba(0, 0, 0, 0.85)',
              }}
            >
              {p1DisplayName}
            </span>

            {/* Inverted Triangle Pointer Chevron */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '3.5px solid transparent',
                borderRight: '3.5px solid transparent',
                borderTop: `5px solid ${isP1Turn ? '#38bdf8' : 'rgba(56, 189, 248, 0.85)'}`,
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.9))',
              }}
            />
          </div>
        </Html>
      </group>

      {/* P2 Ground Aura Disc (Flat on dirt floor) */}
      <group ref={p2GroundAuraRef} position={[0.25, 0.002, 2.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[gacoanR * 1.15, gacoanR * 1.65, 32]} />
          <meshBasicMaterial
            color="#f87171"
            transparent
            opacity={isP2Turn ? 0.85 : 0.35}
          />
        </mesh>
        <mesh position={[0, 0, -0.001]}>
          <circleGeometry args={[gacoanR * 1.65, 32]} />
          <meshBasicMaterial
            color="#b91c1c"
            transparent
            opacity={isP2Turn ? 0.28 : 0.08}
          />
        </mesh>
      </group>

      {/* P2 Floating 3D Identity Badge (Upright above marble with inverted triangle pointer) */}
      <group ref={p2BadgeRef} position={[0.25, gacoanR * 2 + 0.14, 2.3]}>
        <Html
          center
          distanceFactor={5}
          className="pointer-events-none select-none"
        >
          <div
            data-testid="badge-gacoan-p2"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {/* Pure Player Name Text (No Card Background) */}
            <span
              style={{
                color: '#f87171',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                lineHeight: 1,
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.95), 0 0 5px rgba(0, 0, 0, 0.85)',
              }}
            >
              {p2DisplayName} {isP2Turn ? '⚡' : ''}
            </span>

            {/* Inverted Triangle Pointer Chevron */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '3.5px solid transparent',
                borderRight: '3.5px solid transparent',
                borderTop: `5px solid ${isP2Turn ? '#f87171' : 'rgba(248, 113, 113, 0.85)'}`,
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.9))',
              }}
            />
          </div>
        </Html>
      </group>

      {/* Signature Initial Game Tutorial Hint for Local Player Gacoan */}
      <GacoanTutorialHint
        position={isHost ? INITIAL_P1_POS : INITIAL_P2_POS}
        marbleRadius={gacoanR}
        visible={matchPhase === 'TOSS_PHASE' && (isHost ? !tossShotDoneP1 : !tossShotDoneP2) && aimingState === 'IDLE'}
      />
    </>
  );
};
