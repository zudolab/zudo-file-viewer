import type { FileEntry } from "@/types";

interface ThumbnailGridProps {
  entries: FileEntry[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  thumbnailSize: number;
}

export default function ThumbnailGrid({
  entries,
  selectedPath,
  onSelect,
  thumbnailSize,
}: ThumbnailGridProps) {
  return (
    <div
      className="grid gap-md p-lg"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))`,
      }}
    >
      {entries.map((entry) => (
        <button
          key={entry.path}
          type="button"
          onClick={() => onSelect(entry.path)}
          className={`flex flex-col items-center gap-xs rounded-lg p-sm text-center transition-colors ${
            selectedPath === entry.path
              ? "bg-accent text-on-accent"
              : "hover:bg-surface"
          }`}
        >
          <div
            className="flex items-center justify-center rounded-md bg-surface"
            style={{ width: thumbnailSize, height: thumbnailSize }}
          >
            <span className="text-2xl text-muted">
              {entry.fileType === "directory"
                ? "\u{1F4C1}"
                : entry.isImage
                  ? "\u{1F5BC}"
                  : "\u{1F4C4}"}
            </span>
          </div>
          <span className="w-full truncate text-xs">{entry.name}</span>
        </button>
      ))}
    </div>
  );
}
