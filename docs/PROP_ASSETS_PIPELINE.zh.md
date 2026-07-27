# 街景小物件资产管线

> 目标：把街景道具从“程序体块占位”升级为有多视图证据、可辨识轮廓和真实装配关系的 Three.js 模型。

## 质量分层

| 层级 | 用途 | 要求 |
|---|---|---|
| Hero prop | 广场、镜头前景、交互点 | 三视图参考、img2threejs spec、真实装配、浏览器多角度验收 |
| Supporting prop | 建筑门口、中景重复物 | 继承已通过的部件模板；保持材质、比例和 sole 一致 |
| Scatter detail | 远景填充 | 允许低成本实例化，但不能承担身份识别 |

程序 box/cylinder 拼接只能作为 blockout，不能直接晋级 Hero prop。

## Batch 01

| ID | 场景类型 | 层级 | 材质/装配覆盖 | 状态 |
|---|---|---|---|---|
| `props.village_well.v2-pbr` | `well` | Hero | 暖石 PBR、旧木、80 片曲面搭接瓦、卷扬、绳桶 | strict spec + 主/侧视图验收通过 |
| `props.street_lantern.v2-pbr` | `streetLight` | Supporting | 石座、参考驱动锻铁、链条、六面玻璃、局部发光 | intake + 主/侧视图验收通过 |
| `props.handcart.v2-pbr` | `handcart` | Supporting | 定向木纹、铁箍旧化、轮轴、24 根辐条、把手 | intake + 主/侧视图验收通过 |

参考图位于 `docs/references/props/<asset>/`：

- `turnaround.png`：同一设计的三视图生成板；
- `ref_main.png`：3/4 主视图；
- `ref_front.png`：正视/端视；
- `ref_side.png`：侧视；
- `PROMPT.md`：最终生成约束。

实现数据与视觉评分见 `src/entities/props/models/BATCH01_RUN_LOG.md`；每件资产的 `compare/` 目录保存浏览器实拍和主参考对照图。

## Batch 02

| ID | 场景类型 | 层级 | 材质/装配覆盖 | 状态 |
|---|---|---|---|---|
| `props.quest_board.v1-pbr` | `questBoard` | Supporting | 石砌双脚、旧木框、三排瓦顶、卷边纸张、图钉/蜡封、铁钩与公会徽 | intake + detail inventory + 主/侧视图验收通过 |
| `props.barrel_cluster.v1-pbr` | `barrelCluster` | Supporting | 三只独立桶、56 根独立鼓腹桶板、15 道铆钉铁箍、桶盖、木龙头、支撑楔与绳圈 | intake + detail inventory + 主/侧视图验收通过 |
| `props.crate_stack.v1-pbr` | `crateStack` | Supporting | 四只可拆货箱、独立木板、角撑/斜撑/铁钉、绳把、苹果与粗麻布 | intake + detail inventory + 主/侧视图验收通过 |
| `props.village_bench.v1-pbr` | `bench` | Supporting | 三块座板、十根背条、四条外撇腿、长撑、斜撑、卷曲铁扶手、铆钉与脚部苔藓 | intake + detail inventory + 主/侧视图验收通过 |

Batch 02 参考采用单主体 3D 产品渲染。`ref_source.png` 保留生成原图，`ref_main.png` 增加白色技术边界以通过确定性剪影 admission；这不会修改主体。实现数据与视觉评分见 `src/entities/props/models/BATCH02_RUN_LOG.md`。

## Batch 03

| ID | 场景类型 | 层级 | 材质/装配覆盖 | 状态 |
|---|---|---|---|---|
| `props.fence_section.v1-pbr` | `fenceSection` | Supporting | 双石脚、旧木立柱/横梁、七根不等高栅条、矩形斜撑、外凸铁带与方铆钉 | intake + detail inventory + 主/侧视图验收通过 |
| `props.hitching_post.v1-pbr` | `hitchingPost` | Supporting | 双立柱承重框、阶梯柱帽、上下横撑、双斜撑、四套拴马环、独立 socket 与麻绳圈 | intake + detail inventory + 主/侧视图验收通过 |
| `props.signpost.v1-pbr` | `signpost` | Supporting | 三向厚木箭牌、非文字路线刻纹、L 形铁托、黄铜章、布符与阶梯石座 | intake + detail inventory + 主/侧视图验收通过 |
| `props.waystone.v1-pbr` | `waystone` | Supporting | 不规则厚石碑、双层砌块、包覆铁带、裂纹、暗槽包边的青蓝嵌入式符文、供奉币与苔藓 | intake + detail inventory + 主/侧视图验收通过 |

Batch 03 延续单主体 3D 产品参考，并在浏览器对照中完成了三次可见返工：栅栏默认白材质错位、路牌侧边化遮挡、界碑符文过曝/供奉币方向。实现数据与评分见 `src/entities/props/models/BATCH03_RUN_LOG.md`。

## 验收闸门

1. intake：单主体、完整轮廓、主体占比合理、无裁切；
2. spec：moderate/complex 质量合同、detail inventory、拓扑分类、严格校验；
3. geometry：所有承重/悬挂件有真实接触或 socket，不允许漂浮；
4. material：木、石、铁、玻璃/发光芯的响应必须分层；
5. runtime：`root.userData.sculptRuntime` 暴露 pivot、socket、collider 和语义节点；
6. visual：主视图 + 至少一个侧视图浏览器截图，逐层对照参考；关键系统低于阈值必须返工；
7. integration：sole 在 `y=0`、catalog type 不变、生产构建通过。

## 批量扩展原则

- 批量的是共享部件和质量合同，不是一次生成大量低质外形；
- 石材、木构、轮组、桶板、货箱、铁件、纸张、粗麻布、绳索、灯笼等模板已可复用于后续道具；
- 新道具仍须有自己的身份特征和至少一张合格主参考；
- 每完成一个可运行批次就独立 commit + push。
