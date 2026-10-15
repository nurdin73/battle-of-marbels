import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import { useCardStore } from '../../store/useCardStore';
import { marbleAudio } from '../../utils/soundSynth.utils';

export const CardBattlefieldEntities: React.FC = () => {
  const activeTurnCard = useGameStore((s) => s.activeTurnCard);
  const activeCardId = useCardStore((s) => s.activeCardId);
  const aimingState = useGameStore((s) => s.aimingState);
  const gacoanPos = useGameStore((s) => s.gacoanCurrentPos);
  const lockedDirection = useGameStore((s) => s.lockedDirection);
  const drag = useGameStore((s) => s.drag);
  const isBroomSweeping = useGameStore((s) => s.isBroomSweeping);
  const broomSweepProgress = useGameStore((s) => s.broomSweepProgress);
  const triggerCollisionEffect = useGameStore((s) => s.triggerCollisionEffect);

  const boardBounceRef = useRef<THREE.Group>(null);
  const broomSweptRef = useRef<THREE.Group>(null);
  const broomModelRef = useRef<THREE.Group>(null);

  const isBoardActive =
    activeCardId === 'CARD_BOARD' || activeTurnCard?.id === 'CARD_BOARD';
  // Area mapping is only visible while aiming or actively sweeping; hidden once skill completes and gacoan rolls
  const isBroomActive =
    (activeCardId === 'CARD_BROOM' || isBroomSweeping) &&
    aimingState !== 'SIMULATING' &&
    aimingState !== 'EVALUATING';
  const isMagneticActive =
    activeCardId === 'CARD_MAGNETIC' || activeTurnCard?.id === 'CARD_MAGNETIC';

  // Compute aiming angle for swept lane orientation
  const aimAngle = React.useMemo(() => {
    if (lockedDirection) {
      return Math.atan2(lockedDirection.x, lockedDirection.z);
    }
    if (drag.distance > 0.02) {
      return Math.atan2(drag.vector.x, drag.vector.z);
    }
    return Math.PI; // Default facing north (-Z)
  }, [lockedDirection, drag]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (boardBounceRef.current && isBoardActive) {
      // Subtle hovering pulse indicator on the board
      boardBounceRef.current.position.y = 0.12 + Math.sin(elapsed * 4) * 0.008;
    }
    if (broomSweptRef.current && isBroomActive) {
      // Shimmering clean lane texture
      const mat = (broomSweptRef.current.children[0] as THREE.Mesh)
        ?.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.35 + Math.sin(elapsed * 5) * 0.12;
      }
    }

    // Dynamic sweeping animation of the 3D Sapu Lidi
    if (broomModelRef.current && isBroomSweeping) {
      const forwardDist = broomSweepProgress * 3.4;
      const sideSwing = Math.sin(broomSweepProgress * Math.PI * 12) * 0.24;
      const swingRoll = Math.cos(broomSweepProgress * Math.PI * 12) * 0.35;

      broomModelRef.current.position.set(sideSwing, 0.14, forwardDist);
      broomModelRef.current.rotation.set(-0.35, swingRoll, 0.4);
    }
  });

  const handleBoardHit = () => {
    marbleAudio.playWoodKnockSound(1.4);
    triggerCollisionEffect([-1.35, 0.12, -0.1], 1.5);
  };

  return (
    <group name="card-battlefield-entities">
      {/* 1. CARD_BOARD: Physical Wooden Bounce Plank */}
      {isBoardActive && (
        <RigidBody
          type="fixed"
          colliders={false}
          friction={0.12}
          restitution={0.94}
          position={[-1.35, 0.12, -0.1]}
          rotation={[0, 0.42, 0]}
          onCollisionEnter={handleBoardHit}
        >
          {/* Rapier Box Collider for high-elasticity bank shot */}
          <CuboidCollider args={[0.06, 0.12, 0.45]} />

          <group ref={boardBounceRef}>
            {/* Wooden plank visual */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.12, 0.24, 0.90]} />
              <meshStandardMaterial
                color="#b45309"
                roughness={0.45}
                metalness={0.08}
              />
            </mesh>

            {/* Iron reinforcing corner brackets */}
            {[-0.42, 0.42].map((zOffset, idx) => (
              <mesh key={`bracket-${idx}`} position={[0, 0, zOffset]}>
                <boxGeometry args={[0.13, 0.25, 0.05]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
              </mesh>
            ))}

            {/* Neon bounce indicator chevron */}
            <mesh position={[0.065, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.3, 0.12]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </RigidBody>
      )}

      {/* 2. CARD_BROOM: Swept Clean Soil Pathway (Low Friction Runway) */}
      {isBroomActive && (
        <group
          ref={broomSweptRef}
          position={[gacoanPos[0], 0.004, gacoanPos[2]]}
          rotation={[0, aimAngle, 0]}
        >
          {/* Visual swept clean soil strip */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1.6]} receiveShadow>
            <planeGeometry args={[0.65, 3.4]} />
            <meshBasicMaterial
              color="#fed7aa"
              transparent
              opacity={0.38}
              depthWrite={false}
            />
          </mesh>

          {/* Broom sweep border lines */}
          {[-0.32, 0.32].map((xOffset, idx) => (
            <mesh
              key={`sweep-border-${idx}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[xOffset, 0, 1.6]}
            >
              <planeGeometry args={[0.02, 3.4]} />
              <meshBasicMaterial
                color="#d97706"
                transparent
                opacity={0.5}
                depthWrite={false}
              />
            </mesh>
          ))}

          {/* Animated 3D Sapu Lidi Sweeping Model */}
          {isBroomSweeping && (
            <group ref={broomModelRef}>
              {/* Bamboo handle */}
              <mesh position={[0, 0.28, 0]} castShadow>
                <cylinderGeometry args={[0.014, 0.016, 0.55, 8]} />
                <meshStandardMaterial color="#ca8a04" roughness={0.7} />
              </mesh>
              {/* Red string binding wrap */}
              <mesh position={[0, 0.08, 0]}>
                <cylinderGeometry args={[0.026, 0.026, 0.04, 8]} />
                <meshStandardMaterial color="#dc2626" roughness={0.5} />
              </mesh>
              {/* Coconut leaf midribs / bristles fanned bundle */}
              <mesh position={[0, -0.10, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.09, 0.36, 12]} />
                <meshStandardMaterial color="#854d0e" roughness={0.9} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* 3. CARD_MAGNETIC: Field Indicators on Target Marbles */}
      {isMagneticActive && aimingState === 'SIMULATING' && (
        <mesh position={[gacoanPos[0], 0.008, gacoanPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 1.35, 36]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.28}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};
