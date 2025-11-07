// Test setup file for Vitest
// Minimal setup - no DOM dependencies

// Mock environment variables for tests
if (typeof process !== 'undefined' && process.env) {
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.NODE_ENV = 'test';
  process.env.TICKETMASTER_API_KEY = 'test-api-key-for-vitest';
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  process.env.NEXT_PUBLIC_APP_NAME = 'EnVivo Test';
}
