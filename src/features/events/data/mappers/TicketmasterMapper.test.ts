import { describe, it, expect } from 'vitest';
import { TicketmasterMapper, TicketmasterEvent } from './TicketmasterMapper';

describe('TicketmasterMapper', () => {
  describe('toRawEvent', () => {
    it('should map a complete Ticketmaster event to RawEvent', () => {
      const apiEvent: TicketmasterEvent = {
        id: 'vvG1ZZYQ7nZhZD',
        name: 'Metallica',
        type: 'event',
        url: 'https://www.ticketmaster.com/event/123',
        dates: {
          start: {
            dateTime: '2025-12-15T20:00:00Z',
            localDate: '2025-12-15',
            localTime: '20:00:00',
          },
        },
        classifications: [
          {
            segment: { name: 'Music' },
            genre: { name: 'Metal' },
            subGenre: { name: 'Heavy Metal' },
          },
        ],
        priceRanges: [
          {
            type: 'standard',
            currency: 'USD',
            min: 50,
            max: 250,
          },
        ],
        images: [
          {
            url: 'https://example.com/metallica.jpg',
            width: 1024,
            height: 768,
          },
        ],
        _embedded: {
          venues: [
            {
              name: 'Madison Square Garden',
              city: { name: 'New York' },
              state: { name: 'New York', stateCode: 'NY' },
              country: { name: 'United States', countryCode: 'US' },
              address: { line1: '4 Pennsylvania Plaza' },
              location: {
                latitude: '40.750504',
                longitude: '-73.993439',
              },
            },
          ],
        },
      };

      const event = TicketmasterMapper.toRawEvent(apiEvent);

      expect(event.externalId).toBe('vvG1ZZYQ7nZhZD');
      expect(event.title).toBe('Metallica');
      expect(event.date).toEqual(new Date('2025-12-15T20:00:00Z'));
      expect(event.venue).toBe('Madison Square Garden');
      expect(event.city).toBe('New York');
      expect(event.country).toBe('US');
      expect(event.category).toBe('Concierto');
      expect(event.genre).toBe('Metal');
      expect(event.price).toBe(50);
      expect(event.priceMax).toBe(250);
      expect(event.currency).toBe('USD');
      expect(event.ticketUrl).toBe('https://www.ticketmaster.com/event/123');
      expect(event.imageUrl).toBe('https://example.com/metallica.jpg');
      expect(event._ticketmaster).toBeDefined();
      expect(event._ticketmaster?.latitude).toBe('40.750504');
      expect(event._ticketmaster?.longitude).toBe('-73.993439');
    });

    it('should handle events with only localDate (no time)', () => {
      const apiEvent: TicketmasterEvent = {
        id: 'abc123',
        name: 'Festival Event',
        dates: {
          start: {
            localDate: '2025-08-20',
          },
        },
        _embedded: {
          venues: [
            {
              name: 'Central Park',
              city: { name: 'New York' },
              country: { countryCode: 'US' },
            },
          ],
        },
      };

      const event = TicketmasterMapper.toRawEvent(apiEvent);

      expect(event.date).toEqual(new Date('2025-08-20T00:00:00'));
      expect(event.title).toBe('Festival Event');
    });

    it('should handle free events (price = 0)', () => {
      const apiEvent: TicketmasterEvent = {
        id: 'free123',
        name: 'Free Concert in the Park',
        dates: {
          start: {
            dateTime: '2025-07-04T18:00:00Z',
          },
        },
        priceRanges: [
          {
            currency: 'USD',
            min: 0,
            max: 0,
          },
        ],
        _embedded: {
          venues: [
            {
              city: { name: 'Austin' },
              country: { countryCode: 'US' },
            },
          ],
        },
      };

      const event = TicketmasterMapper.toRawEvent(apiEvent);

      expect(event.price).toBe(0);
      expect(event.priceMax).toBe(0);
    });

    it('should map Festival category correctly', () => {
      const apiEvent: TicketmasterEvent = {
        id: 'festival123',
        name: 'Lollapalooza',
        dates: {
          start: {
            dateTime: '2025-08-01T12:00:00Z',
          },
        },
        classifications: [
          {
            segment: { name: 'Music' },
            genre: { name: 'Festival' },
          },
        ],
        _embedded: {
          venues: [
            {
              city: { name: 'Chicago' },
              country: { countryCode: 'US' },
            },
          ],
        },
      };

      const event = TicketmasterMapper.toRawEvent(apiEvent);

      expect(event.category).toBe('Festival');
    });

    it('should map Theater category correctly', () => {
      const apiEvent: TicketmasterEvent = {
        id: 'theater123',
        name: 'Hamilton',
        dates: {
          start: {
            dateTime: '2025-09-15T19:30:00Z',
          },
        },
        classifications: [
          {
            segment: { name: 'Arts & Theatre' },
            genre: { name: 'Theatre' },
          },
        ],
        _embedded: {
          venues: [
            {
              city: { name: 'London' },
              country: { countryCode: 'GB' },
            },
          ],
        },
      };

      const event = TicketmasterMapper.toRawEvent(apiEvent);

      expect(event.category).toBe('Teatro');
    });

    it('should map Stand-up category correctly', () => {
      const apiEvent: TicketmasterEvent = {
        id: 'comedy123',
        name: 'Kevin Hart Live',
        dates: {
          start: {
            dateTime: '2025-10-01T20:00:00Z',
          },
        },
        classifications: [
          {
            segment: { name: 'Arts & Theatre' },
            genre: { name: 'Comedy' },
          },
        ],
        _embedded: {
          venues: [
            {
              city: { name: 'Los Angeles' },
              country: { countryCode: 'US' },
            },
          ],
        },
      };

      const event = TicketmasterMapper.toRawEvent(apiEvent);

      expect(event.category).toBe('Stand-up');
    });

    it('should handle events with missing optional fields', () => {
      const apiEvent: TicketmasterEvent = {
        id: 'minimal123',
        name: 'Minimal Event',
        dates: {
          start: {
            dateTime: '2025-11-01T18:00:00Z',
          },
        },
        _embedded: {
          venues: [
            {
              city: { name: 'Seattle' },
              country: { countryCode: 'US' },
            },
          ],
        },
      };

      const event = TicketmasterMapper.toRawEvent(apiEvent);

      expect(event.venue).toBeUndefined();
      expect(event.genre).toBeUndefined();
      expect(event.price).toBeUndefined();
      expect(event.priceMax).toBeUndefined();
      expect(event.imageUrl).toBeUndefined();
      expect(event.category).toBe('Otro');
    });

    it('should throw error if event has no valid date', () => {
      const apiEvent: TicketmasterEvent = {
        id: 'nodate123',
        name: 'Event Without Date',
        dates: {
          start: {},
        },
        _embedded: {
          venues: [
            {
              city: { name: 'Boston' },
              country: { countryCode: 'US' },
            },
          ],
        },
      };

      expect(() => TicketmasterMapper.toRawEvent(apiEvent)).toThrow(
        'Event nodate123 has no valid date'
      );
    });
  });

  describe('toRawEvents', () => {
    it('should map multiple events successfully', () => {
      const apiEvents: TicketmasterEvent[] = [
        {
          id: 'event1',
          name: 'Event 1',
          dates: {
            start: {
              dateTime: '2025-12-01T20:00:00Z',
            },
          },
          _embedded: {
            venues: [
              {
                city: { name: 'City1' },
                country: { countryCode: 'US' },
              },
            ],
          },
        },
        {
          id: 'event2',
          name: 'Event 2',
          dates: {
            start: {
              dateTime: '2025-12-02T20:00:00Z',
            },
          },
          _embedded: {
            venues: [
              {
                city: { name: 'City2' },
                country: { countryCode: 'US' },
              },
            ],
          },
        },
      ];

      const events = TicketmasterMapper.toRawEvents(apiEvents);

      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Event 1');
      expect(events[1].title).toBe('Event 2');
    });

    it('should filter out events that fail to map and continue with others', () => {
      const apiEvents: TicketmasterEvent[] = [
        {
          id: 'valid1',
          name: 'Valid Event',
          dates: {
            start: {
              dateTime: '2025-12-01T20:00:00Z',
            },
          },
          _embedded: {
            venues: [
              {
                city: { name: 'City1' },
                country: { countryCode: 'US' },
              },
            ],
          },
        },
        {
          id: 'invalid',
          name: 'Invalid Event',
          dates: {
            start: {}, // Sin fecha válida
          },
          _embedded: {
            venues: [
              {
                city: { name: 'City2' },
                country: { countryCode: 'US' },
              },
            ],
          },
        },
        {
          id: 'valid2',
          name: 'Another Valid Event',
          dates: {
            start: {
              dateTime: '2025-12-03T20:00:00Z',
            },
          },
          _embedded: {
            venues: [
              {
                city: { name: 'City3' },
                country: { countryCode: 'US' },
              },
            ],
          },
        },
      ];

      const events = TicketmasterMapper.toRawEvents(apiEvents);

      // Solo 2 eventos válidos mapeados, el inválido fue filtrado
      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Valid Event');
      expect(events[1].title).toBe('Another Valid Event');
    });
  });
});
