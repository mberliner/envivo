import { test, expect } from '@playwright/test';

/**
 * Tests diagnósticos para investigar race conditions
 *
 * Estos tests NO deben ejecutarse en CI, solo para debugging local.
 * Para ejecutar solo estos tests:
 *   npx playwright test diagnostic.e2e.ts
 */

test.describe('Diagnostic - Race Condition Analysis', () => {
  test('should check page stability after load', async ({ page }) => {
    console.log('[DIAG] Starting page stability test...');

    await page.goto('/');
    console.log('[DIAG] Page loaded');

    // Esperar que aparezcan eventos
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 25000 });
    console.log('[DIAG] Event cards appeared');

    // Obtener href inicial
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    const firstLink = firstEvent.getByRole('link', { name: 'Ver Detalles' });

    const href1 = await firstLink.getAttribute('href');
    const timestamp1 = Date.now();
    console.log('[DIAG] Initial href:', href1, 'at', timestamp1);

    // Esperar 1 segundo y revisar de nuevo
    await page.waitForTimeout(1000);
    const href2 = await firstLink.getAttribute('href');
    const timestamp2 = Date.now();
    console.log('[DIAG] After 1s href:', href2, 'at', timestamp2);

    // Esperar otros 2 segundos
    await page.waitForTimeout(2000);
    const href3 = await firstLink.getAttribute('href');
    const timestamp3 = Date.now();
    console.log('[DIAG] After 3s href:', href3, 'at', timestamp3);

    // Verificar estabilidad
    expect(href1).toBeTruthy();
    expect(href1).toBe(href2);
    expect(href2).toBe(href3);

    console.log('[DIAG] ✅ Href stable across 3 seconds');
  });

  test('should measure time to href population', async ({ page }) => {
    console.log('[DIAG] Starting href population timing test...');

    const loadStart = Date.now();
    await page.goto('/');
    const loadEnd = Date.now();
    console.log('[DIAG] Page load took:', loadEnd - loadStart, 'ms');

    // Medir tiempo hasta que aparezca el primer event card
    const cardStart = Date.now();
    await page.waitForSelector('[data-testid="event-card"]');
    const cardEnd = Date.now();
    console.log('[DIAG] First card appeared after:', cardEnd - cardStart, 'ms');

    // Medir tiempo hasta que el href esté poblado
    const hrefStart = Date.now();
    await page.waitForFunction(
      () => {
        const link = document.querySelector('[data-testid="event-card"] a[href*="/eventos/"]');
        return link && link.getAttribute('href')?.match(/\/eventos\/.+/);
      },
      { timeout: 10000 }
    );
    const hrefEnd = Date.now();
    console.log('[DIAG] Href populated after:', hrefEnd - hrefStart, 'ms');
    console.log('[DIAG] Total time from load to valid href:', hrefEnd - loadStart, 'ms');

    // Verificar el href final
    const finalHref = await page.locator('[data-testid="event-card"]')
      .first()
      .getByRole('link', { name: 'Ver Detalles' })
      .getAttribute('href');

    console.log('[DIAG] Final href:', finalHref);
    expect(finalHref).toMatch(/\/eventos\/.+/);
  });

  test('should detect re-renders of EventCard', async ({ page }) => {
    console.log('[DIAG] Starting re-render detection test...');

    // Inyectar script para detectar cambios en el DOM
    await page.addInitScript(() => {
      const renderCounts = new Map();

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.dataset?.testid === 'event-card') {
              const count = renderCounts.get('event-card') || 0;
              renderCounts.set('event-card', count + 1);
              console.log('[RENDER] EventCard added to DOM, count:', count + 1);
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      (window as any).__renderCounts = renderCounts;
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 25000 });

    // Esperar 3 segundos para capturar todos los re-renders
    await page.waitForTimeout(3000);

    // Obtener conteos de renders
    const renderCounts = await page.evaluate(() => (window as any).__renderCounts);
    console.log('[DIAG] Render counts:', renderCounts);

    // Si hay múltiples renders, es sospechoso
    const eventCardRenders = renderCounts?.get?.('event-card') || 0;
    if (eventCardRenders > 1) {
      console.log(`[DIAG] ⚠️ EventCard was added ${eventCardRenders} times (possible re-renders)`);
    } else {
      console.log('[DIAG] ✅ EventCard only rendered once');
    }
  });

  test('should capture network timing for /api/events', async ({ page }) => {
    console.log('[DIAG] Starting network timing test...');

    let apiCallStart: number | null = null;
    let apiCallEnd: number | null = null;

    // Interceptar request
    page.on('request', (request) => {
      if (request.url().includes('/api/events')) {
        apiCallStart = Date.now();
        console.log('[DIAG] API call started:', request.url());
      }
    });

    // Interceptar response
    page.on('response', (response) => {
      if (response.url().includes('/api/events')) {
        apiCallEnd = Date.now();
        console.log('[DIAG] API call completed:', response.status());
        if (apiCallStart) {
          console.log('[DIAG] API call duration:', apiCallEnd! - apiCallStart, 'ms');
        }
      }
    });

    const pageLoadStart = Date.now();
    await page.goto('/');
    const pageLoadEnd = Date.now();
    console.log('[DIAG] Page load took:', pageLoadEnd - pageLoadStart, 'ms');

    await page.waitForSelector('[data-testid="event-card"]', { timeout: 25000 });
    const cardsVisibleTime = Date.now();

    console.log('[DIAG] Cards visible after page load:', cardsVisibleTime - pageLoadEnd, 'ms');

    if (apiCallStart && apiCallEnd) {
      console.log('[DIAG] Timeline:');
      console.log(`  Page load: ${pageLoadEnd - pageLoadStart}ms`);
      console.log(`  API start: ${apiCallStart - pageLoadStart}ms after page load`);
      console.log(`  API end: ${apiCallEnd - pageLoadStart}ms after page load`);
      console.log(`  Cards visible: ${cardsVisibleTime - pageLoadStart}ms after page load`);
      console.log(`  Gap API→Cards: ${cardsVisibleTime - apiCallEnd!}ms`);

      if (cardsVisibleTime - apiCallEnd! > 100) {
        console.log('[DIAG] ⚠️ Large gap between API response and cards visible (>100ms)');
        console.log('[DIAG]    This suggests re-render after data fetch');
      }
    }
  });

  test('should simulate actual test scenario with timing', async ({ page }) => {
    console.log('[DIAG] Simulating actual test scenario...');

    const t0 = Date.now();
    await page.goto('/');
    console.log(`[DIAG] T+${Date.now() - t0}ms: page.goto() completed`);

    await page.waitForSelector('[data-testid="event-card"]', { timeout: 25000 });
    console.log(`[DIAG] T+${Date.now() - t0}ms: event-card visible`);

    const firstEvent = page.locator('[data-testid="event-card"]').first();
    const detailsLink = firstEvent.getByRole('link', { name: 'Ver Detalles' });

    await expect(detailsLink).toBeVisible();
    console.log(`[DIAG] T+${Date.now() - t0}ms: detailsLink.toBeVisible() passed`);

    const hrefBefore = await detailsLink.getAttribute('href');
    console.log(`[DIAG] T+${Date.now() - t0}ms: href before check = "${hrefBefore}"`);

    await expect(detailsLink).toHaveAttribute('href', /\/eventos\/.+/);
    console.log(`[DIAG] T+${Date.now() - t0}ms: toHaveAttribute() passed`);

    // ⚠️ VENTANA DE VULNERABILIDAD: Aquí puede ocurrir re-render
    const hrefAfterCheck = await detailsLink.getAttribute('href');
    console.log(`[DIAG] T+${Date.now() - t0}ms: href after check = "${hrefAfterCheck}"`);

    if (hrefBefore !== hrefAfterCheck) {
      console.log('[DIAG] ⚠️⚠️⚠️ HREF CHANGED between checks!');
      console.log(`[DIAG]   Before: "${hrefBefore}"`);
      console.log(`[DIAG]   After:  "${hrefAfterCheck}"`);
    }

    // Intentar click
    try {
      await Promise.all([
        page.waitForURL(/\/eventos\/.+/, { timeout: 25000 }),
        detailsLink.click(),
      ]);
      console.log(`[DIAG] T+${Date.now() - t0}ms: navigation successful`);
    } catch (error) {
      console.log(`[DIAG] T+${Date.now() - t0}ms: navigation FAILED`);
      console.log('[DIAG] Error:', (error as Error).message);

      const currentUrl = page.url();
      console.log('[DIAG] Current URL:', currentUrl);

      const hrefAfterFail = await detailsLink.getAttribute('href');
      console.log('[DIAG] Href after fail:', hrefAfterFail);

      throw error;
    }
  });
});
