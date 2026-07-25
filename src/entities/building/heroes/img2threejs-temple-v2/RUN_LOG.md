# img2threejs forge run — Temple v2

Date: 2026-07-26

Skill root: `.agents/skills/img2threejs/`

Target: `src/entities/building/heroes/img2threejs-temple-v2/`

## Reference contract

- Main three-quarter:
  `public/content/buildings/temple/ref_main.png`
- Front:
  `public/content/buildings/temple/ref_front.png`
- Right side:
  `public/content/buildings/temple/ref_side.png`
- Accepted target: a clean stylized fantasy game prop with bright hard-surface
  color blocks, clean chamfers, regular white ashlar, regular dark slate, and
  geometric stained glass.
- Explicit exclusions: no photoreal micro-noise, no projected reference
  textures, no photo facade/billboard, no Christian cross, and no structural
  roof made from two rotated box slabs.

## Forge commands

### Intake probe and reference admission

1. `python3 .agents/skills/img2threejs/forge/stage1_intake/probe_image.py public/content/buildings/temple/ref_main.png`
2. `python3 .agents/skills/img2threejs/forge/stage1_intake/probe_image.py public/content/buildings/temple/ref_front.png`
3. `python3 .agents/skills/img2threejs/forge/stage1_intake/probe_image.py public/content/buildings/temple/ref_side.png`
4. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_reference_admission.py public/content/buildings/temple/ref_main.png --viewpoint three-quarter-front --json`
5. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_reference_admission.py public/content/buildings/temple/ref_front.png --viewpoint front --against 16831521268329125595 --json`
6. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_reference_admission.py public/content/buildings/temple/ref_side.png --viewpoint side --against 16831521268329125595,16467355105867569486 --json`

All three images are 1024×1024 PNGs with
`technicalSuitability: pass`. All three references were admitted:

- main pHash: `16831521268329125595`
- front pHash: `16467355105867569486`
- side pHash: `16772464100599188427`

The side admission was checked against both prior hashes. No reference was
empty, fragmented, too small, undecodable, or rejected as a duplicate view.
Consolidated results are stored in `probe.json` and `admission.json`.

### Complex assessment and all-view detail inventory

7. `python3 .agents/skills/img2threejs/forge/stage2_spec/new_pre_spec_assessment.py "Temple v2" --image public/content/buildings/temple/ref_main.png --complexity complex --out src/entities/building/heroes/img2threejs-temple-v2/assessment.json --force`
8. `python3 .agents/skills/img2threejs/forge/stage1_intake/build_detail_inventory.py public/content/buildings/temple/ref_main.png --mode grid-3x3 --complexity complex --out-dir src/entities/building/heroes/img2threejs-temple-v2/crops-main --out src/entities/building/heroes/img2threejs-temple-v2/detail-inventory-main.json --force`
9. `python3 .agents/skills/img2threejs/forge/stage1_intake/build_detail_inventory.py public/content/buildings/temple/ref_front.png --mode grid-3x3 --complexity complex --out-dir src/entities/building/heroes/img2threejs-temple-v2/crops-front --out src/entities/building/heroes/img2threejs-temple-v2/detail-inventory-front.json --force`
10. `python3 .agents/skills/img2threejs/forge/stage1_intake/build_detail_inventory.py public/content/buildings/temple/ref_side.png --mode grid-3x3 --complexity complex --out-dir src/entities/building/heroes/img2threejs-temple-v2/crops-side --out src/entities/building/heroes/img2threejs-temple-v2/detail-inventory-side.json --force`
11. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_intake_correctness.py src/entities/building/heroes/img2threejs-temple-v2/assessment.json --json`

The generated crop stubs were inspected and filled. The three view inventories
contain 34 observations:

- main: 12
- front: 12
- side: 10

The assessment consolidates 20 identity-bearing detail systems. Every detail
maps to an authored `component.localFeatures` or
`material.localOverrides` key. Intake correctness returned `action: proceed`;
OSIM confirmation was unavailable, so the declared architectural object class
remains an exposed, falsifiable assumption rather than a claimed automated
classification.

### Deep sculpt spec and strict-quality gate

12. `python3 .agents/skills/img2threejs/forge/stage2_spec/new_sculpt_spec.py "Temple v2" --image public/content/buildings/temple/ref_main.png --assessment src/entities/building/heroes/img2threejs-temple-v2/assessment.json --out src/entities/building/heroes/img2threejs-temple-v2/object-sculpt-spec.json --force`
13. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-temple-v2/object-sculpt-spec.json --json`
14. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-temple-v2/object-sculpt-spec.json --strict-quality --json`

The authored spec contains:

- 24 named macro/meso component pivots;
- 10 explicit material layers;
- 11 deterministic repetition systems;
- 20 mapped consolidated details;
- closed-roof, attachment, socket, collider, destruction, and LOD contracts;
- object-specific critical/important review targets;
- front, side, three-quarter, and rear-three-quarter review viewpoints;
- concrete key/fill/rim, exposure, ACES tone-mapping, background, and contact
  shadow intent.

Normal and strict validation returned `ok: true`. Final strict validation
returned `PASS`. The remaining normal warning records accepted rear-view
inference and does not lower or bypass the quality contract.

### Locked build state and factory generation

