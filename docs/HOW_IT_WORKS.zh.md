# 小行星 Messenger —— 实现原理(以及原版是怎么做的)

一份关于本 demo 和它所模仿的 abeto 网站 [messenger.abeto.co](https://messenger.abeto.co)
的导览。写给完全没上下文的人也能看懂。

---

## 一句话总结

- 这个"画风" = **三层叠起来的渲染技巧**:cel(卡通)着色 → **墨线描边**(后处理里做边缘检测)
  → **色阶量化 + 抖动**(漫画颗粒)。把这三样做对,几乎啥都能变成 abeto 味。
- "小行星"是靠**人不动、星球在脚下转**实现的。
- 我们的角色是 **VRM** 动漫形象(VRoid 捏的)+ 手写走路动画。**abeto 并不用 VRM** —— 他们的角色是
  Houdini/Blender 手搓的专属模型。VRM 只是我们图快的捷径。
- 我们目前大约是 abeto 完成度的 **40%**。差的那 60% 是**内容 + 资源优化**,不是技术原理。

---

## 第一部分 —— abeto Messenger 到底是怎么做的

依据:我对他们 JS 包的逆向 + 他们的 [awwwards 案例研究](https://www.awwwards.com/messenger.html)
和 [80.lv 报道](https://80.lv/articles/deliver-mail-on-tiny-colorful-planet-in-this-relaxing-web-game)。

- **确认的技术栈**(来自他们的案例研究):3D 用 **Houdini & Blender**;UI 用
  **Figma & Photoshop**;代码用 **Three.js + three-mesh-bvh + 原生 JavaScript + C++**。
  其中 C++ 编译成 **WASM** 跑性能关键路径(资源解码 / 动画 / 模拟)——**这个**加上极致压缩,
  才是它"那么流畅"的真正原因(不是渲染更省)。
- **引擎**:自定义 **three.js**(不是 Unity),Vite 打包,调试面板用 Tweakpane。
- **角色**:一个用 **Houdini/Blender** 手工建的 **3D 模型**,**Substance** 手绘贴图。
  - 身体动画 = 骨骼绑定 **+ 顶点动画贴图(VAT)**:把每一帧的顶点位置烘进一张贴图,在顶点着色器里
    回放。动画以 Draco `.drc` 文件交付(`diver-talk.drc` 等)。
  - **脸是 2D 的**:眼睛和嘴是精灵表贴图(`mouth-highq.ktx2`、`eye-highq.ktx2`),按帧切换做
    眨眼/口型。正是这个手法让它有手绘感。**只有脸是 2D,身体是完整 3D。**
- **在表面行走**:碰撞用 **[three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)**。
- **描边**:后处理里做 法线 + 深度 + **surface-ID** 边缘检测。
- **资源**:极致压缩 —— **Draco** 几何、**KTX2/Basis** 贴图、**OGG** 音频、WASM 解码器。
  **这就是它流畅的原因。**
- **内容**:多个生态(海滩/城市/工厂/森林/神庙/瀑布)、大量 NPC、特效(瀑布、蝴蝶、鸟用 Draco
  点云)、空间音频、多人联机。

## 第二部分 —— 本 demo 是怎么做的

五块,每块对应一个文件。

1. **星球 + 走路**(`src/main.js`、`src/world.js`)—— 星球是噪声挤出地形的 icosphere + 一层海洋壳。
   角色从不移动;**星球在脚下旋转**(`rotateOnWorldAxis`),绕相机相对轴转,每帧采样顶部地形高度
   把她种上去。(abeto 那套 BVH 真表面行走的廉价替代版。)

2. **角色**(`src/vrm-character.js`)—— 用
   [`@pixiv/three-vrm`](https://github.com/pixiv/three-vrm) 加载的 **VRM** 形象(VRoid 捏的)。
   自带 MToon 卡通材质,天生贴合画风。走路是**手写代码**摆正规化人形骨骼(正弦曲线驱动)—— 没有动画
   文件(所以有点僵)。如果没有 `public/character.vrm`,就回退到 three.js 的 `RobotExpressive`。

3. **道具 + 城市**(`src/world.js`)—— 树/石/灌木/**建筑**都是程序化 3D 卡通几何,撒在陆地上、贴
   地表法线立起来。是真几何 → 描边自动套上。

4. **画风管线**(`src/postfx.js`)—— 核心:
   1. **Cel 着色**:`MeshToonMaterial` + 几级渐变(VRM 用 MToon)。
   2. **墨线描边**:先渲一张**法线 + 深度**预渲图,再用全屏边缘检测 shader —— 剪影靠**深度二阶导
      (拉普拉斯)**,内部线靠**法线**突变。
   3. **色阶量化 + 抖动**:颜色压成 N 档 + **8×8 Bayer** 有序抖动。
   - 链路:`渲染 → 描边 → 色阶 → SMAA 抗锯齿 → 输出`。

5. **手绘地面**(`scripts/genimg.py`)—— 草地贴图是 **AI 生成的**(`gpt-image-2`),用 triplanar
   投影到球面上(无缝),水边加沙滩环。

## 第三部分 —— VRoid 和 VRM(以及原版为啥不用)

- **VRoid Studio** —— pixiv 出的免费桌面软件,用滑块/笔刷*制作*动漫 3D 角色。
- **VRM** —— 一种开放的人物文件格式(`.vrm`),建在 glTF 2.0 之上:标准人形骨骼、表情、视线、
  **spring bone**(头发/衣物物理)、**MToon** 卡通着色器,以及授权信息。`@pixiv/three-vrm`
  把它读进 three.js。
- **原版游戏并不用 VRoid/VRM。** abeto 的角色是定制建模(Houdini/Blender)+ 2D 贴图脸 —— 包里没有
  `.vrm`、也没有 VRM 扩展。VRM 是*我们*几分钟搞到一个动漫少女的捷径。代价:默认 VRoid 形象偏
  "VTuber"味,不是 abeto 那种手绘吉卜力风。
- **想用你自己的角色**:在 VRoid Studio 捏一个 → 导出 `.vrm` → 丢到 `public/character.vrm`
  覆盖占位模型(无需改代码)。

## 第四部分 —— 差距(我们的 40% → 他们的 100%)

| | abeto | 本 demo |
|---|---|---|
| 素材 | 手工建模 + 手绘贴图 | 程序化球+盒子 + 1 张 AI 贴图 |
| 角色动画 | 绑骨 + 动捕,2D 贴图脸 | 手写正弦走路 |
| 描边 | surface-ID | 法线 + 深度 |
| 内容 | 多生态、NPC、特效、音频、玩法 | 一个星球、静态道具 |
| 流畅度 | Draco/KTX2、实例化、LOD | 基础调优(稳 60fps) |

**补齐路线图:** 真模型+贴图 · 给 VRM 套 Mixamo 动捕走路 · surface-ID 描边 · 更多生态/道具种类
· 资源压缩。

## 参考(开源)

- 描边(最接近 abeto):https://github.com/OmarShehata/webgl-outlines
- 吉卜力 toon 着色器:https://github.com/craftzdog/ghibli-style-shader
- 小行星控制器:https://github.com/pmndrs/ecctrl · https://github.com/hlorenzi/galaxy
- VAT(顶点动画):https://github.com/mikelyndon/r3f-webgl-vertex-animation-textures
- three.js 里的 VRM:https://github.com/pixiv/three-vrm
- 免费带动画角色:https://quaternius.com(CC0) · https://www.mixamo.com · https://vroid.com
- abeto 案例研究:https://www.awwwards.com/messenger.html
