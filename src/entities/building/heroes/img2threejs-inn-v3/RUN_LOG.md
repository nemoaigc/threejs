# img2threejs forge run — Inn v3 (Claude)

Date: 2026-07-26  
Agent: **Claude Code** (not Codex)  
Skill: `.agents/skills/img2threejs/`

Target: `src/entities/building/heroes/img2threejs-inn-v3/`

## Why v3

Inn v2 (Codex) lagged guild/temple visually: blank gable walls, weaker identity.
User requested Claude + img2threejs rebuild.

## References

- `public/content/buildings/inn/ref_main.png`
- `public/content/buildings/inn/ref_front.png`
- `public/content/buildings/inn/ref_side.png`
- Style: clean stylized fantasy game prop

## Pipeline

1. probe + multi-view admission  
2. complex pre-spec assessment  
3. three-view detail inventories  
4. deep sculpt-spec → **strict-quality PASS** (25 components, 13 materials)  
5. plain JS factory authored to guild/temple bar (no TypeScript generator stub)  
6. re-export via `src/entities/building/heroes/inn.js`

## Output

- `createInnModel.js` — ES module, `userData.gen = img2threejs-inn-v3`  
- Smoke: ~879 meshes, sole y≈0, no dual rotated-box roofs  
- Live export: `createInnHero` → v3

## Identity

panelized half-timber every face · solid gable prism · red tiles · mug sign · bay glow · door · barrel · planter · chimney
