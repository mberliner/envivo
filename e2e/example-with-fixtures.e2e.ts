import { test, expect } from '@playwright/test';
import { setupTestData, teardownTestData } from './helpers/testFixtures';

/**
 * Ejemplo de test E2E usando test fixtures
 *
 * Este test demuestra cómo usar setupTestData/teardownTestData
 * para crear datos de prueba y limpiarlos después.
 */

test.describe('Example - Test con Fixtures', () => {
  // Setup: crear datos ANTES de todos los tests
  test.beforeAll(async () => {
    await setupTestData(5); // Crear 5 eventos de prueba
  });

  // Teardown: limpiar datos DESPUÉS de todos los tests
  test.afterAll(async () => {
    await teardownTestData();
  });

  test('debe mostrar eventos de prueba', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 15000 });

    // Verificar que hay eventos
    const eventCards = page.locator('[data-testid="event-card"]');
    const count = await eventCards.count();
    expect(count).toBeGreaterThan(0);

    // Verificar que hay al menos un evento de prueba
    const testEvent = page.locator('[data-testid="event-card"]:has-text("[E2E-TEST]")');
    await expect(testEvent.first()).toBeVisible();
  });

  test('debe poder navegar a detalle de evento de prueba', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 15000 });

    // Buscar específicamente un evento de prueba
    const testEventCard = page.locator('[data-testid="event-card"]:has-text("[E2E-TEST]")').first();
    await expect(testEventCard).toBeVisible();

    // Navegar a detalle
    await expect(testEventCard.getByRole('link', { name: 'Ver Detalles' })).toBeVisible();
    await expect(testEventCard.getByRole('link', { name: 'Ver Detalles' })).toHaveAttribute(
      'href',
      /\/eventos\/.+/
    );

    await Promise.all([
      page.waitForURL(/\/eventos\/.+/, { timeout: 15000 }),
      testEventCard.getByRole('link', { name: 'Ver Detalles' }).click(),
    ]);

    // Verificar que estamos en la página de detalle
    const detailTitle = page.locator('h1').first();
    await expect(detailTitle).toBeVisible();

    // Verificar que el título contiene el prefijo de test
    const titleText = await detailTitle.textContent();
    expect(titleText).toContain('[E2E-TEST]');
  });

  test('debe poder agregar evento de prueba a blacklist', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 15000 });

    // Buscar un evento de prueba
    const testEventCard = page.locator('[data-testid="event-card"]:has-text("[E2E-TEST]")').first();
    await expect(testEventCard).toBeVisible();

    // Contar eventos antes
    const initialCount = await page.locator('[data-testid="event-card"]').count();

    // Configurar dialog handler
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // Click en botón de eliminar
    const deleteButton = testEventCard.getByRole('button', { name: /ocultar evento/i });
    await deleteButton.click();

    // Esperar a que el API call termine
    await page.waitForResponse(
      (response) => response.url().includes('/api/events/') && response.request().method() === 'DELETE'
    );

    // Verificar que el evento desapareció
    await page.waitForFunction(
      (expectedCount) => {
        const cards = document.querySelectorAll('[data-testid="event-card"]');
        return cards.length === expectedCount - 1;
      },
      initialCount,
      { timeout: 5000 }
    );

    const finalCount = await page.locator('[data-testid="event-card"]').count();
    expect(finalCount).toBe(initialCount - 1);
  });
});
