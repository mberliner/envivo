# Contexto del Proyecto para Claude Code

> **Propósito de este archivo**: Proveer contexto rápido y convenciones del proyecto EnVivo para que Claude Code genere código consistente. Para detalles completos, ver documentación en `docs/`.

---

## Enlaces Rápidos

- **Arquitectura detallada** → `docs/ARCHITECTURE.md`
- **Product & Roadmap** → `docs/PRODUCT.md`
- **Desarrollo y Testing** → `docs/DEVELOPMENT.md`
- **Ejemplos de código** → `docs/examples/` (ver `docs/examples/README.md` para índice)
- **Estructura proyecto** → `README.md`

---

## Mapa de Documentación del Proyecto

### 📘 Documentos de Usuario Final

#### **README.md** - Punto de Entrada
**Ubicación**: `/README.md`
**Audiencia**: Usuarios finales, nuevos desarrolladores
**Propósito**: Resumen ejecutivo del proyecto + quick start
**Contenido**:
- ¿Qué es EnVivo?
- Quick Start (instalación en 3 pasos)
- Estructura del proyecto (vista general)
- Features del MVP (qué hace, no cómo)
- Comandos básicos
- Links a documentación detallada

**Cuándo consultar**: Primera visita al proyecto, setup inicial

---

### 📗 Documentos de Producto

#### **docs/PRODUCT.md** - Roadmap y Valor de Usuario
**Ubicación**: `/docs/PRODUCT.md`
**Audiencia**: Product owners, stakeholders, desarrolladores
**Propósito**: Definir QUÉ construir y POR QUÉ (valor para usuarios)
**Contenido**:
- Features del MVP (desde perspectiva de usuario)
- Estrategia de Vertical Slices
- Épicas y User Stories (enfoque en valor)
- Roadmap de implementación (fases con valor entregado)
- Métricas de éxito
- Checklist pre-launch

**Cuándo consultar**: Planificar features, entender roadmap, escribir user stories

**⚠️ NO contiene**: Detalles técnicos, código, arquitectura, tracking de progreso

---

### 📙 Documentos Técnicos (Desarrollo)

#### **CLAUDE.md** - Contexto para IAs (Este Archivo)
**Ubicación**: `/CLAUDE.md`
**Audiencia**: Claude Code y otras IAs de desarrollo
**Propósito**: Contexto rápido + convenciones para generar código consistente
**Contenido**:
- Mapa de documentación (esta sección)
- Resumen ejecutivo del proyecto
- Arquitectura (resumen + links a detalles)
- Naming conventions
- Testing requirements (tabla resumen)
- Estrategia de implementación
- Workflows comunes
- Preguntas frecuentes

**Cuándo consultar**: Al inicio de cada sesión de IA, antes de generar código

**⚠️ NO contiene**: Detalles de implementación (ver docs específicos), tracking de progreso

---

#### **docs/ARCHITECTURE.md** - Decisiones Arquitectónicas
**Ubicación**: `/docs/ARCHITECTURE.md`
**Audiencia**: Desarrolladores, arquitectos, tech leads
**Propósito**: Documentar decisiones arquitectónicas y patrones
**Contenido**:
- Clean Architecture (3 capas, diagrama)
- Scraping asíncrono (Orchestrator, Promise.allSettled)
- Data Mappers (patrón, ejemplos)
- Interface Segregation Principle (ISP)
- Business Rules (diseño)
- Database Schema (decisiones de diseño)
- SOLID Principles (implementación en el proyecto)
- ADRs (Architecture Decision Records)
- Migración a Go (futuro)

**Cuándo consultar**: Diseñar nuevas features, entender patrones, tomar decisiones arquitectónicas

---

