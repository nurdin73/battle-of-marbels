# Section 1: Tech Stack & Fondasi Arsitektur Web

Bagian ini mendefinisikan seluruh arsitektur pondasi perangkat lunak, pipeline build, alokasi memori, rendering pipeline, integrasi physics engine, serta struktur proyek siap produksi.

---

## 1.1 Evaluasi & Pemilihan Engine 3D

Untuk ekosistem game kelereng berbasis browser, kita mengevaluasi dua kandidat utama:

| Parameter | Three.js + React Three Fiber (R3F) | Babylon.js |
| :--- | :--- | :--- |
| **Arsitektur UI & HUD** | Sangat unggul; UI kartu, timer, dan menu menyatu secara deklaratif menggunakan DOM/Tailwind/HTML5. | Memerlukan modul GUI Babylon terpisah atau wrapper framework manual. |
| **Integrasi Physics** | Sangat mulus dengan `@react-three/rapier` (komponen JSX mengikat langsung ke RigidBody). | Memiliki plugin Havok/Ammo bawaan yang kuat, tetapi konfigurasi scene lebih imperatif. |
| **Ukuran Bundle (Initial Load)** | ~600 KB - 1.2 MB (setelah tree-shaking dan gzip). | ~1.8 MB - 3 MB (relatif lebih berat untuk first-load web kasual). |
| **Keputusan Final** | **DIPILIH: React Three Fiber (R3F) + Drei** | Alternatif untuk versi standalone non-React di masa depan. |

### Alasan Pemilihan Stack:
R3F memungkinkan pemisahan yang bersih antara:
1. **Canvas Layer:** Render 3D, pencahayaan, bayangan, dan fisika kelereng.
2. **Overlay Layer:** UI kartu trik, indikator power meter tarik-lepas, dan avatar pemain menggunakan React DOM standar berkemampuan CSS animasi tinggi.

---

## 1.2 Physics Engine: Rapier WASM (`@react-three/rapier`)

Simulasi tumbukan kelereng membutuhkan akurasi matematis tinggi dan stabilitas numerik. Rapier dipilih karena ditulis dalam Rust dan dikompilasi ke WebAssembly (WASM), memberikan keuntungan performa dibanding engine berbasis JavaScript murni (seperti Cannon.js versi awal).

### Konfigurasi Fisika Inti:
* **Timestep:** Fixed Timestep $60\text{ Hz}$ ($dt = \frac{1}{60}\text{ detik}$) untuk mencegah inkonsistensi tabrakan antar frame rate perangkat yang berbeda.
* **Continuous Collision Detection (CCD):** Wajib diaktifkan untuk gacoan (`ccd={true}`). Hal ini mencegah masalah *tunneling* (kelereng menembus kelereng target atau keluar pembatas arena saat ditembakkan dengan gaya impuls maksimum).
* **Solver Iterations:** 4 iterasi posisi, 8 iterasi velositas (cukup presisi untuk bola kelereng tanpa membebani thread browser).

---

## 1.3 State Management & Turn-Loop Engine

Untuk menjaga pemisahan logika game dari siklus render React (mencegah *re-render* berlebih yang menurunkan FPS), digunakan **Zustand** dengan arsitektur multi-store:

```
[ Game Loop & Event Flow ]
 ┌────────────────────────────────────────────────────────┐
 │                      Zustand Store                     │
 │  - turnState: IDLE | AIMING | SHOT | SIMULATING | END  │
 │  - activePlayer: 1 | 2                                 │
 │  - turnDuration: 20 detik                              │
 │  - energy: number                                      │
 │  - activeCardEffects: CardModifier[]                   │
 └──────────────┬───────────────────────────▲─────────────┘
                │ Membaca State             │ Mengubah State
 ┌──────────────▼────────────┐  ┌───────────┴─────────────┐
 │    UI / Overlay HUD       │  │    3D Physics Canvas    │
 │  - Tarik Card Hand        │  │  - Impulse Application  │
 │  - Power Bar Visual       │  │  - Collision Detection  │
 │  - Timer Countdown (20s)  │  │  - Rest State Trigger   │
 └───────────────────────────┘  └─────────────────────────┘
```

