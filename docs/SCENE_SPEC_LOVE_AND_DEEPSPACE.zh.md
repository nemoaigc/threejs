# 恋与深空主题 · 场景规格书（平面优先）

> 施工单 / 资产与布局规格。画风对齐本项目 **cel + 描边 + 色阶**（Messenger 味），主题借用临空市叙事与地标，**不是**原作写实电影管线 1:1 复刻。  
> 关联实现：`src/world.js`（`populateTown` / `plantOnFlat` / `plantOnPlanet` / sole@y=0）、`src/vrm-character.js`（VRM + Mixamo）、`docs/HOW_IT_WORKS.zh.md`、`README.md` Gap。

---

## 1. 一句话场景命题

**临空市某一角的「猎人日常切片」**——十字主街 + 猎人协会门脸 + 医院剪影 + 猫咖小店，不是整座开放世界，更不是小行星上的 90 年代小镇医院/学校复刻。

叙事钩子（玩家 3 秒内应感到）：*有 Evol 的现代都市、猎人出任务前的日常路口、温柔又略科幻的日常氛围。*

---

## 2. 明确不做

| 不做 | 原因 |
|------|------|
| 写实皮肤 / 电影级 PBR / SSS | 管线是 cel+outline+posterize，写实会打架 |
| 整城开放世界 / 多区无缝传送 | 切片 demo，内容预算有限 |
| 五男主完整高模 + 约会系统 | 非本 demo 范围；NPC 最多 0–3 个剪影级 |
| **现在就做星球 / 包球玩法** | 平面 DoD 通过后再接同一套布局 + plant 适配器 |
| 联机、邮件玩法、多生态生物群 | abeto 内容量，本阶段不对齐 |
| 随机密铺、全贴 (0,0)、同体量盒子冒充医院 | 布局混乱的历史病，本规格硬禁止 |
| 原作 UI/Logo 未授权商用素材堆砌 | 可用「联想色 + 体块语义」，避免侵权级复制 |
| 高面数「堆面当精致」 | 见 §8；Messenger 精致 ≠ 面数 |

---

## 3. 英雄镜头（Hero shot）

### 3.1 固定主视角（唯一验收机位）

- **站位**：十字路口广场中心偏南约 **(0, 0, 6)**，角色朝北（−Z）。
- **相机**（建议默认）：眼高约 1.4–1.6m（相对角色），略俯 8°–12°，看向 **(0, 2.5, −8)** 一带。
- **剪影层次（近 → 远）**：
  1. **近**：马路斑马线 / 广场铺装 + 路灯；可选 1 个公交站亭。
  2. **中左**：猎人协会门脸（竖条旗 / 门廊 / 协会色块）。
  3. **中右**：猫咖小店（条纹雨棚 + 招牌猫耳剪影）。
  4. **中轴远端**：阿克索式医院（白体 + 红十字 + 横向长窗，体量明显大于商店）。
  5. **远景带**：2–4 栋天际线剪影塔楼（低模、无交互），颜色偏冷青 / 淡紫黄昏。
  6. **天空**：干净渐变 + 少量云；傍晚或晴午前均可，**全场景统一一时段**。

### 3.2 验收标准

路人（未玩过恋与深空也可）看静帧 **3 秒内** 能说出至少一个关键词：

- 「猎人 / 协会 / 都市少女」或  
- 「医院 + 咖啡店的现代街角」或  
- 「二次元城市日常」  

**不合格**：只能说出「一堆一样的方盒子」「中间一坨建筑」「不知道是什么主题」。

---

## 4. 空间布局纪律（防混乱核心）

### 4.1 用地功能分区（最多 4 区）

| 区 ID | 名称 | 功能 | 大致范围（平面米，原点=十字中心） |
|-------|------|------|----------------------------------|
| A | **主街** | 东西向可走主干 + 沿街店面（P0 仅 2–4 个有辨识度的店） | \|z\| ≤ 8，\|x\| ≤ 28 |
| B | **广场** | 英雄镜头落脚、路灯、短停留点、可选告示板 | 中心广场约 14×14，可玩核心 |
| C | **公共地标** | 协会、医院、（P1）塔楼基座 | 协会西/西北；医院东北；不互相贴脸 |
| D | **居住远景** | 低密公寓/坡顶民居剪影，只填天际，不进可玩逻辑 | 半径 22–40m 环带，密度低 |

