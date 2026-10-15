import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../../store/useGameStore';
import { useMultiplayerStore } from '../../store/useMultiplayerStore';
import { ARENA_CONFIG } from '../../constants/physics.constants';

export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const currentScreen = useGameStore((s) => s.currentScreen);
  const aimingState = useGameStore((s) => s.aimingState);
  const gacoanPos = useGameStore((s) => s.gacoanCurrentPos);

  const isMultiplayerActive = useMultiplayerStore((s) => s.isMultiplayerActive);
  const matchPhase = useMultiplayerStore((s) => s.matchPhase);
  const role = useMultiplayerStore((s) => s.role);
  const currentTurnPlayerId = useMultiplayerStore((s) => s.currentTurnPlayerId);
  const localPlayer = useMultiplayerStore((s) => s.localPlayer);
  const cameraFocusMode = useMultiplayerStore((s) => s.cameraFocusMode);
  const cameraFocusTarget = useMultiplayerStore((s) => s.cameraFocusTarget);
  const setCameraFocusTarget = useMultiplayerStore((s) => s.setCameraFocusTarget);

  const isMyTurn = !isMultiplayerActive || matchPhase === 'TOSS_PHASE' || currentTurnPlayerId === localPlayer.id;
  const prevIsMyTurn = useRef<boolean>(isMyTurn);
  const prevScreen = useRef<string>(currentScreen);
  const prevMatchPhase = useRef<string | null>(matchPhase);

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

  // Whenever entering TOSS_PHASE, immediately aim camera at local player's gacoan
  useEffect(() => {
    if (isMultiplayerActive && matchPhase === 'TOSS_PHASE') {
      const myInitialPos: [number, number, number] = role === 'HOST'
        ? [-0.25, ARENA_CONFIG.marbleRadius, 2.3]
        : [0.25, ARENA_CONFIG.marbleRadius, 2.3];
      useGameStore.getState().updateGacoanPos(myInitialPos);
      if (controlsRef.current) {
        controlsRef.current.target.set(myInitialPos[0], myInitialPos[1] + 0.05, myInitialPos[2]);
        controlsRef.current.update();
      }
      smoothedTarget.current.set(myInitialPos[0], myInitialPos[1] + 0.05, myInitialPos[2]);
      cameraOffset.current.set(0, 1.85, 2.4);
      desiredCamPos.current.set(myInitialPos[0], myInitialPos[1] + 1.85, myInitialPos[2] + 2.4);
    }
  }, [isMultiplayerActive, matchPhase, role]);

  // Whenever cameraFocusMode changes in match, re-center camera target smoothly
  useEffect(() => {
    if (controlsRef.current && matchPhase === 'PLAYING') {
      smoothedTarget.current.set(gacoanPos[0], gacoanPos[1] + 0.05, gacoanPos[2]);
      controlsRef.current.target.set(gacoanPos[0], gacoanPos[1] + 0.05, gacoanPos[2]);
      controlsRef.current.update();
    }
  }, [cameraFocusMode, matchPhase, gacoanPos]);

  // Listen to external focus target requests (e.g. from HUD quick-focus buttons)
  useEffect(() => {
    if (cameraFocusTarget && controlsRef.current) {
      controlsRef.current.target.set(cameraFocusTarget[0], cameraFocusTarget[1] + 0.05, cameraFocusTarget[2]);
      controlsRef.current.update();
      cameraOffset.current.set(0, 1.85, 2.4);
      smoothedTarget.current.set(cameraFocusTarget[0], cameraFocusTarget[1] + 0.05, cameraFocusTarget[2]);
      setCameraFocusTarget(null);
    }
  }, [cameraFocusTarget, setCameraFocusTarget]);

  useFrame(({ camera, clock }) => {
    // 1. Cinematic slow orbital pan when on MAIN_MENU in solo mode
    if (currentScreen === 'MAIN_MENU' && !isMultiplayerActive) {
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

    // When transitioning from MAIN_MENU to PLAYING or into TOSS_PHASE, snap camera directly behind gacoan
    if (
      ((prevScreen.current === 'MAIN_MENU' && currentScreen === 'PLAYING') || isMultiplayerActive) &&
      (prevMatchPhase.current !== matchPhase && matchPhase === 'TOSS_PHASE')
    ) {
      prevScreen.current = currentScreen;
      prevMatchPhase.current = matchPhase;
      camera.position.set(gx, gy + 1.85, gz + 2.4);
      cameraOffset.current.set(0, 1.85, 2.4);
      smoothedTarget.current.set(gx, gy + 0.05, gz);
      if (controlsRef.current) {
        controlsRef.current.target.set(gx, gy + 0.05, gz);
        controlsRef.current.update();
      }
    }

    // When transitioning turn ownership, smoothly reset camera behind active gacoan
    if (!prevIsMyTurn.current && isMyTurn) {
      prevIsMyTurn.current = true;
      camera.position.set(gx, gy + 1.85, gz + 2.4);
      cameraOffset.current.set(0, 1.85, 2.4);
      smoothedTarget.current.set(gx, gy + 0.05, gz);
      if (controlsRef.current) {
        controlsRef.current.target.set(gx, gy + 0.05, gz);
        controlsRef.current.update();
      }
    } else if (prevIsMyTurn.current && !isMyTurn) {
      prevIsMyTurn.current = false;
      smoothedTarget.current.set(gx, gy + 0.05, gz);
      if (controlsRef.current) {
        controlsRef.current.target.set(gx, gy + 0.05, gz);
        controlsRef.current.update();
      }
    }

    smoothedTarget.current.set(gx, gy + 0.05, gz);

    if (aimingState === 'IDLE') {
      // IDLE: Player has freedom to orbit camera around tracked gacoan
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
      // AIMING / CHARGING: Camera remains static at player's chosen vantage point
      cameraOffset.current.set(
        camera.position.x - gx,
        camera.position.y - ARENA_CONFIG.marbleRadius,
        camera.position.z - gz
      );
    } else {
      // AIRBORNE / SIMULATING / EVALUATING:
      // Translate camera smoothly following gacoan in real time
      const targetCamX = gx + cameraOffset.current.x;
      const targetCamY = ARENA_CONFIG.marbleRadius + cameraOffset.current.y;
      const targetCamZ = gz + cameraOffset.current.z;

      desiredCamPos.current.set(targetCamX, targetCamY, targetCamZ);

      camera.position.lerp(desiredCamPos.current, 0.08);
      camera.lookAt(smoothedTarget.current);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(smoothedTarget.current, 0.1);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={(currentScreen === 'PLAYING' || isMultiplayerActive) && aimingState !== 'AIMING' && aimingState !== 'CHARGING'}
      enablePan={false}
      minDistance={1.2}
      maxDistance={9.0}
      maxPolarAngle={Math.PI / 2.05}
    />
  );
};
