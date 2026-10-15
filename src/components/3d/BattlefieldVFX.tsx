import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore';
import { getAllTargetBodies } from './targetPhysicsRegistry';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

const MAX_PARTICLES = 120;

export const BattlefieldVFX: React.FC = () => {
  const gacoanPos = useGameStore((s) => s.gacoanCurrentPos);
  const aimingState = useGameStore((s) => s.aimingState);
  const activeTurnCard = useGameStore((s) => s.activeTurnCard);
  const lastCollisionEffect = useGameStore((s) => s.lastCollisionEffect);

  const particlesRef = useRef<Particle[]>([]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const magneticLinesRef = useRef<THREE.LineSegments>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastCollisionHandledRef = useRef<number>(0);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Handle Collision Particle Bursts
  useEffect(() => {
    if (!lastCollisionEffect) return;
    if (lastCollisionEffect.timestamp === lastCollisionHandledRef.current) return;
    lastCollisionHandledRef.current = lastCollisionEffect.timestamp;

    const [cx, cy, cz] = lastCollisionEffect.point;
    const count = Math.min(24, Math.floor(12 * lastCollisionEffect.intensity));

    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break;

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 0.6 + Math.random() * 1.4 * lastCollisionEffect.intensity;
      const upSpeed = 0.3 + Math.random() * 0.8;

      particlesRef.current.push({
        position: new THREE.Vector3(
          cx + (Math.random() - 0.5) * 0.04,
          cy + 0.02,
          cz + (Math.random() - 0.5) * 0.04
        ),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          upSpeed,
          Math.sin(angle) * speed
        ),
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        size: 0.028 + Math.random() * 0.025,
        color: new THREE.Color(
          activeTurnCard?.id === 'CARD_MAGNETIC'
            ? '#c084fc'
            : Math.random() > 0.4
            ? '#d97706'
            : '#fde68a'
        ),
      });
    }
  }, [lastCollisionEffect, activeTurnCard]);

  // Frame Loop: Update particles & render dynamic magnetic suction lines
  useFrame((_, delta) => {
    const now = performance.now();

    // 1. Spawn rolling dust trail behind gacoan during SIMULATING
    if (aimingState === 'SIMULATING' && now - lastSpawnTimeRef.current > 45) {
      lastSpawnTimeRef.current = now;
      if (particlesRef.current.length < MAX_PARTICLES) {
        particlesRef.current.push({
          position: new THREE.Vector3(
            gacoanPos[0] + (Math.random() - 0.5) * 0.03,
            gacoanPos[1] + 0.008,
            gacoanPos[2] + (Math.random() - 0.5) * 0.03
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.15,
            0.15 + Math.random() * 0.2,
            (Math.random() - 0.5) * 0.15
          ),
          life: 0,
          maxLife: 0.4 + Math.random() * 0.2,
          size: 0.02 + Math.random() * 0.02,
          color: new THREE.Color(
            activeTurnCard?.id === 'CARD_MAGNETIC'
              ? '#a855f7'
              : activeTurnCard?.id === 'CARD_WIND'
              ? '#bae6fd'
              : '#b45309'
          ),
        });
      }
    }

    // 2. Simulate Particle Physics & Lifetimes
    const activeParticles: Particle[] = [];
    const instancedMesh = meshRef.current;

    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      p.life += delta;

      if (p.life < p.maxLife) {
        p.position.addScaledVector(p.velocity, delta);
        p.velocity.y -= 1.8 * delta; // Gravity
        p.velocity.x *= 0.94; // Air resistance
        p.velocity.z *= 0.94;

        activeParticles.push(p);
      }
    }
    particlesRef.current = activeParticles;

    // 3. Update Instanced Mesh Matrices
    if (instancedMesh) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (i < activeParticles.length) {
          const p = activeParticles[i];
          const progress = p.life / p.maxLife;
          const scale = p.size * (1 - progress);

          dummy.position.copy(p.position);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();

          instancedMesh.setMatrixAt(i, dummy.matrix);
          instancedMesh.setColorAt(i, p.color);
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(i, dummy.matrix);
        }
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
      }
    }

    // 4. Update Magnetic Attraction Arc Lines
    if (magneticLinesRef.current) {
      if (activeTurnCard?.id === 'CARD_MAGNETIC' && aimingState === 'SIMULATING') {
        const lineGeo = magneticLinesRef.current.geometry;
        const positions: number[] = [];
        const bodies = getAllTargetBodies();

        for (const body of bodies.values()) {
          try {
            const trans = body.translation();
            const dist = Math.hypot(gacoanPos[0] - trans.x, gacoanPos[2] - trans.z);
            if (dist < 1.35) {
              // Draw arc segment from gacoan to attracted target marble
              positions.push(gacoanPos[0], gacoanPos[1] + 0.04, gacoanPos[2]);
              positions.push(trans.x, trans.y + 0.04, trans.z);
            }
          } catch {
            continue;
          }
        }

        lineGeo.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(positions, 3)
        );
        magneticLinesRef.current.visible = positions.length > 0;
      } else {
        magneticLinesRef.current.visible = false;
      }
    }
  });

  return (
    <group name="battlefield-vfx">
      {/* High performance single-drawcall Instanced Particles */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, MAX_PARTICLES]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial transparent opacity={0.7} depthWrite={false} />
      </instancedMesh>

      {/* Dynamic Purple Magnetic Flux Arcs */}
      <lineSegments ref={magneticLinesRef} visible={false}>
        <bufferGeometry />
        <lineBasicMaterial color="#c084fc" transparent opacity={0.8} linewidth={2} />
      </lineSegments>
    </group>
  );
};
