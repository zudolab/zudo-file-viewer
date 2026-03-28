import type { AppSettings, FileEntry, FileInfo } from "@/types";

/** Tagged response from Rust backend for image data.
 * - "path": browser-native format, use convertFileSrc() or asset URL
 * - "base64": HEIC converted to PNG, use data URL directly */
export type ImageDataResponse =
  | { type: "path"; path: string; mime: string }
  | { type: "base64"; data: string };

export interface BackendAPI {
  files: {
    listDirectory: (path: string) => Promise<FileEntry[]>;
    getFileInfo: (path: string) => Promise<FileInfo>;
    watchDirectory: (path: string) => Promise<void>;
    unwatchDirectory: () => Promise<void>;
    onDirectoryChanged: (cb: () => void) => () => void;
  };
  images: {
    getThumbnail: (path: string, size: number) => Promise<string>;
    /** Returns a URL suitable for <img src>. Handles the tagged enum from Rust. */
    getImageData: (path: string) => Promise<string>;
    getImageDimensions: (
      path: string,
    ) => Promise<{ width: number; height: number }>;
  };
  settings: {
    get: () => Promise<AppSettings | null>;
    save: (settings: AppSettings) => Promise<boolean>;
  };
  dialog: {
    openDirectory: () => Promise<string | null>;
  };
}
