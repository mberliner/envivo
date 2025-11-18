/**
 * AllAccess Mapper Tests
 */

import { describe, it, expect } from 'vitest';
import { AllAccessMapper } from './AllAccessMapper';
import type { CrowderCard } from './AllAccessJsonScraper';

describe('AllAccessMapper', () => {
  const baseUrl = 'https://www.allaccess.com.ar';

  describe('cardToRawEvent', () => {
    it('should map a complete card to RawEvent', () => {
      const card: CrowderCard = {
        title: 'BUENOS VAMPIROS EN VORTERIX',
        description: '21 de Noviembre',
        link: '../event/buenos-vampiros-en-vorterix',
        imgUrl: 'https://cdn.getcrowder.com/images/a843d128-6b34-44a8-b0c8-3d5bc156293a-1920x720.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('BUENOS VAMPIROS EN VORTERIX');
      expect(result?.date).toBeInstanceOf(Date);
      expect(result?._source).toBe('allaccess');
      expect(result?.externalUrl).toBe('https://www.allaccess.com.ar/event/buenos-vampiros-en-vorterix');
      expect(result?.venue).toBe('Teatro Vorterix'); // Inferred from link
      expect(result?.city).toBe('Buenos Aires');
      expect(result?.country).toBe('AR');
    });

    it('should handle cards without title', () => {
      const card: CrowderCard = {
        title: null,
        description: '22 de Noviembre',
        link: '../event/los-espiritus',
        imgUrl: 'https://cdn.getcrowder.com/images/example.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Los Espiritus'); // Extracted from link
    });

    it('should handle cards without description (date)', () => {
      const card: CrowderCard = {
        title: 'Test Event',
        description: null,
        link: '../event/test-event',
        imgUrl: 'https://cdn.getcrowder.com/images/example.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result).not.toBeNull();
      expect(result?.date).toBeInstanceOf(Date); // Should have fallback date
    });

    it('should return null for cards without link', () => {
      const card: CrowderCard = {
        title: 'Test Event',
        description: '21 de Noviembre',
        link: '',
        imgUrl: 'https://cdn.getcrowder.com/images/example.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result).toBeNull();
    });

    it('should infer venue from link patterns', () => {
      const testCases: Array<{ link: string; expectedVenue: string | undefined }> = [
        { link: '../event/buenos-vampiros-en-vorterix', expectedVenue: 'Teatro Vorterix' },
        { link: '../event/los-espiritus-roxy-live', expectedVenue: 'The Roxy Live' },
        { link: '../event/some-event', expectedVenue: undefined },
      ];

      for (const { link, expectedVenue } of testCases) {
        const card: CrowderCard = {
          title: 'Test',
          description: '21 de Noviembre',
          link,
          imgUrl: 'https://example.com/img.jpg',
        };

        const result = AllAccessMapper.cardToRawEvent(card, baseUrl);
        expect(result?.venue).toBe(expectedVenue);
      }
    });

    it('should handle absolute image URLs', () => {
      const card: CrowderCard = {
        title: 'Test Event',
        description: '21 de Noviembre',
        link: '../event/test',
        imgUrl: 'https://cdn.getcrowder.com/images/example.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result?.imageUrl).toBe('https://cdn.getcrowder.com/images/example.jpg');
    });
  });

  describe('cardsToRawEvents', () => {
    it('should map multiple cards', () => {
      const cards: CrowderCard[] = [
        {
          title: 'Event 1',
          description: '21 de Noviembre',
          link: '../event/event-1',
          imgUrl: 'https://example.com/1.jpg',
        },
        {
          title: 'Event 2',
          description: '22 de Noviembre',
          link: '../event/event-2',
          imgUrl: 'https://example.com/2.jpg',
        },
      ];

      const results = AllAccessMapper.cardsToRawEvents(cards, baseUrl);

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Event 1');
      expect(results[1].title).toBe('Event 2');
    });

    it('should filter out invalid cards', () => {
      const cards: CrowderCard[] = [
        {
          title: 'Valid Event',
          description: '21 de Noviembre',
          link: '../event/valid',
          imgUrl: 'https://example.com/valid.jpg',
        },
        {
          title: 'Invalid Event',
          description: '22 de Noviembre',
          link: '', // Invalid: no link
          imgUrl: 'https://example.com/invalid.jpg',
        },
      ];

      const results = AllAccessMapper.cardsToRawEvents(cards, baseUrl);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Valid Event');
    });
  });

  describe('parseSpanishDate', () => {
    it('should parse "21 de Noviembre" to current/next year', () => {
      const card: CrowderCard = {
        title: 'Test',
        description: '21 de Noviembre',
        link: '../event/test',
        imgUrl: 'https://example.com/img.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result?.date).toBeInstanceOf(Date);
      const date = result?.date as Date;
      expect(date.getMonth()).toBe(10); // Noviembre = 10 (0-indexed)
      expect(date.getDate()).toBe(21);
    });

    it('should parse "22 de Diciembre" to current/next year', () => {
      const card: CrowderCard = {
        title: 'Test',
        description: '22 de Diciembre',
        link: '../event/test',
        imgUrl: 'https://example.com/img.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result?.date).toBeInstanceOf(Date);
      const date = result?.date as Date;
      expect(date.getMonth()).toBe(11); // Diciembre = 11
      expect(date.getDate()).toBe(22);
    });

    it('should handle HTML entities in dates', () => {
      const card: CrowderCard = {
        title: 'Test',
        description: '21&nbsp;de Noviembre',
        link: '../event/test',
        imgUrl: 'https://example.com/img.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result?.date).toBeInstanceOf(Date);
    });
  });

  describe('URL handling', () => {
    it('should convert relative URLs starting with ../ to absolute', () => {
      const card: CrowderCard = {
        title: 'Test',
        description: '21 de Noviembre',
        link: '../event/test-event',
        imgUrl: '../images/test.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result?.externalUrl).toBe('https://www.allaccess.com.ar/event/test-event');
      expect(result?.imageUrl).toBe('https://www.allaccess.com.ar/images/test.jpg');
    });

    it('should handle absolute URLs unchanged', () => {
      const card: CrowderCard = {
        title: 'Test',
        description: '21 de Noviembre',
        link: 'https://www.allaccess.com.ar/event/test',
        imgUrl: 'https://cdn.example.com/image.jpg',
      };

      const result = AllAccessMapper.cardToRawEvent(card, baseUrl);

      expect(result?.externalUrl).toBe('https://www.allaccess.com.ar/event/test');
      expect(result?.imageUrl).toBe('https://cdn.example.com/image.jpg');
    });
  });
});
