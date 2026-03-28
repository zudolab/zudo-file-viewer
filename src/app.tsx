import { useState, useCallback, useEffect, useRef } from "react";
import { SettingsProvider, useSettings } from "@/settings-context";
import { FileTree } from "@/components/file-tree";
import { Viewer } from "@/components/viewer";
import { Toast } from "@/components/toast";
import { useDirectory } from "@/hooks/use-directory";
import { useDirectoryWatcher } from "@/hooks/use-directory-watcher";
import type { FileEntry } from "@/types";
import { isImageExtension, isHeicExtension } from "@/types";

function AppContent() {
  const settings = useSettings();
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [currentDir, setCurrentDir] = useState<string>(
    settings.rootDirectory || "/",
  );
  const { entries, refresh } = useDirectory(currentDir);
  const watcher = useDirectoryWatcher(currentDir, refresh);

  // Sync currentDir when settings.rootDirectory becomes available after async load
  const initialSyncDone = useRef(false);
  useEffect(() => {
    if (!initialSyncDone.current && settings.rootDirectory) {
      initialSyncDone.current = true;
      setCurrentDir(settings.rootDirectory);
    }
  }, [settings.rootDirectory]);

  const handleFileSelect = useCallback(
    (path: string) => {
      const found = entries.find((e) => e.path === path);
      if (found) {
        setSelectedFile(found);
      } else {
        // File is in a nested directory — create a minimal FileEntry from path
        const name = path.split("/").pop() ?? path;
        const ext = name.includes(".")
          ? (name.split(".").pop()?.toLowerCase() ?? "")
          : "";
        setSelectedFile({
          name,
          path,
          fileType: "file",
          size: 0,
          modifiedAt: "",
          extension: ext,
          isImage: isImageExtension(ext),
          isHeic: isHeicExtension(ext),
        });
      }
    },
    [entries],
  );

  return (
    <div className="flex h-full flex-col">
      {watcher.hasChanges && (
        <Toast
          message="Directory contents changed on disk."
          actions={[
            { label: "Reload", onClick: watcher.reload, primary: true },
            { label: "Dismiss", onClick: watcher.dismiss },
          ]}
        />
      )}

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
          />
        </div>

        {/* Viewer */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-base-alt">
          <Viewer
            selectedFile={selectedFile}
            entries={entries}
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
