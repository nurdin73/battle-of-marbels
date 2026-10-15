# Battle of Marbles (Kelereng Clash 3D Web)

A high-performance, real-time 3D web simulation of traditional Indonesian yard marble games (*permainan kelereng lingkaran / pekarangan*). Built with **React Three Fiber**, **Rapier Physics (WASM)**, **WebRTC P2P (PeerJS)**, and **Zustand**.

---

## Overview

**Battle of Marbles** recreates the nostalgic Indonesian childhood experience of playing marbles in a dusty rustic backyard (*pekarangan*), combined with modern tactical gameplay mechanics:
- **Authentic Physics Simulation:** Deterministic rigid-body collisions, realistic friction, angular momentum, and slingshot launch dynamics running at a fixed 60 Hz physics step via Rapier WebAssembly.
- **Traditional Chalk Ring Rules (*Lingkaran Kapur*):** Knuckle down your *gacoan* (shooter marble) and knock target marbles out of the circular chalk boundary to score points before time runs out.
- **Tactical Card Modifiers:** Play tactical cards (e.g., *Gempa Lokal*, *Kelereng Magnet*, *Licin Oli*) to dynamically manipulate physics properties and shift match momentum.
- **Zero-Bloat Procedural Audio:** Native Web Audio API sound synthesizer generating realistic marble clacks, rolling resonance, and UI audio without external MP3/WAV assets.

---

