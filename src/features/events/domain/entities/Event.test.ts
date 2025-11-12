import { describe, it, expect } from 'vitest';
import type { Event, EventCategory } from './Event';

describe('Event Entity', () => {
  it('should create a valid event with all required fields', () => {
    const mockEvent: Event = {
      id: 'evt-123',
      title: 'Metallica en River Plate',
      date: new Date('2025-12-15T20:00:00'),
      venueName: 'Estadio River Plate',
      city: 'Buenos Aires',
      country: 'AR',
      category: 'Concierto',
      currency: 'ARS',
      source: 'allaccess',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockEvent.id).toBe('evt-123');
    expect(mockEvent.title).toBe('Metallica en River Plate');
    expect(mockEvent.city).toBe('Buenos Aires');
    expect(mockEvent.category).toBe('Concierto');
    expect(mockEvent.source).toBe('allaccess');
  });

  it('should allow optional fields to be undefined', () => {
    const minimalEvent: Event = {
      id: 'evt-456',
      title: 'Test Event',
      date: new Date(),
      venueName: 'Test Venue',
      city: 'Test City',
      country: 'AR',
      category: 'Teatro',
      currency: 'ARS',
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Verificar que campos opcionales pueden ser undefined
    expect(minimalEvent.description).toBeUndefined();
    expect(minimalEvent.endDate).toBeUndefined();
    expect(minimalEvent.venueId).toBeUndefined();
    expect(minimalEvent.genre).toBeUndefined();
    expect(minimalEvent.artists).toBeUndefined();
    expect(minimalEvent.imageUrl).toBeUndefined();
    expect(minimalEvent.ticketUrl).toBeUndefined();
    expect(minimalEvent.price).toBeUndefined();
  });

  it('should support all event categories', () => {
    const categories: EventCategory[] = [
      'Concierto',
      'Festival',
      'Teatro',
      'Stand-up',
      'Ópera',
      'Ballet',
      'Otro',
    ];

    categories.forEach((category) => {
      const event: Event = {
        id: `evt-${category}`,
        title: `Event ${category}`,
        date: new Date(),
        venueName: 'Test Venue',
        city: 'Test City',
        country: 'AR',
        category,
        currency: 'ARS',
        source: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(event.category).toBe(category);
    });
  });
});