禁止第 5 区（工厂/学校/邮局整包迁入）在平面 P0 出现；旧 `populateTown` 的 90s 小镇类型仅作几何参考，**叙事上退役**。

### 4.2 推荐尺寸

| 项 | 规格 |
|----|------|
| 主可玩区边长 | **约 56–64 m**（建议半宽 maxR ≈ 28–32；与现 `maxR: 30` 星球裁剪同量级） |
| 主干道宽度 | **5.0–5.5 m**（现代码约 5.2–5.5） |
| 次干/巷 | **3.2–3.6 m** |
| 建筑间距（侧墙到侧墙） | 地标彼此 **≥ 6 m**；沿街店面 **≥ 3.5 m**（含 0.5–1m 呼吸缝） |
| 退道路红线 | 建筑前脸距路缘 **≥ 2.0 m**（人行带） |
| 最大地标数（P0） | **5–8** 栋「一眼能叫出名字」的体块；填充盒 ≤ 6；远景剪影 ≤ 8 |
| 布局半径上限（平面 authoring） | **\|pos\| ≤ 36 m** 优先；超过 40m 仅远景且不进交互 |
| 广场 | 中心 **12–14 m** 边长铺装，**禁止**在广场中心种大楼 |

### 4.3 硬性禁止

1. **禁止随机密铺**（`scatterAround` 大密度铺建筑）；填充物用声明式环带或稀疏表。  
2. **禁止全部贴 (0,0)** 或全部挤在 \|x\|,\|z\| < 8。  
3. **禁止体量相同的「商店盒子」冒充医院/协会**——高度档位、开窗节奏、屋顶符号必须不同。  
4. **禁止单块超长马路 mesh**（星球阶段会炸 sole 曲率）；马路必须 **分段 tile**（见现 `plantRoadLine` / `createRoadTile` 约定）。  
5. **禁止**为「显得热闹」复制 50 栋无差别建筑。

### 4.4 声明式布局数据（先表后生成）

所有可放置物（建筑 / 路灯 / 关键 / 远景塔）最终应来自一张表，再 `plant(obj, x, z, yaw, scale)`：

```ts
type Placeable = {
  id: string;           // 稳定 ID，如 landmark.hunter_hq
  type: string;         // 工厂键：hunterHq | hospital | cafe | shop | aptSilhouette | prop.light ...
  x: number;            // 平面米，sole 投影中心
  z: number;
  yaw: number;          // 弧度，绕 +Y
  footprintWxD: [number, number]; // 占地宽×深（米），用于间距校验与曲线 bury
  heightHint: 'S' | 'M' | 'L' | 'XL';
  zone: 'A' | 'B' | 'C' | 'D';
  priority: 'P0' | 'P1' | 'P2';
};
```

**生成顺序建议**：道路 tile → 广场 → P0 地标 → P0 沿街 → 路灯/小品 → D 区剪影。  
**校验脚本（后续可写，非本阶段必须改 src）**：两两 footprint AABB 间距；中心禁止建筑；高度档与 type 白名单。

### 4.5 为包球预留（现在不做球）

与现 `src/world.js` 契约对齐，**平面阶段就必须遵守**，避免二次返工：

| 约定 | 说明 |
|------|------|
| **sole @ local y = 0** | 地基底面在局部原点高度；`+Y` 朝上 |
| **footprint 以 XZ≈0 为中心** | 便于 `plantOnPlanet` 的 halfW / `curveBury` |
| **布局半径上限** | authoring \|r\| 建议 ≤ 36；星球模式 `maxR` 再裁（现 30） |
| **马路分段** | 长直路 = 多段 `createRoadTile`；禁止 90m 整板（平面可临时整板，但 **数据层仍按 segment 声明**，便于切换 `populateRoads`） |
| **同一套 Placeable 表** | `makePlant(group, 'flat' \| 'planet')` 只换适配器，不换坐标语义 |
| **缩放** | 平面 1 unit ≈ 1 m；星球用现有 `TOWN_PROP_SCALE` / `TOWN_FLAT_TO_ARC` 映射，资产不必为球单独建模 |

接口心智模型：

```
Placeable[]  →  buildByType(type)  →  mesh(sole@0)  →  plantOnFlat | plantOnPlanet
```

---

## 5. 建筑清单（P0 / P1 / P2）

高度档：`S`≈3–6m · `M`≈6–12m · `L`≈12–22m · `XL`≈22m+（剪影用）。  
面数 = **三角形数量级**（单栋 draw 前合并前估算）。

