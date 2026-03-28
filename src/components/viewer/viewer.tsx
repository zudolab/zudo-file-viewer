import { useState, useEffect, useRef, useCallback } from "react";
import type { FileEntry } from "@/types";
import { useSettings, useSettingsUpdate } from "@/settings-context";
import ImagePreview from "./image-preview";
import FileInfo from "./file-info";
import ThumbnailGrid from "@/components/thumbnail-grid";

const NOOP = () => {};

export interface ViewerProps {
  selectedFile: FileEntry | null;
  currentDir: string;
  entries: FileEntry[];
  viewMode: "grid" | "list";
  onDirectoryChange?: (path: string) => void;
  onSelect?: (path: string) => void;
}

export default function Viewer({
  selectedFile,
  currentDir: _currentDir,
  entries,
  viewMode: _viewMode,
  onDirectoryChange = NOOP,
  onSelect = NOOP,
}: ViewerProps) {
  const settings = useSettings();
  const updateSettings = useSettingsUpdate();
  const [thumbnailSize, setThumbnailSize] = useState(settings.thumbnailSize);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setThumbnailSize(settings.thumbnailSize);
  }, [settings.thumbnailSize]);

  const handleThumbnailSizeChange = useCallback(
    (size: number) => {
      setThumbnailSize(size);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateSettings({ ...settings, thumbnailSize: size });
      }, 300);
    },
    [settings, updateSettings],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showGrid =
    !selectedFile || selectedFile.fileType === "directory"
      ? entries.length > 0
      : false;

  if (!selectedFile && entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted">Select a file to preview</p>
      </div>
    );
  }

  if (showGrid) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-end border-b border-edge px-lg py-xs">
          <div className="flex items-center gap-sm">
            <input
              type="range"
              min={80}
              max={240}
              step={8}
              value={thumbnailSize}
              onChange={(e) =>
                handleThumbnailSizeChange(Number(e.target.value))
              }
              className="w-[120px] accent-accent"
            />
            <span className="text-xs text-muted">{thumbnailSize}px</span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ThumbnailGrid
            entries={entries}
            selectedPath={selectedFile?.path ?? null}
            onSelect={onSelect}
            onDirectoryChange={onDirectoryChange}
            thumbnailSize={thumbnailSize}
          />
        </div>
      </div>
    );
  }

  if (selectedFile!.isImage) {
    return (
      <ImagePreview
        filePath={selectedFile!.path}
        fileName={selectedFile!.name}
        extension={selectedFile!.extension}
        fileSize={selectedFile!.size}
        isHeic={selectedFile!.isHeic}
      />
    );
  }

  return (
    <FileInfo
      fileName={selectedFile!.name}
      filePath={selectedFile!.path}
      extension={selectedFile!.extension}
      fileSize={selectedFile!.size}
      modifiedAt={selectedFile!.modifiedAt}
    />
  );
}