### Parameter Konfigurasi Giliran:
```typescript
export interface TurnStateConfig {
  turnTimeLimit: 20;           // Batas waktu tunggu per giliran: 20 detik
  gracePeriod: 2;              // Toleransi latensi jaringan (detik)
  autoForfeitOnTimeout: false; // Otomatis skip giliran jika timer 20 detik habis
}
```

### State Machine Alur Permainan (Turn State):
1. `TURN_START`: Inisialisasi giliran pemain, timer countdown **20 detik** mulai berjalan, pembagian/penyiapan kartu.
2. `AIMING`: Pemain melakukan raycast klik/sentuh, menghitung vektor tarikan, visualisasi garis bidik aktif.
3. `LAUNCHED`: Gaya impuls diaplikasikan ke rigid-body kelereng gacoan. Input pemain terkunci, timer 20 detik dinonaktifkan.
4. `SIMULATING`: Semua kelereng bergerak bebas. Sistem memantau besaran kecepatan linear dan angular hingga berhenti stabil:
   $$
   \sum_{i=1}^{N} \left( \Vert\vec{v}_i\Vert + \Vert\vec{\omega}_i\Vert \right) < \epsilon \quad (\text{Threshold istirahat: } \epsilon = 0.015)
   $$
5. `SCORE_EVALUATION`: Mengecek kelereng yang berada di luar lingkaran batas tanah, menambah poin, mendeteksi pelanggaran.
6. `TURN_END`: Mereset efek kartu sementara, menukar giliran pemain kembali ke `TURN_START` (reset timer 20 detik).

---

## 1.4 Struktur Direktori Proyek (Directory Blueprint)

```
kelereng-clash/
├── public/
│   ├── assets/
│   │   ├── models/           # File .glb (environment, props, pagar, dll.)
│   │   ├── textures/         # Normal maps, roughness, skydome HDRI/EXR
│   │   └── audio/            # SFX benturan, ambient pekarangan, klik UI
├── src/
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── Arena.tsx        # Tanah, lingkaran kapur, rintangan dinamis
│   │   │   ├── Marble.tsx       # RigidBody kelereng + material fisik
│   │   │   ├── Trajectory.tsx   # Garis proyeksi titik-titik (slingshot)
│   │   │   ├── Props.tsx        # Pagar bambu, kerikil, dedaunan
│   │   │   └── Lighting.tsx     # Directional warm sun + contact shadows
│   │   ├── ui/
│   │   │   ├── CardDeck.tsx     # Tray kartu trik di bawah layar
│   │   │   ├── PowerMeter.tsx   # Indikator kekuatan sentilan
│   │   │   ├── ScoreBoard.tsx   # Skor ronde, avatar, dan timer (20s)
│   │   │   └── MainMenu.tsx     # Halaman utama game
│   ├── hooks/
│   │   ├── useSlingshotInput.ts # Handler Pointer Events (mouse & touch)
│   │   └── useAudio.ts          # Integrasi SFX berbasis kecepatan benturan
│   ├── services/
│   │   ├── firebase.ts          # Inisialisasi Firebase App, Auth, Firestore
│   │   ├── cardService.ts       # Sinkronisasi & caching katalog kartu Firestore
│   │   └── multiplayerService.ts# Sinkronisasi WebRTC/PeerJS / WebSocket
│   ├── store/
│   │   ├── useGameStore.ts      # State utama (giliran, skor, fase)
│   │   └── useCardStore.ts      # Logika inventaris dan aktivasi kartu
│   ├── types/
│   │   ├── physics.ts           # Definisi interface vektor, koordinat, material
│   │   ├── game.ts              # Type definition kartu, pemain, level
│   │   └── network.ts           # Tipe pesan jaringan multiplayer
│   ├── App.tsx                  # Root wrapper (Canvas 3D + UI Overlay)
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 1.5 Pipeline Build, Optimasi Aset, & Kompatibilitas Perangkat
* **Asset Compression Pipeline:** File `.glb` dikompresi via Draco/Meshopt. Tekstur format WebP/KTX2.
* **Pixel Ratio Clamping:** `dpr={[1, 2]}` pada Canvas untuk efisiensi render mobile.
* **Shadow Optimization:** Ukuran shadow map $1024 \times 1024$ dengan soft shadow bias.
* **Target Perangkat:** Browser WebGL 2.0 (Chrome, Safari iOS 15+, Firefox, Edge) pada mobile/desktop.