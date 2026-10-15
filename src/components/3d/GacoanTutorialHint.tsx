import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';

interface GacoanTutorialHintProps {
  position: [number, number, number];
  marbleRadius: number;
  visible?: boolean;
}

export const GacoanTutorialHint: React.FC<GacoanTutorialHintProps> = ({
  position,
  marbleRadius,
  visible,
}) => {
  const aimingState = useGameStore((s) => s.aimingState);
  const flickCount = useGameStore((s) => s.flickCount);
  const isGameOver = useGameStore((s) => s.isGameOver);

  const rippleRingRef = useRef<THREE.Mesh>(null);
  const outerBounceRingRef = useRef<THREE.Mesh>(null);
  const handPointerRef = useRef<HTMLDivElement>(null);

  // Animated bounce & ripple loop
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    // 1. Inner breathing bounce circle
    if (outerBounceRingRef.current) {
      const bounceScale = 1.0 + Math.sin(elapsed * 4.5) * 0.14;
      outerBounceRingRef.current.scale.set(bounceScale, bounceScale, 1);
    }

    // 2. Outer expanding ripple wave
    if (rippleRingRef.current) {
      const wavePhase = (elapsed * 1.5) % 1.0; // 0 to 1 cycle
      const rippleScale = 1.0 + wavePhase * 1.6;
      rippleRingRef.current.scale.set(rippleScale, rippleScale, 1);

      const mat = rippleRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1.0 - wavePhase) * 0.45;
      }
    }

    // 3. Hand pointer CSS drag animation (simulating finger pulling backward)
    if (handPointerRef.current) {
      const cycle = (elapsed * 1.1) % 1.0; // ~0.9s per loop
      let pullOffsetY = 0;
      let opacity = 0;

      if (cycle < 0.15) {
        // Fade in touching gacoan
        opacity = cycle / 0.15;
        pullOffsetY = 0;
      } else if (cycle < 0.7) {
        // Smoothly pull backwards (downwards in screen projection)
        const t = (cycle - 0.15) / 0.55;
        // Ease out quad
        const easeT = t * (2 - t);
        pullOffsetY = easeT * 36;
        opacity = 1;
      } else if (cycle < 0.88) {
        // Fade out at max extension
        const t = (cycle - 0.7) / 0.18;
        pullOffsetY = 36;
        opacity = 1 - t;
      } else {
        // Brief pause before restarting
        opacity = 0;
        pullOffsetY = 0;
      }

      handPointerRef.current.style.transform = `translateY(${pullOffsetY}px)`;
      handPointerRef.current.style.opacity = `${opacity}`;
    }
  });

  // Only display tutorial hint at the start of game when still idle and no flicks released yet
  const shouldShow =
    visible !== undefined
      ? visible
      : aimingState === 'IDLE' && flickCount === 0 && !isGameOver;

  if (!shouldShow) {
    return null;
  }

  return (
    <group position={[position[0], 0.003, position[2]]} name="gacoan-tutorial-hint">
      {/* 1. Inner Breathing Bouncing Ring */}
      <mesh
        ref={outerBounceRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
      >
        <ringGeometry args={[marbleRadius * 1.25, marbleRadius * 1.75, 36]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Outer Expanding Ripple Wave */}
      <mesh
        ref={rippleRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 0]}
      >
        <ringGeometry args={[marbleRadius * 1.35, marbleRadius * 1.65, 36]} />
        <meshBasicMaterial
          color="#facc15"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Decoupled Interactive Finger Pointer & Tutorial Badge */}
      <Html
        position={[0, marbleRadius * 1.5, 0.1]}
        center
        distanceFactor={4.5}
        className="pointer-events-none select-none"
      >
        <div
          data-testid="tutorial-hint-container"
          className="flex flex-col items-center justify-center pointer-events-none select-none"
          style={{ width: '180px' }}
        >
          {/* Animated Dragging Hand Pointer Icon */}
          <div
            ref={handPointerRef}
            className="flex flex-col items-center pointer-events-none will-change-transform drop-shadow-lg"
          >
            {/* Touch glow ring and finger pointer */}
            <div className="relative flex items-center justify-center">
              <span className="text-3xl select-none filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
                👆
              </span>
              <div className="absolute -top-1 w-6 h-6 rounded-full border-2 border-amber-300 animate-ping opacity-75 pointer-events-none" />
              <div className="absolute -top-1 w-4 h-4 rounded-full bg-amber-400/40 blur-xs pointer-events-none" />
            </div>

            {/* Downward dragging trajectory guideline */}
            <div className="w-0.5 h-4 bg-gradient-to-b from-amber-300 to-transparent my-0.5 opacity-80" />
            <span className="text-[10px] text-amber-300 font-bold -mt-1 opacity-90">▼</span>
          </div>

          {/* Tutorial Instruction Pill Banner */}
          <div className="bg-stone-950/90 border border-amber-400/90 backdrop-blur-md px-3 py-1 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.85)] flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-wider text-amber-200 font-sans whitespace-nowrap uppercase">
              Tarik ke belakang
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
};
