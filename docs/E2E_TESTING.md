# Tests E2E - Guía de Uso

Este documento describe los dos modos configurados para ejecutar tests E2E con Playwright.

---

## 📋 Resumen de Modos

| Modo | Comando | Servidor | Workers | Navegador | Uso Principal | Tiempo |
|------|---------|----------|---------|-----------|---------------|--------|
| **Development** | `npm run test:e2e` | Dev (`npm run dev`) | 1 (secuencial) | Chromium | Desarrollo e iteración rápida | ~15s |
| **Production** | `npm run test:e2e:prod` | Build + Start (puerto 3001) | 4 (paralelo) | Chromium | Validación pre-deploy / CI | ~75s (primera vez)<br>~8s (subsecuente) |

---

## 🔧 Modo 1: Development (Actual)

### Características
- ✅ Ejecuta tests **secuencialmente** (1 worker)
- ✅ Usa servidor de desarrollo (`npm run dev`)
- ✅ Rápido para iterar durante desarrollo
- ✅ Hot reload si cambias código

### Comando
```bash
npm run test:e2e
```

### Configuración
- **Archivo**: `playwright.config.ts`
- **Puerto**: 3000
- **Workers**: 1
- **Paralelismo**: Desactivado (`fullyParallel: false`)
- **Navegador**: Chromium (Desktop Chrome)
- **Reporter**: Lista en consola + HTML (no se abre automáticamente)

### Cuándo usar
- ✅ Durante desarrollo de nuevos tests
- ✅ Debugging de tests fallando
- ✅ Iteración rápida sobre cambios

### Ejemplo
```bash
# Desarrollo normal
npm run test:e2e

# Con UI para debugging
npm run test:e2e:ui

# Modo debug (paso a paso)
npm run test:e2e:debug
```

---

## 🚀 Modo 2: Production (Nuevo)

### Características
- ✅ Ejecuta tests **en paralelo** (4 workers)
- ✅ Usa build de producción (`npm run build` + `npm start`)
- ✅ Valida comportamiento real de producción
- ✅ Optimizado para CI/CD

### Comando
```bash
npm run test:e2e:prod
```

### Configuración
- **Archivo**: `playwright.config.prod.ts`
- **Puerto**: 3001 (para no conflictuar con dev)
- **Workers**: 4
- **Paralelismo**: Activado (`fullyParallel: true`)
- **Navegador**: Chromium (Desktop Chrome)
- **Retries**: 1 en local, 2 en CI
- **Reporter**: Lista en consola + HTML (no se abre automáticamente)

### Cuándo usar
- ✅ Antes de hacer push/deploy
- ✅ En pipelines de CI/CD
- ✅ Validación final de features
- ✅ Testing de rendimiento

### ⚡ Performance
**Primera ejecución** (~75s):
```bash
npm run build       # ~60s
npm start           # ~2s (startup)
playwright test     # ~13-15s (paralelo con 4 workers)
```

**Ejecuciones subsecuentes** (~15s):
```bash
# Si no cambió el código, reutiliza el build anterior
playwright test     # ~13-15s
```

### Ejemplo
```bash
# Validación completa (hace build automáticamente)
npm run test:e2e:prod

# Solo tests (si ya tienes el build)
E2E_BASE_URL=http://localhost:3001 playwright test --config=playwright.config.prod.ts
```

---

## 🔀 Comparación Técnica

### Development Mode
```typescript
// playwright.config.ts
{
  workers: 1,                    // Secuencial
  fullyParallel: false,          // Sin paralelismo
  reporter: [
    ['list'],                    // Progreso en consola
    ['html', { open: 'never' }]  // HTML sin abrir automáticamente
  ],
  webServer: {
    command: 'npm run dev',      // Servidor dev
    url: 'http://localhost:3000'
  }
}
```

### Production Mode
```typescript
// playwright.config.prod.ts
{
  workers: 4,                    // 4 workers paralelos
  fullyParallel: true,           // Paralelismo completo
  reporter: [
    ['list'],                    // Progreso en consola
    ['html', { open: 'never' }]  // HTML sin abrir automáticamente
  ],
  webServer: {
    command: 'npm run start:test', // Servidor prod (puerto 3001)
    url: 'http://localhost:3001'
  }
}
```

