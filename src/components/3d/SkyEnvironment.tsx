import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

const CLOUD_TEXTURE_URL = '/assets/textures/cloud.webp';
useTexture.preload(CLOUD_TEXTURE_URL);

export const SkyEnvironment: React.FC = () => {
  const skyRef = useRef<THREE.Mesh>(null);
  const cloudTexture = useTexture(CLOUD_TEXTURE_URL);

  useMemo(() => {
    cloudTexture.wrapS = THREE.RepeatWrapping;
    cloudTexture.wrapT = THREE.ClampToEdgeWrapping;
    cloudTexture.repeat.set(2, 1);
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
  }, [cloudTexture]);

  useFrame((_, delta) => {
    if (skyRef.current) {
      // Gentle cloud drift across the sky dome
      skyRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <group name="sky-environment">
      {/* 360-degree Panoramic Sky Dome with Warm Golden Sunset Clouds */}
      <mesh
        ref={skyRef}
        position={[0, -2.5, 0]}
      >
        <sphereGeometry args={[32, 48, 24, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshBasicMaterial
          map={cloudTexture}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  );
};

