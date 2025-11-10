# Roadmap de Implementación - EnVivo

> **Última actualización**: 10 de Noviembre de 2025 (Fase 5 COMPLETADA)
> **Branch actual**: `claude/project-overview-011CUqdqHGiRRDdpktZ4Ef7M`
> **Estrategia**: Vertical Slices (features end-to-end)

---

## 📊 Estado Actual del Proyecto

### ✅ Fase 0: Setup & Configuración - **COMPLETADA**

**Duración**: ~4 horas
**Commits**:
- `3294a55` - Initialize Next.js 14 and install core dependencies
- `9253668` - Attempt alternative Prisma configurations
- `ebd732c` - Complete Phase 0 setup and Clean Architecture structure
- `c748e9f` - Add implementation roadmap with Phase 0 completion and next steps
- `cb1cff3` - Fix Prisma schema for SQLite compatibility (JSON strings instead of arrays)
- `5a0bfca` - Add basic unit tests for Event and GlobalPreferences entities

### ✅ Fase 1: Primer Vertical Slice - "Ticketmaster → BD → UI" - **COMPLETADA**

**Duración**: ~3.5 horas
**Commits**:
- `f2a78ce` - feat(data): add TicketmasterMapper, TicketmasterSource, and PrismaEventRepository with tests
- `9929588` - feat(fase-1): complete Ticketmaster to UI vertical slice

**Tests**: 35/35 passing ✅
- 10 tests: TicketmasterMapper
- 8 tests: TicketmasterSource
- 10 tests: PrismaEventRepository
- 3 tests: Event entity
- 4 tests: GlobalPreferences entity

**TypeScript**: No compilation errors ✅

### ✅ Fase 2: Business Rules + Deduplicación - **COMPLETADA**

**Duración**: ~2 horas
**Commits**:
- `719522a` - feat: implement business rules and deduplication (Fase 2)

**Tests**: 98/98 passing ✅
- 39 tests: EventBusinessRules (validación, normalización, deduplicación)
- 24 tests: EventService (integración completa)
- 35 tests: Fase 1 (mappers, sources, repositories, entities)

**Nuevos Archivos**:
- `config/business-rules.json` - Configuración externa de reglas
- `src/features/events/domain/services/EventBusinessRules.ts` - Validación y deduplicación
- `src/features/events/domain/services/EventBusinessRules.test.ts` - 39 tests
- `src/features/events/domain/services/EventService.ts` - Orquestación de business logic
- `src/features/events/domain/services/EventService.test.ts` - 24 tests

**Funcionalidad Implementada**:
- ✅ Validación de campos requeridos (título, fecha, ciudad, país)
- ✅ Validación de rangos de fechas (pasado/futuro)
- ✅ Normalización automática (ciudad → Title Case, país → ISO-2, categorías)
- ✅ Deduplicación con fuzzy matching (>85% similaridad)
- ✅ Detección cross-source (mismo evento en Ticketmaster y Eventbrite)
- ✅ Estrategia de actualización inteligente (fuente más confiable)
- ✅ EventService para procesamiento batch con reportes detallados

**TypeScript**: No compilation errors ✅

### ✅ Fase 3: Búsqueda + Filtros - **COMPLETADA**

**Duración total**: ~4.5 horas
**Commits**:
- `9338d81` - feat(fase-3): implement SearchService with realistic fixtures
- `0026620` - feat(fase-3): implement GET /api/events with Zod validation
- `5a49482` - feat(fase-3): add composite indexes for search optimization
- `d31e5b8` - feat(fase-3): add database seed script with realistic fixtures
- `dd4a6ed` - feat(fase-3): implement frontend with search and filters

**Tests**: 152/152 passing ✅ (backend)
- 21 tests: API Route GET /api/events
- 33 tests: SearchService (búsqueda, filtros, paginación)
- 98 tests: Fases anteriores

**Backend (100%):**
- ✅ SearchService (domain layer)
  - Búsqueda por texto normalizada (case-insensitive, sin acentos)
  - Filtros combinables: ciudad, categoría, rango de fechas
  - Paginación con limit/offset
  - Autocomplete/sugerencias
  - Helper methods (ciudades/categorías disponibles)
