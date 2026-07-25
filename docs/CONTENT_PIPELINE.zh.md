# 内容管线契约（Content Pipeline）

> **先定规矩，再加内容。**  
> 新增猎人 / 男性 / 小动物 / 建筑 / 道具，走同一条 pipeline，禁止在 `main.js` / `vrm-character.js` 里再叠一次性补丁。  
> 关联：场景叙事 [SCENE_SPEC_MUSHOKU.zh.md](./SCENE_SPEC_MUSHOKU.zh.md) · 渲染 [HOW_IT_WORKS.zh.md](./HOW_IT_WORKS.zh.md)

---

## 0. 一句话

**声明式 catalog + 统一 Entity 接口 + 统一 plant 落点** = 可批量加内容。  
视觉验收按 **kind 的 DoD 截图**，不按「感觉改了一下」。

---

## 1. 目录约定（硬）

```
public/
  content/
    actors/          # 可动角色：vrm / glb + 可选 fbx
      hunter_f/
        model.vrm
        walk.fbx           # 可选；没有则 idle-only
        manifest.json      # 见 §3
      cat_stray/
        model.glb
        manifest.json
    buildings/       # 仅外置模型时用；程序化建筑可不放文件
      hospital_akso/
        model.glb
        manifest.json
    props/
      ...

src/
  content/
    kinds.js           # kind 枚举 + 默认值
    registry.js        # id → factory / manifest
    catalog.js         # 本切片启用哪些 id（P0 列表）
  entities/
    types.js           # Entity 接口（JSDoc）
    character/         # 人形 VRM 管线（唯一入口）
      index.js
      load.js
      pose.js
      locomotion.js
      cloth.js
      springs.js
    animal/            # 小动物（后续）
    building/          # 外置建筑包装（可选；程序化仍在 world builders）
  layouts/             # 声明式 x,z,yaw（已有 mushoku-slice-p0）
  plant/               # plantOnFlat / plantOnPlanet（可从 world 再抽）
  world.js             # 地面、天空、populateFromLayout
  main.js              # 只：bootstrap + input + 调 entity.update
```

**禁止：**

- 在 `main.js` 写死某个角色的骨骼 Euler
- 新角色复制一整份 `vrm-character.js` 改参数
- 布局用 `Math.random` 撒建筑（布局必须进 `layouts/*`）

---

## 2. 统一 Entity 接口

每个可进场景的东西，最终都是：

```js
/**
 * @typedef {object} Entity
 * @property {string} id              // catalog id，如 actors.hunter_f
 * @property {'actor'|'animal'|'building'|'prop'|'fx'} kind
 * @property {THREE.Group} group      // 根节点；sole 在本地 y=0
 * @property {(ctx: UpdateCtx) => void} update
 * @property {() => void} [dispose]
 * @property {object} [debug]         // 仅 dev：pose metrics 等
 */

/**
 * @typedef {object} UpdateCtx
 * @property {number} time
 * @property {number} dt
 * @property {boolean} moving         // 玩家输入在走
 * @property {'idle'|'walk'|'run'|'sprint'} loco
 * @property {number} [orbitDelta]    // 相机方位角增量（rad）
 * @property {THREE.Vector3} [wind]   // 可选世界风
 */
```

### 2.1 生命周期（所有 kind 相同）

| 步骤 | 谁做 | 规则 |
|------|------|------|
| 1. resolve | `catalog` + `registry` | `id` → manifest + factory |
| 2. load | factory | 异步；失败 throw，main 可 fallback |
| 3. normalize | factory | **sole @ y=0**；面向 −Z；单位 m |
| 4. plant | `plantOnFlat` / `plantOnPlanet` | 只改 group 世界 TRS，不改内部 rest |
| 5. update | `entity.update(ctx)` | 每帧；**顺序固定**（见 §5） |
| 6. dispose | 可选 | 丢 texture / mixer |

