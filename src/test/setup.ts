// Test setup file for Vitest
// Minimal setup - no DOM dependencies

// Mock environment variables for tests
if (typeof process !== 'undefined' && process.env) {
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.NODE_ENV = 'test';
}