- ✅ API Route GET /api/events
  - Validación Zod de query params
  - Integración con SearchService
  - Manejo de errores (400, 500)
  - Respuesta estructurada (events, total, hasMore, limit, offset)
- ✅ Database indexes
  - Índices compuestos: [city, date], [category, date], [city, category]
  - Índice para deduplicación: [source, externalId]
- ✅ Database seed
  - Script en `prisma/seed.ts` con 15 eventos realistas
  - Comando `npm run db:seed` configurado

**Frontend (100%):**
- ✅ SearchBar component
  - Input con debouncing (300ms)
  - Botón limpiar búsqueda
  - Ícono de búsqueda
- ✅ EventFilters component
  - Dropdowns: ciudad, categoría
  - Date pickers: desde/hasta
  - Chips de filtros activos con botón eliminar
  - Botón limpiar todos los filtros
- ✅ EventsPage component
  - Fetch a API /api/events con filtros
  - Loading state (spinner)
  - Error state
  - Empty state (con/sin filtros)
  - Grid de EventCards responsivo
- ✅ Custom Hooks
  - `useDebounce`: Debounce genérico (300ms default)
  - `useQueryParams`: Sincronización con URL query params
- ✅ HomePage actualizado
  - Server component que obtiene ciudades/categorías
  - Renderiza EventsPage con Suspense
- ✅ URL State Persistence
  - Todos los filtros sincronizados con query params
  - URLs compartibles con filtros activos
  - Navegación sin reload de página

**Fixtures Creados**:
- `/src/test/fixtures/events.fixtures.ts` - 15 eventos argentinos realistas
  - Artistas internacionales: Metallica, Coldplay, Taylor Swift, Iron Maiden, RHCP
  - Artistas nacionales: Fito Páez, Los Fabulosos Cadillacs, Divididos, Charly García
  - Festivales: Lollapalooza Argentina, Cosquín Rock
  - Teatro/Comedia: Les Luthiers, Dalia Gutmann
  - Datos reales: venues, precios ARS, múltiples ciudades

**TypeScript**: 0 errores ✅

---

## 🎯 Fase 0 - Tareas Completadas

### ✅ 1. Infraestructura Base
- [x] Next.js 14 inicializado con TypeScript
- [x] Tailwind CSS configurado
- [x] App Router habilitado
- [x] ESLint configurado
- [x] Estructura de carpetas `src/` creada

### ✅ 2. Dependencias Instaladas

**Producción**:
- [x] `prisma` + `@prisma/client` - ORM
- [x] `zod` - Validación de tipos
- [x] `axios` + `cheerio` - Scraping
- [x] `p-limit` + `p-retry` - Control de concurrencia
- [x] `string-similarity` - Deduplicación fuzzy
- [x] `@prisma/adapter-libsql` + `libsql` - SQLite adapter

**Desarrollo**:
- [x] `vitest` + `@vitest/ui` - Testing
- [x] `@testing-library/react` + `@testing-library/jest-dom` - React testing
- [x] `jsdom` - DOM environment para tests
- [x] `prettier` + `eslint-config-prettier` - Formateo
- [x] `@vitejs/plugin-react` - Vite plugin para React

### ✅ 3. Prisma Schema Configurado

**Modelos creados**:
- [x] `Event` - Eventos musicales
- [x] `Venue` - Lugares de eventos
- [x] `Artist` - Artistas
- [x] `EventArtist` - Relación many-to-many
- [x] `GlobalPreferences` - Configuración global de scraping
- [x] `VenueMetadata` - Metadata adicional de venues

**Índices configurados**:
- [x] `Event`: date, city, category, country
- [x] `Venue`: city, [name, city]

### ✅ 4. Estructura Clean Architecture

