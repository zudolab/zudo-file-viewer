import type { FileEntry } from "@/types";
import { useSettings } from "@/settings-context";
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

  if (!selectedFile) {
    if (entries.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted">Select a file to preview</p>
        </div>
      );
    }

    return (
      <ThumbnailGrid
        entries={entries}
        selectedPath={null}
        onSelect={onSelect}
        onDirectoryChange={onDirectoryChange}
        thumbnailSize={settings.thumbnailSize}
      />
    );
  }

  if (selectedFile.fileType === "directory") {
    return (
      <ThumbnailGrid
        entries={entries}
        selectedPath={selectedFile.path}
        onSelect={onSelect}
        onDirectoryChange={onDirectoryChange}
        thumbnailSize={settings.thumbnailSize}
      />
    );
  }

  if (selectedFile.isImage) {
    return (
      <ImagePreview
        filePath={selectedFile.path}
        fileName={selectedFile.name}
        extension={selectedFile.extension}
        fileSize={selectedFile.size}
        isHeic={selectedFile.isHeic}
      />
    );
  }

  return (
    <FileInfo
      fileName={selectedFile.name}
      filePath={selectedFile.path}
      extension={selectedFile.extension}
      fileSize={selectedFile.size}
      modifiedAt={selectedFile.modifiedAt}
    />
  );
}
