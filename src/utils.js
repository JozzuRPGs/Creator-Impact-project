// Utility helpers (rarity/color/picks)

export function colorForRarity(r) {
  switch (r) {
    case "common":
      return 0x7f8c8d;
    case "rare":
      return 0x66c2ff;
    case "epic":
      return 0xb266ff;
    case "legend":
      return 0xffcb3b;
    default:
      return 0x6b7280;
  }
}

export function emojiForRarity(r) {
  switch (r) {
    case "common":
      return "🔹";
    case "rare":
      return "🔷";
    case "epic":
      return "🔮";
    case "legend":
      return "✨";
    default:
      return "🔹";
  }
}

export function pickRarity(RATES) {
  const r = Math.random();
  let acc = 0;
  for (const [k, v] of Object.entries(RATES)) {
    acc += v;
    if (r <= acc) return k;
  }
  return "common";
}

export function pickByRarity(pool, rarity) {
  const subset = pool.filter((x) => x.rarity === rarity);
  return subset[Math.floor(Math.random() * subset.length)];
}
