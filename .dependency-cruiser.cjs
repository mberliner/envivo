/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Circular dependencies create tight coupling and make code harder to maintain',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'domain-isolation',
      severity: 'error',
      comment:
        'Domain layer CANNOT depend on Data or UI layers (Clean Architecture)',
      from: {
        path: '^src/features/[^/]+/domain',
      },
      to: {
        path: '^src/features/[^/]+/(data|ui)',
      },
    },
    {
      name: 'data-to-ui-forbidden',
      severity: 'error',
      comment: 'Data layer CANNOT depend on UI layer',
      from: {
        path: '^src/features/[^/]+/data',
      },
      to: {
        path: '^src/features/[^/]+/ui',
      },
    },
    {
      name: 'data-implements-domain',
      severity: 'info',
      comment:
        'Data layer SHOULD implement domain interfaces (dependency inversion)',
      from: {
        path: '^src/features/[^/]+/data',
      },
      to: {
        path: '^src/features/[^/]+/domain',
      },
    },
  ],
  options: {
    // Patterns to exclude from validation
    doNotFollow: {
      path: [
        'node_modules',
        '\\.next',
        'out',
        'build',
        'dist',
        'coverage',
        'playwright-report',
        'test-results',
        '\\.cache',
        '\\.turbo',
      ],
    },
    exclude: {
      path: [
        // Exclude tests from validation
        '\\.test\\.(ts|tsx)$',
        '\\.spec\\.(ts|tsx)$',
        // Exclude build outputs
        'next-env\\.d\\.ts$',
        // Exclude config files
        '^eslint\\.config\\.mjs$',
        '^tailwind\\.config\\.ts$',
        '^vitest\\.config\\.ts$',
        '^playwright\\.config',
        // Exclude scripts and seed files
        '^scripts/',
        '^prisma/seed\\.ts$',
      ],
    },
    // Report module types
    tsPreCompilationDeps: true,
    // Use tsconfig for path resolution
    tsConfig: {
      fileName: './tsconfig.json',
    },
    // Enhanced resolver for better path alias support
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    // Report options
    reporterOptions: {
      dot: {
        collapsePattern: '^(node_modules|src/shared)',
        theme: {
          graph: {
            splines: 'ortho',
          },
          modules: [
            {
              criteria: { source: '^src/features/[^/]+/domain' },
              attributes: {
                fillcolor: '#90EE90',
                fontcolor: 'black',
              },
            },
            {
              criteria: { source: '^src/features/[^/]+/data' },
              attributes: {
                fillcolor: '#87CEEB',
                fontcolor: 'black',
              },
            },
            {
              criteria: { source: '^src/features/[^/]+/ui' },
              attributes: {
                fillcolor: '#FFB6C1',
                fontcolor: 'black',
              },
            },
            {
              criteria: { source: '^src/shared' },
              attributes: {
                fillcolor: '#F0E68C',
                fontcolor: 'black',
              },
            },
          ],
          dependencies: [
            {
              criteria: { resolved: '^src/features/[^/]+/domain' },
              attributes: {
                color: 'green',
              },
            },
            {
              criteria: { resolved: '^src/features/[^/]+/data' },
              attributes: {
                color: 'blue',
              },
            },
            {
              criteria: { resolved: '^src/features/[^/]+/ui' },
              attributes: {
                color: 'pink',
              },
            },
          ],
        },
      },
    },
  },
};
