# Section 4: Penyusunan Aset 3D, Lingkungan, Shader, & UI/UX

Bagian ini mendefinisikan strategi penyusunan aset 3D, shader material kelereng, tata pencahayaan alami pekarangan, serta sistem antarmuka responsif (HUD in-game dan Menu Utama) yang ramah web.

---

## 4.1 Strategi Akuisisi & Standarisasi Aset 3D Low-Poly

1. **Maksimal Poligon Global:** $< 35.000$ segitiga (*triangles*) untuk keseluruhan adegan pekarangan.
2. **Format Standar:** File biner tunggal `.glb` yang dikompresi dengan **Draco compression** (rasio kompresi hingga $70\%$).
3. **Texture Atlas Sharing:** Menggunakan 1 atau 2 lembar palet tekstur bersama ($1024 \times 1024\text{ px}$) untuk menekan *Draw Calls* di bawah 40 panggilan per frame.

### Matriks Daftar Aset Lingkungan (Environment Props):
| Objek Lingkungan | Sumber Daya Rekomendasi | Polycount Budget | Tipe Collider Rapier | Keterangan Visual |
| :--- | :--- | :--- | :--- | :--- |
| **Pagar Bambu Keliling** | Kenney Nature Pack / Kay Lousberg | ~1.200 Tris | Fixed Cuboid | Pembatas arena luar |
| **Pohon Kamboja / Mangga** | Kenney / Poly Pizza | ~2.500 Tris | None (Visual Only) | Penghasil bayangan dedaunan |
| **Ayam Kampung (Animasi)** | Quaternius Animal Pack | ~800 Tris | Kinematic Sphere | Berjalan acak di pekarangan |
| **Batu Kerikil & Ranting** | Poly Pizza CC0 | ~80-150 Tris | Dynamic Sphere/Hull | Rintangan interaktif |
| **Lingkaran Garis Kapur** | Procedural Ring Mesh | ~120 Tris | Sensor Collider | Tekstur kapur berkerut |
| **Pondasi Tanah Pekarangan** | Custom Plane ($15 \times 15\text{ m}$) | ~400 Tris | Fixed Heightfield | Tekstur tanah kering + pasir |

---

## 4.2 Material Shader Kelereng (Procedural Marble Shaders)

```tsx
import React from 'react';
import * as THREE from 'three';

interface MarbleMaterialProps {
  marbleType: 'GLASS_CLASSIC' | 'MARBLE_STONE' | 'BEARING_STEEL';
  swirlColor?: string;
}

export const MarbleMaterial: React.FC<MarbleMaterialProps> = ({ 
  marbleType, 
  swirlColor = '#e11d48' 
}) => {
  if (marbleType === 'GLASS_CLASSIC') {
    return (
      <meshPhysicalMaterial
        roughness={0.05}
        transmission={0.92}
        thickness={0.8}
        ior={1.52}
        reflectivity={0.9}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        attenuationColor={new THREE.Color(swirlColor)}
        attenuationDistance={0.5}
      />
    );
  }

  if (marbleType === 'MARBLE_STONE') {
    return (
      <meshStandardMaterial
        color="#f1f5f9"
        roughness={0.35}
        metalness={0.05}
      />
    );
  }

  return (
    <meshStandardMaterial
      color="#94a3b8"
      roughness={0.18}
      metalness={0.95}
    />
  );
};
```

---

## 4.3 Setup Pencahayaan Pekarangan Sore Hari (Golden Hour)

```tsx
import React from 'react';
import { SoftShadows } from '@react-three/drei';

export const ArenaLighting: React.FC = () => {
  return (
    <>
      <SoftShadows size={25} samples={10} focus={0.5} />
      <hemisphereLight
        color="#fed7aa"
        groundColor="#78350f"
        intensity={0.65}
      />
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.8}
        color="#ffedd5"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
      />
    </>
  );
};
```

---

## 4.4 Desain Antarmuka Pengguna (UI/UX & HUD In-Game)

```
 ┌──────────────────────────────────────────────────────────────┐
 │ [Avatar P1] Pemain 1 (Kamu)     [ 0:18s ]     [Avatar P2] P2 │
 │ Skor: 4 | Kapur: 3 ●●●        GILIRAN KAMU!    Skor: 2       │
 ├──────────────────────────────────────────────────────────────┤
 │                                                              │
 │                     [ CANVAS 3D ARENA ]                      │
 │                 (Kelereng & Garis Trajectory)                │
 │                                                              │
 │                   [ ===== POWER METER ===== ]                │
 ├──────────────────────────────────────────────────────────────┤
 │  [Kamera 🎥]      ┌────┐ ┌────┐ ┌────┐ ┌────┐      [Emoji 💬]│
 │  Reset Sudut      │🪣 1│ │🧹 1│ │🪵 2│ │🎯 1│      Chat Cepat│
 │                   └────┘ └────┘ └────┘ └────┘                │
 │                   TRAY KARTU TRIK AKTIF (DECK)               │
 └──────────────────────────────────────────────────────────────┘
```