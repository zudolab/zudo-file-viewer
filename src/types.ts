export interface FileEntry {
  name: string;
  path: string;
  fileType: "file" | "directory" | "symlink";
  size: number;
  modifiedAt: string;
  extension: string;
  isImage: boolean;
  isHeic: boolean;
}

export interface FileInfo extends FileEntry {
  width?: number;
  height?: number;
}

export interface AppSettings {
  rootDirectory: string;
  showHidden: boolean;
  sortBy: "name" | "date" | "size" | "type";
  sortOrder: "asc" | "desc";
  viewMode: "grid" | "list";
  thumbnailSize: number;
}

export const defaultSettings: AppSettings = {
  rootDirectory: "",
  showHidden: false,
  sortBy: "name",
  sortOrder: "asc",
  viewMode: "grid",
  thumbnailSize: 120,
};

export const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "tiff",
  "tif",
  "ico",
  "avif",
]);

export const HEIC_EXTENSIONS = new Set(["heic", "heif"]);

export function isImageExtension(ext: string): boolean {
  const lower = ext.toLowerCase();
  return IMAGE_EXTENSIONS.has(lower) || HEIC_EXTENSIONS.has(lower);
}

export function isHeicExtension(ext: string): boolean {
  return HEIC_EXTENSIONS.has(ext.toLowerCase());
}
