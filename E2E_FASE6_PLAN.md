# Tests E2E - Fase 6: Detalle de Evento

> **Documento efímero** - Eliminar después de implementar

---

## 1. Setup Rápido

```bash
npm install -D @playwright/test
npx playwright install chromium firefox
```

---

## 2. Configuración Playwright

**`playwright.config.ts`** (crear en raíz):

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    // ✅ URL dinámica: soporta local, CI, producción
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  // ✅ Solo inicia servidor en local (NO en CI/producción)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
```

---

## 3. Scripts package.json

Agregar en `"scripts"`:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:local": "E2E_BASE_URL=http://localhost:3000 playwright test",
  "test:e2e:prod": "E2E_BASE_URL=https://envivo.vercel.app playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

---

## 4. Tests E2E Básicos

**`e2e/event-detail.spec.ts`** (crear):

```typescript
import { test, expect } from '@playwright/test';

test.describe('Event Detail - Fase 6', () => {
  test('debe navegar de home a detalle y volver', async ({ page }) => {
    // 1. Ir a home
    await page.goto('/');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });

    // 2. Click en primer evento
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    const title = await firstEvent.locator('h3').textContent();
    await firstEvent.click();

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
    await page.locator('[data-testid="event-card"]').first().click();

    const buyButton = page.getByRole('link', { name: /Comprar Entradas/i });

    // Verificar solo si el botón existe (puede no tener ticketUrl)
    if (await buyButton.isVisible()) {
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
```

---

## 5. Data Test IDs

Agregar a componentes para selectores estables:

**`src/features/events/ui/components/EventCard.tsx`**:

```tsx
<div data-testid="event-card" className="...">
  {/* resto del código sin cambios */}
</div>
```

**`src/features/events/ui/components/EventDetail.tsx`**:

```tsx
{event.ticketUrl && (
  <a
    data-testid="buy-tickets-button"
    href={event.ticketUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    Comprar Entradas
  </a>
)}
```

---

## 6. Variables de Entorno

**`.env.example`** (agregar):

```bash
# E2E Testing
E2E_BASE_URL="http://localhost:3000"
```

---

## 7. Comandos de Uso

```bash
# Desarrollo local (inicia servidor automáticamente)
npm run test:e2e:local

# Producción desplegada (sin iniciar servidor)
npm run test:e2e:prod

# URL personalizada (ej: Vercel preview)
E2E_BASE_URL=https://envivo-preview.vercel.app npm run test:e2e

# Modo UI (debugging interactivo)
npm run test:e2e:ui

# Modo debug (paso a paso con DevTools)
npm run test:e2e:debug

# Ver reporte HTML (después de correr tests)
npx playwright show-report
```

---

## 8. Checklist de Implementación

- [ ] Instalar Playwright y browsers
- [ ] Crear `playwright.config.ts`
- [ ] Crear directorio `e2e/`
- [ ] Crear `e2e/event-detail.spec.ts`
- [ ] Agregar scripts en `package.json`
- [ ] Agregar `data-testid` a `EventCard.tsx`
- [ ] Agregar `data-testid` a `EventDetail.tsx`
- [ ] Agregar `E2E_BASE_URL` en `.env.example`
- [ ] Correr tests: `npm run test:e2e:local`
- [ ] Verificar 3/3 tests pasando ✅

---

## 9. Criterios de Éxito

```bash
✅ TypeScript: 0 errors      (npm run type-check)
✅ Unit tests: X/X passing   (npm test)
✅ E2E tests: 3/3 passing    (npm run test:e2e)
✅ Lint: 0 warnings          (npm run lint)
```

**⛔ ZERO TOLERANCE**: NUNCA commitear con tests fallando.

---

## 10. Notas

- **Fase 6**: Solo 3 tests básicos de navegación
- **Fase 8**: Expandir con búsqueda, filtros, responsive, a11y
- **Multi-ambiente**: Config lista para local, staging, producción
- **CI/CD**: Variable `E2E_BASE_URL` se puede setear en Vercel/GitHub Actions

---

**Estimación total**: 2-3 horas

**Eliminar este archivo después de completar implementación.**
