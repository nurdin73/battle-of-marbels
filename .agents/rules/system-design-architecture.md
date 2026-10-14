# System Design & Architecture Rules: 3D Multiplayer Physics Engine

Whenever designing, implementing, refactoring, or reviewing components and subsystems across this platform, the AI agent MUST strictly and unconditionally adhere to the following system design and architectural principles:

---

## 1. Domain Boundaries & Separation of Concerns (SoC)

The application architecture is strictly partitioned into four decoupled layers. Logic from one layer MUST NOT leak into another:

```text
┌────────────────────────────────────────────────────────┐
│                   UI & Controls (React)                │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              Application State (Zustand)               │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
┌──────────────▼─────────────┐ ┌──────────▼──────────────┐
│  Physics & 3D Scene Layer  │ │   Network / Peer Layer  │
│    (Three.js, R3F, Rapier) │ │     (PeerJS, WebRTC)    │
└────────────────────────────┘ └─────────────────────────┘
```

### A. Presentation & Scene Graph Layer (`@react-three/fiber`, `@react-three/drei`)
- **Strict Role:** Purely visual representation, lighting, materials, camera positioning, and HUD overlay.
- **Prohibitions:**
  - ZERO direct peer networking calls or raw WebRTC socket manipulation inside 3D mesh components.
  - ZERO game-rule resolution (e.g. score calculation, turn state switching) embedded directly inside render callbacks.

### B. Physics Simulation Layer (`@react-three/rapier`)
- **Strict Role:** Discrete rigid body simulation, collision geometry, restitution, friction, impulses, and velocities.
- **Directives:**
  - Physics steps and collision event handlers must interact with application state via defined store actions or event dispatchers.
  - Colliders must use optimal primitive shapes (`ball`, `cuboid`, `cylinder`) rather than arbitrary trimesh geometry for dynamic bodies.

### C. Application State Layer (`zustand`)
- **Strict Role:** Single source of truth for match progression, game phase (`lobby`, `aiming`, `rolling`, `turn_end`, `game_over`), active player turn, player scores, and network connectivity state.
- **Directives:**
  - State mutations must be deterministic and executed via explicit store actions.
  - Separate ephemeral UI state from persistent or networked game session state.

### D. Networking & Peer Layer (`peerService.ts`, WebRTC)
- **Strict Role:** Peer-to-peer data channel management, packet serialization/deserialization, connection lifecycle, and latency monitoring.
- **Directives:**
  - Network handlers must parse incoming payloads through validation schemas (e.g., Zod) before updating game stores.
  - Decouple transport mechanics from visual components using port/service abstractions.

---

## 2. Performance & Real-Time Loop Optimization

Interactive WebGL and physics run at 60–120 FPS. Performance degradation directly breaks gameplay:

### A. Zero Allocations in `useFrame`
- **Strict Rule:** Never instantiate objects (`new THREE.Vector3()`, `new THREE.Matrix4()`, `new THREE.Quaternion()`, object literals `{...}`, or arrays `[...]`) inside `useFrame` or tick loops.
- **Mandatory Pattern:** Allocate reusable math objects in module/component scope (refs or static helpers) and mutate in place via `.set()`, `.copy()`, or `.add()`.

### B. Asset & GPU Resource Lifecycle
- Geometries and materials must be reused wherever possible across marble instances.
- When unmounting dynamic 3D elements, ensure textures, geometries, and materials are explicitly disposed if not shared.

---

## 3. Network Synchronization & Multiplayer Architecture

### A. Authoritative vs. Client Prediction
- In peer-to-peer multiplayer, designate an authoritative role (Host) for resolving contested outcomes (e.g., final marble positions, victory conditions).
- Clients may simulate local physics for instant feedback, but must reconcile against authoritative state packets broadcast by the Host upon simulation settlement.

### B. Strict Payload Validation
- Every incoming and outgoing message across the WebRTC data channel must be strictly typed and validated using runtime contracts (`zod` schemas).
- Unknown or malformed packets must be dropped immediately with a logged warning, preventing corrupt state propagation.

---

## 4. Extensibility & Portability

- Modules must communicate through clean interfaces, not concrete canvas instances.
- Adding new game modes, obstacles, or marble abilities must be achievable by composition without modifying the core peer networking protocol or base physics loop.

---

## 5. UI Design System: Mandatory Tactile 3D ("Timbul") Aesthetics

All 2D user interfaces, HUD elements, overlays, and modal dialogs MUST strictly implement the project's signature **tactile 3D ("timbul") visual identity**. Flat, lifeless, generic, or minimalist flat-design components are strictly prohibited.

### A. Absolute Prohibition of Flat Design
- **Prohibited:**
  - Flat 1px border buttons with no depth.
  - Borderless clickable text acting as primary action triggers.
  - Generic plain rectangular cards without raised bottom bevels.
  - Default grey or monochromatic flat utility buttons.

### B. Tactile 3D ("Timbul") Card & Container Standards
- Every modal, scorecard, panel, and HUD container MUST use the established `.timbul-card` or `.timbul-card-subtle` style (or explicit Tailwind equivalents):
  - Cream/ivory or solid vibrant fill background (e.g., `#fdfbf7`, `#ffffff`).
  - Pronounced bottom border (`border-b-[4px]` to `border-b-[6px]`) in a deeper, contrasting shade (e.g., `#ded4c5`, `#65a30d`, `#075985`, `#92400e`).
  - Generous corner radii (`rounded-2xl` to `rounded-3xl` or `rounded-[28px]`).
  - Warm, subtle drop shadows (`shadow-xl` or `0 6px 12px -2px rgba(100, 80, 60, 0.06)`).

### C. Mechanical Raised Button ("Tombol Timbul") Specifications
All clickable buttons MUST feel like physical, spring-loaded arcade buttons:
- **Baseline Structure:**
  - High-contrast, vibrant color fills (`.timbul-btn-coral`, `.timbul-btn-purple`, `.timbul-btn-cream`, `.timbul-btn-green`, `.timbul-btn-honey`, or custom themed palettes).
  - Heavy bottom border giving the illusion of physical extrusion (`border-b-[4px]` to `border-b-[6px]` darker shade).
- **Mandatory Press Displacement (Tactile Depression):**
  - Active states MUST physically depress:
    ```css
    active:translate-y-[2px] active:border-b-[2px]
    ```
  - Smooth transitions (`transition-all duration-100 ease-out`).

### D. Typography & Cartoon Text Strokes
- **Headings & Action Buttons:**
  - Must use `font-heading` (`Fredoka`, cursive, sans-serif) with bold/black font weight (`font-black`).
  - Must apply the high-contrast cartoon outline class `.text-stroke-black-heavy` for readable arcade titles and button labels over dynamic 3D backdrops.
- **Informational & Body Copy:**
  - Must use `font-sans` (`DM Sans`, sans-serif) with high legibility (`font-bold` or `font-semibold`).

### E. Micro-Interactions & Audio Feedback
- Every primary button press and modal trigger SHOULD trigger auditory feedback (e.g. `marbleAudio.playWoodKnockSound()`) alongside visual tactile depression to complete the physical sensation of wooden/marble arcade play.

