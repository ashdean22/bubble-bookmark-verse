/**
 * security.ts — BubbleLink Security Utilities
 *
 * Centralises all input sanitization, URL validation, schema definitions,
 * and rate-limiting helpers so every entry point uses the same rules.
 */

import DOMPurify from 'dompurify';
import { z } from 'zod';

// ─────────────────────────────────────────────
// 1. ALLOWED URL PROTOCOLS
// ─────────────────────────────────────────────
const ALLOWED_PROTOCOLS = ['https:', 'http:'];

/**
 * Returns true only for safe http/https URLs.
 * Blocks javascript:, data:, vbscript:, blob:, file:, etc.
 */
export const isSafeUrl = (raw: string): boolean => {
  try {
    const normalized = raw.startsWith('http') ? raw : `https://${raw}`;
    const { protocol } = new URL(normalized);
    return ALLOWED_PROTOCOLS.includes(protocol);
  } catch {
    return false;
  }
};

/**
 * Normalise + sanitize a URL string.
 * Throws if the protocol is not http/https.
 */
export const sanitizeUrl = (raw: string): string => {
  const trimmed = raw.trim().slice(0, 2048); // hard cap
  const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  if (!isSafeUrl(normalized)) {
    throw new Error('Unsafe URL protocol. Only http:// and https:// are allowed.');
  }
  return normalized;
};

// ─────────────────────────────────────────────
// 2. TEXT SANITIZATION
// ─────────────────────────────────────────────
/**
 * Strip ALL HTML/script tags from a plain-text string.
 * Used for title / label fields.
 */
export const sanitizeText = (raw: string, maxLength = 200): string => {
  const stripped = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return stripped.trim().slice(0, maxLength);
};

/**
 * Sanitize HTML content (bookmark import files) — keep structure,
 * strip scripts/events.
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['html', 'head', 'body', 'dl', 'dt', 'dd', 'p', 'h1', 'h3', 'a', 'hr'],
    ALLOWED_ATTR: ['href', 'add_date', 'last_modified', 'icon'],
    FORBID_SCRIPTS: true,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
  });
};

// ─────────────────────────────────────────────
// 3. ZOD SCHEMAS
// ─────────────────────────────────────────────
export const BookmarkInputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'URL is required')
    .max(2048, 'URL is too long')
    .refine(isSafeUrl, 'Only http:// and https:// URLs are allowed'),
  title: z
    .string()
    .trim()
    .max(200, 'Title must be under 200 characters')
    .optional()
    .default(''),
});

export type BookmarkInput = z.infer<typeof BookmarkInputSchema>;

// ─────────────────────────────────────────────
// 4. LOCALHOST DATA VALIDATION
// ─────────────────────────────────────────────
const StoredBookmarkSchema = z.object({
  id: z.string(),
  url: z.string().refine(isSafeUrl, 'Blocked unsafe stored URL'),
  title: z.string().max(500),
  favicon: z.string().max(2048),
  x: z.number(),
  y: z.number(),
  size: z.number(),
  color: z.string(),
  accessCount: z.number().min(0),
  lastAccessed: z.number().optional(),
  accessHistory: z.array(z.number()).optional(),
});

/**
 * Validate and filter localStorage bookmark data.
 * Any entry that fails validation is silently dropped (safe default).
 */
export const validateStoredBookmarks = (raw: unknown[]): unknown[] => {
  return raw.filter((item) => {
    const result = StoredBookmarkSchema.safeParse(item);
    return result.success;
  });
};

// ─────────────────────────────────────────────
// 5. RATE LIMITER (in-memory, per action key)
// ─────────────────────────────────────────────
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Returns true if the action is allowed, false if rate-limited.
 * @param key    - Unique key per action (e.g. 'add_bookmark')
 * @param limit  - Max calls allowed within windowMs
 * @param windowMs - Time window in milliseconds (default 60 s)
 */
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
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
};
