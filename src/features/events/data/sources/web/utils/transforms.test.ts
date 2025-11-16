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
  parseLivepassDateTime,
  cleanLivepassTitle,
  extractLivepassVenue,
  extractMovistarPrice,
  extractMovistarTime,
  extractMovistarDescription,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(parseSpanishDate(null as any)).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  describe('Decimal formats (English/JSON)', () => {
    it('should parse "22400.0" (LivePass format)', () => {
      expect(extractPrice('22400.0')).toBe(22400);
    });

    it('should parse "22400.50" (with cents)', () => {
      expect(extractPrice('22400.50')).toBe(22401); // Rounded
    });

    it('should parse "1234.5"', () => {
      expect(extractPrice('1234.5')).toBe(1235); // Rounded
    });

    it('should parse "100.99"', () => {
      expect(extractPrice('100.99')).toBe(101); // Rounded
    });

    it('should parse "5000.0" (single zero after decimal)', () => {
      expect(extractPrice('5000.0')).toBe(5000);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(extractPrice(null as any)).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeHtml(null as any)).toBe('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(cleanWhitespace(null as any)).toBe('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(parseLivepassDate(null as any)).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(cleanLivepassTitle(null as any)).toBe('');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

describe('parseLivepassDateTime', () => {
  describe('ISO format with time', () => {
    it('should parse "2025-11-09T21:00:00" (ISO format)', () => {
      const result = parseLivepassDateTime('2025-11-09T21:00:00');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(10); // November = 10
      expect(result?.getDate()).toBe(9);
      expect(result?.getHours()).toBe(21);
      expect(result?.getMinutes()).toBe(0);
    });

    it('should parse "2025-11-09 21:00" (ISO-like without T)', () => {
      const result = parseLivepassDateTime('2025-11-09 21:00');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(21);
    });
  });

  describe('Spanish format with full year and time', () => {
    it('should parse "9 de noviembre de 2025 a las 21:00"', () => {
      const result = parseLivepassDateTime('9 de noviembre de 2025 a las 21:00');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(10); // November
      expect(result?.getDate()).toBe(9);
      expect(result?.getHours()).toBe(21);
      expect(result?.getMinutes()).toBe(0);
    });

    it('should parse "15 de marzo de 2025 - 20:30"', () => {
      const result = parseLivepassDateTime('15 de marzo de 2025 - 20:30');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(2); // March
      expect(result?.getHours()).toBe(20);
      expect(result?.getMinutes()).toBe(30);
    });

    it('should parse "1 de enero de 2025 21:15" (no separator)', () => {
      const result = parseLivepassDateTime('1 de enero de 2025 21:15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getHours()).toBe(21);
      expect(result?.getMinutes()).toBe(15);
    });
  });

  describe('Abbreviated format (LivePass meta descriptions)', () => {
    it('should parse "Martes 11 NOV - 20:45 hrs" (real LivePass format)', () => {
      const result = parseLivepassDateTime('Martes 11 NOV - 20:45 hrs');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(11);
      expect(result?.getMonth()).toBe(10); // November (NOV)
      expect(result?.getHours()).toBe(20);
      expect(result?.getMinutes()).toBe(45);
    });

    it('should parse "11 NOV - 20:45 hrs" (without day name)', () => {
      const result = parseLivepassDateTime('11 NOV - 20:45 hrs');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(11);
      expect(result?.getMonth()).toBe(10); // November
      expect(result?.getHours()).toBe(20);
      expect(result?.getMinutes()).toBe(45);
    });

    it('should parse "Miércoles 12 NOV - 20:45 hrs"', () => {
      const result = parseLivepassDateTime('Miércoles 12 NOV - 20:45 hrs');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(12);
      expect(result?.getMonth()).toBe(10); // November
      expect(result?.getHours()).toBe(20);
      expect(result?.getMinutes()).toBe(45);
    });

    it('should parse from meta description (full text)', () => {
      const result = parseLivepassDateTime(
        'Ven y disfruta de Franco Dezzutto en Café Berlín. Martes 11 NOV - 20:45 hrs Café Berlín - -'
      );
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(11);
      expect(result?.getMonth()).toBe(10); // November
      expect(result?.getHours()).toBe(20);
      expect(result?.getMinutes()).toBe(45);
    });

    it('should parse "21 DIC - 19:00 hrs" (December)', () => {
      const result = parseLivepassDateTime('21 DIC - 19:00 hrs');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(21);
      expect(result?.getMonth()).toBe(11); // December (DIC)
      expect(result?.getHours()).toBe(19);
      expect(result?.getMinutes()).toBe(0);
    });

    it('should parse "Sábado 15 NOV - 23:00 hrs" (late night)', () => {
      const result = parseLivepassDateTime('Sábado 15 NOV - 23:00 hrs');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(15);
      expect(result?.getHours()).toBe(23);
      expect(result?.getMinutes()).toBe(0);
    });
  });

  describe('Spanish format without year (infer year)', () => {
    it('should parse "Sábado 9 de Noviembre - 21:00"', () => {
      const result = parseLivepassDateTime('Sábado 9 de Noviembre - 21:00');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(9);
      expect(result?.getMonth()).toBe(10); // November
      expect(result?.getHours()).toBe(21);
      expect(result?.getMinutes()).toBe(0);
    });

    it('should parse "9 de Noviembre - 21:00" (without day name)', () => {
      const result = parseLivepassDateTime('9 de Noviembre - 21:00');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(10);
      expect(result?.getHours()).toBe(21);
    });

    it('should parse "15 de marzo 20:30" (no dash separator)', () => {
      const result = parseLivepassDateTime('15 de marzo 20:30');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getHours()).toBe(20);
      expect(result?.getMinutes()).toBe(30);
    });
  });

  describe('Numeric format with time', () => {
    it('should parse "09/11/2025 21:00"', () => {
      const result = parseLivepassDateTime('09/11/2025 21:00');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(10); // November
      expect(result?.getDate()).toBe(9);
      expect(result?.getHours()).toBe(21);
      expect(result?.getMinutes()).toBe(0);
    });

    it('should parse "09/11/2025 - 21:00" (with dash)', () => {
      const result = parseLivepassDateTime('09/11/2025 - 21:00');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(21);
    });

    it('should parse "9-11-2025 21:30" (single digit, dash separator)', () => {
      const result = parseLivepassDateTime('9-11-2025 21:30');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(21);
      expect(result?.getMinutes()).toBe(30);
    });
  });

  describe('Fallback to date-only parsing', () => {
    it('should fallback to parseSpanishDate for date without time', () => {
      const result = parseLivepassDateTime('15 de marzo de 2025');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
      // Time should default to 00:00
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
    });

    it('should fallback to parseSpanishDate for "09/11/2025" (no time)', () => {
      const result = parseLivepassDateTime('09/11/2025');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
    });
  });

  describe('Edge cases', () => {
    it('should return undefined for invalid format', () => {
      expect(parseLivepassDateTime('invalid')).toBeUndefined();
      expect(parseLivepassDateTime('99/99/9999 99:99')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(parseLivepassDateTime('')).toBeUndefined();
    });

    it('should return undefined for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(parseLivepassDateTime(null as any)).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(parseLivepassDateTime(undefined as any)).toBeUndefined();
    });

    it('should handle case insensitivity', () => {
      const result1 = parseLivepassDateTime('9 DE NOVIEMBRE - 21:00');
      const result2 = parseLivepassDateTime('9 de noviembre - 21:00');
      expect(result1?.getTime()).toBe(result2?.getTime());
    });

    it('should handle extra whitespace', () => {
      const result = parseLivepassDateTime('  9  de  noviembre  -  21:00  ');
      expect(result?.getMonth()).toBe(10);
      expect(result?.getHours()).toBe(21);
    });

    it('should handle "hs" suffix', () => {
      const result = parseLivepassDateTime('09/11/2025 - 21:00hs');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(21);
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
    expect((result as Date)?.getMonth()).toBe(10);
  });

  it('should apply cleanLivepassTitle transform', () => {
    const result = applyTransform('cleanLivepassTitle', 'Metallica en Café Berlín');
    expect(result).toBe('Metallica');
  });

  it('should apply parseLivepassDateTime transform', () => {
    const result = applyTransform('parseLivepassDateTime', '9 de noviembre - 21:00');
    expect(result).toBeInstanceOf(Date);
    expect((result as Date)?.getMonth()).toBe(10);
    expect((result as Date)?.getHours()).toBe(21);
  });

  it('should apply extractLivepassVenue transform', () => {
    const result = applyTransform('extractLivepassVenue', 'Recinto: Café Berlín');
    expect(result).toBe('Café Berlín');
  });

  it('should throw error for unknown transform', () => {
    expect(() => applyTransform('unknownTransform', 'value')).toThrow(
      'Unknown transform function: unknownTransform'
    );
  });
});

describe('extractLivepassVenue', () => {
  it('should extract venue from "Recinto: Café Berlín"', () => {
    const result = extractLivepassVenue('Recinto: Café Berlín');
    expect(result).toBe('Café Berlín');
  });

  it('should extract venue from "Recinto:Café Berlín" (no space)', () => {
    const result = extractLivepassVenue('Recinto:Café Berlín');
    expect(result).toBe('Café Berlín');
  });

  it('should extract venue from "RECINTO: Café Berlín" (uppercase)', () => {
    const result = extractLivepassVenue('RECINTO: Café Berlín');
    expect(result).toBe('Café Berlín');
  });

  it('should handle venue with extra whitespace', () => {
    const result = extractLivepassVenue('Recinto:   Café Berlín   ');
    expect(result).toBe('Café Berlín');
  });

  it('should return trimmed text if no "Recinto:" pattern found', () => {
    const result = extractLivepassVenue('  Café Berlín  ');
    expect(result).toBe('Café Berlín');
  });

  it('should handle empty string', () => {
    const result = extractLivepassVenue('');
    expect(result).toBeUndefined();
  });

  it('should handle undefined input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = extractLivepassVenue(undefined as any);
    expect(result).toBeUndefined();
  });

  it('should handle null input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = extractLivepassVenue(null as any);
    expect(result).toBeUndefined();
  });
});

describe('extractMovistarPrice', () => {
  it('should extract price in Argentine format with thousands separator', () => {
    const result = extractMovistarPrice('desde $ 60.000 16 noviembre');
    expect(result).toBe(60000);
  });

  it('should extract price with decimal in Argentine format', () => {
    const result = extractMovistarPrice('Precio: $ 45.000,50 por persona');
    expect(result).toBe(45000.5);
  });

  it('should extract price without thousands separator', () => {
    const result = extractMovistarPrice('Entrada general $ 500');
    expect(result).toBe(500);
  });

  it('should prevent backtracking when followed by digits with space', () => {
    // Caso real documentado en commit: texto con día del mes separado por espacio
    const result = extractMovistarPrice('desde $ 60.000 16 noviembre');
    expect(result).toBe(60000);
  });

  it('should handle price with proper thousands separator format', () => {
    // Formato válido argentino con separador de miles
    const result = extractMovistarPrice('Precio $ 75.000 disponible');
    expect(result).toBe(75000);
  });

  it('should handle price without space after $', () => {
    const result = extractMovistarPrice('Costo: $50.000');
    expect(result).toBe(50000);
  });

  it('should return undefined if no price found', () => {
    const result = extractMovistarPrice('Sin precio disponible');
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    const result = extractMovistarPrice('');
    expect(result).toBeUndefined();
  });

  it('should handle multiple prices and capture the first', () => {
    const result = extractMovistarPrice('desde $ 30.000 hasta $ 80.000');
    expect(result).toBe(30000);
  });

  it('should handle large prices with multiple thousands separators', () => {
    const result = extractMovistarPrice('VIP $ 1.250.000');
    expect(result).toBe(1250000);
  });
});

describe('extractMovistarTime', () => {
  it('should extract time from "21:00 hs Show" format', () => {
    const result = extractMovistarTime('21:00 hs Show');
    expect(result).toBe('21:00');
  });

  it('should extract time from "19:00 hs Puertas" format', () => {
    const result = extractMovistarTime('19:00 hs Puertas');
    expect(result).toBe('19:00');
  });

  it('should extract time without extra text', () => {
    const result = extractMovistarTime('20:30');
    expect(result).toBe('20:30');
  });

  it('should extract single digit hour', () => {
    const result = extractMovistarTime('9:00 hs');
    expect(result).toBe('9:00');
  });

  it('should return undefined if no time pattern found', () => {
    const result = extractMovistarTime('Horario a confirmar');
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    const result = extractMovistarTime('');
    expect(result).toBeUndefined();
  });

  it('should handle time with extra whitespace', () => {
    const result = extractMovistarTime('   21:00 hs   ');
    expect(result).toBe('21:00');
  });
});

describe('extractMovistarDescription', () => {
  it('should preserve event description paragraphs', () => {
    const input = '¡Melendi celebra 20 años de carrera!\n\nEl reconocido cantautor español regresa.';
    const result = extractMovistarDescription(input);
    expect(result).toContain('Melendi');
    expect(result).toContain('cantautor español');
  });

  it('should filter out transport information', () => {
    const input = 'Descripción del evento.\n\nColectivos 34, 42, 55, 63';
    const result = extractMovistarDescription(input);
    expect(result).toContain('Descripción del evento');
    expect(result).not.toContain('Colectivos');
  });

  it('should filter out parking information', () => {
    const input = 'Evento musical.\n\nEncontrá estacionamiento para tu show';
    const result = extractMovistarDescription(input);
    expect(result).toContain('Evento musical');
    expect(result).not.toContain('estacionamiento');
  });

  it('should filter out registration messages', () => {
    const input = 'Gran concierto.\n\nPara comprar entradas, registres de nuevo en el sitio.';
    const result = extractMovistarDescription(input);
    expect(result).toContain('Gran concierto');
    expect(result).not.toContain('registres');
  });

  it('should handle empty string', () => {
    const result = extractMovistarDescription('');
    expect(result).toBe('');
  });

  it('should preserve multiple valid paragraphs', () => {
    const input = 'Párrafo 1 del evento.\n\nPárrafo 2 del evento.\n\nPárrafo 3 del evento.';
    const result = extractMovistarDescription(input);
    expect(result).toContain('Párrafo 1');
    expect(result).toContain('Párrafo 2');
    expect(result).toContain('Párrafo 3');
  });

  it('should filter mixed content correctly', () => {
    const input =
      'Descripción válida.\n\nColectivos 10, 20.\n\nMás descripción.\n\nReservá tu estacionamiento.';
    const result = extractMovistarDescription(input);
    expect(result).toContain('Descripción válida');
    expect(result).toContain('Más descripción');
    expect(result).not.toContain('Colectivos');
    expect(result).not.toContain('estacionamiento');
  });
});
