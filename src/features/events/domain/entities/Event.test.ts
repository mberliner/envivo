import { describe, it, expect } from 'vitest';
import type { Event } from './Event';

describe('Event Entity', () => {
  it('should have correct type structure', () => {
    const mockEvent: Event = {
      id: 'test-id-123',
      title: 'Metallica en Buenos Aires',
      description: 'Concierto de heavy metal',
      date: new Date('2025-12-01'),
      venueName: 'Estadio River Plate',
      city: 'Buenos Aires',
      country: 'AR',
      category: 'Concierto',
      genre: 'Rock',
      currency: 'ARS',
      source: 'ticketmaster',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockEvent.title).toBe('Metallica en Buenos Aires');
    expect(mockEvent.city).toBe('Buenos Aires');
    expect(mockEvent.category).toBe('Concierto');
  });

  it('should allow optional fields', () => {
    const minimalEvent: Event = {
      id: 'test-id-456',
      title: 'Test Event',
      date: new Date(),
      venueName: 'Test Venue',
      city: 'Test City',
      country: 'AR',
      category: 'Concierto',
      currency: 'ARS',
      source: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(minimalEvent.description).toBeUndefined();
    expect(minimalEvent.genre).toBeUndefined();
    expect(minimalEvent.imageUrl).toBeUndefined();
  });
});
