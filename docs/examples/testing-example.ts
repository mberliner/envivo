/**
 * EJEMPLO COMPLETO: Testing Strategy
 *
 * Este archivo muestra cómo implementar:
 * 1. Tests unitarios con Vitest
 * 2. Tests de integración con mocks
 * 3. Tests de componentes UI con React Testing Library
 * 4. Tests E2E con Playwright
 * 5. Mocking de APIs externas con MSW
 *
 * NOTA: Este es un archivo de EJEMPLO. Copiar código a /src durante implementación.
 */

// ============================================
// 1. TESTS UNITARIOS (Vitest)
// ============================================

/**
 * Tests de Business Rules
 * Archivo: src/features/events/domain/rules/__tests__/EventBusinessRules.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventBusinessRules } from '../EventBusinessRules';
import type { Event } from '../../entities/Event';

describe('EventBusinessRules', () => {
  let rules: EventBusinessRules;

  beforeEach(() => {
    rules = new EventBusinessRules({
      dateRules: {
        minDaysInFuture: -1,
        maxDaysInFuture: 365,
        allowPastEvents: true
      },
      locationRules: {
        allowedCountries: ['AR', 'UY', 'CL'],
        requiredLocation: true
      },
      contentRules: {
        minTitleLength: 3,
        requiredFields: ['title', 'date', 'venue']
      },
      duplicateRules: {
        matchFields: ['title', 'date', 'venue'],
        fuzzyMatchThreshold: 0.85,
        dateToleranceHours: 24
      },
      updateRules: {
        updateIfNewer: true,
        mergeFields: []
      }
    });
  });

  describe('isAcceptable', () => {
    it('should accept valid event', () => {
      const event: Event = {
        title: 'Concierto de Rock',
        date: new Date('2025-12-31'),
        venue: 'Estadio Luna Park',
        city: 'Buenos Aires',
        country: 'AR',
        category: 'Concierto',
        source: 'allaccess'
      };

      const result = rules.isAcceptable(event);
      expect(result.valid).toBe(true);
    });

    it('should reject event with missing required fields', () => {
      const event: Event = {
        title: 'Test',
        date: new Date('2025-12-31'),
        // Missing venue
        city: 'Buenos Aires',
        country: 'AR',
        source: 'test'
      };

      const result = rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('faltante');
      expect(result.field).toBe('venue');
    });

    it('should reject event outside allowed countries', () => {
      const event: Event = {
        title: 'Concert in USA',
        date: new Date('2025-12-31'),
        venue: 'Madison Square Garden',
        city: 'New York',
        country: 'US',
        category: 'Concierto',
        source: 'test'
      };

      const result = rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('País no permitido');
    });

    it('should reject event too far in future', () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 2);

      const event: Event = {
        title: 'Future Concert',
        date: farFuture,
        venue: 'Venue',
        city: 'Buenos Aires',
        country: 'AR',
        category: 'Concierto',
        source: 'test'
      };

      const result = rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('demasiado lejano');
    });
  });

  describe('isDuplicate', () => {
    it('should detect duplicates with similar titles', () => {
      const event1: Event = {
        title: 'Metallica en Buenos Aires',
        date: new Date('2025-06-15T20:00:00'),
        venue: 'Estadio River Plate',
        source: 'test'
      };

      const event2: Event = {
        title: 'Metallica en Bs As',
        date: new Date('2025-06-15T21:00:00'),
        venue: 'Estadio River Plate',
        source: 'test'
      };

      expect(rules.isDuplicate(event1, event2)).toBe(true);
    });

    it('should not detect duplicates with different venues', () => {
      const event1: Event = {
        title: 'Rock Concert',
        date: new Date('2025-06-15T20:00:00'),
        venue: 'Venue A',
        source: 'test'
      };

      const event2: Event = {
        title: 'Rock Concert',
        date: new Date('2025-06-15T20:00:00'),
        venue: 'Venue B',
        source: 'test'
      };

      expect(rules.isDuplicate(event1, event2)).toBe(false);
    });
  });

  describe('normalize', () => {
    it('should normalize event fields', () => {
      const event: Event = {
        title: '  Concierto  ',
        city: 'buenos aires',
        country: 'Argentina',
        date: '2025-06-15' as any,
        venue: 'Test',
        source: 'test'
      };

      const normalized = rules.normalize(event);

      expect(normalized.title).toBe('concierto');
      expect(normalized.city).toBe('Buenos Aires');
      expect(normalized.country).toBe('AR');
      expect(normalized.date).toBeInstanceOf(Date);
    });
  });
});

// ============================================
// 2. TESTS DE INTEGRACIÓN (Vitest + Mocks)
// ============================================

/**
 * Tests de DataSourceOrchestrator
 * Archivo: src/features/events/data/orchestrator/__tests__/DataSourceOrchestrator.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataSourceOrchestrator } from '../DataSourceOrchestrator';
import type { IDataSource } from '@/features/events/domain/interfaces/IDataSource';

class MockDataSource implements IDataSource {
  name: string;
  type: 'api' | 'scraper' | 'file';
  private mockData: any[];
  private shouldFail: boolean;

  constructor(name: string, mockData: any[] = [], shouldFail = false) {
    this.name = name;
    this.type = 'api';
    this.mockData = mockData;
    this.shouldFail = shouldFail;
  }

  async fetch(): Promise<any[]> {
    if (this.shouldFail) {
      throw new Error(`${this.name} fetch failed`);
    }
    return this.mockData;
  }
}

describe('DataSourceOrchestrator', () => {
  let orchestrator: DataSourceOrchestrator;

  beforeEach(() => {
    orchestrator = new DataSourceOrchestrator();
  });

  it('should fetch from all sources in parallel', async () => {
    const source1 = new MockDataSource('source1', [{ title: 'Event 1' }]);
    const source2 = new MockDataSource('source2', [{ title: 'Event 2' }]);

    orchestrator.register(source1);
    orchestrator.register(source2);

    const result = await orchestrator.fetchAll();

    expect(result.successful).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.totalEvents).toBe(2);
  });

  it('should handle failures gracefully', async () => {
    const workingSource = new MockDataSource('working', [{ title: 'Event 1' }]);
    const failingSource = new MockDataSource('failing', [], true);

    orchestrator.register(workingSource);
    orchestrator.register(failingSource);

    const result = await orchestrator.fetchAll();

    expect(result.successful).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.totalEvents).toBe(1);
  });

  it('should respect concurrency limit', async () => {
    const sources = Array.from({ length: 10 }, (_, i) =>
      new MockDataSource(`source${i}`, [{ title: `Event ${i}` }])
    );

    sources.forEach(s => orchestrator.register(s));

    const result = await orchestrator.fetchAll({ concurrency: 3 });

    expect(result.successful).toBe(10);
  });
});

// ============================================
// 3. TESTS DE COMPONENTES UI (React Testing Library)
// ============================================

/**
 * Tests de EventCard
 * Archivo: src/features/events/ui/__tests__/EventCard.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard } from '../EventCard';

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    title: 'Metallica en Buenos Aires',
    date: new Date('2025-06-15T20:00:00'),
    venue: 'Estadio River Plate',
    city: 'Buenos Aires',
    country: 'AR',
    imageUrl: 'https://example.com/image.jpg',
    price: 5000,
    currency: 'ARS'
  };

  it('should render event information', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText('Metallica en Buenos Aires')).toBeInTheDocument();
    expect(screen.getByText('Estadio River Plate')).toBeInTheDocument();
    expect(screen.getByText(/Buenos Aires/)).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText(/15.*Jun.*2025/i)).toBeInTheDocument();
  });

  it('should display price when available', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText(/5000.*ARS/i)).toBeInTheDocument();
  });

  it('should handle missing price gracefully', () => {
    const eventWithoutPrice = { ...mockEvent, price: undefined };
    render(<EventCard event={eventWithoutPrice} />);

    expect(screen.queryByText(/ARS/)).not.toBeInTheDocument();
  });
});

// ============================================
// 4. TESTS E2E (Playwright)
// ============================================

/**
 * Tests E2E de flujo de búsqueda
 * Archivo: e2e/search-flow.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Event Search Flow', () => {
  test('should search for events and view details', async ({ page }) => {
    // 1. Navegar a home
    await page.goto('/');

    // 2. Buscar eventos
    await page.fill('[data-testid="search-input"]', 'Metallica');
    await page.click('[data-testid="search-button"]');

    // 3. Verificar resultados
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(
      { min: 1 }
    );

    // 4. Ver detalle
    await page.click('[data-testid="event-card"]:first-child');

    // 5. Verificar detalle
    await expect(page.locator('h1')).toContainText('Metallica');
    await expect(page.locator('[data-testid="venue-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-date"]')).toBeVisible();
  });

  test('should filter events by city', async ({ page }) => {
    await page.goto('/');

    // Aplicar filtro de ciudad
    await page.click('[data-testid="city-filter"]');
    await page.click('text=Buenos Aires');

    // Verificar que todos los eventos son de Buenos Aires
    const eventCards = await page.locator('[data-testid="event-card"]').all();

    for (const card of eventCards) {
      await expect(card.locator('[data-testid="event-city"]')).toContainText(
        'Buenos Aires'
      );
    }
  });

  test('should show empty state when no results', async ({ page }) => {
    await page.goto('/');

    await page.fill('[data-testid="search-input"]', 'XYZ123456789');
    await page.click('[data-testid="search-button"]');

    await expect(page.getByText(/no se encontraron eventos/i)).toBeVisible();
  });
});

// ============================================
// 5. MOCKING DE APIS EXTERNAS (MSW)
// ============================================

/**
 * Mock de External API
 * Archivo: src/test/mocks/handlers.ts
 */

