export const metadata = {
  title: "关于",
  description: "关于我。",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="mb-8 text-3xl font-extrabold text-slate-900 dark:text-slate-100">关于我</h1>

      <div className="prose dark:prose-invert">
        <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          你好！我是一名热爱编程的开发者Merrain，欢迎来到我的博客。
        </p>

        <h2>技术栈</h2>
        <ul>
          <li><strong>前端</strong>: React, Next.js, TypeScript, Tailwind CSS</li>
          <li><strong>后端</strong>: Python, FastAPI, Node.js</li>
          <li><strong>AI/ML</strong>: LLM 应用开发, 语音识别, 声纹识别</li>
          <li><strong>数据库</strong>: MySQL, PostgreSQL</li>
        </ul>

        <h2>关于博客</h2>
        <p>
          本博客使用 <a href="https://nextjs.org" target="_blank">Next.js</a> + MDX 构建，
          支持暗色模式、全文搜索和分类过滤。所有文章存放在{" "}
          <code>src/content/posts/</code> 目录下，使用 Markdown 编写。
        </p>

        <h2>联系我</h2>
        <p>
          如果你对我的项目感兴趣，或者有任何交流合作，欢迎通过以下方式联系我：
        </p>
        <ul>
          <li>GitHub: <a href="https://github.com/Merrain206" target="_blank">@Merrain206</a></li>
          <li>邮箱: <a href="mailto:merrain0206@163.com">merrain0206@163.com</a></li>
        </ul>
      </div>
    </div>
  );
}
