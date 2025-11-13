import { test, expect } from '@playwright/test';

test.describe('Event Detail - Fase 6', () => {
  test('debe navegar de home a detalle y volver', async ({ page }) => {
    // 1. Ir a home
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });

    // 2. Click en título del primer evento
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    const titleElement = firstEvent.locator('h3');
    const title = await titleElement.textContent();
    await titleElement.click();

    // 3. Verificar página de detalle
    await expect(page).toHaveURL(/\/eventos\/.+/);
    await expect(page.locator('h1')).toContainText(title || '');
    await expect(page.getByText('Fecha y Hora')).toBeVisible();
    await expect(page.getByText('Ubicación')).toBeVisible();
    await expect(page.getByText('Precio de Entradas')).toBeVisible();

    // 4. Volver a eventos
    await page.click('text=Volver a Eventos');
    await expect(page).toHaveURL('/');
  });

  test('debe mostrar botón comprar con atributos de seguridad', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]');

    // Click en título del primer evento para ir a detalle
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    await firstEvent.locator('h3').click();

    // Esperar a que cargue la página de detalle
    await expect(page).toHaveURL(/\/eventos\/.+/);

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

  test('debe mostrar 404 para evento inexistente', async ({ page }) => {
    await page.goto('/eventos/invalid-id-12345');

    // Verificar mensaje de error
    await expect(page.getByText(/no encontrado/i)).toBeVisible();

    // Verificar puede volver a home
    await page.click('text=Volver');
    await expect(page).toHaveURL('/');
  });
});
