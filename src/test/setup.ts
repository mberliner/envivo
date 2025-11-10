// Test setup file for Vitest
// Minimal setup - no DOM dependencies

// Mock environment variables for tests
if (typeof process !== 'undefined' && process.env) {
  Object.assign(process.env, {
    DATABASE_URL: 'file:./test.db',
    NODE_ENV: 'test',
    TICKETMASTER_API_KEY: 'test-api-key-for-vitest',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_NAME: 'EnVivo Test',
  });
}
