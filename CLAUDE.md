# Contexto del Proyecto para Claude Code

> **Propósito de este archivo**: Proveer contexto rápido y convenciones del proyecto EnVivo para que Claude Code genere código consistente. Para detalles completos, ver documentación en `docs/`.

---

## Enlaces Rápidos

- **Arquitectura detallada** → `docs/ARCHITECTURE.md`
- **Product & Roadmap** → `docs/PRODUCT.md`
- **Ejemplos de código** → `docs/examples/`
- **Decisiones arquitectónicas** → `docs/BACKUP_CONCEPTS.md`
- **Estructura proyecto** → `README.md`

---

## Resumen Ejecutivo

**Proyecto**: EnVivo - Buscador de Espectáculos Musicales
**Tipo**: Proyecto personal
**Alcance MVP**: Agregador de eventos musicales con scraping asíncrono de múltiples fuentes
**Stack**: Next.js 14 + TypeScript + Prisma + SQLite + Tailwind CSS

### Objetivos del MVP
1. Scrapear eventos de APIs públicas (Ticketmaster, Eventbrite) y sitios locales
2. Ofrecer búsqueda y filtrado de eventos musicales
3. Validar y deduplicar eventos automáticamente
4. Deploy gratuito en Vercel con scraping diario automático

**Ver `docs/PRODUCT.md` para user stories detalladas y roadmap completo.**

---

## Arquitectura del Proyecto

### Clean Architecture - 3 Capas

**Regla de dependencias**: UI → Domain → Data
(Domain NO conoce Data ni UI - inversión de dependencias)

**Ver `docs/ARCHITECTURE.md` (líneas 14-48) para diagrama completo y detalles.**

### Decisiones Arquitectónicas Clave

**1. Scraping Asíncrono**
Paralelo con `Promise.allSettled()` → 5x más rápido (20s secuencial vs 4s paralelo).
**Ver**: `docs/ARCHITECTURE.md` (líneas 50-102) y `docs/examples/scraper-example.ts`

**2. Interface Segregation Principle (ISP)**
Base: `IDataSource` | Opcionales: `IHealthCheckable`, `IRateLimited`, `IValidatable`
**Ver**: `docs/ARCHITECTURE.md` (líneas 106-187)

**3. Business Rules Centralizadas**
Validación en `EventBusinessRules`. Configuración externa en JSON.
**Ver**: `docs/ARCHITECTURE.md` (líneas 189-283) y `docs/examples/business-rules-example.ts`

**4. SQLite vs PostgreSQL**
MVP: SQLite (gratuito, FTS5 integrado) | Producción: PostgreSQL si escala
**Ver**: `docs/ARCHITECTURE.md` ADR-003 (líneas 593-610) y `docs/BACKUP_CONCEPTS.md` (líneas 17-18)

---

## SOLID Principles

El proyecto cumple 100% los principios SOLID.
**Ver**: `docs/ARCHITECTURE.md` (líneas 393-448) para tabla completa con ejemplos de implementación.

---

## Convenciones de Código

### Naming Conventions

```typescript
// Interfaces: prefijo I
interface IDataSource {}
interface IEventRepository {}

// Implementations: nombre descriptivo
class TicketmasterSource implements IDataSource {}
class PrismaEventRepository implements IEventRepository {}

// Services: sufijo Service
class EventService {}
class SearchService {}

// Mappers: sufijo Mapper
class TicketmasterMapper implements IEventMapper {}

// Business Rules: sufijo Rules
class EventBusinessRules implements IEventBusinessRules {}
```

### Estructura de Carpetas

