import { test, expect } from '@playwright/test';

test.describe('Event Detail - Fase 6', () => {
  test('debe navegar de home a detalle y volver', async ({ page }) => {
    // 1. Ir a home
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 15000 });

    // 2. Obtener título del primer evento
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    const title = await firstEvent.locator('h3').textContent();

    // 3. Click en "Ver Detalles" y esperar navegación simultáneamente
    // ✅ Promise.all asegura que esperamos la navegación ANTES del click (evita race conditions)
    await Promise.all([
      page.waitForURL(/\/eventos\/.+/, { timeout: 10000 }),
      firstEvent.getByRole('link', { name: 'Ver Detalles' }).click(),
    ]);

    // 4. Verificar página de detalle
    await expect(page.locator('h1')).toContainText(title || '');
    await expect(page.getByText('Fecha y Hora')).toBeVisible();
    await expect(page.getByText('Ubicación')).toBeVisible();
    await expect(page.getByText('Precio de Entradas')).toBeVisible();

    // 5. Volver a eventos
    await page.click('text=Volver a Eventos');
    await expect(page).toHaveURL('/');
  });

  test('debe mostrar botón comprar con atributos de seguridad', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 15000 });

    // Click en "Ver Detalles" y esperar navegación simultáneamente
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    await Promise.all([
      page.waitForURL(/\/eventos\/.+/, { timeout: 10000 }),
      firstEvent.getByRole('link', { name: 'Ver Detalles' }).click(),
    ]);

    // Verificar botón de compra
    const buyButton = page.getByRole('link', { name: /Comprar Entradas/i });

    // Verificar solo si el botón existe (puede no tener ticketUrl)
    const isVisible = await buyButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(buyButton).toHaveAttribute('target', '_blank');
      await expect(buyButton).toHaveAttribute('rel', 'noopener noreferrer');

      const href = await buyButton.getAttribute('href');
      expect(href).toMatch(/^https?:\/\//);
    }
  });

  test('debe ocultar evento al hacer click en botón de blacklist', async ({ page }) => {
    // 1. Ir a home
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 15000 });

    // 2. Contar eventos iniciales
    const initialEventCount = await page.locator('[data-testid="event-card"]').count();
    expect(initialEventCount).toBeGreaterThan(0);

    // 3. Obtener referencia al primer evento (NO solo el título)
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    const eventTitle = await firstEvent.locator('h3').textContent();

    // 4. Configurar manejo de dialog (aceptar confirmación)
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('¿Estás seguro');
      await dialog.accept();
    });

    // 5. Click en botón de eliminar (botón rojo con X)
    const deleteButton = firstEvent.getByRole('button', { name: /ocultar evento/i });
    await deleteButton.click();

    // 6. Esperar a que el request DELETE complete y el evento desaparezca
    // Usamos waitForResponse para asegurar que el API call terminó
    await page.waitForResponse((response) => response.url().includes('/api/events/') && response.request().method() === 'DELETE');

    // 7. Esperar a que el primer evento (el que eliminamos) desaparezca del DOM
    // Verificamos que el conteo total disminuyó, sin importar si hay otros eventos con el mismo título
    await page.waitForFunction(
      (expectedCount) => {
        const cards = document.querySelectorAll('[data-testid="event-card"]');
        return cards.length === expectedCount - 1;
      },
      initialEventCount,
      { timeout: 5000 }
    );

    // 8. Verificar que el conteo de eventos disminuyó exactamente en 1
    const finalEventCount = await page.locator('[data-testid="event-card"]').count();
    expect(finalEventCount).toBe(initialEventCount - 1);
  });

  test('debe mostrar 404 para evento inexistente', async ({ page }) => {
    await page.goto('/eventos/invalid-id-12345');

    // Verificar mensaje de error
    await expect(page.getByText(/no encontrado/i)).toBeVisible();

    // Verificar puede volver a home
    await page.click('text=Volver');
    await expect(page).toHaveURL('/');
  });
});