```
src/
├── features/events/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Event.ts ✅
│   │   │   ├── GlobalPreferences.ts ✅
│   │   │   ├── Event.test.ts ✅
│   │   │   └── index.ts ✅
│   │   ├── interfaces/
│   │   │   ├── IDataSource.ts ✅
│   │   │   ├── IEventRepository.ts ✅
│   │   │   ├── IPreferencesRepository.ts ✅
│   │   │   ├── IPreferenceFilter.ts ✅
│   │   │   └── index.ts ✅
│   │   ├── services/
│   │   │   ├── EventBusinessRules.ts ✅
│   │   │   └── PreferencesService.ts ✅
│   │   ├── rules/ (.gitkeep)
│   │   └── utils/
│   │       └── type-guards.ts ✅
│   ├── data/
│   │   ├── repositories/
│   │   │   ├── PrismaPreferencesRepository.ts ✅
│   │   │   └── .gitkeep
│   │   ├── sources/ (.gitkeep)
│   │   ├── mappers/ (.gitkeep)
│   │   └── orchestrator/ (.gitkeep)
│   └── ui/ (.gitkeep)
│
├── shared/
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── prisma.ts ✅
│   │   ├── config/
│   │   │   └── env.ts ✅
│   │   └── logging/ (.gitkeep)
│   └── ui/ (.gitkeep)
│
└── test/
    └── setup.ts ✅
```

### ✅ 5. Archivos de Configuración

- [x] `.env.example` - Template de variables de entorno
- [x] `.gitignore` - Actualizado (excluye .env*, *.db)
- [x] `.prettierrc` - Reglas de formateo
- [x] `.prettierignore` - Exclusiones de Prettier
- [x] `vitest.config.ts` - Configuración de tests
- [x] `tsconfig.json` - Excluye `docs/` del type checking

### ✅ 6. Scripts en package.json

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "lint:fix": "next lint --fix",
  "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "type-check": "tsc --noEmit",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "db:seed": "prisma db seed"
}
```

### ✅ 7. Tests Básicos

- [x] `Event.test.ts` - 3 tests unitarios (campos requeridos, opcionales, categorías)
- [x] `GlobalPreferences.test.ts` - 4 tests unitarios (valores default, géneros bloqueados, thresholds, arrays vacíos)
- [x] **Total: 7 tests pasando** ✅
- [x] Type check pasa ✅
- [x] Coverage: 2 archivos de tests

---

## ✅ ACCIONES MANUALES - COMPLETADAS

### ✅ Prisma Client Generado Exitosamente

El usuario ejecutó localmente los siguientes comandos:

```bash
npx prisma generate  # ✅ Completado
npx prisma db push   # ✅ Completado
```

### ✅ Verificación Completada

- [x] Archivo `dev.db` creado en la raíz del proyecto
- [x] Carpeta `node_modules/.prisma/client/` existe
- [x] `npm run type-check` pasa sin errores
- [x] `npm run test` muestra: **7 passed (7)** ✅
- [x] `npm run dev` funciona correctamente
- [x] Schema de Prisma ajustado para SQLite (JSON strings en GlobalPreferences)

### 📝 Configuración Adicional (Opcional para Fase 1)

**Obtener API Key de Ticketmaster**:
1. Ir a https://developer.ticketmaster.com/
2. Crear cuenta gratuita
3. Crear una aplicación
4. Copiar API Key
5. Agregar a `.env.local`:
   ```bash
   TICKETMASTER_API_KEY="tu-api-key-aqui"
   ```

**Generar ADMIN_API_KEY**:
```bash
# En terminal (Linux/Mac)
openssl rand -base64 32

