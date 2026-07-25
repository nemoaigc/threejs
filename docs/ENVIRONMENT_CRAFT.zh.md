# 环境工艺（地面 / 道路 / 广场 / 大气）

> 建筑讲究之后，**环境同样要讲究**。但「细节」≠ 堆脏噪声。原则：**浅色、少对比、空 > 丑垃圾**。

## 分层

| 层 | 实现 | 观感目标 |
|----|------|----------|
| 草地 | `makeGrassTexture` + `createMeadowGround` | 浅春绿，柔斑块，不高密度暗草茎 |
| 土路 | `makeDirtRoadTexture` + 轻路肩 | 沙米色土路，浅辙，无厚路缘石 |
| 广场 | `makeCobbleTexture` | 浅暖石板，轻边 |
| 建筑脚底 | `makeWornEarthApronTexture` | 很淡的脚下土晕 |
| 布局 | `mushoku-slice-p0` | **只留** 广场 + 三地标 + 树；水井/铺子/天际线 junk 已撤 |
| 雾 / 滤镜 | 浅天蓝雾 + 弱 posterize / 几乎无 vignette | 进游戏不发闷、不发脏 |

## 风格

与建筑 v2 一致：**stylized game-prop 可读**，程序纹理可重复，避免照片级噪声。

## 文件

- `src/environment/textures.js` — canvas 程序纹理  
- `src/environment/flat-env.js` — 草地 / 路 / 广场工厂  
- `src/world.js` `createFlatWorld` — 组装  
