export interface FileTreeProps {
  rootPath: string;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onDirectoryChange: (path: string) => void;
}

export default function FileTree(props: FileTreeProps) {
  return (
    <nav className="h-full overflow-y-auto">
      <div className="p-lg text-sm text-muted">
        File tree: {props.rootPath}
        <br />
        Selected: {props.selectedPath ?? "none"}
      </div>
    </nav>
  );
}
