import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { BackendAPI, ImageDataResponse } from "./types";
import type { AppSettings, FileEntry, FileInfo } from "@/types";

export function createTauriAdapter(): BackendAPI {
  return {
    files: {
      listDirectory: (
        path: string,
        options?: { showHidden?: boolean; sortBy?: string; sortOrder?: string },
      ) =>
        invoke<FileEntry[]>("list_directory", {
          path,
          showHidden: options?.showHidden,
          sortBy: options?.sortBy,
          sortOrder: options?.sortOrder,
        }),
      getFileInfo: (path: string) =>
        invoke<FileInfo>("get_file_info", { path }),
      watchDirectory: (path: string) =>
        invoke<void>("watch_directory", { path }),
      unwatchDirectory: () => invoke<void>("unwatch_directory"),
      onDirectoryChanged: (cb: () => void) => {
        let unlisten: (() => void) | null = null;
        listen("directory:changed", () => cb()).then((u) => {
          unlisten = u;
        });
        return () => {
          unlisten?.();
        };
      },
    },
    images: {
      getThumbnail: (path: string, size: number) =>
        invoke<string>("get_thumbnail", { path, size }),
      getImageData: async (path: string) => {
        const resp = await invoke<ImageDataResponse>("get_image_data", {
          path,
        });
        if (resp.type === "base64") return resp.data;
        return convertFileSrc(resp.path);
      },
      getImageDimensions: (path: string) =>
        invoke<{ width: number; height: number }>("get_image_dimensions", {
          path,
        }),
    },
    settings: {
      get: () => invoke<AppSettings | null>("get_settings"),
      save: (settings: AppSettings) =>
        invoke<boolean>("save_settings", { settings }),
    },
    dialog: {
      openDirectory: async () => {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const result = await open({ directory: true });
        return result ?? null;
      },
    },
  };
}
