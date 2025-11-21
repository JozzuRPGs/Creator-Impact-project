// Core constants and simple data

export const YOUTUBER_POOL = [
  // Legend: higher base, one tanky, one DPS
  { name: "Windah", atk: 32, hp: 32, rarity: "legend" },
  { name: "MiawAug", atk: 36, hp: 28, rarity: "legend" },
  // Epic: clearly above rare, some flavor differences
  { name: "Bang AL", atk: 12, hp: 22, rarity: "epic" },
  { name: "Wielino", atk: 14, hp: 20, rarity: "epic" },
  { name: "Mythia Brot2", atk: 11, hp: 18, rarity: "epic" },
  { name: "Reza Auditore", atk: 11, hp: 18, rarity: "epic" },
  // Rare: mid-tier baseline
  { name: "Om Ray", atk: 9, hp: 12, rarity: "rare" },
  { name: "Dimsk", atk: 7, hp: 16, rarity: "rare" },
  { name: "Caveine", atk: 9, hp: 12, rarity: "rare" },
  { name: "Jozzu RPGs", atk: 5, hp: 12, rarity: "common" },
];

export const RATES = {
  common: 0.62,
  rare: 0.25,
  epic: 0.1,
  legend: 0.03,
};

export const BUFF = {
  atkPerLevel: 2,
  hpPerLevel: 6,
};

export const ENEMY_BASE = { name: "Dollar Kuning", hp: 50, atk: 6 };

export const GACHA_COST = { 1: 160, 10: 1600 };

// Manual upgrade costs
// base: flat crystals cost, perLevel: additional crystals per current level-1
// shard: shards required per manual upgrade
// Rarity-based cost multipliers (tune here)
export const RARITY_COST_MULT = { common: 1.0, rare: 1.2, epic: 1.6, legend: 2.2 };

export const UPGRADE = {
  base: 240,
  perLevel: 40,
  shard: 1,
  rarityCostMult: RARITY_COST_MULT,
};

// Ascend requirements and bonuses
export const ASCEND = {
  levelReq: 5,
  shards: 3,
  rarityShardMult: RARITY_COST_MULT,
  atkBonus: 7,
  hpBonus: 14,
  // Each additional rank increases bonus by this fraction (e.g., 0.25 => +25% per rank)
  rankScale: 0.25,
};

// Rarity-based stat scaling per level (higher rarity scales faster)
export const RARITY_STAT_MULT = { common: 1.0, rare: 1.2, epic: 1.5, legend: 2.0 };

// Pity settings (number of pulls guaranteeing at least that rarity)
export const PITY = { epic: 20, legend: 60 };

// Enemy themes rotate by stage
export const ENEMY_THEMES = [
  { name: "Dollar Kuning", color: 0xffe500, hp: 50, atk: 6 },
  { name: "Dollar Hijau",  color: 0x22cc88, hp: 58, atk: 7 },
  { name: "Dollar Merah",  color: 0xff5555, hp: 66, atk: 8 },
  { name: "Dollar Biru",   color: 0x4da3ff, hp: 74, atk: 9 },
];

// Critical hit settings
export const CRIT = { chance: 0.12, mult: 1.75 };
