// Parser for Netscape Bookmark File Format (used by Chrome, Firefox, Safari, Edge)

export interface ParsedBookmark {
  url: string;
  title: string;
  favicon: string;
}

export const parseBookmarkHtml = (htmlContent: string): ParsedBookmark[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const bookmarks: ParsedBookmark[] = [];
  const links = doc.querySelectorAll('a[href]');
  
  links.forEach((link) => {
    const url = link.getAttribute('href');
    const title = link.textContent?.trim();
    
    // Only include valid http/https URLs
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      const domain = extractDomain(url);
      bookmarks.push({
        url,
        title: title || domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      });
    }
  });
  
  return bookmarks;
};

const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
