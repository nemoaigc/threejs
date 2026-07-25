# 资产质量分级（生产纪律）

> 程序盒子拼装 **不是** 主路径。能上模型 / pipeline 就不要手搓方块。

## 优先级（高 → 低）

| 档 | 来源 | 适用 | 例子 |
|----|------|------|------|
| **A · 现成模型** | GLB / VRM / 已授权包 | 树、远景 cottage、角色、道具 | `public/models/tree-*.glb` · `house-*.glb` · `character.vrm` |
| **B · 生成管线** | 多视角 stylized ref → **img2threejs** → factory | 英雄地标、招牌道具 | 公会 v2；神殿 / 旅店 在产 |
| **C · 纹理资产** | 无缝贴图 / 高质量 tile（非脏噪声） | 草地、土路、石板 | 优于 canvas 随机笔画 |
| **D · 程序几何** | 手写 primitives | 仅平面/占位/调试 | **不得**再进主场景当成品建筑 |

## 上场规则

1. **空 > 丑垃圾** — 没过 A/B 的水井、假铺子、keep 不上场。  
2. **树 / 房子优先 GLB** — `loadTownAssets` 已加载；layout 用 `tree` / `cottageGlb`。  
3. **英雄建筑走 B** — 必须 multi-view（3/4 + front + side）+ game-prop 风格，同公会 v2。  
4. **环境** — 先换更好的无缝贴图，再谈程序细节堆砌。  
5. **验收** — 3 秒可读身份；亮色、少脏滤镜；不反物理。

## 生产队列（不限 2～3 个）

| 顺序 | 资产 | 路径 |
|------|------|------|
| 1 | 更多树 + GLB cottage 填充 | A（已有模型） |
| 2 | 神殿 temple | B img2threejs |
| 3 | 旅店 inn | B img2threejs |
| 4 | 主路 / 广场贴图升级 | C |
| 5 | 铁匠 / 魔法店 / 任务板… | B（各做 multi-view） |
| 6 | 井 / 路灯 / 马车 | A 找模型 或 B |

## 禁止

- 用 `createWell` 一类反物理盒子冒充 props  
- 单张 PBR 产品图硬生成（公会教训：要 stylized multi-view）  
- 在 layout 塞一堆未过质量线的 D 档建筑「热闹」  
