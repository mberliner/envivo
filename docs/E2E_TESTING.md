# 🧪 Tests E2E - Guía de Uso

## Setup Rápido

### 1. Crear Base de Datos E2E

```bash
# Primera vez: crear BD E2E separada
DATABASE_URL="file:./e2e.db" npx prisma db push
```

### 2. Configurar .env.local

**⚠️ IMPORTANTE:** NO agregues `DATABASE_URL_E2E` a `.env.local`

Tu `.env.local` solo necesita:
```bash
DATABASE_URL="file:./dev.db"
ADMIN_API_KEY="tu-api-key-de-32-caracteres"
```

**Por qué:** Playwright pasa `DATABASE_URL_E2E` automáticamente. Si la pones en `.env.local`, `npm run dev` usará la BD E2E.

---

## Ejecutar Tests

```bash
# Desarrollo (servidor dev en puerto 3000)
npm run test:e2e

# Producción (build + servidor en puerto 3001)
npm run test:e2e:prod

# UI interactiva de Playwright
npm run test:e2e:ui

# Modo debug
npm run test:e2e:debug
```

---

## Arquitectura

### Dos Bases de Datos Separadas

```
dev.db  →  npm run dev           (desarrollo normal)
e2e.db  →  npm run test:e2e      (tests E2E)
```

**Beneficios:**
- ✅ Tests no contaminan datos de desarrollo
- ✅ Ejecución paralela sin conflictos
- ✅ Reseteo independiente

### Cómo Funciona

```
npm run test:e2e
    ↓
Playwright ejecuta con DATABASE_URL_E2E='file:./e2e.db'
    ↓
Aplicación usa e2e.db (solo durante tests)
    ↓
Tests crean/limpian datos automáticamente
```

**Configuración en:** `playwright.config.ts` línea 40
```typescript
webServer: {
  env: {
    DATABASE_URL_E2E: 'file:./e2e.db'  // Hardcodeado
  }
}
```

---

## Escribir Tests

### Estructura Básica

```typescript
import { test, expect } from '@playwright/test';
import { setupTestData, teardownTestData } from './helpers/testFixtures';

test.describe('Mi Feature', () => {
  // Setup: crear datos ANTES de todos los tests
  test.beforeAll(async () => {
    await setupTestData(10, 'MI-FEATURE');  // 10 eventos con prefix
  });

  // Cleanup: limpiar DESPUÉS de todos los tests
  test.afterAll(async () => {
    await teardownTestData('MI-FEATURE');
  });

  test('debe mostrar eventos', async ({ page }) => {
    await page.goto('/');

    // Buscar SOLO eventos de este test (por prefix)
    const eventos = page.locator('[data-testid="event-card"]:has-text("[MI-FEATURE]")');
    await expect(eventos.first()).toBeVisible();
  });
});
```

### Test Fixtures (Setup/Cleanup)

**Funciones disponibles:**

```typescript
// Setup completo (limpia previos + crea frescos)
await setupTestData(count, prefix)

// Cleanup completo
await teardownTestData(prefix)

// Low-level (solo si necesitas control fino)
await seedTestData(count, prefix)
await cleanupTestData(prefix)
```

**Ejemplo con prefix único:**

```typescript
test.beforeAll(async () => {
  await setupTestData(5, 'SEARCH');  // Crea eventos con [SEARCH]
});

test('buscar eventos', async ({ page }) => {
  // Solo buscar eventos de ESTE suite
  const searchEvents = page.locator('[data-testid="event-card"]:has-text("[SEARCH]")');
  await expect(searchEvents.first()).toBeVisible();
});

test.afterAll(async () => {
  await teardownTestData('SEARCH');  // Limpia solo eventos [SEARCH]
});
```

---

## Gestión de BD E2E

### Ver Contenido

```bash
# Abrir en Prisma Studio
npm run db:e2e:studio
```

### Resetear BD E2E

```bash
# Opción 1: Eliminar y recrear
rm e2e.db e2e.db-journal
DATABASE_URL="file:./e2e.db" npx prisma db push

# Opción 2: Limpiar solo datos de test
curl -X DELETE http://localhost:3000/api/test/cleanup \
  -H "x-api-key: $ADMIN_API_KEY"
```

---

## Troubleshooting

### Error: Tests no encuentran eventos

**Causa:** BD E2E no existe o sin esquema

**Solución:**
```bash
DATABASE_URL="file:./e2e.db" npx prisma db push
```

### Error: "npm run dev" muestra "[Prisma] Using E2E database"

**Causa:** `DATABASE_URL_E2E` está en `.env.local`

**Solución:** Editar `.env.local` y comentar:
```bash
# DATABASE_URL_E2E="file:./e2e.db"  ← Comentar esta línea
```

### Tests fallan con datos antiguos

**Causa:** `afterAll()` no se ejecutó (test anterior falló)

**Solución:** Limpiar manualmente
```bash
curl -X DELETE "http://localhost:3000/api/test/cleanup?prefix=TU-PREFIX" \
  -H "x-api-key: $ADMIN_API_KEY"
```

---

## Mejores Prácticas

### ✅ DO

- Usar `setupTestData` en `beforeAll`
- Usar `teardownTestData` en `afterAll`
- Buscar eventos por prefix único `[MI-FEATURE]`
- Crear suficientes eventos (5-10 recomendado)
- Usar prefixes descriptivos (`SEARCH`, `DETAIL`, `BLACKLIST`)

### ❌ DON'T

- No configurar `DATABASE_URL_E2E` en `.env.local`
- No asumir que hay datos sin hacer setup
- No modificar eventos que no sean de prueba
- No skipear el cleanup (deja BD sucia)
- No usar prefixes genéricos (`TEST`, `E2E`)

---

## Configuración Avanzada

### Cambiar BD E2E

Editar `playwright.config.ts` y `playwright.config.prod.ts`:

```typescript
// Línea 40 en ambos archivos
DATABASE_URL_E2E: 'file:./mi-bd-custom.db'
```

### Diferentes BDs por Ambiente

```typescript
DATABASE_URL_E2E: process.env.CI
  ? 'file:./ci-e2e.db'      // En CI
  : 'file:./local-e2e.db'   // En local
```

---

## Archivos Clave

```
playwright.config.ts                      # Config tests desarrollo
playwright.config.prod.ts                 # Config tests producción
e2e/helpers/testFixtures.ts              # Setup/cleanup helpers
src/app/api/test/seed/route.ts           # Endpoint crear datos
src/app/api/test/cleanup/route.ts        # Endpoint limpiar datos
src/app/api/test/helpers/e2e-db.ts       # Helper BD E2E
src/shared/infrastructure/database/prisma.ts  # Cliente Prisma
```

---

## Comandos de Referencia Rápida

```bash
# Setup inicial
DATABASE_URL="file:./e2e.db" npx prisma db push

# Ejecutar tests
npm run test:e2e              # Desarrollo
npm run test:e2e:prod         # Producción
npm run test:e2e:ui           # UI Playwright

# Gestión BD E2E
npm run db:e2e:studio         # Ver datos
rm e2e.db && npx prisma db push  # Resetear

# Limpiar datos manualmente
curl -X DELETE http://localhost:3000/api/test/cleanup \
  -H "x-api-key: $ADMIN_API_KEY"
```

---

**Última actualización:** Noviembre 2025
