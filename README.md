# Creator Impact — Gacha Autobattler

## Structure
- `index.html` — UI shell and script includes (Phaser CDN + `src/main.js`).
- `style.css` — UI styles (HSR-like glass look).
- `src/constants.js` — Data and balance constants (pool, rates, buffs, enemy, gacha cost).
- `src/utils.js` — Pure helpers (rarity emoji/color, RNG pickers).
- `src/scene.js` — Main Phaser scene (DOM hooks, gacha, battle, rendering).
- `src/main.js` — Phaser bootstrap/config.

## Run
Some browsers block ES module imports from `file://`. Serve locally:

### Windows (cmd)
```cmd
python -m http.server 8000
```
Open http://localhost:8000/

Alternatively (Node.js):
```cmd
npx serve -l 8000
```

## Deploy (Vercel)
This is a static site — no build step needed. A `vercel.json` is included to set cache headers.

### One-time (CLI)
```cmd
npx vercel login
```

### Deploy preview
```cmd
npx vercel
```
- When prompted:
	- Framework: Other
	- Output directory: .

### Production deploy
```cmd
npx vercel --prod
```

### Caching behavior
- `vercel.json` configures:
	- Static assets (`*.js, *.css, images, fonts`): `Cache-Control: public, max-age=31536000, immutable`.
	- HTML (`/` and `/index.html`): `Cache-Control: no-store` for instant updates.
	- No rewrites are needed; everything serves from the project root.

## Notes
- Gacha costs: 1x=160, 10x=1600. Button disables when crystals insufficient.
- Team fully heals at battle start. HP/ATK grow on dupes/upgrades.
- Enemy HP clamped to 0 for consistent UI.
 - Progression: victory grants crystals and advances Stage; current stage shown next to Battle.
 - Persistence: team, crystals, and stage auto-save to localStorage.
 - Pity: Epic guaranteed after 20 pulls, Legend after 60 (counters shown).
 - Enemy themes: color/name change with stage rotation; stats scale by stage and team size.
 - Crits: 12% chance at 1.75× damage (slightly lower for enemies), shown with larger floating text.
 - Audio: lightweight beeps on hits/victory; toggle with Sound On/Off button; preference persists.
	- Streamer Mode: hide Settings, rates/pity, and Battle Log (toggle button or press `S`).
	- Victory Recap: modal shows reward and cleared stage; dismiss via button, Enter, Space, or Esc; shows a brief in-canvas “Next: Stage X” hint.