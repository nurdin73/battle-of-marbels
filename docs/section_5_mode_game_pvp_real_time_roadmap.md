# Section 5: Mode Game (Adventure & PvP) & Roadmap Implementasi

Bagian ini mendefinisikan implementasi dua pilar mode permainan: **Solo Adventure (Course & Puzzles)** dan **Multiplayer PvP Real-Time**, meliputi sinkronisasi fisika jaringan, protokol rekonsiliasi latensi, lifecycle matchmaking kamar, serta timeline sprint pengerjaan.

---

## 5.1 Mode Petualangan Solo (Adventure / Obstacle Course)

Mode petualangan dirancang dengan sistem rintangan fisika bertahap (*level-based progression*) mirip perpaduan mini-golf dan teka-teki taktis.

```
 ┌──────────────────────────────────────────────────────────┐
 │                      Level Progression                   │
 │                                                          │
 │   [Level 1: Pekarangan Rumah]                            │
 │     └─ Belajar bidik, gesekan tanah & pasir              │
 │                                                          │
 │   [Level 2: Jembatan Bambu & Saluran Air]                │
 │     └─ Lintasan sempit bertebing, elevasi miring         │
 │                                                          │
 │   [Level 3: Labirin Bata Merah & Ayam Pembuat Onar]      │
 │     └─ Rintangan bergerak dinamis + switch pemecah pintu │
 └──────────────────────────────────────────────────────────┘
```

### Mekanik Tantangan Solo:
1. **Sistem Par & Bintang Skor:**
   * **Bintang 3:** Selesai dalam $\le \text{Par}$ sentilan.
   * **Bintang 2:** Selesai dalam $\text{Par} + 2$ sentilan.
   * **Bintang 1:** Berhasil mencapai garis akhir / memasukkan kelereng ke lubang target (*target pocket*).
2. **Switch & Trigger Fisika:**
   * Membenturkan gacoan ke kelereng tombol (*Trigger Button*) untuk merobohkan papan penghalang atau membuka gerbang kayu ke seksi arena berikutnya.
3. **Kartu Terbatas per Level:**
   * Setiap level memberikan *fixed deck* kartu trik yang harus dimanfaatkan pemain secara bijak untuk memecahkan puzzle rintangan.

---

## 5.2 Mode Multiplayer PvP (WebRTC PeerJS & WebSocket Relay)

Untuk menghadirkan pertandingan PvP 1-vs-1 tanpa server game mahal yang berat, diterapkan arsitektur **Deterministic Peer-to-Peer (WebRTC DataChannel via PeerJS)** dengan fallback ke **WebSocket Relay**:

```
           ┌─────────────────────────────────────────┐
           │        Signaling Server (Firebase)      │
           │  Matchmaking Queue & Room Handshake     │
           └────────────┬───────────────────┬────────┘
                        │                   │
             WebRTC P2P │ Connection        │ WebRTC P2P
                        ▼                   ▼
                 ┌─────────────┐     ┌─────────────┐
                 │  Player 1   │◄───►│  Player 2   │
                 │  (Host/P1)  │     │  (Guest/P2) │
                 └─────────────┘     └─────────────┘
                  DataChannel (SCTP: Unreliable / Ordered)
```

### Protokol Sinkronisasi Fisika Tanpa Desync:
Alih-alih menyinkronkan posisi transform kelereng setiap tick (yang memboroskan bandwidth dan rentan desinkronisasi pada engine non-deterministik), game menggunakan metode **Input & Seed Synchronization**:

1. **Sinkronisasi Benih Acak (RNG Seed):**
   Di awal room, Host mengirimkan `randomSeed` integer yang sama agar posisi kelereng dan hamburan kerikil dihitung identik pada kedua perangkat.
2. **Paket Data Giliran (Turn Shot Payload):**
   Ketika pemain melepaskan sentilan kelereng, hanya data input tembakan yang dikirim ke lawan:

