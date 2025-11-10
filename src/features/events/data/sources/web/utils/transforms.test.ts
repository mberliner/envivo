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
  parseLivepassDate,
  cleanLivepassTitle,
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

describe('parseLivepassDate', () => {
  describe('LivePass format (day + month, no year)', () => {
    it('should parse "09 NOV" format', () => {
      const result = parseLivepassDate('09 NOV');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(9);
      expect(result?.getMonth()).toBe(10); // November = 10 (0-indexed)
    });

    it('should parse "21 DIC" format', () => {
      const result = parseLivepassDate('21 DIC');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(21);
      expect(result?.getMonth()).toBe(11); // December = 11
    });

    it('should parse "1 ENE" format (single digit)', () => {
      const result = parseLivepassDate('1 ENE');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(1);
      expect(result?.getMonth()).toBe(0); // January = 0
    });

    it('should handle all abbreviated month names', () => {
      const months = [
        { text: '15 ENE', month: 0 },
        { text: '15 FEB', month: 1 },
        { text: '15 MAR', month: 2 },
        { text: '15 ABR', month: 3 },
        { text: '15 MAY', month: 4 },
        { text: '15 JUN', month: 5 },
        { text: '15 JUL', month: 6 },
        { text: '15 AGO', month: 7 },
        { text: '15 SEP', month: 8 },
        { text: '15 OCT', month: 9 },
        { text: '15 NOV', month: 10 },
        { text: '15 DIC', month: 11 },
      ];

      months.forEach(({ text, month }) => {
        const result = parseLivepassDate(text);
        expect(result?.getMonth()).toBe(month);
      });
    });
  });

  describe('Year inference', () => {
    it('should infer year correctly for future months', () => {
      const now = new Date();
      const currentYear = now.getFullYear();

      // Pick a month in the future
      const futureMonth = (now.getMonth() + 2) % 12;
      const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

      const result = parseLivepassDate(`15 ${monthNames[futureMonth]}`);
      expect(result?.getFullYear()).toBe(futureMonth < now.getMonth() ? currentYear + 1 : currentYear);
    });
  });

  describe('Edge cases', () => {
    it('should return undefined for invalid format', () => {
      expect(parseLivepassDate('invalid')).toBeUndefined();
      expect(parseLivepassDate('99 XYZ')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(parseLivepassDate('')).toBeUndefined();
    });

    it('should return undefined for non-string input', () => {
      expect(parseLivepassDate(null as any)).toBeUndefined();
      expect(parseLivepassDate(undefined as any)).toBeUndefined();
    });

    it('should handle case insensitivity', () => {
      const result1 = parseLivepassDate('09 nov');
      const result2 = parseLivepassDate('09 NOV');
      const result3 = parseLivepassDate('09 Nov');

      expect(result1?.getMonth()).toBe(10);
      expect(result2?.getMonth()).toBe(10);
      expect(result3?.getMonth()).toBe(10);
    });

    it('should handle extra whitespace', () => {
      const result = parseLivepassDate('  09   NOV  ');
      expect(result?.getDate()).toBe(9);
      expect(result?.getMonth()).toBe(10);
    });
  });
});

describe('cleanLivepassTitle', () => {
  describe('Venue removal', () => {
    it('should remove " en Café Berlín" from end', () => {
      expect(cleanLivepassTitle('Santiago Molina en Café Berlín')).toBe('Santiago Molina');
    });

    it('should remove " en Cafe Berlin" (no accents)', () => {
      expect(cleanLivepassTitle('Metallica en Cafe Berlin')).toBe('Metallica');
    });

    it('should handle mixed case', () => {
      expect(cleanLivepassTitle('Iron Maiden EN Café Berlín')).toBe('Iron Maiden');
      expect(cleanLivepassTitle('AC/DC en CAFÉ BERLÍN')).toBe('AC/DC');
    });

    it('should remove with various accent combinations', () => {
      expect(cleanLivepassTitle('Artist en Café Berlín')).toBe('Artist');
      expect(cleanLivepassTitle('Artist en Cafe Berlín')).toBe('Artist');
      expect(cleanLivepassTitle('Artist en Café Berlin')).toBe('Artist');
    });
  });

  describe('Edge cases', () => {
    it('should return original title if no venue suffix', () => {
      expect(cleanLivepassTitle('Evento sin venue')).toBe('Evento sin venue');
    });

    it('should handle title that is only venue (return original)', () => {
      expect(cleanLivepassTitle('en Café Berlín')).toBe('en Café Berlín');
    });

    it('should return empty string for empty input', () => {
      expect(cleanLivepassTitle('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(cleanLivepassTitle(null as any)).toBe('');
      expect(cleanLivepassTitle(undefined as any)).toBe('');
    });

    it('should trim whitespace after removal', () => {
      expect(cleanLivepassTitle('Artist  en Café Berlín  ')).toBe('Artist');
    });

    it('should not remove venue if it appears in the middle', () => {
      expect(cleanLivepassTitle('Evento en Café Berlín y otros lugares')).toBe(
        'Evento en Café Berlín y otros lugares'
      );
    });
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

  it('should apply parseLivepassDate transform', () => {
    const result = applyTransform('parseLivepassDate', '09 NOV');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getMonth()).toBe(10);
  });

  it('should apply cleanLivepassTitle transform', () => {
    const result = applyTransform('cleanLivepassTitle', 'Metallica en Café Berlín');
    expect(result).toBe('Metallica');
  });

  it('should throw error for unknown transform', () => {
    expect(() => applyTransform('unknownTransform', 'value')).toThrow(
      'Unknown transform function: unknownTransform'
    );
  });
});
