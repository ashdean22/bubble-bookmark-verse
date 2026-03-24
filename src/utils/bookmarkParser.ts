// Parser for Netscape Bookmark File Format (used by Chrome, Firefox, Safari, Edge)
// Security: all HTML is passed through DOMPurify before parsing; javascript:/data: hrefs are rejected.

import { sanitizeHtml, isSafeUrl, sanitizeText, safeFavicon } from '@/utils/security';

export interface ParsedBookmark {
  url: string;
  title: string;
  favicon: string;
}

export const parseBookmarkHtml = (htmlContent: string): ParsedBookmark[] => {
  // 1. Sanitize the entire HTML file before touching it
  const cleanHtml = sanitizeHtml(htmlContent);

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, 'text/html');

  const bookmarks: ParsedBookmark[] = [];
  const links = doc.querySelectorAll('a[href]');

  links.forEach((link) => {
    const raw = link.getAttribute('href') ?? '';
    const rawTitle = link.textContent?.trim() ?? '';

    // 2. Only accept http/https — block javascript:, data:, vbscript:, etc.
    if (!isSafeUrl(raw)) return;

    const safeTitle = sanitizeText(rawTitle || raw, 200);
    const favicon = safeFavicon(raw);

    bookmarks.push({ url: raw, title: safeTitle, favicon });
  });

  return bookmarks;
};

export const readFileAsText = (file: File): Promise<string> => {
  // Guard: reject files larger than 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return Promise.reject(new Error('Bookmark file is too large (max 10 MB).'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
