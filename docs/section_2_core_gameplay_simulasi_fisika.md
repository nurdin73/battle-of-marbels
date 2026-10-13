# Section 2: Core Gameplay & Simulasi Fisika

Seksi ini membedah model matematis, penanganan input pointer, sistem benturan antar kelereng, trajektori bidik, serta logika penentuan skor pada arena tradisional.

---

## 2.1 Model Fisika & Material Kelereng

Setiap objek kelereng dimodelkan sebagai rigid body bergeometri bola (*Sphere Collider*) dengan parameter fisika material yang dikalibrasi realistis:

### Spesifikasi Parameter Fisika
| Objek | Massa ($m$) | Restitution ($e$, Pantulan) | Gesekan Statis ($\mu_s$) | Gesekan Dinamis ($\mu_k$) | Damping Linear / Angular |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gacoan Kaca (Standar)** | $0.020\text{ kg}$ | $0.78$ | $0.35$ | $0.25$ | $0.15$ / $0.20$ |
| **Gacoan Marmer/Batu** | $0.038\text{ kg}$ | $0.62$ | $0.45$ | $0.35$ | $0.25$ / $0.30$ |
| **Gacoan Gotri (Besi)** | $0.055\text{ kg}$ | $0.50$ | $0.40$ | $0.30$ | $0.20$ / $0.25$ |
| **Kelereng Target (Biji)** | $0.015\text{ kg}$ | $0.75$ | $0.32$ | $0.22$ | $0.15$ / $0.20$ |
| **Permukaan Tanah Padat** | $\infty$ (Fixed) | $0.30$ | $0.55$ | $0.45$ | — |
| **Permukaan Berpasir** | $\infty$ (Fixed) | $0.10$ | $0.85$ | $0.75$ | — |

### Persamaan Momentum & Impuls Tumbukan
Tumbukan dua kelereng diasumsikan tumbukan elastis parsial 2D/3D. Ketika kelereng $A$ menabrak kelereng $B$:

$$
\vec{v}_A' = \vec{v}_A - \frac{(1 + e) m_B}{m_A + m_B} \frac{(\vec{v}_A - \vec{v}_B) \cdot (\vec{x}_A - \vec{x}_B)}{\Vert\vec{x}_A - \vec{x}_B\Vert^2} (\vec{x}_A - \vec{x}_B)
$$

$$
\vec{v}_B' = \vec{v}_B + \frac{(1 + e) m_A}{m_A + m_B} \frac{(\vec{v}_A - \vec{v}_B) \cdot (\vec{x}_A - \vec{x}_B)}{\Vert\vec{x}_A - \vec{x}_B\Vert^2} (\vec{x}_A - \vec{x}_B)
$$

Koefisien restituasi gabungan dihitung oleh engine:
$$
e_{\text{eff}} = \frac{e_A + e_B}{2}
$$

---

## 2.2 Mekanik Kontrol Input (Slingshot / Tarik-Lepas)

Mekanik bidikan bekerja secara intuitif baik pada layar sentuh ponsel maupun klik-tarik mouse di desktop:

```
[ Diagram Tarik-Lepas (Pointer Interaction) ]
               Garis Bidik (Forward Direction)
                         ▲
                         │
                         │
                    ┌────┴────┐
                    │ Gacoan  │  <-- Posisi Bola (x0, z0)
                    └────┬────┘
                         │
           Vektor Tarik  │  Drag Distance (d)
           (Pointer)     ▼
                         ●  Posisi Kursor Saat Drag (x_p, z_p)
```

### Algoritma Perhitungan Vektor Impuls:
1. **Raycast Plane Detection:** Posisi kursor diproyeksikan ke bidang arena horizontal ($Y = 0$).
2. **Perhitungan Jarak Tarik ($d$):**
   $$
   \vec{\Delta} = \vec{P}_{\text{gacoan}} - \vec{P}_{\text{pointer}}
   $$
   $$
   d = \operatorname{clamp}\left(\Vert\vec{\Delta}\Vert, 0, d_{\max}\right) \quad (d_{\max} = 3.0\text{ meter unit})
   $$
