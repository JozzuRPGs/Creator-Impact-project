// Core constants and simple data

export const YOUTUBER_POOL = [
  { name: "Windah", atk: 6, hp: 24, rarity: "legend" },
  { name: "MiawAug", atk: 5, hp: 26, rarity: "legend" },
  { name: "NapLive", atk: 7, hp: 20, rarity: "rare" },
  { name: "Ray Restu", atk: 8, hp: 18, rarity: "rare" },
  { name: "Wielino", atk: 5, hp: 28, rarity: "epic" },
  { name: "Dimsk", atk: 5, hp: 28, rarity: "epic" },
  { name: "Jozzu RPGs", atk: 6, hp: 22, rarity: "common" },
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
export const UPGRADE = { base: 240, perLevel: 40, shard: 1 };

// Ascend requirements and bonuses
export const ASCEND = {
  levelReq: 5,
  shards: 3,
  atkBonus: 5,
  hpBonus: 10,
};

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
