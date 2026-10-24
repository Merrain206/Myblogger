# npm 依赖安全审计摘要

审计日期：2026-10-24。

- Next.js 升级到 16.4.2，React/React DOM 升级到 19.3.1。
- `ws` 升级到 8.22.0，`next-mdx-remote` 升级到 6.0.0。
- 未使用的 `pdfjs-dist` 已删除。
- `gray-matter` 及其旧 `js-yaml` 链已删除，文章 frontmatter 改由 `yaml` 2.9.1 解析并禁用别名。
- DOMPurify、PostCSS、source-map-js 等传递依赖已通过 lockfile 更新到修复版本。
- KaTeX 固定并覆盖为 0.18.2。
- `tsx` 升级到 4.23.15，`@tailwindcss/typography` 升级到 0.5.20。
- `brace-expansion`、Browserslist、`js-yaml`、esbuild 与 PostCSS selector parser 已更新到修复版本。
- `npm audit --json` 与 `npm audit --omit=dev --json` 最终结果均为 0 个漏洞（critical/high/moderate/low 均为 0）。

开发依赖仍应随月度维护窗口持续升级；`.github/dependabot.yml` 每周检查 npm 更新。
