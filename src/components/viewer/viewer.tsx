import type { FileEntry } from "@/types";

export interface ViewerProps {
  selectedFile: FileEntry | null;
  currentDir: string;
  entries: FileEntry[];
  viewMode: "grid" | "list";
}

export default function Viewer(props: ViewerProps) {
  return (
    <div className="flex h-full items-center justify-center">
      {props.selectedFile ? (
        <div className="text-center text-muted">
          <p className="text-sm">Viewing: {props.selectedFile.name}</p>
          <p className="text-xs">{props.selectedFile.path}</p>
        </div>
      ) : (
        <div className="text-center text-muted">
          <p className="text-sm">
            {props.entries.length > 0
              ? `${props.entries.length} items in ${props.currentDir}`
              : "Select a file to preview"}
          </p>
          <p className="mt-sm text-xs">View: {props.viewMode}</p>
        </div>
      )}
    </div>
  );
}
