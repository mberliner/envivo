/**
 * EJEMPLO COMPLETO: Security Best Practices
 *
 * Este archivo muestra cómo implementar:
 * 1. Validación de entrada con Zod
 * 2. Sanitización de datos scrapeados con DOMPurify
 * 3. Rate limiting (con y sin Redis)
 * 4. Headers de seguridad
 * 5. Secrets management
 *
 * NOTA: Este es un archivo de EJEMPLO. Copiar código a /src durante implementación.
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { LRUCache } from 'lru-cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// 1. VALIDACIÓN DE ENTRADA (Zod)
// ============================================

/**
 * Schema para validar eventos de entrada
 * Archivo: src/shared/validation/schemas.ts
 */

export const EventInputSchema = z.object({
  title: z.string()
    .min(3, 'Título muy corto')
    .max(200, 'Título muy largo')
    .regex(/^[a-zA-Z0-9\s\-.,áéíóúñÁÉÍÓÚÑ]+$/, 'Caracteres inválidos'),

  date: z.coerce.date()
    .refine(d => d > new Date('2020-01-01'), 'Fecha muy antigua')
    .refine(d => d < new Date('2030-12-31'), 'Fecha muy lejana'),

  venue: z.string().min(2).max(100).optional(),

  url: z.string().url('URL inválida').optional(),

  price: z.number()
    .min(0, 'Precio no puede ser negativo')
    .max(1000000, 'Precio sospechosamente alto')
    .optional(),

  description: z.string().max(2000).optional()
});

export const SearchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  city: z.string().max(50).optional(),
  category: z.enum(['Concierto', 'Festival', 'Teatro', 'Stand-up']).optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

/**
 * Uso en API routes
 * Archivo: app/api/eventos/route.ts
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Validar query params
  const parseResult = SearchQuerySchema.safeParse({
    q: searchParams.get('q'),
    city: searchParams.get('city'),
    category: searchParams.get('category'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit')
  });

  if (!parseResult.success) {
    return Response.json(
      {
        error: 'Invalid query parameters',
        details: parseResult.error.issues
      },
      { status: 400 }
    );
  }

  const params = parseResult.data;

  // Continuar con búsqueda usando params validados
  // ...
}

// ============================================
// 2. SANITIZACIÓN DE DATOS (DOMPurify)
// ============================================

/**
 * Archivo: src/shared/utils/sanitize.ts
 */

/**
 * Sanitiza HTML de fuentes externas, permitiendo solo tags seguros
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
}

/**
 * Remueve TODO el HTML, solo texto plano
 */
export function stripHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitiza URL para evitar javascript: o data:
 */
export function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Solo permitir http y https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Uso en scrapers
 */

import cheerio from 'cheerio';

class LocalVenueScraper {
  async fetch(): Promise<any[]> {
    const { data: html } = await axios.get(this.config.url);
    const $ = cheerio.load(html);

    return $('.event').map((_, el) => ({
      // ✅ SANITIZAR todos los datos scrapeados
      title: stripHTML($(el).find('.title').html() || ''),
      description: sanitizeHTML($(el).find('.desc').html() || ''),
      ticketUrl: sanitizeURL($(el).find('.link').attr('href') || '') || undefined
    })).get();
  }
}

// ============================================
// 3. RATE LIMITING
// ============================================

/**
 * OPCIÓN 1: Con Redis (Upstash)
 * Archivo: src/middleware/rate-limit.ts
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 req cada 10 segundos
  analytics: true,
  prefix: 'envivo'
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  return {
    allowed: success,
    limit,
    remaining,
    reset: new Date(reset)
  };
}

/**
 * OPCIÓN 2: Sin Redis (LRU Cache en memoria)
 * Archivo: src/middleware/simple-rate-limit.ts
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new LRUCache<string, RateLimitEntry>({
  max: 500, // Máximo 500 IPs en memoria
  ttl: 60000 // 1 minuto
});

export function simpleRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = cache.get(identifier);

  if (!entry || now > entry.resetAt) {
    // Primera request o ventana expirada
    cache.set(identifier, {
      count: 1,
      resetAt: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  cache.set(identifier, entry);

  return { allowed: true, remaining: maxRequests - entry.count };
}

/**
 * Uso en API routes
 */

export async function GET_WITH_RATE_LIMIT(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  // Opción 1: Con Redis
  // const { allowed, remaining, reset } = await checkRateLimit(ip);

  // Opción 2: Sin Redis
  const { allowed, remaining } = simpleRateLimit(ip);

  if (!allowed) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: new Date(Date.now() + 60000).toISOString()
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60'
        }
      }
    );
  }

  // Continuar con request normal
  return Response.json({ data: [] }, {
    headers: {
      'X-RateLimit-Remaining': remaining.toString()
    }
  });
}

// ============================================
// 4. HEADERS DE SEGURIDAD
// ============================================

/**
 * Archivo: middleware.ts (Next.js middleware)
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js necesita unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.example.com https://www.eventbriteapi.com"
    ].join('; ')
  );

  // Otros headers de seguridad
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS (solo en producción)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// ============================================
// 5. SECRETS MANAGEMENT
// ============================================

/**
 * ❌ NUNCA HACER ESTO:
 */

