import { describe, it, expect } from 'vitest';
import { sanitizeHTML, isSafeURL, truncateText, stripHTML } from './sanitize';

describe('sanitize utilities', () => {
  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const dirty = '<p>Hello <script>alert("xss")</script></p>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('Hello');
    });

    it('should remove dangerous event handlers', () => {
      const dirty = '<p onclick="alert(1)">Click me</p>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain('onclick');
      expect(clean).toContain('Click me');
    });

    it('should allow safe HTML tags', () => {
      const html = '<p><strong>Bold</strong> and <em>italic</em></p>';
      const clean = sanitizeHTML(html);
      expect(clean).toContain('<strong>');
      expect(clean).toContain('<em>');
      expect(clean).toContain('Bold');
    });

    it('should allow safe links with href', () => {
      const html = '<a href="https://example.com">Link</a>';
      const clean = sanitizeHTML(html);
      expect(clean).toContain('<a');
      expect(clean).toContain('href="https://example.com"');
    });

    it('should remove javascript: protocol from links', () => {
      const dirty = '<a href="javascript:alert(1)">Bad Link</a>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain('javascript:');
    });

    it('should handle null input', () => {
      expect(sanitizeHTML(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(sanitizeHTML(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizeHTML('')).toBe('');
    });

    it('should allow lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const clean = sanitizeHTML(html);
      expect(clean).toContain('<ul>');
      expect(clean).toContain('<li>');
      expect(clean).toContain('Item 1');
    });

    it('should allow headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2>';
      const clean = sanitizeHTML(html);
      expect(clean).toContain('<h1>');
      expect(clean).toContain('<h2>');
    });
  });

  describe('isSafeURL', () => {
    it('should allow https URLs', () => {
      expect(isSafeURL('https://example.com')).toBe(true);
    });

    it('should allow http URLs', () => {
      expect(isSafeURL('http://example.com')).toBe(true);
    });

    it('should reject javascript: protocol', () => {
      expect(isSafeURL('javascript:alert(1)')).toBe(false);
    });

    it('should reject data: protocol', () => {
      expect(isSafeURL('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should reject file: protocol', () => {
      expect(isSafeURL('file:///etc/passwd')).toBe(false);
    });

    it('should handle null input', () => {
      expect(isSafeURL(null)).toBe(false);
    });

    it('should handle undefined input', () => {
      expect(isSafeURL(undefined)).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(isSafeURL('not a url')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(isSafeURL('')).toBe(false);
    });

    it('should allow URLs with query params', () => {
      expect(isSafeURL('https://example.com/path?query=value')).toBe(true);
    });

    it('should allow URLs with fragments', () => {
      expect(isSafeURL('https://example.com/path#section')).toBe(true);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'Hello World';
      expect(truncateText(text, 5)).toBe('Hello...');
    });

    it('should not truncate short text', () => {
      const text = 'Hello';
      expect(truncateText(text, 10)).toBe('Hello');
    });

    it('should handle exact length', () => {
      const text = 'Hello';
      expect(truncateText(text, 5)).toBe('Hello');
    });

    it('should trim whitespace before ellipsis', () => {
      const text = 'Hello World';
      expect(truncateText(text, 6)).toBe('Hello...');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 5)).toBe('');
    });

    it('should handle zero max length', () => {
      expect(truncateText('Hello', 0)).toBe('...');
    });
  });

  describe('stripHTML', () => {
    it('should remove HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      expect(stripHTML(html)).toBe('Hello World');
    });

    it('should remove all tags', () => {
      const html = '<div><p><span>Text</span></p></div>';
      expect(stripHTML(html)).toBe('Text');
    });

    it('should handle self-closing tags', () => {
      const html = 'Hello<br/>World';
      expect(stripHTML(html)).toBe('HelloWorld');
    });

    it('should handle null input', () => {
      expect(stripHTML(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(stripHTML(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(stripHTML('')).toBe('');
    });

    it('should trim whitespace', () => {
      const html = '  <p>Hello</p>  ';
      expect(stripHTML(html)).toBe('Hello');
    });

    it('should handle text without HTML', () => {
      expect(stripHTML('Plain text')).toBe('Plain text');
    });

    it('should handle nested tags', () => {
      const html = '<div><p>Paragraph with <a href="#">link</a></p></div>';
      expect(stripHTML(html)).toBe('Paragraph with link');
    });
  });
});
