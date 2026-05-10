export default function LevelBadge({ level }: { level: "CET4" | "CET6" }) {
  const colors =
    level === "CET4"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";

  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${colors}`}>
      {level}
    </span>
  );
}