### 5.1 P0（撑起英雄镜头，5–8 地标级）

#### 1) 猎人协会分部门脸 — `landmark.hunter_hq`

| 项 | 规格 |
|----|------|
| 叙事 | 猎人日常出发点；联想「猎人协会 / Evol 编制」 |
| 体量 | 占地 **10×8 m**，高度 **L**（约 14–18m，3–5 层感） |
| 辨识特征 | 对称门廊或双柱入口；竖向旗帜/条带（青蓝+白）；顶层轻微「通讯碟/折角檐」小符号；**绝不能**做成红十字医院或条纹雨棚店 |
| 几何 | **程序化优先**（体块 + 门廊 + 旗）；P1 可换带手绘 albedo 的低模 GLB |
| 面数预算 | **800–2k** tris（窗可用贴图/少量 plane，勿每格真挤出） |
| 材质锁 | 主墙 `#5B7C99`–`#7A9BB8`；强调条 `#E8F0FF`；金属檐暗青；玻璃 `#8EB8D0` toon；**无**强 PBR 反射 |

#### 2) 阿克索式市立医院 — `landmark.hospital`

| 项 | 规格 |
|----|------|
| 叙事 | 都市医疗地标（原作 Akso 联想）；英雄镜头远端锚点 |
| 体量 | 占地 **16×10 m**，高度 **L–XL 下限**（约 16–22m，明显大于店） |
| 辨识特征 | **白色/暖白体块** + 醒目 **红十字**；密横条窗或幕墙分格；入口雨棚水平长条；体量横向展开 |
| 几何 | 程序化（已有 `createHospital` / `addRedCross` 可迁语义改比例与配色） |
| 面数 | **1k–2.5k** |
| 材质锁 | 墙 `#F2F0EA`；十字 `#D94A3D`；窗玻璃偏冷；禁止棕坡顶「民居医院」 |

#### 3) 猫咖 / Meow 式咖啡店 — `landmark.cafe_meow`

| 项 | 规格 |
|----|------|
| 叙事 | 轻松日常、约会感地标（Meow’s Café 联想） |
| 体量 | 占地 **6×5 m**，高度 **S–M**（约 5–7m，2 层） |
| 辨识特征 | **条纹雨棚**；圆角橱窗；招牌「猫耳」剪影或爪印平面符号；暖黄室内光块（toon emissive 轻） |
| 几何 | 程序化（雨棚可复用 `addStripedAwning` 思路） |
| 面数 | **400–800** |
| 材质锁 | 墙奶油 `#F5E6D3`；雨棚粉/白或薄荷/白；木色门 `#8B5E3C`；禁止医院白+红十字 |

#### 4) 十字广场 + 短纪念装置 — `plaza.core` + `prop.obelisk_or_core`

| 项 | 规格 |
|----|------|
| 叙事 | 「城市中心的小停顿」；可轻微科幻（原核/碑的极简联想），**不要**大怪物 |
| 体量 | 广场铺装 12–14m；装置占地 **≤ 2×2 m**，高 **S**（3–5m） |
| 辨识 | 中心留空可走；装置在广场 **偏一侧** 或北缘，避免挡英雄中轴医院 |
| 几何 | 程序化 |
| 面数 | 铺装 plane 可 `noOutline`；装置 **200–500** |
| 材质 | 铺装暖灰 `#C9C2B4`；装置浅青发光条（低强度） |

#### 5) 公交站亭 ×1–2 — `prop.bus_stop`

| 项 | 规格 |
|----|------|
| 叙事 | 日常通勤切片 |
| 体量 | **3×1.2 m**，高 **S** |
| 辨识 | 顶棚 + 站牌竖板；沿人行带 |
| 几何 | 程序化（现有 `createBusStop` 可换皮） |
| 面数 | **150–300** |
| 材质 | 金属灰 + 半透玻璃板 |

#### 6) 沿街特色小店 ×2（非医院）— `shop.boutique` / `shop.convenience`

| 项 | 规格 |
|----|------|
| 叙事 | 主街生活感，衬托地标，**不得抢戏** |
| 体量 | 各 **4×4 m**，高 **S–M**（4–6m） |
| 辨识 | 不同雨棚色/竖招；橱窗比例与猫咖区分 |
| 几何 | 程序化 |
| 面数 | 各 **300–600** |
| 材质 | 饱和中等、避开协会蓝与医院白主色 |

