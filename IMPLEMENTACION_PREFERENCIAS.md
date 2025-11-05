# Implementación de Preferencias Globales - Resumen

## ✅ Completado

### 1. Base de Datos (Prisma Schema)
- ✅ Tabla `GlobalPreferences` con todos los campos necesarios
- ✅ Modelo `Venue` actualizado con campo `capacity` (nullable)
- ✅ Modelo `VenueMetadata` para enrichment opcional
- ✅ Modelo `Event` con todos los campos necesarios
- 📁 Archivo: `prisma/schema.prisma`

### 2. Entidades de Dominio
- ✅ `GlobalPreferences` entity con tipos y defaults
- ✅ `Event` entity con categorías y tipos
- ✅ `VenueSize` type y `VenueSizeThresholds` interface
- 📁 Archivos: `src/features/events/domain/entities/`

### 3. Interfaces (Clean Architecture)
- ✅ `IPreferencesRepository` - Contrato para repositorio
- ✅ `IPreferenceFilter` - Capacidad opcional para DataSources (ISP)
- ✅ `IDataSource` - Interface base para fuentes de datos
- ✅ Capacidades opcionales: `IHealthCheckable`, `IRateLimited`, etc.
- 📁 Archivos: `src/features/events/domain/interfaces/`

### 4. Servicios de Dominio
- ✅ `PreferencesService` con:
  - Cache en memoria (5 min TTL)
  - `shouldAcceptEvent()` - validación de eventos
  - `shouldAcceptEventSync()` - versión síncrona
  - `calculateVenueSize()` - clasificación de venues
  - `updatePreferences()` - actualización con invalidación de cache
- ✅ `EventBusinessRules` con:
  - Validación completa de eventos
  - Integración con `PreferencesService`
  - Normalización de datos (ciudad, país, categoría)
  - Detección de duplicados (fuzzy matching con Levenshtein)
  - `shouldUpdate()` - lógica de merge de eventos
- 📁 Archivos: `src/features/events/domain/services/`

### 5. Repositorios (Capa Data)
- ✅ `PrismaPreferencesRepository` implementando `IPreferencesRepository`
  - Singleton pattern (id = "singleton")
  - Conversión Domain ↔ Prisma
  - Inicialización con defaults
  - Manejo de `needsRescraping` flag
- 📁 Archivo: `src/features/events/data/repositories/PrismaPreferencesRepository.ts`

### 6. Utilidades
- ✅ Type guards para verificar capacidades opcionales en runtime
  - `isPreferenceFilterable()`
  - `isHealthCheckable()`
  - `isRateLimited()`, etc.
- ✅ Cliente Prisma singleton con logging
- 📁 Archivos:
  - `src/features/events/domain/utils/type-guards.ts`
  - `src/shared/infrastructure/database/prisma.ts`

### 7. Documentación
- ✅ **PRODUCT.md** actualizado con:
  - US1.4: Configuración global de preferencias
  - US1.5: Indicador de preferencias activas
  - US3.4: Re-scraping manual con preferencias
  - Epic 1 y Epic 3 actualizados
- ✅ **ARCHITECTURE.md** con sección completa:
  - Contexto y arquitectura
  - Flujo de aplicación de filtros (pre y post-scraping)
  - Capacidad de venue y enrichment
  - Caché y re-scraping workflow
  - Interface Segregation (ISP)
  - Limitaciones y trade-offs
  - Migración futura a preferencias por usuario

---

## 🚧 Pendiente de Implementación

### 1. Migration de Base de Datos
```bash
# Ejecutar cuando el proyecto esté listo:
npm install -D prisma
npm install @prisma/client
npx prisma generate
npx prisma migrate dev --name add-global-preferences
```

### 2. DataSourceOrchestrator
Modificar para aplicar preferencias durante scraping:
- Leer preferencias al inicio de `fetchAll()`
- Inyectar preferencias a sources que implementan `IPreferenceFilter`
- Filtrar eventos post-scraping usando `PreferencesService.shouldAcceptEventSync()`
- Loggear eventos rechazados con razón
- 📁 Crear: `src/features/events/data/orchestrator/DataSourceOrchestrator.ts`

### 3. API Routes
Crear endpoints REST para administración:

**GET /api/admin/preferences**
- Retorna preferencias actuales
- No requiere autenticación (para MVP)

**PUT /api/admin/preferences**
- Actualiza preferencias
- Requiere header `x-api-key: <ADMIN_API_KEY>`
- Valida con Zod schema
- Marca `needsRescraping = true`

**POST /api/admin/scraper/sync**
- Ejecuta re-scraping manual
- Parámetro opcional: `applyNewPreferences=true`
- Requiere API key
- Retorna resumen de scraping

📁 Crear:
- `src/app/api/admin/preferences/route.ts`
- `src/app/api/admin/scraper/sync/route.ts`

### 4. UI de Administración

**Página `/admin/preferences`**
- Formulario con multi-selects para:
  - Países (códigos ISO)
  - Ciudades (lista editable)
  - Géneros musicales
  - Géneros bloqueados
  - Categorías de eventos
  - Tamaños de venue
