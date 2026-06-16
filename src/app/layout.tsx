import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import "@/styles/globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://merrain.cn"),
  title: {
    default: "Merrain's Blog - 个人博客",
    template: "%s | Merrain's Blog",
  },
  description:
    "热爱编程与探索，分享技术心得、项目经验与生活感悟。基于 Next.js + MDX 构建。",
  keywords: [
    "博客",
    "技术",
    "编程",
    "前端",
    "后端",
    "Python",
    "Next.js",
    "React",
    "五子棋",
    "AI",
    "Linux",
  ],
  authors: [{ name: "Merrain" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Merrain's Blog",
    title: "Merrain's Blog - 个人博客",
    description:
      "热爱编程与探索，分享技术心得、项目经验与生活感悟。基于 Next.js + MDX 构建。",
    url: "https://merrain.cn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Merrain's Blog - 个人博客",
    description:
      "热爱编程与探索，分享技术心得、项目经验与生活感悟。基于 Next.js + MDX 构建。",
  },
};

const themeInitScript = `
(function(){
  try {
    var isDark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <BackToTop />
        </div>
      </body>
    </html>
  );
}