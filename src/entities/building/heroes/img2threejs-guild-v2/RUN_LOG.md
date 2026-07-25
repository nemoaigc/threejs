# img2threejs forge run — Adventurers Guild v2

Date: 2026-07-26

Skill root: `.agents/skills/img2threejs`

Target: `src/entities/building/heroes/img2threejs-guild-v2/`

## Reference contract

- Main three-quarter: `public/content/buildings/adventurers_guild/ref_main.png`
- Front: `public/content/buildings/adventurers_guild/ref_front.png`
- Right side: `public/content/buildings/adventurers_guild/ref_side.png`
- Style: clean stylized fantasy game prop; hard-surface color blocks; clean
  chamfers and regular tile rows; no photoreal micro-noise.
- Accepted approximation: procedural stylized reconstruction, not
  manufacturing/survey geometry or photoreal inverse rendering.

## Forge commands

### Intake probe and reference admission

1. `python3 .agents/skills/img2threejs/forge/stage1_intake/probe_image.py public/content/buildings/adventurers_guild/ref_main.png`
2. `python3 .agents/skills/img2threejs/forge/stage1_intake/probe_image.py public/content/buildings/adventurers_guild/ref_front.png`
3. `python3 .agents/skills/img2threejs/forge/stage1_intake/probe_image.py public/content/buildings/adventurers_guild/ref_side.png`
4. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_reference_admission.py public/content/buildings/adventurers_guild/ref_main.png --viewpoint three-quarter-front --json`
5. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_reference_admission.py public/content/buildings/adventurers_guild/ref_front.png --viewpoint front --against 16915666623440859453 --json`
6. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_reference_admission.py public/content/buildings/adventurers_guild/ref_side.png --viewpoint side --against 16915666623440859453,18051435758406240121 --json`

All three files were 1024×1024 PNGs with `technicalSuitability: pass`.
All were admitted and the front/side pHashes were checked against prior
admissions; neither was rejected as a duplicate angle.

### Complex assessment and three-view detail inventory

7. `python3 .agents/skills/img2threejs/forge/stage2_spec/new_pre_spec_assessment.py "Adventurers Guild v2" --image public/content/buildings/adventurers_guild/ref_main.png --complexity complex --out src/entities/building/heroes/img2threejs-guild-v2/assessment.json --force`
8. `python3 .agents/skills/img2threejs/forge/stage1_intake/build_detail_inventory.py public/content/buildings/adventurers_guild/ref_main.png --mode grid-3x3 --complexity complex --out-dir src/entities/building/heroes/img2threejs-guild-v2/crops-main --out src/entities/building/heroes/img2threejs-guild-v2/detail-inventory-main.json --force`
9. `python3 .agents/skills/img2threejs/forge/stage1_intake/build_detail_inventory.py public/content/buildings/adventurers_guild/ref_front.png --mode grid-3x3 --complexity complex --out-dir src/entities/building/heroes/img2threejs-guild-v2/crops-front --out src/entities/building/heroes/img2threejs-guild-v2/detail-inventory-front.json --force`
10. `python3 .agents/skills/img2threejs/forge/stage1_intake/build_detail_inventory.py public/content/buildings/adventurers_guild/ref_side.png --mode grid-3x3 --complexity complex --out-dir src/entities/building/heroes/img2threejs-guild-v2/crops-side --out src/entities/building/heroes/img2threejs-guild-v2/detail-inventory-side.json --force`
11. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_intake_correctness.py src/entities/building/heroes/img2threejs-guild-v2/assessment.json --json`

The generated stubs were filled from all three views. The assessment
consolidates 20 identity-bearing details; each maps to a real
`component.localFeatures` or `material.localOverrides` key. The separate
inventories retain 12 main-view, 11 front-view, and 10 side-view observations.

Intake correctness returned `action: proceed`. OSIM/objectness confirmation was
not available at intake, so the declared building class remained an exposed,
falsifiable assumption rather than a claimed automated confirmation.

### Sculpt spec and strict-quality loop

