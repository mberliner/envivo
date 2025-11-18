/**
 * Test Fixtures para E2E Tests
 *
 * Helpers para crear y limpiar datos de prueba
 */

// Función helper para obtener variables de entorno (lazy evaluation)
function getEnv(key: string, defaultValue = ''): string {
  // En Node.js (Playwright test context)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
}

function getBaseUrl(): string {
  return getEnv('E2E_BASE_URL', 'http://localhost:3000');
}

function getAdminApiKey(): string {
  const key = getEnv('ADMIN_API_KEY');
  if (!key) {
    throw new Error(
      'ADMIN_API_KEY not set. Add it to .env.local:\n' +
        'ADMIN_API_KEY="your-32-character-key-here"\n\n' +
        'Then restart your tests.'
    );
  }
  return key;
}

interface SeedResponse {
  success: boolean;
  message: string;
  events: Array<{
    id: string;
    title: string;
    date: string;
    [key: string]: unknown;
  }>;
}

interface CleanupResponse {
  success: boolean;
  message: string;
  deleted: {
    events: number;
    blacklisted: number;
  };
}

/**
 * Crear datos de prueba
 *
 * @param count - Número de eventos a crear (default: 3)
 * @param prefix - Prefijo único para este suite de tests (default: 'E2E-TEST')
 * @returns Lista de eventos creados
 */
export async function seedTestData(
  count = 3,
  prefix = 'E2E-TEST'
): Promise<SeedResponse['events']> {
  const BASE_URL = getBaseUrl();
  const ADMIN_API_KEY = getAdminApiKey();

  const response = await fetch(`${BASE_URL}/api/test/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ADMIN_API_KEY,
    },
    body: JSON.stringify({ count, prefix }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to seed test data: ${response.status} ${error}`);
  }

  const data: SeedResponse = await response.json();

  if (!data.success) {
    throw new Error('Seed API returned success: false');
  }

  console.log(`[TEST FIXTURES] ✅ Seeded ${data.events.length} test events`);
  return data.events;
}

/**
 * Limpiar TODOS los datos de prueba
 *
 * Elimina:
 * - Eventos de prueba (título empieza con [prefix])
 * - Entradas en blacklist de esos eventos
 *
 * @param prefix - Prefijo único para este suite de tests (default: 'E2E-TEST')
 * @returns Número de registros eliminados
 */
export async function cleanupTestData(prefix = 'E2E-TEST'): Promise<CleanupResponse['deleted']> {
  const BASE_URL = getBaseUrl();
  const ADMIN_API_KEY = getAdminApiKey();

  const response = await fetch(
    `${BASE_URL}/api/test/cleanup?prefix=${encodeURIComponent(prefix)}`,
    {
      method: 'DELETE',
      headers: {
        'x-api-key': ADMIN_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to cleanup test data: ${response.status} ${error}`);
  }

  const data: CleanupResponse = await response.json();

  if (!data.success) {
    throw new Error('Cleanup API returned success: false');
  }

  console.log(
    `[TEST FIXTURES] 🧹 Cleaned up ${data.deleted.events} events, ${data.deleted.blacklisted} blacklist entries`
  );
  return data.deleted;
}

/**
 * Setup completo para tests
 *
 * - Limpia datos de prueba previos
 * - Crea datos frescos
 *
 * Usar en beforeAll() o beforeEach()
 *
 * @param count - Número de eventos a crear (default: 3)
 * @param prefix - Prefijo único para este suite de tests (default: 'E2E-TEST')
 */
export async function setupTestData(count = 3, prefix = 'E2E-TEST') {
  console.log(`[TEST FIXTURES] 🔧 Setting up test data (prefix: ${prefix})...`);

  // Limpiar datos previos (por si quedaron de tests anteriores)
  await cleanupTestData(prefix);

  // Crear datos frescos
  const events = await seedTestData(count, prefix);

  console.log('[TEST FIXTURES] ✅ Test data ready');
  return events;
}

/**
 * Teardown completo para tests
 *
 * - Limpia todos los datos de prueba
 * - Deja el ambiente limpio
 *
 * Usar en afterAll() o afterEach()
 *
 * @param prefix - Prefijo único para este suite de tests (default: 'E2E-TEST')
 */
export async function teardownTestData(prefix = 'E2E-TEST') {
  console.log(`[TEST FIXTURES] 🧹 Tearing down test data (prefix: ${prefix})...`);
  await cleanupTestData(prefix);
  console.log('[TEST FIXTURES] ✅ Test environment clean');
}
