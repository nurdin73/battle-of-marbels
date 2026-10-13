import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ARENA_CONFIG } from '../../constants/physics.constants';
import { calculateParabolicTrajectory } from '../../utils/trajectory.utils';
import { Vector3D } from '../../types/physics.types';

export const TrajectoryLine: React.FC = () => {
  const aimingState = useGameStore((s) => s.aimingState);
  const drag = useGameStore((s) => s.drag);
  const showTrajectory = useGameStore((s) => s.showTrajectory);
  const targetMarbles = useGameStore((s) => s.targetMarbles);
  const marblesOutsideRing = useGameStore((s) => s.marblesOutsideRing);
  const gacoanPos = useGameStore((s) => s.gacoanCurrentPos);

  const shooterOrigin: Vector3D = useMemo(
    () => ({
      x: gacoanPos[0],
      y: gacoanPos[1],
      z: gacoanPos[2],
    }),
    [gacoanPos]
  );

  const targetLivePositions = useGameStore((s) => s.targetLivePositions);

  const activeTargets = useMemo(() => {
    return targetMarbles
      .filter((m) => !marblesOutsideRing.includes(m.id))
      .map((m) => ({
        id: m.id,
        position: targetLivePositions[m.id] || m.initialPosition,
        radius: m.radius,
      }));
  }, [targetMarbles, marblesOutsideRing, targetLivePositions]);

  const trajectory = useMemo(() => {
    if (aimingState !== 'AIMING' || !showTrajectory || drag.distance < 0.03) {
      return null;
    }

    return calculateParabolicTrajectory(
      shooterOrigin,
      { x: drag.vector.x, y: 0, z: drag.vector.z },
      drag.percentage,
      activeTargets,
      ARENA_CONFIG.marbleRadius
    );
  }, [aimingState, showTrajectory, drag, shooterOrigin, activeTargets]);

  if (!trajectory || trajectory.points.length === 0) return null;

  const dotColor = trajectory.isHit ? '#f43f5e' : '#38bdf8';
  const ringColor = trajectory.isHit ? '#f43f5e' : '#38bdf8';

  return (
    <group>
      {/* 3D Arching Parabolic Dots (Angry Birds Style) */}
      {trajectory.points.map((pt, idx) => (
        <mesh key={`arc-dot-${idx}`} position={pt.position}>
          <sphereGeometry args={[pt.scale, 12, 12]} />
          <meshBasicMaterial
            color={dotColor}
            transparent
            opacity={pt.alpha}
          />
        </mesh>
      ))}

      {/* Ground Landing / Impact Ring Marker */}
      <group
        position={[
          trajectory.landingPoint[0],
          0.005,
          trajectory.landingPoint[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {/* Outer Ring */}
        <mesh>
          <ringGeometry args={[ARENA_CONFIG.marbleRadius * 0.9, ARENA_CONFIG.marbleRadius * 1.25, 32]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.75} />
        </mesh>

        {/* Inner Solid Target Dot */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[ARENA_CONFIG.marbleRadius * 0.35, 16]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  );
};
