# Contexto del Proyecto para Claude Code

> **Propósito**: Proveer contexto rápido y convenciones para que Claude Code genere código consistente con la arquitectura del proyecto.

---

## 📚 Mapa de Documentación (SSOT)

**Consulta el [SSOT Registry en CONTRIBUTING.md](docs/CONTRIBUTING.md#ssot-registry-qué-va-dónde) para saber dónde está la fuente autoritativa de cada tema.**

### Enlaces Rápidos a Documentación

- **[README.md](README.md)** - Quick start, estructura del proyecto, comandos básicos
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

### ⛔ REGLA CRÍTICA: ZERO TOLERANCE PARA TESTS FALLANDO

**TODOS los tests deben pasar SIEMPRE antes de commit.**

```bash
✅ TypeScript: 0 errors (OBLIGATORIO)
✅ Tests: X/X passing (OBLIGATORIO - 100%)
✅ Lint: 0 warnings (OBLIGATORIO)
```

**NO commitear si:**
- Aunque sea 1 test falla
- Hay errores de TypeScript
- Tests están comentados/skipeados

**Ver [docs/CONTRIBUTING.md#testing-requirements](docs/CONTRIBUTING.md#testing-requirements) para detalles completos.**

### Objetivos de Cobertura

**Ver tabla completa en [docs/DEVELOPMENT.md#objetivos-de-cobertura](docs/DEVELOPMENT.md#objetivos-de-cobertura)**

- **Domain** (business rules): >80% cobertura 🔴 CRÍTICO
- **Data** (repositories/scrapers): >70%/60% 🟡 IMPORTANTE
- **UI** (componentes): >60% 🟢 DESEABLE
- **E2E** (flujos críticos): 100% happy paths 🔴 CRÍTICO

**Testing Stack**: Vitest + React Testing Library + jsdom | Playwright (E2E con BD separada)

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

### Trunk-Based Development (Durante MVP)

```bash
# Después de completar cada fase del roadmap
git add .
git commit -m "feat: [descripción de la fase]"
git push origin main
```

**Commit conventions**:
- `feat:` nueva funcionalidad
- `fix:` bug fix
- `refactor:` refactoring sin cambio funcional
- `test:` agregar/mejorar tests
- `docs:` documentación
- `chore:` cambios menores

**Ver [docs/CONTRIBUTING.md#workflow](docs/CONTRIBUTING.md#workflow) para workflow completo y criterios de decisión.**

---

## Variables de Entorno

> **Archivo a usar**: `.env.local` (desarrollo local)
> **❌ NO usar**: `.env` (para evitar confusión)

### Setup Rápido

```bash
# 1. Copiar template
cp .env.example .env.local

# 2. Generar ADMIN_API_KEY (32+ caracteres)
openssl rand -base64 32

# 3. Editar .env.local con valores reales
```

### Mínimas Requeridas

```bash
DATABASE_URL="file:./dev.db"
ADMIN_API_KEY="..." # mínimo 32 caracteres

# ⚠️ DATABASE_URL_E2E NO configurar en .env.local
# Playwright la pasa automáticamente al ejecutar tests E2E
# DATABASE_URL_E2E="file:./e2e.db"  # ← NO descomentar

# Opcionales - para futuras APIs de eventos argentinas
ALLACCESS_API_KEY="..."
EVENTBRITE_API_KEY="..."

# Públicas (expuestas al cliente)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="EnVivo"
```

**Ver [docs/DEVELOPMENT.md#variables-de-entorno](docs/DEVELOPMENT.md#variables-de-entorno) para setup completo y validación Zod.**

---

## Estrategia de Implementación

**Enfoque**: **Vertical Slices** (features end-to-end) en lugar de horizontal (capas completas)

**Ventajas**:
- ✅ Valor inmediato: algo funcional en 1-2 días
- ✅ Feedback rápido: UI con datos reales desde Fase 1
- ✅ Deploy temprano y continuo
- ✅ Commit y push después de cada fase completada

**Roadmap**: 8 fases incrementales
**Ver [docs/PRODUCT.md#roadmap-de-implementación](docs/PRODUCT.md#roadmap-de-implementación) para detalles.**

### Fases Principales

1. **Fase 0** (4-6h): Setup inicial
2. **Fase 1** (1-2 días): Fuente de datos API → BD → UI → **PRIMER VALOR** 🎉
3. **Fase 2** (1 día): Business Rules + Deduplicación
4. **Fase 3** (1-2 días): Búsqueda + Filtros
5. **Fase 4** (1 día): Orchestrator asíncrono + LivePass
6. **Fase 5** (1 día): Segunda fuente local
7. **Fase 6** (1 día): Detalle de evento completo
8. **Fase 7** (1 día): Scraping automático + Deploy
9. **Fase 8** (1 día): Tests E2E + Pulido final

---

## Workflows Comunes

> **💡 Estado actual**: El proyecto tiene la arquitectura completa de scraping (orchestrator, business rules, deduplicación) pero **sin fuentes de datos activas**. La estructura está lista para integrar APIs argentinas (AllAccess, EventBrite Argentina, LivePass).

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
  const { id } = await params;  // Await primero
  const event = await getEvent(id);
}
```

**Aplicar en**: `generateMetadata()` y componentes de página en rutas dinámicas `[id]`.

---

**Última actualización**: Noviembre 2025

---

> **Nota para Claude Code**: Este archivo debe leerse al inicio de cada sesión para contexto del proyecto. Cuando generes código, sigue las convenciones definidas aquí. Para detalles de implementación, consulta los docs especializados referenciados (todos los links apuntan al SSOT correspondiente).