---

## 📊 Benchmarks

### Tiempos Esperados

#### Development Mode (Secuencial)
```
Running 4 tests using 1 worker

✓ [chromium] › home.e2e.ts:homepage     (3s)
✓ [chromium] › search.e2e.ts:search     (4s)
✓ [chromium] › detail.e2e.ts:navigation (4s)
✓ [chromium] › detail.e2e.ts:blacklist  (4s)

4 passed (15s)
```

#### Production Mode (Paralelo)
```
Running 4 tests using 4 workers

✓ [chromium] › home.e2e.ts:homepage     (3s)
✓ [chromium] › search.e2e.ts:search     (4s)
✓ [chromium] › detail.e2e.ts:navigation (4s)
✓ [chromium] › detail.e2e.ts:blacklist  (4s)

4 passed (8s)  ← Todos ejecutados en paralelo
```

**Ganancia**: ~50% más rápido en tests (pero requiere build inicial)

---

## 🛠️ Configuración de CI/CD

### GitHub Actions (Ejemplo)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-prod:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Instalar dependencias
      - run: npm ci

      # Instalar navegadores de Playwright
      - run: npx playwright install --with-deps

      # Ejecutar tests en modo producción (paralelo)
      - run: npm run test:e2e:prod
        env:
          CI: true

      # Subir reportes si fallan
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🐛 Troubleshooting

### ¿Cómo habilitar testing en mobile?

Por defecto, los tests solo se ejecutan en Chromium (desktop) para ser más rápidos.

**Para habilitar mobile:**
1. Descomenta la línea en `playwright.config.ts` (línea 23):
   ```typescript
   { name: 'mobile', use: { ...devices['iPhone 13'] } },
   ```
2. Ejecuta: `npm run test:e2e`

Ahora ejecutará 8 tests (4 en chromium + 4 en mobile)

### Tests fallan solo en production mode

**Causa**: Diferencias entre dev y producción (ej: optimizaciones, code splitting)

**Solución**:
```bash
# Revisar logs del servidor de producción
npm run build
npm run start:test  # Puerto 3001

# En otra terminal, ejecutar solo los tests
E2E_BASE_URL=http://localhost:3001 playwright test --config=playwright.config.prod.ts
```

### Puerto 3001 ocupado

**Causa**: Servidor de producción anterior no se cerró

**Solución**:
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Build muy lento

**Causa**: Primera ejecución o cambios en muchos archivos

**Optimización**:
```bash
# Usar Turbopack (más rápido)
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build

# O ejecutar build solo una vez y reutilizarlo
npm run build
npm run start:test &  # Background
sleep 5               # Esperar que inicie
playwright test --config=playwright.config.prod.ts
```

---

## 📝 Scripts Disponibles

```json
{
  "test:e2e": "playwright test",
  "test:e2e:local": "cross-env E2E_BASE_URL=http://localhost:3000 playwright test",
  "test:e2e:prod": "npm run build && cross-env E2E_BASE_URL=http://localhost:3001 playwright test --config=playwright.config.prod.ts",
  "test:e2e:vercel": "cross-env E2E_BASE_URL=https://envivo.vercel.app playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

> **💡 Nota**: Los scripts usan `cross-env` para compatibilidad multiplataforma (Windows, Linux, Mac).

### Otros comandos útiles

```bash
# Ver reporte HTML del último test (se genera automáticamente pero no se abre)
npx playwright show-report

# Ejecutar solo un archivo
npm run test:e2e -- home.e2e.ts

# Ejecutar en mobile (deshabilitado por defecto)
# Primero descomentar línea 23 en playwright.config.ts
npm run test:e2e -- --project=mobile

