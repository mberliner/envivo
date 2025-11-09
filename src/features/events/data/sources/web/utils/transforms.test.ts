/**
 * Transformation Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  parseSpanishDate,
  extractPrice,
  sanitizeHtml,
  cleanWhitespace,
  toAbsoluteUrl,
  applyTransform,
} from './transforms';

describe('parseSpanishDate', () => {
  describe('Spanish month names', () => {
    it('should parse "15 de marzo de 2025"', () => {
      const result = parseSpanishDate('15 de marzo de 2025');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(2); // Marzo = 2 (0-indexed)
      expect(result?.getDate()).toBe(15);
    });

    it('should parse "1 de enero de 2025"', () => {
      const result = parseSpanishDate('1 de enero de 2025');
      expect(result?.getMonth()).toBe(0); // Enero = 0
    });

    it('should parse "31 dic 2025" (short form)', () => {
      const result = parseSpanishDate('31 dic 2025');
      expect(result?.getMonth()).toBe(11); // Diciembre = 11
      expect(result?.getDate()).toBe(31);
    });

    it('should handle all month names', () => {
      const months = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];

      months.forEach((month, index) => {
        const result = parseSpanishDate(`15 de ${month} de 2025`);
        expect(result?.getMonth()).toBe(index);
      });
    });
  });

  describe('Numeric formats', () => {
    it('should parse "15/03/2025"', () => {
      const result = parseSpanishDate('15/03/2025');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse "15-03-2025"', () => {
      const result = parseSpanishDate('15-03-2025');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse "1/1/2025"', () => {
      const result = parseSpanishDate('1/1/2025');
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(1);
    });
  });

  describe('ISO formats', () => {
    it('should parse "2025-03-15"', () => {
      const result = parseSpanishDate('2025-03-15');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(2);
    });

    it('should parse "2025-03-15T20:00:00"', () => {
      const result = parseSpanishDate('2025-03-15T20:00:00');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
    });
  });

  describe('Edge cases', () => {
    it('should return undefined for invalid dates', () => {
      expect(parseSpanishDate('invalid')).toBeUndefined();
      expect(parseSpanishDate('99/99/9999')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(parseSpanishDate('')).toBeUndefined();
    });

    it('should return undefined for non-string input', () => {
      expect(parseSpanishDate(null as any)).toBeUndefined();
      expect(parseSpanishDate(undefined as any)).toBeUndefined();
    });

    it('should handle case insensitivity', () => {
      const result1 = parseSpanishDate('15 DE MARZO DE 2025');
      const result2 = parseSpanishDate('15 de marzo de 2025');
      expect(result1?.getTime()).toBe(result2?.getTime());
    });

    it('should handle extra whitespace', () => {
      const result = parseSpanishDate('  15  de  marzo  de  2025  ');
      expect(result?.getFullYear()).toBe(2025);
    });
  });
});

describe('extractPrice', () => {
  describe('Argentine formats', () => {
    it('should parse "$5.000" (thousands separator)', () => {
      expect(extractPrice('$5.000')).toBe(5000);
    });

    it('should parse "$10.500"', () => {
      expect(extractPrice('$10.500')).toBe(10500);
    });

    it('should parse "ARS 1500"', () => {
      expect(extractPrice('ARS 1500')).toBe(1500);
    });

    it('should parse "1500 pesos"', () => {
      expect(extractPrice('1500 pesos')).toBe(1500);
    });

    it('should parse "$1.500,50" (decimals)', () => {
      expect(extractPrice('$1.500,50')).toBe(1501); // Rounded
    });
  });

  describe('Text formats', () => {
    it('should parse "Desde $1.500"', () => {
      expect(extractPrice('Desde $1.500')).toBe(1500);
    });

    it('should parse "Entrada: $2000"', () => {
      expect(extractPrice('Entrada: $2000')).toBe(2000);
    });

    it('should parse "Gratis" as 0', () => {
      expect(extractPrice('Gratis')).toBe(0);
      expect(extractPrice('gratis')).toBe(0);
      expect(extractPrice('GRATIS')).toBe(0);
    });

    it('should parse "Free" as 0', () => {
      expect(extractPrice('Free')).toBe(0);
      expect(extractPrice('free')).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should return undefined for invalid prices', () => {
      expect(extractPrice('No price')).toBeUndefined();
      expect(extractPrice('invalid')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(extractPrice('')).toBeUndefined();
    });

    it('should return undefined for non-string input', () => {
      expect(extractPrice(null as any)).toBeUndefined();
      expect(extractPrice(undefined as any)).toBeUndefined();
    });

    it('should handle whitespace', () => {
      expect(extractPrice('  $5000  ')).toBe(5000);
    });

    it('should extract first number found', () => {
      expect(extractPrice('Price: $1000 - $2000')).toBe(1000);
    });
  });
});

describe('sanitizeHtml', () => {
  it('should remove dangerous tags', () => {
    const html = '<script>alert("xss")</script><p>Safe text</p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Safe text');
  });

  it('should preserve safe tags', () => {
    const html = '<p>Text with <strong>bold</strong> and <em>italic</em></p>';
    const result = sanitizeHtml(html);
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
    expect(result).toContain('<p>');
  });

  it('should preserve links', () => {
    const html = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(html);
    expect(result).toContain('<a');
    expect(result).toContain('href');
  });

  it('should remove onclick and other event handlers', () => {
    const html = '<p onclick="alert(1)">Text</p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('onclick');
  });

  it('should return empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeHtml(null as any)).toBe('');
    expect(sanitizeHtml(undefined as any)).toBe('');
  });
});

describe('cleanWhitespace', () => {
  it('should trim whitespace', () => {
    expect(cleanWhitespace('  text  ')).toBe('text');
  });

  it('should collapse multiple spaces', () => {
    expect(cleanWhitespace('text   with    spaces')).toBe('text with spaces');
  });

  it('should collapse multiple newlines', () => {
    expect(cleanWhitespace('line1\n\n\nline2')).toBe('line1\nline2');
  });

  it('should handle tabs and other whitespace', () => {
    expect(cleanWhitespace('text\t\twith\ttabs')).toBe('text with tabs');
  });

  it('should return empty string for empty input', () => {
    expect(cleanWhitespace('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(cleanWhitespace(null as any)).toBe('');
    expect(cleanWhitespace(undefined as any)).toBe('');
  });
});

describe('toAbsoluteUrl', () => {
  const baseUrl = 'https://example.com';

  it('should keep absolute URLs unchanged', () => {
    expect(toAbsoluteUrl('https://other.com/path', baseUrl)).toBe(
      'https://other.com/path'
    );
    expect(toAbsoluteUrl('http://other.com/path', baseUrl)).toBe(
      'http://other.com/path'
    );
  });

  it('should convert relative URLs to absolute', () => {
    expect(toAbsoluteUrl('/images/photo.jpg', baseUrl)).toBe(
      'https://example.com/images/photo.jpg'
    );
  });

  it('should add leading slash if missing', () => {
    expect(toAbsoluteUrl('images/photo.jpg', baseUrl)).toBe(
      'https://example.com/images/photo.jpg'
    );
  });

  it('should handle baseUrl with trailing slash', () => {
    expect(toAbsoluteUrl('/path', 'https://example.com/')).toBe(
      'https://example.com/path'
    );
  });

  it('should return empty string for empty input', () => {
    expect(toAbsoluteUrl('', baseUrl)).toBe('');
  });
});

describe('applyTransform', () => {
  it('should apply parseSpanishDate transform', () => {
    const result = applyTransform('parseSpanishDate', '15 de marzo de 2025');
    expect(result).toBeInstanceOf(Date);
  });

  it('should apply extractPrice transform', () => {
    const result = applyTransform('extractPrice', '$5.000');
    expect(result).toBe(5000);
  });

  it('should apply sanitizeHtml transform', () => {
    const result = applyTransform('sanitizeHtml', '<script>xss</script><p>text</p>');
    expect(result).not.toContain('<script>');
  });

  it('should apply cleanWhitespace transform', () => {
    const result = applyTransform('cleanWhitespace', '  text  ');
    expect(result).toBe('text');
  });

  it('should apply toAbsoluteUrl transform', () => {
    const result = applyTransform('toAbsoluteUrl', '/path', 'https://example.com');
    expect(result).toBe('https://example.com/path');
  });

  it('should throw error for unknown transform', () => {
    expect(() => applyTransform('unknownTransform', 'value')).toThrow(
      'Unknown transform function: unknownTransform'
    );
  });
});