#### 7) 天际线剪影塔 ×2–3 — `skyline.tower_a/b/c`

| 项 | 规格 |
|----|------|
| 叙事 | 「重建后的临空」都市感（Universum/CBD 联想，仅剪影） |
| 体量 | 占地各 **6×6–8×8 m**，高 **XL**（28–40m 视觉，可扁平盒子拉高） |
| 辨识 | 不同顶部折角/天线；**无**可进门细节 |
| 几何 | 程序化极简 **或** 单材质 GLB 低模 |
| 面数 | 各 **80–250**（远景） |
| 材质 | 冷灰青 `#6A7A8C`，略压暗；可共用材质 + 实例化 |

#### 8)（可选 P0 收尾）猎人告示板 / 全息柱 — `prop.hunter_board`

| 项 | 规格 |
|----|------|
| 体量 | 1×0.4 m，高 2.2m |
| 面数 | **100–200** |
| 用途 | 主题关键词补强（「任务」「协会」色） |

**P0 地标数量控制**：上表 1–7 为核心；填充店 ≤2；**合计「能叫出名字」的 ≤8**。

---

### 5.2 P1（平面加深，不破坏分区）

| id | 名称 | 叙事 | 体量 | 辨识 | 几何 | 面数 | 备注 |
|----|------|------|------|------|------|------|------|
| `landmark.dispatch` | 猎人调度/救援点 | 协会配套 | 8×6，M | 天线+车库门洞 | 程序化 | 600–1.2k | 放协会侧院，勿占广场 |
| `shop.bookstore` | 街角书店 | 生活气 | 5×5，S | 竖条窗+暖灯 | 程序化 | 400–700 | 主街尾 |
| `apt.mid_1` | 中层公寓一栋 | 居住区可读 | 12×8，L | 阳台横条 | 程序化改 `createApartment` | 800–1.5k | 仅 D 区靠内一栋 |
| `prop.phone` / 路灯组 | 小品 | 节奏 | — | 成组 6–10 | 程序化 | 80–150/个 | 沿路声明式，禁 scatter 建筑 |
| `skyline+2` | 远景+2 | 天际完整 | XL | 更矮错落 | 低模 | 80–200 | 仍 \|r\| 环带 |

### 5.3 P2（有余力 / 星球后内容）

| id | 名称 | 说明 |
|----|------|------|
| `district.bloomshore_hint` | 旧区坡顶带 | Bloomshore「时间停驻」联想，低矮坡顶 3–5 栋，远距 |
| `bay.whitesand_hint` | 一条沙滩色边缘 | 仅平面地图一角换地面色带，不做真海玩法 |
| `interior.fake` | 协会门口玻璃内景卡 | 一张 toon 贴图，不进真室内 |
| 手绘 GLB 地标套件 | 协会/猫咖换真模 | 见 §8 何时上 GLB |
| 第二时段灯光 | 夜景 neon | 后处理与自发光预算另开 |

---

### 5.4 旧资产迁移关系（90s 小镇 → 临空切片）

| 旧类型（现 world.js） | 临空阶段 |
|----------------------|----------|
| `createSchool` | P0 **移除出英雄镜头**；勿占中轴 |
| `createHospital` | **保留体块语义 → 改比例/配色为 Akso 向** |
| `createPostOffice` / `createFactory` / `createWaterTower` | P0 不用；P2 前勿默认生成 |
| `createShop` 行 | 减量，改为声明式 2–4 个特色店 |
| `createResidence` / gltfHouse scatter | 改为 D 区稀疏剪影，禁密铺 |
| 十字路 + plaza | **保留骨架**，换两侧内容 |

---

## 6. 人物清单

### 6.1 玩家 / 可操作角色（1 人）— 猎人

| 项 | 规格 |
|----|------|
| 用途 | 唯一移动主体；英雄镜头中的尺度参照 |
| 模型 | **1 个 VRM**（VRoid 向）：短发或束发优先（减 spring 翻车）；常服偏「行动外套 + 靴子」，色锁定青黑/白，避免大红披风遮描边 |
| VRM 能做到 | MToon 卡通、人型骨骼、表情/LookAt 可选、spring bone（慎用） |
| VRM 难完美 | abeto 级手绘脸、VAT 顶点动画、非人型生物、电影级布料 |
| 是否独立模型 | **是**，`public/character.vrm` 占位可换皮 |
| 动画 | idle + walk 必须；gesture 可选（见 §7） |

