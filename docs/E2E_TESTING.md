# Tests E2E - Guía de Uso

Configuración de dos modos paralelos para ejecutar tests E2E con Playwright: desarrollo (servidor dev) y producción (build optimizado).

---

## 📋 Resumen de Modos

| Modo | Comando | Servidor | Workers | Tiempo |
|------|---------|----------|---------|--------|
| **Development** | `npm run test:e2e` | Dev (puerto 3000) | 4 | ~8s |
| **Production** | `npm run test:e2e:prod` | Build + Start (puerto 3001) | 4 | ~8s* |

\* Después del build inicial (~75s primera vez)

---

## 🔧 Modo Development (Default)

**Uso**: Desarrollo e iteración rápida

```bash
npm run test:e2e
```

### Características
- Ejecuta tests en paralelo (4 workers)
- Usa servidor de desarrollo con hot reload
- Sin retries (fallos son inmediatos)
- Ideal para desarrollo rápido

### Configuración
```typescript
// playwright.config.ts
{
  workers: 4,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: { command: 'npm run dev', url: 'http://localhost:3000' }
}
```

---

## 🚀 Modo Production

**Uso**: Validación pre-deploy y CI/CD

```bash
npm run test:e2e:prod
```

### Características
- Ejecuta tests en paralelo (4 workers)
- Usa build de producción optimizado
- 1 retry en local, 2 en CI
- Valida comportamiento real de producción

### Configuración
```typescript
// playwright.config.prod.ts
{
  workers: 4,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: { command: 'npm run start:test', url: 'http://localhost:3001' }
}
```

### Performance
- **Primera vez**: ~75s (60s build + 15s tests)
- **Subsecuente**: ~8s (reutiliza build si no cambió código)
- **Diferencia vs dev**: Mismo tiempo de tests, pero valida build de producción

---

## 📝 Scripts Disponibles

```bash
# Modos principales
npm run test:e2e        # Dev paralelo (default)
npm run test:e2e:prod   # Prod paralelo (con build)

# Debugging
npm run test:e2e:ui     # Interfaz visual
npm run test:e2e:debug  # Modo debug paso a paso

# Otros
npm run test:e2e:vercel # Tests contra https://envivo.vercel.app
npx playwright show-report # Ver último reporte HTML
```

> **Nota**: Scripts usan `cross-env` para compatibilidad Windows/Linux/Mac

---

## 📖 Mejores Prácticas - Evitar Race Conditions

### 🚨 Patrones Problemáticos

#### ❌ 1. Navegación sin espera explícita o hidratación incompleta
```typescript
// MALO - sin espera
await page.click('a[href="/eventos"]');
await page.waitForLoadState('networkidle');
await expect(page).toHaveURL(/\/eventos/);

// MALO - guardar referencia que puede quedar stale
const link = page.getByRole('link', { name: 'Ver Detalles' });
await expect(link).toBeVisible();
await expect(link).toHaveAttribute('href', /\/eventos\/.+/);
await link.click(); // ❌ link puede ser stale si hubo re-render entre check y click

// BUENO - re-query antes de cada acción (siempre elemento fresco)
await expect(firstEvent.getByRole('link', { name: 'Ver Detalles' })).toBeVisible();
await expect(firstEvent.getByRole('link', { name: 'Ver Detalles' })).toHaveAttribute('href', /\/eventos\/.+/);
await Promise.all([
  page.waitForURL(/\/eventos\/.+/, { timeout: 15000 }),
  firstEvent.getByRole('link', { name: 'Ver Detalles' }).click(), // ✅ Re-query = elemento fresco
]);
```

**Por qué re-query es mejor:**
- Playwright busca el elemento **justo antes** de cada acción
- Si hubo re-render entre checks, obtiene el elemento nuevo
- Evita referencias "stale" (obsoletas) del DOM
- Es el patrón recomendado por Playwright docs

#### ❌ 2. Request sin esperar respuesta
```typescript
// MALO
await page.click('button[data-action="delete"]');
await page.waitForTimeout(500);

// BUENO
await page.click('button[data-action="delete"]');
await page.waitForResponse(res =>
  res.url().includes('/api/') && res.request().method() === 'DELETE'
);
```

#### ❌ 3. Cambios de estado sin verificar
```typescript
// MALO
await page.fill('input', 'test');
await page.click('button[type="submit"]');
const results = await page.locator('.result').count();

// BUENO
await page.fill('input', 'test');
await Promise.all([
  page.waitForResponse(res => res.url().includes('/api/search')),
  page.click('button[type="submit"]'),
]);
await expect(page.locator('.result')).toBeVisible();
const results = await page.locator('.result').count();
```

