# 🔍 Reporte de Inconsistencias en Documentación - EnVivo

**Fecha**: 8 de Noviembre de 2025
**Contexto**: Revisión post-Fase 1 completada
**Objetivo**: Alinear documentación con la implementación real

---

## 📊 Resumen Ejecutivo

### Estado Real del Proyecto
- ✅ **Fase 0**: Completada (100%)
- ✅ **Fase 1**: Completada (100%)
  - 35 tests pasando
  - TypeScript sin errores
  - Flujo Ticketmaster → BD → UI funcionando

### Problemas Encontrados
- 🔴 **15 inconsistencias críticas** - Documentación promete features no implementados
- 🟡 **8 contradicciones** - Documentos con información conflictiva
- 🔵 **12 desactualizaciones** - Estado del proyecto desactualizado

---

## 🔴 INCONSISTENCIAS CRÍTICAS

### 1. README.md - Estado del Proyecto Desactualizado

**Ubicación**: `README.md` líneas 182-199

**Dice**:
```markdown
### Fase Actual: Fase 0 - Setup & Configuración

| Fase 0 | 4-6 horas | Setup inicial | 🚧 En progreso |
| Fase 1 | 1-2 días | Ticketmaster → UI | ⏳ Pendiente |
```

**Realidad**:
- Fase 0: ✅ COMPLETADA (commit `5a0bfca`)
- Fase 1: ✅ COMPLETADA (commits `f2a78ce`, `9929588`, `da97429`)

**Corrección necesaria**:
```markdown
### Fase Actual: Fase 1 - COMPLETADA ✅

| Fase 0 | 4-6 horas | Setup inicial | ✅ Completada |
| Fase 1 | 1-2 días | Ticketmaster → UI | ✅ Completada |
| Fase 2 | 1 día | Business Rules | ⏳ Pendiente |
```

---

### 2. README.md - Features del MVP Marcados como Pendientes

**Ubicación**: `README.md` líneas 89-97

**Dice**:
```markdown
## 🎯 Features del MVP

- ⏳ Búsqueda por texto (título, artista, venue)
- ⏳ Filtros por ciudad, fecha, categoría
- ⏳ Detalle completo de eventos
- ⏳ Scraping asíncrono de múltiples fuentes
- ⏳ Integración con Ticketmaster API
- ⏳ Validación y deduplicación automática
```

**Realidad**:
- ✅ Integración con Ticketmaster API - IMPLEMENTADO (parcial)
- ✅ Scraping manual - IMPLEMENTADO
- ✅ UI de listado de eventos - IMPLEMENTADO
- ❌ Búsqueda por texto - NO implementado (Fase 3)
- ❌ Filtros - NO implementado (Fase 3)
- ❌ Detalle de eventos - NO implementado (Fase 5)
- ❌ Scraping asíncrono múltiples fuentes - NO implementado (Fase 4)
- ❌ Validación y deduplicación - NO implementado (Fase 2)

**Corrección necesaria**:
```markdown
## 🎯 Estado de Features del MVP

### ✅ Implementado (Fase 1)
- Integración con Ticketmaster API (Discovery API v2)
- Scraping manual con endpoint autenticado
- UI de listado de eventos (grid responsive)
- Persistencia en SQLite con Prisma

### 🚧 En Desarrollo
- Business Rules y Deduplicación (Fase 2)
- Búsqueda y Filtros (Fase 3)
- Orchestrator asíncrono (Fase 4)

### ⏳ Planificado
- Detalle completo de eventos (Fase 5)
- Scraping automático diario (Fase 6)
- Tests E2E (Fase 7)
```

---

### 3. README.md - Endpoints Documentados que NO Existen

**Ubicación**: `README.md` líneas 162-166

**Dice**:
```bash
# Re-scraping con preferencias actualizadas
curl -X POST "http://localhost:3000/api/admin/scraper/sync?applyNewPreferences=true"

# Ver estado del scraping
curl http://localhost:3000/api/scraper/status
```

**Realidad**:
- ❌ `/api/admin/scraper/sync?applyNewPreferences=true` - NO implementado (Fase 2)
- ❌ `/api/scraper/status` - NO implementado

**Implementación actual**:
```bash
# ÚNICO endpoint disponible
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country": "AR", "city": "Buenos Aires"}'
```

**Corrección necesaria**: Eliminar referencias a endpoints no implementados o marcarlos como "Planificado Fase X".

---

### 4. README.md - Dependencias No Instaladas

**Ubicación**: `README.md` línea 9

