import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

/**
 * Configuración de Playwright para PRODUCTION MODE
 *
 * Uso: npm run test:e2e:prod
 *
 * Características:
 * - Usa build de producción (npm run build + npm start)
 * - Ejecución paralela con 4 workers
 * - Para validación pre-deploy o CI
 * - ~15s de tests (después del build inicial)
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true, // ✅ Paralelismo completo
  workers: 4, // ✅ 4 workers = ejecución paralela
  retries: process.env.CI ? 2 : 1, // ✅ 1 retry en local, 2 en CI
  reporter: [
    ['list'], // ✅ Muestra progreso en consola
    ['html', { open: 'never' }], // ✅ Genera HTML pero NO lo abre automáticamente
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Mobile deshabilitado por defecto para producción más rápida
    // Para ejecutar en mobile: npm run test:e2e:prod -- --project=mobile
    // { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  // ✅ Inicia servidor de producción en puerto 3001 (para no conflictuar con dev)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run start:test',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
          // Pasar ADMIN_API_KEY al servidor de producción
          ADMIN_API_KEY: process.env.ADMIN_API_KEY || '',
        },
      },
});
