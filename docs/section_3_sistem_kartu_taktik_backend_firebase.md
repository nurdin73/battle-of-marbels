# Section 3: Sistem Kartu, Taktik, & Backend Firebase

Bagian ini mendefinisikan arsitektur sistem kartu taktis, katalog efek lengkap, skema database Firestore, sinkronisasi real-time, caching offline, dan penerapan parameter fisika secara dinamis dari cloud.

---

## 3.1 Integrasi Arsitektur Firebase Firestore

Untuk memungkinkan tim game designer menambah kartu baru, mengubah nilai energi, atau menyeimbangkan (*balancing*) koefisien fisika secara langsung (LiveOps) tanpa perlu build ulang client:

```
 ┌────────────────────────────────────────────────────────┐
 │            Firebase Cloud Firestore                    │
 │  Collection: "tactical_cards"                          │
 │  - id, name, category, cost, enabled, modifier, rarity │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼  Snapshot Listener / Cache (IndexedDB)
 ┌────────────────────────────────────────────────────────┐
 │          Client: `cardService.ts`                      │
 │  - Memuat fallback lokal jika offline                  │
 │  - Validasi schema Zod runtime                         │
 │  - Injeksi ke `useCardStore` (Zustand)                 │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │           Rapier Physics & UI Overlay                  │
 │  - Kartu langsung render di Card Deck HUD              │
 │  - Modifier fisika diakses saat fase sentilan          │
 └───────────────────────────┘
```

### Skema Dokumen Firestore (`tactical_cards/{cardId}`):
```json
{
  "id": "CARD_CLAY_PUDDLE",
  "name": "Kubangan Tanah Liat",
  "category": "TERRAIN",
  "cost": 2,
  "cooldownTurns": 2,
  "rarity": "UNCOMMON",
  "enabled": true,
  "minClientVersion": "1.0.0",
  "iconUrl": "https://storage.googleapis.com/.../card_clay.png",
  "description": "Menempatkan area lengket yang menghentikan kelereng lawan seketika.",
  "modifier": {
    "frictionMultiplier": 3.5,
    "restitutionBonus": -0.6,
    "spawnCollider": {
      "type": "MUD_ZONE",
      "radius": 0.45,
      "durationTurns": 2
    }
  },
  "updatedAt": "2026-10-13T10:00:00Z"
}
```

---

## 3.2 Katalog Kartu Trik Resmi (Koleksi Diperluas)

| ID Kartu | Nama Kartu | Kategori | Biaya Kapur | Rarity | Efek Fisika & Mekanisme Lapangan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CARD_BROOM` | **Sapu Lidi** | Terrain | 1 | COMMON | Menetralkan zona pasir/kerikil pada jalur bidik selebar $0.4\text{ m}$. $\mu_k \to 0.20$. |
| `CARD_CHALK` | **Bedak Jari** | Aim | 1 | COMMON | Memperpanjang lintasan raycast $2.5\text{ m} \to 5.5\text{ m}$ dan memperlihatkan garis sudut pantul target pertama. |
| `CARD_LOB` | **Sentilan Cungkil** | Launch | 2 | UNCOMMON | Menambahkan elevasi parabola $F_y = 0.45 \cdot F_{\text{horizontal}}$, melompati kelereng depan atau cekungan. |
| `CARD_BOARD` | **Papan Triplek** | Collider | 2 | COMMON | Menaruh papan kayu temporer ($0.6\text{ m}$) di tepi arena dengan koefisien pantulan tinggi ($e = 0.90$). |
| `CARD_TRENCH` | **Bikin Parit** | Defensive | 2 | RARE | Menciptakan lekukan melingkar sedalam $0.03\text{ m}$ di bawah gacoan sendiri; meningkatkan stabilitas terhadap tabrakan musuh. |
| `CARD_SWAP` | **Tukar Gacoan** | Loadout | 1 | COMMON | Mengganti jenis gacoan aktif secara instan (misal: Kaca ke Gotri Besi) sebelum menyentil tanpa ubah posisi. |
| `CARD_WIND` | **Kipas Kardus** | Disruptive | 2 | RARE | Mengembuskan angin searah garis bidik, memberikan dorongan linear $F_{\text{wind}} = 0.08\text{ N}$ searah vektor bidik. |
| `CARD_MUD` | **Tanah Liat Basah** | Terrain | 2 | UNCOMMON | Menciptakan genangan becek di titik target; kelereng yang melintas kehilangan $80\%$ momentumnya seketika. |
| `CARD_RUBBER` | **Karet Gelang** | Launch | 3 | EPIC | Memberi pegas impuls ganda: tembakan berikutnya mendapat boost daya sentil $+40\%$ tanpa pentalan liar gacoan. |
| `CARD_FEATHER` | **Sentilan Halus** | Aim | 1 | COMMON | Mengaktifkan kontrol micro-impulse: batas minimum gaya diperkecil hingga $0.05\text{ N}$ untuk tembakan presisi jarak dekat. |
| `CARD_MAGNETIC` | **Batu Magnet** | Tactical | 3 | EPIC | Memberikan daya tarik medan magnetik ringan ($r = 0.5\text{ m}$) antara kelereng gacoan besi dengan kelereng biji terdekat. |
| `CARD_PEBBLE` | **Lempar Kerikil** | Disruptive | 1 | COMMON | Menempatkan 2 kerikil acak di depan garis tembak lawan untuk membelokkan lintasannya pada ronde berikutnya. |

---

## 3.3 TypeScript Data Modeling & Runtime Schema Validation

Validasi runtime menggunakan library **Zod** memastikan bahwa konfigurasi baru dari Firestore aman dieksekusi oleh engine fisika:

```typescript
import { z } from 'zod';

