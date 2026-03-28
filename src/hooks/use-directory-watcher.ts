import { useState, useEffect, useCallback, useRef } from "react";
import { getBackend } from "@/backend";
import { clearDirectoryCache } from "@/hooks/use-directory";

interface UseDirectoryWatcherResult {
  hasChanges: boolean;
  reload: () => void;
  dismiss: () => void;
}

export function useDirectoryWatcher(
  currentDir: string,
  onReload: () => void,
): UseDirectoryWatcherResult {
  const [hasChanges, setHasChanges] = useState(false);
  const onReloadRef = useRef(onReload);
  onReloadRef.current = onReload;

  useEffect(() => {
    if (!currentDir) return;

    setHasChanges(false);

    getBackend().files.watchDirectory(currentDir);
    const unsubscribe = getBackend().files.onDirectoryChanged(() => {
      setHasChanges(true);
    });

    return () => {
      unsubscribe();
      getBackend().files.unwatchDirectory();
    };
  }, [currentDir]);

  const reload = useCallback(() => {
    clearDirectoryCache(currentDir);
    onReloadRef.current();
    setHasChanges(false);
  }, [currentDir]);

  const dismiss = useCallback(() => {
    setHasChanges(false);
  }, []);

  return { hasChanges, reload, dismiss };
}
