# Img2threejs props — Batch 05 run log

> Scope: replace the final two `batch_p0` cargo placeholders and add two reference-driven village utility props. The first visible grain-sack pass was rejected and rebuilt rather than accepted as a technical success.

## Reference intake

| Asset | Runtime type | Reference | Admission |
|---|---|---|---|
| Bound hay bale stack | `hayBale` | single-object 3D product render | pass, foreground 0.6642 |
| Merchant grain sack pile | `sackPile` | single-object 3D product render | pass, foreground 0.6642 |
| Produce market stall | `marketStall` | single-object 3D product render | pass, foreground 0.6671 |
| Horse water trough | `horseTrough` | single-object 3D product render | pass, foreground 0.6642 |

`ref_source.png` preserves each generated source. `ref_main.png` adds only a uniform white technical border for deterministic isolation. Each object has a filled complex assessment, an eleven-or-more-item detail inventory mapped to implemented features, explicit object-domain anatomy opt-out and a 3×3 evidence crop set.

## Geometry and runtime smoke

| Asset | Meshes | Triangles | Bounds (m) | Sole | Materials | Semantic nodes | Sockets | Colliders |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| Hay bale stack | 356 | 25,664 | 2.53 × 1.83 × 1.09 | 0 | 16 | 4 | 2 | 2 |
| Grain sack pile | 223 | 20,580 | 1.88 × 1.54 × 1.42 | 0 | 23 | 4 | 2 | 3 |
| Produce market stall | 226 | 17,028 | 2.94 × 2.56 × 1.46 | 0 | 33 | 6 | 2 | 3 |
| Horse water trough | 91 | 9,196 | 4.39 × 2.03 × 1.22 | 0 | 23 | 5 | 3 | 4 |

All object positions, bounds and production placements are finite. The catalog exposes 20 types and all 28 prop placements instantiate; the four Batch 05 rows resolve to their intended factories. Existing `hayBale` and `sackPile` layout keys were preserved, while `marketStall` and `horseTrough` were planted once each in the general-shop and carriage-stop zones.

## Browser visual acceptance

| Asset | Overall | Silhouette | Structure | Form/detail | Material | Lighting | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Hay bale stack | 0.82 | 0.87 | 0.89 | 0.83 | 0.76 | 0.82 | pass after fiber pass |
| Grain sack pile | 0.82 | 0.85 | 0.84 | 0.82 | 0.80 | 0.81 | pass after body rebuild |
| Produce market stall | 0.87 | 0.89 | 0.91 | 0.88 | 0.84 | 0.84 | pass |
| Horse water trough | 0.86 | 0.90 | 0.91 | 0.86 | 0.83 | 0.83 | pass |

### Corrections made from direct comparison

- Hay stack: the initial compressed surfaces read as pale woven boxes and the fork head was undersized. The accepted pass uses darker dry-gold albedo, non-periodic multi-scale fiber signals, 276 modeled bale-surface strands and tufts, thinner lighter twine, four longer tines and a visible iron ferrule.
- Grain sacks: the initial lathed bodies read as upright pottery, the gathered mouths looked like rigid teeth, the open sack resembled a bowl and the scoop showed as a black oval. The accepted rebuild uses asymmetric ring meshes with offset centerlines and collapsed shoulders, a sideways top load, lobed cloth necks, lighter fold creases, a truly open folded rim with a capped base and an upward-facing double-sided scoop.
- Market stall: the accepted pass preserves open side depth while adding curved alternating canvas strips, eleven scallops, grommets, stone-isolated iron-shod posts, seven counter planks, lower shelving, three slatted produce crates, layered produce and a four-chain brass balance.
- Water trough: the basin is built from separate bottom, side courses, flared end panels and rim caps. A recessed physical water surface, closed wrap bands, wet staining, flange-built pump, twelve-stave bucket and limestone supports keep the object from reading as a solid block.

## Gates

- reference technical probe and deterministic admission: pass;
- complex object assessment and filled detail inventory: pass;
- main and independent side browser renders: pass;
- comparison-sheet review with visible correction loop: pass;
- finite bounds, sole, material separation and runtime metadata: pass;
- catalog/layout instantiation smoke: pass, no missing factories;
- production scene load: pass, no new runtime errors or texture warnings;
- production build: pass.