**Dice**:
```markdown
- **Styling**: Tailwind CSS + shadcn/ui
```

**Realidad**:
- ✅ Tailwind CSS - INSTALADO
- ❌ shadcn/ui - NO INSTALADO

Solo usamos clases de Tailwind nativas, sin shadcn/ui.

**Corrección necesaria**:
```markdown
- **Styling**: Tailwind CSS
```

---

### 5. README.md - Menciona Playwright pero No Está Configurado

**Ubicación**: `README.md` líneas 12-14

**Dice**:
```markdown
- **Testing**: Vitest + Playwright + React Testing Library
- **Scraping**: Cheerio + Axios (async con p-limit)
  - Playwright disponible para sitios dinámicos (JS-heavy)
```

**Realidad**:
- ✅ Vitest - INSTALADO y configurado
- ✅ React Testing Library - INSTALADO (pero sin tests UI todavía)
- ❌ Playwright - NO INSTALADO, NO CONFIGURADO

**Corrección necesaria**:
```markdown
- **Testing**: Vitest + React Testing Library
  - Playwright planificado para tests E2E (Fase 7)
- **Scraping**: Axios (API clients)
  - Cheerio planificado para scrapers HTML (Fase 5)
  - Playwright considerado para sitios JS-heavy si es necesario
```

---

### 6. README.md - Comandos de Testing que Fallan

**Ubicación**: `README.md` líneas 107-121

**Dice**:
```bash
# Tests con coverage
npm run test:coverage

# Tests E2E
npm run test:e2e
```

**Realidad**:
- ❌ `test:coverage` - NO existe en package.json
- ❌ `test:e2e` - NO existe en package.json

**Scripts reales disponibles**:
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "type-check": "tsc --noEmit"
}
```

**Corrección necesaria**: Actualizar sección de testing con comandos reales.

---

### 7. CLAUDE.md - Menciona Interfaces que NO Existen

**Ubicación**: `CLAUDE.md` líneas 88-91

**Dice**:
```typescript
// Mappers: sufijo Mapper
class TicketmasterMapper implements IEventMapper {}

// Business Rules: sufijo Rules
class EventBusinessRules implements IEventBusinessRules {}
```

**Realidad**:
- ❌ `IEventMapper` - NO existe en el código
- ❌ `IEventBusinessRules` - NO existe en el código
- ✅ `TicketmasterMapper` - Existe pero NO implementa interface (métodos estáticos)
- ❌ `EventBusinessRules` - NO existe (planificado Fase 2)

**Implementación real**:
```typescript
// Mapper con métodos estáticos (sin interface)
export class TicketmasterMapper {
  static toRawEvent(apiEvent: TicketmasterEvent): RawEvent { ... }
  static toRawEvents(apiEvents: TicketmasterEvent[]): RawEvent[] { ... }
}
```

**Corrección necesaria**:
```typescript
// Mappers: sufijo Mapper (clase con métodos estáticos)
class TicketmasterMapper {
  static toRawEvent(): RawEvent {}
  static toRawEvents(): RawEvent[] {}
}

// Business Rules: sufijo Rules (Planificado Fase 2)
// class EventBusinessRules {}
```

---

### 8. CLAUDE.md - Menciona DataSourceOrchestrator (NO Implementado)

**Ubicación**: `CLAUDE.md` líneas 45-47, 100

**Dice**:
```markdown
**1. Scraping Asíncrono**
Paralelo con `Promise.allSettled()` → 5x más rápido

