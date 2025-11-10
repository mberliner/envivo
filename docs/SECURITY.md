# Security Guidelines - EnVivo

> **Propósito**: Guía completa de seguridad del proyecto EnVivo. Single source of truth para prácticas de seguridad, vectores de ataque, y estrategias de defensa.

---

## 1. Security Best Practices

### ❌ NUNCA

- **Commit de `.env.local` con secretos** - Verificar `.gitignore` antes de cada commit (archivo debe estar ignorado)
- **Hardcodear API keys** - Usar variables de entorno exclusivamente (`.env.local`)
- **Exponer secretos en `NEXT_PUBLIC_*`** - Solo usar para valores públicos (URLs, nombres)
- **Loggear secretos** - Usar Pino `redact` para ocultar campos sensibles
- **SQL raw sin prepared statements** - Usar Prisma ORM (queries parametrizadas)
- **Ejecutar comandos con input externo** - NUNCA `exec()`, `spawn()` con datos de usuario

### ✅ SIEMPRE

- **Validar TODOS los inputs con Zod** - API endpoints, forms, query params, env vars
- **Sanitizar datos scrapeados con DOMPurify** - Antes de renderizar HTML
- **Usar Prisma ORM** - Previene SQL injection automáticamente
- **Rate limiting en endpoints públicos** - Límite: 100 requests/15min por IP
- **Headers de seguridad** - CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Redactar secretos en logs** - Configurar Pino para ocultar campos sensibles

---

## 2. Attack Vectors & Risk Classification

| Vector | Nivel Riesgo | Mitigación | Responsable |
|--------|--------------|------------|-------------|
| **SQL Injection** | 🔴 CRÍTICO | Usar Prisma ORM (queries parametrizadas). NUNCA `$queryRawUnsafe` | Backend (Repository layer) |
| **Command Injection** | 🔴 CRÍTICO | NUNCA ejecutar comandos con input externo. Validar paths | Backend (Data sources) |
| **XSS (Cross-Site Scripting)** | 🟡 MEDIO | Sanitizar con DOMPurify antes de `dangerouslySetInnerHTML` | Frontend (UI components) |
| **Rate Limiting Abuse** | 🟡 MEDIO | Limitar requests por IP (100/15min). Usar Upstash Redis o LRU cache | API Routes |
| **Secrets Exposure** | 🔴 CRÍTICO | `.env` en `.gitignore`, Pino redact, NUNCA `NEXT_PUBLIC_*` | DevOps + Backend |
| **CSRF (Cross-Site Request Forgery)** | 🟡 MEDIO | Next.js protección built-in. Validar origen en mutations | API Routes |
| **Dependency Vulnerabilities** | 🟡 MEDIO | `npm audit` en CI/CD. Actualizar deps regularmente | DevOps |

### Acciones por Nivel de Riesgo

- **🔴 CRÍTICO**: Bloqueo de deploy si no está mitigado. Tests obligatorios.
- **🟡 MEDIO**: Revisión en code review. Implementar antes de producción.
- **🟢 BAJO**: Nice to have. Evaluar según contexto.

---

## 3. Defense in Depth Strategy (6 Capas)

La seguridad se implementa en múltiples capas independientes. Si una falla, las demás protegen.

### Capa 1: Validación de Entrada
**Qué**: Validar TODOS los inputs externos antes de procesarlos.
**Cómo**:
- Zod schemas en API endpoints (`/api/events`, `/api/scraping`)
- Validar query params en búsquedas (`?q=`, `?city=`)
- Validar form inputs en cliente Y servidor
- Validar variables de entorno al inicio (`env.ts`)

**Ejemplo**:
```typescript
// src/shared/infrastructure/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  TICKETMASTER_API_KEY: z.string().min(32),
  ADMIN_API_KEY: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### Capa 2: Sanitización de Salida
**Qué**: Limpiar datos externos antes de renderizarlos.
**Cómo**:
- DOMPurify para HTML scrapeado (descripciones de eventos)
- Escapar caracteres especiales en SQL (Prisma lo hace automáticamente)
- Content Security Policy headers para bloquear scripts inline

**Ejemplo**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedDescription = DOMPurify.sanitize(event.description, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
  ALLOWED_ATTR: ['href'],
});
```

### Capa 3: Autenticación/Autorización
**Qué**: Proteger endpoints sensibles (scraping manual, admin).
**Cómo**:
- `ADMIN_API_KEY` header en endpoints `/api/admin/*`
- Verificar key en middleware de Next.js
- NO exponer endpoints admin en producción (usar Vercel Cron Jobs)

**Ejemplo**:
```typescript
// src/app/api/admin/scrape/route.ts
export async function POST(request: Request) {
  const apiKey = request.headers.get('x-admin-api-key');
  if (apiKey !== env.ADMIN_API_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... scraping logic
}
```

### Capa 4: Rate Limiting
**Qué**: Prevenir abuso y scraping masivo de nuestra API.
**Cómo**:
- Limitar búsquedas a 100 requests/15min por IP
- Usar Upstash Redis (prod) o LRU cache (dev)
- Responder con HTTP 429 Too Many Requests

**Ejemplo**:
```typescript
// src/shared/infrastructure/rate-limiting/RateLimiter.ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, number>({
  max: 500,
  ttl: 15 * 60 * 1000, // 15 minutos
});

export function checkRateLimit(ip: string): boolean {
  const count = cache.get(ip) || 0;
  if (count >= 100) return false; // Bloqueado
  cache.set(ip, count + 1);
  return true;
}
```

