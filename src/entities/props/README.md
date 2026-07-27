# Street props — batch production

Small countryside details for the Mushoku Buena/Roa slice. **Not** hero buildings.

## Rules

1. **Empty > junk** — only plant props that pass 3s identity.
2. **sole @ y=0**, facade-agnostic, cast/receive shadows.
3. **Sparse layout** — cluster near shops/plaza; never random densify.
4. Shared kit: `kit.js` palette + helpers. New props = new factory in a batch file.

## Current batch

| type | file | identity |
|------|------|----------|
| `streetLight` / `lanternPost` | models/street_lantern | forged-iron post + chain + caged amber light |
| `questBoard` | models/quest_board | tiled canopy + stone feet + curled notices + wax seals |
| `well` | models/village_well | individual stone courses + timber frame + tiled roof + windlass |
| `crateStack` | models/crate_stack | four detachable plank crates + rope handles + produce + burlap |
| `barrelCluster` | models/barrel_cluster | individual staves + riveted hoops + visible tap + timber chocks |
| `woodpile` | models/woodpile | splayed oak rack + 22 split logs + canvas roll + sheathed hatchet |
| `anvilProp` | models/anvil_workstation | custom forged horn + split stump + hanging hammer/tongs |
| `crystalCrate` | models/crystal_crate_magic | hinged iron-bound cargo crate + restrained translucent minerals + bottles |
| `handcart` | models/handcart | empty plank cargo bed + 12-spoke wheels + iron running gear |
| `hayBale` / `sackPile` | batch_p0 | street cargo |
| `bench` | models/village_bench | splayed timber frame + ten-slat back + forged scroll arms |
| `fenceSection` | models/fence_section | stone-footed oak frame + varied pickets + projected iron straps |
| `hitchingPost` | models/hitching_post | braced two-post rail + four tie rings + attached hemp coil |
| `signpost` | models/signpost | three oriented arrow boards + carved emblems + brass route medallions |
| `waystone` | models/waystone | irregular banded monolith + inset cyan travel rune + offerings |
| `planter` | models/flower_planter | reinforced long oak box + dense layered foliage + three bloom systems + trailing ivy |

## Add a scatter/supporting prop

```text
Repo: …/mushoku-tensei
Add ONE supporting prop factory to src/entities/props/batch_p0.js (or batch_p1.js).

Requirements:
- import kit from ./kit.js (P, root, box, cyl, sphere, torus, done, makeGlow)
- export function createXxx() — sole y=0, multi-part volume, name prop.xxx
- userData.gen = batch id
- Register type in catalog.js PROP_BUILDERS
- node --check; smoke mesh count ≥ 8
- Do NOT touch hero buildings or ground
```

Then add sparse rows to `src/layouts/mushoku-slice-p0.js` `places[]`.

Identity-bearing foreground props do not use this lightweight path. They require admitted reference views, an object-specific intake assessment, semantic runtime nodes/sockets, browser main + side renders, and a saved comparison sheet. Hero props additionally require a strict-quality ObjectSculptSpec.

## Wire path

`layout type` → `world.buildByType` → `createProp(type)` → plant.