# O en Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Agregar a .env.local
ADMIN_API_KEY="la-clave-generada-aqui"
```

---

## 🎯 Fase 1 - Tareas Completadas

### ✅ 1. Data Layer
- [x] `TicketmasterMapper` - Convierte respuesta API de Ticketmaster a RawEvent
  - Manejo de fechas (dateTime, localDate + localTime, localDate solo)
  - Mapeo de categorías (Music → Concierto/Festival, Arts → Teatro/Stand-up/Ópera/Ballet)
  - Preservación de campos adicionales en `_ticketmaster` para metadata
  - 10 tests unitarios
- [x] `TicketmasterSource` - Cliente de Ticketmaster Discovery API v2
  - Implementa `IDataSource`
  - Config: apiKey, countryCode (default: AR), classificationName (Music)
  - Manejo de errores: 401 (invalid key), 429 (rate limit), timeout
  - 8 tests con mocks de axios
- [x] `PrismaEventRepository` - Implementación de `IEventRepository`
  - `upsertMany()`: Inserta o actualiza eventos por externalId
  - `findAll()`, `findById()`, `findByFilters()`, `deleteById()`
  - Búsqueda por ciudad, país, categoría, rango de fechas, texto
  - 10 tests con Prisma mockeado

### ✅ 2. API Layer
- [x] `POST /api/admin/scraper/sync` - Endpoint de scraping manual
  - Autenticación con `x-api-key` header (valida contra `ADMIN_API_KEY`)
  - Body opcional: `{ country?, city? }`
  - Ejecuta TicketmasterSource.fetch()
  - Guarda con PrismaEventRepository.upsertMany()
  - Retorna: `{ success, source, eventsScraped, eventsSaved, timestamp }`

### ✅ 3. UI Layer
- [x] `EventCard` - Componente de tarjeta de evento
  - Diseño responsive con Tailwind CSS
  - Muestra: imagen, título, fecha, ubicación, género, precio, badge de categoría
  - Botón "Ver Entradas" con link externo
  - Formateo de fechas (es-AR) y precios (currency)
- [x] `app/page.tsx` - Home Page (Server Component)
  - Fetch de eventos con PrismaEventRepository.findAll()
  - Grid responsive (1 col mobile, 2 tablet, 3 desktop)
  - Estado vacío con instrucciones de curl
  - Header + Footer con branding

### ✅ 4. Testing & Quality
- [x] 35 tests unitarios passing
- [x] TypeScript sin errores de compilación
- [x] Mocks configurados: axios, prisma, env
- [x] Test setup actualizado para variables de entorno

### ✅ 5. Estructura de archivos creados
```
src/
├── features/events/
│   ├── data/
│   │   ├── mappers/
│   │   │   ├── TicketmasterMapper.ts ✅
│   │   │   └── TicketmasterMapper.test.ts ✅
│   │   ├── sources/ticketmaster/
│   │   │   ├── TicketmasterSource.ts ✅
│   │   │   └── TicketmasterSource.test.ts ✅
│   │   └── repositories/
│   │       ├── PrismaEventRepository.ts ✅
│   │       └── PrismaEventRepository.test.ts ✅
│   └── ui/components/
│       └── EventCard.tsx ✅
├── app/
│   ├── page.tsx ✅ (Home Page)
│   └── api/admin/scraper/sync/
│       └── route.ts ✅ (API Route)
```

### 🎉 Entregable Fase 1
**Primera feature funcionando end-to-end**: Ticketmaster → BD → UI

**Flujo completo**:
1. Usuario ejecuta curl a `/api/admin/scraper/sync`
2. Sistema obtiene eventos de Ticketmaster
3. Eventos se guardan en SQLite
4. UI muestra eventos con diseño profesional

**Próximo paso**: Ejecutar prueba manual del flujo completo (requiere TICKETMASTER_API_KEY y ADMIN_API_KEY)

---

## 🚀 Próximos Pasos - Roadmap de Fases

---

### ✅ Fase 2: Business Rules + Deduplicación - **COMPLETADA**
**Duración real**: ~2 horas
**Objetivo**: Validación centralizada y sin duplicados ✅

**Tareas completadas**:
1. [x] Implementar `EventBusinessRules` en capa Domain
   - [x] Validación de fechas (no pasadas, rango máximo)
   - [x] Validación de campos requeridos
   - [x] Validación de ubicación (países permitidos)
2. [x] Implementar deduplicación con fuzzy matching
   - [x] Usar `string-similarity` para comparar títulos
   - [x] Comparar fecha (±24h), venue, ciudad
   - [x] Threshold de similitud: 0.85
3. [x] Crear `config/business-rules.json`
4. [x] Crear `EventService` para orquestación
5. [x] Tests unitarios de business rules (39 tests - >80% coverage)
6. [x] Tests de integración EventService (24 tests)
7. [x] Tests de deduplicación con casos edge y cross-source

**Entregable**:
- ✅ Eventos inválidos rechazados con logs claros
- ✅ No hay duplicados en BD
- ✅ 98/98 tests pasando
- ✅ Desarrollo TDD completo (sin necesidad de API externa)

**Git**: ✅ `git commit -m "feat: implement business rules and deduplication (Fase 2)" && git push`

---

### Fase 3: Búsqueda + Filtros
**Duración estimada**: 1-2 días  
**Objetivo**: US1.1 (Búsqueda) y US1.2 (Filtros) completos

**Tareas pendientes**:
1. [ ] Agregar índices de búsqueda en Prisma schema
2. [ ] Crear `SearchService` en capa Domain
3. [ ] Implementar API Route `GET /api/eventos?q=...&city=...&date=...`
4. [ ] Validar query params con Zod
5. [ ] Crear componente `SearchBar` con debounce (300ms)
6. [ ] Crear componente `EventFilters`
   - [ ] Dropdown de ciudades
   - [ ] Date picker (rango de fechas)
   - [ ] Selector de categorías
7. [ ] Actualizar `EventList` para aceptar filtros
8. [ ] Persistir filtros en URL query params
9. [ ] Tests de SearchService
10. [ ] Tests de integración de API route

**Entregable**:
- ✅ Buscador funcional por texto
- ✅ Filtros combinables
- ✅ Resultados en <500ms

**Git**: `git commit -m "feat: search and filters" && git push`

---

### ✅ Fase 4: Orchestrator + Scraping Paralelo - **COMPLETADA**
**Duración real**: ~3 horas
**Objetivo**: Arquitectura lista para múltiples fuentes ✅

**Tareas completadas**:
1. [x] Crear `DataSourceOrchestrator` con `Promise.allSettled()`
2. [x] Refactorizar endpoint de scraping para usar orchestrator
3. [x] Tests unitarios con mocks de data sources (18 tests)
4. [x] Integración con EventService (validación + deduplicación automática)
5. [x] Manejo graceful de errores (un source falla, los demás continúan)

**Tareas descartadas para MVP** (se pueden agregar después si es necesario):
- [ ] Límite de concurrencia (`p-limit`) - No necesario con 1-2 sources
- [ ] Retry logic (`p-retry`) - Puede agregarse después si se necesita
- [ ] Timeout handling por fuente - Puede agregarse después
- [ ] `config/scrapers.json` - Sources configurados en código por ahora

**Archivos creados/modificados**:
```
src/features/events/data/orchestrator/
├── DataSourceOrchestrator.ts ✅ (nuevo)
└── DataSourceOrchestrator.test.ts ✅ (nuevo, 18 tests)

