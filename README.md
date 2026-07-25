# Tiny Planet — Messenger style

A Three.js + Vite study that reproduces the *rendering technique* of
[messenger.abeto.co](https://messenger.abeto.co): a cel-shaded character walking a tiny
planet, drawn with **ink outlines** and a **posterized / dithered** comic finish.

> Status: ~40% of abeto's polish. Same techniques, much less content. See "Gap" below.
>
> **Content direction (flat-first):** [docs/SCENE_SPEC_MUSHOKU.zh.md](docs/SCENE_SPEC_MUSHOKU.zh.md) — Mushoku Tensei village-slice (Buena/Roa feel).  
> **Content pipeline (add actors / animals / buildings):** [docs/CONTENT_PIPELINE.zh.md](docs/CONTENT_PIPELINE.zh.md) — catalog + Entity contract.  
> **Research / provenance (abeto reverse notes, VRM shortcut, lost early sessions):** [docs/HOW_IT_WORKS.zh.md](docs/HOW_IT_WORKS.zh.md) §5 — treat docs as source of truth, not deleted chats.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

**Controls:** `WASD` / arrows = walk · drag = orbit camera · top-right panel = tune the style.

---

## How it works

Five pieces. Each maps to one file.

### 1. The planet + walking — `src/main.js`, `src/world.js`
- **Planet**: an `IcosahedronGeometry(1, 64)` (~82k tris) displaced by 4-octave simplex
  noise → hills. An ocean shell hides the low ground.
- **Walking model**: the character never moves — **the planet rotates underneath it**
  (`planetGroup.rotateOnWorldAxis`) around camera-relative axes. Each frame we sample the
  terrain height at the point currently on top and plant the character there, so she rides
  the hills. (abeto does true surface-walking with `three-mesh-bvh` collision; this is the
  cheap equivalent.)

### 2. The character — `src/entities/character/*` + `src/content/*`
- Loaded via **content catalog** (`createFromCatalog('actors.hunter_f')`), not one-off scripts.
- A **VRM** anime avatar + **Mixamo** walk FBX, retargeted with `loadMixamoAnimation`.
- Idle arms use named presets (`little_girl_soft` …); cloth Aim bones are pinned; hair uses
  light spring + velocity trail (see CONTENT_PIPELINE §5).
- Falls back to `src/model-character.js` if the catalog actor fails to load.
- **Add a new person / animal / building:** follow [CONTENT_PIPELINE](docs/CONTENT_PIPELINE.zh.md) checklist — new folder + manifest + `register()`, no `main.js` hacks.

### 3. The world props + city — `src/world.js`
- Trees / rocks / bushes / **buildings** are **procedural 3D toon geometry** (boxes +
  noise-displaced icospheres), scattered on dry land and oriented to the surface normal.
  Being real geometry, the outline pass wraps them automatically.

### 4. The style pipeline (the core) — `src/postfx.js`
This is what creates the "abeto look". Three layers:
1. **Cel shading** — `MeshToonMaterial` + a few-step gradient ramp (MToon for the VRM) →
   flat colour bands instead of smooth shading.
2. **Ink outline** — render a **normal buffer + depth** pre-pass, then a full-screen
   edge-detection shader draws black lines where it finds discontinuities: silhouettes from
   a **depth Laplacian** (ignores smooth curvature, fires on steps), interior creases from
   **normal** differences.
3. **Posterize + dither** — quantize colour into N bands and add an **8×8 Bayer**
   ordered-dither → the screen-printed comic grain.

   Composer chain: `RenderPass → Outline → Posterize → SMAA → Output`.

### 5. Painterly ground + AI assets — `scripts/genimg.py`
The grass ground texture is **AI-generated** (`gpt-image-2` via an OpenAI-compatible
gateway) then projected onto the sphere with **triplanar** mapping (no UV seams), with a
sandy ring near the water. The script also generated the earlier 2D sprite experiments.

---

## Performance

The outline forces the scene to be rendered **3× per frame** (shadow map + normal pre-pass +
beauty). To hold 60 fps we: capped subdivision (planet 64, ocean 24), stopped the dense
terrain from casting shadows, capped `pixelRatio` at 1.5, and used a 1024 shadow map.

---

## Gap vs abeto (the other 60%)

| | abeto Messenger | this demo |
|---|---|---|
| Assets | hand-modeled (Houdini/Blender) + painted (Substance) | procedural blobs + 1 AI texture |
| Character anim | rigged + mocap/keyframed, 2D sprite face | hand-coded sine walk |
| Outline | surface-ID edge detection | normal + depth edge detection |
| World | many biomes, NPCs, VFX (Draco point clouds), audio, gameplay | one planet, static props |
| Smoothness | Draco/KTX2 compression, instancing, LOD | basic tuning |

**To close it:** real modeled+textured assets, a Mixamo walk retargeted onto the VRM, a
surface-ID outline ([OmarShehata/webgl-outlines](https://github.com/OmarShehata/webgl-outlines)),
more biome/prop variety, and asset compression.

## Stack
`three` · `vite` · `@pixiv/three-vrm` · `simplex-noise` · `lil-gui`, plus `gpt-image-2` for
the ground texture. Swap `public/character.vrm` for your own VRoid export to change the character.

## Credits
- Trees & houses in `public/models/` — CC0 (public domain) by **[Quaternius](https://quaternius.com)** (via Poly Pizza).
- `public/walking.fbx` — Mixamo walk clip (MIT) from **[met4citizen/TalkingHead](https://github.com/met4citizen/TalkingHead)**, retargeted onto the VRM with pixiv's `loadMixamoAnimation` helper.
- The character is a **placeholder** VRM (a constraint-test sample with a plain face / loosely-rigged clothes) — replace `public/character.vrm` with your own VRoid export for a proper avatar.
