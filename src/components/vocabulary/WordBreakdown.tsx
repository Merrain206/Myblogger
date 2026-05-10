export interface BreakdownPart {
  text: string;
  meaning: string;
  type: "prefix" | "root" | "suffix";
}

const colorMap = {
  prefix:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  root: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
  suffix:
    "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
};

export default function WordBreakdown({ parts }: { parts: BreakdownPart[] }) {
  if (parts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {parts.map((part, i) => (
        <div key={i} className="flex flex-col items-center">
          <span
            className={`rounded-lg border px-2.5 py-1 text-sm font-medium ${colorMap[part.type]}`}
          >
            {part.text}
          </span>
          <span className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
            {part.meaning}
          </span>
        </div>
      ))}
    </div>
  );
}
