# img2threejs forge run — Magic Shop v1

Date: 2026-07-26  
Agent: Claude Code  
Skill: `.agents/skills/img2threejs/`

Target: `src/entities/building/heroes/img2threejs-magic_shop-v1/`

## References

- `public/content/buildings/magic_shop/ref_main.png`
- `public/content/buildings/magic_shop/ref_front.png`
- `public/content/buildings/magic_shop/ref_side.png`
- Style: clean stylized fantasy game prop (Arcane Essences shop)

## Pipeline

1. multi-view reference study (main / front / side)  
2. quality bar: guild-v2 / temple-v2 / inn-v3  
3. plain JS factory authored (no TypeScript generator stub)  
4. re-export via `src/entities/building/heroes/magic_shop.js`

## Output

- `createMagicShopModel.js` — ES module  
  - `userData.gen = img2threejs-magic_shop-v1`  
  - `root.name = hero.shop.magic.v1`  
- sole y=0, facade +Z  
- solid gable prism roof + solid pointed cone tower (no dual rotated-box slabs)

## Identity

purple roof accent · pointed tip / gold finial · crystal-ball hanging sign · glowing potion bay · purple arched door + gold filigree · plaster + timber · sage trim · side lavender planter · dormer round window
