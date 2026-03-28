import { useState, useEffect } from "react";
import type { FileEntry } from "@/types";
import { getBackend } from "@/backend";

interface ThumbnailGridProps {
  entries: FileEntry[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onDirectoryChange: (path: string) => void;
  thumbnailSize: number;
}

export default function ThumbnailGrid({
  entries,
  selectedPath,
  onSelect,
  onDirectoryChange,
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
        <ThumbnailItem
          key={entry.path}
          entry={entry}
          size={thumbnailSize}
          selected={selectedPath === entry.path}
          onSelect={onSelect}
          onDirectoryChange={onDirectoryChange}
        />
      ))}
    </div>
  );
}

interface ThumbnailItemProps {
  entry: FileEntry;
  size: number;
  selected: boolean;
  onSelect: (path: string) => void;
  onDirectoryChange: (path: string) => void;
}

function ThumbnailItem({
  entry,
  size,
  selected,
  onSelect,
  onDirectoryChange,
}: ThumbnailItemProps) {
  const handleDoubleClick = () => {
    if (entry.fileType === "directory") {
      onDirectoryChange(entry.path);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.path)}
      onDoubleClick={handleDoubleClick}
      className={`flex flex-col items-center gap-xs rounded-lg p-sm text-center transition-colors ${
        selected
          ? "ring-2 ring-accent bg-accent-subtle"
          : "hover:bg-surface"
      }`}
    >
      <ThumbnailContent entry={entry} size={size} />
      <span className="w-full truncate text-xs">{entry.name}</span>
    </button>
  );
}

interface ThumbnailContentProps {
  entry: FileEntry;
  size: number;
}

function ThumbnailContent({ entry, size }: ThumbnailContentProps) {
  if (entry.fileType === "directory") {
    return (
      <div
        className="flex items-center justify-center rounded-md bg-surface"
        style={{ width: size, height: size }}
      >
        <span className="text-2xl">📁</span>
      </div>
    );
  }

  if (entry.isImage) {
    return <LazyThumbnail path={entry.path} size={size} />;
  }

  return (
    <div
      className="flex items-center justify-center rounded-md bg-surface"
      style={{ width: size, height: size }}
    >
      <span className="text-2xl">📄</span>
    </div>
  );
}

interface LazyThumbnailProps {
  path: string;
  size: number;
}

function LazyThumbnail({ path, size }: LazyThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setThumbnailUrl(null);
    setLoading(true);
    setError(false);

    getBackend()
      .images.getThumbnail(path, size)
      .then((url) => {
        if (!cancelled) {
          setThumbnailUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, size]);

  if (loading) {
    return (
      <div
        className="animate-pulse rounded-md bg-surface"
        style={{ width: size, height: size }}
      />
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-md bg-surface"
        style={{ width: size, height: size }}
      >
        <span className="text-2xl text-muted">🖼</span>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-md bg-surface"
      style={{ width: size, height: size }}
    >
      <img
        src={thumbnailUrl}
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
  );
}
