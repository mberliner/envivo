# Contexto del Proyecto para Claude Code

> **Propósito**: Proveer contexto rápido y convenciones para que Claude Code genere código consistente con la arquitectura del proyecto.

---

## 📚 Mapa de Documentación (SSOT)

**Consulta el [SSOT Registry en CONTRIBUTING.md](docs/CONTRIBUTING.md#ssot-registry-qué-va-dónde) para saber dónde está la fuente autoritativa de cada tema.**

### Enlaces Rápidos a Documentación

- **[README.md](README.md)** - Quick start, estructura del proyecto, comandos básicos
- **[CHANGELOG.md](CHANGELOG.md)** - Historia de cambios del proyecto
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Clean Architecture, SOLID, scraping asíncrono, ADRs
- **[docs/PRODUCT.md](docs/PRODUCT.md)** - Features del MVP, user stories, roadmap
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Setup, testing, debugging, best practices
- **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Git workflow, SSOT registry, code review
- **[docs/SECURITY.md](docs/SECURITY.md)** - Security best practices, attack vectors
- **[docs/examples/](docs/examples/)** - Código de referencia listo para copiar

> **🚧 Deploy a Producción**: Ver [VERCEL_MIGRATION.md](VERCEL_MIGRATION.md) para guía completa de migración a Vercel + Turso. **Documento temporal** - eliminar después de completar implementación.

---

## Resumen Ejecutivo

**Proyecto**: EnVivo - Buscador de Espectáculos Musicales
**Tipo**: Proyecto personal
**Alcance MVP**: Agregador de eventos con scraping asíncrono de múltiples fuentes
**Stack**: Next.js 15 + TypeScript + Prisma + SQLite + Tailwind CSS

### Objetivos del MVP

1. Scrapear eventos de APIs (AllAccess, EventBrite Argentina, LivePass) y sitios locales
2. Búsqueda y filtrado de eventos musicales
3. Validación y deduplicación automática
4. Deploy en Vercel con scraping diario automático

**Ver [docs/PRODUCT.md](docs/PRODUCT.md) para roadmap completo.**

---

## Arquitectura

### Clean Architecture - 3 Capas

```
┌─────────────────────────────────┐
│      UI LAYER (App Router)      │
│   Server/Client Components      │
└───────────────┬─────────────────┘
                ↓ depende de
┌───────────────▼─────────────────┐
│   DOMAIN LAYER (Business Logic) │
│   Entities, Services, Rules     │
└───────────────┬─────────────────┘
                ↓ implementado por
┌───────────────▼─────────────────┐
│      DATA LAYER (I/O)           │
│   Repositories, Sources, DB     │
└─────────────────────────────────┘
```

**Regla de Oro**: Domain NO conoce Data ni UI (inversión de dependencias).

**Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para detalles completos, diagramas y ADRs.**

---

## Convenciones de Código

### Naming Conventions (Resumen)

```typescript
// Interfaces: prefijo I
interface IDataSource {}
interface IEventRepository {}

// Implementations: nombre descriptivo
class AllAccessSource implements IDataSource {}
class PrismaEventRepository implements IEventRepository {}

// Services: sufijo Service
class EventService {}

// Mappers: sufijo Mapper (métodos estáticos, NO interface)
class AllAccessMapper {
  static toRawEvent(apiEvent): RawEvent {}
}

// Business Rules: sufijo Rules
class EventBusinessRules {
  isAcceptable(event: RawEvent): boolean {}
}
```

**Ver [docs/DEVELOPMENT.md#naming-conventions](docs/DEVELOPMENT.md#naming-conventions) para tabla completa.**

### Imports

```typescript
// ✅ Usar alias @ para imports
import { Event } from '@/features/events/domain/entities/Event';
import { env } from '@/shared/infrastructure/config/env';

// ❌ NO usar relative imports profundos
// import { Event } from '../../../domain/entities/Event';
```

---

## Testing Requirements

⛔ **REGLA CRÍTICA**: TODOS los tests deben pasar antes de commit (0 errors TypeScript, 100% tests passing, 0 lint warnings).

**Ver [docs/DEVELOPMENT.md#testing](docs/DEVELOPMENT.md#testing) para stack completo, comandos y objetivos de cobertura por capa.**

---

## Architecture Validation

🏗️ **Validación Automática de Clean Architecture** implementada en 3 capas:

1. **IDE Feedback (ESLint Boundaries)**: Errores instantáneos al violar reglas de arquitectura
2. **Pre-commit Hook (Husky)**: Bloquea commits con violaciones
3. **CI Validation (Dependency Cruiser)**: Validación exhaustiva + gráfico de dependencias

**Comandos de validación:**

```bash
# Validar arquitectura (ESLint boundaries)
npm run lint:arch

# Validar dependencias (más exhaustivo)
npm run validate:deps

# Generar gráfico de arquitectura (requiere Graphviz)
npm run validate:deps:graph
```

**Reglas aplicadas automáticamente:**

- ✅ **Domain Isolation**: Domain NO puede importar de Data ni UI
- ✅ **No Circular Dependencies**: Dependencias circulares están prohibidas
- ✅ **Dependency Inversion**: Data implementa interfaces de Domain

**Ver [docs/DEVELOPMENT.md#architecture-validation](docs/DEVELOPMENT.md#architecture-validation) para guía completa, interpretación de errores y troubleshooting.**

---

## Security Considerations

### ❌ NUNCA

- Commit de `.env` con secretos
- Hardcodear API keys
- Exponer secretos en `NEXT_PUBLIC_*`
- Loggear secretos
- SQL raw sin prepared statements

### ✅ SIEMPRE

- Validar TODOS los inputs con Zod
- Sanitizar datos scrapeados con DOMPurify
- Usar Prisma ORM (previene SQL injection)
- Rate limiting en endpoints públicos
- Headers de seguridad (CSP, HSTS, X-Frame-Options)

**Ver [docs/SECURITY.md](docs/SECURITY.md) para guía completa y [docs/examples/security-example.ts](docs/examples/security-example.ts) para implementación.**

---

## Git Workflow

**Ver [docs/CONTRIBUTING.md#workflow](docs/CONTRIBUTING.md#workflow) para workflow completo, commit conventions y criterios de decisión entre trunk-based y feature branches.**

**Convención de commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`

---

## Variables de Entorno

**Ver [docs/DEVELOPMENT.md#variables-de-entorno](docs/DEVELOPMENT.md#setup-de-variables-de-entorno) para setup completo, validación Zod y lista completa de variables.**

**Mínimas requeridas** (`.env.local`):

```bash
DATABASE_URL="file:./dev.db"
ADMIN_API_KEY="..."  # 32+ caracteres (generar con: openssl rand -base64 32)
```

---

## Estrategia de Implementación

**Enfoque**: **Vertical Slices** - features end-to-end que entregan valor inmediato.

**Ver [docs/PRODUCT.md#roadmap-de-implementación](docs/PRODUCT.md#roadmap-de-implementación) para roadmap completo de 8 fases.**

---

## Workflows Comunes

> **💡 Estado actual**: Arquitectura completa con **4 fuentes activas**: Ticketmaster API, LivePass (Café Berlín), Movistar Arena y Teatro Coliseo. Sistema de scraping asíncrono, business rules y deduplicación funcionando.

### Agregar Nueva Fuente de Datos

1. Crear scraper/client en `src/features/events/data/sources/`
2. Implementar `IDataSource` (+ capacidades opcionales)
3. Crear mapper en `src/features/events/data/mappers/`
4. Registrar en orchestrator (`src/app/api/admin/scraper/sync/route.ts`)
5. Agregar API key en `.env.local` (opcional)
6. Escribir tests

**Ver [docs/examples/scraper-example.ts](docs/examples/scraper-example.ts) para implementación completa.**

### Agregar Regla de Negocio

1. Editar `config/business-rules.json`
2. Implementar validación en `EventBusinessRules.ts`
3. Llamar en método `isAcceptable()`
4. Escribir test

**Ver [docs/examples/business-rules-example.ts](docs/examples/business-rules-example.ts) para ejemplos.**

---

## Preguntas Frecuentes

**P: ¿Debo usar una interface monolítica o segregada?**
R: SIEMPRE segregada (ISP). Ver [docs/ARCHITECTURE.md#interfaces-y-extensibilidad](docs/ARCHITECTURE.md#interfaces-y-extensibilidad).

**P: ¿Dónde va la validación de eventos?**
R: En `EventBusinessRules` (capa Domain), NO en scrapers.

**P: ¿Cómo manejo errores de scrapers?**
R: `DataSourceOrchestrator` usa `Promise.allSettled()` para que un fallo no detenga los demás. Ver [docs/examples/error-handling-example.ts](docs/examples/error-handling-example.ts).

**P: ¿Puedo usar SQL raw con Prisma?**
R: Solo con `$queryRaw` y parámetros (NUNCA interpolación). Preferir query builder.

**P: ¿Dónde pongo secretos?**
R: En `.env.local` (NUNCA en código). NO usar `NEXT_PUBLIC_` para secretos.

**P: ¿Tests son obligatorios?**
R: SÍ para domain (business rules). Objetivo >80% coverage.

**P: ¿Cuándo migrar a PostgreSQL?**
R: Cuando tengas >10K eventos o necesites PostGIS. Ver ADR-003 en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**P: ¿Dónde busco información sobre [tema específico]?**
R: Consulta la [Guía de SSOT en CONTRIBUTING.md](docs/CONTRIBUTING.md#ssot-registry-qué-va-dónde) para saber dónde está la fuente autoritativa.

---

## Next.js 15 - Breaking Changes

### Async Params en Dynamic Routes

En Next.js 15, los params de rutas dinámicas son ahora **Promises** que deben ser awaiteadas:

```typescript
// ❌ Next.js 14 (viejo)
interface PageProps {
  params: { id: string };
}
export default async function Page({ params }: PageProps) {
  const event = await getEvent(params.id);
}

// ✅ Next.js 15 (correcto)
interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function Page({ params }: PageProps) {
  const { id } = await params; // Await primero
  const event = await getEvent(id);
}
```

**Aplicar en**: `generateMetadata()` y componentes de página en rutas dinámicas `[id]`.

---

**Última actualización**: Diciembre 2025

---

> **Nota para Claude Code**: Este archivo debe leerse al inicio de cada sesión para contexto del proyecto. Cuando generes código, sigue las convenciones definidas aquí. Para detalles de implementación, consulta los docs especializados referenciados (todos los links apuntan al SSOT correspondiente).
