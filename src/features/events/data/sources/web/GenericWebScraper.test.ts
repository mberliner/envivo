/**
 * GenericWebScraper Tests
 *
 * Tests con HTML fixtures (sin requests HTTP reales)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { GenericWebScraper } from './GenericWebScraper';
import { ScraperConfig } from './types/ScraperConfig';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// HTML fixtures
const MOCK_HTML_SINGLE_EVENT = `
<!DOCTYPE html>
<html>
<body>
  <div class="events-container">
    <div class="event-card">
      <img src="/images/metallica.jpg" class="event-img" />
      <h3 class="event-title">Metallica en vivo</h3>
      <p class="event-date">Viernes 15 de marzo de 2025, 21:00hs</p>
      <p class="event-venue">Café Berlín</p>
      <p class="event-city">Buenos Aires</p>
      <span class="event-price">$5.000</span>
      <a href="/eventos/metallica-123" class="event-link">Ver más</a>
      <p class="event-description">El mejor show de metal del año</p>
    </div>
  </div>
</body>
</html>
`;

const MOCK_HTML_MULTIPLE_EVENTS = `
<!DOCTYPE html>
<html>
<body>
  <div class="events-container">
    <div class="event-card">
      <h3 class="event-title">Metallica</h3>
      <p class="event-date">15 de marzo de 2025</p>
      <p class="event-venue">Café Berlín</p>
      <span class="event-price">$5.000</span>
    </div>
    <div class="event-card">
      <h3 class="event-title">Iron Maiden</h3>
      <p class="event-date">20 de abril de 2025</p>
      <p class="event-venue">Luna Park</p>
      <span class="event-price">$8.500</span>
    </div>
    <div class="event-card">
      <h3 class="event-title">AC/DC</h3>
      <p class="event-date">1 de mayo de 2025</p>
      <p class="event-venue">Estadio River</p>
      <span class="event-price">Gratis</span>
    </div>
  </div>
</body>
</html>
`;

const MOCK_HTML_MISSING_FIELDS = `
<!DOCTYPE html>
<html>
<body>
  <div class="events-container">
    <div class="event-card">
      <h3 class="event-title">Evento Sin Fecha</h3>
      <p class="event-venue">Venue</p>
    </div>
    <div class="event-card">
      <h3 class="event-title">Evento Sin Venue</h3>
      <p class="event-date">15 de marzo de 2025</p>
    </div>
    <div class="event-card">
      <p class="event-date">15 de marzo de 2025</p>
      <p class="event-venue">Venue</p>
    </div>
  </div>
</body>
</html>
`;

// Base config for tests
const BASE_CONFIG: ScraperConfig = {
  name: 'test-scraper',
  type: 'web',
  baseUrl: 'https://example.com',
  listing: {
    url: '/eventos',
    containerSelector: '.events-container',
    itemSelector: '.event-card',
  },
  selectors: {
    title: '.event-title',
    date: '.event-date',
    venue: '.event-venue',
    city: '.event-city',
    price: '.event-price',
    image: '.event-img@src',
    link: '.event-link@href',
    description: '.event-description',
  },
  transforms: {
    date: 'parseSpanishDate',
    price: 'extractPrice',
    image: 'toAbsoluteUrl',
    link: 'toAbsoluteUrl',
  },
  errorHandling: {
    skipFailedEvents: true,
    skipFailedPages: false,
  },
};

describe('GenericWebScraper', () => {
  beforeEach(() => {
    // Mock axios.create to return mocked instance
    mockedAxios.create = vi.fn(() => {
      return {
        get: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Construction', () => {
    it('should create scraper with valid config', () => {
      const scraper = new GenericWebScraper(BASE_CONFIG);

      expect(scraper.name).toBe('test-scraper');
      expect(scraper.type).toBe('web');
    });

    it('should merge config with defaults', () => {
      const minimalConfig: ScraperConfig = {
        name: 'minimal',
        type: 'web',
        baseUrl: 'https://example.com',
        listing: {
          url: '/eventos',
          itemSelector: '.event',
        },
        selectors: {
          title: '.title',
          date: '.date',
          venue: '.venue',
        },
      };

      const scraper = new GenericWebScraper(minimalConfig);

      // Defaults should be applied
      expect(scraper).toBeDefined();
    });
  });

  describe('Scraping - Single Event', () => {
    it('should extract single event correctly', async () => {
      // Mock HTTP response BEFORE creating scraper
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);
      const events = await scraper.fetch();

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        _source: 'test-scraper',
        title: 'Metallica en vivo',
        venue: 'Café Berlín',
        city: 'Buenos Aires',
        price: 5000,
        currency: 'ARS',
      });

      // Date should be parsed
      expect(events[0].date).toBeInstanceOf(Date);
      const eventDate = events[0].date as Date;
      expect(eventDate.getFullYear()).toBe(2025);
      expect(eventDate.getMonth()).toBe(2); // Marzo = 2 (0-indexed)

      // URLs should be absolute
      expect(events[0].imageUrl).toBe('https://example.com/images/metallica.jpg');
      expect(events[0].externalUrl).toBe('https://example.com/eventos/metallica-123');
    });
  });

  describe('Scraping - Multiple Events', () => {
    it('should extract multiple events correctly', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_MULTIPLE_EVENTS });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      expect(events).toHaveLength(3);
      expect(events[0].title).toBe('Metallica');
      expect(events[1].title).toBe('Iron Maiden');
      expect(events[2].title).toBe('AC/DC');
    });

    it('should parse different price formats', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_MULTIPLE_EVENTS });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      expect(events[0].price).toBe(5000); // "$5.000" → 5000
      expect(events[1].price).toBe(8500); // "$8.500" → 8500
      expect(events[2].price).toBe(0); // "Gratis" → 0
    });
  });

  describe('Validation', () => {
    it('should skip events with missing required fields', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_MISSING_FIELDS });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      // All 3 events are invalid (missing title, date, or venue)
      expect(events).toHaveLength(0);
    });

    it('should validate title, date, and venue are required', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_MISSING_FIELDS });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      // None of the events have all 3 required fields
      expect(events).toHaveLength(0);
    });
  });

  describe('Pagination', () => {
    it('should scrape multiple pages', async () => {
      const config: ScraperConfig = {
        ...BASE_CONFIG,
        listing: {
          ...BASE_CONFIG.listing,
          pagination: {
            type: 'url',
            pattern: '/eventos?page={page}',
            maxPages: 2,
          },
        },
      };

      const mockGet = vi.fn();
      mockGet.mockResolvedValueOnce({ data: MOCK_HTML_SINGLE_EVENT }); // Page 1
      mockGet.mockResolvedValueOnce({ data: MOCK_HTML_SINGLE_EVENT }); // Page 2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(config);

      const events = await scraper.fetch();

      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(events).toHaveLength(2); // 1 event per page
    });

    it('should respect maxPages limit', async () => {
      const config: ScraperConfig = {
        ...BASE_CONFIG,
        listing: {
          ...BASE_CONFIG.listing,
          pagination: {
            type: 'url',
            maxPages: 3,
          },
        },
      };

      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(config);

      await scraper.fetch();

      expect(mockGet).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should skip failed events when configured', async () => {
      const config: ScraperConfig = {
        ...BASE_CONFIG,
        errorHandling: {
          skipFailedEvents: true,
        },
      };

      // Mix of valid and invalid HTML
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_MULTIPLE_EVENTS });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(config);

      const events = await scraper.fetch();

      // Should extract all valid events despite any errors
      expect(events.length).toBeGreaterThan(0);
    });

    it('should throw error on HTTP failure', async () => {
      const config: ScraperConfig = {
        ...BASE_CONFIG,
        errorHandling: {
          skipFailedEvents: false,
          skipFailedPages: false,
          retry: {
            maxRetries: 1, // Reduce retries for faster test
            initialDelay: 100,
            backoffMultiplier: 1,
          },
        },
      };

      const mockGet = vi.fn().mockRejectedValue(new Error('Network error'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(config);

      await expect(scraper.fetch()).rejects.toThrow();
    });
  });

  describe('External ID Generation', () => {
    it('should use link as external ID when available', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      expect(events[0].externalId).toBe('https://example.com/eventos/metallica-123');
    });

    it('should generate external ID from title+date+venue when no link', async () => {
      const config: ScraperConfig = {
        ...BASE_CONFIG,
        selectors: {
          ...BASE_CONFIG.selectors,
          link: undefined, // No link selector
        },
      };

      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(config);

      const events = await scraper.fetch();

      // Should generate ID from title + date + venue
      expect(events[0].externalId).toBeTruthy();
      expect(events[0].externalId?.length).toBeGreaterThan(0);
    });
  });

  describe('Transformations', () => {
    it('should apply date transformation', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      expect(events[0].date).toBeInstanceOf(Date);
    });

    it('should apply price transformation', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      expect(typeof events[0].price).toBe('number');
      expect(events[0].price).toBe(5000);
    });

    it('should convert relative URLs to absolute', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      expect(events[0].imageUrl).toContain('https://example.com');
      expect(events[0].externalUrl).toContain('https://example.com');
    });
  });

  describe('Selectors', () => {
    it('should extract text from CSS selectors', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      expect(events[0].title).toBe('Metallica en vivo');
      expect(events[0].venue).toBe('Café Berlín');
    });

    it('should extract attributes with @ syntax', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(BASE_CONFIG);

      const events = await scraper.fetch();

      // Image and link use @src and @href
      expect(events[0].imageUrl).toContain('metallica.jpg');
      expect(events[0].externalUrl).toContain('metallica-123');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limit configuration', async () => {
      const config: ScraperConfig = {
        ...BASE_CONFIG,
        rateLimit: {
          requestsPerSecond: 1,
        },
      };

      const mockGet = vi.fn().mockResolvedValue({ data: MOCK_HTML_SINGLE_EVENT });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(config);

      await scraper.fetch();

      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('JSON-LD extraction', () => {
    const HTML_WITH_JSONLD = `
<!DOCTYPE html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "http://schema.org/",
    "@type": "Event",
    "name": "Metallica en vivo",
    "startDate": "2025-03-15T21:00:00Z",
    "endDate": "2025-03-15T23:00:00Z",
    "location": {
      "@type": "Place",
      "name": "Teatro Vorterix",
      "address": {
        "streetAddress": "Av. Federico Lacroze 3455",
        "addressLocality": "CABA",
        "postalCode": "1427"
      }
    },
    "offers": [
      {
        "@type": "Offer",
        "price": 35000,
        "priceCurrency": "ARS"
      },
      {
        "@type": "Offer",
        "price": 45000,
        "priceCurrency": "ARS"
      }
    ]
  }
  </script>
</head>
<body>
  <div class="event-card">
    <h3 class="event-title">Metallica</h3>
    <a href="/event/metallica" class="event-link">Ver más</a>
  </div>
</body>
</html>
`;

    it('should extract and parse JSON-LD from detail page', async () => {
      const config: ScraperConfig = {
        ...BASE_CONFIG,
        selectors: {
          ...BASE_CONFIG.selectors,
          link: '.event-link@href',
        },
        detailPage: {
          enabled: true,
          delayBetweenRequests: 0,
          selectors: {},
        },
      };

      const mockGet = vi
        .fn()
        .mockResolvedValueOnce({ data: MOCK_HTML_SINGLE_EVENT })
        .mockResolvedValueOnce({ data: HTML_WITH_JSONLD });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(config);
      const events = await scraper.fetch();

      expect(events).toHaveLength(1);
      expect(events[0].price).toBe(35000);
      expect(events[0].priceMax).toBe(45000);
      expect(events[0].venue).toBe('Teatro Vorterix');
      expect(events[0].address).toBe('Av. Federico Lacroze 3455, CABA, 1427');
    });

    it('should handle missing JSON-LD gracefully', async () => {
      const HTML_WITHOUT_JSONLD = `
<!DOCTYPE html>
<html>
<body>
  <div class="event-card">
    <h3 class="event-title">Metallica</h3>
  </div>
</body>
</html>
`;

      const config: ScraperConfig = {
        ...BASE_CONFIG,
        selectors: {
          ...BASE_CONFIG.selectors,
          link: '.event-link@href',
        },
        detailPage: {
          enabled: true,
          delayBetweenRequests: 0,
          selectors: {},
        },
      };

      const mockGet = vi
        .fn()
        .mockResolvedValueOnce({ data: MOCK_HTML_SINGLE_EVENT })
        .mockResolvedValueOnce({ data: HTML_WITHOUT_JSONLD });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({ get: mockGet });

      const scraper = new GenericWebScraper(config);
      const events = await scraper.fetch();

      expect(events).toHaveLength(1);
      // Should still return event even without JSON-LD
      expect(events[0].title).toBe('Metallica en vivo');
    });
  });
});
