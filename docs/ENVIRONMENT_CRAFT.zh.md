# 环境工艺（地面 / 道路 / 广场 / 大气）

> 建筑讲究之后，**环境同样要讲究**。但「细节」≠ 堆脏噪声。原则：**浅色、少对比、空 > 丑垃圾**。

## 地表分层（Surface stack · 必做 5 层）

| id | 层 | 工厂 / 纹理 | 观感目标 |
|----|----|-------------|----------|
| `grass` | 草地 | `makeGrassTexture` + `createMeadowGround` | 浅春绿，柔和色斑，可选稀疏干草 freckle；不高密度暗草茎 |
| `dirt_road` | 主土路 | `makeDirtRoadTexture` + `createDirtRoadTile` | 沙米色压实土，**双软车辙**（沿路向），浅卵石，无厚路缘石 |
| `shoulder` | 路肩过渡 | `makeShoulderTexture`（路砖两侧） | 草→土软过渡；对称：边缘草、中心土（压在路下） |
| `cobble_plaza` | 广场 | `makeCobbleTexture` + `createCobblePlaza` | 浅暖石板 / 鹅卵，浅灰缝，轻描边高光；淡色缘石 |
| `dirt_apron` | 建筑脚底 | `makeWornEarthApronTexture` + `createBuildingDirtApron` | 很淡的脚下土晕，**径向 alpha 淡出**，无硬圆盘 |

可选抛光：仅草地上的稀疏干草 freckle（已内置、极淡）。

## 风格

与英雄建筑（公会 / 神殿 / 旅店）一致：

- **stylized fantasy game-prop**，亮色、可读
- 程序纹理可 `RepeatWrapping` 平铺；避免照片级脏噪声
- 几何简单（plane / box）OK，**材质 / 纹理**卖辨识
- 全部地面 `userData.noOutline = true`（配合 postfx）
- 坐标系：sole ≈ y=0；路本地 **+X 沿路长，+Z 跨宽**
- 雾 / 曝光友好：贴近 sky `0x8ec8ec` 软调

## 质量纪律

| 要 | 不要 |
|----|------|
| 软斑块、双车辙、浅石板 | 噪声汤 / 微草簇 spam |
| 沙米 / 春绿 / 暖石 | 泥巴棕、塑料绿平面 |
| 空 > 丑 | 路缘石城墙、卵石森林 |
| CanvasTexture / DataTexture 单例 | 每帧重绘 |

## 公共 API（`world.js` 稳定）

```js
await ensureEnvTextures();
createMeadowGround(size);
createRoadTile / createDirtRoadTile(length, width);
createPlazaPad / createCobblePlaza(size);
createBuildingDirtApron(radius);
```

## 文件

- `src/environment/textures.js` — 无缝程序纹理（+ 可选 `content/env/*.png` 覆盖草/路）
- `src/environment/flat-env.js` — 草地 / 路 / 广场 / 脚底工厂
- `src/environment/ground-v1/RUN_LOG.md` — 本轮工艺记录
- `src/world.js` `createFlatWorld` — 组装

## 布局 / 大气（相关）

| 层 | 实现 | 说明 |
|----|------|------|
| 布局 | `mushoku-slice-p0` | **只留** 广场 + 三地标 + 树；水井/铺子/天际线 junk 已撤 |
| 雾 / 滤镜 | 浅天蓝雾 + 弱 posterize / 几乎无 vignette | 进游戏不发闷、不发脏 |
