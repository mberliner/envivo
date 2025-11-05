/**
 * EJEMPLO COMPLETO: Environment Variables Configuration
 *
 * Este archivo muestra cómo implementar:
 * 1. Validación de variables de entorno con Zod
 * 2. Type-safe env variables
 * 3. Feature flags
 * 4. Configuración por ambiente
 *
 * NOTA: Este es un archivo de EJEMPLO. Copiar código a /src durante implementación.
 */

import { z } from 'zod';

// ============================================
// 1. ENV SCHEMA CON ZOD
// ============================================

/**
 * Archivo: src/shared/infrastructure/config/env.ts
 */

const EnvSchema = z.object({
  // ========================================
  // AMBIENTE
  // ========================================
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // ========================================
  // BASE DE DATOS
  // ========================================
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // ========================================
  // APIs EXTERNAS (Server-side only)
  // ========================================
  TICKETMASTER_API_KEY: z.string().min(1, 'TICKETMASTER_API_KEY is required'),
  EVENTBRITE_API_KEY: z.string().optional(),
  BANDSINTOWN_API_KEY: z.string().optional(),

  // ========================================
  // SEGURIDAD
  // ========================================
  ADMIN_API_KEY: z.string()
    .min(32, 'ADMIN_API_KEY must be at least 32 characters for security'),

  // ========================================
  // RATE LIMITING (Opcional - Upstash Redis)
  // ========================================
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ========================================
  // MONITORING (Opcional)
  // ========================================
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // ========================================
  // VARIABLES PÚBLICAS (Expuestas al cliente)
  // ========================================
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('EnVivo'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional()
});

// Validar al iniciar la aplicación
const parseResult = EnvSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parseResult.error.flatten().fieldErrors, null, 2));

  // En desarrollo, mostrar cuáles faltan
  if (process.env.NODE_ENV === 'development') {
    const missing = Object.keys(parseResult.error.flatten().fieldErrors);
    console.error('\n📋 Missing or invalid variables:', missing.join(', '));
    console.error('\n💡 Check your .env.local file and compare with .env.example\n');
  }

  throw new Error('Invalid environment configuration');
}

export const env = parseResult.data;

// Type-safe environment variables
export type Env = z.infer<typeof EnvSchema>;

// ============================================
// 2. CONFIGURACIÓN POR AMBIENTE
// ============================================

/**
 * Archivo: src/shared/infrastructure/config/app.config.ts
 */

import { env } from './env';

export const appConfig = {
  // Scraping
  scraping: {
    concurrency: env.NODE_ENV === 'production' ? 5 : 3,
    retries: env.NODE_ENV === 'production' ? 3 : 1,
    timeout: env.NODE_ENV === 'production' ? 15000 : 30000,
    rateLimit: {
      ticketmaster: {
        maxPerSecond: 5,
        maxPerDay: 5000
      },
      eventbrite: {
        maxPerSecond: 10
      }
    }
  },

  // Cache
  cache: {
    ttl: env.NODE_ENV === 'production' ? 3600 : 60, // 1 hora vs 1 minuto
    maxSize: 100,
    enabled: env.NODE_ENV !== 'test'
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },

  // Search
  search: {
    minQueryLength: 2,
    maxQueryLength: 100,
    debounceMs: 300
  },

  // Features flags
  features: {
    enableSentry: env.NODE_ENV === 'production' && !!env.SENTRY_DSN,
    enableRedisCache: !!env.UPSTASH_REDIS_REST_URL,
    enableDetailedLogs: env.NODE_ENV === 'development',
    enableGoogleMaps: !!env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  },

  // External APIs
  apis: {
    ticketmaster: {
      baseUrl: 'https://app.ticketmaster.com/discovery/v2',
      apiKey: env.TICKETMASTER_API_KEY,
      timeout: 10000
    },
    eventbrite: env.EVENTBRITE_API_KEY
      ? {
          baseUrl: 'https://www.eventbriteapi.com/v3',
          apiKey: env.EVENTBRITE_API_KEY,
          timeout: 10000
        }
      : undefined
  }
};

// Helper: Get feature flag
export function isFeatureEnabled(feature: keyof typeof appConfig.features): boolean {
  return appConfig.features[feature];
}

// ============================================
// 3. .env.example (Template)
// ============================================

/**
 * Archivo: .env.example
 *
 * Este archivo debe estar en el repo (commit). Copiar a .env.local y completar valores.
 */

