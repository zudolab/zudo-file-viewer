import type { BackendAPI } from "./types";
import type { AppSettings, FileEntry } from "@/types";
import { defaultSettings } from "@/types";

const MOCK_FILES: FileEntry[] = [
  {
    name: "photos",
    path: "/mock/photos",
    fileType: "directory",
    size: 0,
    modifiedAt: "2026-03-28T10:00:00Z",
    extension: "",
    isImage: false,
    isHeic: false,
  },
  {
    name: "documents",
    path: "/mock/documents",
    fileType: "directory",
    size: 0,
    modifiedAt: "2026-03-27T15:00:00Z",
    extension: "",
    isImage: false,
    isHeic: false,
  },
  {
    name: "landscape.jpg",
    path: "/mock/landscape.jpg",
    fileType: "file",
    size: 2048000,
    modifiedAt: "2026-03-26T12:00:00Z",
    extension: "jpg",
    isImage: true,
    isHeic: false,
  },
  {
    name: "IMG_0001.HEIC",
    path: "/mock/IMG_0001.HEIC",
    fileType: "file",
    size: 3500000,
    modifiedAt: "2026-03-25T08:30:00Z",
    extension: "heic",
    isImage: true,
    isHeic: true,
  },
  {
    name: "portrait.png",
    path: "/mock/portrait.png",
    fileType: "file",
    size: 1500000,
    modifiedAt: "2026-03-24T16:00:00Z",
    extension: "png",
    isImage: true,
    isHeic: false,
  },
  {
    name: "readme.txt",
    path: "/mock/readme.txt",
    fileType: "file",
    size: 1024,
    modifiedAt: "2026-03-23T09:00:00Z",
    extension: "txt",
    isImage: false,
    isHeic: false,
  },
  {
    name: "notes.md",
    path: "/mock/notes.md",
    fileType: "file",
    size: 512,
    modifiedAt: "2026-03-22T14:00:00Z",
    extension: "md",
    isImage: false,
    isHeic: false,
  },
];

const MOCK_SUBDIR_FILES: FileEntry[] = [
  {
    name: "vacation.jpg",
    path: "/mock/photos/vacation.jpg",
    fileType: "file",
    size: 4096000,
    modifiedAt: "2026-03-20T11:00:00Z",
    extension: "jpg",
    isImage: true,
    isHeic: false,
  },
  {
    name: "sunset.HEIC",
    path: "/mock/photos/sunset.HEIC",
    fileType: "file",
    size: 5200000,
    modifiedAt: "2026-03-19T18:00:00Z",
    extension: "heic",
    isImage: true,
    isHeic: true,
  },
  {
    name: "family.png",
    path: "/mock/photos/family.png",
    fileType: "file",
    size: 2800000,
    modifiedAt: "2026-03-18T13:00:00Z",
    extension: "png",
    isImage: true,
    isHeic: false,
  },
];

// 1x1 transparent PNG as placeholder thumbnail
const PLACEHOLDER_THUMBNAIL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==";

let mockSettings: AppSettings = { ...defaultSettings, rootDirectory: "/mock" };

export function createMockAdapter(): BackendAPI {
  return {
    files: {
      listDirectory: async (path: string, _options?: { showHidden?: boolean; sortBy?: string; sortOrder?: string }) => {
        await delay(100);
        if (path === "/mock/photos") return MOCK_SUBDIR_FILES;
        if (path === "/mock/documents") return [];
        return MOCK_FILES;
      },
      getFileInfo: async (path: string) => {
        await delay(50);
        const all = [...MOCK_FILES, ...MOCK_SUBDIR_FILES];
        const found = all.find((f) => f.path === path);
        if (!found) throw new Error(`File not found: ${path}`);
        return { ...found, width: 1920, height: 1080 };
      },
      watchDirectory: async () => {},
      unwatchDirectory: async () => {},
      onDirectoryChanged: () => () => {},
    },
    images: {
      getThumbnail: async () => {
        await delay(200);
        return PLACEHOLDER_THUMBNAIL;
      },
      getImageData: async () => {
        await delay(300);
        return PLACEHOLDER_THUMBNAIL;
      },
      getImageDimensions: async () => {
        await delay(50);
        return { width: 1920, height: 1080 };
      },
    },
    settings: {
      get: async () => mockSettings,
      save: async (settings: AppSettings) => {
        mockSettings = settings;
        return true;
      },
    },
    dialog: {
      openDirectory: async () => "/mock/selected-dir",
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
