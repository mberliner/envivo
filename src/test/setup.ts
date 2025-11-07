// Test setup file
// Runs before all tests

import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.DATABASE_URL = 'file:./test.db';