#### **docs/DEVELOPMENT.md** - Guías Prácticas de Desarrollo
**Ubicación**: `/docs/DEVELOPMENT.md`
**Audiencia**: Desarrolladores activos en el proyecto
**Propósito**: Guías prácticas para desarrollar y mantener el código
**Contenido**:
- Setup local (requisitos, instalación)
- TypeScript best practices (strict mode, type guards)
- React/Next.js best practices (server components, hooks)
- Comandos útiles (npm scripts, Prisma)
- Testing (stack, comandos, coverage, AAA pattern, organización)
- Estructura del proyecto (carpetas, naming conventions)
- Environment variables (setup, validación Zod)
- Database setup (Prisma + SQLite)
- Debugging (VSCode, React DevTools)
- Performance tips (lazy loading, memoization)

**Cuándo consultar**: Desarrollar features, escribir tests, configurar entorno

---

#### **docs/CONTRIBUTING.md** - Workflow y Convenciones
**Ubicación**: `/docs/CONTRIBUTING.md`
**Audiencia**: Contribuidores, nuevos desarrolladores
**Propósito**: Definir workflow de contribución y convenciones
**Contenido**:
- SSOT Registry (Single Source of Truth - qué va dónde)
- Git workflow (trunk-based híbrido)
- Testing requirements
- Commit conventions
- Pull Request process
- Code review guidelines

**Cuándo consultar**: Hacer commits, crear PRs, resolver conflictos de documentación

---

#### **docs/SECURITY.md** - Prácticas de Seguridad
**Ubicación**: `/docs/SECURITY.md`
**Audiencia**: Desarrolladores, security reviewers
**Propósito**: Guías de seguridad obligatorias
**Contenido**:
- Security best practices
- Attack vectors y defensa
- Validación de inputs (Zod)
- Sanitización (DOMPurify)
- Environment variables (secretos)
- Rate limiting
- Headers de seguridad

**Cuándo consultar**: Manejar inputs externos, configurar APIs, implementar autenticación

---

### 📔 Tracking Interno (NO Documentación)

#### **roadmap_imple.md** - Tracking de Progreso
**Ubicación**: `/roadmap_imple.md`
**Audiencia**: Equipo de desarrollo (interno)
**Propósito**: Seguimiento de avance de implementación
**Contenido**:
- Estado actual (Fase X completada)
- Commits por fase
- Tests pasando
- Checklist de tareas por fase

**Cuándo consultar**: Verificar progreso interno

**⚠️ IMPORTANTE**: Este archivo NO debe ser referenciado en documentación de usuario (README, PRODUCT, CLAUDE). Es solo para tracking interno.

---

### 🗂️ Ejemplos de Código

#### **docs/examples/** - Código de Referencia
**Ubicación**: `/docs/examples/`
**Audiencia**: Desarrolladores
**Propósito**: Ejemplos completos de implementación
**Archivos**:
- `README.md` - Índice de todos los ejemplos con descripción
- `scraper-example.ts` - DataSourceOrchestrator, TicketmasterSource
- `business-rules-example.ts` - EventBusinessRules, fuzzy matching
- `testing-example.ts` - Tests unitarios, integración, E2E
- `security-example.ts` - Validación Zod, sanitización
- `error-handling-example.ts` - AppError classes, Pino logging
- `env-example.ts` - Validación de variables de entorno
- `cicd-example.yml` - GitHub Actions workflows

**Cuándo consultar**: Implementar nuevas features, ver ejemplos concretos

**Nota**: Ver `docs/examples/README.md` para descripciones detalladas de cada archivo

---

### 📝 Notas Personales (NO Documentación Formal)

#### **MEJORAS.md**
**Ubicación**: `/MEJORAS.md`
**Tipo**: Notas personales de ideas futuras
**Contenido**: Ideas muy breves sobre mejoras generales post-MVP (10 líneas)
**Estado**: Brainstorming personal - puede actualizarse con nuevas ideas

**⚠️ IMPORTANTE**: Este archivo es una nota personal y NO debe ser referenciado en documentación formal (README, PRODUCT, ARCHITECTURE, DEVELOPMENT, CONTRIBUTING)

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
**Ver**: `docs/ARCHITECTURE.md` ADR-003

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

// Services: sufijo Service (Planificado Fase 2+)
class EventService {}
class SearchService {}

