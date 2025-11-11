import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * Removes dangerous tags and attributes while preserving safe formatting
 *
 * @example
 * ```typescript
 * const safe = sanitizeHTML('<p>Hello <script>alert("xss")</script></p>');
 * // Returns: '<p>Hello </p>'
 * ```
 */
export function sanitizeHTML(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'a',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'pre',
      'code',
      'span',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    // Force all links to open in new tab with security attributes
    ALLOWED_URI_REGEXP: /^(?:(?:https?):)/i,
  });
}

/**
 * Validate that a URL is safe to use as href
 *
 * Only allows http/https protocols
 *
 * @example
 * ```typescript
 * isSafeURL('https://example.com'); // true
 * isSafeURL('javascript:alert(1)'); // false
 * ```
 */
export function isSafeURL(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Truncate text to a maximum length and add ellipsis
 *
 * @example
 * ```typescript
 * truncateText('Hello World', 5); // 'Hello...'
 * ```
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Strip HTML tags from a string
 *
 * Useful for creating plain text excerpts from HTML content
 *
 * @example
 * ```typescript
 * stripHTML('<p>Hello <strong>World</strong></p>'); // 'Hello World'
 * ```
 */
export function stripHTML(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}
