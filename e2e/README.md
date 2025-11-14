# 🧪 E2E Tests - Test Fixtures Guide

Sistema de gestión de datos de prueba para tests E2E con setup/teardown automático.

## 📚 Tabla de Contenidos

- [Overview](#overview)
- [API Endpoints](#api-endpoints)
- [Helper Functions](#helper-functions)
- [Uso Básico](#uso-básico)
- [Patrones Comunes](#patrones-comunes)
- [Troubleshooting](#troubleshooting)

---

## Overview

El sistema de test fixtures permite:

✅ **Crear datos de prueba únicos** - Eventos marcados con `[E2E-TEST]`
✅ **Limpiar automáticamente** - Elimina eventos de prueba + blacklist
✅ **Respetar datos existentes** - Solo toca datos marcados como test
✅ **Setup/Teardown** - Helpers para usar en `beforeAll`/`afterAll`

---

## API Endpoints

### POST `/api/test/seed`

Crea eventos de prueba en la base de datos.

**Headers:**
```
x-api-key: <ADMIN_API_KEY>
Content-Type: application/json
```

**Body:**
```json
{
  "count": 3  // Número de eventos a crear (default: 3)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Created 3 test events",
  "events": [
    {
      "id": "abc123",
      "title": "[E2E-TEST] Evento de Prueba 1234567890-0",
      "date": "2025-11-15T00:00:00.000Z",
      "city": "Buenos Aires",
      ...
    }
  ]
}
```

**Características de eventos creados:**
- Título: `[E2E-TEST] Evento de Prueba <timestamp>-<index>`
- Source: `E2E-TEST`
- SourceEventId: `test-<timestamp>-<index>`
- Fecha: N días en el futuro (donde N = index + 1)
- Ciudad: Buenos Aires
- Categoría: Concierto
- Género: Rotación entre Rock, Pop, Jazz

---

### DELETE `/api/test/cleanup`

Elimina **TODOS** los datos de prueba (eventos + blacklist).

**Headers:**
```
x-api-key: <ADMIN_API_KEY>
```

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 3 test events and 1 blacklist entries",
  "deleted": {
    "events": 3,
    "blacklisted": 1
  }
}
```

**Qué elimina:**
- Eventos con título que empieza con `[E2E-TEST]`
- Eventos con source `E2E-TEST`
- Entradas en blacklist de esos eventos

---

## Helper Functions

### `setupTestData(count)`

Setup completo: limpia datos previos + crea datos frescos.

```typescript
import { setupTestData } from './helpers/testFixtures';

// En beforeAll
test.beforeAll(async () => {
  await setupTestData(5); // Crear 5 eventos
});
```

**Qué hace:**
1. Llama a `cleanupTestData()` (limpiar datos previos)
2. Llama a `seedTestData(count)` (crear datos frescos)
3. Retorna los eventos creados

---

### `teardownTestData()`

Teardown completo: limpia todos los datos de prueba.

```typescript
import { teardownTestData } from './helpers/testFixtures';

// En afterAll
test.afterAll(async () => {
  await teardownTestData();
});
```

**Qué hace:**
1. Llama a `cleanupTestData()`
2. Elimina eventos de prueba
3. Elimina entradas en blacklist

---

### `seedTestData(count)`

Crea eventos de prueba (low-level).

```typescript
import { seedTestData } from './helpers/testFixtures';

const events = await seedTestData(3);
console.log(events[0].id); // "abc123"
```

---

### `cleanupTestData()`

Limpia datos de prueba (low-level).

```typescript
import { cleanupTestData } from './helpers/testFixtures';

const deleted = await cleanupTestData();
console.log(deleted.events); // 3
console.log(deleted.blacklisted); // 1
```

---

## Uso Básico

### Patrón Recomendado

```typescript
import { test, expect } from '@playwright/test';
import { setupTestData, teardownTestData } from './helpers/testFixtures';

test.describe('Mi Feature', () => {
  // Setup: crear datos ANTES de todos los tests
  test.beforeAll(async () => {
    await setupTestData(5); // Crear 5 eventos de prueba
  });

  // Teardown: limpiar DESPUÉS de todos los tests
  test.afterAll(async () => {
    await teardownTestData();
  });

  test('mi test', async ({ page }) => {
    await page.goto('/');

    // Buscar eventos de prueba específicamente
    const testEvent = page.locator('[data-testid="event-card"]:has-text("[E2E-TEST]")');
    await expect(testEvent.first()).toBeVisible();
  });
});
```

---

## Patrones Comunes

### 1. Seleccionar Solo Eventos de Prueba

```typescript
// ✅ BUENO: Buscar solo eventos de prueba
const testEvent = page.locator('[data-testid="event-card"]:has-text("[E2E-TEST]")').first();

// ❌ MALO: Puede agarrar eventos reales
const anyEvent = page.locator('[data-testid="event-card"]').first();
```

### 2. Setup por Test Suite

```typescript
test.describe('Feature A', () => {
  test.beforeAll(async () => {
    await setupTestData(3); // 3 eventos para Feature A
  });

  test.afterAll(async () => {
    await teardownTestData();
  });

  // Tests...
});

test.describe('Feature B', () => {
  test.beforeAll(async () => {
    await setupTestData(10); // 10 eventos para Feature B
  });

  test.afterAll(async () => {
    await teardownTestData();
  });

  // Tests...
});
```

### 3. Verificar Eventos de Prueba

```typescript
// Verificar que hay al menos un evento de prueba visible
const testEvents = page.locator('[data-testid="event-card"]:has-text("[E2E-TEST]")');
const count = await testEvents.count();
expect(count).toBeGreaterThan(0);
```

### 4. Agregar Evento de Prueba a Blacklist

```typescript
test('debe poder blacklistear evento de prueba', async ({ page }) => {
  await page.goto('/');

  // Seleccionar evento de prueba específicamente
  const testEvent = page.locator('[data-testid="event-card"]:has-text("[E2E-TEST]")').first();

  // Configurar dialog handler
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  // Click en botón de eliminar
  await testEvent.getByRole('button', { name: /ocultar evento/i }).click();

  // Esperar response
  await page.waitForResponse(
    (res) => res.url().includes('/api/events/') && res.request().method() === 'DELETE'
  );

  // Verificar que desapareció
  await expect(testEvent).not.toBeVisible();
});

// ✅ El teardown limpiará el evento de la blacklist también
```

---

## Configuración Requerida

### Variables de Entorno

```bash
# .env.local
ADMIN_API_KEY="tu-api-key-aqui"  # Requerido para seed/cleanup

# Base de datos E2E (completamente separada de desarrollo)
DATABASE_URL_E2E="file:./e2e.db"  # BD dedicada para tests E2E/integración

# Para tests E2E
E2E_BASE_URL="http://localhost:3000"  # O http://localhost:3001 en prod
```

### Inicializar Base de Datos E2E

**IMPORTANTE**: Los tests E2E usan una base de datos completamente separada de desarrollo (`e2e.db`).

```bash
# 1. Crear la base de datos E2E (primera vez)
npm run db:e2e:init

# 2. Verificar la BD E2E con Prisma Studio (opcional)
npm run db:e2e:studio

# 3. Ejecutar tests E2E
npm run test:e2e
```

**Ventajas de la BD separada:**
- ✅ Tests E2E no contaminan datos de desarrollo
- ✅ Puedes ejecutar tests en paralelo sin conflictos
- ✅ Puedes resetear la BD E2E sin afectar desarrollo
- ✅ Mismo esquema que desarrollo, datos diferentes

### Resetear Base de Datos E2E

Si la BD E2E se corrompe o quieres empezar de cero:

```bash
# Opción 1: Eliminar y recrear
rm e2e.db e2e.db-journal
npm run db:e2e:init

# Opción 2: Solo limpiar datos de test (sin eliminar la BD)
curl -X DELETE http://localhost:3000/api/test/cleanup \
  -H "x-api-key: $ADMIN_API_KEY"
```

### Verificar Configuración

```bash
# Verificar que ADMIN_API_KEY está seteada
echo $ADMIN_API_KEY

# Verificar que DATABASE_URL_E2E está seteada
echo $DATABASE_URL_E2E

# Probar seed manualmente
curl -X POST http://localhost:3000/api/test/seed \
  -H "x-api-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"count": 3}'

# Probar cleanup manualmente
curl -X DELETE http://localhost:3000/api/test/cleanup \
  -H "x-api-key: $ADMIN_API_KEY"
```

---

## Troubleshooting

### Error: "ADMIN_API_KEY not set"

**Causa:** Variable de entorno no configurada en `.env.local`.

**Solución:**
```bash
# 1. Crear/editar .env.local en la raíz del proyecto
ADMIN_API_KEY="tu-api-key-de-32-caracteres"

# 2. Playwright carga automáticamente .env.local (via dotenv en playwright.config.ts)
# 3. Reiniciar tests
npm run test:e2e
```

**Importante:**
- Playwright configs (`playwright.config.ts` y `playwright.config.prod.ts`) cargan `.env.local` automáticamente
- Las variables están disponibles en `process.env` dentro de los tests
- NO necesitas usar `cross-env` ni `dotenv` manualmente

### Error: "Failed to seed test data: 401"

**Causa:** API key inválida o no enviada.

**Solución:**
- Verificar que `.env.local` tiene `ADMIN_API_KEY`
- Verificar que el valor tiene al menos 32 caracteres

### Error: "Endpoint not available in production"

**Causa:** Intentando usar endpoints de testing en producción real.

**Solución:**
- Solo usar en desarrollo (`NODE_ENV=development`)
- O en preview deploys (`VERCEL_ENV=preview`)
- **NUNCA** usar en producción (`VERCEL_ENV=production`)

### Los datos no se limpian

**Causa:** `afterAll` no se ejecutó (test terminó con error).

**Solución manual:**
```bash
# Limpiar manualmente con curl
curl -X DELETE http://localhost:3000/api/test/cleanup \
  -H "x-api-key: $ADMIN_API_KEY"
```

### Tests fallan con "no events found"

**Causa:** Setup no se ejecutó o falló silenciosamente.

**Debug:**
```typescript
test.beforeAll(async () => {
  try {
    const events = await setupTestData(5);
    console.log('✅ Created events:', events.length);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error; // Re-throw para que falle el test
  }
});
```

---

## Mejores Prácticas

### ✅ DO

- Usar `setupTestData` en `beforeAll`
- Usar `teardownTestData` en `afterAll`
- Buscar eventos por `[E2E-TEST]` en el título
- Crear suficientes eventos para tus tests (5-10 recomendado)
- Verificar que `ADMIN_API_KEY` está configurada

### ❌ DON'T

- No usar fixtures en producción real (Vercel production)
- No asumir que hay datos sin hacer setup
- No modificar eventos que no sean de prueba
- No skipear el teardown (deja el ambiente sucio)

---

## Archivos Relacionados

```
e2e/
├── README.md                     # 📖 Esta guía
├── helpers/
│   └── testFixtures.ts          # 🔧 Helper functions
├── example-with-fixtures.e2e.ts # 💡 Ejemplo completo
└── event-detail.e2e.ts          # Tests existentes

src/app/api/test/
├── seed/
│   └── route.ts                 # POST /api/test/seed
└── cleanup/
    └── route.ts                 # DELETE /api/test/cleanup
```

---

## Referencias

- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [docs/E2E_TESTING.md](../docs/E2E_TESTING.md) - Guía general de E2E
- [scripts/DIAGNOSTIC_GUIDE.md](../scripts/DIAGNOSTIC_GUIDE.md) - Diagnóstico de race conditions

---

**Última actualización:** Noviembre 2025
