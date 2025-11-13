import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts', // Match E2E test files
  fullyParallel: false, // ✅ Modo dev: secuencial para desarrollo rápido
  workers: 1, // ✅ Un worker = sin paralelismo
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'], // ✅ Muestra progreso en consola
    ['html', { open: 'never' }], // ✅ Genera HTML pero NO lo abre automáticamente
  ],
  use: {
    // ✅ URL dinámica: soporta local, CI, producción
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Mobile deshabilitado por defecto para desarrollo más rápido
    // Para ejecutar en mobile: npm run test:e2e -- --project=mobile
    // { name: 'mobile', use: { ...devices['iPhone 13'] } },
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
