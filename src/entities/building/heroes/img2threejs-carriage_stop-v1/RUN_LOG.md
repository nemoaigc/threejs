# img2threejs forge run — Carriage Rest Stop v1

Date: 2026-07-26  
Agent: Claude Code  
Skill: img2threejs

Target: `src/entities/building/heroes/img2threejs-carriage_stop-v1/`

## References

- `public/content/buildings/carriage_stop/ref_main.png` (three-quarter)
- `public/content/buildings/carriage_stop/ref_front.png`
- `public/content/buildings/carriage_stop/ref_side.png`
- Style: clean stylized fantasy open pavilion / roadside rest stop

## Pipeline

1. Visual intake of three views (open timber pavilion, not solid house)
2. Quality bar locked to guild-v2 / temple-v2 / inn-v3 factories
3. Plain JS factory authored (no TypeScript generator stub)
4. Re-export via `src/entities/building/heroes/carriage_stop.js`

## Output

- `createCarriageStopModel.js` — ES module  
  `userData.gen = img2threejs-carriage_stop-v1`  
  `root.name = hero.carriage_stop.v1`  
  sole y=0, facade +Z, structureType=open-pavilion
- Live export: `carriage_stop.js` → v1 folder (not village_shops_v1)
- Smoke (2026-07-26):
  - `node --check` clean
  - meshCount **304**
  - minY **0** (sole)
  - openCheck: posts/tiles/trough/lantern/rail/sign/barrel/rope ✓, no wall shell
  - sockets: signSwing, signInteraction, lanternSwing, lanternLight

## Identity (must hold)

- **OPEN** structure: 4 corner posts + ring beams + diagonal braces (no wall box)
- Plank platform deck
- Terracotta tile gable roof (single closed prism + relief tiles), ridge along Z
- Chunk ridge timber ends
- Hitching rails + rope wraps mid-height
- Green water trough + floating leaves
- Barrel
- Hanging **REST STOP** sign
- Warm iron lantern on front-left

## Prohibited

- closed solid house shell
- paired rotated-box roof slabs
- photo billboard