### 6.2 NPC（0–3，平面阶段宁少勿滥）

| id | 角色 | 用途 | 独立模型？ | 动画 |
|----|------|------|------------|------|
| `npc.none`（推荐开局） | — | 零 NPC，先过布局与地标 | — | — |
| `npc.passerby_a` | 路人剪影 | 主街一侧站立，增加人气 | 可与玩家同 VRM 换色 **或** 极简胶囊人 toon | 静态 T 改 idle hang 或单 clip idle |
| `npc.cafe_staff` | 猫咖门口 | 强化猫咖 | 低模半身/全身简易 | 静态 |
| `npc.hunter_peer` | 协会台阶 | 主题补强「猎人」 | 简易 VRM 或低模 | idle only |

**明确不做（P0–P1）**：沈星回 / 秦彻 / 祁煜 / 夏以昼 / 黎深等完整五人卡池、恋爱互动、高精度脸模。

### 6.3 每个角色字段（施工用）

```
id, role, modelSource (vrm|proc|glb), lod (hero|near|silhouette),
anims[], springPolicy (off|stiff|default), notes
```

---

## 7. 动作规格

### 7.1 当前技术路径：Mixamo + VRM

| 利 | 弊 |
|----|-----|
| 走路比纯正弦自然（现 `walking.fbx` + `loadMixamoAnimation`） | 重定向依赖人形骨骼质量；手臂/肩可能漂移 |
| 迭代快、素材多 | Mixamo 偏写实步态，与 MToon 角色需调 weight |
| 与 `AnimationMixer` 权重混合 idle/walk 清晰 | idle 在 weight=0 时易回到 **T-pose** → 必须强制 hang（现已有逻辑） |
| | 手指/表情/布料不在 Mixamo 里 |

对照 abeto：真绑骨 + VAT/Draco 动画 + 2D 脸；我们是 **捷径管线**，目标是「手臂自然、步态可读」，不是动捕片场。

### 7.2 最低可验收动作集（平面阶段）

| 状态 | 要求 | 验收 |
|------|------|------|
| **idle** | 双臂自然下垂、微肘曲；脊柱稳定；无 T-pose | 静站截图手臂贴身侧下方 |
| **walk** | 循环步态；手臂随走摆动；落地无滑步过度 | 移动 3 秒循环无断肢感 |
| **过渡** | idle↔walk 权重 0.15–0.3s 级平滑 | 无手臂抽搐 |
| **gesture（可选 P1）** | 1 个挥手或看手机（上半身 overlay） | 不打断走；可延后 |
| **表情** | 可选 blink 1 个 | 非 blocker |

### 7.3 头发 / 布料 spring 策略

- **平面 P0 建议：极硬或关**（现 `dampSpringBones`：提高 stiffness、高 drag、低 gravity —— 保持或再硬）。  
- 长发披肩、宽松外套 spring：**默认关**，等 idle 手臂稳定后再开。  
- 验收时若头发插入身体或爆炸：立刻 `stiff` / reset，不优先「更真」。

### 7.4 Blocker：手臂自然下垂

**「手臂自然下垂」= 发布级 blocker**，与主题地标同级优先级。

原因：VRM 绑定常为 T-pose；Mixamo weight=0 不写骨骼 → 必须 `buildIdleArmPose` + 在 `humanoid.update` 后再次 apply（见 `updateVRMCharacter`）。  
验收失败条件：静站举手、折臂向上、左右不对称超过明显穿模。

---

## 8. 精致度与面数考究（对照 Messenger）

### 8.1 必须纠正的认知

**面数 ≠ 精致。**

abeto Messenger 的精致来自：

1. **手绘 / 精心绘制的 albedo**（Substance 等）  
2. **清晰剪影**（设计过的外轮廓）  
3. **描边**（含 surface-ID 级边缘）  
4. **色阶 + 抖动** 的统一调色  
5. **资产压缩**（Draco / KTX2）与 **可控数量**  
6. WASM 等性能路径  

不是「每个角色 50 万面」。

本项目在 **程序化盒子 + MeshToon + 后处理描边** 时：

> **清晰体块 + 正确比例 + 主题符号（十字、雨棚、门廊） > 堆细分面。**

堆面会：加重视线负担（描边已是多 pass）、糊成一团、仍不像医院。

### 8.2 LOD / 实例化原则

