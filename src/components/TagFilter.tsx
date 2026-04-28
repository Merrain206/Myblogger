interface TagFilterProps {
  tags: string[];
  activeTag: string;
  onSelect: (tag: string) => void;
}

export default function TagFilter({ tags, activeTag, onSelect }: TagFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect("")}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          activeTag === ""
            ? "bg-primary-500 text-white shadow-sm"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        }`}
      >
        全部
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            activeTag === tag
              ? "bg-primary-500 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          }`}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}
