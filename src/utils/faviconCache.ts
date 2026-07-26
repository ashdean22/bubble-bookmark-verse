/**
 * faviconCache.ts — favicon preloading + warm-start cache.
 *
 * Favicons are served cross-origin without CORS headers, so they can't be
 * read into data URLs. Instead we lean on the browser's HTTP cache and make
 * sure the requests start as early as possible:
 *   1. The set of favicon URLs is persisted, so on the very next boot we can
 *      inject <link rel="preload" as="image"> tags before React renders.
 *   2. Each URL is also warmed with an Image() + decode() so the bitmap is
 *      decoded and ready when the bubble paints.
 */

const STORAGE_KEY = 'faviconUrlsV1';
const MAX_ENTRIES = 300;

const warmed = new Set<string>();
const preloaded = new Set<string>();
let booted = false;

const safeStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

const isHttpUrl = (url: string) => typeof url === 'string' && /^https?:\/\//i.test(url);

const readStoredUrls = (): string[] => {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isHttpUrl).slice(0, MAX_ENTRIES) : [];
  } catch {
    try { storage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return [];
  }
};

const rememberUrls = (urls: string[]) => {
  const storage = safeStorage();
  if (!storage) return;
  const merged = Array.from(new Set([...urls.filter(isHttpUrl), ...readStoredUrls()])).slice(0, MAX_ENTRIES);
  try { storage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch { /* quota — ignore */ }
};

/** Inject a high-priority image preload so the request starts before render. */
const addPreloadLink = (url: string) => {
  if (typeof document === 'undefined' || preloaded.has(url)) return;
  preloaded.add(url);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
};

/** Decode into the image cache so painting is synchronous. */
const warmImage = (url: string) => {
  if (typeof window === 'undefined' || warmed.has(url)) return;
  warmed.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  if (typeof img.decode === 'function') img.decode().catch(() => { /* ignore */ });
};

/** True once this favicon has been requested in this session. */
export const isFaviconWarm = (url: string) => warmed.has(url);

/** Preload a set of favicons now, and remember them for the next boot. */
export const preloadFavicons = (urls: string[]) => {
  const list = Array.from(new Set(urls.filter(isHttpUrl)));
  list.forEach((url) => { addPreloadLink(url); warmImage(url); });
  rememberUrls(list);
};

/** Preload + remember a single favicon (e.g. right after adding a bookmark). */
export const cacheFavicon = (url: string) => { preloadFavicons([url]); };

/**
 * Boot-time warm start: preload every favicon seen on previous visits before
 * React mounts, so icons are already in cache on first render after refresh.
 */
export const initFaviconCache = () => {
  if (booted) return;
  booted = true;
  const stored = readStoredUrls();
  stored.forEach((url) => { addPreloadLink(url); warmImage(url); });
};
