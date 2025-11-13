# Tests E2E - Mejores Prácticas para Evitar Race Conditions

Esta guía documenta los patrones correctos para escribir tests E2E robustos que funcionen de manera confiable tanto en modo secuencial como paralelo.

---

## 🚨 Patrones que Causan Race Conditions

### ❌ 1. Navegación sin Espera Explícita

**Problema:**
```typescript
// ❌ MALO - Race condition
await page.click('a[href="/eventos/123"]');
await page.waitForLoadState('networkidle');  // Puede ejecutarse ANTES de la navegación
await expect(page).toHaveURL(/\/eventos/);
```

**Por qué falla:**
- `waitForLoadState` puede completar antes de que la navegación comience
- En modo paralelo, el timing es impredecible
- Causa fallos aleatorios (especialmente con 4 workers)

**Solución:**
```typescript
// ✅ BUENO - Sin race condition
await Promise.all([
  page.waitForURL(/\/eventos\//, { timeout: 10000 }),
  page.click('a[href="/eventos/123"]'),
]);
```

**Por qué funciona:**
- `waitForURL` se registra ANTES del click
- Garantiza espera desde el momento exacto de navegación
- Sin posibilidad de race condition

---

### ❌ 2. Click que Dispara Request sin Esperar Respuesta

**Problema:**
```typescript
// ❌ MALO - No espera el request
await page.click('button[data-action="delete"]');
await page.waitForTimeout(500);  // Timeout arbitrario
const count = await page.locator('.item').count();
expect(count).toBe(0);
```

**Por qué falla:**
- `waitForTimeout` es arbitrario (puede no ser suficiente)
- No garantiza que el request completó
- Puede fallar si el servidor es lento

**Solución:**
```typescript
// ✅ BUENO - Espera el request explícitamente
await page.click('button[data-action="delete"]');
await page.waitForResponse(
  (response) =>
    response.url().includes('/api/items/') &&
    response.request().method() === 'DELETE'
);

// Esperar cambio en el DOM
await page.waitForFunction(
  (expectedCount) => document.querySelectorAll('.item').length === expectedCount,
  0,
  { timeout: 5000 }
);
```

---

### ❌ 3. Cambios de Estado sin Verificar Actualización

**Problema:**
```typescript
// ❌ MALO - Asume que el cambio fue instantáneo
await page.fill('input[name="search"]', 'test');
await page.click('button[type="submit"]');
const results = await page.locator('.result').count();  // Puede leer ANTES de actualizar
```

**Solución:**
```typescript
// ✅ BUENO - Espera la actualización explícitamente
await page.fill('input[name="search"]', 'test');
await Promise.all([
  page.waitForResponse((res) => res.url().includes('/api/search')),
  page.click('button[type="submit"]'),
]);

// Esperar que aparezcan los resultados
await page.waitForSelector('.result', { state: 'visible' });
const results = await page.locator('.result').count();
```

---

### ❌ 4. Form Submission sin Esperar Navegación

**Problema:**
```typescript
// ❌ MALO - Submit puede causar navegación
await page.fill('input[name="email"]', 'test@example.com');
await page.click('button[type="submit"]');
await expect(page).toHaveURL('/success');  // Race condition
```

**Solución:**
```typescript
// ✅ BUENO - Espera navegación simultáneamente
await page.fill('input[name="email"]', 'test@example.com');
await Promise.all([
  page.waitForURL('/success', { timeout: 10000 }),
  page.click('button[type="submit"]'),
]);
```

---

## ✅ Patrones Correctos por Tipo de Acción

### 1. Navegación con Link/Button

```typescript
await Promise.all([
  page.waitForURL(/expected-pattern/, { timeout: 10000 }),
  page.click('selector'),
]);
```

### 2. Request AJAX (POST/PUT/DELETE)

```typescript
await page.click('button');
await page.waitForResponse(
  (res) => res.url().includes('/api/endpoint') && res.status() === 200
);
```