| 距离带 | 策略 |
|--------|------|
| 近景（英雄 0–15m） | 可略多面；窗格/雨棚/旗可读；仍控制在预算内 |
| 中景（15–30m） | 合并窗为贴图或少 row；去掉内侧细节 |
| 远景（>30m 或 D 区） | **剪影低模** 80–250 tris；共享材质；可 `InstancedMesh` |
| 重复物（树、灯） | 实例化；树可用现有 glTF 低模 toonify |

### 8.3 全场景粗算 tri 预算（目标浏览器 60fps）

前提：outline 约 **3×** 场景成本（README）；`pixelRatio` cap、阴影 1024 级。

| 桶 | 预算（triangles，量级） |
|----|-------------------------|
| 地面 / 路（平面） | 2k–20k（大 plane 可极少） |
| P0 地标合计 | **8k–20k** |
| 填充店 + 小品 | 3k–8k |
| 远景剪影 | 1k–3k |
| 角色 VRM（通常已较高） | **15k–40k**（视 VRoid；勿再叠 3 个满配 VRM） |
| 树/石（若保留） | 5k–15k |
| **场景动态合计建议上限** | **~80k–120k** 可见 tris（不含后处理全屏） |
| 警告线 | 持续 >200k 动态 + 多 VRM spring → 掉帧风险高 |

星球模式另计地形 icosphere（现高细分），故 **平面阶段更应养成省面习惯**。

### 8.4 何时程序化足够 / 何时上真 GLB

| 用程序化 | 上 GLB（手模+手绘贴图） |
|----------|---------------------------|
| 体块语义清晰的医院/协会/店 | 英雄镜头主角色、主招牌需要手绘脏污/图案 |
| 远景塔、路灯、雨棚条 | 猫咖招牌插画、协会复杂门头 |
| 快速迭代布局 | 已锁定布局、需要「Messenger 级」单栋 polish |
| P0 全部地标第一轮 | P1 替换 1–2 栋英雄建筑 |

GLB 必须：**sole@0、居中 footprint、toonify 或 MToon、面数接近上表预算**。

---

## 9. 与 abeto Messenger / 本项目的对齐

### 9.1 保留（技术主轴）

- Cel（`MeshToonMaterial` / VRM MToon）  
- 墨线描边（法线+深度；远期可 surface-ID）  
- 色阶量化 + Bayer 抖动（`postfx`）  
- 平面 authoring + `plant` 适配器双模式  
- 性能纪律：控密度、控 shadow、控 pixelRatio  

### 9.2 内容迁移

| Messenger / 当前 demo | 临空主题切片 |
|----------------------|--------------|
| 小行星多生态、邮差叙事 | **暂缓**；先平面猎人日常 |
| 90s 北方小镇：学校/邮局/水塔/工厂 | **替换**为协会/医院/猫咖/天际线 |
| 十字路 + 广场骨架 | **保留**为布局纪律载体 |
| 程序化建筑 massing 思路 | **保留**，改符号与配色 |
| VRM 捷径角色 | **保留**，换猎人向外观 |
| 密集 scatter 民居 | **废除**为默认；改声明式 |

### 9.3 星球

- **满足平面 DoD（§10）后再做。**  
- 复用：同一 `Placeable[]` + `plantOnPlanet` + 马路分段 + sole 契约。  
- 不做：为球单独重做一套挤中心的随机城。

---

## 10. 施工顺序（2 周粒度）

### Week 1 — 布局纪律 + 英雄镜头骨架

- [x] **W1.1** 冻结 4 区地图纸（纸面或表）：十字 + 协会/医院/猫咖坐标  
  - 验收：俯视图标注间距，无中心堆叠  
  - 落地：`src/layouts/linkon-slice-p0.js`
- [x] **W1.2** 声明式 `Placeable[]`（可先写在文档/JSON，再接线）替换「随机密铺建筑」路径  
  - 验收：改表能挪医院，不必改生成算法核心  
  - 落地：`populateFromLayout` + `buildByType` in `src/world.js`
- [x] **W1.3** P0 地标程序化 1.0：协会、医院、猫咖体块 + 符号  
  - 验收：英雄机位静帧 3 秒能辨 3 栋  
- [x] **W1.4** 道路/广场：中心留空；主干宽度合格  
  - 验收：角色从南入广场不被建筑卡住  
- [x] **W1.5** 远景 2–3 塔剪影落在 D 环  
  - 验收：天际有高低，但不进可玩区抢碰撞  
