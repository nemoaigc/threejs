# 英雄建筑资产管线（路径 A）

> 目标：让公会 / 神殿 / 旅馆 **3 秒内可辨识**，不再用方盒子堆砌冒充地标。  
> 策略：**单物体 3D 感参考图 →（img2threejs 或等效）→ 可编辑 Three.js factory → catalog + layout**。  
> 关联：[SCENE_SPEC_MUSHOKU.zh.md](./SCENE_SPEC_MUSHOKU.zh.md) · [CONTENT_PIPELINE.zh.md](./CONTENT_PIPELINE.zh.md)

---

## 1. 为何不整村一次出

| 工具 | 粒度 | 对我们 |
|------|------|--------|
| [img2threejs](https://github.com/img2threejs/img2threejs) | **单物体** + 强剪影参考 | 适合 3 个英雄建筑，不适合整张英雄镜头 |
| 当前 `world.js` builders | 全场景程序体块 | 可扩展但观感不及格（已验收失败） |

整张场景图会被 img2threejs suitability **reject**（scene ≠ object reference）。  
地面 / 路 / 雾 / cel 后处理 / VRM 角色仍走本仓库管线。

---

## 2. 三座英雄建筑（P0）

| id | layout type | 一眼必须读出 | 色彩锚点 |
|----|-------------|--------------|----------|
| `buildings.adventurers_guild` | `adventurersGuild` | 木石大厅 + **巨大公会招牌** + 告示板/酒桶 | 木 `#8B5E3C` · 深绿牌 `#3D5A40` · 陶瓦 `#B85A48` |
| `buildings.temple` | `temple` | **高尖塔/钟楼** + 白石中殿 + 彩窗 + **太阳徽**（禁红十字） | 白石 `#F2E8D5` · 石板顶 `#6A7078` · 金徽 |
| `buildings.inn` | `inn` | 暖木楼 + **底楼酒馆暖窗** + 悬挂酒杯/招牌 | 暖木 · 酒红牌 `#5A2A32` · 窗光 |

体量仍服从 SCENE_SPEC §5（公会 L ~10×8，神殿更高更长，旅馆 S–M）。

---

## 3. 参考图合同（给 img2threejs / 出图）

每张图必须满足官方 suitability **Pass** 精神：

### 3.1 硬性

1. **单主体** — 画面只有一座建筑（可带门口微 props：桶、告示板），无街道全景。  
2. **像 3D** — 产品渲染 / 手办棚拍 / 等距 3D 预览感；有体积光、接触阴影、清晰棱角。  
   - 禁止：平涂插画主、远景城市场景、构图散的概念氛围图。  
3. **强剪影** — 缩到 128px 仍能认出类型（尖塔 / 大牌 / 暖窗招牌）。  
4. **中性底** — 浅灰或柔和渐变，无杂乱背景。  
5. **3/4 视角** 为主视图（看清正面 + 一侧）；可选第二张纯侧面。  
6. **占满画幅** — 建筑占画面约 60–85%。  
7. **分辨率** ≥ 1024 短边，细节可读（窗格、梁、瓦、铆钉感）。

### 3.2 风格锚（与游戏成片可不完全同，但身份特征要同）

- 奇幻西欧 / 无职早期乡间木石，**非**赛博、非现代玻璃幕墙。  
- 后续进引擎会 **toonify + outline + posterize**；参考图可偏写实 3D 或干净硬表面，便于 skill 抽 bevel/材质。  
- 身份特征要 **故意夸张**（大招牌、尖塔高度、暖窗亮度），方便远处读。

### 3.3 出图 Prompt 模板（中英可混，保留结构）

**公会**

```
Single fantasy adventurers guild building as a 3D product render, three-quarter view,
wide timber-and-stone hall, steep red clay roof, huge hanging dark-green sign with gold
crossed-swords emblem, outdoor quest board and barrels at the entrance, warm plaster upper
walls, deep portico, soft studio lighting, neutral light-gray backdrop, strong readable
silhouette, high detail bevels and wood grain, no street, no other buildings, no characters.
```

**神殿**

```
Single fantasy village temple as a 3D product render, three-quarter view, tall white stone
nave, very high bell steeple with dark slate spire, large rose window, vertical stained-glass
lancets in bright colors, golden sun disc emblem on facade (not a Christian cross), columned
portico and steps, neutral light-gray backdrop, strong vertical silhouette, studio lighting,
no other buildings, no people.
```

**旅馆**

```
Single fantasy village inn as a 3D product render, three-quarter view, warm timber framing,
red clay gable roof, large glowing ground-floor tavern bay windows, hanging burgundy sign
with simple mug silhouette, flower box and barrel by the door, chimney, soft evening window
glow, neutral light-gray backdrop, cozy readable silhouette, no street scene, no people.
```

参考图落盘建议：

```
docs/references/heroes/
  adventurers_guild/
    ref_main.png          # 3/4 主视图（必填）
    ref_side.png          # 可选侧面
    PROMPT.md             # 实际使用的 prompt
  temple/
    ...
  inn/
    ...
```

---

## 4. 生产步骤（img2threejs）

1. **出图** — 按 §3 生成/筛选 3 张主参考（不达标不进 skill）。  
2. **单物体重建** — 每座单独跑 skill（预计每座多轮 review，token 量级见上游 `TOKEN_COST.md` ~80k–180k）。  
3. **导出 factory** — `createAdventurersGuildModel.ts` 等，拷入：

```
src/entities/building/heroes/
  adventurers_guild/
    createModel.js   # 或 .ts 编译后；返回 Group，sole@y=0
  temple/
  inn/
```

4. **Toon 适配** — 材质迁到本项目 `MeshToon` + `gradientMap`，保留 emissive 暖窗/彩窗；接 outline（勿 `noOutline` 整栋关掉）。  
5. **Catalog** — `buildings.adventurers_guild` 等 id + `manifest`；`world.buildByType` 优先 catalog，失败再 fallback 旧程序块。  
6. **Layout** — 仍用 `mushoku-slice-p0.js` 的 type 键，不改坐标纪律。  
7. **验收** — 英雄镜头截图 3 秒口述测试：必须说出「公会 / 神殿 / 旅馆」。

---

## 5. 版本管理约定

- 每完成可运行增量就 **commit + push**（参考图、prompt、factory、catalog 接线均可单独提交）。  
- 大体积第三方 clone 不进库：`research/messenger-ecosystem/` 已在 `.gitignore`。  
- 参考图 PNG 可进 `docs/references/`（控制单张体积）；原始超大源文件放本地或 LFS。  
- Commit 信息写清：`heroes:` / `refs:` / `catalog:` 前缀，便于回滚单地标。

---

## 6. 状态

| 步骤 | 状态 |
|------|------|
| 规范（本文） | ✅ |
| 三张主参考图 | ✅ `docs/references/heroes/{adventurers_guild,temple,inn}/ref_main.png`（1024²，2026-07-25） |
| 剪影验收（人眼） | ✅ 公会=交叉剑大牌+告示板；神殿=尖塔+彩窗+太阳徽；旅馆=酒杯牌+暖窗 |
| img2threejs 重建 | ⏳ |
| catalog + toon 接入 | ⏳ |
| 退役 world.js 旧 createTemple/Guild/Inn 作为主路径 | ⏳（可留 fallback） |

### 6.1 参考图验收记录

| 地标 | 文件 | 像 3D | 单主体 | 中性底 | 身份特征 |
|------|------|-------|--------|--------|----------|
| 公会 | `adventurers_guild/ref_main.png` | ✅ 产品渲染 | ✅ | ✅ 浅灰 | 绿牌交叉剑、委托板、酒桶 |
| 神殿 | `temple/ref_main.png` | ✅ | ✅ | ✅ | 高尖塔、玫瑰窗、金太阳徽、彩窗条 |
| 旅馆 | `inn/ref_main.png` | ✅ | ✅ | ✅ | 酒杯挂牌、底楼暖窗、花箱与桶 |

下一步：对每座单独跑 img2threejs（或等效 skill），产出 `create*Model` factory → toon 适配 → catalog。
