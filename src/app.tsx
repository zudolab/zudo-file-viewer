import { useState, useCallback } from "react";
import { SettingsProvider, useSettings } from "@/settings-context";
import { FileTree } from "@/components/file-tree";
import { Viewer } from "@/components/viewer";
import { useDirectory } from "@/hooks/use-directory";
import type { FileEntry } from "@/types";

function AppContent() {
  const settings = useSettings();
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [currentDir, setCurrentDir] = useState<string>(
    settings.rootDirectory || "/",
  );
  const { entries } = useDirectory(currentDir);

  const handleFileSelect = useCallback(
    (path: string) => {
      // Try current directory entries first, then fall back to a backend lookup
      const found = entries.find((e) => e.path === path);
      if (found) {
        setSelectedFile(found);
      } else {
        // File is in a nested directory — create a minimal FileEntry from path
        const name = path.split("/").pop() ?? path;
        const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "" : "";
        const imageExts = new Set(["jpg","jpeg","png","gif","webp","bmp","svg","tiff","tif","ico","avif","heic","heif"]);
        const heicExts = new Set(["heic","heif"]);
        setSelectedFile({
          name,
          path,
          fileType: "file",
          size: 0,
          modifiedAt: "",
          extension: ext,
          isImage: imageExts.has(ext),
          isHeic: heicExts.has(ext),
        });
      }
    },
    [entries],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-[var(--toolbar-height)] shrink-0 items-center gap-md border-b border-edge bg-base-alt px-lg">
        <span className="text-sm font-semibold text-fg">zudo-file-viewer</span>
        <span className="min-w-0 flex-1 truncate text-sm text-muted">
          {currentDir}
        </span>
      </div>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="w-[var(--sidebar-width)] shrink-0 overflow-y-auto border-r border-edge bg-base">
          <FileTree
            rootPath={currentDir}
            selectedPath={selectedFile?.path ?? null}
            onSelect={handleFileSelect}
            onDirectoryChange={setCurrentDir}
          />
        </div>

        {/* Viewer */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-base-alt">
          <Viewer
            selectedFile={selectedFile}
            currentDir={currentDir}
            entries={entries}
            viewMode={settings.viewMode}
            onDirectoryChange={setCurrentDir}
            onSelect={handleFileSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