# Actualizar snapshots
npm run test:e2e -- --update-snapshots
```

---

## 📖 Mejores Prácticas para Evitar Race Conditions

Esta sección documenta los patrones correctos para escribir tests E2E robustos que funcionen de manera confiable tanto en modo secuencial como paralelo.

### 🚨 Patrones que Causan Race Conditions

#### ❌ 1. Navegación sin Espera Explícita

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

#### ❌ 2. Click que Dispara Request sin Esperar Respuesta

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

#### ❌ 3. Cambios de Estado sin Verificar Actualización

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

#### ❌ 4. Form Submission sin Esperar Navegación

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

### ✅ Patrones Correctos por Tipo de Acción

#### 1. Navegación con Link/Button

```typescript
await Promise.all([
  page.waitForURL(/expected-pattern/, { timeout: 10000 }),
  page.click('selector'),
]);
```

#### 2. Request AJAX (POST/PUT/DELETE)

```typescript
await page.click('button');
await page.waitForResponse(
  (res) => res.url().includes('/api/endpoint') && res.status() === 200
);
```

#### 3. Esperar Cambio en el DOM

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

#### 4. Esperar Múltiples Condiciones

```typescript
await Promise.all([
  expect(page.locator('.title')).toBeVisible(),
  expect(page.locator('.description')).toBeVisible(),
  expect(page.locator('.price')).toBeVisible(),
]);
```

---

### 🧪 Checklist para Nuevos Tests

Antes de commitear un nuevo test E2E, verifica:

- [ ] **Navegación**: ¿Todo click en link usa `Promise.all([waitForURL(), click()])`?
- [ ] **API Calls**: ¿Los clicks que disparan requests esperan `waitForResponse`?
- [ ] **Cambios DOM**: ¿Usas `expect().toBeVisible()` en lugar de `waitForTimeout`?
- [ ] **Timings arbitrarios**: ¿Eliminaste todos los `waitForTimeout` arbitrarios?
- [ ] **Prueba paralela**: ¿El test pasa consistentemente con `npm run test:e2e:prod`?
- [ ] **Sin retries**: ¿El test pasa en el primer intento (sin necesitar retry)?

---

### 🔍 Debugging de Race Conditions

Si un test falla aleatoriamente:

#### 1. Identifica el Patrón

```bash
# Ejecutar test 10 veces para ver si falla aleatoriamente
for i in {1..10}; do npm run test:e2e:prod; done
```

#### 2. Revisa el Trace

```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

**Busca:**
- ¿El click ocurre pero la navegación no completa?
- ¿El request se envía pero el DOM no actualiza a tiempo?
- ¿Hay un gap temporal entre acción y verificación?

#### 3. Aplica el Patrón Correcto

- Navegación → `Promise.all([waitForURL(), click()])`
- API Call → `waitForResponse()`
- DOM Change → `expect().toBeVisible()` o `waitForFunction()`

---

### 📊 Ejemplos del Proyecto

#### ✅ Navegación (Correcto)

```typescript
// e2e/event-detail.e2e.ts:15-18
await Promise.all([
  page.waitForURL(/\/eventos\/.+/, { timeout: 10000 }),
  firstEvent.getByRole('link', { name: 'Ver Detalles' }).click(),
]);
```

#### ✅ API DELETE con Espera (Correcto)

```typescript
// e2e/event-detail.e2e.ts:82
await page.waitForResponse(
  (response) =>
    response.url().includes('/api/events/') &&
    response.request().method() === 'DELETE'
);
```

#### ✅ Espera de Cambio en DOM (Correcto)

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

## ✅ Checklist Pre-Deploy

Antes de hacer deploy a producción, ejecuta:

```bash
# 1. Verificar tipos
npm run type-check

# 2. Verificar linting
npm run lint

# 3. Ejecutar tests unitarios
npm test

# 4. Ejecutar tests E2E en modo PRODUCCIÓN
npm run test:e2e:prod

# 5. Si todo pasa, hacer commit y push
git add .
git commit -m "feat: nueva funcionalidad con tests E2E"
git push origin main
```

---

## 🎯 Recomendaciones

1. **Durante desarrollo**: Usa `npm run test:e2e` (modo dev, secuencial)
   - Más rápido para iterar
   - Feedback inmediato

2. **Antes de commit**: Usa `npm run test:e2e:prod` (modo prod, paralelo)
   - Valida comportamiento de producción
   - Detecta issues de optimización

3. **En CI/CD**: Usa `npm run test:e2e:prod` con `CI=true`
   - Aprovecha paralelismo
   - Retries automáticos

4. **Para debugging**: Usa `npm run test:e2e:ui` o `npm run test:e2e:debug`
   - Interfaz visual
   - Paso a paso

---

**Última actualización**: Noviembre 2025