- Ajuste de umbrales de capacidad
- Botones: "Guardar" y "Guardar y Re-scrapear Ahora"
- Modal de confirmación para re-scraping
- Display de última actualización y conteo de eventos

📁 Crear:
- `src/app/admin/preferences/page.tsx`
- `src/features/events/ui/admin/PreferencesForm.tsx`
- Componentes auxiliares: `CountrySelector`, `GenreSelector`, etc.

### 5. Banner de Preferencias

**Componente `PreferencesBanner`**
- Muestra preferencias activas en página principal
- Dismissible (guardar en localStorage)
- Link a `/admin/preferences`
- Responsive

📁 Crear: `src/features/events/ui/components/PreferencesBanner.tsx`

### 6. Tests

**Tests Unitarios**
```typescript
// PreferencesService
describe('PreferencesService', () => {
  it('rechaza eventos de países no permitidos')
  it('acepta eventos si cumplen todos los filtros')
  it('cachea preferencias por 5 minutos')
  it('invalida cache al actualizar')
  it('calcula venue size correctamente')
})

// EventBusinessRules
describe('EventBusinessRules', () => {
  it('valida campos requeridos')
  it('rechaza eventos fuera de rango de fechas')
  it('normaliza ciudad correctamente')
  it('detecta duplicados con fuzzy matching')
})
```

**Tests de Integración**
```typescript
// PrismaPreferencesRepository
describe('Preferences Integration', () => {
  it('lee preferencias de BD')
  it('actualiza preferencias y marca needsRescraping')
  it('inicializa con defaults si no existen')
})
```

📁 Crear:
- `src/features/events/domain/services/__tests__/PreferencesService.test.ts`
- `src/features/events/domain/services/__tests__/EventBusinessRules.test.ts`
- `tests/integration/preferences.test.ts`

### 7. Validación con Zod

Crear schemas para validación de API:
```typescript
// Schema para preferencias
const PreferencesUpdateSchema = z.object({
  allowedCountries: z.array(z.string()).min(1),
  allowedCities: z.array(z.string()).optional(),
  allowedGenres: z.array(z.string()).optional(),
  // ...
});
```

📁 Crear: `src/shared/validation/preferences-schemas.ts`

### 8. Variables de Entorno

Agregar a `.env`:
```bash
DATABASE_URL="file:./dev.db"
ADMIN_API_KEY="<generar-key-segura-32-chars>"
```

Agregar validación con Zod en `src/shared/config/env.ts`

---

## 📋 Checklist de Implementación

### Fase 1: Backend Core
- [ ] Ejecutar migration de Prisma
- [ ] Implementar DataSourceOrchestrator con soporte de preferencias
- [ ] Crear API routes (GET, PUT, POST)
- [ ] Validación Zod de inputs
- [ ] Tests unitarios de servicios

### Fase 2: UI Básica
- [ ] Página `/admin/preferences` con formulario
- [ ] Componentes de selección (países, géneros, etc.)
- [ ] Integración con API
- [ ] Modal de confirmación para re-scraping

### Fase 3: UX Avanzada
- [ ] Banner de preferencias activas
- [ ] Indicador de progreso de scraping
- [ ] Resumen de resultados de re-scraping
- [ ] Manejo de errores y feedback

### Fase 4: Testing & Refinamiento
- [ ] Tests de integración con Prisma
- [ ] Tests E2E con Playwright
- [ ] Testing manual del flujo completo
- [ ] Ajustes de UI/UX

---

## 🏗️ Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                │
│                                                                 │
│  /admin/preferences (formulario) → PreferencesBanner (indicador)│
└─────────────────────────┬───────────────────────────────────────┘
                          │ API calls
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                               │
│                                                                 │
│  PreferencesService ←→ EventBusinessRules                       │
│  • Cache (5 min)       • isAcceptable()                         │
│  • shouldAcceptEvent() • normalize()                            │
│  • calculateVenueSize()• isDuplicate()                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ implements interfaces
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
│                                                                 │
│  PrismaPreferencesRepository → GlobalPreferences (tabla)        │
│  DataSourceOrchestrator → aplica filtros a sources             │
└─────────────────────────────────────────────────────────────────┘
```

**Regla de dependencias respetada**: UI → Domain ← Data

---

## 🎯 Próximos Pasos Recomendados

1. **Ejecutar migration**: `npx prisma migrate dev`
2. **Implementar DataSourceOrchestrator**: Capa de datos crítica
3. **Crear API routes**: Backend funcional
4. **Testing básico**: Verificar que todo funciona
5. **UI admin**: Interface de configuración
6. **Tests completos**: Asegurar calidad

---

## 📚 Referencias

- **Arquitectura completa**: `docs/ARCHITECTURE.md` (líneas 286-587)
- **User stories**: `docs/PRODUCT.md` (US1.4, US1.5, US3.4)
- **Schema Prisma**: `prisma/schema.prisma`
- **Código implementado**: `src/features/events/`

---

**Última actualización**: 2 Noviembre 2025
**Estado**: Core backend completo, pendiente UI y orchestrator
**Estimación tiempo restante**: 6-8 horas
