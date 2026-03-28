import { useState, useEffect } from "react";
import { getBackend } from "@/backend";
import { isImageExtension } from "@/types";

interface UseFilePreviewResult {
  imageUrl: string | null;
  dimensions: { width: number; height: number } | null;
  loading: boolean;
  error: string | null;
}

export function useFilePreview(
  filePath: string | null,
  extension: string,
): UseFilePreviewResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath || !isImageExtension(extension)) {
      setImageUrl(null);
      setDimensions(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const backend = getBackend();
        const [url, dims] = await Promise.all([
          backend.images.getImageData(filePath),
          backend.images
            .getImageDimensions(filePath)
            .catch(() => null),
        ]);
        if (cancelled) return;
        setImageUrl(url);
        setDimensions(
          dims ? { width: dims.width, height: dims.height } : null,
        );
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setImageUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filePath, extension]);

  return { imageUrl, dimensions, loading, error };
}
