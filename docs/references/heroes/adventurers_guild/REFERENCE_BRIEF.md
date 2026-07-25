# 冒险者公会 · 参考图规范（对齐 img2threejs 官方）

来源：`.agents/skills/img2threejs/grimoire/intake/validation_rubric.md`、  
`quality_contract.md`、`detail_inventory.md`、`README.md` Ask-for-better-input。

## 1. 官方适合性（Pass）

| 要求 | 说明 |
|------|------|
| 单一主体 | 画面只有这一栋建筑，不是街景 |
| 占满画幅 | 主体约占 60–85%，剪影清晰 |
| 材质可读 | 石 / 木 / 灰泥 / 瓦 / 金属 分区清楚 |
| 背面可推断 | 或提供第二视角；单视角时结构需可对称推断 |
| 可用程序原语近似 | box/cylinder/extrude/lathe 能表达，非烟雾/蕾丝 |

## 2. 官方建议补充输入

- **front / side / back**（建筑至少 front + 3/4 或 side）
- **中性背景**（灰/白棚，无杂景）
- **更高分辨率**（≥1024，复杂建筑建议 1536–2048）
- **细节特写**（招牌、瓦口、柱头等 identity 细节）
- **明确风格**：realistic / stylized / low-poly / **game prop** / hero render

## 3. 复杂建筑额外要求

- 分 **macro / meso / micro** 层次
- 重复系统可描述（瓦垄、砌石、木构格子），避免「无法枚举的噪声」
- 无法从单图推断时：`request-input` 或降保真（stylized）

## 4. 我们上一张参考图的问题

| 问题 | 后果 |
|------|------|
| 单视角 3/4 only | 侧面/背面、屋顶背面靠猜 |
| 过强「产品级 PBR 微细节」 | 生成端用砖块/平面冒充瓦片与木纹，显得糙 |
| 未声明 stylized/game-prop | 管线按高写实期望雕刻，细节对不上就假 |
| 无 side/close-up | 柱头雕花、瓦沿、招牌厚度无证据 |
| 建筑 = complex | 单图难支撑全部 micro，strict 过了视觉仍虚 |

## 5. 本轮新参考图策略

1. **风格写死**：clean stylized fantasy game prop，硬边清晰、色块分区，**不要**超写实微噪  
2. **多视角**：`ref_front` + `ref_three_quarter` + `ref_side`（主视角 three_quarter）  
3. **中性灰棚**、主体居中、强剪影  
4. **Identity 夸张可读**：绿牌交叉剑、石底、半木构、廊柱、委托板、酒桶  
5. **细节可控**：瓦用规则行列（可程序化），石用清晰分缝，木梁有厚度/倒角感，避免随机碎噪  

文件：

```
docs/references/heroes/adventurers_guild/v2/
  ref_three_quarter.png   # 主参考（生成主输入）
  ref_front.png
  ref_side.png
  PROMPT.md
```
