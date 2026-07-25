# 环境工艺（地面 / 道路 / 广场 / 大气）

> 建筑讲究之后，**环境同样要讲究**。平板草绿 + 一条灰路会把再好的公会也衬成玩具。

## 分层

| 层 | 实现 | 观感目标 |
|----|------|----------|
| 草地 | `environment/textures.makeGrassTexture` + `createMeadowGround` | 暖绿草甸，有斑块与草茎，非塑料纯色 |
| 土路 | `makeDirtRoadTexture` + 双辙 + 路肩 + 路缘石 | 马车压实土，可走可读 |
| 广场 | `makeCobbleTexture` + 石沿 + 十字土径 | 村口铺装，与道路衔接 |
| 建筑脚底 | `makeWornEarthApronTexture` + `createBuildingDirtApron` | 径向磨蚀泥斑，边缘 alpha 融进草，非硬圆盘 |
| 微细节 | `scatterGroundMicroDetail` | 路肩草簇 + 小石，地面有「可读触感」 |
| 雾 | `main.js` FOG 偏草绿灰 | 远景化开，不发脏灰 |
| 云 | 少而大的团云 | 乡间天空 |

## 风格

与建筑 v2 一致：**stylized game-prop 可读**，程序纹理可重复，避免照片级噪声。

## 文件

- `src/environment/textures.js` — canvas 程序纹理  
- `src/environment/flat-env.js` — 草地 / 路 / 广场工厂  
- `src/world.js` `createFlatWorld` — 组装  
