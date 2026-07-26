/**
 * faviconCache.ts — persistent favicon cache + preloading.
 *
 * Favicons come from a third-party service, so on a cold render (and after
 * every refresh) each bubble would otherwise wait on a fresh network round
 * trip. We cache each icon as a small data URL in localStorage, keep an
 * in-memory map for instant synchronous reads, and warm the browser's image
 * cache for anything not persisted yet.
 */

const STORAGE_KEY = 'faviconCacheV1';
const MAX_ENTRIES = 300;
const MAX_BYTES_PER_ICON = 24 * 1024; // skip persisting anything unusually large
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheEntry {
  data: string; // data URL
  t: number;    // stored at
}

type CacheMap = Record<string, CacheEntry>;

const memory = new Map<string, string>();
const inFlight = new Set<string>();
const listeners = new Set<() => void>();
let loaded = false;

const safeStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

const readStore = (): CacheMap => {
  const storage = safeStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as CacheMap;
  } catch {
    try { storage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return {};
  }
};

const writeStore = (map: CacheMap) => {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota exceeded — drop the oldest half and retry once.
    try {
      const entries = Object.entries(map).sort((a, b) => b[1].t - a[1].t);
      const trimmed: CacheMap = {};
      entries.slice(0, Math.floor(entries.length / 2)).forEach(([k, v]) => { trimmed[k] = v; });
      storage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch { /* give up silently */ }
  }
};

/** Hydrate the in-memory map from localStorage. Cheap, runs once. */
export const initFaviconCache = () => {
  if (loaded) return;
  loaded = true;
  const store = readStore();
  const now = Date.now();
  let dirty = false;
  for (const [url, entry] of Object.entries(store)) {
    if (!entry || typeof entry.data !== 'string' || typeof entry.t !== 'number') {
      delete store[url];
      dirty = true;
      continue;
    }
    if (now - entry.t > TTL_MS) {
      delete store[url];
      dirty = true;
      continue;
    }
    memory.set(url, entry.data);
  }
  if (dirty) writeStore(store);
};

/** Synchronous read — returns a data URL if cached, otherwise null. */
export const getCachedFavicon = (url: string): string | null => {
  if (!url) return null;
  if (!loaded) initFaviconCache();
  return memory.get(url) ?? null;
};

const persist = (url: string, data: string) => {
  memory.set(url, data);
  const store = readStore();
  store[url] = { data, t: Date.now() };
  const keys = Object.keys(store);
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => store[a].t - store[b].t)
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((k) => { delete store[k]; });
  }
  writeStore(store);
  listeners.forEach((fn) => fn());
};

/**
 * Fetch + persist a favicon as a data URL. Falls back to a plain image
 * preload if the fetch is blocked (CORS/offline), which still warms the
 * browser cache so the next render is instant.
 */
export const cacheFavicon = async (url: string): Promise<void> => {
  if (!url || !/^https?:\/\//i.test(url)) return;
  if (!loaded) initFaviconCache();
  if (memory.has(url) || inFlight.has(url)) return;
  inFlight.add(url);

  const warmImageCache = () => {
    if (typeof window === 'undefined') return;
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  };

  try {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!res.ok) throw new Error(`favicon ${res.status}`);
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.size === 0 || blob.size > MAX_BYTES_PER_ICON) {
      warmImageCache();
      return;
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    if (data.startsWith('data:image/')) persist(url, data);
    else warmImageCache();
  } catch {
    warmImageCache();
  } finally {
    inFlight.delete(url);
  }
};

/** Warm every favicon that isn't cached yet, oldest-first, without blocking paint. */
export const preloadFavicons = (urls: string[]) => {
  if (typeof window === 'undefined') return;
  if (!loaded) initFaviconCache();
  const pending = Array.from(new Set(urls.filter((u) => u && !memory.has(u) && !inFlight.has(u))));
  if (pending.length === 0) return;

  // Warm the browser image cache immediately so first render has pixels ASAP…
  pending.forEach((u) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = u;
  });

  // …then persist them for future refreshes when the main thread is free.
  const run = () => { pending.forEach((u) => { void cacheFavicon(u); }); };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    window.setTimeout(run, 600);
  }
};

/** Subscribe to cache updates (used so bubbles swap to the cached data URL). */
export const subscribeFaviconCache = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
