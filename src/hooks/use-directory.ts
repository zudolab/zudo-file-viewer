import { useState, useEffect, useCallback } from "react";
import type { FileEntry } from "@/types";
import { getBackend } from "@/backend";

const MAX_CACHE_SIZE = 50;
const directoryCache = new Map<string, FileEntry[]>();

function cacheSet(key: string, value: FileEntry[]) {
  if (directoryCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry (first key in Map iteration order)
    const oldest = directoryCache.keys().next().value;
    if (oldest !== undefined) directoryCache.delete(oldest);
  }
  directoryCache.set(key, value);
}

interface UseDirectoryResult {
  entries: FileEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDirectory(path: string): UseDirectoryResult {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;

    const cached = directoryCache.get(path);
    if (cached) {
      setEntries(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    getBackend()
      .files.listDirectory(path)
      .then((result) => {
        if (cancelled) return;
        cacheSet(path, result);
        setEntries(result);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  const refresh = useCallback(() => {
    if (!path) return;
    directoryCache.delete(path);
    setLoading(true);
    setError(null);
    getBackend()
      .files.listDirectory(path)
      .then((result) => {
        cacheSet(path, result);
        setEntries(result);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
        setEntries([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [path]);

  return { entries, loading, error, refresh };
}

export function clearDirectoryCache(path?: string): void {
  if (path) {
    directoryCache.delete(path);
  } else {
    directoryCache.clear();
  }
}