/*
# ========================================
# AMBIENTE
# ========================================
NODE_ENV="development"  # development | test | production
LOG_LEVEL="debug"       # error | warn | info | debug

# ========================================
# BASE DE DATOS
# ========================================
DATABASE_URL="file:./dev.db"  # SQLite para desarrollo
# DATABASE_URL="postgresql://user:pass@localhost:5432/envivo"  # PostgreSQL para producción

# ========================================
# APIs EXTERNAS (Server-side only)
# ========================================
TICKETMASTER_API_KEY="your-ticketmaster-api-key-here"
EVENTBRITE_API_KEY="your-eventbrite-api-key-here"  # Opcional
BANDSINTOWN_API_KEY="your-bandsintown-api-key-here"  # Opcional

# ========================================
# SEGURIDAD
# ========================================
# Generar con: openssl rand -hex 32
ADMIN_API_KEY="your-secure-admin-key-here-min-32-chars"

# ========================================
# RATE LIMITING (Opcional - Upstash Redis)
# ========================================
# UPSTASH_REDIS_REST_URL="https://..."
# UPSTASH_REDIS_REST_TOKEN="..."

# ========================================
# MONITORING (Opcional)
# ========================================
# SENTRY_DSN="https://...@sentry.io/..."
# SENTRY_AUTH_TOKEN="..."

# ========================================
# VARIABLES PÚBLICAS (Expuestas al cliente)
# ========================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="EnVivo"
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."  # Opcional

# ========================================
# NOTAS
# ========================================
# - Variables que empiezan con NEXT_PUBLIC_ son PÚBLICAS (expuestas al navegador)
# - NO poner secretos en NEXT_PUBLIC_*
# - Nunca hacer commit de .env o .env.local
# - Usar .env.local para desarrollo local
*/

// ============================================
// 4. .gitignore
// ============================================

/**
 * Archivo: .gitignore
 */

/*
# Environment variables
.env
.env.local
.env.production
.env.production.local
.env.*.local

# NUNCA hacer commit de:
.env.production.local
*.key
*.pem
credentials.json

# OK hacer commit:
# .env.example ✅
*/

// ============================================
// 5. USO EN SERVER COMPONENTS
// ============================================

/**
 * ✅ CORRECTO: Server Component o API Route
 */

import { env } from '@/shared/infrastructure/config/env';
import { appConfig } from '@/shared/infrastructure/config/app.config';

export async function ServerComponent() {
  // ✅ Puede acceder a todas las variables
  const apiKey = env.TICKETMASTER_API_KEY;
  const dbUrl = env.DATABASE_URL;

  // ✅ Usar config en lugar de env directo
  const timeout = appConfig.apis.ticketmaster.timeout;

  return <div>Server Component</div>;
}

/**
 * ❌ INCORRECTO: Client Component
 */

'use client';

import { env } from '@/shared/infrastructure/config/env';

export function ClientComponent() {
  // ❌ Variables server-side son undefined en cliente
  const apiKey = env.TICKETMASTER_API_KEY; // undefined

  // ✅ Solo NEXT_PUBLIC_* están disponibles
  const appUrl = env.NEXT_PUBLIC_APP_URL; // OK

  return <div>Client Component</div>;
}

// ============================================
// 6. VALIDACIÓN EN RUNTIME
// ============================================

/**
 * Archivo: src/shared/infrastructure/config/validate-env.ts
 *
 * Script para validar env vars antes de deploy
 */

import { EnvSchema } from './env';

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:\n');

    const errors = result.error.flatten().fieldErrors;

    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  • ${key}:`);
      messages?.forEach(msg => console.error(`    - ${msg}`));
    }

    console.error('\n💡 Fix these issues before deploying.\n');
    process.exit(1);
  }

  console.log('✅ All environment variables are valid!\n');

  // Listar variables configuradas
  console.log('📋 Configured variables:');
  for (const key of Object.keys(result.data)) {
    const value = result.data[key as keyof typeof result.data];
    const display = key.includes('KEY') || key.includes('TOKEN')
      ? '***hidden***'
      : value;
    console.log(`  • ${key}: ${display}`);
  }
}

if (require.main === module) {
  validateEnvironment();
}

// ============================================
// 7. FEATURE FLAGS
// ============================================

/**
 * Uso de feature flags
 */

import { isFeatureEnabled } from '@/shared/infrastructure/config/app.config';

export async function someFunction() {
  // Verificar si Sentry está habilitado
  if (isFeatureEnabled('enableSentry')) {
    // Enviar error a Sentry
  }

  // Verificar si Redis está habilitado
  if (isFeatureEnabled('enableRedisCache')) {
    // Usar Redis para cache
  } else {
    // Fallback a memoria
  }

  // Verificar si Google Maps está habilitado
  if (isFeatureEnabled('enableGoogleMaps')) {
    // Mostrar mapa
  }
}

// ============================================
// 8. SCRIPTS NPM
// ============================================

/**
 * Archivo: package.json
 */

/*
{
  "scripts": {
    "env:validate": "tsx src/shared/infrastructure/config/validate-env.ts",
    "env:check": "npm run env:validate",
    "prebuild": "npm run env:validate",
    "predev": "npm run env:validate"
  }
}
*/

// ============================================
// COMANDOS ÚTILES
// ============================================

/**
 * Generar ADMIN_API_KEY seguro:
 * $ openssl rand -hex 32
 *
 * Verificar variables disponibles:
 * $ npm run env:check
 *
 * Ver variables en build:
 * $ npm run build (falla si faltan variables)
 */
