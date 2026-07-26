# img2threejs forge run — Smithy v2

Date: 2026-07-26  
Agent: Claude Code  
Skill: `.agents/skills/img2threejs/` / `img2threejs`

Target: `src/entities/building/heroes/img2threejs-smithy-v2/`

## Why v2

Smithy v1 failed user quality review:

- not enough forge identity (open forge glow, chimney, anvil, hammer sign)
- rounded-box spam without silhouette punch
- weak volumetric facade / roof tiles

Rebuild to inn-v3 / guild-v2 quality bar.

## References

- `public/content/buildings/smithy/ref_main.png`
- `public/content/buildings/smithy/ref_front.png`
- `public/content/buildings/smithy/ref_side.png`
- Style: clean stylized fantasy game prop

## Pipeline

1. multi-view visual intake (main / front / side)
2. study inn-v3 `createInnModel.js` + guild-v2 `createAdventurersGuildModel.js`
3. identity lock: dark timber · deep emissive forge cavity · tall brick chimney · FORGE horseshoe/hammer sign · solid prism red clay roof · anvil
4. plain JS factory authored to inn-v3 / guild-v2 bar (no TS stub)
5. re-export via `src/entities/building/heroes/smithy.js` → v2

## v2 deltas vs v1

| Area | Change |
|------|--------|
| Forge | volumetric firebrick cavity + side returns, layered coal bed, dual point lights, more sparks |
| Frame | multi-part posts (foot/grain/bands/capital), tube knee braces, bay divider, deep lintel stack |
| Roof | denser 9×11 tile relief, 7-seg curved ridge beam, king-post gable, more moss |
| Chimney | taller stack (10 courses), flashing, pot + 7 smoke spheres |
| Props | horned multi-part anvil, quench barrel, scrap pile, bench tools |
| Sign | bolder horseshoe + hammer, studs, double hang rings |

## Output

- `createSmithyModel.js` — ES module
- `userData.gen = img2threejs-smithy-v2`
- `name = hero.shop.smithy.v2`
- solid single-prism roof (ridge along Z), sole y=0
- Live export: `createSmithyHero` → v2 folder

## Identity

dark charcoal timber frame · open two-bay forge mouth · warm emissive hearth volume · tall brick chimney + pot + smoke · red clay tiles + moss · hanging horseshoe/hammer FORGE sign · anvil · workbench · quench barrel

## Verification

```
node --check src/entities/building/heroes/img2threejs-smithy-v2/createSmithyModel.js  → OK
node smoke (import factory + re-export + HERO_BUILDERS.shopSmithy)
```

Results:

| Check | Result |
|-------|--------|
| `THREE.Group` | pass |
| `name = hero.shop.smithy.v2` | pass |
| `userData.gen = img2threejs-smithy-v2` | pass |
| sole y≈0 (`minY` ~ 0) | pass |
| mesh count **736** (≥450) | pass |
| solid closed gable prism roof | pass |
| no photo billboard / map textures | pass |
| `smithy.js` re-export → v2 | pass |
| `createHeroBuilding('shopSmithy')` → v2 | pass |
| anvil / forge glow / chimney / sign present | pass |

Visual Divine Eye gate not run in this session (no browser capture). Structural + identity contract satisfied in code.
