import { useEffect, useState } from 'react';
import {
  cacheFavicon,
  getCachedFavicon,
  initFaviconCache,
  preloadFavicons,
  subscribeFaviconCache,
} from '@/utils/faviconCache';

/**
 * Returns the best available src for a favicon: a cached data URL when we
 * have one (instant, no network), otherwise the remote URL while it is
 * fetched and persisted in the background.
 */
export function useFaviconSrc(url: string): string {
  const [src, setSrc] = useState<string>(() => getCachedFavicon(url) || url);

  useEffect(() => {
    initFaviconCache();
    const cached = getCachedFavicon(url);
    setSrc(cached || url);
    if (!cached) void cacheFavicon(url);
    return subscribeFaviconCache(() => {
      const next = getCachedFavicon(url);
      if (next) setSrc(next);
    });
  }, [url]);

  return src;
}

/** Preload + persist a whole set of favicons (call once per bookmark list). */
export function useFaviconPreload(urls: string[]) {
  const key = urls.join('|');
  useEffect(() => {
    initFaviconCache();
    preloadFavicons(urls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