src/app/api/admin/scraper/sync/
└── route.ts ✅ (refactorizado para usar orchestrator)
```

**Entregable**:
- ✅ Orchestrator funciona con Ticketmaster
- ✅ EventService integrado automáticamente (validación + deduplicación)
- ✅ Promise.allSettled para ejecución paralela
- ✅ Listo para escalar a múltiples fuentes (solo registrar nuevos sources)
- ✅ 170 tests passing (152 → 170 con orchestrator)
- ✅ TypeScript: 0 errores

**Commits**:
- `42e7a47` - feat: implement DataSourceOrchestrator with async scraping (Fase 4)
- `034f737` - docs: update manual testing instructions for Fase 4
- `d2d364e` - docs: clarify commands must run in local terminal (not Claude Code)
- `5060f96` - fix: infinite loop in EventsPage caused by useEffect dependencies
- `3b35719` - fix: infinite loop in SearchBar and EventFilters useEffect
- `367ee41` - fix: remove mode:insensitive from Prisma queries (SQLite incompatible)
- `9da088e` - fix: TypeScript errors in PrismaEventRepository tests

**Testing Manual** (Opcional - Requiere API Keys):
- Ver guía completa en `TESTING_FASE4_MANUAL.md`
- Requiere: `TICKETMASTER_API_KEY` y `ADMIN_API_KEY` en `.env.local`
- Endpoint: `POST /api/admin/scraper/sync`
- Respuesta incluye métricas del orchestrator: `sources[]`, `totalEvents`, `totalProcessed`, `totalDuplicates`, etc.
- Instrucciones paso a paso para: scraping manual, verificar BD, validar deduplicación, troubleshooting

---

### ✅ Fase 5: Curación de Contenido (US3.2 - Ocultar Eventos) - **COMPLETADA**

**Duración real**: ~6 horas
**Objetivo**: Usuarios pueden ocultar eventos no deseados y evitar que regresen ✅

**Tareas completadas**:
1. [x] Crear tabla `EventBlacklist` en Prisma schema
   - [x] Campos: id, source, externalId, reason, createdAt
   - [x] Unique constraint en (source, externalId)
   - [x] Índice en (source, externalId)
2. [x] Crear migración SQL manual (workaround para Prisma client generation issue)
3. [x] Implementar API endpoint DELETE `/api/events/:id`
   - [x] Autenticación no requerida (feature pública)
   - [x] Transacción atómica: delete Event + insert EventBlacklist
   - [x] Usar raw SQL para EventBlacklist (workaround)
   - [x] Manejo de errores (evento no encontrado, sin externalId)
4. [x] Modificar `EventCard` component
   - [x] Botón eliminar (X roja) en esquina superior izquierda
   - [x] Estado de loading (isDeleting)
   - [x] Optimistic UI (desaparece inmediatamente)
   - [x] Confirmación con diálogo nativo
   - [x] Callback onDelete para actualizar lista padre
5. [x] Modificar `EventsPage` component
   - [x] Manejar callback de eliminación
   - [x] Actualizar lista de eventos filtrada
6. [x] Implementar filtrado en `EventService.processEvents()`
   - [x] Método `isBlacklisted(source, externalId)` con raw SQL
   - [x] Check antes de validación de business rules
   - [x] Incrementar contador de rejected
   - [x] Agregar error descriptivo
7. [x] Agregar endpoint `/api/admin/reset-database` para testing
8. [x] Crear scripts de debugging:
   - [x] `debug-blacklist-simple.js` - Verificar estado de blacklist
   - [x] `reset-database.js` - Limpiar BD para testing

**Bugs Resueltos**:
- 🐛 **Bug crítico en PrismaEventRepository.ts línea 125**:
  - **Problema**: Repository buscaba `_source` en Events (que tienen campo `source`)
  - **Root Cause**: EventService convierte RawEvent (con `_source`) → Event (con `source`). Repository recibía Events pero buscaba `_source`
  - **Resultado**: Todos los eventos se guardaban con `source='unknown'` y blacklist no matcheaba
  - **Fix**: Cambiar `(rawEvent as any)._source` a `rawEvent.source` en repository
  - **Commit**: `e1eaefa` - fix: use source field instead of _source in repository upsert

**Commits**:
- `d9f7ffa` - fix: convert BigInt to Number in reset-database endpoint
- `0fcf6e8` - feat: add reset database endpoint and script
- `9778a34` - debug: add temporary logging to track source field extraction
- `e1eaefa` - fix: use source field instead of _source in repository upsert (CRÍTICO)
- `2e50415` - chore: cleanup US3.2 implementation - remove debug code and docs

**Archivos Creados/Modificados**:
```
prisma/
└── schema.prisma ✅ (EventBlacklist model)

