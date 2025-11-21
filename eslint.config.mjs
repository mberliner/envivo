import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import boundariesPlugin from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Custom rules configuration
  {
    rules: {
      // TODO: Migrate all 'any' types to specific types or 'unknown'
      // Changed to 'warn' to allow commits while migrating gradually
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Architecture Boundaries - Clean Architecture Enforcement
  {
    plugins: {
      boundaries: boundariesPlugin,
      import: importPlugin,
    },
    settings: {
      'boundaries/elements': [
        {
          type: 'domain',
          pattern: 'src/features/*/domain/**/*',
          mode: 'full',
        },
        {
          type: 'data',
          pattern: 'src/features/*/data/**/*',
          mode: 'full',
        },
        {
          type: 'ui',
          pattern: 'src/features/*/ui/**/*',
          mode: 'full',
        },
        {
          type: 'shared',
          pattern: 'src/shared/**/*',
          mode: 'full',
        },
      ],
      'boundaries/ignore': ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    },
    rules: {
      // Core Clean Architecture Rule: Domain CANNOT depend on Data or UI
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: 'domain',
              disallow: ['data', 'ui'],
              message:
                'Domain layer CANNOT import from Data or UI layers (Clean Architecture violation)',
            },
            {
              from: 'data',
              disallow: ['ui'],
              message: 'Data layer CANNOT import from UI layer',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Build outputs
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'next-env.d.ts',

    // Dependencies
    'node_modules/**',

    // Documentation examples (reference code, may have intentional issues)
    'docs/examples/**',

    // Scripts (Node.js scripts using require())
    'scripts/**',

    // Test coverage
    'coverage/**',

    // Playwright outputs
    'playwright-report/**',
    'test-results/**',

    // Cache
    '.cache/**',
    '.turbo/**',

    // Database
    '*.db',
    '*.db-journal',
    'prisma/migrations/**',
  ]),
]);

export default eslintConfig;
