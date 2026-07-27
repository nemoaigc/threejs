# Img2threejs props — Batch 03 run log

> Scope: replace the four remaining high-frequency path/street `batch_p0` placeholders with reference-driven PBR factories while preserving their catalog type keys.

## Reference intake

| Asset | Runtime type | Reference | Admission |
|---|---|---|---|
| Village fence section | `fenceSection` | single-object 3D product render | pass, foreground 0.6642 |
| Village hitching rail | `hitchingPost` | single-object 3D product render | pass, foreground 0.6642 |
| Direction signpost | `signpost` | single-object 3D product render | pass, foreground 0.6642 |
| Magic waystone | `waystone` | single-object 3D product render | pass, foreground 0.6642 |

The generated source renders are preserved as `ref_source.png`. `ref_main.png` adds a uniform white technical border so the deterministic foreground mask can isolate the subject. All four assets carry an object-specific complex assessment, filled ten-or-more-item grid detail inventory and admitted source evidence.

## Geometry and runtime smoke

| Asset | Meshes | Triangles | Bounds (m) | Sole | Semantic nodes | Sockets | Colliders |
|---|---:|---:|---|---:|---:|---:|---:|
| Fence section | 46 | 2,288 | 2.66 × 1.97 × 0.52 | 0 | 4 | 3 | 2 |
| Hitching rail | 31 | 4,452 | 2.12 × 1.62 × 0.53 | 0 | 4 | 5 | 2 |
| Direction signpost | 47 | 4,824 | 1.95 × 2.88 × 1.58 | 0 | 4 | 4 | 3 |
| Magic waystone | 38 | 6,284 | 0.99 × 1.87 × 0.91 | 0 | 5 | 2 | 2 |

Runtime metadata lives at `root.userData.sculptRuntime`. Catalog keys are unchanged, so the existing layout automatically receives the upgraded factories.

## Browser visual acceptance

| Asset | Overall | Silhouette | Structure | Form/detail | Material | Lighting | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Fence section | 0.80 | 0.84 | 0.86 | 0.75 | 0.72 | 0.79 | pass |
| Hitching rail | 0.82 | 0.88 | 0.88 | 0.78 | 0.74 | 0.79 | pass |
| Direction signpost | 0.79 | 0.85 | 0.83 | 0.73 | 0.72 | 0.78 | pass |
| Magic waystone | 0.80 | 0.85 | 0.83 | 0.77 | 0.72 | 0.79 | pass |

### Corrections made from direct comparison

- Fence: replaced the old three-post boxes with a repeatable two-foundation timber module, seven varied pickets, real negative spaces, diagonal rectangular brace and projected iron straps/rivets. Direct browser review caught a missing material argument that had produced white, misplaced default meshes; the call sites and screenshots were corrected.
- Hitching rail: replaced the single central post with a load-bearing two-post frame, stepped caps, braces, lower stretcher, four independent ring mounts, action sockets and an attached three-loop rope coil.
- Signpost: replaced the flat boards with thick arrow silhouettes at distinct world rotations, carved route emblems, L-brackets, brass medallions, cloth charm and stepped masonry. The first camera/read placed two boards nearly edge-on; rotations and mast UV-bearing geometry were corrected before acceptance.
- Waystone: replaced three stacked boxes with an irregular thick monolith, two block courses, face cracks, wraparound iron band, offering coins and a dark carved groove surrounding the cyan rune mineral. Emission and coin orientation were corrected from direct render review.

## Gates

- reference technical probe and deterministic admission: pass;
- object-specific complex assessment and filled detail inventory: pass;
- normal ObjectSculptSpec validation: pass (supporting-prop tier);
- main and independent side browser renders: pass;
- comparison-sheet visual review: pass;
- finite bounds, sole, mesh/triangle counts and runtime metadata: pass;
- production scene load: pass, no new runtime errors or texture warnings;
- production build: pass.