src/
├── app/api/
│   ├── events/[id]/route.ts ✅ (DELETE endpoint)
│   └── admin/reset-database/route.ts ✅ (testing)
├── features/events/
│   ├── domain/services/
│   │   └── EventService.ts ✅ (blacklist filtering)
│   ├── data/repositories/
│   │   └── PrismaEventRepository.ts ✅ (fix crítico: source field)
│   └── ui/components/
│       ├── EventCard.tsx ✅ (delete button)
│       └── EventsPage.tsx ✅ (delete callback)

scripts/
├── debug-blacklist-simple.js ✅ (mantenido para debugging)
├── reset-database.js ✅ (testing helper)
├── verify-us3.2.js ❌ (eliminado - no necesario)
└── fix-event-sources.js ❌ (eliminado - no necesario)

docs/
└── VERIFICATION_US3.2.md ❌ (eliminado - no necesario)
```

**Tests**: Tests manuales pasando ✅
- ✅ Eliminar evento desde UI (X roja)
- ✅ Evento desaparece inmediatamente (optimistic UI)
- ✅ Evento se guarda en EventBlacklist
- ✅ Evento se elimina de Event table
- ✅ Scraping posterior filtra eventos blacklisteados (Errores: 1)
- ✅ Evento eliminado NO regresa después de scraping

**TypeScript**: 0 errores ✅

**Entregable**:
- ✅ US3.2 completada y funcional
- ✅ Eventos ocultos no regresan en scrapings
- ✅ Optimistic UI para mejor UX
- ✅ Blacklist persiste correctamente por (source, externalId)

---

### Fase 6: Segunda Fuente + Detalle
**Duración estimada**: 1 día  
**Objetivo**: Validar orchestrator + US2.1 (Detalle de evento)

**Tareas pendientes**:
1. [ ] Implementar segunda fuente (Eventbrite API o scraper local)
2. [ ] Crear mapper correspondiente
3. [ ] Registrar en orchestrator
4. [ ] Verificar deduplicación entre fuentes
5. [ ] Crear página `/eventos/[id]/page.tsx`
6. [ ] Crear componente `EventDetail`
7. [ ] Link "Volver a resultados" (preserva query params)
8. [ ] Tests de nueva fuente
9. [ ] Tests E2E básicos (home → detalle)

**Entregable**:
- ✅ Scraping de 2+ fuentes en paralelo
- ✅ Página de detalle completa

**Git**: `git commit -m "feat: second data source and event detail page" && git push`

---

### Fase 6: Scraping Automático + Deploy
**Duración estimada**: 1 día  
**Objetivo**: Automatización y producción

**Tareas pendientes**:
1. [ ] Crear GitHub Action con cron (diario 2 AM UTC)
2. [ ] Implementar logging estructurado con Pino
3. [ ] Configurar redacción de secretos en logs
4. [ ] Crear `GET /api/scraper/status` endpoint
5. [ ] Deploy a Vercel
6. [ ] Configurar variables de entorno en Vercel
7. [ ] Configurar `ADMIN_API_KEY` en GitHub Secrets
8. [ ] Verificar scraping automático ejecuta
9. [ ] Tests de integración del cron job

**Entregable**:
- ✅ Scraping automático diario
- ✅ App en producción (Vercel)
- ✅ Logs estructurados

**Git**: `git commit -m "feat: automated scraping and production deployment" && git push`

---

### Fase 7: Pulido + Testing E2E
**Duración estimada**: 1 día  
**Objetivo**: MVP completo y listo para usuarios

**Tareas pendientes**:
1. [ ] Setup Playwright para E2E
2. [ ] Tests E2E de flujos críticos:
   - [ ] Búsqueda por texto
   - [ ] Aplicar filtros
   - [ ] Ver detalle de evento
   - [ ] Scraping manual (admin)
3. [ ] Implementar Error boundaries
4. [ ] Mejorar loading states (skeletons)
5. [ ] Responsive design (mobile + tablet)
6. [ ] Optimizar imágenes (Next.js Image)
7. [ ] Performance audit (Lighthouse >90)
8. [ ] Security audit (`npm audit`)
9. [ ] Verificar coverage (>80% domain, >60% total)

**Entregable**:
- ✅ MVP completo y testeado
- ✅ Lighthouse score >90
- ✅ Tests E2E pasan
- ✅ Listo para usuarios reales

**Git**: `git commit -m "feat: E2E tests and production polish" && git push`

---

## 📋 Comandos Útiles

### Desarrollo
```bash
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción
```

### Calidad de Código
```bash
npm run lint             # Ejecutar linter
npm run lint:fix         # Arreglar issues automáticamente
npm run format           # Formatear código con Prettier
npm run format:check     # Verificar formato
npm run type-check       # Validar TypeScript
```

### Testing
```bash
npm run test             # Tests en watch mode
npm run test:ui          # UI de Vitest en navegador
npm run test:coverage    # Reporte de cobertura
```

### Base de Datos
```bash
npm run db:generate      # Generar Prisma Client
npm run db:push          # Aplicar cambios al schema
npm run db:studio        # Abrir Prisma Studio (UI)
```

### Scraping Manual (después de Fase 1)
```bash
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: tu-admin-api-key"
```

---

## 🎯 Criterios de Éxito del MVP

| Criterio | Objetivo | Cómo Verificar |
|----------|----------|----------------|
| **Type Check** | Sin errores | `npm run type-check` |
| **Linter** | Sin errores | `npm run lint` |
| **Tests Unitarios** | >80% coverage (domain) | `npm run test:coverage` |
| **Tests E2E** | 100% happy paths | Playwright report |
| **Performance** | Búsqueda <500ms | Vercel Analytics |
| **Lighthouse** | >90 Performance | Chrome DevTools |
| **Build** | Exitoso | `npm run build` |
| **Datos** | >500 eventos activos | `npx prisma studio` |

---

## 🐛 Issues Conocidos

### 1. Prisma Binary Download - RESUELTO MANUALMENTE
**Problema**: Claude Code web no puede descargar binarios de Prisma (403 en binaries.prisma.sh)  
**Solución**: Usuario ejecuta `npx prisma generate` localmente  
**Estado**: ✅ Documentado en este roadmap

### 2. Deprecation Warnings
**Problema**: `string-similarity@4.0.4` está deprecated  
**Impacto**: Bajo - funciona correctamente  
**Solución futura**: Migrar a alternativa (ej: `fuzzball.js`) en Fase 2+

---

## 📚 Documentación de Referencia

- **Arquitectura completa**: `docs/ARCHITECTURE.md`
- **User Stories y épicas**: `docs/PRODUCT.md`
- **Ejemplos de código**: `docs/examples/`
- **Convenciones del proyecto**: `CLAUDE.md`
- **Estructura**: `README.md`

---

## 🤝 Git Workflow

### Durante MVP (Fases 0-7)
- Commits directos al branch `claude/project-overview-011CUqdqHGiRRDdpktZ4Ef7M`
- Commit después de cada fase completada
- Push inmediato después de commit

### Convenciones de Commits
```
feat: nueva funcionalidad (cada fase)
fix: corrección de bugs
refactor: refactoring sin cambio funcional
test: agregar/mejorar tests
docs: documentación
chore: cambios menores (deps, config)
```

### Al Finalizar MVP
1. Crear Pull Request de `claude/project-overview-011CUqdqHGiRRDdpktZ4Ef7M` → `master`
2. Code review
3. Merge a `master`
4. Borrar branch efímero
5. Continuar desarrollo directo en `master` (trunk-based)

---

## 🚀 Próxima Acción

**Fase 0**: ✅ **COMPLETADA**
**Fase 1**: ✅ **COMPLETADA**
**Fase 2**: ✅ **COMPLETADA**
**Fase 3**: ✅ **COMPLETADA**
**Fase 4**: ✅ **COMPLETADA**
**Fase 5**: ✅ **COMPLETADA**

**Progreso actual**:
- ✅ Setup completo (Prisma, TypeScript, Clean Architecture)
- ✅ Primera fuente de datos (Ticketmaster → BD → UI)
- ✅ Business Rules + Deduplicación con fuzzy matching
- ✅ Búsqueda y filtros (backend) - SearchService + API Route
- ✅ Búsqueda y filtros (frontend) - SearchBar + EventFilters + URL persistence
- ✅ Database indexes optimizados
- ✅ Database seed con 15 eventos realistas
- ✅ 170/170 tests pasando (backend)
- ✅ Custom hooks (useDebounce, useQueryParams)
- ✅ DataSourceOrchestrator con scraping paralelo (Promise.allSettled)
- ✅ US3.2: Ocultar eventos no deseados (EventBlacklist + filtrado)

**Siguiente paso**: **Iniciar Fase 6 - Segunda Fuente + Detalle**

**Fase 6 - Tareas pendientes**:
1. Implementar segunda fuente (Eventbrite API o scraper local)
2. Crear mapper correspondiente
3. Registrar en orchestrator
4. Verificar deduplicación entre fuentes
5. Crear página `/eventos/[id]/page.tsx`
6. Crear componente `EventDetail`
7. Link "Volver a resultados" (preserva query params)
8. Tests de nueva fuente
9. Tests E2E básicos (home → detalle)

**Opciones alternativas**:
- **Opción A**: Iniciar Fase 6 (Segunda fuente + Detalle)
- **Opción B**: Saltar a Fase 7 (Deploy + Scraping automático)
- **Opción C**: Agregar más fuentes locales (sitios argentinos)

---

**Estado del Proyecto**: 🟢 **FASE 5 COMPLETADA - LISTO PARA FASE 6**

**Branch**: `claude/project-overview-011CUqdqHGiRRDdpktZ4Ef7M`
**Última actualización**: 10 de Noviembre de 2025
**Tests**: 170 passed (170) ✅ (backend) + Tests manuales US3.2 ✅
**TypeScript**: 0 errores ✅
**Fases completadas**: 5/8 (Fase 0, 1, 2, 3, 4, 5)