12. `python3 .agents/skills/img2threejs/forge/stage2_spec/new_sculpt_spec.py "Adventurers Guild v2" --image public/content/buildings/adventurers_guild/ref_main.png --assessment src/entities/building/heroes/img2threejs-guild-v2/assessment.json --out src/entities/building/heroes/img2threejs-guild-v2/object-sculpt-spec.json --force`
13. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-guild-v2/object-sculpt-spec.json --strict-quality --json`
14. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-guild-v2/object-sculpt-spec.json`
15. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-guild-v2/object-sculpt-spec.json --strict-quality`

Strict attempt 1 correctly returned `refine-spec`: the generator starter still
had one placeholder component, generic feature targets, no repetitions,
unmapped inventory details, no local material overrides, and no concrete
lighting plan.

The authored spec then added:

- 19 named macro/meso components with topology classifications and rationale;
- 11 material layers and explicit stylized PBR limitation;
- 9 repetition systems;
- complete wall/door/sign attachment data;
- object-specific pass and feature review targets;
- three review viewpoints and concrete key/fill/rim/contact-light intent.

Normal and strict validation then returned `PASS`. Final strict validation after
all spec refinements also returned `PASS`.

### Locked build state and factory generation

16. `python3 .agents/skills/img2threejs/forge/stage3_build/orchestrate_passes.py status src/entities/building/heroes/img2threejs-guild-v2/object-sculpt-spec.json`
17. `python3 .agents/skills/img2threejs/forge/stage3_build/orchestrate_passes.py check src/entities/building/heroes/img2threejs-guild-v2/object-sculpt-spec.json --pass-id blockout`
18. `python3 .agents/skills/img2threejs/forge/stage3_build/generate_threejs_factory.py src/entities/building/heroes/img2threejs-guild-v2/object-sculpt-spec.json --out src/entities/building/heroes/img2threejs-guild-v2/createAdventurersGuildModel.js --force`

The blockout promotion check remained locked because Tier-1 render diagnostics
and screenshot evidence do not exist. That is the correct pre-render outcome,
not a forged pass. The current unlocked pass remains `blockout`.

The forge generator emitted the initial factory scaffold. It was then replaced
with the authored JavaScript implementation matching the strict spec.

## Implementation decisions

- The roof base is one closed indexed triangular prism: 6 vertices, 8
  triangles, all undirected edges shared by exactly two triangles.
- Regular instanced tile modules sit on top of that solid. They are relief, not
  structural roof slabs.
- The obsolete v1 front cross-gable was not carried forward.
- The green shield sign is perpendicular to the +Z facade, as established by
  its edge-on front reference and face-on side reference.
- Stone blocks and roof tiles use instancing; other identity geometry stays in
  named groups with clean chamfers.
- Doors expose hinge pivots; the sign exposes a swing pivot; interaction
  sockets, primitive collider metadata, and destruction groups are stored in
  `root.userData.sculptRuntime`.
- No `TextureLoader`, reference projection, image plane, sprite, or facade
  billboard is used.

## Verification commands and results

19. Node ESM import/factory/bounds/material/manifold check against
    `createAdventurersGuildModel.js` and the public re-export.
20. `npm run build`
21. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-guild-v2/object-sculpt-spec.json --strict-quality`
22. `python3 -m unittest discover -s .agents/skills/img2threejs/forge/tests -p 'test_pipeline.py'`

Results:

- factory returns `THREE.Group`: **pass**
- public `adventurers_guild.js` resolves asset id
  `img2threejs-guild-v2`: **pass**
- visible sole at y=0 within floating-point tolerance: **pass**
- facade metadata is `+Z`: **pass**
- closed-manifold solid roof: **pass**
- visible materials are `MeshStandardMaterial`/`MeshToonMaterial`: **pass**
- photo/billboard mesh scan: **pass, zero found**
- Vite production build: **pass**
- final forge strict-quality validation: **pass**
- forge pipeline unit suite: **42 tests passed**

The production build retained the repository's existing large-chunk warning;
it did not fail.

## Visual gate

A local Vite preview was started, but the session exposed no in-app or Chrome
browser backend. Therefore no render screenshot, comparison sheet, Divine Eye
score, or `continue` review was fabricated. The visual build-pass gate remains
unpromoted and is explicitly recorded as **not evaluated in this session**.