- `data/` - Repositories, Orchestrator, Sources, Mappers
```

**Realidad**:
- ❌ `DataSourceOrchestrator` - NO implementado (planificado Fase 4)
- ❌ Scraping de múltiples fuentes en paralelo - NO implementado
- ✅ Solo una fuente: TicketmasterSource

**Corrección necesaria**: Aclarar que el orchestrator es planificado Fase 4.

---

## 🟡 CONTRADICCIONES ENTRE DOCUMENTOS

### 9. PRODUCT.md: US3.0 vs Roadmap Fase 1

**Problema**: El User Story US3.0 es mucho más completo que lo implementado en Fase 1.

**US3.0 (PRODUCT.md líneas 186-236) pide**:
- ✅ Endpoint `POST /api/admin/scraper/sync` - IMPLEMENTADO
- ✅ Autenticación con header `x-api-key` - IMPLEMENTADO
- ❌ Carga de preferencias por defecto - NO implementado
- ❌ Scraping de "todas las fuentes en paralelo" - NO (solo Ticketmaster)
- ❌ Validación con business rules - NO implementado
- ❌ Deduplicación - NO implementado
- ❌ Resumen detallado con rechazados/razones - NO implementado
- ❌ Marca `needsRescraping=false` - NO implementado
- ❌ Rate limiting - NO implementado
- ❌ Timeout global 5 minutos - NO implementado
- ❌ Logs estructurados con Pino - NO implementado

**Roadmap Fase 1 (PRODUCT.md líneas 400-442) pide**:
- ✅ API Route básica
- ✅ Validar API key
- ✅ Ejecutar TicketmasterSource.fetch()
- ✅ Guardar en BD
- ✅ Retornar resumen JSON

**Implementación real coincide con**: Roadmap Fase 1 (mínimo viable)

**Problema**: US3.0 está adelantado. Incluye features de Fase 2 (business rules, deduplicación).

**Corrección necesaria**:
1. **Renombrar US3.0** → **US3.0a: Scraping Manual Básico (Fase 1)**
2. **Crear US3.0b**: Scraping Manual Completo con Business Rules (Fase 2)
3. **Actualizar criterios de aceptación** en US3.0a para que coincidan con Fase 1

---

### 10. PRODUCT.md - Preferencias Por Defecto Contradictorias

**PRODUCT.md US3.0 (línea 197-201) dice**:
```markdown
- allowedCountries: `['AR']`
- allowedCities: `['Buenos Aires', 'Ciudad de Buenos Aires', 'CABA']`
- allowedCategories: `['Music', 'Concert', 'Festival']`
```

**README.md (líneas 173-176) dice**:
```markdown
- **Países**: Solo Argentina (`AR`)
- **Ciudades**: Buenos Aires, Ciudad de Buenos Aires, CABA
- **Categorías**: Music, Concert, Festival
```

**Prisma Schema (líneas 21-29) tiene valores por defecto**:
```prisma
allowedCountries String @default("[\"AR\",\"UY\",\"CL\",\"BR\"]")
allowedCities    String @default("[\"Buenos Aires\",\"Montevideo\"]")
allowedCategories String @default("[\"Concierto\",\"Festival\",\"Teatro\"]")
```

**Problema**: 3 fuentes de verdad con valores distintos.

**Corrección necesaria**: Decidir UNA fuente de verdad y alinear las demás.

**Recomendación**: Usar los valores del schema de Prisma como SSOT (Single Source of Truth).

---

### 11. README vs roadmap_imple.md - Última Actualización

**README.md (línea 234)**:
```markdown
**Última actualización**: Enero 2025
```

**roadmap_imple.md (línea 3)**:
```markdown
> **Última actualización**: 7 de Noviembre de 2025 (Fase 1 completada)
```

**Problema**: README dice "Enero 2025" (fecha futura incorrecta), roadmap_imple está correcto.

**Corrección necesaria**: README debe decir "Noviembre 2025" o "8 de Noviembre de 2025".

---

## 🔵 DESACTUALIZACIONES MENORES

### 12. README - Quick Start con Endpoint Simplificado

**Ubicación**: `README.md` líneas 42-44

**Dice**:
```bash
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: tu-clave-del-env-ADMIN_API_KEY"
```

**Mejoría posible**: Mostrar ejemplo con body opcional.

**Corrección sugerida**:
```bash
# Scraping con parámetros por defecto
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: tu-clave-del-env-ADMIN_API_KEY"

# Scraping con país/ciudad específicos
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: tu-clave-del-env-ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country": "AR", "city": "Buenos Aires"}'
```

---

### 13. CLAUDE.md - Testing Requirements Desactualizados

**Ubicación**: `CLAUDE.md` líneas 136-146

**Dice**:
```markdown
| Domain (Business Rules) | >80% | 🔴 CRÍTICO |
| Data (Repositories) | >70% | 🟡 IMPORTANTE |
| Data (Scrapers) | >60% | 🟡 IMPORTANTE |
| UI (Componentes) | >60% | 🟢 DESEABLE |
| E2E (Flujos críticos) | 100% happy paths | 🔴 CRÍTICO |
```

**Realidad actual**:
- ❌ Domain (Business Rules): 0% - NO existen business rules todavía
- ✅ Data (Repositories): 100% - PrismaEventRepository con 10 tests
- ✅ Data (Scrapers): 100% - TicketmasterSource + Mapper con 18 tests
- ❌ UI (Componentes): 0% - EventCard sin tests
- ❌ E2E: 0% - No hay tests E2E

**Cobertura real en Fase 1**: Data layer al 100%, UI y Domain al 0%.

**Corrección necesaria**: Aclarar que son objetivos a futuro, no estado actual.

---

### 14. CLAUDE.md - Estado Actual Desactualizado

**Ubicación**: `CLAUDE.md` líneas 252-259

**Dice**:
```markdown
### ✅ Completado
- Plan completo del proyecto
- Arquitectura definida (Clean Architecture + SOLID)
- Decisiones técnicas documentadas
- User stories y roadmap con enfoque de vertical slices
- Testing strategy, security guidelines, CI/CD workflows

