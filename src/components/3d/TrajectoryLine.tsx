import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ARENA_CONFIG } from '../../constants/physics.constants';
import { calculateTrajectory } from '../../utils/trajectory.utils';
import { Vector3D } from '../../types/physics.types';
import { useCardStore } from '../../store/useCardStore';

export const TrajectoryLine: React.FC = () => {
  const aimingState = useGameStore((s) => s.aimingState);
  const drag = useGameStore((s) => s.drag);
  const showTrajectory = useGameStore((s) => s.showTrajectory);
  const targetMarbles = useGameStore((s) => s.targetMarbles);
  const marblesOutsideRing = useGameStore((s) => s.marblesOutsideRing);
  const gacoanPos = useGameStore((s) => s.gacoanCurrentPos);

  const activeCardId = useCardStore((s) => s.activeCardId);
  const handCards = useCardStore((s) => s.handCards);
  const activeCard = handCards.find((c) => c.id === activeCardId);

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

  const lockedDirection = useGameStore((s) => s.lockedDirection);

  const isLob = activeCard?.id === 'CARD_LOB';

  const trajectory = useMemo(() => {
    const isAiming = aimingState === 'AIMING' && drag.distance >= 0.03;
    const isCharging = aimingState === 'CHARGING' && lockedDirection !== null;

    if ((!isAiming && !isCharging) || !showTrajectory) {
      return null;
    }

    // Fixed steady trajectory direction and target point (does not oscillate with power)
    const percentage = isCharging ? 100 : drag.percentage;
    const dirVector = isCharging
      ? {
          x: lockedDirection.x * ARENA_CONFIG.maxDragDistance,
          y: 0,
          z: lockedDirection.z * ARENA_CONFIG.maxDragDistance,
        }
      : { x: drag.vector.x, y: 0, z: drag.vector.z };

    const options = {
      isLob,
      distanceMultiplier: activeCard?.modifier.trajectoryDistanceMultiplier,
      apexHeightMultiplier: activeCard?.modifier.apexHeightMultiplier,
    };

    return calculateTrajectory(
      shooterOrigin,
      dirVector,
      percentage,
      activeTargets,
      ARENA_CONFIG.marbleRadius,
      options
    );
  }, [
    aimingState,
    showTrajectory,
    drag,
    lockedDirection,
    shooterOrigin,
    activeTargets,
    activeCard,
    isLob,
  ]);

  if (!trajectory || trajectory.points.length === 0) return null;

  const dotColor = trajectory.isHit ? '#f43f5e' : isLob ? '#a855f7' : '#38bdf8';
  const ringColor = trajectory.isHit ? '#f43f5e' : '#38bdf8';

  return (
    <group>
      {/* Primary Aim Path (Flat on ground for default, 3D Arc for Lob) */}
      {trajectory.points.map((pt, idx) => (
        <mesh key={`aim-pt-${idx}`} position={pt.position}>
          <sphereGeometry args={[pt.scale, 12, 12]} />
          <meshBasicMaterial
            color={dotColor}
            transparent
            opacity={pt.alpha}
          />
        </mesh>
      ))}

      {/* Target Impact Marker Ring (Ground Mode Hit) */}
      {trajectory.impactPoint && (
        <group
          position={[trajectory.impactPoint[0], 0.007, trajectory.impactPoint[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh>
            <ringGeometry
              args={[
                ARENA_CONFIG.marbleRadius * 0.85,
                ARENA_CONFIG.marbleRadius * 1.15,
                24,
              ]}
            />
            <meshBasicMaterial color="#f43f5e" transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      {/* Secondary Target Kick Preview (Amber line showing kicked target direction) */}
      {trajectory.targetKickPoints?.map((pt, idx) => (
        <mesh key={`target-kick-${idx}`} position={pt.position}>
          <sphereGeometry args={[pt.scale, 10, 10]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={pt.alpha} />
        </mesh>
      ))}

      {/* Secondary Shooter Deflection Preview (Sky blue line showing rebound angle) */}
      {trajectory.shooterDeflectPoints?.map((pt, idx) => (
        <mesh key={`deflect-pt-${idx}`} position={pt.position}>
          <sphereGeometry args={[pt.scale, 10, 10]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={pt.alpha} />
        </mesh>
      ))}

      {/* Lob Mode Ground Landing Circle Marker */}
      {isLob && (
        <group
          position={[
            trajectory.landingPoint[0],
            0.007,
            trajectory.landingPoint[2],
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh>
            <ringGeometry
              args={[
                ARENA_CONFIG.marbleRadius * 0.9,
                ARENA_CONFIG.marbleRadius * 1.25,
                32,
              ]}
            />
            <meshBasicMaterial color={ringColor} transparent opacity={0.75} />
          </mesh>
        </group>
      )}
    </group>
  );
};
