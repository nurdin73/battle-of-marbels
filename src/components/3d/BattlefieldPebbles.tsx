import React, { useEffect, useMemo, useRef } from 'react';
import { BallCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import { marbleAudio } from '../../utils/soundSynth.utils';

interface PebbleConfig {
  id: string;
  initialPos: [number, number, number];
  radius: number;
  color: string;
  scale: [number, number, number];
}

const PEBBLE_COLORS = [
  '#78716c',
  '#a8a29e',
  '#57534e',
  '#713f12',
  '#b45309',
  '#94a3b8',
  '#64748b',
  '#475569',
  '#854d0e',
];

// Global registry of pebble rigid bodies for external interactions (e.g. CARD_BROOM sweeping)
const activePebbleBodies = new Map<string, RapierRigidBody>();

/**
 * Sweeps all pebbles within a specified corridor along origin -> direction sideways.
 * Used by CARD_BROOM to physically brush pebbles away from the shooting lane.
 * Returns count of pebbles swept aside.
 */
export function sweepPebblesInCorridor(
  origin: { x: number; z: number },
  direction: { x: number; z: number },
  laneWidth: number = 0.75,
  laneLength: number = 3.6
): number {
  const dirLen = Math.hypot(direction.x, direction.z);
  if (dirLen < 0.001) return 0;

  const dx = direction.x / dirLen;
  const dz = direction.z / dirLen;
  // Perpendicular vector for sideways sweeping
  const perpX = -dz;
  const perpZ = dx;

  let sweptCount = 0;

  for (const body of activePebbleBodies.values()) {
    try {
      const trans = body.translation();
      const vx = trans.x - origin.x;
      const vz = trans.z - origin.z;

      // Project onto the forward shooting axis
      const forwardDist = vx * dx + vz * dz;

      if (forwardDist >= 0.05 && forwardDist <= laneLength) {
        // Perpendicular lateral distance from center line
        const lateralDist = vx * perpX + vz * perpZ;

        if (Math.abs(lateralDist) <= laneWidth / 2) {
          body.wakeUp();
          // Push outwards towards the closest edge of the corridor
          const pushSign = lateralDist >= 0 ? 1 : -1;
          const sweepMagnitude = 0.0035 + Math.random() * 0.0015;

          body.applyImpulse(
            {
              x: perpX * pushSign * sweepMagnitude,
              y: 0.0012,
              z: perpZ * pushSign * sweepMagnitude,
            },
            true
          );
          sweptCount += 1;
        }
      }
    } catch {
      continue;
    }
  }

  return sweptCount;
}

export const BattlefieldPebbles: React.FC = () => {
  const resetRevision = useGameStore((s) => s.resetRevision);
  const triggerCollisionEffect = useGameStore((s) => s.triggerCollisionEffect);
  const rigidBodyRefs = useRef<Map<string, RapierRigidBody>>(new Map());

  // Deterministic dataset of 36 natural pebble placements across yard, flanks, and approach lanes
  const pebbles = useMemo<PebbleConfig[]>(() => {
    const raw: Array<[number, number, number]> = [
      // Approach shooting lane (between gacoan spawn Z=2.3 and ring Z=1.8)
      [-0.14, 0.032, 2.05],
      [0.22, 0.035, 1.95],
      [-0.28, 0.028, 1.75],
      [0.15, 0.034, 1.62],
      [-0.08, 0.026, 1.45],
      [0.24, 0.038, 1.32],
      [-0.22, 0.030, 1.15],
      [0.06, 0.033, 1.05],

      // West flank clusters
      [-1.35, 0.036, -1.5],
      [-1.65, 0.040, -1.2],
      [-1.90, 0.042, 0.35],
      [-2.10, 0.045, -0.6],
      [-1.50, 0.034, 1.25],
      [-1.75, 0.038, 1.55],
      [-1.20, 0.028, 0.75],
      [-2.30, 0.046, 0.85],
      [-1.85, 0.032, -0.15],
      [-1.45, 0.035, -0.85],

      // East flank clusters
      [1.40, 0.034, -1.25],
      [1.70, 0.038, -1.6],
      [1.85, 0.036, 0.65],
      [2.20, 0.040, -0.45],
      [1.15, 0.032, 1.85],
      [1.55, 0.035, 1.40],
      [1.25, 0.028, 0.35],
      [2.10, 0.044, 1.10],
      [1.95, 0.035, -0.10],
      [1.45, 0.038, -0.65],

      // North perimeter clusters (near fence & background)
      [0.60, 0.028, -2.15],
      [-0.55, 0.032, -2.25],
      [0.10, 0.036, -2.40],
      [-1.05, 0.038, -2.10],
      [1.05, 0.035, -2.05],

      // Center ring periphery obstacles
      [-0.85, 0.028, -0.45],
      [0.85, 0.030, -0.35],
      [-0.65, 0.027, 0.45],
    ];

    return raw.map((pos, idx) => ({
      id: `pebble-${idx}`,
      initialPos: [pos[0], pos[1], pos[2]],
      radius: pos[1],
      color: PEBBLE_COLORS[idx % PEBBLE_COLORS.length],
      scale: [
        1.0 + (idx % 3) * 0.18,
        0.75 + (idx % 2) * 0.15,
        1.1 - (idx % 4) * 0.12,
      ],
    }));
  }, []);

  // Restore pebbles to original positions whenever arena is reset
  useEffect(() => {
    pebbles.forEach((p) => {
      const body = rigidBodyRefs.current.get(p.id);
      if (body) {
        body.setTranslation(
          {
            x: p.initialPos[0],
            y: p.initialPos[1],
            z: p.initialPos[2],
          },
          true
        );
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    });
  }, [resetRevision, pebbles]);

  // Clean up global registry on unmount
  useEffect(() => {
    return () => {
      activePebbleBodies.clear();
    };
  }, []);

  const handlePebbleCollision = (speed: number) => {
    if (speed > 0.06) {
      marbleAudio.playCollisionSound({
        materialType: 'MARBLE_STONE',
        relativeVelocity: Math.min(1.2, speed * 0.7),
      });
    }
  };

  return (
    <group name="battlefield-pebbles">
      {pebbles.map((p) => (
        <RigidBody
          key={p.id}
          ref={(inst) => {
            if (inst) {
              rigidBodyRefs.current.set(p.id, inst);
              activePebbleBodies.set(p.id, inst);
            } else {
              rigidBodyRefs.current.delete(p.id);
              activePebbleBodies.delete(p.id);
            }
          }}
          colliders={false}
          position={p.initialPos}
          mass={0.014}
          restitution={0.55}
          friction={0.50}
          linearDamping={0.45}
          angularDamping={0.55}
          onCollisionEnter={(e) => {
            const otherBody = e.other.rigidBody;
            if (otherBody) {
              try {
                const otherLin = otherBody.linvel();
                const speed = Math.hypot(otherLin.x, otherLin.y, otherLin.z);

                if (speed > 0.04) {
                  // Direct kinetic drag: pebble absorbs 28% of marble forward speed
                  otherBody.setLinvel(
                    {
                      x: otherLin.x * 0.72,
                      y: otherLin.y * 0.82,
                      z: otherLin.z * 0.72,
                    },
                    true
                  );

                  // Sound effect and gravel impact burst
                  handlePebbleCollision(speed);
                  const pebbleTrans = e.target.rigidBody?.translation();
                  if (pebbleTrans) {
                    triggerCollisionEffect(
                      [pebbleTrans.x, pebbleTrans.y, pebbleTrans.z],
                      Math.min(1.4, Math.max(0.6, speed * 1.1))
                    );
                  }
                }
              } catch {
                // Ignore if disposed mid-frame
              }
            }
          }}
        >
          <BallCollider args={[p.radius]} />

          <mesh castShadow receiveShadow scale={p.scale}>
            <dodecahedronGeometry args={[p.radius, 1]} />
            <meshStandardMaterial
              color={p.color}
              roughness={0.88}
              metalness={0.04}
            />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
};