- [ ] **W1.6** 角色 idle 手臂 blocker 回归  
  - 验收：静站截图双臂下垂  

### Week 2 — 主题可读 + 动作 + 预算

- [ ] **W2.1** 沿街 2 店 + 公交站 + 路灯声明式布置  
  - 验收：主街有节奏，无墙状建筑  
- [ ] **W2.2** 猎人向 VRM 换皮或配色锁定  
  - 验收：与协会/街色不撞成一团  
- [ ] **W2.3** walk/idle 权重与 hang 稳定；spring 极硬  
  - 验收：走停 10 次无 T-pose 闪现  
- [ ] **W2.4** 面数审计（Spector/统计或手工估）压进 §8.3  
  - 验收：中端机浏览器演示区稳定 ~60fps  
- [ ] **W2.5** 英雄镜头默认相机/出生点写进配置  
  - 验收：F5 刷新即英雄构图  
- [ ] **W2.6**（可选）0–1 个静态 NPC  
  - 验收：不挡路、不增第二个满配 VRM 除非已测帧率  
- [ ] **W2.7** 文档对照自检：禁止项 0 违规  
- [ ] **W2.8** 平面 DoD 全部勾选 → 才允许开星球分支任务  

### 平面 DoD（Definition of Done）清单

- [ ] 命题是「临空一角切片」，不是整城、不是 90s 小镇默认包  
- [ ] 英雄机位 3 秒主题关键词通过  
- [ ] ≤4 功能区；P0 地标 5–8；无随机建筑密铺  
- [ ] 无全员贴 (0,0)；医院体量与符号 ≠ 小店  
- [ ] 布局来自声明式列表（坐标有呼吸感）  
- [ ] 所有 prop **sole@y=0**，马路按段声明  
- [ ] 角色 idle 手臂自然下垂（blocker 关闭）  
- [ ] walk 可循环；spring 不爆炸  
- [ ] 画风仍为 cel+outline+posterize  
- [ ] 未做星球玩法；但 plant 契约未破坏  
- [ ] 面数/帧率在预算内  

---

## 11. 声明式布局示例

主街十字 + 地标有呼吸感（单位：米；yaw 弧度；**不要**全挤在原点）。  
可直接改写成 JS 数组或 YAML。

```yaml
# docs/layouts/linkon_slice_p0.yaml  （示例数据，供施工对照）
meta:
  name: linkon-hunter-slice-p0
  playableHalfExtent: 32
  roadWidthMain: 5.2
  plazaSize: 14

roads:
  - { id: road.ew, x0: -32, z0: 0, x1: 32, z1: 0, width: 5.2, step: 5 }
  - { id: road.ns, x0: 0, z0: -32, x1: 0, z1: 32, width: 5.2, step: 5 }
  - { id: road.alley.n, x0: -24, z0: 18, x1: 24, z1: 18, width: 3.4, step: 5 }

places:
  # B 广场 — 中心禁止大楼
  - id: plaza.core
    type: plaza
    x: 0
    z: 0
    yaw: 0
    footprintWxD: [14, 14]
    heightHint: S
    zone: B
    priority: P0

  - id: prop.plaza_marker
    type: prop.obelisk
    x: -3.5
    z: 2.0
    yaw: 0.2
    footprintWxD: [1.2, 1.2]
    heightHint: S
    zone: B
    priority: P0

  # C 地标 — 拉开距离
  - id: landmark.hunter_hq
    type: hunterHq
    x: -18
    z: 12
    yaw: 0.4           # 门脸朝向广场/南偏东
    footprintWxD: [10, 8]
    heightHint: L
    zone: C
    priority: P0

  - id: landmark.hospital
    type: hospital
    x: 20
    z: -16
    yaw: -0.35         # 长边可读，朝向广场
    footprintWxD: [16, 10]
    heightHint: L
    zone: C
    priority: P0

  - id: landmark.cafe_meow
    type: cafe
    x: 12
    z: 10
    yaw: 3.14          # 朝南向主街
    footprintWxD: [6, 5]
    heightHint: S
    zone: A
    priority: P0

  # A 主街店 — 沿路，不堵十字
  - id: shop.east_1
    type: shop.boutique
    x: 14
    z: 5.2
    yaw: 3.14
    footprintWxD: [4, 4]
    heightHint: S
    zone: A
    priority: P0

  - id: shop.west_1
    type: shop.convenience
    x: -14
    z: 5.2
    yaw: 3.14
    footprintWxD: [4.5, 4]
    heightHint: S
    zone: A
    priority: P0

  - id: prop.bus_stop_e
    type: busStop
    x: 8
    z: 3.2
    yaw: 3.14
    footprintWxD: [3, 1.2]
    heightHint: S
    zone: A
    priority: P0

  # D 远景环带
  - id: skyline.tower_a
    type: skyline.tower
    x: -28
    z: -22
    yaw: 0.1
    footprintWxD: [7, 7]
    heightHint: XL
    zone: D
    priority: P0

  - id: skyline.tower_b
    type: skyline.tower
    x: 30
    z: 8
    yaw: -0.2
    footprintWxD: [6, 6]
    heightHint: XL
    zone: D
    priority: P0

  - id: skyline.tower_c
    type: skyline.tower
    x: 26
    z: -28
    yaw: 0.0
    footprintWxD: [8, 6]
    heightHint: XL
    zone: D
    priority: P0

  # 路灯（示例子集；完整表可沿 ±x 每 8m）
  - id: light.n1
    type: streetLight
    x: -10
    z: 2.6
    yaw: 0
    footprintWxD: [0.4, 0.4]
    heightHint: S
    zone: A
    priority: P0

  - id: light.n2
    type: streetLight
    x: 10
    z: 2.6
    yaw: 0
    footprintWxD: [0.4, 0.4]
    heightHint: S
    zone: A
    priority: P0
```

