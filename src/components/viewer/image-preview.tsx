import { useFilePreview } from "@/hooks/use-file-preview";
import { formatFileSize } from "@/utils/format";

export interface ImagePreviewProps {
  filePath: string;
  fileName: string;
  extension: string;
  fileSize: number;
  isHeic: boolean;
}

export default function ImagePreview({
  filePath,
  fileName,
  extension,
  fileSize,
  isHeic,
}: ImagePreviewProps) {
  const { imageUrl, dimensions, loading, error } = useFilePreview(
    filePath,
    extension,
  );

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-md text-muted">
        <div
          className="h-[32px] w-[32px] rounded-full border-[3px] border-surface border-t-accent"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <span className="text-sm">
          {isHeic ? "Converting HEIC image…" : "Loading image…"}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-md text-danger">
        <span className="text-xl">⚠</span>
        <span className="text-sm">Failed to load image</span>
        <span className="max-w-[400px] text-center text-xs text-muted">
          {error}
        </span>
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex min-h-0 flex-1 items-center justify-center p-lg">
        <img
          src={imageUrl}
          alt={fileName}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="flex shrink-0 items-center gap-xl bg-base/80 px-lg py-sm text-xs text-muted backdrop-blur-sm">
        <span className="font-medium text-fg">{fileName}</span>
        {dimensions && (
          <span>
            {dimensions.width} × {dimensions.height}
          </span>
        )}
        <span>{formatFileSize(fileSize)}</span>
        {isHeic && (
          <span className="rounded-sm bg-accent-subtle px-xs py-2xs text-[10px] font-semibold uppercase text-fg">
            HEIC
          </span>
        )}
      </div>
    </div>
  );
}
