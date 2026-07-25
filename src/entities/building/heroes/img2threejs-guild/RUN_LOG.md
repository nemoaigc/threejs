# img2threejs run log — Adventurers Guild

Reference: `public/content/buildings/adventurers_guild/ref_main.png`

Skill root: `.agents/skills/img2threejs`

Date: 2026-07-25

## Forge commands run

The first three calls were CLI discovery, as required before using unfamiliar
forge entry points:

1. `python3 .agents/skills/img2threejs/forge/stage2_spec/new_pre_spec_assessment.py --help`
2. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_reference_admission.py --help`
3. `python3 .agents/skills/img2threejs/forge/stage1_intake/build_detail_inventory.py --help`
4. `python3 .agents/skills/img2threejs/forge/stage1_intake/probe_image.py public/content/buildings/adventurers_guild/ref_main.png`
5. `python3 .agents/skills/img2threejs/forge/stage1_intake/check_reference_admission.py public/content/buildings/adventurers_guild/ref_main.png --viewpoint reference-three-quarter-front --json`
6. `python3 .agents/skills/img2threejs/forge/stage2_spec/new_pre_spec_assessment.py "Adventurers Guild" --image public/content/buildings/adventurers_guild/ref_main.png --complexity complex --out src/entities/building/heroes/img2threejs-guild/assessment.json --force`
7. `python3 .agents/skills/img2threejs/forge/stage1_intake/build_detail_inventory.py public/content/buildings/adventurers_guild/ref_main.png --mode grid-3x3 --complexity complex --out-dir src/entities/building/heroes/img2threejs-guild/crops --out src/entities/building/heroes/img2threejs-guild/di.json --force`
8. `python3 .agents/skills/img2threejs/forge/stage2_spec/new_sculpt_spec.py "Adventurers Guild" --image public/content/buildings/adventurers_guild/ref_main.png --assessment src/entities/building/heroes/img2threejs-guild/assessment.json --out src/entities/building/heroes/img2threejs-guild/object-sculpt-spec.json --force`
9. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-guild/object-sculpt-spec.json`
10. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-guild/object-sculpt-spec.json --strict-quality`
11. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-guild/object-sculpt-spec.json --strict-quality`
12. `python3 .agents/skills/img2threejs/forge/stage3_build/orchestrate_passes.py status src/entities/building/heroes/img2threejs-guild/object-sculpt-spec.json`
13. `python3 .agents/skills/img2threejs/forge/stage3_build/orchestrate_passes.py check src/entities/building/heroes/img2threejs-guild/object-sculpt-spec.json --pass-id blockout`
14. `python3 .agents/skills/img2threejs/forge/stage3_build/generate_threejs_factory.py src/entities/building/heroes/img2threejs-guild/object-sculpt-spec.json --out src/entities/building/heroes/img2threejs-guild/createAdventurersGuildModel.js`
15. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-guild/object-sculpt-spec.json --strict-quality`
16. `python3 .agents/skills/img2threejs/forge/stage2_spec/validate_sculpt_spec.py src/entities/building/heroes/img2threejs-guild/object-sculpt-spec.json --strict-quality`
17. `python3 -m unittest discover -s .agents/skills/img2threejs/forge/tests -p 'test_pipeline.py'`

## Gate and pass decisions

- Reference probe: **continue** — 1024×1024 PNG, technical suitability pass.
- Reference admission: **continue** — admitted as a coherent three-quarter-front
  ground-truth view; foreground coverage `0.5206`.
- Visual assessment: **continue** — classified as a complex architectural
  object. Fourteen observed detail systems were filled into both
  `assessment.json` and `di.json`.
- Strict-quality attempt 1: **refine-spec** — the sign rig lacked a complete
  wall attachment contract.
- Strict-quality attempt 2 and final reruns: **continue** — strict validation
  passed after adding parent socket, local endpoints, rigid contact,
  embed depth, and gap tolerance.
- Forge blockout check: **not promoted** — the locked gate correctly refused
  promotion because no Tier-1 browser render diagnostics had been recorded.
- Blockout implementation: **continue at code/geometry level** — sole and +Z
  facade contract are encoded; both roof meshes are closed six-vertex,
  eight-triangle manifold prisms.
- Structural implementation: **continue at code/geometry level** — masonry,
  arcade posts/capitals, jetty, upper framing, and sign rig are separate named
  groups.
- Form-refinement implementation: **continue at code/geometry level** — roof
  courses, chimney bricks, door ironwork, raised sword emblem, quest papers,
  and staved barrels are present.
- Material implementation: **continue at code/validation level** — distinct
  `MeshStandardMaterial` families cover stone, timber, plaster, terracotta,
  paint, gold, iron, paper, and moss.
- Browser visual decision: **not recorded** — the prescribed local Playwright
  dependency was unavailable and no in-app browser backend was attached. No
  screenshot or Divine Eye result is claimed.

## Verification

- Node import and factory invocation: pass.
- `createAdventurersGuildHero === createAdventurersGuildModel`: pass.
- Closed-manifold edge check for both solid gable roofs: pass.
- Bounding-box sole: y=0 within floating-point tolerance.
- `npm run build`: pass.
- Forge pipeline unit suite: 42 tests passed.

The reconstruction is procedural and code-only. It does not use a facade photo,
projected texture, or paired roof slabs.
