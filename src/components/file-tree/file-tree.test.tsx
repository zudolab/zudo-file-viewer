import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FileTree from "./file-tree";
import type { FileEntry } from "@/types";

const mockListDirectory = vi.fn();

vi.mock("@/backend", () => ({
  getBackend: () => ({
    files: {
      listDirectory: (...args: unknown[]) => mockListDirectory(...args),
    },
  }),
}));

const rootEntries: FileEntry[] = [
  {
    name: "photos",
    path: "/root/photos",
    fileType: "directory",
    size: 0,
    modifiedAt: "",
    extension: "",
    isImage: false,
    isHeic: false,
  },
  {
    name: "documents",
    path: "/root/documents",
    fileType: "directory",
    size: 0,
    modifiedAt: "",
    extension: "",
    isImage: false,
    isHeic: false,
  },
  {
    name: "image.jpg",
    path: "/root/image.jpg",
    fileType: "file",
    size: 1000,
    modifiedAt: "",
    extension: "jpg",
    isImage: true,
    isHeic: false,
  },
  {
    name: "doc.txt",
    path: "/root/doc.txt",
    fileType: "file",
    size: 100,
    modifiedAt: "",
    extension: "txt",
    isImage: false,
    isHeic: false,
  },
];

const photoEntries: FileEntry[] = [
  {
    name: "sunset.jpg",
    path: "/root/photos/sunset.jpg",
    fileType: "file",
    size: 2000,
    modifiedAt: "",
    extension: "jpg",
    isImage: true,
    isHeic: false,
  },
  {
    name: "portrait.HEIC",
    path: "/root/photos/portrait.HEIC",
    fileType: "file",
    size: 3000,
    modifiedAt: "",
    extension: "heic",
    isImage: true,
    isHeic: true,
  },
];

describe("FileTree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockListDirectory.mockImplementation(async (path: string) => {
      if (path === "/root") return rootEntries;
      if (path === "/root/photos") return photoEntries;
      return [];
    });
  });

  it("renders root entries", async () => {
    render(
      <FileTree
        rootPath="/root"
        selectedPath={null}
        onSelect={vi.fn()}

      />,
    );

    await waitFor(() => {
      expect(screen.getByText("photos")).toBeDefined();
      expect(screen.getByText("documents")).toBeDefined();
      expect(screen.getByText("image.jpg")).toBeDefined();
      expect(screen.getByText("doc.txt")).toBeDefined();
    });

    // Directories should appear before files in the DOM
    const allText = document.body.textContent ?? "";
    const photosPos = allText.indexOf("photos");
    const imagePos = allText.indexOf("image.jpg");
    expect(photosPos).toBeLessThan(imagePos);
  });

  it("expands directory on click and loads children", async () => {
    render(
      <FileTree
        rootPath="/root"
        selectedPath={null}
        onSelect={vi.fn()}

      />,
    );

    await waitFor(() => {
      expect(screen.getByText("photos")).toBeDefined();
    });

    // Children should not be visible yet
    expect(screen.queryByText("sunset.jpg")).toBeNull();

    // Click to expand
    fireEvent.click(screen.getByText("photos"));

    await waitFor(() => {
      expect(screen.getByText("sunset.jpg")).toBeDefined();
      expect(screen.getByText("portrait.HEIC")).toBeDefined();
    });

    expect(mockListDirectory).toHaveBeenCalledWith("/root/photos");
  });

  it("calls onSelect when file is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <FileTree
        rootPath="/root"
        selectedPath={null}
        onSelect={onSelect}

      />,
    );

    await waitFor(() => {
      expect(screen.getByText("image.jpg")).toBeDefined();
    });

    fireEvent.click(screen.getByText("image.jpg"));

    expect(onSelect).toHaveBeenCalledWith("/root/image.jpg");
  });

  it("filters items by query", async () => {
    render(
      <FileTree
        rootPath="/root"
        selectedPath={null}
        onSelect={vi.fn()}

      />,
    );

    await waitFor(() => {
      expect(screen.getByText("image.jpg")).toBeDefined();
    });

    const input = screen.getByPlaceholderText("Filter...");
    fireEvent.change(input, { target: { value: "image" } });

    // image.jpg should remain visible
    expect(screen.getByText("image.jpg")).toBeDefined();
    // doc.txt and directories not matching should be hidden
    expect(screen.queryByText("doc.txt")).toBeNull();
    expect(screen.queryByText("documents")).toBeNull();
  });

  it("highlights selected file with aria-selected", async () => {
    render(
      <FileTree
        rootPath="/root"
        selectedPath="/root/image.jpg"
        onSelect={vi.fn()}

      />,
    );

    await waitFor(() => {
      expect(screen.getByText("image.jpg")).toBeDefined();
    });

    const button = screen.getByText("image.jpg").closest("button");
    expect(button?.getAttribute("aria-selected")).toBe("true");

    // Non-selected file should not have aria-selected=true
    const docButton = screen.getByText("doc.txt").closest("button");
    expect(docButton?.getAttribute("aria-selected")).toBe("false");
  });
});
