# 博客约定（Myblogger）

## 存放与引用

- **图片目录**：`public/images/blog/`
- **MDX 引用**：`![替代文字](/images/blog/xxx.png)`
  - 路径以 `/images/blog/` 开头（`public` 是静态根，不出现在 URL 里）。
  - 替代文字写中文短描述。

## 命名惯例

- **kebab-case**，结构为 `<主题>-<描述>`：
  - 好例子（现有）：`attention-heatmap`、`fastapi-layers`、`multi-head-subspace`、`positional-encoding`。
  - 避免：中文、空格、下划线、大写、`final`/`v2`/`new` 之类版本后缀。
- **不覆盖既有文件**。落地前查重：
  ```bash
  python scripts/check_assets.py <name-without-ext>
  ```
  冲突则改用更具体的描述名。

## 格式与体积

- 优先 **PNG**（图表/示意）；照片类可用 **JPG/WebP**。
- 控制体积：图表 PNG 目标 < 300KB；过大时降低 DPI 或改用调色板 PNG / WebP。
- 图表建议 DPI 适中（约 150~200），够清晰又不臃肿。

## 亮 / 暗主题兼容（重要）

本站 `globals.css` 的 `.prose img` 仅有 `mx-auto rounded-xl shadow-md`，**没有暗色模式特殊处理**。因此图片必须**自身适配两种主题**：

- ❌ **避免纯白背景**（`#FFFFFF`）——暗色模式下会刺眼、与页面冲突。
- ✅ 图表背景用**暖白/中性浅色**（如 `#FDFBF7`、`#F8FAFC`）或**透明背景**。
- ✅ 蓝图风沿用 `visual-style-guide` 的底色（`#FDFBF7` / `#F9F8F4`）。
- ✅ 若图注定只适合一种主题，需在确认环节向用户说明。

## 落地步骤（仅确认后）

1. 保存图片到 `public/images/blog/<name>.<ext>`。
2. 在用户确认的位置插入 `![描述](/images/blog/<name>.<ext>)`。
3. **不要**顺手改动文章其它内容（最小改动原则）。
4. 提醒用户：新增资源需按项目惯例部署（部署与推送须用户明确指令）。

## 既有资产（优先复用）

- 图表脚本：`scripts/generate_blog_charts.py`、`scripts/generate_transformer_charts.py`
- 蓝图风原型：`scripts/blueprint-*.html`（12 个，风格统一，可仿写）
- 相关 skill：`visual-style-guide`（蓝图风规范）、`mermaid-diagram`、`handraw-style`
