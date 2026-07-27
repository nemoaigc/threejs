# Img2threejs props — Batch 02 run log

> Scope: replace four frequently visible `batch_p0` placeholders with reference-driven, independently reviewable PBR factories while preserving their catalog type keys.

## Reference intake

| Asset | Runtime type | Reference | Admission |
|---|---|---|---|
| Village quest board | `questBoard` | single-object 3D product render | pass, foreground 0.6670 |
| Tavern barrel cluster | `barrelCluster` | single-object 3D product render | pass, foreground 0.6403 |
| Market crate stack | `crateStack` | single-object 3D product render | pass, foreground 0.6404 |
| Forged-oak village bench | `bench` | single-object 3D product render | pass, foreground 0.6404 |

The generated source renders are preserved as `ref_source.png`. `ref_main.png` adds a uniform white technical border so the deterministic foreground mask can isolate the subject. All four assets carry an object-specific pre-spec assessment, grid detail inventory and admitted source evidence.

## Geometry and runtime smoke

| Asset | Meshes | Triangles | Bounds (m) | Sole | Semantic nodes | Sockets | Colliders |
|---|---:|---:|---|---:|---:|---:|---:|
| Quest board | 172 | 11,368 | 2.76 × 3.26 × 1.60 | 0 | 6 | 6 | 3 |
| Barrel cluster | 216 | 22,828 | 2.58 × 1.45 × 1.85 | 0 | 3 | 3 | 3 |
| Crate stack | 173 | 12,348 | 2.49 × 2.48 × 1.02 | 0 | 4 | 2 | 4 |
| Village bench | 75 | 5,896 | 3.08 × 2.35 × 0.94 | 0 | 4 | 2 | 3 |

Runtime metadata lives at `root.userData.sculptRuntime`. Catalog keys are unchanged, so the existing layout automatically receives the upgraded factories.

## Browser visual acceptance

| Asset | Overall | Silhouette | Structure | Form/detail | Material | Lighting | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Quest board | 0.82 | 0.87 | 0.84 | 0.80 | 0.76 | 0.80 | pass |
| Barrel cluster | 0.80 | 0.86 | 0.85 | 0.79 | 0.72 | 0.78 | pass |
| Crate stack | 0.78 | 0.82 | 0.84 | 0.77 | 0.71 | 0.77 | pass |
| Village bench | 0.80 | 0.85 | 0.84 | 0.77 | 0.73 | 0.79 | pass |

### Corrections made from direct comparison

- Quest board: kept the deep gabled side profile and replaced the old flat header with a crest, projected iron brackets, curled notice geometry, pins, wax seals and individual stone foot blocks.
- Barrel cluster: the first render hid the tap behind the horizontal barrel; it was moved to the visible head, the action socket followed it, and the oak value was darkened.
- Crate stack: every container became a detachable plank-and-cleat assembly; the open crown adds modeled fruit, stems, rope handles and a woven curved burlap carrier.
- Village bench: the box seat/back was replaced by a load-bearing splayed frame with slat negative spaces, stretcher, braces, scroll arms, post straps, rivets and ground-contact moss.
- Shared wood materials now vary map offset and scale between palette members, reducing repeated texture alignment while preserving independent albedo, roughness, normal and AO channels.

## Gates

- reference technical probe and deterministic admission: pass;
- object-specific assessment and filled detail inventory: pass;
- main and independent side browser renders: pass;
- comparison-sheet visual review: pass;
- finite bounds, sole, mesh/triangle counts and runtime metadata: pass;
- production scene load: pass, no new runtime errors or texture warnings;
- production build: pass.