```typescript
export interface ShotNetworkPayload {
  turnIndex: number;
  playerId: string;
  timestamp: number;
  // Vektor gaya impuls
  impulse: { x: number; y: number; z: number };
  // Posisi awal bola gacoan saat dilepas
  originPosition: { x: number; y: number; z: number };
  // Kartu trik yang aktif digunakan pada sentilan ini
  appliedCardId?: string;
  // Hash verifikasi akhir untuk checksum
  expectedStateChecksum?: number;
}
```

3. **Simulasi Lokal Paralel:**
   Kedua client menjalankan simulasi fisika Rapier secara independen pada mesin masing-masing berdasarkan vektor impuls yang diterima.
4. **Rekonsiliasi Titik Istirahat (Rest State Reconciliation):**
   Ketika semua kelereng berhenti stabil (`SIMULATING` selesai), Host mengirimkan koordinat final seluruh kelereng:
   * Jika selisih posisi $> 0.05\text{ m}$ (terjadi perbedaan toleransi perambatan akibat latensi browser), perangkat Guest secara halus menginterpolasi (*lerp*) posisi kelereng ke koordinat resmi dari Host.

---

## 5.3 Flow Matchmaking & Ruang Tanding (Room Lifecycle)

```typescript
export type RoomStatus = 'WAITING_FOR_OPPONENT' | 'READY' | 'PLAYING' | 'MATCH_OVER';

export interface GameRoom {
  roomId: string;
  createdAt: number;
  hostPlayer: { id: string; name: string; avatar: string };
  guestPlayer?: { id: string; name: string; avatar: string };
  status: RoomStatus;
  gameSettings: {
    turnTimeSeconds: 20; // Batas waktu 20 detik per giliran
    targetMarblesCount: 9;
    ringRadius: 1.8;
  };
}
```

### Siklus Pertandingan PvP:
1. **Cari Lawan / Buat Kode Kamar:** Pemain dapat menekan tombol *Quick Match* atau membagikan link URL 6-karakter (misal: `kelereng.web/room/KL88A2`).
2. **Tukar Handshake P2P:** Sambungan PeerJS terbentuk langsung antar browser.
3. **Turn Loop Berantai:**
   * Timer **20 detik** berjalan serentak di layar kedua pemain.
   * Pemain yang gilirannya habis otomatis mengirimkan sentilan kosong (*Timeout Zero Shot*), giliran langsung berpindah ke musuh.
4. **Penyelesaian Pertandingan:**
   * Skor kelereng yang keluar ring disinkronkan. Pemain pemenang menerima trofi dan EXP yang tersimpan otomatis di Firebase Firestore.

---

## 5.4 Milestone & Roadmap Implementasi

| Fase | Durasi | Target Capaian (Deliverables) |
| :--- | :--- | :--- |
| **Sprint 1: Core Physics & Slingshot** | Minggu 1–2 | Arena tanah dasar, integrasi Rapier WASM, mekanik tarik-lepas, visual trajectory, dan deteksi tumbukan bola. |
| **Sprint 2: Aturan Main & Timer 20s** | Minggu 3 | State loop giliran, timer 20 detik, deteksi kelereng keluar ring, penghitungan kombo, dan kalkulasi skor. |
| **Sprint 3: Sistem Kartu & Firebase** | Minggu 4 | Integrasi Firestore untuk 12 kartu trik, verifikasi schema Zod, konsumsi energi kapur, dan penerapan modifier gaya. |
| **Sprint 4: Aset 3D, Shader, & Audio** | Minggu 5 | Shader kaca kelereng dengan swirl warna, lighting golden hour, integrasi props pekarangan low-poly, dan SFX benturan. |
| **Sprint 5: Mode Solo & P2P PvP** | Minggu 6–7 | Level solo obstacle course, integrasi PeerJS/WebRTC untuk multiplayer real-time, dan rekonsiliasi posisi Host-Guest. |
| **Sprint 6: Polish & Production Deploy** | Minggu 8 | Optimasi bundle Vite, kompresi Draco aset, QA mobile touch responsiveness, dan deployment ke Vercel/Firebase Hosting. |