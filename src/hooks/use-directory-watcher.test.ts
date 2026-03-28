import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDirectoryWatcher } from "./use-directory-watcher";

const mockWatchDirectory = vi.fn().mockResolvedValue(undefined);
const mockUnwatchDirectory = vi.fn().mockResolvedValue(undefined);
let directoryChangedCallback: (() => void) | null = null;
const mockOnDirectoryChanged = vi.fn((cb: () => void) => {
  directoryChangedCallback = cb;
  return () => {
    directoryChangedCallback = null;
  };
});

vi.mock("@/backend", () => ({
  getBackend: () => ({
    files: {
      watchDirectory: (...args: unknown[]) => mockWatchDirectory(...args),
      unwatchDirectory: (...args: unknown[]) => mockUnwatchDirectory(...args),
      onDirectoryChanged: (cb: () => void) => mockOnDirectoryChanged(cb),
    },
  }),
}));

vi.mock("@/hooks/use-directory", () => ({
  clearDirectoryCache: vi.fn(),
}));

import { clearDirectoryCache } from "@/hooks/use-directory";

describe("useDirectoryWatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    directoryChangedCallback = null;
  });

  it("calls watchDirectory on mount", () => {
    renderHook(() => useDirectoryWatcher("/test/dir", vi.fn()));

    expect(mockWatchDirectory).toHaveBeenCalledWith("/test/dir");
    expect(mockOnDirectoryChanged).toHaveBeenCalled();
  });

  it("calls unwatchDirectory on unmount", () => {
    const { unmount } = renderHook(() =>
      useDirectoryWatcher("/test/dir", vi.fn()),
    );

    unmount();

    expect(mockUnwatchDirectory).toHaveBeenCalled();
  });

  it("sets hasChanges to true when onDirectoryChanged fires", () => {
    const { result } = renderHook(() =>
      useDirectoryWatcher("/test/dir", vi.fn()),
    );

    expect(result.current.hasChanges).toBe(false);

    act(() => {
      directoryChangedCallback?.();
    });

    expect(result.current.hasChanges).toBe(true);
  });

  it("reload calls clearDirectoryCache, onReload, and resets hasChanges", () => {
    const onReload = vi.fn();
    const { result } = renderHook(() =>
      useDirectoryWatcher("/test/dir", onReload),
    );

    // Trigger a change first
    act(() => {
      directoryChangedCallback?.();
    });
    expect(result.current.hasChanges).toBe(true);

    // Call reload
    act(() => {
      result.current.reload();
    });

    expect(clearDirectoryCache).toHaveBeenCalledWith("/test/dir");
    expect(onReload).toHaveBeenCalled();
    expect(result.current.hasChanges).toBe(false);
  });

  it("dismiss resets hasChanges", () => {
    const { result } = renderHook(() =>
      useDirectoryWatcher("/test/dir", vi.fn()),
    );

    act(() => {
      directoryChangedCallback?.();
    });
    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.hasChanges).toBe(false);
  });

  it("re-watches when currentDir changes", () => {
    const { rerender } = renderHook(
      ({ dir }) => useDirectoryWatcher(dir, vi.fn()),
      { initialProps: { dir: "/dir/a" } },
    );

    expect(mockWatchDirectory).toHaveBeenCalledWith("/dir/a");

    rerender({ dir: "/dir/b" });

    expect(mockUnwatchDirectory).toHaveBeenCalled();
    expect(mockWatchDirectory).toHaveBeenCalledWith("/dir/b");
  });
});
