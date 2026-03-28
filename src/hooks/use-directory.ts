import { useState, useEffect, useCallback } from "react";
import type { FileEntry } from "@/types";
import { getBackend } from "@/backend";

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

  const loadDirectory = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getBackend().files.listDirectory(path);
      setEntries(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  return { entries, loading, error, refresh: loadDirectory };
}