// Mappers: sufijo Mapper (métodos estáticos, sin interface)
class TicketmasterMapper {
  static toRawEvent(apiEvent): RawEvent {}
  static toRawEvents(apiEvents): RawEvent[] {}
}

// Business Rules: sufijo Rules (Planificado Fase 2)
class EventBusinessRules {
  isAcceptable(event: RawEvent): boolean {}
}
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

### ⛔ REGLA CRÍTICA: ZERO TOLERANCE PARA TESTS FALLANDO

**TODOS los tests deben pasar SIEMPRE antes de commit.**

```bash
✅ TypeScript: 0 errors (OBLIGATORIO)
✅ Tests: 152/152 passing (OBLIGATORIO)
✅ Lint: 0 warnings (OBLIGATORIO)
```

**NO commitear si:**
- Aunque sea 1 test falla
- Hay errores de TypeScript
- Tests están comentados/skipeados

**Ver [CONTRIBUTING.md#testing-requirements](docs/CONTRIBUTING.md#testing-requirements) para detalles completos.**

### Cobertura Objetivo (Metas Finales)

| Capa | Cobertura | Prioridad | Estado Actual |
|------|-----------|-----------|---------------|
| Domain (Business Rules) | >80% | 🔴 CRÍTICO | 🔴 0% (Fase 2) |
| Data (Repositories) | >70% | 🟡 IMPORTANTE | ✅ 100% (Fase 1) |
| Data (Scrapers) | >60% | 🟡 IMPORTANTE | ✅ 100% (Fase 1) |
| UI (Componentes) | >60% | 🟢 DESEABLE | 🔴 0% (Fase 3+) |
| E2E (Flujos críticos) | 100% happy paths | 🔴 CRÍTICO | 🔴 0% (Fase 7) |

**Testing Stack Actual**: Vitest (unitarios) + React Testing Library (UI)
**Planificado**: Playwright (E2E en Fase 7)

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

### Trunk-Based Development

**Durante implementación del MVP**: Commits directos a `main` después de cada fase completada.

```bash
# Después de completar cada fase del roadmap
git add .
git commit -m "feat: [descripción de la fase]"
git push origin main

# Ejemplos:
git commit -m "feat: initial setup with Next.js, Prisma, and Clean Architecture folders"
git commit -m "feat: first vertical slice - Ticketmaster to UI"
git commit -m "feat: business rules and deduplication"
```

**Commit conventions**:
- `feat:` nueva funcionalidad (cada fase del roadmap)
- `fix:` bug fix
- `refactor:` refactoring sin cambio funcional
- `test:` agregar/mejorar tests
- `docs:` documentación
- `chore:` cambios menores (deps, config)

**Post-MVP** (cuando hay usuarios en producción):
- Cambios pequeños: commit directo a `main`
- Features grandes: feature branches + PR para code review

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

## Estrategia de Implementación

**Enfoque**: **Vertical Slices** (features end-to-end) en lugar de horizontal (capas completas)

**Ventajas**:
- ✅ Valor inmediato: algo funcional en 1-2 días
- ✅ Feedback rápido: UI con datos reales desde Fase 1
- ✅ Deploy temprano y continuo (Fase 6)
- ✅ Commit y push al trunk (`main`) después de cada fase completada

**Roadmap**: Ver `docs/PRODUCT.md` (líneas 360-587) para roadmap detallado con 8 fases incrementales.

**Prioridad de Fases**:
1. **Fase 0** (4-6h): Setup inicial → `npm run dev` funciona
2. **Fase 1** (1-2 días): Ticketmaster → BD → UI → **PRIMER VALOR** 🎉
3. **Fase 2** (1 día): Business Rules + Deduplicación
4. **Fase 3** (1-2 días): Búsqueda + Filtros (US1.1, US1.2)
5. **Fase 4** (1 día): Orchestrator asíncrono
6. **Fase 5** (1 día): Segunda fuente + Detalle (US2.1)
7. **Fase 6** (1 día): Scraping automático + Deploy
8. **Fase 7** (1 día): Tests E2E + Pulido final

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
