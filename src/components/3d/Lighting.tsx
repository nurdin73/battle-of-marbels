import React from 'react';

export const Lighting: React.FC = () => {
  return (
    <>
      {/* Warm ambient pekarangan */}
      <ambientLight intensity={0.65} color="#fed7aa" />

      {/* Golden hour late-afternoon sun */}
      <directionalLight
        position={[7, 10, 6]}
        intensity={2.2}
        color="#fff1dd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-camera-left={-8.5}
        shadow-camera-right={8.5}
        shadow-camera-top={8.5}
        shadow-camera-bottom={-8.5}
        shadow-bias={-0.0004}
      />

      {/* Warm pekarangan bounce light (tropical golden haze to rich soil) */}
      <hemisphereLight
        color="#fef08a"
        groundColor="#3d1d09"
        intensity={0.55}
      />

      {/* Subtle opposite fill light for soft contrast under trees & fence */}
      <directionalLight
        position={[-7, 5, -6]}
        intensity={0.35}
        color="#fbcfe8"
      />
    </>
  );
};