15. `python3 .agents/skills/img2threejs/forge/stage3_build/orchestrate_passes.py status src/entities/building/heroes/img2threejs-temple-v2/object-sculpt-spec.json`
16. `python3 .agents/skills/img2threejs/forge/stage3_build/orchestrate_passes.py check src/entities/building/heroes/img2threejs-temple-v2/object-sculpt-spec.json --pass-id blockout`
17. `python3 .agents/skills/img2threejs/forge/stage3_build/generate_threejs_factory.py src/entities/building/heroes/img2threejs-temple-v2/object-sculpt-spec.json --out src/entities/building/heroes/img2threejs-temple-v2/createTempleModel.js --force`

The forge generated the initial factory scaffold. The scaffold was then
replaced with the authored plain-JavaScript Three.js implementation required
by the spec.

The pass orchestrator correctly remains locked at `blockout`: Tier-1 browser
render diagnostics and screenshot review evidence do not exist. No pass was
promoted and no screenshot, comparison score, Divine Eye result, or
`continue` review was fabricated.

## Implementation decisions

- The nave roof is one closed indexed gable prism with six vertices and ten
  triangles. The portico roof is a second, smaller closed indexed gable prism.
- Every undirected structural-roof edge is shared by exactly two triangles.
- Repeated slate boxes are thin shingle relief attached to the solid roof.
  They are not structural slabs.
- The raised front facade is a closed extruded pentagonal gable mass.
- The rose window uses 16 saturated radial sectors, a dark lead ring and
  spokes, a gold central disc, 16 gold rays, and a real stone torus surround.
- The lower facade emblem is a separate concentric gold sun with 16 pointed
  rays. No cross geometry is used.
- Twelve lancet assemblies are built as pointed extrusions: two front and five
  per side. Each contains a gold sun, blue/violet fields, green chevrons, a red
  lower diamond, and dark leading.
- The rear-right tower is embedded through the nave roof, then carries a
  four-face arched belfry, an eight-facet solid slate spire, eight gold ribs,
  a lower diamond lattice, cap, stem, and radial sun finial.
- Ashlar, shingles, lancets, buttresses, rose sectors, rays, columns, belfry
  openings, and spire ribs use shared or repeated procedural geometry.
- Materials are only `MeshToonMaterial` and toon-compatible
  `MeshStandardMaterial`; no texture loader, image map, plane facade, sprite,
  or photo billboard exists.
- `root.userData.sculptRuntime` exposes 24 nodes, door/finial sockets, five
  collider groups, mesh lookup, and semantic destruction groups.
- `root.userData.gen` and `root.userData.heroVersion` are both
  `img2threejs-temple-v2`.

## Wiring

`src/entities/building/heroes/temple.js` now re-exports:

- `createTempleModel`
- `createTempleModel as createTempleHero`
- `createTempleModel as default`

`src/entities/building/heroes/index.js` now preserves a factory-provided
`heroVersion` instead of overwriting Temple v2 with the legacy `solid-v3`
label.

## Verification commands and results

18. `node --check src/entities/building/heroes/img2threejs-temple-v2/createTempleModel.js`
19. `node --check src/entities/building/heroes/temple.js`
20. `node --check src/entities/building/heroes/index.js`
21. Node ESM import/factory/bounds/re-export/material/photo/manifold/runtime
    assertions.
22. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-temple-v2/object-sculpt-spec.json --strict-quality`
23. `python3 -m unittest discover -s .agents/skills/img2threejs/forge/tests -p 'test_pipeline.py'`
24. `npm run build`

Results:

- `createTempleModel()` returns a `THREE.Group`: **pass**
- public re-export identity:
  `createTempleHero === createTempleModel`: **pass**
- wired metadata:
  `gen === heroVersion === "img2threejs-temple-v2"`: **pass**
- model bounds:
  `[-7.10, ~0, -9.99]` to `[7.10, 27.55, 13.33]`: **pass**
- visible sole at y=0 within floating-point tolerance: **pass**
- runtime nodes/sockets/colliders:
  `24 / 3 / 5`: **pass**
- main structural gable manifold:
  all edge counts are exactly 2: **pass**
- portico structural gable manifold:
  all edge counts are exactly 2: **pass**
- unsupported visible materials: **0**
- photo maps/billboards/sprites: **0**
- strict-quality validation: **PASS**
- forge pipeline suite: **42 tests passed**
- Vite production build: **pass**

The production build retains the repository's existing large-chunk warning;
it does not fail.

## Visual gate status / blocker

A dedicated browser preview harness is included:

`src/entities/building/heroes/img2threejs-temple-v2/preview.html`

It supports:

- `?view=main`
- `?view=front`
- `?view=side`
- `?view=rear`

The Vite preview server started successfully. This session, however, exposed
no controllable in-app or Chrome browser backend, and the local Python
Playwright module is not installed. Therefore:

- no render screenshot was captured;
- no comparison sheet was generated;
- Tier-1/Divine-Eye diagnostics were not run;
- no visual `continue` decision was recorded.

This is the only remaining forge-loop blocker. The factory itself loads,
builds, is wired through `temple.js`, and passes deterministic syntax,
geometry, material, metadata, runtime, strict-spec, unit, and production-build
checks.
