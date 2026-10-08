---
name: blog-illustrator
description: 为 Myblogger 博客的 MDX 文章规划与落地插图、封面。当用户提到"给这篇文章配图/加插图/做封面/这张图放哪/这篇文章需不需要图/给文章画张示意图/为博客文章生成插图提示词"等涉及博客图文的任务时触发。负责分析与选型，把实际绘制委托给 matplotlib、visual-style-guide、mermaid-diagram、handraw-style 等执行工具。
---

# Blog Illustrator — 博客插图编排

本 skill 是 Myblogger 博客插图的**决策编排层**：判断「该不该画、画哪一类、交给谁画、怎么验证、放哪里」，而不是亲自充当绘图引擎。

## 边界（不可协商）

- ❌ **不为每篇文章强制配图。** 没有合适插图点时，明确回答「这篇不需要图」——这是合格结论，不是失职。
- ❌ **未经用户确认，不修改任何文章、不批量处理历史文章。**
- ❌ **不覆盖 `public/images/blog/` 中的既有文件。** 落地前用 `python scripts/check_assets.py <name>` 查重；重名则换名。
- ❌ **公式、代码、精确数值关系、性能/收敛曲线禁用文生图** —— 必须用可验证的绘图方式（matplotlib / SVG 代码），否则模型会画出错误的公式。
- ✅ 视觉美观**不得**牺牲技术准确性；准确性优先于好看。
- ✅ 用户确认前只展示候选与建议位置，**不落盘、不改 MDX**。

> 本 skill 规范的是「流程与护栏」，不是「每步必须照做」的脚本。鼓励 Agent 结合具体文章自主判断，但上述边界不可逾越。

## 图型路由

先判内容性质，再选执行工具：

| 内容性质 | 图型 | 执行工具 |
|---|---|---|
| 公式、数据、性能/收敛曲线、精确对比 | 精确图表 | `scripts/generate_blog_charts.py`（matplotlib，已有脚本） |
| 架构、分层、流程、时序 | 结构示意图 | `visual-style-guide`（手绘蓝图风）或 `mermaid-diagram` |
| 抽象概念、比喻、科普类比 | 科普插画 | `handraw-style` → 产出提示词 |
| 文章封面 | 封面 | `handraw-style` 的 `article-cover-designer` |

判据、反例见 `references/image-types.md`。

## 工作流

四个阶段，**每阶段末尾停下来向用户汇报**，不要一口气冲到最后：

### A. 分析（只读）
读目标 MDX，梳理主题、章节结构、核心知识点。找出**值得配图的点**，每个都给出理由（如：认知负荷高、纯文字难以建立空间/时序直觉、需要对比关系、抽象概念缺乏锚点）。产出「插图机会清单」。

### B. 选型与提示词
对每个机会按路由表定图型与工具。调用 `handraw-style` 时，按其规则**实时动态**选择风格编号与配色（严禁静态关键词映射）。产出具体执行方案或提示词。

### C. 产出与校验
- 环境有可用绘图/生图通道则产出候选图；**没有就只交付提示词，并明确说明缺少的能力**——不要假装已经出图。
- 逐张做**技术准确性校验**（见 `references/tech-accuracy.md`），对照原文核对公式、数值、方向、因果。
- 向用户展示候选图与**建议插入位置（含 MDX 行号）**，等待确认。

### D. 落地（仅用户确认后）
按 `references/blog-conventions.md` 存图到 `public/images/blog/`，在确认位置插入 `![alt](/images/blog/xxx.png)`，并检查体积。

## 风格分工（避免越界）

- 手绘**蓝图工程风**的绘制规范 → 交给 `visual-style-guide`
- 手绘**插画风**的风格编号与提示词 → 交给 `handraw-style`
- 标准流程图 / 时序图 → 交给 `mermaid-diagram`
- **本 skill 只做编排与决策**，不重复定义这些规范，也不与它们抢触发。

## 参考

- `references/image-types.md` — 图型判据与反例
- `references/tech-accuracy.md` — 技术准确性核对清单
- `references/blog-conventions.md` — 路径 / 命名 / 主题兼容 / MDX 语法 / 体积
