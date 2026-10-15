import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CylinderCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useTexture } from '@react-three/drei';
import { marbleAudio } from '../../utils/soundSynth.utils';
import { createPitDepthMask } from '../../utils/pitTexture.utils';

const GROUND_TEXTURE_URL = '/assets/textures/ground.webp';
useTexture.preload(GROUND_TEXTURE_URL);

export interface PitHoleConfig {
  id: string;
  position: [number, number, number];
  radius: number;
}

interface SingleHoleProps {
  config: PitHoleConfig;
  groundTexture: THREE.Texture;
  depthMaskTexture: THREE.CanvasTexture;
}

const SingleBattlefieldHole: React.FC<SingleHoleProps> = ({
  config,
  groundTexture,
  depthMaskTexture,
}) => {
  const { position, radius } = config;
  const lastSoundPlayedRef = useRef<number>(0);

  const handleIntersectionEnter = (event: { other: { rigidBody?: RapierRigidBody | null } }) => {
    const otherBody = event.other.rigidBody;
    if (!otherBody) return;

    try {
      const lin = otherBody.linvel();
      const currentSpeed = Math.hypot(lin.x, lin.y, lin.z);

      if (currentSpeed > 0.04) {
        // Authentic sand/soil pit resistance: dampens forward velocity by 60%
        otherBody.setLinvel(
          {
            x: lin.x * 0.40,
            y: lin.y * 0.20,
            z: lin.z * 0.40,
          },
          true
        );

        // Sound effect throttling (250ms debounce)
        const now = Date.now();
        if (now - lastSoundPlayedRef.current > 250) {
          lastSoundPlayedRef.current = now;
          marbleAudio.playCollisionSound({
            materialType: 'MARBLE_STONE',
            relativeVelocity: currentSpeed * 0.5,
          });
        }
      }
    } catch {
      // Ignore if body is disposed mid-intersection
    }
  };

  // Tiny flat natural pebbles sitting half-buried along the rim
  const rimPebbles = useMemo(() => {
    const count = 4;
    const items: Array<{ x: number; z: number; scale: [number, number, number]; color: string; rotY: number }> = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.sin(i * 1.7) * 0.35;
      const dist = radius * (0.85 + Math.random() * 0.18);
      items.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        scale: [0.009 + Math.random() * 0.004, 0.004, 0.011 + Math.random() * 0.005],
        color: i % 2 === 0 ? '#8c7d70' : '#736357',
        rotY: Math.random() * Math.PI,
      });
    }
    return items;
  }, [radius]);

  // Plane size with seamless feathering margins
  const planeSize = radius * 2.8;

  return (
    <group position={position} name={`battlefield-hole-${config.id}`}>
      {/* Rapier Physics Sensor: Detects rolling marbles entering the pit trap */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider
          args={[0.04, radius]}
          position={[0, 0.02, 0]}
          sensor
          onIntersectionEnter={handleIntersectionEnter}
        />
      </RigidBody>

      {/* 1. Base Layer: ground.webp texture with warm light-brown earth tint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[planeSize, planeSize]} />
        <meshStandardMaterial
          map={groundTexture}
          alphaMap={depthMaskTexture}
          color="#ba8252" // Warm light-brown soil tint
          transparent
          opacity={0.88}
          depthWrite={false}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Soft Shadow Layer: Natural warm clay shading without harsh pitch-black void */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <planeGeometry args={[planeSize, planeSize]} />
        <meshBasicMaterial
          map={depthMaskTexture}
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Gentle 3D Cavity Slope: Inverted truncated cone textured with warm brown ground.webp */}
      <mesh position={[0, -0.014, 0]}>
        <cylinderGeometry args={[radius * 0.42, 0.02, 0.028, 24, 1, true]} />
        <meshStandardMaterial
          map={groundTexture}
          color="#754321" // Warm medium-brown soil depth
          roughness={0.96}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Pit bottom floor disk in warm earthen clay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.027, 0]}>
        <circleGeometry args={[radius * 0.18, 16]} />
        <meshBasicMaterial color="#542e14" />
      </mesh>

      {/* 5. Natural tiny flat pebbles embedded along the rim */}
      {rimPebbles.map((p, idx) => (
        <mesh
          key={`rim-peb-${idx}`}
          position={[p.x, 0.003, p.z]}
          rotation={[0, p.rotY, 0]}
          scale={p.scale}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 7, 7]} />
          <meshStandardMaterial color={p.color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// Strategic layout of traditional playing pits across the battlefield
export const DEFAULT_BATTLEFIELD_HOLES: PitHoleConfig[] = [
  {
    // Lubang Utama Timur: Primary traditional target pit
    id: 'pit-primary-east',
    position: [1.35, 0, 0.5],
    radius: 0.22,
  },
  {
    // Lubang Barat Daya: Flanking hazard guarding the western approach
    id: 'pit-west-flank',
    position: [-1.4, 0, 1.05],
    radius: 0.19,
  },
  {
    // Lubang Utara: Tactical perimeter pit behind the target cluster
    id: 'pit-north-rear',
    position: [0.35, 0, -1.35],
    radius: 0.20,
  },
];

interface BattlefieldHoleProps {
  holes?: PitHoleConfig[];
}

export const BattlefieldHole: React.FC<BattlefieldHoleProps> = ({
  holes = DEFAULT_BATTLEFIELD_HOLES,
}) => {
  const groundTextureRaw = useTexture(GROUND_TEXTURE_URL);

  const groundTexture = useMemo(() => {
    const tex = groundTextureRaw.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [groundTextureRaw]);

  const depthMaskTexture = useMemo(() => createPitDepthMask(512), []);

  useEffect(() => {
    return () => {
      groundTexture.dispose();
      depthMaskTexture.dispose();
    };
  }, [groundTexture, depthMaskTexture]);

  return (
    <group name="battlefield-holes-cluster">
      {holes.map((hole) => (
        <SingleBattlefieldHole
          key={hole.id}
          config={hole}
          groundTexture={groundTexture}
          depthMaskTexture={depthMaskTexture}
        />
      ))}
    </group>
  );
};
