# Tiny-Planet Messenger — how it works (and how the original works)

A field guide to this demo and to [messenger.abeto.co](https://messenger.abeto.co), the
abeto site it's modeled on. Written to be handed to someone cold.

---

## TL;DR

- The "look" = **three stacked rendering tricks**: cel (toon) shading → **ink outline** (edge
  detection in post) → **posterize + dither** (comic grain). Get those three right and almost
  anything looks like abeto.
- We render a **tiny planet** by keeping the character fixed and **rotating the planet under it**.
- Our character is a **VRM** anime avatar (VRoid) with a hand-coded walk. **abeto does NOT use
  VRM** — their character is a bespoke Houdini/Blender model. VRM is our shortcut.
- We're at ~**40%** of abeto's polish. The missing 60% is **content + asset optimization**, not
  technique.

---

## Part 1 — What abeto Messenger actually does

Reverse-engineered from their JS bundle + their [awwwards case study](https://www.awwwards.com/messenger.html)
and [80.lv writeup](https://80.lv/articles/deliver-mail-on-tiny-colorful-planet-in-this-relaxing-web-game).

- **Confirmed stack** (from their case study): 3D in **Houdini & Blender**; UI in
  **Figma & Photoshop**; code in **Three.js + three-mesh-bvh + vanilla JavaScript + C++**.
  The C++ is compiled to **WASM** for the perf-critical paths (asset decode / animation / sim)
  — *this*, plus aggressive compression, is the real reason it's so smooth (not cheaper rendering).
- **Engine**: custom **three.js** (not Unity), bundled with Vite, debug UI in Tweakpane.
- **Character**: a **3D model** hand-built in **Houdini/Blender**, textured in **Substance**.
  - Body animation = skeletal rig **+ Vertex Animation Textures (VAT)**: each frame's vertex
    positions are baked into a texture and replayed in a vertex shader. Animations ship as Draco
    `.drc` files (`diver-talk.drc`, …).
  - **The face is 2D**: eyes + mouth are sprite-sheet textures (`mouth-highq.ktx2`,
    `eye-highq.ktx2`) swapped per frame for blink / lip-sync. This is the trick that makes it feel
    hand-drawn. Only the *face* is 2D — the body is full 3D.
- **Walking the surface**: collision via **[three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)**.
- **Outline**: normal + depth + **surface-ID** edge detection in post.
- **Assets**: aggressively compressed — **Draco** geometry, **KTX2/Basis** textures, **OGG** audio,
  WASM decoders. This is *why it's smooth*.
- **Content**: multiple biomes (beach/city/factory/forest/temple/waterfalls), many NPCs, VFX
  (waterfalls, butterflies, birds as Draco point clouds), positional audio, multiplayer.

## Part 2 — How this demo works

Five pieces, one file each.

1. **Planet + walking** (`src/main.js`, `src/world.js`) — planet is a noise-displaced icosphere
   with an ocean shell. The character never moves; **the planet rotates underneath**
   (`rotateOnWorldAxis`) around camera-relative axes, and each frame we sample the terrain height
   at the top to plant her. (Cheap stand-in for abeto's BVH surface-walk.)

2. **Character** (`src/vrm-character.js`) — a **VRM** avatar (VRoid) via
   [`@pixiv/three-vrm`](https://github.com/pixiv/three-vrm). MToon cel materials match the look.
   The walk is **hand-coded** by rotating the normalized humanoid bones with sine curves — no
   animation file (hence a bit stiff). Falls back to three.js `RobotExpressive` if no
   `public/character.vrm`.

3. **Props + city** (`src/world.js`) — trees / rocks / bushes / **buildings** are procedural 3D
   toon geometry, scattered on land and oriented to the surface normal. Real geometry → the outline
   pass wraps them.

4. **The style pipeline** (`src/postfx.js`) — the core:
   1. **Cel shading**: `MeshToonMaterial` + a few-step gradient ramp (MToon for the VRM).
   2. **Ink outline**: render a **normal + depth** pre-pass, then a full-screen edge-detection
      shader — silhouettes from a **depth Laplacian**, interior lines from **normal** differences.
   3. **Posterize + dither**: quantize colour into N bands + **8×8 Bayer** ordered dither.
   - Chain: `RenderPass → Outline → Posterize → SMAA → Output`.

5. **Painterly ground** (`scripts/genimg.py`) — grass texture **AI-generated** (`gpt-image-2`),
   triplanar-projected onto the sphere (no seams) with a sandy shoreline.

## Part 3 — VRoid & VRM (and why the original doesn't use them)

- **VRoid Studio** — pixiv's free desktop app for *making* anime 3D characters with sliders/brushes.
- **VRM** — an open avatar file format (`.vrm`) on top of glTF 2.0: standard humanoid skeleton,
  expressions, look-at, **spring bones** (hair/cloth physics), the **MToon** toon shader, and
  license metadata. `@pixiv/three-vrm` loads it into three.js.
- **The original game does NOT use VRoid/VRM.** abeto's character is custom-modeled (Houdini/Blender)
  with a 2D sprite face — no `.vrm`, no VRM extensions in their bundle. VRM is *our* shortcut to get
  an anime girl in minutes. Trade-off: a default VRoid avatar reads "VTuber", not abeto's hand-drawn
  Ghibli style.
- **To use your own character**: make one in VRoid Studio → export `.vrm` → drop it at
  `public/character.vrm` (overwrites the placeholder; no code change).

## Part 3.5 — Research log / provenance (keep this)

Early Claude Code / local chat history for this folder may be gone. **Canonical memory is this
doc + README + `docs/CONTENT_PIPELINE.zh.md` (+ Chinese §5 in `HOW_IT_WORKS.zh.md`)**, not deleted sessions.

- **Target**: [messenger.abeto.co](https://messenger.abeto.co) look (cel + ink outline + posterize).
  Their character is **not** VRM (custom mesh + VAT + 2D face).
- **Our shortcut**: VRM via `@pixiv/three-vrm` + Mixamo walk FBX. Enough reverse-engineering is
  already written above — prefer shipping content over re-doing a full site RE.
- **Timeline (machine-checkable)**: core tree ~2026-06-18; Cursor-era work + git from ~2026-07-22.
  No local Claude/Codex session with cwd `personal/threejs` found for the original scaffold.

## Part 4 — The gap (our 40% → their 100%)

| | abeto | this demo |
|---|---|---|
| Assets | hand-modeled + hand-painted | procedural blobs + 1 AI texture |
| Character anim | rigged + mocap, 2D sprite face | hand-coded sine walk |
| Outline | surface-ID | normal + depth |
| World | many biomes, NPCs, VFX, audio, gameplay | one planet, static props |
| Smoothness | Draco/KTX2, instancing, LOD | basic tuning (holds 60fps) |

**Roadmap to close it:** real modeled+textured assets · Mixamo walk retargeted onto the VRM ·
surface-ID outline · more biome/prop variety · asset compression.

## References (open source)

- Outline (closest to abeto): https://github.com/OmarShehata/webgl-outlines
- Ghibli toon shader: https://github.com/craftzdog/ghibli-style-shader
- Tiny-planet controller: https://github.com/pmndrs/ecctrl · https://github.com/hlorenzi/galaxy
- VAT (vertex animation): https://github.com/mikelyndon/r3f-webgl-vertex-animation-textures
- VRM in three.js: https://github.com/pixiv/three-vrm
- Free animated characters: https://quaternius.com (CC0) · https://www.mixamo.com · https://vroid.com
- abeto case study: https://www.awwwards.com/messenger.html
