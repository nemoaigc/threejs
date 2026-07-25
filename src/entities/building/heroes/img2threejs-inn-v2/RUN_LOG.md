# img2threejs forge run — Inn v2

Date: 2026-07-26

Skill root: `.agents/skills/img2threejs`

Target: `src/entities/building/heroes/img2threejs-inn-v2/`

## Reference contract

- Main: `public/content/buildings/inn/ref_main.png` (three-quarter)
- Front: `public/content/buildings/inn/ref_front.png`
- Side: `public/content/buildings/inn/ref_side.png`
- Style: clean stylized fantasy game prop

## Pipeline

1. Codex full forge: probe/admission → complex assessment → three-view detail inventories → deep sculpt-spec
2. `validate_sculpt_spec --strict-quality` → **PASS** (25 components, 13 materials)
3. Initial `generate_threejs_factory` emitted TypeScript stub (invalid for Vite/JS)
4. Finish Codex pass rewrote `createInnModel.js` as plain ES module JS (guild/temple style) and re-exported via `inn.js`

## Output

- `createInnModel.js` — ES module factory, `userData.gen = img2threejs-inn-v2`
- Wired as `createInnHero`
- Smoke: ~694 meshes, sole y≈0, no dual rotated-box roofs, sculptRuntime present

## Identity preserved

half-timber · red solid prism gable · mug sign · glowing bay · barrel · flower box · chimney · timber door