### 3. Esperar Cambio en el DOM

```typescript
// Opción 1: Esperar elemento visible
await expect(page.locator('selector')).toBeVisible({ timeout: 5000 });

// Opción 2: Esperar elemento oculto
await expect(page.locator('selector')).toBeHidden({ timeout: 5000 });

// Opción 3: Esperar cambio complejo
await page.waitForFunction(
  () => document.querySelector('selector')?.textContent === 'expected',
  { timeout: 5000 }
);
```

### 4. Esperar Múltiples Condiciones

```typescript
await Promise.all([
  expect(page.locator('.title')).toBeVisible(),
  expect(page.locator('.description')).toBeVisible(),
  expect(page.locator('.price')).toBeVisible(),
]);
```

---

## 🧪 Checklist para Nuevos Tests

Antes de commitear un nuevo test E2E, verifica:

- [ ] **Navegación**: ¿Todo click en link usa `Promise.all([waitForURL(), click()])`?
- [ ] **API Calls**: ¿Los clicks que disparan requests esperan `waitForResponse`?
- [ ] **Cambios DOM**: ¿Usas `expect().toBeVisible()` en lugar de `waitForTimeout`?
- [ ] **Timings arbitrarios**: ¿Eliminaste todos los `waitForTimeout` arbitrarios?
- [ ] **Prueba paralela**: ¿El test pasa consistentemente con `npm run test:e2e:prod`?
- [ ] **Sin retries**: ¿El test pasa en el primer intento (sin necesitar retry)?

---

## 🔍 Debugging de Race Conditions

Si un test falla aleatoriamente:

### 1. Identifica el Patrón

```bash
# Ejecutar test 10 veces para ver si falla aleatoriamente
for i in {1..10}; do npm run test:e2e:prod; done
```

### 2. Revisa el Trace

```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

**Busca:**
- ¿El click ocurre pero la navegación no completa?
- ¿El request se envía pero el DOM no actualiza a tiempo?
- ¿Hay un gap temporal entre acción y verificación?

### 3. Aplica el Patrón Correcto

- Navegación → `Promise.all([waitForURL(), click()])`
- API Call → `waitForResponse()`
- DOM Change → `expect().toBeVisible()` o `waitForFunction()`

---

## 📊 Ejemplos del Proyecto

### ✅ Navegación (Correcto)

```typescript
// e2e/event-detail.e2e.ts:15-18
await Promise.all([
  page.waitForURL(/\/eventos\/.+/, { timeout: 10000 }),
  firstEvent.getByRole('link', { name: 'Ver Detalles' }).click(),
]);
```

### ✅ API DELETE con Espera (Correcto)

```typescript
// e2e/event-detail.e2e.ts:82
await page.waitForResponse(
  (response) =>
    response.url().includes('/api/events/') &&
    response.request().method() === 'DELETE'
);
```

### ✅ Espera de Cambio en DOM (Correcto)

```typescript
// e2e/event-detail.e2e.ts:86-93
await page.waitForFunction(
  (expectedCount) => {
    const cards = document.querySelectorAll('[data-testid="event-card"]');
    return cards.length === expectedCount - 1;
  },
  initialEventCount,
  { timeout: 5000 }
);
```

---

## 🚀 Verificación en CI/CD

Para asegurar que los tests son robustos:

```yaml
# .github/workflows/e2e.yml
- name: Run E2E Tests (Parallel)
  run: npm run test:e2e:prod
  env:
    CI: true

# Si falla, el PR no se mergea
```

**Regla**: Los tests deben pasar **100% de las veces** en modo paralelo antes de mergear.

---

## 📚 Referencias

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Auto-waiting en Playwright](https://playwright.dev/docs/actionability)
- [Handling Navigation](https://playwright.dev/docs/navigations)

---

**Última actualización**: Noviembre 2025
