import { test, expect } from '@playwright/test';
import { setupTestData, teardownTestData } from './helpers/testFixtures';

/**
 * Ejemplo de test E2E usando test fixtures
 *
 * Este test demuestra cómo usar setupTestData/teardownTestData
 * para crear datos de prueba y limpiarlos después.
 */

test.describe.serial('Example - Test con Fixtures', () => {
  // Setup: crear datos ANTES de todos los tests
  test.beforeAll(async () => {
    await setupTestData(5, 'EXAMPLE'); // Crear 5 eventos con prefix único
  });

  // Teardown: limpiar datos DESPUÉS de todos los tests
  test.afterAll(async () => {
    await teardownTestData('EXAMPLE');
  });

  test('debe mostrar eventos de prueba', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 15000 });

    // Verificar que hay eventos
    const eventCards = page.locator('[data-testid="event-card"]');
    const count = await eventCards.count();
    expect(count).toBeGreaterThan(0);

    // Verificar que hay al menos un evento de prueba
    const testEvent = page.locator('[data-testid="event-card"]:has-text("[EXAMPLE]")');
    await expect(testEvent.first()).toBeVisible();
  });

  test('debe poder navegar a detalle de evento de prueba', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 15000 });

    // Buscar específicamente un evento de prueba
    const testEventCard = page.locator('[data-testid="event-card"]:has-text("[EXAMPLE]")').first();
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
    expect(titleText).toContain('[EXAMPLE]');
  });

  test('debe poder agregar evento de prueba a blacklist', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 15000 });

    // Buscar SOLO eventos de este suite (prefix EXAMPLE)
    const exampleEvents = page.locator('[data-testid="event-card"]:has-text("[EXAMPLE]")');
    await expect(exampleEvents.first()).toBeVisible();

    // Contar eventos EXAMPLE antes
    const initialCount = await exampleEvents.count();

    const testEventCard = exampleEvents.first();

    // Configurar dialog handler (puede ser confirm o alert si hay error)
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') {
        await dialog.accept();
      } else if (dialog.type() === 'alert') {
        console.log('[TEST] Alert dialog:', dialog.message());
        await dialog.accept();
      }
    });

    // Click en botón de eliminar
    const deleteButton = testEventCard.getByRole('button', { name: /ocultar evento/i });
    await deleteButton.click();

    // Esperar a que el API call termine
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/events/') && response.request().method() === 'DELETE'
    );

    // Verificar que el evento EXAMPLE desapareció
    await page.waitForFunction(
      ({ expectedCount, prefix }) => {
        const allCards = document.querySelectorAll('[data-testid="event-card"]');
        const exampleCards = Array.from(allCards).filter((card) =>
          card.textContent?.includes(`[${prefix}]`)
        );
        return exampleCards.length === expectedCount - 1;
      },
      { expectedCount: initialCount, prefix: 'EXAMPLE' },
      { timeout: 5000 }
    );

    const finalCount = await exampleEvents.count();
    expect(finalCount).toBe(initialCount - 1);
  });
});
