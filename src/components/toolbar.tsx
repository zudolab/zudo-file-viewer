interface ToolbarProps {
  currentDir: string;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onSettingsOpen: () => void;
}

export default function Toolbar({
  currentDir,
  viewMode,
  onViewModeChange,
  onSettingsOpen,
}: ToolbarProps) {
  return (
    <div className="flex h-[var(--toolbar-height)] shrink-0 items-center gap-md border-b border-edge bg-base-alt px-lg">
      <span className="text-sm font-semibold text-fg">zudo-file-viewer</span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted">
        {currentDir}
      </span>
      <div className="flex items-center gap-xs">
        <button
          type="button"
          onClick={() =>
            onViewModeChange(viewMode === "grid" ? "list" : "grid")
          }
          className="rounded-md px-sm py-xs text-xs text-muted hover:bg-surface hover:text-fg"
        >
          {viewMode === "grid" ? "List" : "Grid"}
        </button>
        <button
          type="button"
          onClick={onSettingsOpen}
          className="rounded-md px-sm py-xs text-xs text-muted hover:bg-surface hover:text-fg"
        >
          Settings
        </button>
      </div>
    </div>
  );
}
