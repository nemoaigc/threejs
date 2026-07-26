# img2threejs forge run — General Shop v2

Date: 2026-07-26  
Agent: Claude Code  
Skill: img2threejs (`.agents/skills/img2threejs/` + project skill)

Target: `src/entities/building/heroes/img2threejs-general_shop-v2/`

## Why v2

General Shop v1 failed user quality: blank-looking walls, weak porch/awning,
weak yellow sign, missing crate/barrel presence, flat door/window frames.
Rebuild to **inn-v3 / guild-v2 density**.

## References

- `public/content/buildings/general_shop/ref_main.png`
- `public/content/buildings/general_shop/ref_front.png`
- `public/content/buildings/general_shop/ref_side.png` (dup of main; front orthographic)
- Style: clean stylized fantasy cream-plaster cottage + porch

## Pipeline

1. Multi-view visual intake (cream plaster, red clay gable, striped awning porch)
2. Quality bar locked to inn-v3 half-timber panelization + guild-v2 roof/sign density
3. Plain ES module factory (no TypeScript generator stub)
4. Re-export via `src/entities/building/heroes/general_shop.js` → **v2**
5. `node --check` + smoke mesh count

## Output

- `createGeneralShopModel.js` — ES module  
  - `userData.gen = img2threejs-general_shop-v2`  
  - `root.name = hero.shop.general.v2`  
  - sole `y=0`, facade `+Z`, solid closed gable prism (ridge along Z)
- Live export: `createGeneralShopHero` → v2 folder

## v1 → v2 fixes

| Failure | v2 fix |
|---|---|
| Blank-looking walls | Full half-timber posts/rails + panelized plaster bays on front/rear/sides + gable truss |
| Weak porch/awning | Thick deck boards, multi posts, 10-stripe awning + green edge binding + rafters |
| Weak yellow sign | Multi-plank yellow board, dark border, ink glyph mass, crate+sack icons, iron arm |
| Missing crates/barrel | 2 barrels, 7 crates, 3 sacks, loose produce pile |
| Flat door/window frames | Proud multi-piece casings, sill/lintel, door knob plate, shop 3×3 mullions |

## Identity

panelized half-timber every face · cream plaster bays · solid gable prism · dense red tile rows · yellow multi-plank GENERAL STORE sign · thick red/yellow striped awning · teal door with round cross · shop bay + curtains · flour barrels · crate stacks · flower boxes · brick chimney

## Smoke (2026-07-26)

- `node --check` clean on:
  - `img2threejs-general_shop-v2/createGeneralShopModel.js`
  - `general_shop.js`
  - `heroes/index.js`
- meshCount **821** (≥ 400 target)
- `root.name = hero.shop.general.v2`
- `userData.gen = img2threejs-general_shop-v2`
- soleY **0**, facadeNormal **+Z**
- solid gable prism present; half-timber front/rear/sides present
- identity props: sign board, awning stripes, crates, barrels ✓
- sockets: `doorHinge`, `signSwing`
