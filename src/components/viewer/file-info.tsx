import { formatFileSize, formatDate, getFileTypeLabel } from "@/utils/format";

export interface FileInfoProps {
  fileName: string;
  filePath: string;
  extension: string;
  fileSize: number;
  modifiedAt: string;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "📕",
  txt: "📝",
  md: "📝",
  json: "📋",
  csv: "📊",
  xml: "📋",
  js: "📜",
  ts: "📜",
  jsx: "📜",
  tsx: "📜",
  html: "🌐",
  css: "🎨",
  rs: "⚙",
  py: "🐍",
  go: "⚙",
  zip: "📦",
  tar: "📦",
  gz: "📦",
  mp4: "🎬",
  mov: "🎬",
  mp3: "🎵",
  wav: "🎵",
};

function getFileIcon(extension: string): string {
  if (!extension) return "📄";
  return FILE_TYPE_ICONS[extension.toLowerCase()] ?? "📄";
}

export default function FileInfo({
  fileName,
  filePath,
  extension,
  fileSize,
  modifiedAt,
}: FileInfoProps) {
  return (
    <div className="flex h-full items-center justify-center p-xl">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-xl rounded-lg bg-surface p-3xl">
        <span className="text-[48px] leading-tight">{getFileIcon(extension)}</span>
        <div className="flex w-full flex-col items-center gap-sm text-center">
          <span className="text-sm font-semibold text-fg">{fileName}</span>
          <span className="text-xs text-muted">
            {getFileTypeLabel(extension)}
          </span>
        </div>
        <div className="flex w-full flex-col gap-sm text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Size</span>
            <span className="text-fg">{formatFileSize(fileSize)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Modified</span>
            <span className="text-fg">{formatDate(modifiedAt)}</span>
          </div>
          <div className="flex justify-between gap-lg">
            <span className="shrink-0 text-muted">Path</span>
            <span className="truncate text-fg">{filePath}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