## Tech Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Framework & Build** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) | Modern fast-refresh build pipeline and component lifecycle |
| **3D Rendering** | [Three.js](https://threejs.org/) & [React Three Fiber (R3F)](https://docs.pmnd.rs/react-three-fiber) | Declarative WebGL scene orchestration and procedural shaders |
| **3D Helpers** | [@react-three/drei](https://github.com/pmndrs/drei) | Camera controls, environment maps, and text utilities |
| **Physics Engine** | [@react-three/rapier](https://github.com/pmndrs/react-three-rapier) | Fast WebAssembly rigid-body physics engine (Rapier3D) |
| **Networking** | [PeerJS](https://peerjs.com/) | Peer-to-peer real-time WebRTC DataChannel synchronization |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | Modular, lightweight decoupled state stores |
| **Schema Validation** | [Zod](https://zod.dev/) | Strict runtime contracts for cards and multiplayer packets |
| **Styling & Icons** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) | Responsive HUD and overlay design |
| **Language** | [TypeScript 5.4](https://www.typescriptlang.org/) | Strict static typing across domain, UI, and physics boundaries |

---

## Key Features & Modes

### 1. Game Modes
- **Classic Practice / Solo:** Test shooting angles, power adjustments, and trick shots across different target counts.
- **Turn-Based Pass & Play:** Local 2-player competition with a countdown turn timer (default 20 seconds) and turn feedback banners.
- **Online Multiplayer (P2P):** Real-time player-vs-player matches over WebRTC via PeerJS room codes with automatic state synchronization.
- **Challenge / Level Select:** Stages featuring varying arena terrain, obstacles (wooden blocks, stones, slopes), and specialized ring configurations.

### 2. Physics & Controls
- **Slingshot Drag-to-Aim:** Click and drag backward from your gacoan to set power and release trajectory.
- **Real-Time Trajectory Guide:** Visual parabolic arc preview showing launch direction and estimated initial velocity.
- **Power Meter HUD:** Real-time percentage indicator of shot impulse.

### 3. Tactical Cards
- In-game deck system with hand limits and energy management.
- Dynamic physics modifiers:
  - Weight/Mass adjustments (Heavy Metal gacoan).
  - Friction manipulation (Oil slicks, mud patches).
  - Impulses & magnetic pull effects.

---

## Directory Architecture

```text
battle-of-marbels/
├── docs/                        # Modular architectural specifications
│   ├── daftar_isi_ikhtisar_master_plan.md
│   ├── section_1_tech_stack_fondasi_arsitektur.md
│   ├── section_2_core_gameplay_simulasi_fisika.md
│   ├── section_3_sistem_kartu_taktik_backend_firebase.md
│   ├── section_4_penyusunan_aset_3d_lingkungan_shader_ui.md
│   └── section_5_mode_game_pvp_real_time_roadmap.md
├── public/                      # Static textures (planetary maps, chalk textures)
├── src/
│   ├── components/
│   │   ├── 3d/                  # R3F Canvas entities (Arena, Gacoan, Obstacles, Lighting)
│   │   │   ├── ArenaGround.tsx
│   │   │   ├── CameraController.tsx
│   │   │   ├── LevelObstacles.tsx
│   │   │   ├── PekaranganProps.tsx
│   │   │   ├── ShooterMarble.tsx
│   │   │   ├── TargetMarble.tsx
│   │   │   └── TrajectoryLine.tsx
│   │   └── ui/                  # 2D HUD Overlays & Menus
│   │       ├── CardDeckOverlay.tsx
│   │       ├── HUDOverlay.tsx
│   │       ├── MainMenu.tsx
│   │       ├── MultiplayerLobbyModal.tsx
│   │       ├── PowerMeter.tsx
│   │       └── TurnTimer.tsx
│   ├── constants/               # Physics, level definitions, and game constants
│   ├── hooks/                   # Custom gameplay hooks (e.g., useSlingshot)
│   ├── services/                # PeerJS WebRTC service & Card logic
│   ├── store/                   # Zustand stores (useGameStore, useLevelStore, useMultiplayerStore, etc.)
│   ├── types/                   # Strict TypeScript contracts (Physics, Cards, Multiplayer)
│   └── utils/                   # Procedural audio synth, trajectory math, and texture utils
├── package.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 18.0.0` or [Bun](https://bun.sh/) `>= 1.0.0`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/username/battle-of-marbels.git
cd battle-of-marbels

# Using Bun (Recommended)
bun install

# Or using npm
npm install
```

### Development Server

Start the local development server with Vite:

```bash
bun run dev
# Or: npm run dev
```

Open `http://localhost:5173` in your browser.

### Typechecking & Quality Verification

Run TypeScript compiler without emitting files:

```bash
bun run typecheck
# Or: npm run typecheck
```

### Production Build

Compile and bundle for production:

```bash
bun run build
# Or: npm run build
```

Preview the production build locally:

```bash
bun run preview
# Or: npm run preview
```

---

## How to Play

1. **Aiming:** Click/tap on your marble (*gacoan*) and drag in the opposite direction of your intended shot (slingshot mechanic).
2. **Power:** The further you pull back, the higher the impulse applied to the marble.
3. **Release:** Release mouse button or touch point to shoot.
4. **Scoring:** Push target marbles entirely outside the white chalk boundary ring.
5. **Turn Limits:** In turn-based matches, each player must shoot within the designated time limit before their turn is forfeited.
6. **Cards:** Deploy cards from your bottom tray during your turn to apply tactical modifiers.

---

## Documentation

For in-depth architecture designs, formulas, and technical specifications, refer to the documents in [`docs/`](./docs/):
- [Section 1: Tech Stack & Architecture Foundation](./docs/section_1_tech_stack_fondasi_arsitektur.md)
- [Section 2: Core Gameplay & Physics Simulation](./docs/section_2_core_gameplay_simulasi_fisika.md)
- [Section 3: Tactical Card System & Backend](./docs/section_3_sistem_kartu_taktik_backend_firebase.md)
- [Section 4: 3D Assets, Environment, Shaders & UI](./docs/section_4_penyusunan_aset_3d_lingkungan_shader_ui.md)
- [Section 5: Game Modes, PvP WebRTC, & Roadmap](./docs/section_5_mode_game_pvp_real_time_roadmap.md)

---

## License

Private repository / Proprietary. All rights reserved.
