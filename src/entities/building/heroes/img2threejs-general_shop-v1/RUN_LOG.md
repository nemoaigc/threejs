# img2threejs forge run — General Shop v1

Date: 2026-07-26  
Agent: Claude Code  
Skill: img2threejs (`.agents/skills/img2threejs/`)

Target: `src/entities/building/heroes/img2threejs-general_shop-v1/`

## References

- `public/content/buildings/general_shop/ref_main.png`
- `public/content/buildings/general_shop/ref_front.png`
- `public/content/buildings/general_shop/ref_side.png` (dup of main; front is orthographic)

## Pipeline

1. Visual intake of multi-view refs (cream plaster cottage + porch)
2. Quality bar locked to guild-v2 / temple-v2 / inn-v3 patterns
3. Plain ES module factory (no TypeScript generator stub)
4. Re-export via `src/entities/building/heroes/general_shop.js`
5. `node --check` + smoke mesh count

## Output

- `createGeneralShopModel.js` — ES module  
  - `userData.gen = img2threejs-general_shop-v1`  
  - `root.name = hero.shop.general.v1`  
  - sole `y=0`, facade `+Z`, solid closed gable prism (ridge along Z)
- Live export: `createGeneralShopHero` → v1 folder

## Identity

cream plaster · yellow-wood hanging GENERAL STORE sign · red clay gable tiles · striped red/yellow awning · teal door with round cross window · porch crates + flour barrel · flower box · brick chimney
