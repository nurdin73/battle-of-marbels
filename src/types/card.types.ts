import { z } from 'zod';

export const PhysicsModifierSchema = z.object({
  frictionMultiplier: z.number().optional().default(1.0),
  restitutionBonus: z.number().optional().default(0.0),
  verticalImpulseRatio: z.number().optional().default(0.0),
  trajectoryDistanceMultiplier: z.number().optional().default(1.0),
  impulseMultiplier: z.number().optional().default(1.0),
  apexHeightMultiplier: z.number().optional().default(1.0),
  precisionForceRatio: z.number().optional().default(1.0),
  swapMaterial: z.enum(['GLASS_CLASSIC', 'MARBLE_STONE', 'BEARING_STEEL']).optional(),
  spawnCollider: z
    .object({
      type: z.enum(['BOARD_WOOD', 'TRENCH_DENT', 'MUD_ZONE', 'PEBBLE_OBSTACLE']),
      dimensions: z.array(z.number()).length(3).optional(),
      radius: z.number().optional(),
      durationTurns: z.number().default(1),
    })
    .optional(),
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
export type CardRarity = TacticalCard['rarity'];
export type CardCategory = TacticalCard['category'];
