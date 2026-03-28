import { useState } from "react";
import { SettingsProvider, useSettings } from "@/settings-context";
import { FileTree } from "@/components/file-tree";
import { Viewer } from "@/components/viewer";
import { useDirectory } from "@/hooks/use-directory";

function AppContent() {
  const settings = useSettings();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [currentDir, setCurrentDir] = useState<string>(
    settings.rootDirectory || "/",
  );
  const { entries } = useDirectory(currentDir);

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
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
            onDirectoryChange={setCurrentDir}
          />
        </div>

        {/* Viewer */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-base-alt">
          <Viewer
            selectedFile={entries.find((e) => e.path === selectedPath) ?? null}
            currentDir={currentDir}
            entries={entries}
            viewMode={settings.viewMode}
            onDirectoryChange={setCurrentDir}
            onSelect={setSelectedPath}
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