### 2.2 sole @ y=0（全 kind 强制）

- 本地空间：脚底 / 建筑底面 / 爪子 最低点 **y = 0**
- 缩放后重算 `box.min.y` 再抬
- 平面：`group.position.y = 0`（或 plant sink 极小量）
- 星球：只通过 `plantOnPlanet`，禁止手写半径公式散落各处

---

## 3. Manifest 契约（每种内容一份 JSON）

路径：`public/content/<bucket>/<id>/manifest.json`

### 3.1 共用字段

```json
{
  "id": "actors.hunter_f",
  "kind": "actor",
  "displayName": "猎人·女",
  "version": 1,
  "source": {
    "model": "model.vrm",
    "format": "vrm"
  },
  "scale": { "targetHeight": 1.05 },
  "spawn": { "facing": "-z" },
  "tags": ["player", "p0", "linkon"]
}
```

### 3.2 `kind: actor`（人形：女 / 男 / NPC）

```json
{
  "id": "actors.hunter_f",
  "kind": "actor",
  "source": { "model": "model.vrm", "format": "vrm" },
  "scale": { "targetHeight": 1.05 },
  "locomotion": {
    "walk": "walk.fbx",
    "run": null,
    "sprint": null,
    "stripRootPosition": true,
    "armSwingMix": 0.28
  },
  "idle": {
    "style": "cute_open",
    "preset": "little_girl_soft"
  },
  "springs": {
    "profile": "light_hair",
    "center": "head",
    "hairColliders": "torso_only",
    "cloth": {
      "sleeves": "pin_to_upper_arm",
      "shorts": "pin_aim_to_upper_leg"
    }
  },
  "locoSpring": {
    "idle":  { "sway": 0.15, "trail": 0.0 },
    "walk":  { "sway": 0.55, "trail": 0.35 },
    "run":   { "sway": 0.85, "trail": 0.7 },
    "sprint":{ "sway": 1.0,  "trail": 1.0 }
  }
}
```

**idle.preset（程序表，不写死在业务里）：**

| preset | 含义 | 上臂 \|Z\| 约 |
|--------|------|-------------|
| `soft_hang`（默认） | 手放下来，微留缝 | ~1.0–1.1 rad |
| `little_girl_soft` | 同 soft_hang（旧名兼容；已不再大张） | ~1.05 rad |
| `neutral_hang` | 更贴身自然下垂 | ~1.15–1.2 rad |
| `hero_ready` | 略张、手近腰 | ~0.85 rad |

静止头发：`springs.profile: drape_idle` —— 加载时 gravity 沉降并 `setInitState`；idle 无 wind，刘海高刚度防蓬。

**男主 / 另一套 VRM：** 复制目录 + 改 manifest + 登记 catalog，**不改** `entities/character` 核心代码（只加 preset 行）。

### 3.3 `kind: animal`（猫 / 鸟 / 小动物）

```json
{
  "id": "animals.cat_stray",
  "kind": "animal",
  "source": { "model": "model.glb", "format": "glb" },
  "scale": { "targetHeight": 0.28 },
  "locomotion": {
    "clips": { "idle": "idle.glb", "walk": "walk.glb" },
    "default": "idle"
  },
  "ai": { "mode": "wander_radius", "radius": 4 },
  "springs": null
}
```

验收：sole@0；walk 不滑步；不进布局禁区。

### 3.4 `kind: building`（外置 GLB）

```json
{
  "id": "buildings.hospital_akso",
  "kind": "building",
  "source": { "model": "model.glb", "format": "glb" },
  "footprintWxD": [16, 10],
  "heightHint": "L",
  "sole": "y0",
  "castShadow": true
}
```

程序化建筑（当前多数）用 **builder 函数** 注册进 registry，不必有文件；但 **layout place.type 必须等于 registry key**。

### 3.5 `kind: prop`

路灯、告示板、长椅：同 building，更小 footprint；可批量 `streetLightsAlongMain()` 生成 places。