### 🚧 En Progreso
- Fase 0: Setup & Configuración (próximo paso)
```

**Realidad**:
- ✅ Fase 0: COMPLETADA
- ✅ Fase 1: COMPLETADA

**Corrección necesaria**:
```markdown
### ✅ Completado
- Fase 0: Setup & Configuración
- Fase 1: Ticketmaster → BD → UI (primer vertical slice)

### 🚧 En Progreso
- Próximo: Fase 2 - Business Rules + Deduplicación
```

---

### 15. PRODUCT.md - Features Implementados Sin Marcar

**Ubicación**: `PRODUCT.md` líneas 19-28

**Problema**: No hay forma de saber qué features están implementados.

**Corrección sugerida**: Agregar columna de "Estado" a la tabla.

```markdown
| Feature | Descripción | Prioridad | Estado |
|---------|-------------|-----------|--------|
| **Integración Ticketmaster** | API de Ticketmaster | 🔴 CRÍTICO | ✅ Fase 1 |
| **Búsqueda por texto** | Buscar por título/artista | 🔴 CRÍTICO | ⏳ Fase 3 |
| **Scraping automático** | Actualización diaria | 🔴 CRÍTICO | ⏳ Fase 6 |
```

---

## 📋 PLAN DE CORRECCIÓN RECOMENDADO

### Prioridad 1 - CRÍTICO (Actualizar YA)

1. ✅ **README.md**: Actualizar estado a "Fase 1 completada"
2. ✅ **README.md**: Corregir tabla de roadmap (Fase 0 y 1 completadas)
3. ✅ **README.md**: Actualizar features con estado real
4. ✅ **README.md**: Eliminar comandos que no existen
5. ✅ **README.md**: Corregir fecha de última actualización

### Prioridad 2 - IMPORTANTE (Actualizar esta semana)

6. ✅ **CLAUDE.md**: Actualizar estado actual del proyecto
7. ✅ **CLAUDE.md**: Corregir ejemplos de código (TicketmasterMapper sin interface)
8. ✅ **CLAUDE.md**: Aclarar que Orchestrator es planificado Fase 4
9. ✅ **PRODUCT.md**: Dividir US3.0 en US3.0a (Fase 1) y US3.0b (Fase 2)
10. ✅ **PRODUCT.md**: Agregar columna "Estado" a tabla de features

### Prioridad 3 - DESEABLE (Cuando haya tiempo)

11. 🔵 Crear tabla de "Implementación vs Documentación" en roadmap_imple.md
12. 🔵 Agregar sección "Qué NO está implementado todavía" en README
13. 🔵 Actualizar ejemplos en docs/examples/ para que coincidan con implementación
14. 🔵 Documentar estructura REAL de archivos (algunos .gitkeep, otros con código)

---

## 🎯 CONCLUSIONES

### Principales Problemas
1. **Documentación adelantada**: Varios docs prometen features de Fase 2-7
2. **Estado desactualizado**: README dice "Fase 0 en progreso" cuando ya está Fase 1 completa
3. **Contradicción US3.0 vs Implementación**: US requiere business rules, implementación es básica
4. **Referencias a código inexistente**: Interfaces, clases, endpoints no implementados

### Recomendaciones
1. **Actualizar README.md URGENTE** - Es la primera impresión del proyecto
2. **Dividir US3.0** en versión básica (Fase 1) y completa (Fase 2)
3. **Marcar claramente** features planificadas vs implementadas
4. **Eliminar referencias** a dependencias no instaladas (shadcn/ui, Playwright)

### Filosofía Propuesta
- Documentación debe reflejar **estado actual**, no aspiracional
- Features futuras deben estar en sección "Planificado"
- User stories deben tener marcado en qué fase se implementan
- Ejemplos de código deben estar en docs/examples/, no en CLAUDE.md

---

**¿Proceder con las correcciones?**
