import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Viewer from "./viewer";
import type { FileEntry } from "@/types";

const mockBackend = {
  files: {
    listDirectory: vi.fn().mockResolvedValue([]),
    getFileInfo: vi.fn().mockResolvedValue({}),
    watchDirectory: vi.fn().mockResolvedValue(undefined),
    unwatchDirectory: vi.fn().mockResolvedValue(undefined),
    onDirectoryChanged: vi.fn().mockReturnValue(() => {}),
  },
  images: {
    getThumbnail: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
    getImageData: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
    getImageDimensions: vi
      .fn()
      .mockResolvedValue({ width: 1920, height: 1080 }),
  },
  settings: {
    get: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(true),
  },
  dialog: {
    openDirectory: vi.fn().mockResolvedValue(null),
  },
};

vi.mock("@/backend", () => ({
  getBackend: () => mockBackend,
  initBackend: vi.fn(),
}));

vi.mock("@/settings-context", () => ({
  useSettings: () => ({
    rootDirectory: "/mock",
    showHidden: false,
    sortBy: "name" as const,
    sortOrder: "asc" as const,
    thumbnailSize: 120,
  }),
}));

const makeEntry = (overrides: Partial<FileEntry>): FileEntry => ({
  name: "test.txt",
  path: "/mock/test.txt",
  fileType: "file",
  size: 1024,
  modifiedAt: "2026-03-28T10:00:00Z",
  extension: "txt",
  isImage: false,
  isHeic: false,
  ...overrides,
});

describe("Viewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Select a file" when no file selected and no entries', () => {
    render(
      <Viewer
        selectedFile={null}

        entries={[]}

      />,
    );
    expect(screen.getByText("Select a file to preview")).toBeTruthy();
  });

  it("shows thumbnail grid when no file selected but entries exist", () => {
    const entries = [
      makeEntry({ name: "photo.jpg", path: "/mock/photo.jpg", extension: "jpg", isImage: true }),
      makeEntry({ name: "docs", path: "/mock/docs", fileType: "directory" }),
    ];
    render(
      <Viewer
        selectedFile={null}

        entries={entries}

      />,
    );
    expect(screen.getByText("photo.jpg")).toBeTruthy();
    expect(screen.getByText("docs")).toBeTruthy();
  });

  it("shows image preview when image file selected", () => {
    const imageFile = makeEntry({
      name: "landscape.jpg",
      path: "/mock/landscape.jpg",
      extension: "jpg",
      isImage: true,
      size: 2048000,
    });
    render(
      <Viewer
        selectedFile={imageFile}

        entries={[imageFile]}

      />,
    );
    // Should show loading initially
    expect(screen.getByText("Loading image…")).toBeTruthy();
  });

  it("shows HEIC loading message for HEIC files", () => {
    const heicFile = makeEntry({
      name: "IMG_0001.HEIC",
      path: "/mock/IMG_0001.HEIC",
      extension: "heic",
      isImage: true,
      isHeic: true,
      size: 3500000,
    });
    render(
      <Viewer
        selectedFile={heicFile}

        entries={[heicFile]}

      />,
    );
    expect(screen.getByText("Converting HEIC image…")).toBeTruthy();
  });

  it("shows file info when non-image file selected", () => {
    const txtFile = makeEntry({
      name: "readme.txt",
      path: "/mock/readme.txt",
      extension: "txt",
      size: 1024,
    });
    render(
      <Viewer
        selectedFile={txtFile}

        entries={[txtFile]}

      />,
    );
    expect(screen.getByText("readme.txt")).toBeTruthy();
    expect(screen.getByText("Text File")).toBeTruthy();
    expect(screen.getByText("1.0 KB")).toBeTruthy();
    expect(screen.getByText("Mar 28, 2026")).toBeTruthy();
  });

  it("shows thumbnail grid when a directory is selected", () => {
    const dirEntry = makeEntry({
      name: "photos",
      path: "/mock/photos",
      fileType: "directory",
    });
    const entries = [
      dirEntry,
      makeEntry({ name: "test.txt", path: "/mock/test.txt" }),
    ];
    render(
      <Viewer
        selectedFile={dirEntry}

        entries={entries}

      />,
    );
    expect(screen.getByText("photos")).toBeTruthy();
    expect(screen.getByText("test.txt")).toBeTruthy();
  });
});
