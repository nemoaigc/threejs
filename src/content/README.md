# Content packs

Runtime registration lives in `bootstrap.js`. Spec: [`docs/CONTENT_PIPELINE.zh.md`](../../docs/CONTENT_PIPELINE.zh.md).

## Add an actor (person)

1. Copy `manifests/hunter_f.js` → `manifests/<id>.js`, edit preset / paths.
2. Put `model.vrm` (+ optional `walk.fbx`) under `public/` (or `public/content/actors/<id>/`).
3. `register('actors.<id>', …)` in `bootstrap.js`.
4. Set `PLAYER_ID` or spawn via `createFromCatalog` — **do not** edit pose math in `main.js`.

## Add an animal

1. Implement `entities/animal` (GLB + clips).
2. Manifest `kind: 'animal'`.
3. Register + place (layout or spawner).

## Add a building

- **Procedural:** builder in `world.js` + `type` in `layouts/*` (current P0 path).
- **GLB:** implement `entities/building` + layout place.

## Files

| Path | Role |
|------|------|
| `kinds.js` | kind enum + idle presets + loco spring table |
| `catalog.js` | which ids this slice enables |
| `registry.js` | id → factory |
| `bootstrap.js` | one-shot register-all |
| `manifests/` | JS manifests (importable; JSON mirror optional under `public/content/`) |