3. **Normalisasi Arah:**
   $$
   \hat{u} = \frac{\vec{\Delta}}{\Vert\vec{\Delta}\Vert}
   $$
4. **Kalkulasi Besaran Gaya Impuls ($J$):**
   $$
   J = J_{\min} + \left(\frac{d}{d_{\max}}\right)^p \cdot (J_{\max} - J_{\min})
   $$
   * Nilai eksponensial $p = 1.3$ digunakan untuk memberikan efek sentilan responsif (kekuatan naik progresif).
   * Impuls diterapkan ke RigidBody Rapier:
     $$
     \vec{F}_{\text{impulse}} = J \cdot \hat{u}
     $$

---

## 2.3 Visual Trajectory & Projection Line

Garis bidik ditampilkan menggunakan titik-titik proyeksi (*dotted dashed line*):
* **Panjang Standar:** Proyeksi lintasan menampilkan jarak $2.5\text{ meter}$ ke arah target tanpa kartu khusus.
* **Deteksi Rintangan Raycast:** Engine menembakkan raycast instan ke depan; jika terdapat kelereng target atau dinding papan di jalur bidik, titik proyeksi menampilkan cincin penanda kontak (*impact marker*) dan garis pantulan sekunder pendek.
* **Integrasi Kartu Bedak Jari:** Jika kartu aktif, panjang garis bidik dilipatgandakan ($5.0\text{ meter}$) dan menampilkan prediksi sudut pantul kelereng target pertama.

---

## 2.4 Deteksi Lingkaran Arena & Logika Penentuan Skor

Lingkaran arena tradisional dimodelkan dengan radius $R_{\text{ring}} = 1.8\text{ meter}$ dari titik pusat $(0, 0, 0)$.

```
   ┌──────────────────────────────────────────────┐
   │                  LUAR RING                   │
   │                                              │
   │               ╭──────────────╮               │
   │            ╭──╯              ╰──╮            │
   │          ╭─╯                    ─╮           │
   │         │    ● Kelereng Target   │           │
   │        │                         │           │
   │        │          (0,0)          │           │
   │        │            +            │           │
   │         │                       │            │
   │          ╰─╮                    ╭─╯          │
   │            ╰──╮              ╭──╯            │
   │               ╰──────────────╯               │
   │                                              │
   │             R_ring = 1.8m                    │
   └──────────────────────────────────────────────┘
```

### Logika Validasi Skor Setiap Akhir Giliran (`SCORE_EVALUATION`):
1. **Posisi Kelereng Target:**
   Untuk setiap kelereng target $i$:
   $$
   \text{Dist}_i = \sqrt{x_i^2 + z_i^2}
   $$
   Jika $\text{Dist}_i > R_{\text{ring}} + r_{\text{kelereng}}$:
   * Kelereng target dinyatakan **KELUAR RING**.
   * Pemain aktif mendapat $+1\text{ Poin}$.
   * Kelereng tersebut dinonaktifkan dari arena fisik (diberi animasi menghilang/masuk kantong).
   * Pemain aktif mendapatkan status **KOMBO SENTILAN** (memperoleh giliran tambahan langsung).

2. **Validasi Gacoan Pemain Sendiri:**
   $$
   \text{Dist}_{\text{gacoan}} = \sqrt{x_{\text{gacoan}}^2 + z_{\text{gacoan}}^2}
   $$
   * **Kasus A (Gacoan tetap di dalam ring):** Sah. Posisi gacoan dibiarkan berada di tempat terakhir ia berhenti untuk giliran berikutnya.
   * **Kasus B (Gacoan terpental keluar ring):** Pelanggaran / *Fault*. Giliran pemain langsung berakhir tanpa kombo tembakan, dan gacoan dikembalikan ke garis batas luar arena pada giliran selanjutnya.

3. **Kondisi Menang (Win Condition):**
   * Mode PvP berakhir saat kelereng target di dalam ring habis. Pemain dengan poin terbanyak menang.
   * Jika skor imbang, putaran *sudden death* (1 kelereng di tengah ring) dimainkan.