**Ver [README.md](README.md#estructura-del-proyecto) (líneas 50-87) para estructura completa del proyecto.**

Estructura resumida de `src/features/events/`:
- `domain/` - Entities, Services, Rules, Interfaces
- `data/` - Repositories, Orchestrator, Sources, Mappers
- `ui/` - Componentes React

### Imports

```typescript
// Usar alias @ para imports
import { Event } from '@/features/events/domain/entities/Event';
import { env } from '@/shared/infrastructure/config/env';

// NO usar relative imports profundos
// ❌ import { Event } from '../../../domain/entities/Event';
```

---

## Testing Requirements

### Cobertura Objetivo

| Capa | Cobertura | Prioridad |
|------|-----------|-----------|
| Domain (Business Rules) | >80% | 🔴 CRÍTICO |
| Data (Repositories) | >70% | 🟡 IMPORTANTE |
| Data (Scrapers) | >60% | 🟡 IMPORTANTE |
| UI (Componentes) | >60% | 🟢 DESEABLE |
| E2E (Flujos críticos) | 100% happy paths | 🔴 CRÍTICO |

**Testing Stack**: Vitest (unitarios) + Playwright (E2E) + React Testing Library (UI) + MSW (mocking)

**Ver `docs/examples/testing-example.ts` para ejemplos completos.**

---

## Security Considerations

### ❌ NUNCA
- Commit de `.env` con secretos
- Hardcodear API keys
- Exponer secretos en `NEXT_PUBLIC_*`
- Loggear secretos
- SQL raw sin prepared statements
- Ejecutar comandos con input externo

### ✅ SIEMPRE
- Validar TODOS los inputs con Zod
- Sanitizar datos scrapeados con DOMPurify
- Usar Prisma ORM (previene SQL injection)
- Rate limiting en endpoints públicos
- Headers de seguridad (CSP, HSTS, X-Frame-Options)
- Redactar secretos en logs (Pino `redact`)

**Ver `docs/SECURITY.md` para guía completa de seguridad y `docs/examples/security-example.ts` para implementaciones detalladas.**

---

## Workflows Comunes

### Agregar Nueva Fuente de Datos

1. Crear scraper/client en `src/features/events/data/sources/`
2. Implementar interface `IDataSource` (+ capacidades opcionales si necesita)
3. Crear mapper en `src/features/events/data/mappers/`
4. Registrar en orchestrator
5. Agregar config en `config/scrapers.json`
6. Escribir tests

**Ver `docs/examples/scraper-example.ts` para implementación completa.**

### Agregar Regla de Negocio

1. Editar `config/business-rules.json`
2. Implementar validación en `EventBusinessRules.ts`
3. Llamar en método `isAcceptable()`
4. Escribir test

**Ver `docs/examples/business-rules-example.ts` para ejemplos.**

---

## Git Workflow

### Enfoque Híbrido

**Commits directos a `main`** (para cambios menores):
- Bug fixes pequeños (<100 líneas)
- Tests nuevos
- Refactoring menor
- Docs y configs

**Feature branches + PR** (para cambios mayores):
- Features nuevas (>100 líneas)
- Cambios arquitectónicos
- Nuevas integraciones (APIs, scrapers)
- Cambios en schema de BD

```bash
# Para cambios mayores: crear feature branch
git checkout -b feature/nueva-funcionalidad

# Commits pequeños con convenciones
git commit -m "feat: add nueva funcionalidad"
git commit -m "test: add tests para nueva funcionalidad"

# Push y PR
git push origin feature/nueva-funcionalidad
```

**Commit conventions**:
- `feat:` nueva funcionalidad
- `fix:` bug fix
- `refactor:` refactoring sin cambio funcional
- `test:` agregar/mejorar tests
- `docs:` documentación
- `chore:` cambios menores (deps, config)

---

## Deploy Workflow

**CI/CD Automático** (GitHub Actions):
- En cada PR: Tests + linting + E2E
- En merge a `main`: Deploy automático a Vercel
- Diariamente (2 AM UTC): Scraping automático

**Ver `docs/examples/cicd-example.yml` para workflows completos.**

---

## Variables de Entorno

### Requeridas (Mínimas)

```bash
DATABASE_URL="file:./dev.db"
TICKETMASTER_API_KEY="..."
EVENTBRITE_API_KEY="..."  # Opcional
ADMIN_API_KEY="..." # mínimo 32 caracteres

# Públicas (expuestas al cliente)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="EnVivo"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."  # Opcional
```

**Ver `docs/examples/env-example.ts` para lista completa con validación Zod.**

---

## Estado Actual del Proyecto

### ✅ Completado
- Plan completo del proyecto
- Arquitectura definida (Clean Architecture + SOLID)
- Decisiones técnicas documentadas
- User stories y roadmap
- Testing strategy, security guidelines, CI/CD workflows

### 🚧 En Progreso
- Ninguna implementación iniciada

**Ver `docs/PRODUCT.md` (líneas 250-365) para roadmap detallado de implementación (Días 1-10).**

---

## Ejemplos de Código

Todos los ejemplos de implementación están en `docs/examples/`:

- `scraper-example.ts` - DataSourceOrchestrator, TicketmasterSource, RateLimiter
- `business-rules-example.ts` - EventBusinessRules con fuzzy matching
- `testing-example.ts` - Tests unitarios, integración, E2E completos
- `security-example.ts` - Validación Zod, sanitización, rate limiting
- `error-handling-example.ts` - AppError classes, Pino logging, Sentry
- `env-example.ts` - Validación de variables de entorno con Zod
- `cicd-example.yml` - GitHub Actions workflows (test, deploy, scraping)

**Nota**: Estos archivos contienen código funcional listo para copiar durante implementación.

---

## Preguntas Frecuentes para Claude Code

**P: ¿Debo usar una interface monolítica o segregada?**
R: SIEMPRE segregada (ISP). Ver `docs/ARCHITECTURE.md` líneas 106-187.

**P: ¿Dónde va la validación de eventos?**
R: En `EventBusinessRules` (capa Domain), NO en scrapers.

**P: ¿Cómo manejo errores de scrapers?**
R: El `DataSourceOrchestrator` usa `Promise.allSettled()` para que un scraper que falla no detenga los demás. Ver `docs/examples/error-handling-example.ts`.

**P: ¿Puedo usar SQL raw con Prisma?**
R: Solo con `$queryRaw` y parámetros (NUNCA interpolación de strings). Preferir Prisma query builder.

**P: ¿Dónde pongo secretos?**
R: En `.env.local` (NUNCA en código). Variables privadas NO deben empezar con `NEXT_PUBLIC_`.

**P: ¿Tests son obligatorios?**
R: SÍ para capa de dominio (business rules). Objetivo >80% coverage.

**P: ¿Qué herramienta de scraping usar?**
R: APIs públicas (mejor), luego Cheerio (HTML estático), finalmente Playwright (JS-heavy) solo si necesario.

**P: ¿Cuándo migrar a PostgreSQL?**
R: Cuando tengas >10K eventos o necesites búsqueda geográfica avanzada (PostGIS). Ver ADR-003.

**P: ¿Dónde busco información sobre [tema específico]?**
R: Consulta la [Guía de SSOT en CONTRIBUTING.md](docs/CONTRIBUTING.md#documentation-as-code-single-source-of-truth-ssot) para saber dónde está la fuente autoritativa de cada tema (arquitectura, testing, seguridad, desarrollo, etc.).

---

**Última actualización**: Noviembre 2025

---

> **Nota para Claude Code**: Este archivo debe leerse al inicio de cada sesión para tener contexto del proyecto. Cuando generes código, asegúrate de seguir las convenciones y arquitectura definidas aquí. Para detalles de implementación, consulta los docs especializados referenciados.
