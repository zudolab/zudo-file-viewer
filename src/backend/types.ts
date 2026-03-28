import type { AppSettings, FileEntry, FileInfo } from "@/types";

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
