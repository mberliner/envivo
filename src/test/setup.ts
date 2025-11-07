import '@testing-library/jest-dom';

// Mock environment variables for tests
if (typeof process !== 'undefined' && process.env) {
  process.env.DATABASE_URL = 'file:./test.db';
}
