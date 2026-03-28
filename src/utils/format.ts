const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${SIZE_UNITS[unitIndex]}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const FILE_TYPE_LABELS: Record<string, string> = {
  jpg: "JPEG Image",
  jpeg: "JPEG Image",
  png: "PNG Image",
  gif: "GIF Image",
  webp: "WebP Image",
  svg: "SVG Image",
  bmp: "BMP Image",
  tiff: "TIFF Image",
  tif: "TIFF Image",
  ico: "Icon",
  avif: "AVIF Image",
  heic: "HEIC Image",
  heif: "HEIF Image",
  pdf: "PDF Document",
  txt: "Text File",
  md: "Markdown",
  json: "JSON File",
  csv: "CSV File",
  xml: "XML File",
  yaml: "YAML File",
  yml: "YAML File",
  js: "JavaScript",
  ts: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  html: "HTML",
  css: "CSS",
  rs: "Rust",
  py: "Python",
  go: "Go",
  zip: "ZIP Archive",
  tar: "TAR Archive",
  gz: "GZip Archive",
  mp4: "MP4 Video",
  mov: "MOV Video",
  mp3: "MP3 Audio",
  wav: "WAV Audio",
};

export function getFileTypeLabel(extension: string): string {
  if (!extension) return "File";
  const lower = extension.toLowerCase();
  const label = FILE_TYPE_LABELS[lower];
  if (label) return label;
  return `${extension.toUpperCase()} File`;
}
