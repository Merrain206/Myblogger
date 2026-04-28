import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  reactStrictMode: true,
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [rehypePrettyCode, { theme: "github-dark", keepBackground: false }],
    ],
  },
});

export default withMDX(nextConfig);
