# Img2threejs props — Batch 04 run log

> Scope: replace four remaining high-visibility craft/cargo/planting `batch_p0` placeholders with reference-driven PBR factories while preserving their production catalog keys.

## Reference intake

| Asset | Runtime type | Reference | Admission |
|---|---|---|---|
| Blacksmith anvil workstation | `anvilProp` | single-object 3D product render | pass, foreground 0.6668 |
| Magic crystal cargo crate | `crystalCrate` | single-object 3D product render | pass, foreground 0.6677 |
| Village flower planter | `planter` | single-object 3D product render | pass, foreground 0.6642 |
| Village firewood rack | `woodpile` | single-object 3D product render | pass, foreground 0.6642 |

The generated source renders are preserved as `ref_source.png`. `ref_main.png` adds only a uniform white technical border for deterministic subject isolation. Every asset has an object-specific complex assessment, an eleven-or-more-item detail inventory mapped to real component/material features, exposed intake assumptions and 3×3 evidence crops.

## Geometry and runtime smoke

| Asset | Meshes | Triangles | Bounds (m) | Sole | Materials | Semantic nodes | Sockets | Colliders |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| Anvil workstation | 75 | 7,456 | 1.69 × 1.20 × 1.04 | 0 | 17 | 4 | 3 | 3 |
| Crystal cargo crate | 178 | 13,882 | 1.18 × 1.18 × 1.04 | 0 | 28 | 5 | 4 | 3 |
| Flower planter | 406 | 50,144 | 1.42 × 1.19 × 0.87 | 0 | 27 | 5 | 2 | 3 |
| Firewood rack | 132 | 14,536 | 1.97 × 1.21 × 0.87 | 0 | 24 | 5 | 2 | 3 |

All world transforms and bounds are finite. Runtime metadata lives at `root.userData.sculptRuntime`. The catalog keys are unchanged, so existing layout placements receive the new factories without layout edits. The flower planter carries the highest density because its 36 broad leaves, layered flower corollas, pollen rings and stem leaves remain individually modeled; its two sparse production placements loaded without a runtime error.

## Browser visual acceptance

| Asset | Overall | Silhouette | Structure | Form/detail | Material | Lighting | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Anvil workstation | 0.84 | 0.88 | 0.89 | 0.83 | 0.79 | 0.82 | pass |
| Crystal cargo crate | 0.84 | 0.86 | 0.89 | 0.83 | 0.84 | 0.81 | pass |
| Flower planter | 0.83 | 0.88 | 0.87 | 0.84 | 0.76 | 0.81 | pass |
| Firewood rack | 0.86 | 0.90 | 0.91 | 0.87 | 0.81 | 0.82 | pass |

### Corrections made from direct comparison

- Anvil: the first render exposed a glossy stock cone and a barrel-like double-hoop stump. The horn was replaced twice, ending as a custom elliptical multi-ring taper; the stump now has one structural hoop, fourteen bark-relief plates, vertical splits and eight radial end-grain fissures.
- Crystal crate: the first mineral pass read as milky plastic and the solid bottle rack hid the bottle bodies. The minerals now use saturated attenuation color, controlled transmission, narrow transparent cores and independent facet glints; the rack was rebuilt from open rails.
- Flower planter: the first pass was too square and the spherical petals/flat leaves read as a toy bouquet. The box was rebuilt to the long reference proportion; the crown now uses 36 oriented serrated leaves, double-layer petal silhouettes, pollen grains, hanging lathed bells, three bloom systems and eleven trailing ivy leaves.
- Firewood rack: the first stack had visible holes and a pale smooth cover. It now contains 22 centered half-round logs in four interlocked rows, darker rolled canvas with five fold wrinkles and a clearly exposed sheathed hatchet.

## Gates

- reference technical probe and deterministic admission: pass;
- intake correctness control flow: proceed with exposed assumptions, OSIM confirmation deferred by the available pipeline;
- object-specific complex assessment and filled detail inventory: pass;
- main and independent side browser renders: pass;
- comparison-sheet visual review and visible correction loop: pass;
- finite bounds, sole, mesh/triangle counts and runtime metadata: pass;
- production scene load: pass, no new errors or texture warnings;
- production build: pass.
