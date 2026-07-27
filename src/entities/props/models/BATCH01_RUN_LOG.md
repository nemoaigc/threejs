# Img2threejs props — Batch 01 run log

> v2 material reset: the initial solid-toon lookdev was rejected after direct reference/render comparison. Current assets use reference-driven albedo plus independent procedural roughness, normal and AO channels, an environment-lit preview, soft shadows and contact grounding.

## Scope

| Asset | Runtime type | Tier | Reference evidence |
|---|---|---|---|
| Village well | `well` | Hero prop | main / front / side |
| Forged street lantern | `streetLight`, `lanternPost` | Supporting prop | main / front / side |
| Two-wheel handcart | `handcart` | Supporting prop | main / front / side |

All three references passed the technical image-admission probes. The village well also carries a strict-quality ObjectSculptSpec; the two supporting props carry object-specific intake assessments and inherit the same approved runtime/material contracts.

## Geometry and runtime smoke

| Asset | Meshes | Triangles | Bounds (m) | Sole | Semantic nodes | Sockets | Colliders |
|---|---:|---:|---|---:|---:|---:|---:|
| Village well | 218 | 14,688 | 2.99 × 3.88 × 2.47 | 0 | 6 | 4 | 5 |
| Street lantern | 66 | 3,348 | 1.72 × 3.50 × 0.92 | 0 | 3 | 3 | 2 |
| Handcart | 145 | 10,468 | 2.08 × 1.74 × 3.51 | 0 | 5 | 4 | 4 |

Runtime metadata lives at `root.userData.sculptRuntime`. Repeated systems use shared deterministic geometry recipes; no projected reference texture or billboard geometry is used.

## Browser visual acceptance

Review uses the same full reference/render pair for each asset. Main comparison sheets and independent side renders are stored beside the source references.

| Asset | Overall | Silhouette | Structure | Form/detail | Material | Lighting | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Village well v2 | 0.84 | 0.87 | 0.84 | 0.82 | 0.82 | 0.82 | pass |
| Street lantern v2 | 0.85 | 0.88 | 0.86 | 0.83 | 0.84 | 0.84 | pass |
| Handcart v2 | 0.83 | 0.86 | 0.84 | 0.81 | 0.82 | 0.82 | pass |

### Review notes

- Well: the stone opening, gantry, windlass, crank, rope and bucket read correctly. The first roof pass read as a sparse grid, so its cylinder lattice was replaced with 80 closed crowned tiles. Warm limestone, aged oak and terracotta now use reference-derived albedo evidence.
- Lantern: hook, hanging chain, hex cage, amber core and tapered post preserve the reference identity. The straight side view intentionally collapses the hook depth, while the main view confirms the full silhouette.
- Handcart: open plank bed, large wheels, twelve spokes per wheel, worn iron tires, expanded front straps/rivets, long pull handles and parking leg are all present. Front/end plank maps are rotated independently so grain follows the member axis.

## Gates

- reference admission: pass;
- well intake and strict spec validation: pass;
- browser main + side render: pass;
- comparison-sheet visual review: pass;
- model smoke (finite bounds, sole, mesh/triangle counts, runtime metadata): pass;
- production scene regression: pass;
- production build: recorded after final build in the batch commit.