---

### ✅ Patrones Correctos

| Acción | Patrón Correcto |
|--------|-----------------|
| **Navegación (Link)** | Re-query en cada acción: `expect(el).toHaveAttribute('href', /pattern/)` + `Promise.all([waitForURL(), el.click()])` |
| **Navegación (Button)** | `Promise.all([waitForURL(), click()])` |
| **API Call** | `click() + waitForResponse()` |
| **Cambio DOM** | `expect().toBeVisible()` o `waitForFunction()` |
| **Form Submit** | `Promise.all([waitForURL(), submit()])` |

**⚡ Best Practice**: No guardes referencias de elementos en variables. Re-query inline antes de cada acción para evitar elementos "stale".

---

### 🧪 Checklist Pre-Commit

- [ ] ¿Los links esperan `toHaveAttribute('href')` antes de navegar?
- [ ] ¿Todas las navegaciones usan `Promise.all([waitForURL(), click()])`?
- [ ] ¿Los API calls esperan `waitForResponse()`?
- [ ] ¿Usas `expect().toBeVisible()` en lugar de `waitForTimeout()`?
- [ ] ¿El test pasa consistentemente con `npm run test:e2e:prod`?
- [ ] ¿Pasa en el primer intento (sin necesitar retry)?

---

### 🔍 Debugging Fallos Aleatorios

```bash
# 1. Detectar flakiness
for i in {1..10}; do npm run test:e2e:prod; done

# 2. Ver trace
npx playwright show-trace test-results/[test-name]/trace.zip

# 3. Aplicar patrón correcto según tipo de acción
```

---

## 🧪 Test Fixtures - Datos de Prueba

### Sistema de Gestión de Datos

Los tests E2E necesitan datos para probar. El sistema de fixtures permite:

✅ **Crear datos únicos** - Eventos marcados con `[E2E-TEST]`
✅ **Limpiar automáticamente** - Elimina eventos + blacklist después de tests
✅ **Respetar datos existentes** - Solo toca datos de prueba
✅ **Setup/Teardown** - Helpers para `beforeAll`/`afterAll`

### Uso Básico

```typescript
import { setupTestData, teardownTestData } from './helpers/testFixtures';

test.describe('Mi Feature', () => {
  // Setup: crear datos ANTES de tests
  test.beforeAll(async () => {
    await setupTestData(5); // Crear 5 eventos de prueba
  });

  // Teardown: limpiar DESPUÉS de tests
  test.afterAll(async () => {
    await teardownTestData();
  });

  test('mi test', async ({ page }) => {
    await page.goto('/');

    // Buscar solo eventos de prueba
    const testEvent = page.locator('[data-testid="event-card"]:has-text("[E2E-TEST]")');
    await expect(testEvent.first()).toBeVisible();
  });
});
```

### API Endpoints (Protegidos)

```bash
# Crear eventos de prueba
curl -X POST http://localhost:3000/api/test/seed \
  -H "x-api-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"count": 3}'

# Limpiar todos los datos de prueba
curl -X DELETE http://localhost:3000/api/test/cleanup \
  -H "x-api-key: $ADMIN_API_KEY"
```

### Configuración Requerida

```bash
# .env.local
ADMIN_API_KEY="tu-api-key-de-32-caracteres"  # Requerido
```

### Documentación Completa

Ver **[e2e/README.md](../e2e/README.md)** para:
- API reference completa
- Patrones comunes
- Troubleshooting
- Ejemplos avanzados

---

## 🐛 Troubleshooting

### Tests fallan solo en modo paralelo
**Causa**: Race conditions
**Solución**: Revisar sección "Mejores Prácticas" arriba

### Habilitar testing en mobile
```typescript
// playwright.config.ts (línea 23)
{ name: 'mobile', use: { ...devices['iPhone 13'] } }, // Descomentar
```

### Puerto 3001 ocupado
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## 🛠️ CI/CD - GitHub Actions

```yaml
- name: E2E Tests
  run: npm run test:e2e:prod
  env:
    CI: true

- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

---

## ✅ Checklist Pre-Deploy

```bash
npm run type-check        # TypeScript sin errores
npm run lint              # ESLint sin warnings
npm test                  # Tests unitarios pasan
npm run test:e2e:prod     # Tests E2E en producción pasan
```

Si todo pasa → commit y push

---

**Última actualización**: Noviembre 2025