等价 JS 数组头示例：

```js
export const LINKON_SLICE_P0 = [
  { id: 'landmark.hunter_hq', type: 'hunterHq', x: -18, z: 12, yaw: 0.4, footprintWxD: [10, 8], heightHint: 'L', zone: 'C', priority: 'P0' },
  { id: 'landmark.hospital', type: 'hospital', x: 20, z: -16, yaw: -0.35, footprintWxD: [16, 10], heightHint: 'L', zone: 'C', priority: 'P0' },
  { id: 'landmark.cafe_meow', type: 'cafe', x: 12, z: 10, yaw: Math.PI, footprintWxD: [6, 5], heightHint: 'S', zone: 'A', priority: 'P0' },
  // ...
];
```

**呼吸感自检**：任意两栋 P0 地标中心距建议 ≥ 14m；医院与协会不要对角贴死；广场 8m 半径内无 `heightHint: L/XL` 建筑。

---

## 附录 A — 与代码锚点

| 符号 | 文件 | 用途 |
|------|------|------|
| `LINKON_SLICE_P0` | `src/layouts/linkon-slice-p0.js` | **声明式**道路 + 地标表（改坐标优先改这里） |
| `populateFromLayout` / `buildByType` | `src/world.js` | 表驱动种植；禁止密铺建筑 |
| `plantOnFlat` / `plantOnPlanet` / `makePlant` | `src/world.js` | 平面/星球适配器 |
| `plantRoadLine` / `createRoadTile` | `src/world.js` | 马路分段、sole 契约 |
| `createHunterHq` / `createHospital` / `createMeowCafe` / `createSkylineTower` | `src/world.js` | P0 主题体块 |
| `TOWN_PROP_SCALE` / `TOWN_FLAT_TO_ARC` | `src/world.js` | 平面米 → 球面 |
| `createVRMCharacter` / `updateVRMCharacter` | `src/vrm-character.js` | VRM + Mixamo + idle hang |
| `dampSpringBones` / `buildIdleArmPose` | `src/vrm-character.js` | spring 与手臂 blocker |
| 画风链 | `src/postfx.js` | cel 后的 outline + posterize |

---

## 附录 B — 主题色板（cel 锁，非写实）

| 用途 | Hex 建议 |
|------|----------|
| 协会主 | `#5B7C99` / `#A8C4D8` |
| 医院白 | `#F2F0EA` + 十字 `#D94A3D` |
| 猫咖暖 | `#F5E6D3` / 雨棚 `#F2A0B0` 或 `#7BC4A0` |
| 路面 | `#6E6A66` |
| 铺装 | `#C9C2B4` |
| 远景塔 | `#6A7A8C` |
| 植被（若保留） | `#7EC85A` 系，降低饱和避免抢地标 |

---

*文档版本：2026-07-22 · 场景/内容设计 · 平面优先，包球预留 sole/plant/声明式布局。*
