# Kelereng Clash 3D Web — Master Architecture & Planning

Selamat datang di dokumentasi arsitektur dan pengembangan game kelereng 3D berbasis web (**Kelereng Clash: Pertarungan Kelereng Tradisional**).

Seluruh perencanaan teknis dan fungsional telah dipecah ke dalam dokumen modular terpisah untuk memudahkan pengembangan per komponen:

## Modul Dokumentasi

| **Dokumen** | **Judul Modul** | **Deskripsi Singkat** | 
| [**Section 1: Tech Stack & Fondasi Web**](./01_tech_stack_fondasi.md) | Fondasi Arsitektur Web & Engine | Pilihan engine (R3F), Rapier WASM, pipeline build, state machine, dan struktur proyek. | 
| [**Section 2: Core Gameplay & Fisika**](./02_gameplay_simulasi_fisika.md) | Simulasi Fisika & Aturan Main | Persamaan elastis tumbukan, kontrol bidik tarik-lepas, visual trajectory, dan validasi skor ring. | 
| [**Section 3: Sistem Kartu & Firebase**](./03_sistem_kartu_firebase.md) | Kartu Taktis & LiveOps Firebase | Katalog 12 kartu trik resmi, schema Zod, sinkronisasi Firestore real-time, dan modifier fisika. | 
| [**Section 4: Aset 3D, Lingkungan, & UI**](./04_aset_3d_lingkungan_ui.md) | Aset 3D, Shader, & Tampilan UI | Model low-poly pekarangan, shader kaca kelereng procedural, pencahayaan sore, dan desain HUD. | 
| [**Section 5: Mode Game & Multiplayer**](./05_mode_game_pvp_adventure.md) | Solo Adventure, PvP, & Roadmap | Level puzzle rintangan, sinkronisasi P2P WebRTC/PeerJS, matchmaking, dan roadmap implementasi. | 

## Ringkasan Spesifikasi Kunci

* **Engine 3D:** React Three Fiber (R3F) + Three.js

* **Physics Engine:** `@react-three/rapier` (WebAssembly Fixed $60\text{ Hz}$)

* **Batas Waktu Giliran:** $20\text{ detik}$ per giliran tembak

* **State Management:** Zustand multi-store

* **LiveOps Backend:** Firebase Firestore & Remote Config

* **Multiplayer P2P:** WebRTC DataChannel via PeerJS dengan fallback WebSocket Relay