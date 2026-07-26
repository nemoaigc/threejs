# img2threejs forge run — Carriage Rest Stop v2

Date: 2026-07-26  
Agent: Claude Code  
Skill: img2threejs

Target: `src/entities/building/heroes/img2threejs-carriage_stop-v2/`

## Why v2

v1 failed user quality: read as a closed box / fake openings rather than a
convincing **OPEN** timber pavilion. Rebuild with inn-v3 roof tile density +
guild-v2 curved timber knees, no wall shell, no gable infill.

## References

- `public/content/buildings/carriage_stop/ref_main.png` (three-quarter)
- `public/content/buildings/carriage_stop/ref_front.png`
- `public/content/buildings/carriage_stop/ref_side.png`
- Style: clean stylized fantasy open rest-stop pavilion

## Craft bar

- **Roof tiles**: inn-v3 density (9×12 slope rows + ridge caps + eave scallops + rake edge tiles)
- **Timber**: guild-style multi-part posts (foot / shaft / collar / capital), curved tube knee braces, open purlins under roof
- **Open silhouette**: posts + dual hitching rails only — see-through from all angles

## Output

- `createCarriageStopModel.js` — ES module  
  `userData.gen = img2threejs-carriage_stop-v2`  
  `root.name = hero.carriage_stop.v2`  
  sole y=0, facade +Z, structureType=open-pavilion
- Live export: `carriage_stop.js` → **v2** folder (not v1)
- Smoke (2026-07-26):
  - `node --check` clean
  - meshCount **481** (≥350)
  - minY **≥ 0** (sole)
  - openCheck: posts/tiles/trough/lantern/rail/sign/barrel/rope/knee ✓
  - wallShell: **none**
  - sockets: signSwing, signInteraction, lanternSwing, lanternLight

## Identity (must hold)

- **OPEN** structure: 4 corner posts + ring beams + curved knee braces (no wall box, no gable panel)
- Plank platform deck + edge boards
- Terracotta tile gable roof (single closed prism + dense relief tiles), ridge along Z
- Chunky ridge timber ends
- Dual hitching rails + rope wraps mid-height
- Outer freestanding hitch post with rope
- Green water trough + floating leaves
- Barrel
- Hanging **REST STOP** sign
- Warm iron lantern on front-left

## Prohibited

- closed solid house shell
- fake openings on a wall mass
- gable infill panel
- paired rotated-box roof slabs
- photo billboard
