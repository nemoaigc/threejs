# Ground v1 — Claude + Three.js craft

**Date:** 2026-07-26  
**Scope:** Rebuild village surface stack as stylized procedural factories (same craft bar as guild / temple / inn heroes).  
**Stack:** plain ES module JS + three.js only.

## Layers delivered

| id | texture craft | mesh factory |
|----|---------------|--------------|
| `grass` | Soft spring base + large radial patches + mid mottle + sparse dry freckles | `createMeadowGround` plane @ y=0 |
| `dirt_road` | Sandy packed earth, **dual soft ruts along U**, crown, edge wear, light pebbles | `createDirtRoadTile` road bed + shoulder |
| `shoulder` | Symmetric V gradient grass→dirt→grass (fbm tint) | Wider box under road (`width * 1.3`) |
| `cobble_plaza` | Pale warm offset-bond slabs, soft HL/shade, warm mortar | Pad + thin pale rim |
| `dirt_apron` | Warm sand radial **alpha fade** + soft scuffs | `CircleGeometry`, transparent, no hard disc |

## UV / frame contracts

- Road local: **+X along length**, **+Z across width**, sole ≈ y=0  
- Dirt road texture: **U = along road**, **V = across** — ruts at V≈0.34 / 0.66  
- Road mesh clones map and sets `repeat.set(length/width, 1)` so ruts tile along the path  
- Shoulder V: edge=grass, centre=dirt (only flanks visible beside bed)  
- All ground: `userData.noOutline = true`

## Quality choices

- Bright palette (spring green / sand beige / cream stone) — no muddy PBR soup  
- Empty > clutter: no micro grass tuft scatter (API `scatterGroundMicroDetail` stays no-op)  
- Authored `public/content/env/grass.png` + `road_dirt.png` still preferred when load succeeds; cobble / shoulder / apron always procedural craft  
- Canvas singletons via `ensureEnvTextures()`; sync getters for mesh factories  
- Node without `document`: DataTexture stubs so import/syntax smoke does not throw

## Public API (stable for `world.js`)

- `ensureEnvTextures()`
- `createMeadowGround(size)`
- `createDirtRoadTile` / `createRoadTile(length, width)`
- `createCobblePlaza` / `createPlazaPad(size)`
- `createBuildingDirtApron(radius)`

## Files touched

- `src/environment/textures.js` — full craft rewrite  
- `src/environment/flat-env.js` — factory polish + UV fix  
- `docs/ENVIRONMENT_CRAFT.zh.md` — 5-layer table  
- `src/environment/ground-v1/RUN_LOG.md` — this log  

## Verification

```bash
node --check src/environment/textures.js
node --check src/environment/flat-env.js
# smoke (browser has document; node uses stubs)
```

## Not in scope

- Hero building factories (guild / temple / inn) untouched  
- No reintroduction of micro grass tuft spam  
- No dark muddy palette / heavy curbs  
