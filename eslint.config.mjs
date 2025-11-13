import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Build outputs
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",

    // Dependencies
    "node_modules/**",

    // Documentation examples (reference code, may have intentional issues)
    "docs/examples/**",

    // Scripts (Node.js scripts using require())
    "scripts/**",

    // Test coverage
    "coverage/**",

    // Playwright outputs
    "playwright-report/**",
    "test-results/**",

    // Cache
    ".cache/**",
    ".turbo/**",

    // Database
    "*.db",
    "*.db-journal",
    "prisma/migrations/**",
  ]),
]);

export default eslintConfig;
