// Test setup file for Vitest
import '@testing-library/jest-dom/vitest';

// Mock environment variables for tests
if (typeof process !== 'undefined' && process.env) {
  Object.assign(process.env, {
    DATABASE_URL: 'file:./test.db',
    NODE_ENV: 'test',
    ALLACCESS_API_KEY: 'test-api-key-for-vitest',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_NAME: 'EnVivo Test',
  });
}
