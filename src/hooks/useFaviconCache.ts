import { useEffect } from 'react';
import { initFaviconCache, preloadFavicons } from '@/utils/faviconCache';

/** Preload a whole set of favicons (call once per bookmark list). */
export function useFaviconPreload(urls: string[]) {
  const key = urls.join('|');
  useEffect(() => {
    initFaviconCache();
    preloadFavicons(urls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