---

## 4. 布局管线（已有，保持）

`src/layouts/*.js`：

```js
{ id, type, x, z, yaw, footprintWxD, heightHint, zone, priority }
```

| 规则 | |
|------|--|
| type | 必须在 `registry` 有 factory 或 builder |
| 禁区 | 广场中心不得 L/XL |
| 间距 | 见 SCENE_SPEC §4 |
| 平面优先 | plant 用 `makePlant(group,'flat')`；包球只换 adapter |

**批量加一栋楼：**

1. builder 或 glb + manifest  
2. `registry.register('myShop', factory)`  
3. layout 加一条 place  
4. hero 截图验收  

不必改 `main.js`。

---

## 5. Actor 每帧顺序（写死，禁止打乱）

```
1. mixer / locomotion weight
2. idle pose OR walk bones
3. humanoid.update()          // normalized → raw
4. cloth pin (Aim/Roll)       // 袖/裤跟 biped
5. spring tune by loco        // 轻量；禁止每帧改 rest
6. springBoneManager.update
7. cloth pin again (sleeve freeze only)
```

头发：

- **rest 一次搞定**（作者值 + 可选一次 hang bake），运行时只靠 spring + 弱 trail  
- **禁止** 同时：重定向 rest + 强风 + 改 center + 冻又解冻  
- collider：`torso_only`（头/颈/胸/髋）；**不要**用手臂 collider 顶长发  

---

## 6. 批量 checklist（复制即用）

### 新女角色 / 男角色

- [ ] `public/content/actors/<id>/model.vrm`  
- [ ] `manifest.json`（idle preset + walk fbx）  
- [ ] `catalog.js` 启用  
- [ ] DoD 静帧：微张/下垂符合 preset；发不炸  
- [ ] DoD 走 3 秒：腿动、臂不甩飞、发轻摆  
- [ ] 不改 `main.js` 业务逻辑  

### 新小动物

- [ ] glb + clips 或程序 idle  
- [ ] manifest `kind: animal`  
- [ ] layout 或 runtime spawner  
- [ ] sole@0；阴影开  

### 新建筑

- [ ] builder **或** glb  
- [ ] footprint + heightHint 与视觉一致（医院 ≠ 小店）  
- [ ] layout place + 间距  
- [ ] hero 机位能读出语义  

---

## 7. Definition of Done（总闸）

| 级别 | 条件 |
|------|------|
| **P0 平面可玩** | catalog 内全部 place 落点无飞；player actor DoD 过；无随机堆楼 |
| **P0 角色** | idle 可爱微张；walk 摆臂克制；发下垂 + 走时轻摆；裤/袖跟肢体 |
| **P1 批量** | 第 2 个 actor、第 1 个 animal 只加 content + catalog，零核心改动 |
| **P2 包球** | 同一 layout + `makePlant(...,'planet')`，内容不重做 |

---

## 8. 与历史债的关系

| 旧路径 | 状态 |
|--------|------|
| `src/vrm-character.js` 巨型补丁堆 | **退役**；逻辑拆到 `entities/character/*` |
| `src/model-character.js` | fallback 占位，保留 |
| `world.js` populateFromLayout | 保留；builder 逐步可挂 registry |
| 本文 + SCENE_SPEC | 内容与场景双规格；冲突时 **管线契约优先于临时补丁** |

---

## 9. 代码入口（实现后）

```js
// main.js — 理想形态
import { createFromCatalog } from './content/registry.js';
import { PLAYER_ID } from './content/catalog.js';

const player = await createFromCatalog(PLAYER_ID);
plantOnFlat(player.group, spawn.x, spawn.z, 0);
scene.add(player.group);

// loop
player.update({ time, dt, moving, loco, orbitDelta });
```

新增内容 = **新文件夹 + manifest + catalog 一行**，不是新的 600 行角色文件。
