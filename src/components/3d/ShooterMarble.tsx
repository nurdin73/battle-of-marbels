import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
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

const INITIAL_SHOOTER_POS: [number, number, number] = GAMEPLAY_CONFIG.foulResetPosition;

export const ShooterMarble: React.FC = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const stillFrameCountRef = useRef<number>(0);
  const simulatingFrameCountRef = useRef<number>(0);
  const flightProgressRef = useRef<number>(0);
  const outOfSceneTimerRef = useRef<number>(0);

  const gacoanMaterial = useGameStore((s) => s.gacoanMaterial);
  const aimingState = useGameStore((s) => s.aimingState);
  const setAimingState = useGameStore((s) => s.setAimingState);
  const updateGacoanPos = useGameStore((s) => s.updateGacoanPos);
  const triggerEvaluation = useGameStore((s) => s.triggerEvaluation);
  const evaluateTurnOutcome = useGameStore((s) => s.evaluateTurnOutcome);
  const resetRevision = useGameStore((s) => s.resetRevision);
  const flightData = useGameStore((s) => s.flightData);
  const setFlightData = useGameStore((s) => s.setFlightData);

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

      if (t >= 1.0) {
        // Impact & Physics Handover!
        flightProgressRef.current = 0;
        rigidBodyRef.current.setTranslation({ x: lx, y: ly, z: lz }, true);
        rigidBodyRef.current.wakeUp();

        const speed = flightData.impulseMagnitude / physicalConfig.mass;
        const dirX = flightData.direction.x;
        const dirZ = flightData.direction.z;

        // Natural forward speed based on physical impulse
        const forwardSpeed = flightData.isHit ? speed * 0.95 : speed * 0.90;

        if (flightData.isHit) {
          // Energetic elastic collision into target marbles
          rigidBodyRef.current.setLinvel({ x: dirX * forwardSpeed, y: 0.05, z: dirZ * forwardSpeed }, true);
          // Let Rapier WASM contact solver compute natural torque without artificial spin
          rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          marbleAudio.playCollisionSound({
            materialType: gacoanMaterial,
            relativeVelocity: speed,
          });
        } else {
          // Landing on pekarangan ground: linear velocity forward, zero artificial yaw spin
          rigidBodyRef.current.setLinvel({ x: dirX * forwardSpeed, y: 0.06, z: dirZ * forwardSpeed }, true);
          rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          marbleAudio.playCollisionSound({
            materialType: gacoanMaterial,
            relativeVelocity: speed * 0.45,
          });
        }

        setAimingState('SIMULATING');
        setFlightData(null);
      }
      return;
    }

    const translation = rigidBodyRef.current.translation();
    updateGacoanPos([translation.x, translation.y, translation.z]);

    // 1. Detect if marble is outside the perimeter walls or scene container bounds
    const isOutOfScene =
      Math.abs(translation.x) > SCENE_PERIMETER_BOUNDS.maxX ||
      Math.abs(translation.z) > SCENE_PERIMETER_BOUNDS.maxZ ||
      translation.y < SCENE_PERIMETER_BOUNDS.minY;

    if (isOutOfScene && aimingState === 'SIMULATING') {
      outOfSceneTimerRef.current += delta;

      if (outOfSceneTimerRef.current >= SCENE_PERIMETER_BOUNDS.outOfBoundsResetDelaySeconds) {
        outOfSceneTimerRef.current = 0;
        setAimingState('EVALUATING');
        stillFrameCountRef.current = 0;
        simulatingFrameCountRef.current = 0;

        if (evaluationTimerRef.current) {
          clearTimeout(evaluationTimerRef.current);
          evaluationTimerRef.current = null;
        }

        // Halt physics velocity immediately to prevent runaway falling into void
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
      return;
    }

    simulatingFrameCountRef.current += 1;
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

            const distFromOrigin = Math.hypot(finalPos[0], finalPos[2]);
            const isFoul = distFromOrigin > ARENA_CONFIG.ringRadius + ARENA_CONFIG.marbleRadius;

            if (isFoul && rigidBodyRef.current) {
              const resetPos = GAMEPLAY_CONFIG.foulResetPosition;
              rigidBodyRef.current.setTranslation({ x: resetPos[0], y: resetPos[1], z: resetPos[2] }, true);
              rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
              rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
              updateGacoanPos(resetPos);
            }

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
    if (speed > 0.05) {
      marbleAudio.playCollisionSound({
        materialType: gacoanMaterial,
        relativeVelocity: speed,
      });
    }
  };

  const renderMaterial = () => {
    if (gacoanMaterial === 'GLASS_CLASSIC') {
      return (
        <group>
          {/* Optical Clear Translucent Outer Glass Shell */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[ARENA_CONFIG.marbleRadius, 36, 36]} />
            <meshPhysicalMaterial
              roughness={0.03}
              transmission={0.94}
              thickness={0.55}
              ior={1.53}
              reflectivity={0.95}
              clearcoat={1.0}
              clearcoatRoughness={0.03}
              attenuationColor={new THREE.Color('#38bdf8')}
              attenuationDistance={0.45}
            />
          </mesh>

          {/* Primary Swirl Ribbon (Cobalt Blue Belimbing Vane) */}
          <mesh rotation={[0.48, 0.35, 0.15]}>
            <torusGeometry
              args={[
                ARENA_CONFIG.marbleRadius * 0.52,
                ARENA_CONFIG.marbleRadius * 0.18,
                16,
                28,
              ]}
            />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.2} />
          </mesh>

          {/* Counter-Swirl Ribbon (Electric Cyan Vane) */}
          <mesh rotation={[-0.45, -0.55, 0.9]}>
            <torusGeometry
              args={[
                ARENA_CONFIG.marbleRadius * 0.46,
                ARENA_CONFIG.marbleRadius * 0.14,
                16,
                24,
              ]}
            />
            <meshStandardMaterial color="#38bdf8" roughness={0.25} metalness={0.15} />
          </mesh>

          {/* Central Molten Amber Nucleus */}
          <mesh>
            <sphereGeometry args={[ARENA_CONFIG.marbleRadius * 0.18, 12, 12]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.3} />
          </mesh>
        </group>
      );
    }

    if (gacoanMaterial === 'MARBLE_STONE') {
      return (
        <group>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[ARENA_CONFIG.marbleRadius, 36, 36]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.38} metalness={0.05} />
          </mesh>
          {/* Subtle natural stone sedimentary banding */}
          <mesh rotation={[0.6, 0.4, 0]}>
            <torusGeometry
              args={[
                ARENA_CONFIG.marbleRadius * 0.92,
                ARENA_CONFIG.marbleRadius * 0.08,
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
        <sphereGeometry args={[ARENA_CONFIG.marbleRadius, 36, 36]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.06} metalness={0.98} />
      </mesh>
    );
  };

  return (
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
      {/* Explicit Rapier physical ball collider: strictly matches real marble radius */}
      <BallCollider args={[ARENA_CONFIG.marbleRadius]} />

      <group onPointerDown={onPointerDown}>
        {/* Generous invisible hit target for effortless click & touch capture (has NO physics collision) */}
        <mesh>
          <sphereGeometry args={[ARENA_CONFIG.marbleRadius * 2.5, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {renderMaterial()}

        {/* Pulsing selection ring flush on the ground when IDLE */}
        {aimingState === 'IDLE' && (
          <mesh position={[0, -ARENA_CONFIG.marbleRadius + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ARENA_CONFIG.marbleRadius * 1.3, ARENA_CONFIG.marbleRadius * 1.5, 32]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
};
