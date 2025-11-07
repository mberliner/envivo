# Roadmap de Implementación - EnVivo

> **Última actualización**: 7 de Noviembre de 2025  
> **Branch actual**: `claude/project-overview-011CUqdqHGiRRDdpktZ4Ef7M`  
> **Estrategia**: Vertical Slices (features end-to-end)

---

## 📊 Estado Actual del Proyecto

### ✅ Fase 0: Setup & Configuración - **COMPLETADA**

**Duración**: ~3 horas  
**Commits**: 
- `3294a55` - Initialize Next.js 14 and install core dependencies
- `9253668` - Attempt alternative Prisma configurations  
- `ebd732c` - Complete Phase 0 setup and Clean Architecture structure

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

- [x] `Event.test.ts` - 2 tests unitarios
- [x] Todos los tests pasan ✅
- [x] Type check pasa ✅

---

## ⚠️ ACCIONES MANUALES REQUERIDAS

### 🔴 CRÍTICO - Ejecutar Localmente

El entorno de Claude Code no puede descargar binarios de Prisma (error 403 en `binaries.prisma.sh`).

**DEBES ejecutar estos comandos en tu terminal local**:

```bash
# 1. Checkout del branch
git checkout claude/project-overview-011CUqdqHGiRRDdpktZ4Ef7M
git pull origin claude/project-overview-011CUqdqHGiRRDdpktZ4Ef7M

# 2. Instalar dependencias (si no lo hiciste)
npm install

# 3. Generar Prisma Client
npx prisma generate

# 4. Crear base de datos SQLite
npx prisma db push

# 5. Verificar que todo funciona
npm run type-check  # Debe pasar sin errores
npm run test        # Debe mostrar: 2 passed (2)
npm run dev         # Debe abrir en http://localhost:3000
```

### ✅ Checklist de Verificación

Después de ejecutar los comandos anteriores, verifica:

- [ ] Archivo `dev.db` creado en la raíz del proyecto
- [ ] Carpeta `node_modules/.prisma/client/` existe
- [ ] `npm run type-check` pasa sin errores
- [ ] `npm run test` muestra: **2 passed (2)**
- [ ] `npm run dev` abre la app en http://localhost:3000
- [ ] No hay errores en la consola del navegador

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

## 🚀 Próximos Pasos - Roadmap de Fases

### Fase 1: Primer Vertical Slice - "Ticketmaster → BD → UI" 
**Duración estimada**: 1-2 días  
**Objetivo**: Primera feature funcionando end-to-end

**Tareas pendientes**:
1. [ ] Crear `TicketmasterSource` (implementa `IDataSource`)
2. [ ] Crear `TicketmasterMapper` (API response → Event entity)
3. [ ] Crear `PrismaEventRepository` (implementa `IEventRepository`)
4. [ ] Crear API Route `POST /api/admin/scraper/sync`
   - Validar API key
   - Ejecutar scraping de Ticketmaster
   - Guardar eventos en BD
   - Retornar resumen JSON
5. [ ] Crear componente `EventCard` (UI básica)
6. [ ] Crear página `app/page.tsx` (Server Component)
   - Obtener eventos de BD
   - Mostrar lista con `EventCard`
   - Ordenar por fecha
7. [ ] Tests unitarios:
   - [ ] `TicketmasterMapper.test.ts`
   - [ ] `PrismaEventRepository.test.ts` (con BD en memoria)

**Entregable**:
🎉 **Ejecutar scraping manual y ver eventos en la UI**

**Git**: `git commit -m "feat: first vertical slice - Ticketmaster to UI" && git push`

---

### Fase 2: Business Rules + Deduplicación
**Duración estimada**: 1 día  
**Objetivo**: Validación centralizada y sin duplicados

**Tareas pendientes**:
1. [ ] Implementar `EventBusinessRules` en capa Domain
   - [ ] Validación de fechas (no pasadas, rango máximo)
   - [ ] Validación de campos requeridos
   - [ ] Validación de ubicación (países permitidos)
2. [ ] Implementar deduplicación con fuzzy matching
   - [ ] Usar `string-similarity` para comparar títulos
   - [ ] Comparar fecha (±24h), venue, ciudad
   - [ ] Threshold de similitud: 0.85
3. [ ] Crear `config/business-rules.json`
4. [ ] Integrar business rules en flujo de scraping
5. [ ] Tests unitarios de business rules (>80% coverage)
6. [ ] Tests de deduplicación con casos edge

**Entregable**:
- ✅ Eventos inválidos rechazados con logs claros
- ✅ No hay duplicados en BD

**Git**: `git commit -m "feat: business rules and deduplication" && git push`

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

### Fase 4: Orchestrator + Scraping Paralelo
**Duración estimada**: 1 día  
**Objetivo**: Arquitectura lista para múltiples fuentes

**Tareas pendientes**:
1. [ ] Crear `DataSourceOrchestrator` con `Promise.allSettled()`
2. [ ] Implementar límite de concurrencia (`p-limit`)
3. [ ] Implementar retry logic (`p-retry`)
4. [ ] Agregar timeout handling por fuente
5. [ ] Crear `config/scrapers.json`
6. [ ] Refactorizar endpoint de scraping para usar orchestrator
7. [ ] Tests unitarios con mocks de data sources

**Entregable**:
- ✅ Orchestrator funciona con 1 fuente
- ✅ Listo para escalar a múltiples fuentes

**Git**: `git commit -m "feat: data source orchestrator with async scraping" && git push`

---

### Fase 5: Segunda Fuente + Detalle
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

## ✅ Próxima Acción

1. **EJECUTAR** comandos manuales de Prisma (ver sección "Acciones Manuales Requeridas")
2. **VERIFICAR** checklist de verificación
3. **CONFIRMAR** que todo funciona
4. **CONTINUAR** con Fase 1: Primer Vertical Slice

---

**Estado del Proyecto**: 🟢 **Listo para Fase 1** (después de ejecutar Prisma localmente)

**Branch**: `claude/project-overview-011CUqdqHGiRRDdpktZ4Ef7M`  
**Última actualización**: 7 de Noviembre de 2025
