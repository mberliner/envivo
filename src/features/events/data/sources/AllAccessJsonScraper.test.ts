/**
 * AllAccess JSON Scraper Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AllAccessJsonScraper } from './AllAccessJsonScraper';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
  create: ReturnType<typeof vi.fn>;
};

describe('AllAccessJsonScraper', () => {
  let scraper: AllAccessJsonScraper;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup mock axios instance
    mockGet = vi.fn();
    mockedAxios.create = vi.fn(() => ({
      get: mockGet,
    })) as unknown as ReturnType<typeof vi.fn>;

    // Default: disable detail scraping for tests (faster)
    scraper = new AllAccessJsonScraper({ scrapeDetails: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetch', () => {
    it('should extract events from bootstrapData', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <body>
          <script>
            (function() {
              var App = window.App = new (require('app/app'))({});
              App.bootstrapData({
                "model": {
                  "data": {
                    "widgetComponents": [
                      {
                        "id": "test-widget",
                        "widgetType": "Grid",
                        "state": {
                          "enabled": true,
                          "header": {
                            "title": "Test Events"
                          },
                          "cards": [
                            {
                              "title": "Test Event 1",
                              "description": "21 de Noviembre",
                              "link": "../event/test-event-1",
                              "imgUrl": "https://example.com/1.jpg"
                            },
                            {
                              "title": "Test Event 2",
                              "description": "22 de Noviembre",
                              "link": "../event/test-event-2",
                              "imgUrl": "https://example.com/2.jpg"
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              });
              App.start();
            })();
          </script>
        </body>
        </html>
      `;

      mockGet.mockResolvedValue({ data: mockHtml });

      const events = await scraper.fetch();

      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Test Event 1');
      expect(events[1].title).toBe('Test Event 2');
      expect(events[0]._source).toBe('allaccess');
    });

    it('should filter out mobile-only widgets to avoid duplicates', async () => {
      const mockHtml = `
        <script>
          App.bootstrapData({
            "model": {
              "data": {
                "widgetComponents": [
                  {
                    "id": "desktop-widget",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": true,
                      "config": {
                        "deviceVisibility": "show_desktop"
                      },
                      "cards": [
                        {
                          "title": "Desktop Event",
                          "description": "21 de Noviembre",
                          "link": "../event/desktop-event",
                          "imgUrl": "https://example.com/desktop.jpg"
                        }
                      ]
                    }
                  },
                  {
                    "id": "mobile-widget",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": true,
                      "config": {
                        "deviceVisibility": "show_mobile"
                      },
                      "cards": [
                        {
                          "title": "Mobile Event",
                          "description": "21 de Noviembre",
                          "link": "../event/mobile-event",
                          "imgUrl": "https://example.com/mobile.jpg"
                        }
                      ]
                    }
                  }
                ]
              }
            }
          });
        </script>
      `;

      mockGet.mockResolvedValue({ data: mockHtml });

      const events = await scraper.fetch();

      // Should only include desktop widget
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Desktop Event');
    });

    it('should deduplicate events by link', async () => {
      const mockHtml = `
        <script>
          App.bootstrapData({
            "model": {
              "data": {
                "widgetComponents": [
                  {
                    "id": "widget-1",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": true,
                      "cards": [
                        {
                          "title": "Duplicate Event",
                          "description": "21 de Noviembre",
                          "link": "../event/duplicate-event",
                          "imgUrl": "https://example.com/1.jpg"
                        }
                      ]
                    }
                  },
                  {
                    "id": "widget-2",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": true,
                      "cards": [
                        {
                          "title": "Duplicate Event Again",
                          "description": "22 de Noviembre",
                          "link": "../event/duplicate-event",
                          "imgUrl": "https://example.com/2.jpg"
                        }
                      ]
                    }
                  }
                ]
              }
            }
          });
        </script>
      `;

      mockGet.mockResolvedValue({ data: mockHtml });

      const events = await scraper.fetch();

      // Should deduplicate
      expect(events).toHaveLength(1);
      expect(events[0].externalUrl).toContain('duplicate-event');
    });

    it('should skip disabled widgets', async () => {
      const mockHtml = `
        <script>
          App.bootstrapData({
            "model": {
              "data": {
                "widgetComponents": [
                  {
                    "id": "enabled-widget",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": true,
                      "cards": [
                        {
                          "title": "Enabled Event",
                          "link": "../event/enabled",
                          "imgUrl": "https://example.com/enabled.jpg"
                        }
                      ]
                    }
                  },
                  {
                    "id": "disabled-widget",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": false,
                      "cards": [
                        {
                          "title": "Disabled Event",
                          "link": "../event/disabled",
                          "imgUrl": "https://example.com/disabled.jpg"
                        }
                      ]
                    }
                  }
                ]
              }
            }
          });
        </script>
      `;

      mockGet.mockResolvedValue({ data: mockHtml });

      const events = await scraper.fetch();

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Enabled Event');
    });

    it('should skip non-Grid widgets', async () => {
      const mockHtml = `
        <script>
          App.bootstrapData({
            "model": {
              "data": {
                "widgetComponents": [
                  {
                    "id": "html-widget",
                    "widgetType": "Html",
                    "state": {
                      "enabled": true,
                      "html": "<div>Some HTML</div>"
                    }
                  },
                  {
                    "id": "grid-widget",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": true,
                      "cards": [
                        {
                          "title": "Grid Event",
                          "link": "../event/grid-event",
                          "imgUrl": "https://example.com/grid.jpg"
                        }
                      ]
                    }
                  }
                ]
              }
            }
          });
        </script>
      `;

      mockGet.mockResolvedValue({ data: mockHtml });

      const events = await scraper.fetch();

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Grid Event');
    });

    it('should handle empty bootstrapData gracefully', async () => {
      const mockHtml = `
        <script>
          App.bootstrapData({});
        </script>
      `;

      mockGet.mockResolvedValue({ data: mockHtml });

      const events = await scraper.fetch();

      expect(events).toHaveLength(0);
    });

    it('should throw error if bootstrapData not found', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <body>
          <p>No bootstrapData here</p>
        </body>
        </html>
      `;

      mockGet.mockResolvedValue({ data: mockHtml });

      await expect(scraper.fetch()).rejects.toThrow('Could not find App.bootstrapData()');
    });

    it('should throw error if bootstrapData is invalid JSON', async () => {
      const mockHtml = `
        <script>
          App.bootstrapData({ invalid json });
        </script>
      `;

      mockGet.mockResolvedValue({ data: mockHtml });

      await expect(scraper.fetch()).rejects.toThrow('Failed to parse bootstrapData JSON');
    });

    it('should handle HTTP errors', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(scraper.fetch()).rejects.toThrow('Failed to scrape allaccess');
    });
  });

  describe('detail scraping', () => {
    it('should enrich events with detail page data when enabled', async () => {
      // Crear scraper con detail scraping habilitado
      const scraperWithDetails = new AllAccessJsonScraper({
        scrapeDetails: true,
        delayBetweenDetails: 0, // No delay for tests
      });

      const mockHomepage = `
        <script>
          App.bootstrapData({
            "model": {
              "data": {
                "widgetComponents": [
                  {
                    "id": "test-widget",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": true,
                      "cards": [
                        {
                          "title": "Test Event",
                          "description": "21 de Noviembre",
                          "link": "../event/test-event",
                          "imgUrl": "https://example.com/test.jpg"
                        }
                      ]
                    }
                  }
                ]
              }
            }
          });
        </script>
      `;

      const mockDetailPage = `
        <html>
        <head>
          <script type="application/ld+json">
            {
              "@type": "Event",
              "name": "Test Event",
              "startDate": "2025-11-21T22:00:00Z",
              "endDate": "2025-11-22T01:00:00Z",
              "location": {
                "@type": "Place",
                "name": "Teatro Vorterix",
                "address": {
                  "streetAddress": "Av. Federico Lacroze 3455",
                  "addressLocality": "CABA",
                  "postalCode": "1414"
                }
              },
              "offers": [
                {"@type": "Offer", "price": 40000, "priceCurrency": "ARS"},
                {"@type": "Offer", "price": 16000, "priceCurrency": "ARS"}
              ]
            }
          </script>
        </head>
        </html>
      `;

      mockGet
        .mockResolvedValueOnce({ data: mockHomepage }) // Homepage
        .mockResolvedValueOnce({ data: mockDetailPage }); // Detail page

      const events = await scraperWithDetails.fetch();

      expect(events).toHaveLength(1);
      const event = events[0];

      // Verificar datos enriquecidos
      expect(event.title).toBe('Test Event');
      expect(event.price).toBe(16000); // Precio mínimo
      expect(event.priceMax).toBe(40000); // Precio máximo
      expect(event.venue).toBe('Teatro Vorterix');
      expect(event.address).toBe('Av. Federico Lacroze 3455, CABA, 1414');
      expect(event.date).toBeInstanceOf(Date);
      expect((event.date as Date).getHours()).toBe(22); // 22:00 UTC
    });

    it('should continue on detail page errors', async () => {
      const scraperWithDetails = new AllAccessJsonScraper({
        scrapeDetails: true,
        delayBetweenDetails: 0,
      });

      const mockHomepage = `
        <script>
          App.bootstrapData({
            "model": {
              "data": {
                "widgetComponents": [
                  {
                    "id": "test",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": true,
                      "cards": [
                        {
                          "title": "Event 1",
                          "link": "../event/event-1",
                          "imgUrl": "https://example.com/1.jpg"
                        },
                        {
                          "title": "Event 2",
                          "link": "../event/event-2",
                          "imgUrl": "https://example.com/2.jpg"
                        }
                      ]
                    }
                  }
                ]
              }
            }
          });
        </script>
      `;

      mockGet
        .mockResolvedValueOnce({ data: mockHomepage })
        .mockRejectedValueOnce(new Error('Network error')) // Detail page 1 fails
        .mockResolvedValueOnce({ data: '<html></html>' }); // Detail page 2 succeeds (but no JSON-LD)

      const events = await scraperWithDetails.fetch();

      // Debe extraer ambos eventos a pesar del error
      expect(events).toHaveLength(2);
    });

    it('should not scrape details when disabled', async () => {
      const scraperNoDetails = new AllAccessJsonScraper({ scrapeDetails: false });

      const mockHomepage = `
        <script>
          App.bootstrapData({
            "model": {
              "data": {
                "widgetComponents": [
                  {
                    "id": "test",
                    "widgetType": "Grid",
                    "state": {
                      "enabled": true,
                      "cards": [
                        {
                          "title": "Test Event",
                          "link": "../event/test",
                          "imgUrl": "https://example.com/test.jpg"
                        }
                      ]
                    }
                  }
                ]
              }
            }
          });
        </script>
      `;

      mockGet.mockResolvedValueOnce({ data: mockHomepage });

      const events = await scraperNoDetails.fetch();

      // Solo debe hacer 1 llamada HTTP (homepage)
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(events).toHaveLength(1);
      expect(events[0].price).toBeUndefined(); // No detail data
    });
  });

  describe('name and type', () => {
    it('should have correct name', () => {
      expect(scraper.name).toBe('allaccess');
    });

    it('should have correct type', () => {
      expect(scraper.type).toBe('web');
    });
  });
});