import { http, HttpResponse } from 'msw';

export const allaccessHandlers = [
  http.get('https://app.allaccess.com/discovery/v2/events', () => {
    return HttpResponse.json({
      _embedded: {
        events: [
          {
            name: 'Mock Event',
            dates: {
              start: {
                dateTime: '2025-06-15T20:00:00Z'
              }
            },
            _embedded: {
              venues: [
                {
                  name: 'Mock Venue',
                  city: { name: 'Buenos Aires' },
                  country: { name: 'Argentina' }
                }
              ]
            },
            images: [{ url: 'https://example.com/image.jpg' }],
            url: 'https://allaccess.com/event/123',
            priceRanges: [{ min: 1000, max: 5000 }]
          }
        ]
      }
    });
  })
];

/**
 * Setup de MSW
 * Archivo: src/test/mocks/server.ts
 */

import { setupServer } from 'msw/node';
import { allaccessHandlers } from './handlers';

export const server = setupServer(...allaccessHandlers);

/**
 * Configuración global de tests
 * Archivo: src/test/setup.ts
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// ============================================
// 6. CONFIGURACIÓN DE VITEST
// ============================================

/**
 * Archivo: vitest.config.ts
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

// ============================================
// 7. CONFIGURACIÓN DE PLAYWRIGHT
// ============================================

/**
 * Archivo: playwright.config.ts
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});

// ============================================
// SCRIPTS EN PACKAGE.JSON
// ============================================

/**
 * {
 *   "scripts": {
 *     "test": "vitest",
 *     "test:ui": "vitest --ui",
 *     "test:coverage": "vitest --coverage",
 *     "test:e2e": "playwright test",
 *     "test:e2e:ui": "playwright test --ui"
 *   }
 * }
 */