export const PhysicsModifierSchema = z.object({
  frictionMultiplier: z.number().optional().default(1.0),
  restitutionBonus: z.number().optional().default(0.0),
  verticalImpulseRatio: z.number().optional().default(0.0),
  trajectoryDistanceMultiplier: z.number().optional().default(1.0),
  impulseMultiplier: z.number().optional().default(1.0),
  spawnCollider: z.object({
    type: z.enum(['BOARD_WOOD', 'TRENCH_DENT', 'MUD_ZONE', 'PEBBLE_OBSTACLE']),
    dimensions: z.array(z.number()).length(3).optional(),
    radius: z.number().optional(),
    durationTurns: z.number().default(1),
  }).optional(),
});

export const TacticalCardSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  description: z.string(),
  category: z.enum(['TERRAIN', 'AIM', 'LAUNCH', 'COLLIDER', 'LOADOUT', 'DISRUPTIVE', 'TACTICAL']),
  cost: z.number().int().min(1).max(5),
  cooldownTurns: z.number().int().default(1),
  rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'EPIC']),
  enabled: z.boolean().default(true),
  modifier: PhysicsModifierSchema,
});

export type TacticalCard = z.infer<typeof TacticalCardSchema>;
export type PhysicsModifier = z.infer<typeof PhysicsModifierSchema>;
```

---

## 3.4 Service Layer: Firebase Firestore & Caching System

Modul `cardService.ts` menangani penarikan kartu secara real-time dan menyediakan fallback lokal jika koneksi terputus:

```typescript
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { TacticalCard, TacticalCardSchema } from '../types/cards';

const LOCAL_FALLBACK_CARDS: TacticalCard[] = [];

class CardService {
  private activeCards: Map<string, TacticalCard> = new Map();

  public subscribeToActiveCards(onUpdate: (cards: TacticalCard[]) => void) {
    const q = query(collection(db, 'tactical_cards'), where('enabled', '==', true));

    return onSnapshot(q, (snapshot) => {
      const validatedCards: TacticalCard[] = [];
      snapshot.forEach((doc) => {
        const parseResult = TacticalCardSchema.safeParse(doc.data());
        if (parseResult.success) {
          validatedCards.push(parseResult.data);
          this.activeCards.set(parseResult.data.id, parseResult.data);
        }
      });
      onUpdate(validatedCards.length > 0 ? validatedCards : LOCAL_FALLBACK_CARDS);
    }, (error) => {
      console.error('Firestore Card Sync error, using local fallback:', error);
      onUpdate(LOCAL_FALLBACK_CARDS);
    });
  }

  public getCardById(id: string): TacticalCard | undefined {
    return this.activeCards.get(id);
  }
}

export const cardService = new CardService();
```

---

## 3.5 Penerapan Modifier Fisika pada Rapier Hook

```typescript
import { useCardStore } from '../store/useCardStore';
import { RapierRigidBody } from '@react-three/rapier';

export const useApplyShotWithCard = () => {
  const activeCard = useCardStore((state) => state.activeCardThisTurn);
  const consumeActiveCard = useCardStore((state) => state.consumeCard);

  const executeShot = (
    baseImpulseVector: { x: number; y: number; z: number },
    rigidBodyRef: React.RefObject<RapierRigidBody>
  ) => {
    if (!rigidBodyRef.current) return;

    let { x, y, z } = baseImpulseVector;
    const mod = activeCard?.modifier;

    if (mod) {
      if (mod.impulseMultiplier) {
        x *= mod.impulseMultiplier;
        z *= mod.impulseMultiplier;
      }
      if (mod.verticalImpulseRatio) {
        const horizontalMagnitude = Math.hypot(x, z);
        y += horizontalMagnitude * mod.verticalImpulseRatio;
      }
    }

    rigidBodyRef.current.applyImpulse({ x, y, z }, true);

    if (activeCard) {
      consumeActiveCard();
    }
  };

  return { executeShot };
};
```