import { TacticalCard, TacticalCardSchema } from '../types/card.types';

export const OFFICIAL_TACTICAL_CARDS: TacticalCard[] = [
  {
    id: 'CARD_CHALK',
    name: 'Bedak Jari',
    description: 'Menaburkan bedak pada jari: jarak proyeksi bidikan bertambah 80%.',
    category: 'AIM',
    cost: 1,
    cooldownTurns: 1,
    rarity: 'COMMON',
    enabled: true,
    imageUrl: '/assets/power-cards/bedak-jari.jpg',
    modifier: {
      trajectoryDistanceMultiplier: 1.8,
      frictionMultiplier: 1.0,
      restitutionBonus: 0.0,
      verticalImpulseRatio: 0.0,
      impulseMultiplier: 1.0,
      apexHeightMultiplier: 1.0,
      precisionForceRatio: 1.0,
    },
  },
  {
    id: 'CARD_RUBBER',
    name: 'Karet Gelang',
    description: 'Pegas karet ganda: memberikan boost daya sentil dahsyat +40%.',
    category: 'LAUNCH',
    cost: 3,
    cooldownTurns: 2,
    rarity: 'EPIC',
    enabled: true,
    imageUrl: '/assets/power-cards/karet-gelang.jpg',
    modifier: {
      impulseMultiplier: 1.4,
      trajectoryDistanceMultiplier: 1.0,
      frictionMultiplier: 1.0,
      restitutionBonus: 0.0,
      verticalImpulseRatio: 0.0,
      apexHeightMultiplier: 1.0,
      precisionForceRatio: 1.0,
    },
  },
  {
    id: 'CARD_LOB',
    name: 'Sentilan Cungkil',
    description: 'Sudut cungkil tinggi: lengkungan parabola melambung 2.2x lebih tinggi.',
    category: 'LAUNCH',
    cost: 2,
    cooldownTurns: 1,
    rarity: 'UNCOMMON',
    enabled: true,
    imageUrl: '/assets/power-cards/sentilan-cungkil.jpg',
    modifier: {
      apexHeightMultiplier: 2.2,
      verticalImpulseRatio: 0.35,
      impulseMultiplier: 1.0,
      trajectoryDistanceMultiplier: 1.0,
      frictionMultiplier: 1.0,
      restitutionBonus: 0.0,
      precisionForceRatio: 1.0,
    },
  },
  {
    id: 'CARD_FEATHER',
    name: 'Sentilan Halus',
    description: 'Sentuhan mikro presisi: meredam gaya tembakan 50% untuk bidikan jarak dekat.',
    category: 'AIM',
    cost: 1,
    cooldownTurns: 1,
    rarity: 'COMMON',
    enabled: true,
    imageUrl: '/assets/power-cards/sentilan-halus.jpg',
    modifier: {
      precisionForceRatio: 0.5,
      impulseMultiplier: 0.65,
      trajectoryDistanceMultiplier: 0.8,
      frictionMultiplier: 1.0,
      restitutionBonus: 0.0,
      verticalImpulseRatio: 0.0,
      apexHeightMultiplier: 0.7,
    },
  },
  {
    id: 'CARD_SWAP',
    name: 'Tukar Gotri Besi',
    description: 'Ganti instan ke bola gotri besi berbobot berat untuk tumbukan masif.',
    category: 'LOADOUT',
    cost: 1,
    cooldownTurns: 2,
    rarity: 'COMMON',
    enabled: true,
    imageUrl: '/assets/power-cards/tukar-gotri-besi.jpg',
    modifier: {
      swapMaterial: 'BEARING_STEEL',
      impulseMultiplier: 1.15,
      trajectoryDistanceMultiplier: 1.0,
      frictionMultiplier: 1.0,
      restitutionBonus: 0.0,
      verticalImpulseRatio: 0.0,
      apexHeightMultiplier: 1.0,
      precisionForceRatio: 1.0,
    },
  },
  {
    id: 'CARD_BROOM',
    name: 'Sapu Lidi',
    description: 'Membersihkan arena: membuka jalur sapuan licin dengan gesekan minimal pada lajur luncur.',
    category: 'TERRAIN',
    cost: 1,
    cooldownTurns: 1,
    rarity: 'COMMON',
    enabled: true,
    imageUrl: '/assets/power-cards/sapu-lidi.jpg',
    modifier: {
      frictionMultiplier: 0.6,
      impulseMultiplier: 1.1,
      trajectoryDistanceMultiplier: 1.2,
      restitutionBonus: 0.0,
      verticalImpulseRatio: 0.0,
      apexHeightMultiplier: 1.0,
      precisionForceRatio: 1.0,
    },
  },
  {
    id: 'CARD_BOARD',
    name: 'Papan Pantul',
    description: 'Memunculkan papan kayu pantul di arena dan memberikan dorongan pantulan ekstra +25%.',
    category: 'COLLIDER',
    cost: 2,
    cooldownTurns: 2,
    rarity: 'COMMON',
    enabled: true,
    imageUrl: '/assets/power-cards/papan-pantul.png',
    modifier: {
      restitutionBonus: 0.25,
      impulseMultiplier: 1.05,
      trajectoryDistanceMultiplier: 1.0,
      frictionMultiplier: 1.0,
      verticalImpulseRatio: 0.0,
      apexHeightMultiplier: 1.0,
      precisionForceRatio: 1.0,
    },
  },
  {
    id: 'CARD_WIND',
    name: 'Kipas Kardus',
    description: 'Dorongan angin kencang: memberikan akselerasi aerodinamis kontinu ke arah luncuran.',
    category: 'DISRUPTIVE',
    cost: 2,
    cooldownTurns: 2,
    rarity: 'RARE',
    enabled: true,
    imageUrl: '/assets/power-cards/kipas-kardus.png',
    modifier: {
      impulseMultiplier: 1.2,
      trajectoryDistanceMultiplier: 1.15,
      frictionMultiplier: 0.9,
      restitutionBonus: 0.0,
      verticalImpulseRatio: 0.0,
      apexHeightMultiplier: 1.0,
      precisionForceRatio: 1.0,
    },
  },
  {
    id: 'CARD_MAGNETIC',
    name: 'Batu Magnet',
    description: 'Medan magnet aktif: memancarkan daya tarik fisik yang menyedot kelereng target di depannya.',
    category: 'TACTICAL',
    cost: 3,
    cooldownTurns: 3,
    rarity: 'EPIC',
    enabled: true,
    imageUrl: '/assets/power-cards/batu-magnet.png',
    modifier: {
      impulseMultiplier: 1.3,
      restitutionBonus: 0.15,
      trajectoryDistanceMultiplier: 1.1,
      frictionMultiplier: 1.0,
      verticalImpulseRatio: 0.0,
      apexHeightMultiplier: 1.0,
      precisionForceRatio: 1.0,
    },
  },
];

class CardService {
  private cardsMap: Map<string, TacticalCard> = new Map();

  constructor() {
    this.initCatalog();
  }

  private initCatalog(): void {
    OFFICIAL_TACTICAL_CARDS.forEach((rawCard) => {
      const parsed = TacticalCardSchema.safeParse(rawCard);
      if (parsed.success) {
        this.cardsMap.set(parsed.data.id, parsed.data);
      }
    });
  }

  public getAllCards(): TacticalCard[] {
    return Array.from(this.cardsMap.values());
  }

  public getCardById(id: string): TacticalCard | undefined {
    return this.cardsMap.get(id);
  }

  /**
   * Draws a random starting hand of 3 unique cards
   */
  public drawHand(count: number = 3): TacticalCard[] {
    const all = this.getAllCards();
    const shuffled = [...all].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}

export const cardService = new CardService();
