# img2threejs forge run — Magic Shop v2

Date: 2026-07-26  
Agent: Claude Code  
Skill: img2threejs

Target: `src/entities/building/heroes/img2threejs-magic_shop-v2/`

## Why v2

v1 failed user review (**"质量太差"**): read as rounded-box template spam, weak shop
silhouette, flat facades, sparse roof tiles, and soft identity vs reference.

Quality bar for v2: **inn-v3 / guild-v2** density (panelized half-timber, tile rows,
proud timber, readable identity props).

## References

- `public/content/buildings/magic_shop/ref_main.png`
- `public/content/buildings/magic_shop/ref_front.png`
- `public/content/buildings/magic_shop/ref_side.png`
- Style: clean stylized fantasy countryside prop (Arcane Essences shop)

## Quality upgrades vs v1

| Area | v1 failure | v2 fix |
|------|------------|--------|
| Silhouette | boxy slab | solid gable prism + tall cone tower + deep bay projection |
| Facades | flat plaster slabs | panelized half-timber **every face** (posts/rails/braces/chevrons/gable truss) |
| Roof tiles | sparse 6×8 | dense 8×10 rows + 12 ridge caps + sage fascia |
| Tower | thin cone | collar drum, shade bands, neck window, gold finial stack |
| Display bay | shallow | real depth, angled returns, plank base, 5 emissive potions + sparkles |
| Sign | weak plate | iron arm + brace + chain links + rope + crystal ball emblem |
| Door | simple | deep portal, arch reveal, purple leaf, gold filigree + straps |
| Foundation | single course | multi-course ashlar all sides + corner stones + sage water-table |
| Material feel | toy-ish | warm timber/plaster/sage countryside palette |

## Contract

- `userData.gen = img2threejs-magic_shop-v2`
- `root.name = hero.shop.magic.v2`
- sole y=0, facade +Z
- solid gable prism + solid cone tower (**no** dual rotated-box roofs)
- re-export: `src/entities/building/heroes/magic_shop.js` → **v2 only**

## Output

- `createMagicShopModel.js` — plain ES JS, no TypeScript
- Live export: `src/entities/building/heroes/magic_shop.js` → **v2 only**

## Smoke (2026-07-26)

```
node --check …/createMagicShopModel.js  → OK
gen=img2threejs-magic_shop-v2
name=hero.shop.magic.v2
meshes=566  (≥400 target)
size≈6.73 × 8.11 × 6.87
minY=0  soleY=0  facade=+Z
structural closed gable prism + solid cone tower
```

## Identity checklist

- [x] purple pointed tower + gold finial  
- [x] crystal-ball hanging sign with arm/chains  
- [x] deep potion bay with emissive bottles  
- [x] purple arched door + gold filigree  
- [x] half-timber / stone courses / tile rows at inn density  
- [x] side arched window + lavender planter  
- [x] dormer round window on right roof slope  
- [x] smoke pass (syntax + gen + mesh density + sole)  
