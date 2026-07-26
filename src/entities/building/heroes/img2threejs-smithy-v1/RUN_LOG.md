# img2threejs forge run — Smithy v1

Date: 2026-07-26  
Agent: Claude Code  
Skill: `.agents/skills/img2threejs/`

Target: `src/entities/building/heroes/img2threejs-smithy-v1/`

## References

- `public/content/buildings/smithy/ref_main.png`
- `public/content/buildings/smithy/ref_front.png`
- `public/content/buildings/smithy/ref_side.png`
- Style: clean stylized fantasy game prop

## Pipeline

1. multi-view visual intake (main / front / side)
2. identity lock: dark timber · open forge glow · brick chimney · FORGE sign · red clay roof
3. plain JS factory authored to guild-v2 / inn-v3 / temple-v2 bar (no TS stub)
4. re-export via `src/entities/building/heroes/smithy.js`

## Output

- `createSmithyModel.js` — ES module, `userData.gen = img2threejs-smithy-v1`
- `name = hero.shop.smithy.v1`
- solid single-prism roof (ridge along Z), sole y=0
- Live export: `createSmithyHero` → v1 folder

## Identity

dark charcoal timber frame · open two-bay forge mouth · warm emissive hearth · brick chimney + pot + smoke · red clay tiles + moss · hanging horseshoe/hammer FORGE sign · anvil · workbench