### Capa 5: Secrets Management
**Qué**: Proteger API keys, database URLs, tokens.
**Cómo**:
- Usar `.env.local` (NUNCA commitear)
- Variables privadas NO deben empezar con `NEXT_PUBLIC_`
- Redactar secretos en logs con Pino

**Ejemplo**:
```typescript
// src/shared/infrastructure/logging/logger.ts
import pino from 'pino';

export const logger = pino({
  redact: {
    paths: ['apiKey', 'password', 'token', '*.apiKey', 'DATABASE_URL'],
    remove: true,
  },
});
```

### Capa 6: Headers de Seguridad
**Qué**: Configurar headers HTTP para proteger el navegador.
**Cómo**:
- Content-Security-Policy (CSP): Bloquear scripts inline
- HTTP Strict-Transport-Security (HSTS): Forzar HTTPS
- X-Frame-Options: Prevenir clickjacking
- X-Content-Type-Options: Prevenir MIME sniffing

**Ejemplo** (Next.js config):
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 4. Implementation Examples

Ver `docs/examples/security-example.ts` para código completo de:
- Validación de inputs con Zod
- Sanitización de HTML con DOMPurify
- Rate limiting con LRU cache y Upstash Redis
- Middleware de autenticación
- Logging seguro con Pino

---

## 5. Pre-Launch Security Checklist

Verificar TODOS estos items antes de deploy a producción:

### Validación & Sanitización
- [ ] Validación Zod en todos los inputs de API (`/api/events`, `/api/search`, `/api/admin/*`)
- [ ] Sanitización de datos scrapeados (DOMPurify para HTML)
- [ ] Validación de variables de entorno (`env.ts` con Zod)

### Rate Limiting & Autenticación
- [ ] Rate limiting implementado en endpoints públicos (100/15min)
- [ ] `ADMIN_API_KEY` configurado (mínimo 32 caracteres)
- [ ] Endpoints admin protegidos con API key

### Secrets Management
- [ ] `.env` incluido en `.gitignore`
- [ ] No hay secretos hardcoded en código
- [ ] Variables sensibles NO usan `NEXT_PUBLIC_*`
- [ ] Logs redactan secretos (Pino `redact`)

### Headers & Dependencies
- [ ] Headers de seguridad configurados (CSP, HSTS, X-Frame-Options)
- [ ] `npm audit` sin vulnerabilidades críticas o altas
- [ ] Dependencies actualizadas (última versión estable)

### Testing
- [ ] Tests de seguridad ejecutados (SQL injection, XSS)
- [ ] Pruebas de rate limiting (verificar 429 después de límite)
- [ ] Validación de inputs testeada (inputs maliciosos rechazados)

### Monitoring
- [ ] Logs de seguridad configurados (intentos de acceso no autorizado)
- [ ] Sentry configurado para errores de seguridad (opcional)
- [ ] Alertas de `npm audit` en CI/CD

---

## 6. Common Security Pitfalls

### ❌ Anti-Patterns a Evitar

**SQL Injection via Template Strings**:
```typescript
// ❌ NUNCA
const events = await prisma.$queryRawUnsafe(`SELECT * FROM events WHERE city = '${city}'`);

// ✅ SIEMPRE
const events = await prisma.$queryRaw`SELECT * FROM events WHERE city = ${city}`;
// O mejor aún, usar Prisma query builder
const events = await prisma.event.findMany({ where: { city } });
```

**Command Injection**:
```typescript
// ❌ NUNCA
import { exec } from 'child_process';
exec(`curl ${userProvidedUrl}`); // Puede ejecutar comandos arbitrarios

// ✅ SIEMPRE
import fetch from 'node-fetch';
const response = await fetch(userProvidedUrl); // Fetch es seguro
```

**XSS via dangerouslySetInnerHTML**:
```typescript
// ❌ NUNCA
<div dangerouslySetInnerHTML={{ __html: event.description }} />

// ✅ SIEMPRE
import DOMPurify from 'isomorphic-dompurify';
const clean = DOMPurify.sanitize(event.description);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

**Secrets en Variables Públicas**:
```typescript
// ❌ NUNCA
NEXT_PUBLIC_TICKETMASTER_API_KEY=abc123 // Expuesto en cliente

// ✅ SIEMPRE
TICKETMASTER_API_KEY=abc123 // Solo en servidor
```

---

## 7. Security Resources

### Internal Documentation
- [Architecture](ARCHITECTURE.md) - Arquitectura de seguridad
- [Examples](examples/security-example.ts) - Código de implementación
- [Contributing](CONTRIBUTING.md) - Code review de seguridad

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Vulnerabilidades más comunes
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy) - CSP y headers
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection) - Prevención SQL injection
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Escaneo de vulnerabilidades

---

## 8. Incident Response

### Si Detectas una Vulnerabilidad

1. **NO la expongas públicamente** (evitar explotación)
2. **Documenta** el vector de ataque y pasos para reproducir
3. **Crea un fix** inmediatamente (prioridad máxima)
4. **Despliega hotfix** a producción (bypass proceso normal si es crítico)
5. **Revisa logs** para detectar si fue explotada
6. **Actualiza tests** para prevenir regresión
7. **Documenta post-mortem** (qué falló, cómo se previene)

### Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, repórtala via:
- Email: [TU_EMAIL] (privado)
- GitHub Issues (solo para vulnerabilidades NO CRÍTICAS)

---

**Última actualización**: Noviembre 2025

---

> **Nota**: Este documento debe revisarse antes de cada deploy a producción. Cualquier cambio en arquitectura de seguridad debe actualizarse aquí.
