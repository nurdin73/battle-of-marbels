import React from 'react';

export const Lighting: React.FC = () => {
  return (
    <>
      {/* Warm ambient pekarangan */}
      <ambientLight intensity={0.55} color="#fed7aa" />

      {/* Golden hour sun */}
      <directionalLight
        position={[6, 10, 5]}
        intensity={1.8}
        color="#ffedd5"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0005}
      />

      {/* Sky bounce */}
      <hemisphereLight
        color="#fdba74"
        groundColor="#451a03"
        intensity={0.4}
      />
    </>
  );
};
