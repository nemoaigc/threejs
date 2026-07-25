# Messenger 生态调研报告

> 调研日期：2026-07-23  
> 目标站：[messenger.abeto.co](https://messenger.abeto.co/)（abeto · Messenger）  
> 本仓库定位：Three.js 小行星 + cel/描边/色阶 画风研究；**程序化建筑优先**，不喜欢纯 GLB 小镇堆砌。  
> 本地克隆目录：`research/messenger-ecosystem/`（已加入 `.gitignore`，勿提交）  
> 更早的栈笔记见：[HOW_IT_WORKS.zh.md](./HOW_IT_WORKS.zh.md)

---

## 0. 结论先说

| 问题 | 诚实答案 |
|------|----------|
| 原版世界是程序化生成的吗？ | **基本上不是。** 地形/建筑是 **Houdini/Blender 手作**；球面用 **展开立方体（unwrapped cube）** 建模再包球。程序化只出现在植被替换、LOD、部分细节（水、草 blob→几何）。 |
| 能直接「抄」原版 mesh 吗？ | **法律上不行**（专有资产）。GitHub 上大量 **静态镜像 / 离线包** 含 `.drc`/`.ktx2`/App3D bundle——**仅本地学习，勿进 `public/`、勿再分发**。 |
| 开源里谁最接近「可偷」的程序化城镇？ | **Glowin/messager**、**Cronicweb/tiny-planet-messenger**、**TomClive/waddle-post**：原始几何拼房；与我们 `src/world.js` 路线一致。 |
| 开源里谁最接近「原版渲染/资产管线」？ | **arafays/messenger-copy**（着色器与 surfaceId/LUT/深度描边）、**promptwhisper/messenger**（R3F + Draco 场景块 + hitmesh）、离线镜像（Kilganon / abderrahim）作 **逆向对照**。 |
| 原版 vs 本仓库 | 原版 = 手作密度 + WASM/压缩 + BVH 真表面行走。我们 = 噪声球 + 程序化 props + VRM 捷径。程序化建筑应 **继续加深 massing/模块化**，而不是改走「整城 GLB」。 |

---

## 1. Messenger 原版怎么做（生成 / 资产 / 渲染）

### 1.1 一手来源（优先信这些）

1. **[Awwwards Case Study — Messenger](https://www.awwwards.com/messenger.html)**（abeto 自述，最权威）  
2. **[Communication Arts Webpicks — Vicente Lucendo](https://www.commarts.com/webpicks/messenger)**  
3. **[80.lv 报道](https://80.lv/articles/deliver-mail-on-tiny-colorful-planet-in-this-relaxing-web-game)**（产品向，技术浅）  
4. 本仓库既有逆向摘要：[HOW_IT_WORKS.zh.md §1](./HOW_IT_WORKS.zh.md)  
5. 第三方逆向文（**可信度中等，有推断**）：[blog.mushroom.cv 技术栈拆解](https://blog.mushroom.cv/blog/how-to-develop-webgl-3d-game-threejs-complete-guide/)

### 1.2 官方确认的栈

| 层 | 技术 |
|----|------|
| 建模 | **Houdini & Blender** |
| UI 设计 | Figma & Photoshop |
| 运行时 | **Three.js**、**three-mesh-bvh**、原生 JavaScript、**C++ → WASM** |
| 联机 | 自研后端（CommArts：几乎一切除建模与 three.js 外都是 custom）；公开镜像里常见 `wss://multiplayer-server-…run.app`（Cloud Run） |
| 目标平台 | 桌面 + **单指手机**；房间人数 **上限约 10** 以保「安静感」 |

### 1.3 世界如何「生成」——关键：几乎不程序化整城

Awwwards 明确写了球面建模两条路：

1. **Procedural Deformation**：平面资产程序化贴到球上 ——「能用，但每个角落加细节会累死」。  
2. **Unwrapped Cube（最终方案）**：把整个世界当成 **展开的立方体** 来摆放与雕刻，再折成球，失真可控，**关卡设计效率高**。

因此：

- **地形 / 街区 / 七大区域**（neighborhood、plaza、cemetery、beach、mountain temple、forest、factory）是 **手作关卡**，不是噪声随机城。  
- 「看起来很满」靠的是：灰盒 → 精模、**自定义 LOD（多级且保轮廓）**、实例化/合批、极端压缩，而不是 runtime PCG 出楼。

程序化/半程序化的部分（官方点名）：

- **Color atlas**：整站颜色进一张极小 **16×16** 调色板贴图，改光/mood 一次全改。  
- **Smart vegetation**：森林先用 **blob 占位**，再自动换成优化过的叶子/草几何 + shader。  
- **水**：岸边涟漪、深水渐变；角色湿衣变色再烘干。  
- **LOD / 内存**：iOS Safari 杀页压力大 → 资源引用追踪、用完即丢；自定义切分与压缩工具。

### 1.4 角色（与 VRM 无关）

- 主角参考「兼职送货的荷兰青少年」；**换装/发型随机**，更新要 **drip** 以免卡顿。  
- 本仓库与社区逆向一致：身体是 **定制 3D + 骨骼/VAT（顶点动画贴图，`.drc`）**；**脸是 2D 精灵表**（眨眼/口型）——手绘感主要来自脸，不是全身 2D。  
- **没有 VRM / VRoid**。VRM 是本项目的捷径，不是原版路径。

### 1.5 行走与相机

- 中心重力 + 任意朝向行走；**three-mesh-bvh** 做碰撞/射线（无独立物理引擎是合理选择）。  
- 过肩相机；窄巷防穿模是重点工程。  
- 社区镜像可见独立 **hitmesh_*.drc** 碰撞壳与 **full_*.drc** 可视块分离（promptwhisper 加载路径）。

### 1.6 渲染 / 画风

官方强调：

- 手绘、略不完美的 indie 感；**自定义描边**（厚度/颜色/透明度可控）。  
- 案例未开源 shader，但学习仓与本仓库 RE 对齐为：  
  - **Cel / toon**（色阶 + 小 atlas）  
  - **后处理描边**（深度 / 法线 / **surface-ID**）  
  - **LUT / 颗粒**（学习仓有 strip LUT + paper grain）  
- UI 大量直接画在 WebGL；字体用 **WASM 生成字形** 再 GPU 画（非 MSDF）。

### 1.7 资产交付形态（从镜像与学习仓可观察）

| 类型 | 形态 |
|------|------|
| 几何 | Draco **`.drc`**（成百上千块；地形分 chunk、角色 idle/bones 分文件） |
| 贴图 | **KTX2 / Basis** |
| 音频 | OGG 分区 ambience |
| 主逻辑 | Vite 打包的巨型 `App3D-*.js` + workers |
| 首包体积 | 社区报道约数 MB 级首屏、总量约十几 MB 量级（数字随版本变） |

**重要：** 这是 **authored + 压缩管线**，不是「运行时生成一整颗程序化星球城市」。

### 1.8 与「逆向文」的边界

`blog.mushroom.cv` 等文有用（pmndrs/postprocessing、InstancedMesh、WS 架构），但其中部分断言（例如「Svelte 5 UI」「BackSide 膨胀描边 = 原版」）与官方「自定义描边 / WASM UI」不完全一致。  
**以 Awwwards/CommArts + 本地 bundle 现象为准**；博客当启发，不当圣旨。

---

## 2. GitHub 相关项目清单

本地根：`research/messenger-ecosystem/`（shallow clone，约 2026-07-23）。

| 名 | URL | 本地路径 | ★ | 结论（一句话） |
|----|-----|----------|--:|----------------|
| messenger-copy | https://github.com/arafays/messenger-copy | `…/arafays-messenger-copy` | 62 | **最佳开源 RE 工作区**：SvelteKit + 移植 GLSL（surfaceId / LUT / 深度描边）+ Draco；代码 MIT，参考资产属 abeto |
| messenger (promptwhisper) | https://github.com/promptwhisper/messenger | `…/promptwhisper-messenger` | 5 | R3F 可玩学习作；加载 present 星球 `full_*.drc` + `hitmesh_*.drc` + toon atlas；**含大量专有几何** |
| messager | https://github.com/Glowin/messager | `…/Glowin-messager` | 2 | **最干净的可玩克隆**：全程序化 box/cone 城镇 + 任务；MeshToon + OutlineEffect；可放心学结构 |
| tiny-planet-messenger | https://github.com/Cronicweb/tiny-planet-messenger | `…/Cronicweb-tiny-planet-messenger` | 0 | 单仓 JS 程序化球+区域装饰+简易联机；和我们理念近 |
| tiny-planet-messenger | https://github.com/Cronicweb168/tiny-planet-messenger | `…/Cronicweb168-…` | 0 | **空仓** |
| tiny-planet-messenger-play | https://github.com/amazingsyp/tiny-planet-messenger-play | `…/amazingsyp-…` | 0 | 静态打包的 Courier Town 演示，非 abeto 资源镜像 |
| messenger-baby | https://github.com/akiroselin/messenger-baby | `…/akiroselin-messenger-baby` | 0 | 单文件 flat + round 迷你克隆；教学用 |
| waddle-post | https://github.com/TomClive/waddle-post | `…/TomClive-waddle-post` | 0 | 程序化生物群落 icosphere + 企鹅送信；灵感向 |
| quiet-orbit | https://github.com/jeiel85/quiet-orbit | `…/jeiel85-quiet-orbit` | 0 | R3F 安静小行星；文案原创，非 mesh dump |
| bharat-runner | https://github.com/Yuvraj-Akim/bharat-runner | `…/Yuvraj-Akim-bharat-runner` | 0 | Vue+Three 球面 + Java 联机；灵感向，体量大 |
| messenger.abeto | https://github.com/Kilganon725/messenger.abeto | `…/Kilganon725-messenger.abeto` | 0 | **原站静态镜像**（243 drc 等）；逆向对照用 |
| messenger-local | https://github.com/abderrahim-lectures/messenger-local | `…/abderrahim-lectures-messenger-local` | 0 | 离线可跑原版前端（掐 WS）；**专有资产全集** |
| messenger | https://github.com/jinjun1994/messenger | `…/jinjun1994-messenger` | 0 | 薄壳 + 部分原资产 |
| messenger | https://github.com/666hanrui/messenger | `…/666hanrui-messenger` | 2 | 参考快照 + 分析文档意图（本机可能为 sparse） |
| planetwood | https://github.com/anubhavaanand/planetwood | `…/anubhavaanand-planetwood` | 0 | 基于原版 DRC/动画解码的联机重建笔记与工程；**资产敏感** |
| Messenger-Abeto | https://github.com/Itsagar086/Messenger-Abeto | `…/Itsagar086-…` | 0 | **空仓** |
| webgl-outlines | https://github.com/OmarShehata/webgl-outlines | `…/OmarShehata-webgl-outlines` | 415 | 后处理描边教科书（depth/normal） |
| ghibli-style-shader | https://github.com/craftzdog/ghibli-style-shader | `…/craftzdog-ghibli-style-shader` | 185 | 吉卜力向 toon 参考 |
| galaxy | https://github.com/hlorenzi/galaxy | `…/hlorenzi-galaxy` | 53 | 轨道重力行走参考 |
| r3f VAT | https://github.com/mikelyndon/r3f-webgl-vertex-animation-textures | `…/mikelyndon-r3f-vat` | 8 | VAT 实现参考（原版角色动画同类技术） |

**搜索噪声：** GitHub 上大量 `messenger-copy` / `messenger-clone` 是 **Facebook Messenger 聊天 App**，与 abeto 无关。有效关键词：`messenger.abeto`、`abeto`、`tiny planet messenger`、`spherical-planet delivery`。

**克隆失败 / 空仓：** `Itsagar086/Messenger-Abeto`、`Cronicweb168/tiny-planet-messenger` 为空。`666hanrui/messenger` 全量过大时用了 sparse checkout，以 README 与 analysis 意图为准。

---

## 3. 各项目技术拆解

### 3.1 原版 abeto Messenger（专有）

| 维度 | 内容 |
|------|------|
| 栈 | Three.js + bvh + JS + C++/WASM；建模 Houdini/Blender |
| 生成 vs 资产 | **手作 unwrapped-cube 星球**；植被半自动；非 PCG 整城 |
| 角色 | 定制模 + VAT/骨骼 + 2D 脸；换装 drip 更新 |
| 星球行走 | 真表面 + BVH；中心重力 |
| PostFX | 自定义描边 + 风格化着色 + 性能向 LOD/压缩 |
| 与原版接近度 | 100%（本体） |

### 3.2 arafays/messenger-copy — 学习重建 / 着色器 RE

| 维度 | 内容 |
|------|------|
| 栈 | SvelteKit 2 / Svelte 5、Three r184、TS、脚本拉参考资源 |
| 资产 | `reference/` + 下载脚本；**Draco 地形/水/树/NPC**；**勿当自有资产** |
| 着色 | `terrainMaterial.glsl.ts`：`surfaceId` / `elementId`、16 色 atlas（`tColors`）、triplanar noise、草 mask；`postProcessing.glsl.ts`：**深度边** + **strip LUT** |
| 场景 | Intro / Gameplay / NPC gallery 模式 |
| 接近度 | 渲染语义 **高**；完整玩法/联机 **低** |
| 可偷 | surface-ID 通道设计、分 batch Draco、LUT 描边合成方式（自己重写，不抄资产） |

### 3.3 promptwhisper/messenger — R3F 可玩学习作

| 维度 | 内容 |
|------|------|
| 栈 | Next 16、R3F、postprocessing、TS |
| 世界 | `planets/present/full_0..9.drc` 可视 + `hitmesh_*.drc` 碰撞 |
| 角色 | MeshToon + atlas；NPC 路径；衣柜 UI |
| 描边 | 自定义 `OutlineEdge`（深度 + 法线，pmndrs Effect） |
| 接近度 | 氛围/交互 **中高**（依赖原几何时视觉接近）；代码是独立 runtime |
| 可偷 | hitmesh 与 beauty mesh 分离；R3F 资源加载分层 |
| 风险 | `public` 内大量 **第三方专有 mesh** |

### 3.4 Glowin/messager — 干净程序化克隆 ⭐ 程序化建筑

| 维度 | 内容 |
|------|------|
| 栈 | Vite + TS + Three ~0.161 + Howler |
| 世界 | `IcosahedronGeometry` 行星；`regions.ts` **手写工厂**：`createHouse`（box+cone roof）、tree、road、fountain、bench、cliff house… |
| 角色 |  primitive 人体 或 GLB；**程序化 idle/walk** |
| 画风 | `MeshToonMaterial` + gradientMap + **`OutlineEffect`**（非后处理 ID） |
| 玩法 | 5 NPC / 5 任务状态机 / 对话 HUD |
| 行走 | 玩家 `rotateOnAxis` 球面移动；相机 `up = surfaceNormal` |
| 接近度 | 玩法骨架 **中**；视觉密度 **低**（诚实 low-poly） |
| 可偷 | **区域工厂 + 地标任务绑定**；模块边界清晰（main 组装）——与我们 `world.js` 高度同构 |

### 3.5 Cronicweb/tiny-planet-messenger

| 维度 | 内容 |
|------|------|
| 栈 | 原生 JS + Three CDN；可选 `server.js` |
| 世界 | 噪声位移 icosphere + 区域色；`decorateRegions` 程序化房子/柱/墓碑等 |
| 角色 | 程序化人体 + 描边（BackSide 膨胀式 `addOutline`） |
| 接近度 | 中低；是「同品类小游戏」 |
| 可偷 | 单文件可读的区域装饰循环；球面 `placeOnSurface` |

### 3.6 TomClive/waddle-post

| 维度 | 内容 |
|------|------|
| 栈 | **单 HTML** + Three CDN |
| 世界 | 噪声 icosphere **顶点色 biome**（海/滩/草/山/雪）+ 程序化小屋 |
| 角色 | 企鹅 box 人 |
| 接近度 | 灵感向（自承 Messenger-inspired） |
| 可偷 | biome 顶点色管线；日夜与窗户亮灯小技巧 |

### 3.7 akiroselin/messenger-baby

单文件 flat island + round chibi；MeshLambert；零构建。适合「最小可玩球面」教学，建筑极简。

### 3.8 Yuvraj-Akim/bharat-runner

Vue3 + Three 前端 + Java 后端 Docker。自有 `PlanetGeometry`、道路网、POI、昼夜、载具任务。是 **球面 MMO 骨架**，画风与 abeto 不同；可看联机与世界系统分层，勿期待 cel 小镇。

### 3.9 jeiel85/quiet-orbit

Next + R3F「安静散步捡光点」；明确不写原站文案。独立小品。

### 3.10 原站镜像族（Kilganon / abderrahim / jinjun / 666hanrui / planetwood）

| 维度 | 内容 |
|------|------|
| 本质 | **再打包的专有构建** 或 基于其资产的二次工程 |
| 用途 | Network tab 对照、模块名、`.drc` 目录结构、WS 是否剥离 |
| 禁止 | 把 mesh/贴图/音频拷进本产品；二次上传镜像 |
| planetwood | 文档写明从原版解动画、Blender/HAR；研究价值高、版权风险也高 |

### 3.11 技法参考仓（非 Messenger 克隆）

| 仓 | 用途 |
|----|------|
| OmarShehata/webgl-outlines | 后处理描边实现细节 → 对齐我们 `postfx.js` / surface-ID 升级 |
| craftzdog/ghibli-style-shader | 水彩/toon 调色参考 |
| hlorenzi/galaxy | 轨道重力与相机 up 向量 |
| mikelyndon/r3f-vat | 若未来不用 VRM、改 VAT 角色时可直接对照 |

### 3.12 本仓库（对照）

| 维度 | 内容 |
|------|------|
| 栈 | Vite + three + `@pixiv/three-vrm` + simplex-noise + 自研 postfx |
| 世界 | 噪声球 + **程序化 90s 小镇 massing**（`src/world.js`）+ 可选 Quaternius GLB 模板 |
| 角色 | VRM + Mixamo；内容管线 `src/content` / `src/entities` |
| 行走 | **人不动、球转**（廉价版） |
| 画风 | Toon + 法线/深度描边 + posterize/dither |
| 接近度 | ~40% 抛光（见 HOW_IT_WORKS）；**程序化建筑路径已经比多数克隆更深** |

---

## 4. 对我们项目的启示（可执行）

> 用户偏好：**程序化建筑**，讨厌纯 GLB 堆城。下列只列 actionable。

### 4.1 世界观：不要幻想「原版是 PCG 出楼」

- 原版密度来自 **展开立方体手作 + LOD/压缩**。  
- 我们要密度，应走：  
  1. **规则化 massing**（已有：plinth、窗框、雨棚、坡顶…）  
  2. **声明式布局**（`layouts` / catalog，已有 CONTENT_PIPELINE）  
  3. **模块变体 + 种子**（同类型楼随机开间/层数/色，而不是随机扔 box）  
  4. 需要「英雄建筑」时再 **单栋 GLB**，而不是整城 GLB。

### 4.2 从 Glowin / Cronicweb 可直接借鉴的代码级模式

1. **`createX()` 工厂 + `userData.landmark / questTarget`**  
   - 地标与任务 ID 绑在 Group 上，便于交互与调试。  
2. **区域表驱动装饰**（neighborhood / plaza / beach）  
   - 平面 DoD 阶段用同样结构；包球时只换 `plantOnPlanet`。  
3. **球面放置四元数**  
   - `setFromUnitVectors(up, normal)`；Glowin 用玩家绕轴转，我们用球转——两种都保留，交互层统一「局部 forward」。  

### 4.3 从原版 / arafays 可借鉴的渲染语义（自己实现）

1. **Color atlas（16×16 或 32×32）**  
   - 程序化建筑材质不要每人一个 hex；改采样 atlas UV → 统一调 mood。  
2. **surface-ID 写入 G-buffer 或顶点色**  
   - 描边从「纯深度拉普拉斯」升级到 **物体边界不糊在连续墙面上**（HOW_IT_WORKS 已点名差距）。  
3. **beauty mesh ≠ hit mesh**  
   - 程序化建筑可生成简化 collision box 组，供未来 BVH/射线；渲染 mesh 保持细节。  
4. **植被 blob → 近距替换**  
   - 远：实例化 icosphere canopy；近：加枝杈/草片——比加载森林 GLB 便宜。  

### 4.4 角色路线（坚持 VRM 捷径时）

- 不要为了「更像 Messenger」去扒 VAT `.drc`。  
- 可做的「原版味道」：  
  - **2D 脸层**（表情 sprite，可选）  
  - Mixamo 步态质量（已在做）  
  - 换装若做：分 mesh drip 加载，避免单帧卡顿  

### 4.5 星球行走（可选升级路径）

| 阶段 | 做法 |
|------|------|
| 现在 | 球转 + 顶采样（稳、实现简单） |
| 中期 | 平面城镇 DoD 完成后再 `plantOnPlanet`（已有纪律） |
| 远期 | 对合成 mesh 建 `three-mesh-bvh`，角色真贴地（对标原版） |

### 4.6 明确不要做的事

- 把 `Kilganon*` / `abderrahim*` / `promptwhisper` 的 `.drc`/`.ktx2` 拷进本仓 `public/`。  
- 以「复刻联机 10 人房」为短期目标（原版自研后端 + 产品选择）。  
- 用整城 GLB 替换已有程序化 massing（与项目方向相反）。  

### 4.7 建议的近期 backlog（按性价比）

1. **建筑：atlas 色 + 种子变体 API**（`createResidence(seed)` 返回稳定随机）。  
2. **布局：区域 JSON**（类型、朝向、间距规则），禁止中心堆砌（`world.js` 已有注释纪律，固化成数据）。  
3. **描边：surface-ID 或 object-ID 预通道**（参考 OmarShehata + arafays）。  
4. **性能：同类程序化建筑 InstancedMesh 或 merge**（原版/博客共识）。  
5. **文档：在 HOW_IT_WORKS 链到本文**，避免再开一轮全站逆向。  

---

## 5. 本地 `research/messenger-ecosystem/` 目录说明

- **路径：** `/Users/nemo/Documents/personal/threejs/research/messenger-ecosystem/`  
- **策略：** `git clone --depth 1`；大仓必要时 sparse。  
- **忽略：** 根目录 `.gitignore` 已含 `/research/messenger-ecosystem/`。  
- **索引：** 该目录内 [`README.md`](../research/messenger-ecosystem/README.md) 含完整 provenance 表。  
- **体积量级（约）：** 程序化克隆十余 MB；镜像与 planetwood / VAT demo 可达 **百 MB～近 400MB**。  
- **空仓：** `Itsagar086-Messenger-Abeto`、`Cronicweb168-tiny-planet-messenger`。  

### 推荐阅读顺序（本地）

1. `Glowin-messager/src/regions.ts` + `world.ts` + `cel-material.ts`  
2. `arafays-messenger-copy/src/lib/messenger/shaders/*.glsl.ts`  
3. `promptwhisper-messenger/src/components/r3f/PresentScene.tsx` + `OutlineEdge.tsx`（只看结构，慎用资产）  
4. `OmarShehata-webgl-outlines`  
5. 需要对照原版目录时再打开 `Kilganon725-messenger.abeto/assets` 或 `abderrahim-lectures-messenger-local/public/assets`（**只读**）  

---

## 6. 法律与署名

| 对象 | 说明 |
|------|------|
| Messenger / abeto | 视觉、音频、模型、原版着色器与品牌 © 权利人。案例研究可引用链接与技术事实；**不可复制资产做产品**。 |
| 镜像类 GitHub 仓 | 多为未授权再分发风险；本调研 **克隆仅供个人学习**，不背书其合法性。 |
| MIT 学习仓代码 | 可学习架构与自写实现；其目录内 **reference 资产仍属原作者**。 |
| 本仓库 | 继续使用自有/CC0（如 Quaternius）+ VRM 占位；credits 见根 `README.md`。 |
| 音乐等 | Kevin Colombin 等原声归属原版；克隆仓占位音效各自说明。 |

**署名建议（若对外演示「受 Messenger 启发」）：**  
“Visual direction inspired by Messenger by [abeto](https://abeto.co/) — not affiliated; no original assets used.”

---

## 7. 参考链接

- https://messenger.abeto.co/  
- https://www.awwwards.com/messenger.html  
- https://www.commarts.com/webpicks/messenger  
- https://80.lv/articles/deliver-mail-on-tiny-colorful-planet-in-this-relaxing-web-game  
- https://blog.mushroom.cv/blog/how-to-develop-webgl-3d-game-threejs-complete-guide/  
- 本仓：`docs/HOW_IT_WORKS.zh.md`、`docs/CONTENT_PIPELINE.zh.md`、`docs/SCENE_SPEC_LOVE_AND_DEEPSPACE.zh.md`  

---

*本报告区分：官方自述 · 社区逆向 · 干净重写 · 专有镜像。若与运行中的原站行为冲突，以原站与 Awwwards 为准。*
