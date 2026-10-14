import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ARENA_CONFIG } from '../../constants/physics.constants';
import { calculateTrajectory, ObstacleCollider, PEKARANGAN_OBSTACLES } from '../../utils/trajectory.utils';
import { Vector3D } from '../../types/physics.types';
import { useCardStore } from '../../store/useCardStore';
import { useLevelStore } from '../../store/useLevelStore';
import { ADVENTURE_LEVELS } from '../../constants/levels.constants';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';

export const TrajectoryLine: React.FC = () => {
  const aimingState = useGameStore((s) => s.aimingState);
  const drag = useGameStore((s) => s.drag);
  const showTrajectory = useGameStore((s) => s.showTrajectory);
  const targetMarbles = useGameStore((s) => s.targetMarbles);
  const marblesOutsideRing = useGameStore((s) => s.marblesOutsideRing);
  const gacoanPos = useGameStore((s) => s.gacoanCurrentPos);

  const isMultiplayer = useMultiplayerStore((s) => s.isMultiplayer);
  const isMyTurn = useMultiplayerStore((s) => s.isMyTurn());
  const opponentAim = useMultiplayerStore((s) => s.opponentAim);

  const activeCardId = useCardStore((s) => s.activeCardId);
  const handCards = useCardStore((s) => s.handCards);
  const activeCard = handCards.find((c) => c.id === activeCardId);

  const currentLevelId = useLevelStore((s) => s.currentLevelId);
  const currentLevel = useMemo(
    () => ADVENTURE_LEVELS.find((l) => l.id === currentLevelId),
    [currentLevelId]
  );

  const combinedObstacles = useMemo<ObstacleCollider[]>(() => {
    const list: ObstacleCollider[] = [...PEKARANGAN_OBSTACLES];
    if (currentLevel?.obstacles) {
      currentLevel.obstacles.forEach((obs) => {
        if (obs.type === 'BAMBOO_CHUTE' || obs.type === 'BRICK_WALL' || obs.type === 'RISING_GATE') {
          const halfX = obs.size ? obs.size[0] / 2 : 0.2;
          const halfZ = obs.size ? obs.size[2] / 2 : 0.5;
          list.push({
            id: obs.id,
            type: 'BOX',
            center: [obs.position[0], obs.position[2]],
            halfSize: [halfX, halfZ],
          });
        }
      });
    }
    return list;
  }, [currentLevel]);

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
      obstacles: combinedObstacles,
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
    combinedObstacles,
  ]);

  const opponentTrajectory = useMemo(() => {
    if (!isMultiplayer || isMyTurn || !opponentAim || !opponentAim.direction) {
      return null;
    }

    const dirVector = {
      x: opponentAim.direction.x * ARENA_CONFIG.maxDragDistance,
      y: 0,
      z: opponentAim.direction.z * ARENA_CONFIG.maxDragDistance,
    };

    const options = {
      isLob: false,
      obstacles: combinedObstacles,
    };

    return calculateTrajectory(
      shooterOrigin,
      dirVector,
      opponentAim.powerPercentage,
      activeTargets,
      ARENA_CONFIG.marbleRadius,
      options
    );
  }, [
    isMultiplayer,
    isMyTurn,
    opponentAim,
    shooterOrigin,
    activeTargets,
    combinedObstacles,
  ]);

  const activeTrajectory = trajectory || opponentTrajectory;
  if (!activeTrajectory || activeTrajectory.points.length === 0) return null;

  const isOpponent = !trajectory && !!opponentTrajectory;
  const dotColor = isOpponent
    ? '#f59e0b'
    : activeTrajectory.isHit
    ? '#f43f5e'
    : isLob
    ? '#a855f7'
    : '#38bdf8';
  const ringColor = isOpponent
    ? '#f59e0b'
    : activeTrajectory.isHit
    ? '#f43f5e'
    : '#38bdf8';

  return (
    <group>
      {/* Primary Aim Path (Flat on ground for default, 3D Arc for Lob) */}
      {activeTrajectory.points.map((pt, idx) => (
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
      {activeTrajectory.impactPoint && (
        <group
          position={[activeTrajectory.impactPoint[0], 0.007, activeTrajectory.impactPoint[2]]}
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
            <meshBasicMaterial color={ringColor} transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      {/* Secondary Target Kick Preview (Amber line showing kicked target direction) */}
      {activeTrajectory.targetKickPoints?.map((pt, idx) => (
        <mesh key={`target-kick-${idx}`} position={pt.position}>
          <sphereGeometry args={[pt.scale, 10, 10]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={pt.alpha} />
        </mesh>
      ))}

      {/* Secondary Shooter Deflection Preview (Sky blue line showing rebound angle) */}
      {activeTrajectory.shooterDeflectPoints?.map((pt, idx) => (
        <mesh key={`deflect-pt-${idx}`} position={pt.position}>
          <sphereGeometry args={[pt.scale, 10, 10]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={pt.alpha} />
        </mesh>
      ))}

      {/* Lob Mode Ground Landing Circle Marker */}
      {isLob && activeTrajectory.landingPoint && (
        <group
          position={[
            activeTrajectory.landingPoint[0],
            0.007,
            activeTrajectory.landingPoint[2],
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