// const API_KEY = 'abc123def456'; // ❌ Hardcoded
// console.log(process.env.SECRET_KEY); // ❌ Loggear secretos
// const publicKey = 'NEXT_PUBLIC_SECRET_KEY'; // ❌ Secretos en NEXT_PUBLIC_

/**
 * ✅ CORRECTO:
 * Archivo: .env.example
 */

/*
# .env.example (commit esto, sin valores reales)
DATABASE_URL="file:./dev.db"
ALLACCESS_API_KEY="tu-api-key-aqui"
EVENTBRITE_API_KEY="tu-api-key-aqui"
ADMIN_API_KEY="tu-admin-key-aqui"

# Variables públicas (expuestas al cliente)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ⚠️ NUNCA poner secretos en NEXT_PUBLIC_*
*/

/**
 * ✅ CORRECTO: Validación de env vars
 * Archivo: src/shared/infrastructure/config/env.ts
 */

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),

  // Database
  DATABASE_URL: z.string().min(1),

  // API Keys (privadas, solo server-side)
  ALLACCESS_API_KEY: z.string().optional(),
  EVENTBRITE_API_KEY: z.string().min(1),
  ADMIN_API_KEY: z.string().min(32), // Mínimo 32 caracteres

  // Públicas (expuestas al cliente)
  NEXT_PUBLIC_APP_URL: z.string().url()
});

// Validar al iniciar la app
const parseResult = EnvSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parseResult.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parseResult.data;

// ✅ USO CORRECTO (Server-side):
import { env } from '@/shared/infrastructure/config/env';
const apiKey = env.ALLACCESS_API_KEY;

// ❌ USO INCORRECTO (Client-side):
// 'use client';
// const apiKey = env.ALLACCESS_API_KEY; // undefined en cliente

// ============================================
// 6. PROTECCIÓN DE ENDPOINTS ADMIN
// ============================================

/**
 * Archivo: src/middleware/auth.ts
 */

import { headers } from 'next/headers';

export async function requireAdminAuth() {
  const headersList = headers();
  const apiKey = headersList.get('x-api-key');

  const validKey = process.env.ADMIN_API_KEY;

  if (!apiKey || apiKey !== validKey) {
    throw new Error('Unauthorized');
  }
}

/**
 * Uso en API routes administrativos
 * Archivo: app/api/scraper/sync/route.ts
 */

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
  } catch {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Ejecutar scraping
  // ...
}

// ============================================
// 7. SQL INJECTION PREVENTION
// ============================================

/**
 * ✅ SEGURO: Prisma usa prepared statements automáticamente
 */

async function searchEvents(query: string) {
  return prisma.event.findMany({
    where: {
      title: {
        contains: query  // ← Prisma sanitiza automáticamente
      }
    }
  });
}

/**
 * ❌ INSEGURO: SQL raw sin parámetros
 */

async function searchEventsUNSAFE(query: string) {
  return prisma.$queryRaw`
    SELECT * FROM Event WHERE title LIKE '%${query}%'
  `;  // ← VULNERABLE a SQL injection!
}

/**
 * ✅ SEGURO: SQL raw con parámetros
 */

async function searchEventsSAFE(query: string) {
  return prisma.$queryRaw`
    SELECT * FROM Event WHERE title LIKE ${'%' + query + '%'}
  `;  // ← Prisma sanitiza parámetros
}

// ============================================
// 8. COMMAND INJECTION PREVENTION
// ============================================

import { exec } from 'child_process';
import axios from 'axios';

/**
 * ❌ PELIGRO CRÍTICO: Command injection
 */

async function downloadImageUNSAFE(url: string) {
  // Si url = "; rm -rf /" → DESASTRE
  exec(`wget ${url}`, (error, stdout) => {
    // ...
  });
}

/**
 * ✅ SEGURO: Usar bibliotecas especializadas
 */

async function downloadImageSAFE(url: string) {
  // 1. Validar URL
  const sanitized = sanitizeURL(url);
  if (!sanitized) {
    throw new Error('Invalid URL');
  }

  // 2. Usar axios, no exec
  const response = await axios.get(sanitized, {
    responseType: 'arraybuffer',
    maxContentLength: 10 * 1024 * 1024, // 10MB max
    timeout: 30000
  });

  return response.data;
}

// ============================================
// CHECKLIST DE SEGURIDAD
// ============================================

/**
 * Pre-Deploy Security Checklist:
 *
 * - [ ] Validación Zod en todos los inputs de API
 * - [ ] Sanitización DOMPurify de datos scrapeados
 * - [ ] Rate limiting implementado
 * - [ ] Headers de seguridad configurados
 * - [ ] Secretos en .env (nunca en código)
 * - [ ] .env en .gitignore
 * - [ ] Solo usar Prisma ORM (no raw SQL sin params)
 * - [ ] React auto-escape (no dangerouslySetInnerHTML sin sanitizar)
 * - [ ] CORS solo orígenes permitidos
 * - [ ] Endpoints admin protegidos
 * - [ ] npm audit sin vulnerabilidades críticas
 * - [ ] HTTPS en producción (HSTS habilitado)
 */
