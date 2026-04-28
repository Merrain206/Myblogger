"use client";

import { useState, useEffect, useRef } from "react";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-2 rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:text-slate-200 group-hover:opacity-100"
      aria-label="复制代码"
    >
      {copied ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function CodeBlock({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const codeRef = useRef<HTMLElement>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (codeRef.current) {
      setCode(codeRef.current.textContent || "");
    }
  }, []);

  const isBlock = className?.includes("language-");

  if (isBlock) {
    return (
      <div className="group relative my-6">
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-100" {...props}>
          <code ref={codeRef} className={className} />
        </pre>
        <CopyButton code={code} />
      </div>
    );
  }

  return (
    <code
      className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800 dark:bg-slate-700 dark:text-slate-200"
      {...props}
    />
  );
}

export const MDXComponents = {
  code: CodeBlock,
  pre: ({ children }: { children: React.ReactNode }) => children,
  h2: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id={id} className="group mt-10 mb-4 scroll-mt-20 text-2xl font-bold" {...props}>
      <a href={`#${id}`} className="mr-2 hidden text-primary-400 opacity-0 transition-opacity group-hover:opacity-100 md:inline">
        #
      </a>
      {children}
    </h2>
  ),
  h3: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 id={id} className="mt-8 mb-3 scroll-mt-20 text-xl font-bold" {...props}>
      {children}
    </h3>
  ),
  a: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} className="text-primary-500 underline-offset-2 transition-colors hover:text-primary-600" target={props.href?.startsWith("http") ? "_blank" : undefined}>
      {children}
    </a>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left text-sm font-semibold dark:border-slate-600 dark:bg-slate-800">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="border border-slate-300 px-3 py-2 text-sm dark:border-slate-600">
      {children}
    </td>
  ),
};
