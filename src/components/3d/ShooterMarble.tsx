import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { BallCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import {
  ARENA_CONFIG,
  MARBLE_PHYSICAL_CONFIGS,
  GAMEPLAY_CONFIG,
  SCENE_PERIMETER_BOUNDS,
} from '../../constants/physics.constants';
import { useGameStore } from '../../store/useGameStore';
import { useSlingshot } from '../../hooks/useSlingshot';
import { marbleAudio } from '../../utils/soundSynth.utils';
import { applyMagneticAttraction } from './targetPhysicsRegistry';

const INITIAL_SHOOTER_POS: [number, number, number] = GAMEPLAY_CONFIG.foulResetPosition;
const MARBLE_RED_TEAL_TEXTURE_URL = '/assets/textures/marble-red-teal.png';
useTexture.preload(MARBLE_RED_TEAL_TEXTURE_URL);

export const ShooterMarble: React.FC = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const badgeRef = useRef<THREE.Group>(null);
  const groundAuraRef = useRef<THREE.Group>(null);
  const stillFrameCountRef = useRef<number>(0);
  const simulatingFrameCountRef = useRef<number>(0);
  const flightProgressRef = useRef<number>(0);
  const outOfSceneTimerRef = useRef<number>(0);
  const simulatingDurationRef = useRef<number>(0);

  const marbleTexture = useTexture(MARBLE_RED_TEAL_TEXTURE_URL);
  useEffect(() => {
    marbleTexture.colorSpace = THREE.SRGBColorSpace;
  }, [marbleTexture]);

  const gacoanMaterial = useGameStore((s) => s.gacoanMaterial);
  const aimingState = useGameStore((s) => s.aimingState);
  const setAimingState = useGameStore((s) => s.setAimingState);
  const updateGacoanPos = useGameStore((s) => s.updateGacoanPos);
  const triggerEvaluation = useGameStore((s) => s.triggerEvaluation);
  const evaluateTurnOutcome = useGameStore((s) => s.evaluateTurnOutcome);
  const resetRevision = useGameStore((s) => s.resetRevision);
  const flightData = useGameStore((s) => s.flightData);
  const setFlightData = useGameStore((s) => s.setFlightData);
  const activeTurnCard = useGameStore((s) => s.activeTurnCard);
  const triggerCollisionEffect = useGameStore((s) => s.triggerCollisionEffect);

  const evaluationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const physicalConfig = MARBLE_PHYSICAL_CONFIGS[gacoanMaterial];

  const { onPointerDown } = useSlingshot(rigidBodyRef);

  // Reset gacoan upon arena reset
  useEffect(() => {
    if (evaluationTimerRef.current) {
      clearTimeout(evaluationTimerRef.current);
      evaluationTimerRef.current = null;
    }
    flightProgressRef.current = 0;
    outOfSceneTimerRef.current = 0;

    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(
        {
          x: INITIAL_SHOOTER_POS[0],
          y: INITIAL_SHOOTER_POS[1],
          z: INITIAL_SHOOTER_POS[2],
        },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      stillFrameCountRef.current = 0;
      updateGacoanPos(INITIAL_SHOOTER_POS);
    }
  }, [resetRevision, updateGacoanPos]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (evaluationTimerRef.current) {
        clearTimeout(evaluationTimerRef.current);
      }
    };
  }, []);

  // Sync gacoan position & monitor velocity during SIMULATING phase
  useFrame((_, delta) => {
    if (!rigidBodyRef.current) return;

    // Handle smooth 3D arching flight during AIRBORNE phase
    if (aimingState === 'AIRBORNE') {
      if (!flightData) {
        setAimingState('SIMULATING');
        return;
      }

      const duration = flightData.duration > 0 ? flightData.duration : 0.72;
      flightProgressRef.current += delta / duration;
      const t = Math.min(flightProgressRef.current, 1.0);

      const ox = flightData.origin[0];
      const oy = flightData.origin[1];
      const oz = flightData.origin[2];

      const lx = flightData.landingPoint[0];
      const ly = flightData.landingPoint[1];
      const lz = flightData.landingPoint[2];

      // Parabolic formula matching TrajectoryLine exactly
      const currentX = ox + t * (lx - ox);
      const currentZ = oz + t * (lz - oz);
      const currentY = oy + 4 * flightData.apexHeight * t * (1 - t);

      rigidBodyRef.current.setTranslation({ x: currentX, y: currentY, z: currentZ }, true);
      updateGacoanPos([currentX, currentY, currentZ]);
      if (badgeRef.current) {
        badgeRef.current.position.set(currentX, currentY + gacoanR + 0.14, currentZ);
      }
      if (groundAuraRef.current) {
        groundAuraRef.current.position.set(currentX, 0.002, currentZ);
      }

      if (t >= 1.0) {
        // Impact & Physics Handover!
        flightProgressRef.current = 0;
        rigidBodyRef.current.setTranslation({ x: lx, y: ly, z: lz }, true);
        rigidBodyRef.current.wakeUp();

        const speed = flightData.impulseMagnitude / physicalConfig.mass;
        const dirX = flightData.direction.x;
        const dirZ = flightData.direction.z;

        if (flightData.isHit) {
          // Energetic elastic collision into target marbles at landing point
          rigidBodyRef.current.setLinvel({ x: dirX * speed * 0.45, y: 0.02, z: dirZ * speed * 0.45 }, true);
          rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          marbleAudio.playCollisionSound({
            materialType: gacoanMaterial,
            relativeVelocity: speed,
          });
          triggerCollisionEffect([lx, ly, lz], 1.4);
        } else {
          // Clean ground touchdown: marble settles firmly into soil at the exact targeted landing point
          const residualRoll = Math.min(0.08, speed * 0.04);
          rigidBodyRef.current.setLinvel({ x: dirX * residualRoll, y: 0.0, z: dirZ * residualRoll }, true);
          rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          marbleAudio.playCollisionSound({
            materialType: gacoanMaterial,
            relativeVelocity: speed * 0.35,
          });
          triggerCollisionEffect([lx, ly, lz], 1.0);
        }

        setAimingState('SIMULATING');
        setFlightData(null);
      }
      return;
    }

    const translation = rigidBodyRef.current.translation();
    updateGacoanPos([translation.x, translation.y, translation.z]);
    if (badgeRef.current) {
      badgeRef.current.position.set(translation.x, translation.y + gacoanR + 0.14, translation.z);
    }
    if (groundAuraRef.current) {
      groundAuraRef.current.position.set(translation.x, 0.002, translation.z);
    }

    // 1. Detect if marble is outside the perimeter walls or scene container bounds
    const isOutOfScene =
      Math.abs(translation.x) > SCENE_PERIMETER_BOUNDS.maxX ||
      Math.abs(translation.z) > SCENE_PERIMETER_BOUNDS.maxZ ||
      translation.y < SCENE_PERIMETER_BOUNDS.minY;

    if (isOutOfScene && aimingState === 'SIMULATING') {
      // Dampen velocity while falling out of bounds
      rigidBodyRef.current.setLinvel({ x: 0, y: Math.max(-0.4, rigidBodyRef.current.linvel().y), z: 0 }, true);
      outOfSceneTimerRef.current += delta;

      if (outOfSceneTimerRef.current >= SCENE_PERIMETER_BOUNDS.outOfBoundsResetDelaySeconds) {
        outOfSceneTimerRef.current = 0;
        simulatingDurationRef.current = 0;
        setAimingState('EVALUATING');
        stillFrameCountRef.current = 0;
        simulatingFrameCountRef.current = 0;

        if (evaluationTimerRef.current) {
          clearTimeout(evaluationTimerRef.current);
          evaluationTimerRef.current = null;
        }

        // Halt physics velocity immediately
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

        triggerEvaluation();

        setTimeout(() => {
          const finalPos: [number, number, number] = [translation.x, translation.y, translation.z];
          evaluateTurnOutcome(finalPos);

          const resetPos = GAMEPLAY_CONFIG.foulResetPosition;
          if (rigidBodyRef.current) {
            rigidBodyRef.current.setTranslation({ x: resetPos[0], y: resetPos[1], z: resetPos[2] }, true);
            rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
            updateGacoanPos(resetPos);
          }

          setAimingState('IDLE');
        }, 300);

        return;
      }
    } else {
      outOfSceneTimerRef.current = 0;
    }

    if (aimingState !== 'SIMULATING') {
      stillFrameCountRef.current = 0;
      simulatingFrameCountRef.current = 0;
      simulatingDurationRef.current = 0;
      return;
    }

    simulatingFrameCountRef.current += 1;
    simulatingDurationRef.current += delta;

    // 1. CARD_MAGNETIC: Actively attract target marbles within suction radius toward gacoan
    if (activeTurnCard?.id === 'CARD_MAGNETIC') {
      const trans = rigidBodyRef.current.translation();
      applyMagneticAttraction({ x: trans.x, y: trans.y, z: trans.z }, 1.45, 0.0022);
    }

    // 2. CARD_WIND: Continuous forward aerodynamic thrust during initial 0.35s of flick
    if (activeTurnCard?.id === 'CARD_WIND' && simulatingDurationRef.current < 0.35) {
      const vel = rigidBodyRef.current.linvel();
      const speedHoriz = Math.hypot(vel.x, vel.z);
      if (speedHoriz > 0.08) {
        rigidBodyRef.current.applyImpulse(
          {
            x: (vel.x / speedHoriz) * 0.0005,
            y: 0,
            z: (vel.z / speedHoriz) * 0.0005,
          },
          true
        );
      }
    }

    // 3. CARD_BROOM: Low friction glide counteracting soil damping
    if (activeTurnCard?.id === 'CARD_BROOM') {
      const vel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.setLinvel(
        {
          x: vel.x * 1.005,
          y: vel.y,
          z: vel.z * 1.005,
        },
        true
      );
    }

    // Safety watchdog: if marble rolls or jitters indefinitely, force evaluation after maxSimulationWatchdogSeconds
    if (simulatingDurationRef.current >= SCENE_PERIMETER_BOUNDS.maxSimulationWatchdogSeconds) {
      simulatingDurationRef.current = 0;
      stillFrameCountRef.current = 0;
      simulatingFrameCountRef.current = 0;
      setAimingState('EVALUATING');

      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      triggerEvaluation();
      setTimeout(() => {
        const finalTrans = rigidBodyRef.current ? rigidBodyRef.current.translation() : null;
        const finalPos: [number, number, number] = finalTrans
          ? [finalTrans.x, finalTrans.y, finalTrans.z]
          : INITIAL_SHOOTER_POS;

        evaluateTurnOutcome(finalPos);
        setAimingState('IDLE');
      }, 400);
      return;
    }

    const linvel = rigidBodyRef.current.linvel();
    const speed = Math.hypot(linvel.x, linvel.y, linvel.z);

    // Require at least 15 frames of motion before testing resting velocity
    if (speed < ARENA_CONFIG.restVelocityThreshold && simulatingFrameCountRef.current > 15) {
      stillFrameCountRef.current += 1;
      // Require 20 consecutive resting frames (~0.33s) to confirm complete stop
      if (stillFrameCountRef.current > 20) {
        setAimingState('EVALUATING');
        stillFrameCountRef.current = 0;
        simulatingFrameCountRef.current = 0;
        simulatingDurationRef.current = 0;

        if (evaluationTimerRef.current) {
          clearTimeout(evaluationTimerRef.current);
        }

        // Wait exactly 2 seconds after gacoan stops before triggering pocketing evaluation
        evaluationTimerRef.current = setTimeout(() => {
          triggerEvaluation();
          // Give brief 400ms buffer for shrink animation before final turn outcome resolution
          setTimeout(() => {
            const finalTrans = rigidBodyRef.current ? rigidBodyRef.current.translation() : null;
            const finalPos: [number, number, number] = finalTrans
              ? [finalTrans.x, finalTrans.y, finalTrans.z]
              : INITIAL_SHOOTER_POS;

            evaluateTurnOutcome(finalPos);
            setAimingState('IDLE');
          }, 400);
        }, 2000);
      }
    } else {
      stillFrameCountRef.current = 0;
    }
  });

  const handleCollision = () => {
    const linvel = rigidBodyRef.current?.linvel();
    const speed = linvel ? Math.hypot(linvel.x, linvel.y, linvel.z) : 0.8;
    const trans = rigidBodyRef.current?.translation();

    if (trans) {
      triggerCollisionEffect(
        [trans.x, trans.y, trans.z],
        Math.min(2.0, Math.max(0.6, speed * 1.3))
      );
    }

    // High-elasticity rebound kick if CARD_BOARD was played
    if (activeTurnCard?.id === 'CARD_BOARD' && rigidBodyRef.current && speed > 0.12) {
      const vel = rigidBodyRef.current.linvel();
      rigidBodyRef.current.applyImpulse(
        {
          x: -vel.x * 0.22,
          y: 0.001,
          z: -vel.z * 0.22,
        },
        true
      );
    }

    if (speed > 0.05) {
      marbleAudio.playCollisionSound({
        materialType: gacoanMaterial,
        relativeVelocity: speed,
      });
    }
  };

  const gacoanR = ARENA_CONFIG.gacoanMarbleRadius;

  const renderMaterial = () => {
    if (gacoanMaterial === 'GLASS_CLASSIC') {
      return (
        <group>
          {/* Polished Glass Marble with Red-Teal Marble Texture */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[gacoanR, 48, 48]} />
            <meshPhysicalMaterial
              map={marbleTexture}
              roughness={0.06}
              metalness={0.02}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              reflectivity={0.96}
              ior={1.53}
            />
          </mesh>
        </group>
      );
    }

    if (gacoanMaterial === 'MARBLE_STONE') {
      return (
        <group>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[gacoanR, 36, 36]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.38} metalness={0.05} />
          </mesh>
          {/* Subtle natural stone sedimentary banding */}
          <mesh rotation={[0.6, 0.4, 0]}>
            <torusGeometry
              args={[
                gacoanR * 0.92,
                gacoanR * 0.08,
                12,
                32,
              ]}
            />
            <meshStandardMaterial color="#94a3b8" roughness={0.45} />
          </mesh>
        </group>
      );
    }

    // BEARING_STEEL: Polished mirror steel ball
    return (
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[gacoanR, 36, 36]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.06} metalness={0.98} />
      </mesh>
    );
  };

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        ccd={true}
        position={INITIAL_SHOOTER_POS}
        mass={physicalConfig.mass}
        restitution={physicalConfig.restitution}
        friction={physicalConfig.frictionDynamic}
        linearDamping={physicalConfig.linearDamping}
        angularDamping={physicalConfig.angularDamping}
        onCollisionEnter={handleCollision}
      >
        {/* Explicit Rapier physical ball collider: strictly matches real gacoan marble radius */}
        <BallCollider args={[gacoanR]} />

        <group onPointerDown={onPointerDown}>
          {/* Generous invisible hit target for effortless click & touch capture (has NO physics collision) */}
          <mesh>
            <sphereGeometry args={[gacoanR * 2.5, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {renderMaterial()}

          {/* Magnetic Aura Sphere when CARD_MAGNETIC is active */}
          {activeTurnCard?.id === 'CARD_MAGNETIC' && (
            <mesh>
              <sphereGeometry args={[gacoanR * 1.6, 24, 24]} />
              <meshBasicMaterial
                color="#c084fc"
                transparent
                opacity={0.35}
                wireframe
              />
            </mesh>
          )}
        </group>
      </RigidBody>

      {/* Decoupled Ground Aura Disc (Flat on dirt floor, never rolls) */}
      <group
        ref={groundAuraRef}
        position={[INITIAL_SHOOTER_POS[0], 0.002, INITIAL_SHOOTER_POS[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <mesh>
          <ringGeometry args={[gacoanR * 1.15, gacoanR * 1.65, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={aimingState === 'IDLE' ? 0.85 : 0.35}
          />
        </mesh>
        <mesh position={[0, 0, -0.001]}>
          <circleGeometry args={[gacoanR * 1.65, 32]} />
          <meshBasicMaterial
            color="#0284c7"
            transparent
            opacity={aimingState === 'IDLE' ? 0.28 : 0.08}
          />
        </mesh>
      </group>

      {/* Decoupled Floating 3D Identity Badge (Upright above marble with inverted triangle pointer) */}
      <group
        ref={badgeRef}
        position={[INITIAL_SHOOTER_POS[0], INITIAL_SHOOTER_POS[1] + gacoanR + 0.14, INITIAL_SHOOTER_POS[2]]}
      >
        <Html
          center
          distanceFactor={5}
          className="pointer-events-none select-none"
        >
          <div
            data-testid="badge-gacoan-solo"
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
              GACOAN KAMU {aimingState === 'IDLE' ? '⚡' : ''}
            </span>

            {/* Inverted Triangle Pointer Chevron */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '3.5px solid transparent',
                borderRight: '3.5px solid transparent',
                borderTop: `5px solid ${aimingState === 'IDLE' ? '#38bdf8' : 'rgba(56, 189, 248, 0.85)'}`,
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.9))',
              }}
            />
          </div>
        </Html>
      </group>
    </>
  );
};
