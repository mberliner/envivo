import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock env module BEFORE importing TicketmasterSource
vi.mock('@/shared/infrastructure/config/env', () => ({
  env: {
    DATABASE_URL: 'file:./test.db',
    NODE_ENV: 'test',
    TICKETMASTER_API_KEY: 'test-env-api-key',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_NAME: 'EnVivo Test',
  },
}));

// Import AFTER mocking env
import { TicketmasterSource } from './TicketmasterSource';

describe('TicketmasterSource', () => {
  beforeEach(() => {
    // Mock console.warn y console.log para tests limpios
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with custom API key', () => {
      const source = new TicketmasterSource({ apiKey: 'custom-api-key' });
      expect(source.name).toBe('ticketmaster');
      expect(source.type).toBe('api');
    });

    it('should use env API key when not provided in config', () => {
      const source = new TicketmasterSource(); // Usa env.TICKETMASTER_API_KEY mockeado
      expect(source.name).toBe('ticketmaster');
      expect(source.type).toBe('api');
    });
  });

  describe('fetch', () => {
    it('should fetch and map events successfully', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get');
      const source = new TicketmasterSource({ apiKey: 'test-api-key' });

      const mockApiResponse = {
        data: {
          _embedded: {
            events: [
              {
                id: 'event1',
                name: 'Metallica Live',
                dates: {
                  start: {
                    dateTime: '2025-12-01T20:00:00Z',
                  },
                },
                _embedded: {
                  venues: [
                    {
                      name: 'Luna Park',
                      city: { name: 'Buenos Aires' },
                      country: { countryCode: 'AR' },
                    },
                  ],
                },
                classifications: [
                  {
                    segment: { name: 'Music' },
                    genre: { name: 'Rock' },
                  },
                ],
              },
              {
                id: 'event2',
                name: 'Coldplay',
                dates: {
                  start: {
                    dateTime: '2025-12-05T21:00:00Z',
                  },
                },
                _embedded: {
                  venues: [
                    {
                      name: 'Estadio River Plate',
                      city: { name: 'Buenos Aires' },
                      country: { countryCode: 'AR' },
                    },
                  ],
                },
              },
            ],
          },
        },
      };

      axiosGetSpy.mockResolvedValueOnce(mockApiResponse as unknown as typeof mockApiResponse);

      const events = await source.fetch();

      expect(axiosGetSpy).toHaveBeenCalledWith(
        'https://app.ticketmaster.com/discovery/v2/events.json',
        expect.objectContaining({
          params: expect.objectContaining({
            apikey: 'test-api-key',
            countryCode: 'AR',
            classificationName: 'Music',
          }),
        })
      );

      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Metallica Live');
      expect(events[0].externalId).toBe('event1');
      expect(events[1].title).toBe('Coldplay');
    });

    it('should return empty array if no events found', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get');
      const source = new TicketmasterSource({ apiKey: 'test-api-key' });

      axiosGetSpy.mockResolvedValueOnce({
        data: {
          _embedded: undefined,
        },
      } as unknown as typeof axiosGetSpy);

      const events = await source.fetch();

      expect(events).toHaveLength(0);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No events found')
      );
    });

    it('should handle 401 unauthorized error', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get');
      const isAxiosErrorSpy = vi.spyOn(axios, 'isAxiosError');
      const source = new TicketmasterSource({ apiKey: 'invalid-key' });

      isAxiosErrorSpy.mockReturnValue(true);
      axiosGetSpy.mockRejectedValueOnce({
        response: { status: 401 },
        message: 'Unauthorized',
      });

      await expect(source.fetch()).rejects.toThrow('Ticketmaster API: Invalid API key');
    });

    it('should handle 429 rate limit error', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get');
      const isAxiosErrorSpy = vi.spyOn(axios, 'isAxiosError');
      const source = new TicketmasterSource({ apiKey: 'test-api-key' });

      isAxiosErrorSpy.mockReturnValue(true);
      axiosGetSpy.mockRejectedValueOnce({
        response: { status: 429 },
        message: 'Too Many Requests',
      });

      await expect(source.fetch()).rejects.toThrow('Ticketmaster API: Rate limit exceeded');
    });

    it('should handle timeout error', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get');
      const isAxiosErrorSpy = vi.spyOn(axios, 'isAxiosError');
      const source = new TicketmasterSource({ apiKey: 'test-api-key', timeout: 5000 });

      isAxiosErrorSpy.mockReturnValue(true);
      axiosGetSpy.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      });

      await expect(source.fetch()).rejects.toThrow('Ticketmaster API: Request timeout');
    });

    it('should use custom params when provided', async () => {
      const axiosGetSpy = vi.spyOn(axios, 'get');
      const source = new TicketmasterSource({ apiKey: 'test-api-key' });

      axiosGetSpy.mockResolvedValueOnce({
        data: {
          _embedded: { events: [] },
        },
      } as unknown as typeof axiosGetSpy);

      await source.fetch({ city: 'Cordoba', country: 'AR' });

      expect(axiosGetSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            city: 'Cordoba',
            countryCode: 'AR',
          }),
        })
      );
    });
  });
});
