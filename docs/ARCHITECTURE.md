# Arquitectura Técnica - EnVivo

## Tabla de Contenidos

1. [Clean Architecture](#clean-architecture)
2. [Scraping Asíncrono](#scraping-asíncrono)
3. [Data Mappers](#data-mappers)
4. [Interfaces y Extensibilidad (ISP)](#interfaces-y-extensibilidad)
5. [Business Rules](#business-rules)
6. [Database Schema](#database-schema)
7. [SOLID Principles](#solid-principles)
8. [Migración a Go (Futuro)](#migración-a-go)

---

## Clean Architecture

### Estructura de 3 Capas

```
┌──────────────────────────────────────────┐
│         UI LAYER (App Router)            │
│  • Server Components                     │
│  • API Routes                            │
│  • Client Components                     │
└───────────────┬──────────────────────────┘
                │ depende de ↓
┌───────────────▼──────────────────────────┐
│      DOMAIN LAYER (Business Logic)       │
│  • Entities (Event, Venue)               │
│  • Services (EventService)               │
│  • Business Rules                        │
│  • Interfaces (IDataSource, IRepo)       │
└───────────────┬──────────────────────────┘
                │ implementado por ↓
┌───────────────▼──────────────────────────┐
│          DATA LAYER (I/O)                │
│  • Repositories (Prisma)                 │
│  • Data Sources (Scrapers, APIs)         │
│  • Orchestrator (async coordination)     │
│  • Database access                       │
└──────────────────────────────────────────┘
```

### Regla de Oro

**Domain NO conoce Data ni UI**. Las dependencias van hacia el centro (inversión de dependencias).

---

## Scraping Asíncrono

### Problema

Scrapear 5+ fuentes secuencialmente: **~20 segundos**
```typescript
// ❌ LENTO
const t1 = await scrapeExternalAPI();  // 3s
const t2 = await scrapeLivePass();      // 3s
const t3 = await scrapeVenue1();        // 4s
// Total: 10+ segundos
```

### Solución

Scraping paralelo: **~4 segundos** (tiempo del más lento)
```typescript
// ✅ RÁPIDO
const results = await Promise.allSettled([
  scrapeExternalAPI(),
  scrapeLivePass(),
  scrapeVenue1()
]);
// Total: ~4 segundos
```

### DataSourceOrchestrator

**Responsabilidades:**
1. Registrar múltiples fuentes de datos (APIs, scrapers, archivos)
2. Ejecutarlas en paralelo con límite de concurrencia (`p-limit`)
3. Reintentar fallos con exponential backoff (`p-retry`)
4. Aplicar timeouts configurables
5. Agregar resultados (éxitos/fallos)

**API:**
```typescript
const orchestrator = new DataSourceOrchestrator();

orchestrator.register(new ExternalApiSource());
orchestrator.register(new LivePassSource());
orchestrator.register(new LocalVenueScraper());

const result = await orchestrator.fetchAll({
  concurrency: 5,  // máximo 5 simultáneos
  retries: 3,
  timeout: 15000
});

console.log(result.successful, result.failed, result.totalEvents);
```

**Ver código completo**: `docs/examples/scraper-example.ts`

---

## Data Mappers

### Responsabilidad

Los **mappers** transforman datos entre capas sin lógica de negocio:
- **API → Domain**: De formato externo (API externa) a entidades del dominio
- **Domain → DTO**: De entidades a objetos de transferencia (si necesario)

### Patrón de Implementación

**❌ NO usar interfaces para mappers** (no hay polimorfismo necesario):

```typescript
// ❌ Malo: Interface innecesaria
interface IExternalApiMapper {
  toRawEvent(apiEvent: ExternalApiEvent): RawEvent;
}

class ExternalApiMapper implements IExternalApiMapper {
  toRawEvent(apiEvent: ExternalApiEvent): RawEvent { }
}
```

**✅ Usar métodos estáticos** (mappers son funciones puras):

```typescript
// ✅ Bueno: Métodos estáticos sin interface
class ExternalApiMapper {
  static toRawEvent(apiEvent: ExternalApiEvent): RawEvent {
    return {
      id: apiEvent.id,
      title: apiEvent.name,
      date: new Date(apiEvent.dates.start.dateTime),
      venue: apiEvent._embedded.venues[0]?.name || 'Unknown',
      city: apiEvent._embedded.venues[0]?.city.name || 'Unknown',
      country: apiEvent._embedded.venues[0]?.country.countryCode || 'AR',
      imageUrl: apiEvent.images?.[0]?.url || null,
      ticketUrl: apiEvent.url,
      source: 'external_api'
    };
  }

  static toRawEvents(apiEvents: ExternalApiEvent[]): RawEvent[] {
    return apiEvents.map(event => this.toRawEvent(event));
  }
}
```

### Uso

```typescript
// En ExternalApiSource
async fetch(): Promise<RawEvent[]> {
  const apiResponse = await this.fetchFromAPI();
  const apiEvents = apiResponse._embedded?.events || [];

  // Llamar método estático directamente
  return ExternalApiMapper.toRawEvents(apiEvents);
}
```

### Naming Convention

- **Clase**: `{Source}Mapper` (ej: `ExternalApiMapper`, `LivePassMapper`)
- **Métodos**: `toRawEvent()`, `toRawEvents()`, `toDTO()`, etc.
- **Sin interfaces**: Los mappers son funciones puras, no hay necesidad de polimorfismo

**Ver implementación completa**: `src/features/events/data/mappers/ExternalApiMapper.ts`

**Ver tests**: `tests/unit/data/mappers/ExternalApiMapper.test.ts`

---

## Interfaces y Extensibilidad

### Interface Segregation Principle (ISP)

**Problema identificado**: Una interface monolítica `IDataSource` obligaba a implementar métodos innecesarios.

**Solución**: Interfaces pequeñas + composición

```typescript
// Base interface - TODOS implementan
interface IDataSource {
  name: string;
  type: 'api' | 'scraper' | 'file';
  fetch(): Promise<RawEvent[]>;
}

// Capacidades opcionales - SOLO quien las necesita
interface IHealthCheckable {
  healthCheck(): Promise<HealthCheckResult>;
}

interface IRateLimited {
  canFetch(): boolean;
  maxRequestsPerSecond: number;
}

interface IValidatable {
  validate(event: RawEvent): boolean;
}

interface IToggleable {
  enabled: boolean;
  enable(): void;
  disable(): void;
}

interface IConfigurable<T> {
  configure(config: T): void;
  getConfig(): T;
}
```

### Composición

```typescript
// API externa: implementa TODAS las capacidades
class ExternalApiSource implements
  IDataSource,
  IHealthCheckable,
  IRateLimited,
  IValidatable,
  IToggleable { }

// Scraper local: solo lo necesario
class LocalVenueScraper implements
  IDataSource,
  IValidatable,
  IConfigurable { }

// Archivo local: MÍNIMO
class LocalFileSource implements IDataSource { }
```

### Type Guards

```typescript
function isHealthCheckable(source: IDataSource):
  source is IDataSource & IHealthCheckable {
  return 'healthCheck' in source;
}

// Uso en orchestrator
if (isHealthCheckable(source)) {
  const health = await source.healthCheck();
}
```

**Beneficios**:
- Clases más simples (sin métodos vacíos forzados)
- Fácil de testear (mocks simples)
- Extensible (agregar capacidades sin romper código existente)

---

## Business Rules

### Problema

Validar eventos (fechas, ubicación, duplicados) en cada scraper → duplicación de código.

### Solución

Clase centralizada `EventBusinessRules` en la capa Domain.

```typescript
interface IEventBusinessRules {
  isAcceptable(event: Event): ValidationResult;
  isDuplicate(incoming: Event, existing: Event): boolean;
  shouldUpdate(incoming: Event, existing: Event): boolean;
  normalize(event: Event): Event;
}
```

### Reglas Configurables

**Archivo**: `config/business-rules.json`

```json
{
  "dateRules": {
    "minDaysInFuture": -1,
    "maxDaysInFuture": 365,
    "allowPastEvents": true
  },
  "locationRules": {
    "allowedCountries": ["AR", "UY", "CL", "BR"],
    "requiredLocation": true
  },
  "contentRules": {
    "minTitleLength": 3,
    "requiredFields": ["title", "date", "venue"],
    "allowedCategories": ["Concierto", "Festival", "Teatro"],
    "blockedGenres": []
  },
  "duplicateRules": {
    "matchFields": ["title", "date", "venue"],
    "fuzzyMatchThreshold": 0.85,
    "dateToleranceHours": 24
  }
}
```

### Flujo de Datos

```
DataSource.fetch()
  ↓
Mapper.toEvent()
  ↓
BusinessRules.normalize()  ← Normalizar ciudad, país, categoría
  ↓
BusinessRules.isAcceptable()  ← Validar fechas, ubicación, campos
  ↓
BusinessRules.isDuplicate()  ← Fuzzy matching
  ↓
Repository.upsert()  ← Guardar en BD
```

### Detección de Duplicados

**Estrategia**: Fuzzy matching con `string-similarity`

```typescript
isDuplicate(incoming: Event, existing: Event): boolean {
  // 1. Fecha similar (tolerancia 24 horas)
  const hoursDiff = differenceInHours(incoming.date, existing.date);
  if (hoursDiff > 24) return false;

  // 2. Título similar (threshold 0.85)
  const similarity = compareTwoStrings(
    incoming.title.toLowerCase(),
    existing.title.toLowerCase()
  );
  if (similarity < 0.85) return false;

  // 3. Venue similar
  const venueSimilarity = compareTwoStrings(
    incoming.venue || '',
    existing.venue || ''
  );
  if (venueSimilarity < 0.8) return false;

  return true;  // Es duplicado
}
```

**Ver código completo**: `docs/examples/business-rules-example.ts`

---

## Preferencias Globales (Global Preferences)

### Contexto

El MVP incluye un sistema de **preferencias globales** que permite configurar filtros aplicados durante el proceso de scraping. Esto optimiza el uso de recursos al guardar solo eventos relevantes según la configuración del administrador.

### Arquitectura

```
┌──────────────────────────┐
│   Admin UI               │
│   /admin/preferences     │
│   (formulario config)    │
└────────────┬─────────────┘
             │
             ↓
┌────────────────────────────┐
│   PreferencesService       │   (capa Domain)
│   • Cache (5 min TTL)      │
│   • shouldAcceptEvent()    │
│   • calculateVenueSize()   │
└────────────┬───────────────┘
             │
             ↓
┌──────────────────────────────┐
│   PrismaPreferencesRepo      │   (capa Data)
│   • tabla: global_preferences│
│   • Singleton pattern        │
└──────────────────────────────┘
```

### Flujo de Aplicación de Filtros

Las preferencias se aplican en **dos momentos**:

#### 1. Pre-Scraping (Filtrado Temprano)

```
DataSourceOrchestrator.fetchAll()
  ↓
Lee GlobalPreferences (con caché)
  ↓
Inyecta preferencias a DataSources que implementan IPreferenceFilter
  ↓
DataSource.applyPreferences()
  ↓
DataSource.fetch() → retorna solo eventos que cumplen filtros
```

**Ventajas**:
- Menos datos scrapeados (ahorro de ancho de banda)
- Menor carga en APIs externas
- Optimización temprana

#### 2. Post-Scraping (Validación Doble)

```
Event (scrapeado)
  ↓
EventBusinessRules.isAcceptable()
  ↓
PreferencesService.shouldAcceptEvent()
  ↓
Valida: país, ciudad, género, categoría, capacidad de venue
  ↓
Si no cumple → Rechazar con razón
Si cumple → Continuar pipeline
  ↓
Repository.upsert()
```

**Ventajas**:
- Seguridad adicional (doble validación)
- Garantiza que NINGÚN evento indeseado se guarda
- Logs detallados de rechazos

### Configuración Disponible

```typescript
interface GlobalPreferences {
  // Ubicación
  allowedCountries: string[];  // ["AR", "UY", "CL"]
  allowedCities: string[];     // ["Buenos Aires", "Montevideo"]

  // Géneros musicales
  allowedGenres: string[];     // ["Rock", "Pop", "Jazz"]
  blockedGenres: string[];     // ["Trap"] - lista negra

  // Categorías de eventos
  allowedCategories: string[]; // ["Concierto", "Festival"]

  // Capacidad de venues
  allowedVenueSizes: VenueSize[];        // ["small", "medium"]
  venueSizeThresholds: {                 // Umbrales configurables
    small: 500,
    medium: 2000,
    large: 5000
  };

  // Control
  needsRescraping: boolean;   // Si cambió config
  updatedAt: Date;
}
```

### Capacidad de Venue

**Clasificación automática** según capacidad:

| Tamaño | Capacidad | Ejemplos |
|--------|-----------|----------|
| **Small** | < 500 personas | Bares, clubs pequeños, teatros íntimos |
| **Medium** | 500 - 2000 | Teatros medianos, salones de eventos |
| **Large** | > 2000 | Estadios, arenas, festivales |

**Umbrales configurables** desde UI admin.

**Manejo de venues sin capacidad**:
- Si `event.venueCapacity == null` → NO se aplica filtro de tamaño
- Fallback gracioso: no rechaza eventos por falta de datos

### Enrichment de Venues (Opcional)

Para venues sin capacidad conocida, se puede implementar un `VenueEnrichmentService`:

```typescript
class VenueEnrichmentService {
  async enrichVenue(venueName: string, city: string): Promise<number | null> {
    // 1. Buscar en cache local (tabla VenueMetadata)
    const cached = await this.venueRepo.findByName(venueName, city);
    if (cached) return cached.capacity;

    // 2. Buscar en API externa (Google Places, Foursquare)
    const capacity = await this.fetchFromExternalAPI(venueName, city);

    // 3. Guardar en cache para futuras consultas
    if (capacity) {
      await this.venueRepo.upsert({ name: venueName, city, capacity });
    }

    return capacity;
  }
}
```

**Tabla auxiliar** (ya incluida en schema):

```prisma
model VenueMetadata {
  id       String   @id @default(cuid())
  name     String
  city     String
  country  String
  capacity Int?
  source   String   // "manual", "api", "estimated"
  verified Boolean  @default(false)

  @@unique([name, city, country])
}
```

### Caché de Preferencias

**Estrategia**: Cache en memoria con TTL de 5 minutos

**Razones**:
- Las preferencias cambian raramente
- Evita múltiples queries a BD durante scraping
- Invalidación manual al actualizar

**Implementación** en `PreferencesService`:

```typescript
private cache: GlobalPreferences | null = null;
private cacheExpiry: Date | null = null;
private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async getActivePreferences(): Promise<GlobalPreferences> {
  if (this.cache && this.cacheExpiry && new Date() < this.cacheExpiry) {
    return this.cache; // Cache hit
  }

  this.cache = await this.repository.get();
  this.cacheExpiry = new Date(Date.now() + this.CACHE_TTL_MS);

  return this.cache;
}
```

### Re-scraping Workflow

Cuando se actualizan preferencias:

```
Admin cambia preferencias
  ↓
PreferencesService.updatePreferences()
  ↓
Marca needsRescraping = true
  ↓
Invalidar caché
  ↓
Admin ejecuta: POST /api/admin/scraper/sync?applyNewPreferences=true
  ↓
DataSourceOrchestrator lee nuevas preferencias
  ↓
Scrapea SOLO eventos que cumplen nuevos filtros
  ↓
Marca needsRescraping = false
  ↓
Retorna resumen: {
  totalScraped: 500,
  accepted: 350,
  rejectedByPreferences: 150,
  reasons: { "País no permitido": 80, "Género bloqueado": 70 }
}
```

**Tiempo estimado de re-scraping**: 4-5 minutos (según número de fuentes)

### Interface Segregation (ISP)

**Nueva capacidad opcional**: `IPreferenceFilter`

```typescript
interface IPreferenceFilter {
  supportsPrefiltering: boolean;
  applyPreferences(preferences: GlobalPreferences): void;
}

// DataSource que soporta pre-filtrado
class ExternalApiSource implements IDataSource, IPreferenceFilter {
  supportsPrefiltering = true;
  private filters: GlobalPreferences | null = null;

  applyPreferences(preferences: GlobalPreferences) {
    this.filters = preferences;
  }

  async fetch() {
    // Usar this.filters para optimizar query a API externa
    const params = {
      countryCode: this.filters?.allowedCountries.join(','),
      // ...
    };
    return await this.api.getEvents(params);
  }
}

// DataSource que NO soporta pre-filtrado (scraper simple)
class LocalVenueScraper implements IDataSource {
  // No implementa IPreferenceFilter
  // El orchestrator no le inyectará preferencias
}
```

### Type Guard

```typescript
function isPreferenceFilterable(source: IDataSource):
  source is IDataSource & IPreferenceFilter {
  return 'supportsPrefiltering' in source &&
         typeof source.applyPreferences === 'function';
}

// Uso en orchestrator
if (isPreferenceFilterable(source)) {
  source.applyPreferences(preferences);
}
```

### Validación de Preferencias

**Reglas mínimas** (validadas en UI y API):

1. **Al menos 1 país** debe estar seleccionado
2. Si `allowedCities.length > 0`, debe haber al menos 1 país compatible
3. Los umbrales de venue deben cumplir: `small < medium < large`
4. No puede haber géneros en ambas listas (allowed y blocked)

### Limitaciones y Trade-offs

| Aspecto | Limitación | Mitigación |
|---------|------------|-----------|
| **Cambiar preferencias es lento** | Requiere re-scraping (4-5 min) | Botón "Guardar" sin re-scraping + scraping programado diario |
| **No personalizado por usuario** | Preferencias globales para todos | Si se necesita multi-usuario en futuro, migrar a tabla `UserPreferences` con FK |
| **Venues sin capacidad conocida** | No se pueden filtrar por tamaño | VenueEnrichmentService + tabla VenueMetadata + fallback gracioso |
| **Cache puede desincronizarse** | TTL de 5 minutos | Invalidación manual al actualizar + TTL corto |

### Migración Futura a Preferencias por Usuario

Si en Fase 2+ se necesita autenticación y preferencias personalizadas:

**Cambios necesarios**:

1. Crear tabla `UserPreferences` con FK a `User`
2. Modificar `PreferencesService` para aceptar `userId`
3. Caché por usuario (ej: Redis con key `prefs:${userId}`)
4. Scraping global sigue usando `GlobalPreferences` (union de todas las preferencias de usuarios activos)

**Ventaja**: La arquitectura actual ya soporta esto (inversión de dependencias)

---

## Database Schema

### Prisma Schema (SQLite MVP)

```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?
  date        DateTime
  endDate     DateTime?

  // Ubicación
  venueId     String?
  venue       Venue?   @relation(fields: [venueId], references: [id])
  city        String
  country     String

  // Categorización
  category    String   // "Concierto", "Festival"
  genre       String?  // "Rock", "Pop"

  // Artistas (relación many-to-many)
  artists     EventArtist[]

  // Información adicional
  imageUrl    String?
  ticketUrl   String?
  price       Float?
  priceMax    Float?
  currency    String   @default("ARS")

  // Metadatos
  source      String   // "allaccess", "eventbrite", "scraper_local"
  externalId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([date])
  @@index([city])
  @@index([category])
  @@fulltext([title, description])  // FTS5
}

model Venue {
  id        String   @id @default(cuid())
  name      String
  address   String?
  city      String
  country   String
  latitude  Float?
  longitude Float?
  capacity  Int?
  events    Event[]

  @@index([city])
}

model Artist {
  id        String   @id @default(cuid())
  name      String   @unique
  genre     String?
  imageUrl  String?
  events    EventArtist[]
}

model EventArtist {
  eventId   String
  artistId  String
  event     Event   @relation(fields: [eventId], references: [id])
  artist    Artist  @relation(fields: [artistId], references: [id])

  @@id([eventId, artistId])
}
```

### Full-Text Search (FTS5)

SQLite FTS5 permite búsqueda eficiente en `title` y `description`.

```typescript
// Búsqueda con Prisma
const events = await prisma.event.findMany({
  where: {
    OR: [
      { title: { search: 'Metallica' } },
      { description: { search: 'Metallica' } }
    ]
  }
});
```

### Migración a PostgreSQL (Futuro)

**Cambios necesarios**:
1. `datasource db` en schema.prisma: `postgresql`
2. DATABASE_URL: string de conexión PostgreSQL
3. `npx prisma migrate dev`
4. Migrar datos: script de export/import o `pgloader`

**Ventajas PostgreSQL**:
- PostGIS para búsqueda geográfica avanzada
- Mejor para alta concurrencia (>1000 req/s)
- JSON columns más eficientes

---

## SOLID Principles

### Cumplimiento 100%

| Principio | Implementación | Ejemplo |
|-----------|----------------|---------|
| **S**ingle Responsibility | Cada clase una responsabilidad | `ExternalApiSource` solo obtiene datos<br>`ExternalApiMapper` solo mapea<br>`EventRepository` solo persiste |
| **O**pen/Closed | Extensible sin modificación | Agregar nueva fuente implementando `IDataSource`<br>Sin tocar `DataSourceOrchestrator` |
| **L**iskov Substitution | Subtipos intercambiables | Cualquier `IDataSource` funciona en orchestrator<br>`ExternalApiSource`, `LocalFileSource`, etc. |
| **I**nterface Segregation | Interfaces pequeñas | `IDataSource` (base)<br>`IHealthCheckable`, `IRateLimited` (opcionales) |
| **D**ependency Inversion | Depender de abstracciones | `EventService` depende de `IEventRepository`<br>No de `PrismaEventRepository` |

### Single Responsibility - Ejemplo

```typescript
// ✅ BIEN: Cada clase una responsabilidad
class ExternalApiSource {
  async fetch() { /* obtener datos */ }
}

class ExternalApiMapper {
  toEvent(data) { /* transformar datos */ }
}

class EventRepository {
  async save(events) { /* persistir datos */ }
}

// ❌ MAL: Clase con múltiples responsabilidades
class ExternalApiService {
  async fetch() { }      // Obtener
  transform() { }        // Transformar
  save() { }             // Guardar
  schedule() { }         // Programar
}
```

### Open/Closed - Ejemplo

```typescript
// Interface estable (cerrada para modificación)
interface IDataSource {
  fetch(): Promise<RawEvent[]>;
}

// Extensión: Nueva fuente (abierto para extensión)
class SpotifySource implements IDataSource {
  async fetch() { /* nueva implementación */ }
}

// Orchestrator NO cambia cuando agregas fuentes
const orchestrator = new DataSourceOrchestrator();
orchestrator.register(new SpotifySource());  // ✅ Sin modificar código existente
```

---

## Migración a Go (Futuro Opcional)

### ¿Cuándo Migrar?

**Indicadores**:
- Más de 20 fuentes de datos para scrapear
- Scraping Node.js toma >2 minutos
- Costos de infraestructura altos
- Proyecto validado y en crecimiento

### Arquitectura Híbrida

```
┌──────────────┐         ┌────────────────┐
│   Next.js    │         │  Go Scraper    │
│   (Vercel)   │         │  (GitHub       │
│              │         │   Actions)     │
│ • Frontend   │         │                │
│ • API Routes │         │ • Scraping     │
│ • Search     │         │ • 50+ sources  │
└──────┬───────┘         │ • 2-5x faster  │
       │                 └───────┬────────┘
       │                         │
       └─────────┬───────────────┘
                 ↓
         ┌──────────────┐
         │ PostgreSQL   │
         │ (Supabase)   │
         └──────────────┘
```

**Comunicación**: Base de datos compartida (sin HTTP entre servicios)

### Ventajas vs Desventajas

| Aspecto | Node.js (MVP) | Go (Producción) |
|---------|---------------|-----------------|
| **Velocidad** | Baseline | 2-5x más rápido |
| **Memoria** | 450MB (10 sources) | 85MB |
| **Concurrencia** | ~50 paralelos | 10,000+ goroutines |
| **Desarrollo** | Rápido (mismo lenguaje) | Media curva |
| **Deploy** | Vercel (integrado) | Separado (GitHub Actions) |
| **Costo** | $0-20/mo | $0-5/mo |
| **Mantenimiento** | 1 codebase | 2 codebases |

**Recomendación**:
- **MVP (Días 1-10)**: Node.js async
- **Post-MVP (Mes 2+)**: Migrar a Go si >20 fuentes o >2min scraping

**Ver detalles**: Sección "Guía de Migración a Go" en PLAN_PROYECTO.md (líneas 2257-2575)

---

## Patrones de Diseño Utilizados

### Factory Pattern

```typescript
class ScraperFactory {
  static create(config: SourceConfig): IDataSource {
    switch (config.type) {
      case 'external_api':
        return new ExternalApiSource(config);
      case 'local-venue':
        return new LocalVenueScraper(config);
      default:
        throw new Error(`Unknown type: ${config.type}`);
    }
  }
}
```

### Strategy Pattern

```typescript
// Estrategia de parsing: Cheerio vs Playwright
interface IHTMLParser {
  parse(url: string, selectors: any): Promise<RawEvent[]>;
}

class CheerioStrategy implements IHTMLParser { }
class PlaywrightStrategy implements IHTMLParser { }

// Scraper usa estrategia
class LocalVenueScraper {
  constructor(private parser: IHTMLParser) {}
}
```

### Repository Pattern

```typescript
interface IEventRepository {
  findAll(): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  search(query: SearchParams): Promise<Event[]>;
  upsertMany(events: Event[]): Promise<number>;
}

class PrismaEventRepository implements IEventRepository {
  // Implementación con Prisma
}
```

---

## Decisiones Arquitectónicas (ADRs)

### ADR-001: Clean Architecture

**Contexto**: Proyecto personal pero con potencial de escalar.

**Decisión**: Implementar Clean Architecture con 3 capas (UI, Domain, Data).

**Consecuencias**:
- ✅ Código testeable (mocking fácil)
- ✅ Fácil cambiar tecnologías (DB, framework)
- ✅ Lógica de negocio independiente
- ❌ Más archivos y carpetas (overhead inicial)

**Estado**: Aceptada

---

### ADR-002: Scraping Asíncrono con Promise.allSettled

**Contexto**: Necesidad de scrapear 5+ fuentes en tiempo razonable.

**Decisión**: Usar `Promise.allSettled()` con `p-limit` para scraping paralelo.

**Alternativas consideradas**:
- Secuencial: Muy lento (~20s para 5 fuentes)
- Promise.all: Un fallo rompe todo
- Bull queues: Overkill para proyecto simple

**Consecuencias**:
- ✅ 5x más rápido que secuencial
- ✅ Fallos aislados (un scraper no afecta otros)
- ✅ Control de concurrencia
- ❌ Más complejo que secuencial

**Estado**: Aceptada

---

### ADR-003: SQLite para MVP, PostgreSQL para Producción

**Contexto**: Necesidad de base de datos para MVP con presupuesto mínimo.

**Decisión**: SQLite para MVP, migrar a PostgreSQL si escala.

**Consecuencias**:
- ✅ Costo $0 (SQLite sin servidor)
- ✅ FTS5 integrado para búsqueda
- ✅ Perfecto para lecturas intensivas
- ✅ Prisma abstrae la diferencia
- ❌ No soporta alta concurrencia (pero OK para MVP)
- ❌ Sin búsqueda geográfica avanzada (PostGIS)

**Estado**: Aceptada

---

## ADR-004: Logging Strategy

**Fecha**: Enero 2025

**Contexto**: Necesidad de logs estructurados para debugging y monitoring en producción.

**Decisión**: Implementar logging estructurado con Pino con niveles apropiados por entorno.

### Niveles de Logging

| Nivel | Cuándo Usar | Ejemplo | Producción |
|-------|-------------|---------|------------|
| **ERROR** | Errores que rompen funcionalidad | API externa no responde, BD caída | ✅ Sí |
| **WARN** | Situaciones anormales recuperables | Scraper falla pero otros continúan | ✅ Sí |
| **INFO** | Eventos importantes del sistema | Scraping completado, evento guardado | ✅ Sí |
| **DEBUG** | Información detallada para debugging | SQL queries, response bodies | ❌ No (solo dev) |

**Configuración por Entorno**:
- **Development**: DEBUG + INFO + WARN + ERROR (todos los niveles)
- **Production**: INFO + WARN + ERROR (sin DEBUG por performance)

**Redacción de Secretos**:
```typescript
import pino from 'pino';

export const logger = pino({
  redact: {
    paths: ['apiKey', 'password', 'token', '*.apiKey', 'DATABASE_URL'],
    remove: true,
  },
});
```

**Consecuencias**:
- ✅ Logs estructurados en JSON (fácil parsing)
- ✅ Redacción automática de secretos
- ✅ Performance superior a console.log
- ✅ Integración con Vercel Logs y Sentry

**Estado**: Aceptada

---

## ADR-005: Migration Path Node.js → Go (Futuro)

**Fecha**: Enero 2025

**Contexto**: A medida que el proyecto escale (>20 fuentes, >10K eventos/día), Node.js puede volverse un cuello de botella en scraping.

**Decisión**: Mantener Next.js para frontend/API, migrar scraping a Go solo cuando sea necesario.

### Comparativa Técnica

| Aspecto | Node.js (MVP) | Go (Producción) |
|---------|---------------|-----------------|
| **Velocidad scraping** | Baseline | 2-5x más rápido |
| **Memoria** | 450MB (10 fuentes) | 85MB (mismo workload) |
| **Concurrencia** | ~50 requests paralelos | 10,000+ goroutines |
| **Desarrollo** | Rápido (mismo lenguaje que frontend) | Curva de aprendizaje media |
| **Deploy** | Vercel integrado | GitHub Actions → Fly.io/Railway |
| **Costo mensual** | $0-20 (Vercel) | $0-5 (Fly.io free tier) |
| **Mantenimiento** | 1 codebase (TypeScript) | 2 codebases (TS + Go) |

### Indicadores para Migrar a Go

Migrar **solo si se cumplen 3+ de estos criterios**:

- ✅ Más de **20 fuentes de datos** activas
- ✅ Scraping Node.js toma **>2 minutos** regularmente
- ✅ Costos de infraestructura **>$20/mes**
- ✅ Proyecto **validado** con usuarios activos y en crecimiento
- ✅ Equipo tiene **capacidad** de mantener 2 codebases

### Arquitectura Híbrida (cuando migre)

```
┌────────────────┐         ┌──────────────────┐
│   Next.js      │         │  Go Scraper      │
│   (Vercel)     │         │  (Fly.io)        │
│                │         │                  │
│ • Frontend     │         │ • Async scraping │
│ • API Routes   │         │ • 50+ sources    │
│ • Search       │         │ • 2-5x faster    │
└───────┬────────┘         └─────────┬────────┘
        │                            │
        └────────────┬───────────────┘
                     ↓
             ┌──────────────┐
             │  PostgreSQL  │
             │  (Supabase)  │
             └──────────────┘
```

**Key Insight**: Comunicación vía base de datos compartida (no HTTP entre servicios):
- ✅ Sin latencia de red entre scrapers y API
- ✅ Sin necesidad de autenticación entre servicios
- ✅ Go scraper escribe a BD, Next.js lee y sirve
- ✅ Desacoplamiento completo (pueden deployarse independientemente)

**Consecuencias**:
- ✅ Escalabilidad significativa (5x más eventos/día)
- ✅ Reducción de costos operacionales (~75%)
- ❌ Complejidad de mantener 2 codebases
- ❌ Necesidad de coordinación en cambios de schema de BD

**Estado**: Propuesta (no implementar hasta que se cumplan indicadores)

---

**Última actualización**: Diciembre 2025
