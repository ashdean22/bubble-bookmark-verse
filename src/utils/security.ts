/**
 * security.ts — BubbleLink Security Utilities
 *
 * Dependency-free (no DOMPurify / zod) so it stays off the critical
 * load path. Centralises input sanitization, URL validation, lightweight
 * schema validation and rate limiting.
 */

// ─────────────────────────────────────────────
// 1. ALLOWED URL PROTOCOLS
// ─────────────────────────────────────────────
const ALLOWED_PROTOCOLS = ['https:', 'http:'];

export const isSafeUrl = (raw: string): boolean => {
  try {
    const normalized = raw.startsWith('http') ? raw : `https://${raw}`;
    const { protocol } = new URL(normalized);
    return ALLOWED_PROTOCOLS.includes(protocol);
  } catch {
    return false;
  }
};

export const sanitizeUrl = (raw: string): string => {
  const trimmed = raw.trim().slice(0, 2048); // hard cap
  const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  if (!isSafeUrl(normalized)) {
    throw new Error('Unsafe URL protocol. Only http:// and https:// are allowed.');
  }
  return normalized;
};

// ─────────────────────────────────────────────
// 2. TEXT SANITIZATION (plain text only — no HTML is ever rendered)
// ─────────────────────────────────────────────
export const sanitizeText = (raw: string, maxLength = 200): string => {
  const stripped = String(raw ?? '')
    .replace(/<[^>]*>/g, '')       // drop any tag-like markup
    .replace(/[<>]/g, '')          // drop stray angle brackets
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, ''); // drop control characters
  return stripped.trim().slice(0, maxLength);
};

// ─────────────────────────────────────────────
// 3. INPUT VALIDATION (zod-shaped API, zero dependencies)
// ─────────────────────────────────────────────
export interface BookmarkInput {
  url: string;
  title: string;
}

type ParseResult =
  | { success: true; data: BookmarkInput; error?: undefined }
  | { success: false; data?: undefined; error: { errors: { message: string }[] } };

export const BookmarkInputSchema = {
  safeParse(value: unknown): ParseResult {
    const input = (value ?? {}) as { url?: unknown; title?: unknown };
    const url = typeof input.url === 'string' ? input.url.trim() : '';
    const title = typeof input.title === 'string' ? input.title.trim() : '';

    const fail = (message: string): ParseResult => ({ success: false, error: { errors: [{ message }] } });

    if (!url) return fail('URL is required');
    if (url.length > 2048) return fail('URL is too long');
    if (!isSafeUrl(url)) return fail('Only http:// and https:// URLs are allowed');
    if (title.length > 200) return fail('Title must be under 200 characters');

    return { success: true, data: { url, title } };
  },
};

// ─────────────────────────────────────────────
// 4. LOCALSTORAGE DATA VALIDATION
// ─────────────────────────────────────────────
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isString = (v: unknown): v is string => typeof v === 'string';

const isValidStoredBookmark = (item: unknown): boolean => {
  if (!item || typeof item !== 'object') return false;
  const b = item as Record<string, unknown>;
  return (
    isString(b.id) &&
    isString(b.url) && isSafeUrl(b.url) &&
    isString(b.title) && b.title.length <= 500 &&
    isString(b.favicon) && b.favicon.length <= 2048 &&
    isNumber(b.x) && isNumber(b.y) && isNumber(b.size) &&
    isString(b.color) &&
    isNumber(b.accessCount) && b.accessCount >= 0 &&
    (b.lastAccessed === undefined || isNumber(b.lastAccessed)) &&
    (b.accessHistory === undefined || (Array.isArray(b.accessHistory) && b.accessHistory.every(isNumber)))
  );
};

export const validateStoredBookmarks = (raw: unknown[]): unknown[] => raw.filter(isValidStoredBookmark);

// ─────────────────────────────────────────────
// 5. RATE LIMITER (in-memory, per action key)
// ─────────────────────────────────────────────
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const checkRateLimit = (key: string, limit: number, windowMs = 60_000): boolean => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
};

// ─────────────────────────────────────────────
// 6. DOMAIN EXTRACTION (safe)
// ─────────────────────────────────────────────
export const safeDomain = (url: string): string => {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export const safeFavicon = (url: string): string => {
  const domain = safeDomain(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
};
