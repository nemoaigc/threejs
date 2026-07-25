# img2threejs run log — Adventurers Guild

**Executor:** `codex exec` with skill `.agents/skills/img2threejs`  
**Reference:** `public/content/buildings/adventurers_guild/ref_main.png`  
**Date:** 2026-07-25

## Forge commands (skill pipeline)

1. `forge/stage1_intake/probe_image.py` → technicalSuitability=pass
2. `forge/stage1_intake/check_reference_admission.py` → ADMITTED
3. `forge/stage2_spec/new_pre_spec_assessment.py AdventurersGuild --complexity complex`
4. `forge/stage1_intake/build_detail_inventory.py --mode grid-3x3`
5. Agent-filled assessment + detailInventory from visual inspection of reference
6. `forge/stage2_spec/new_sculpt_spec.py` → object-sculpt-spec.json
7. `forge/stage2_spec/validate_sculpt_spec.py --strict-quality` (iterated until pass)
8. `forge/stage3_build/generate_threejs_factory.py` + agent implementation of geometry passes
9. Output: `createAdventurersGuildModel.js` (MeshStandardMaterial, solid roofs, sculptRuntime)

## Wiring

- `src/entities/building/heroes/adventurers_guild.js` re-exports `createAdventurersGuildModel` as `createAdventurersGuildHero`
- Preview: `/hero-preview.html`

## Provenance markers

- `group.userData.generator = 'img2threejs-forge-authored'`
- `group.userData.assetId = 'img2threejs-guild'`
- Spec artifacts in this directory: assessment.json, di.json, object-sculpt-spec.json, probe.json

## Honest note

This is the **img2threejs staged pipeline** (forge scripts + agent-authored geometry from ObjectSculptSpec), not photogrammetry and not a one-shot hand box stack. Full multi-angle Divine Eye browser review may still be incomplete if sandbox blocked headless WebGL.
