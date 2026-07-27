# Img2threejs props — Batch 06 run log

> Scope: four new reference-driven village systems with a stricter “actual 3D pixels first” review: covered trade wagon, orchard cider press, apothecary herb rack and beehive skep cluster.

## Reference intake

| Asset | Runtime type | Reference | Admission |
|---|---|---|---|
| Covered trade wagon | `coveredWagon` | isolated single-object 3D product render | pass, foreground 0.7402 |
| Orchard cider press | `ciderPress` | isolated single-object 3D product render | pass, foreground 0.7428 |
| Apothecary herb rack | `herbRack` | isolated single-object 3D product render | pass, foreground 0.7427 |
| Beehive skep cluster | `beehiveCluster` | isolated single-object 3D product render | pass, foreground 0.7402 |

`ref_source.png` preserves the image-generation result. `ref_main.png` adds a uniform technical border only. Each asset has a filled complex object assessment, at least fifteen observed details mapped to implementation features, explicit character-anatomy opt-out and a retained 3×3 evidence crop set.

## Geometry and runtime smoke

| Asset | Meshes | Triangles | Bounds (m) | Sole | Materials | Semantic nodes | Sockets | Colliders |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| Covered trade wagon | 277 | 36,220 | 5.39 × 2.66 × 2.34 | 0 | 30 | 6 | 4 | 4 |
| Orchard cider press | 217 | 31,232 | 2.93 × 2.88 × 2.79 | 0 | 41 | 7 | 4 | 5 |
| Apothecary herb rack | 1,119 | 109,004 | 3.03 × 2.83 × 1.41 | 0 | 53 | 5 | 4 | 3 |
| Beehive skep cluster | 311 | 64,708 | 3.17 × 1.92 × 1.62 | 0 | 41 | 5 | 4 | 3 |

All vertex positions and production transforms are finite. The catalog and layout resolve all four new keys once each. Hero-level detail density is intentionally concentrated in one sparse instance per asset; there is no random scatter multiplication.

## Browser visual acceptance

| Asset | Overall | Silhouette | Structure | Form/detail | Material | Lighting | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Covered trade wagon | 0.87 | 0.90 | 0.92 | 0.86 | 0.84 | 0.83 | pass after structural reversal and reframing |
| Orchard cider press | 0.88 | 0.90 | 0.93 | 0.88 | 0.85 | 0.84 | pass |
| Apothecary herb rack | 0.88 | 0.91 | 0.90 | 0.90 | 0.85 | 0.84 | pass |
| Beehive skep cluster | 0.87 | 0.90 | 0.89 | 0.87 | 0.84 | 0.84 | pass after tool-layer correction |

Each `compare/` directory contains the admitted reference, independent main/side browser renders and a three-panel contact sheet.

### Corrections made from direct comparison

- Covered wagon: the first technically complete pass placed the cargo opening and rolled flap opposite the paired horse shafts. Direct reference comparison rejected that structural error. The opening, flap, cargo, rope and lantern were moved to the hitch end; the preview was reframed and the independent side view changed to the true long side.
- Beehive cluster: the water dish, smoker, honeycomb frame and crock existed in geometry but were hidden behind the bench runner. The whole working layer was moved forward until every tool read in the main render. Hidden geometry was not counted as visual fidelity.
- Cider press: the final view preserves the full compression load path, projected screw thread, twenty-two stave basket, wet spout, juice bucket and side ratchet without merging them into a barrel-like block.
- Herb rack: the final view keeps rods, braces and shelf depth visible through sixteen individual herb/garlic bundles; 99 curved terracotta roof pieces and dimensional tools prevent flat-card reads.

## Sparse production placement

| Runtime type | Position | Zone intent |
|---|---|---|
| `coveredWagon` | `(25.8, 4.2)` | east carriage/trade edge |
| `ciderPress` | `(29.2, -13.4)` | inn orchard edge |
| `herbRack` | `(23.3, 14.2)` | magic-shop apothecary side |
| `beehiveCluster` | `(30.6, -2.1)` | sparse east meadow |

## Gates

- reference technical probe and deterministic admission: pass;
- filled complex assessments and detail inventories: pass;
- finite geometry, sole, independent PBR material families and semantic runtime metadata: pass;
- main and independent side browser renders: pass;
- visible comparison/correction loop: pass;
- catalog/layout instantiation: pass;
- production scene load: pass, browser error count 0;
- production build: pass.
