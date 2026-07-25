# 环境工艺 — **立体** Three.js 地表

> 地表必须是 **有厚度、有起伏的 mesh**，不是一张贴了图的平面。

## 分层

| 层 | 立体实现 | 观感 |
|----|----------|------|
| 草地 | 细分 `PlaneGeometry` + **顶点高度场** | 缓丘草甸 |
| 土路 | **横截面 Shape 挤出**（抬高路面 + 双辙凹槽） | 嵌在地上的立体路 |
| 路肩 | 挤出肩 + 侧向立体条 | 草土过渡有体量 |
| 广场 | **Instanced 石块**（每块有高）+ 立体石沿 | 一块块石头 |
| 建筑脚下 | **Lathe 土丘** | 脚下隆起 |

纹理只染色；体量靠几何。

## API（`world.js` 不变）

- `ensureEnvTextures()`
- `createMeadowGround(size)`
- `createRoadTile` / `createDirtRoadTile(length, width)`
- `createPlazaPad` / `createCobblePlaza(size)`
- `createBuildingDirtApron(radius)`

## 文件

- `src/environment/flat-env.js` — 立体工厂  
- `src/environment/textures.js` — 程序染色纹理  
- `src/environment/ground-v1/RUN_LOG.md`  
