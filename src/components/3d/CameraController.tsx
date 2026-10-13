import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../../store/useGameStore';
import { ARENA_CONFIG } from '../../constants/physics.constants';

export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const currentScreen = useGameStore((s) => s.currentScreen);
  const aimingState = useGameStore((s) => s.aimingState);
  const gacoanPos = useGameStore((s) => s.gacoanCurrentPos);

  // Stores player's chosen camera offset relative to the gacoan
  const cameraOffset = useRef(new THREE.Vector3(0, 1.85, 2.4));
  const desiredCamPos = useRef(new THREE.Vector3());
  const smoothedTarget = useRef(new THREE.Vector3(0, 0.1, 2.3));

  // Initialize OrbitControls target once on mount
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(gacoanPos[0], gacoanPos[1] + 0.05, gacoanPos[2]);
      controlsRef.current.update();
    }
  }, []);

  useFrame(({ camera, clock }) => {
    // 1. Cinematic slow orbital pan when on MAIN_MENU
    if (currentScreen === 'MAIN_MENU') {
      const t = clock.getElapsedTime() * 0.12;
      const camRadius = 4.4;
      const camX = Math.sin(t) * camRadius;
      const camZ = Math.cos(t) * camRadius;

      desiredCamPos.current.set(camX, 2.3, camZ);
      smoothedTarget.current.set(0, 0.05, 0);

      camera.position.lerp(desiredCamPos.current, 0.05);
      camera.lookAt(smoothedTarget.current);

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0.05, 0);
        controlsRef.current.update();
      }
      return;
    }

    // 2. In-game gameplay camera logic
    const gx = gacoanPos[0];
    const gy = gacoanPos[1];
    const gz = gacoanPos[2];

    if (aimingState === 'IDLE') {
      // IDLE: Player has full freedom to orbit camera around gacoan
      smoothedTarget.current.set(gx, gy + 0.05, gz);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(smoothedTarget.current, 0.1);
        controlsRef.current.update();
      }

      // Record player's chosen relative offset from gacoan
      cameraOffset.current.set(
        camera.position.x - gx,
        camera.position.y - ARENA_CONFIG.marbleRadius,
        camera.position.z - gz
      );
    } else if (aimingState === 'AIMING' || aimingState === 'CHARGING') {
      // AIMING / CHARGING: Camera remains completely static at player's chosen vantage point.
      cameraOffset.current.set(
        camera.position.x - gx,
        camera.position.y - ARENA_CONFIG.marbleRadius,
        camera.position.z - gz
      );
    } else {
      // AIRBORNE / SIMULATING / EVALUATING:
      // Translate camera smoothly following gacoan while strictly preserving the player's chosen angle/offset.
      const targetCamX = gx + cameraOffset.current.x;
      const targetCamY = ARENA_CONFIG.marbleRadius + cameraOffset.current.y;
      const targetCamZ = gz + cameraOffset.current.z;

      desiredCamPos.current.set(targetCamX, targetCamY, targetCamZ);
      smoothedTarget.current.set(gx, gy + 0.05, gz);

      camera.position.lerp(desiredCamPos.current, 0.08);
      camera.lookAt(smoothedTarget.current);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={currentScreen === 'PLAYING' && aimingState === 'IDLE'}
      enablePan={false}
      minDistance={1.8}
      maxDistance={8.0}
      maxPolarAngle={Math.PI / 2.15}
    />
  );
};
