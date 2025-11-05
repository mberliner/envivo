# Product Documentation - EnVivo

## Tabla de Contenidos

1. [Features del MVP](#features-del-mvp)
2. [Épicas](#épicas)
3. [Definición de Terminado (General)](#definición-de-terminado-general)
4. [User Stories](#user-stories)
5. [Roadmap de Implementación](#roadmap-de-implementación)
6. [Métricas de Éxito](#métricas-de-éxito)
7. [Checklist Pre-Launch](#checklist-pre-launch)

---

## Features del MVP

### ✅ Core Features (Must-Have)

| Feature | Descripción | Prioridad |
|---------|-------------|-----------|
| **Búsqueda por texto** | Buscar eventos por título, artista o venue | 🔴 CRÍTICO |
| **Filtros avanzados** | Filtrar por ciudad, fecha, categoría | 🔴 CRÍTICO |
| **Detalle de evento** | Ver información completa del evento | 🔴 CRÍTICO |
| **Scraping automático** | Actualización diaria de eventos | 🔴 CRÍTICO |
| **Integración Ticketmaster** | API de Ticketmaster como fuente principal | 🔴 CRÍTICO |
| **Scrapers locales** | Mínimo 2 sitios locales scrapeados | 🟡 IMPORTANTE |
| **Validación de datos** | Reglas de negocio para calidad de datos | 🟡 IMPORTANTE |
| **Deduplicación** | Detectar eventos duplicados automáticamente | 🟡 IMPORTANTE |

### 🚫 NO Incluir en MVP (Post-MVP)

| Feature | Por qué NO en MVP | Cuándo Agregar |
|---------|-------------------|----------------|
| Cuentas de usuario | No es necesario para búsqueda básica | Fase 2 (Mes 2) |
| Favoritos/guardados | Requiere autenticación | Fase 2 |
| Notificaciones | Requiere usuarios + infraestructura | Fase 3 |
| Recomendaciones personalizadas | Requiere ML + historial | Fase 3 |
| Integración Spotify | Nice-to-have, no core | Fase 2-3 |
| Compra de entradas directa | Complejidad legal/financiera | Nunca (links externos OK) |

---

## Épicas

### Epic 1: Búsqueda de Eventos

**Objetivo**: Los usuarios pueden buscar y filtrar eventos musicales fácilmente.

**User Stories**:
- US1.1: Búsqueda por texto
- US1.2: Filtros avanzados (ciudad, fecha, categoría)
- US1.3: Ordenamiento de resultados

**Criterios de Éxito**:
- Búsqueda responde en <500ms (p95)
- Filtros se pueden combinar
- Resultados relevantes (FTS5)

---

### Epic 2: Visualización de Eventos

**Objetivo**: Los usuarios pueden ver información detallada de eventos.

**User Stories**:
- US2.1: Ver detalle completo de evento
- US2.2: Ver ubicación en mapa (opcional MVP)
- US2.3: Link a compra de entradas

**Criterios de Éxito**:
- Toda la información visible (título, fecha, venue, precio)
- Imágenes optimizadas (Next.js Image)
- Links externos funcionan

---

### Epic 3: Scraping y Gestión de Datos

**Objetivo**: El sistema mantiene datos actualizados automáticamente.

**User Stories**:
- US3.0: Población inicial de base de datos (scraping manual)
- US3.1: Scraping automático diario
- US3.2: Validación de datos
- US3.3: Deduplicación de eventos
- US3.4: Configuración de preferencias globales (Post-MVP Fase 1.5)
- US3.5: Re-scraping manual con preferencias actualizadas (Post-MVP Fase 1.5)

**Criterios de Éxito**:
- BD se puede poblar desde cero con scraping manual
- Scraping >90% success rate
- No eventos duplicados en BD
- Logs claros de cada ejecución
- Eventos rechazados por preferencias quedan registrados con razón
- Preferencias se pueden configurar vía UI admin (Post-MVP)

**Nota**: Scraping manual (`POST /api/admin/scraper/sync`) es **CRÍTICO** para MVP - permite poblar BD inicial y re-scraping bajo demanda.

---

## Definición de Terminado (General)

Aplica a todas las historias de usuario del MVP.

- [ ] Tests relevantes pasan (unitarios e integración según corresponda)
- [ ] Tipado TypeScript sin errores (`npm run type-check`)
- [ ] Linter y formato sin issues (`npm run lint` y Prettier)
- [ ] Manejo de errores y estados de carga implementados
- [ ] Logs mínimos útiles sin datos sensibles
- [ ] UI responsive básica y accesible (navegable con teclado, labels)
- [ ] Performance razonable para el caso (sin bloqueos visibles en UI)
- [ ] Documentación técnica mínima en el código donde sea necesario

---

## User Stories

### US1.1: Búsqueda por Texto

**Como** usuario
**Quiero** buscar eventos por título o artista
**Para** encontrar shows que me interesan

**Criterios de Aceptación**:
- [ ] Puedo escribir texto en la barra de búsqueda
- [ ] Los resultados se filtran al presionar "Buscar" o Enter
- [ ] Se muestran al menos: título, fecha, venue, imagen
- [ ] Si no hay resultados, se muestra mensaje claro
- [ ] La búsqueda funciona con acentos o sin ellos (ej: "Metallica" = "Metállica")
- [ ] Búsqueda case-insensitive
- [ ] Si la consulta tiene menos de 2 caracteres, no se ejecuta búsqueda y se muestra sugerencia para ampliar el término
- [ ] Resultados paginados o con "cargar más" y se muestra el conteo total de resultados

**Definición de Terminado**: Aplica DoD general.

**Prioridad**: 🔴 CRÍTICO

---

### US1.2: Filtros Avanzados

**Como** usuario
**Quiero** filtrar eventos por ciudad, fecha y categoría
**Para** encontrar eventos específicos de mi interés

**Criterios de Aceptación**:
- [ ] Puedo seleccionar ciudad de una lista (dropdown)
- [ ] Puedo seleccionar rango de fechas con date picker
- [ ] Puedo filtrar por categoría (Concierto, Festival, Teatro, Stand-up)
- [ ] Los filtros se pueden combinar (ej: Buenos Aires + Conciertos + Próxima semana)
- [ ] Los filtros se pueden limpiar con un botón "Limpiar filtros"
- [ ] Filtros persisten en URL (compartibles via link)
 - [ ] Al cambiar filtros, la vista vuelve al inicio de la lista de resultados
 - [ ] Valores inválidos de filtros recibidos por URL se ignoran y se normalizan a valores por defecto

**Definición de Terminado**: Aplica DoD general.

**Prioridad**: 🔴 CRÍTICO

---

### US2.1: Ver Detalle de Evento

**Como** usuario
**Quiero** ver información completa de un evento
**Para** decidir si quiero asistir

**Criterios de Aceptación**:
- [ ] Se muestra imagen del evento (o placeholder si no hay)
- [ ] Se muestra título, fecha, hora, venue
- [ ] Se muestra descripción completa (si está disponible)
- [ ] Se muestra precio (si está disponible)
- [ ] Hay botón "Comprar entradas" que abre link externo en nueva pestaña
- [ ] Se muestra mapa con ubicación del venue (opcional para MVP)
- [ ] Se muestran artistas participantes (si hay)
 - [ ] Si el evento no existe, se muestra página 404 con mensaje claro
 - [ ] Las imágenes muestran skeleton de carga y fallback ante error
 - [ ] Existe un enlace "Volver a resultados" que preserva query y filtros previos

**Definición de Terminado**: Aplica DoD general.

**Prioridad**: 🔴 CRÍTICO

---

### US3.0: Población Inicial de Base de Datos

**Como** administrador del sistema
**Quiero** ejecutar scraping manual para poblar la BD por primera vez
**Para** tener datos iniciales antes de que inicie el scraping automático

**Contexto**: Al iniciar el proyecto, la BD está vacía. Este endpoint permite llenarla manualmente.

**Criterios de Aceptación**:
- [ ] Endpoint `POST /api/admin/scraper/sync` disponible
- [ ] Requiere autenticación con header `x-api-key` (mínimo 32 caracteres)
- [ ] Carga preferencias por defecto si no existen (lazy initialization):
  - allowedCountries: `['AR']`
  - allowedCities: `['Buenos Aires', 'Ciudad de Buenos Aires', 'CABA']`
  - allowedCategories: `['Music', 'Concert', 'Festival']`
  - allowedVenueSizes: `['small', 'medium', 'large']`
- [ ] Ejecuta scraping de todas las fuentes configuradas en paralelo
- [ ] Aplica validación de business rules y filtrado por preferencias
- [ ] Deduplica eventos antes de guardar
- [ ] Retorna resumen JSON: total scrapeado, aceptados, rechazados, razones, duración
- [ ] Marca `needsRescraping=false` al finalizar exitosamente
- [ ] Rate limiting: máximo 10 requests cada 10 segundos
- [ ] Timeout global: 5 minutos
- [ ] Logs estructurados con Pino (redactando API keys)

**Definición de Terminado**: Aplica DoD general.

**Prioridad**: 🔴 CRÍTICO

**Ejemplo de uso**:
```bash
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: your-admin-key-min-32-chars"
```

**Respuesta esperada**:
```json
{
  "status": "success",
  "summary": {
    "totalScraped": 500,
    "accepted": 350,
    "rejected": 150,
    "durationMs": 4200
  },
  "rejectionReasons": {
    "COUNTRY_NOT_ALLOWED": 80,
    "INVALID_DATE_PAST": 70
  }
}
```

---

### US3.1: Scraping Automático Diario

**Como** administrador del sistema
**Quiero** que los datos se actualicen automáticamente cada día
**Para** tener eventos siempre actualizados sin intervención manual

**Criterios de Aceptación**:
- [ ] El scraping se ejecuta diariamente a las 2 AM UTC
- [ ] Se scrapean mínimo 3 fuentes (Ticketmaster + 2 locales)
- [ ] Los eventos duplicados no se guardan (fuzzy matching)
- [ ] Los eventos pasados se mantienen en BD (histórico) pero no se muestran
- [ ] Se envía notificación (log visible) si el scraping falla
- [ ] Se pueden ver logs de última ejecución en `/api/scraper/status`
 - [ ] Si una fuente falla, el estado expone fuente, timestamp y motivo del fallo
 - [ ] Retries con backoff quedan registrados por fuente con contador visible en el estado

**Definición de Terminado**: Aplica DoD general.

**Prioridad**: 🔴 CRÍTICO

---

### US3.2: Validación de Datos

**Como** sistema
**Quiero** validar todos los eventos antes de guardarlos
**Para** asegurar calidad de datos en la aplicación

**Criterios de Aceptación**:
- [ ] Eventos sin título se rechazan
- [ ] Eventos sin fecha se rechazan
- [ ] Eventos sin venue se rechazan
- [ ] Fechas pasadas >1 días se rechazan
- [ ] Países fuera de la lista permitida se rechazan
- [ ] Títulos demasiado cortos (<3 caracteres) se rechazan
- [ ] Se loggean eventos rechazados con razón clara
- [ ] La razón de rechazo se persiste con un código estandarizado (p.ej., MISSING_DATE, OUT_OF_SCOPE_COUNTRY)

**Definición de Terminado**: Aplica DoD general.

**Prioridad**: 🟡 IMPORTANTE

---

### US3.3: Deduplicación de Eventos

**Como** usuario
**Quiero** rechazar eventos duplicados de diferentes fuentes
**Para** no mostrar el mismo evento múltiples veces

**Criterios de Aceptación**:
- [ ] Eventos con títulos >85% similares se consideran duplicados
- [ ] Eventos en la misma fecha ±24h se consideran duplicados
- [ ] Eventos en el mismo venue se consideran duplicados
- [ ] Se prefiere la fuente más confiable (ej: Ticketmaster > scraper local)
- [ ] Se mergean campos si una fuente tiene más información
 - [ ] No hay duplicados visibles en la UI tras el proceso de deduplicación

**Definición de Terminado**: Aplica DoD general.

**Prioridad**: 🟡 IMPORTANTE

---

### US3.4: Configuración de Preferencias Globales (UI Admin)

**Como** administrador del sistema
**Quiero** configurar preferencias globales de scraping
**Para** obtener solo eventos relevantes y optimizar uso de recursos

**Criterios de Aceptación**:
- [ ] Puedo acceder a página `/admin/preferences` con formulario de configuración
- [ ] Puedo configurar países permitidos (multi-select con códigos ISO)
- [ ] Puedo configurar ciudades específicas (opcional, lista editable)
- [ ] Puedo seleccionar géneros musicales de interés (multi-select)
- [ ] Puedo seleccionar géneros bloqueados (lista negra opcional)
- [ ] Puedo elegir categorías de eventos permitidas (Concierto, Festival, Teatro, etc.)
- [ ] Puedo filtrar por tamaño de venue (pequeño <500, mediano 500-2000, grande >2000)
- [ ] Los umbrales de capacidad de venue son configurables
- [ ] Las preferencias se guardan en base de datos (tabla GlobalPreferences)
- [ ] Cambiar preferencias marca automáticamente necesidad de re-scraping
- [ ] Hay botón "Guardar" (solo guarda) y "Guardar y Re-scrapear Ahora" (ejecuta scraping inmediato)
- [ ] La página muestra última actualización y conteo de eventos actuales en BD
- [ ] Hay validación: al menos 1 país debe estar seleccionado
- [ ] Se muestra modal de confirmación antes de ejecutar re-scraping
- [ ] Durante re-scraping se muestra progreso o spinner
- [ ] Al completar, se muestra resumen de eventos scrapeados/aceptados/rechazados

**Definición de Terminado**: Aplica DoD general.

**Prioridad**: 🟡 IMPORTANTE (Post-MVP Fase 1.5)

---

### US3.5: Re-scraping Manual con Preferencias Actualizadas

**Como** administrador
**Quiero** ejecutar scraping manual después de cambiar preferencias
**Para** actualizar la BD con los nuevos filtros

**Contexto**: Cuando se actualizan preferencias globales (ej: agregar más países), se marca `needsRescraping=true`. Este flujo aplica los nuevos filtros.

**Criterios de Aceptación**:
- [ ] Endpoint `POST /api/admin/scraper/sync?applyNewPreferences=true` disponible
- [ ] Invalida caché de preferencias antes de scrapear
- [ ] Lee nuevas preferencias de BD
- [ ] Ejecuta scraping aplicando nuevos filtros
- [ ] Solo guarda eventos que cumplen nuevas preferencias
- [ ] Marca `needsRescraping=false` al finalizar exitosamente
- [ ] Retorna resumen con eventos aceptados/rechazados por las nuevas reglas
- [ ] Si scraping falla, no marca como completado (permite retry)

**Definición de Terminado**: Aplica DoD general.

**Prioridad**: 🟡 IMPORTANTE (Post-MVP Fase 1.5)

**Nota**: El endpoint base (`POST /api/admin/scraper/sync`) ya existe desde US3.0. Esta US solo agrega el parámetro `applyNewPreferences`.

---

## Roadmap de Implementación

### Fase 1: Setup Inicial (Día 1)

**Objetivo**: Proyecto configurado y funcionando localmente.

**Tareas**:
1. Inicializar Next.js 14 con TypeScript
2. Configurar Prisma + SQLite
3. Setup Tailwind CSS + shadcn/ui
4. Crear estructura de carpetas (Clean Architecture)
5. Configurar ESLint + Prettier
6. Setup Git + GitHub repo
7. Configurar variables de entorno

**Entregable**: `npm run dev` funciona, estructura de carpetas creada.

---

### Fase 2: Capa de Datos (Días 2-3)

**Objetivo**: Sistema de scraping asíncrono funcionando.

**Tareas**:
1. Crear interfaces base (`IDataSource`, `IEventRepository`)
2. Implementar `DataSourceOrchestrator` con async scraping
3. Implementar `TicketmasterSource` (API client)
4. Crear mappers (`TicketmasterMapper`)
5. Implementar `EventRepository` con Prisma
6. Implementar `EventBusinessRules` (validación, deduplicación)
7. Tests unitarios de orchestrator y business rules

**Entregable**: Scraping funciona, eventos se guardan en SQLite.

---

### Fase 3: Búsqueda (Día 4)

**Objetivo**: Motor de búsqueda funcionando.

**Tareas**:
1. Configurar SQLite FTS5 en Prisma
2. Implementar `SearchService` (búsqueda por texto)
3. Implementar filtros (ciudad, fecha, categoría)
4. Tests de búsqueda

**Entregable**: API `/api/eventos?q=Metallica&city=Buenos Aires` funciona.

---

### Fase 4: API Routes (Día 5)

**Objetivo**: Endpoints REST funcionando.

**Tareas**:
1. GET `/api/eventos` (búsqueda con filtros)
2. GET `/api/eventos/[id]` (detalle)
3. POST `/api/scraper/sync` (trigger scraping manual)
4. GET `/api/scraper/status` (estado de scraping)
5. Validación de query params con Zod
6. Rate limiting básico
7. Error handling

**Entregable**: API REST completa y documentada.

---

### Fase 5: UI/UX (Días 6-8)

**Objetivo**: Interfaz de usuario completa.

**Tareas**:
1. Página home con buscador
2. Componente `EventCard` (lista)
3. Componente `EventFilters` (sidebar)
4. Página detalle de evento
5. Componente `SearchBar` con debounce
6. Loading states y error states
7. Responsive design (mobile-first)
8. Optimización de imágenes (Next.js Image)

**Entregable**: UI completa y funcional.

---

### Fase 6: Automatización (Día 9)

**Objetivo**: Scraping automático y monitoring.

**Tareas**:
1. GitHub Action para scraping diario (cron)
2. GitHub Action para tests en CI
3. Setup logging con Pino
4. Error handling global
5. Sentry integration (opcional)
6. Vercel deployment config

**Entregable**: Scraping automático funcionando, logs estructurados.

---

### Fase 7: Testing & Deploy (Día 10)

**Objetivo**: Proyecto testeado y en producción.

**Tareas**:

1. Tests unitarios de business rules (>80% coverage)
2. Tests E2E con Playwright (flujos críticos)
3. Performance testing (búsqueda <500ms)
4. Security audit (`npm audit`)
5. Deploy a Vercel
6. Configurar variables de entorno en Vercel
7. Verificar scraping diario funciona

**Entregable**: Proyecto en producción en Vercel.

---

## Métricas de Éxito

### Objetivos del MVP

| Métrica | Objetivo | Cómo Medirlo |
|---------|----------|--------------|
| **Performance** | Búsqueda <500ms (p95) | Vercel Analytics |
| **Disponibilidad** | >99% uptime | Vercel Monitoring |
| **Datos** | >500 eventos activos | Query a BD: `SELECT COUNT(*) FROM Event WHERE date > NOW()` |
| **Scraping Success Rate** | >90% de fuentes exitosas | Logs del orchestrator |
| **Cobertura de Tests** | >80% dominio, >60% total | Vitest coverage report |
| **Errores en Producción** | <5 errores/día | Sentry o Vercel logs |
| **Lighthouse Score** | >90 Performance | Lighthouse CI |

### KPIs de Negocio (Post-MVP)

| KPI | Objetivo (Mes 1) | Cómo Medirlo |
|-----|------------------|--------------|
| Búsquedas/día | 50+ | Log de requests a `/api/eventos` |
| Eventos mostrados/día | 200+ | Log de visualizaciones |

---

## Checklist Pre-Launch

### Funcionalidad

- [ ] Búsqueda por texto funciona correctamente
- [ ] Filtros (ciudad, fecha, categoría) funcionan y se pueden combinar
- [ ] Detalle de evento muestra toda la información
- [ ] Links a compra de entradas se abren en nueva pestaña
- [ ] Scraping diario configurado y funcionando
- [ ] No hay eventos duplicados visibles

### Calidad

- [ ] Tests unitarios >80% cobertura (capa de dominio)
- [ ] Tests E2E para flujos críticos (búsqueda, detalle) pasan
- [ ] No hay errores de TypeScript (`npm run type-check`)
- [ ] Linter pasa sin warnings (`npm run lint`)
- [ ] Código formateado con Prettier

### Performance

- [ ] Lighthouse score >90 (Performance)
- [ ] Búsqueda responde en <500ms con 1000+ eventos
- [ ] Imágenes optimizadas con Next.js Image component
- [ ] Lazy loading de componentes pesados
- [ ] Build de producción exitoso (`npm run build`)

### Seguridad

**Ver [SECURITY.md](SECURITY.md) para guía completa de seguridad.**

- [ ] Validación Zod en todos los inputs de API
- [ ] Rate limiting implementado en endpoints públicos
- [ ] Headers de seguridad configurados (CSP, HSTS, X-Frame-Options)
- [ ] No hay secretos hardcoded en código
- [ ] `.env` en `.gitignore`
- [ ] `npm audit` sin vulnerabilidades críticas o altas
- [ ] Sanitización de datos scrapeados (DOMPurify)

### Deploy

- [ ] Variables de entorno configuradas en Vercel
- [ ] GitHub Actions funcionando (tests + deploy)
- [ ] Dominio configurado (opcional, puede ser subdomain de Vercel)
- [ ] Monitoring activo (Vercel logs + Sentry opcional)
- [ ] Scraping diario ejecutándose correctamente
- [ ] Logs accesibles y legibles

### Documentación

- [ ] README.md actualizado con instrucciones
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] Arquitectura documentada en `docs/ARCHITECTURE.md`
- [ ] User stories y roadmap en `docs/PRODUCT.md`

---

## Features Post-MVP (Roadmap Futuro)

### Fase 2 (Mes 2)

- [ ] Autenticación con NextAuth.js
- [ ] Favoritos/guardados de eventos
- [ ] Notificaciones de nuevos eventos (email)
- [ ] Más scrapers locales (objetivo: 10 fuentes)
- [ ] Migración a PostgreSQL (si >10K eventos)

### Fase 3 (Mes 3+)

- [ ] Recomendaciones personalizadas (ML básico)
- [ ] Integración con Spotify (artistas relacionados)
- [ ] Compartir eventos en redes sociales
- [ ] API pública para terceros
- [ ] Migración de scraping a Go (si >20 fuentes)

---

## Adenda: Mejoras Pendientes de Evaluación

> **Propósito**: Mejoras identificadas durante análisis de documentación (Noviembre 2025) que requieren decisión de producto antes de implementar.

### 🔴 Alta Prioridad

**1. Restricciones Técnicas No Documentadas**

**Problema**: No hay límites explícitos para capacidad SQLite, rate limits de APIs, política de retención de datos, ni usuarios concurrentes esperados.

**Impacto**: Sin límites claros, difícil estimar escalabilidad y costos operacionales.

**Acción Sugerida**: Agregar sección "Technical Constraints" después de "Core Features" (línea ~40) con:
- Límite de eventos en SQLite (ej: 50K eventos antes de migrar a PostgreSQL)
- Rate limits por fuente (Ticketmaster: 5000/día, Eventbrite: 1000/día)
- Retención de datos (ej: purgar eventos >90 días pasados)
- Capacidad concurrente (ej: 100 usuarios simultáneos en MVP)

**Referencia**: Línea 40

---

**2. Algoritmo de Deduplicación Vago (US3.3)**

**Problema**: Acceptance criteria dicen ">85% similar" sin especificar:
- Algoritmo exacto (¿Levenshtein distance? ¿Jaro-Winkler? ¿Fuzzy string matching?)
- Lógica AND/OR: ¿las 3 condiciones (título + fecha + venue) deben cumplirse TODAS o ALGUNA?
- Qué hacer con confianza 70-85% (¿ignorar? ¿revisión manual? ¿marcar como sospechoso?)

**Impacto**: Implementación ambigua puede causar falsos positivos/negativos en deduplicación.

**Acción Sugerida**: En US3.3 acceptance criteria, especificar:
```
- Usar Jaro-Winkler similarity para títulos (threshold: 0.85)
- Condiciones: (similarity_title > 0.85) AND (date_diff < 24h) AND (venue_match OR venue_similar > 0.7)
- Si 0.70 < similarity < 0.85: marcar como "posible duplicado" para revisión manual (post-MVP)
```

**Referencia**: Líneas 284-301

---

**3. Estrategia de Reintentos Incompleta (US3.1)**

**Problema**: Se menciona "retries con backoff" pero faltan detalles críticos:
- Número máximo de reintentos antes de marcar fuente como fallida
- Qué hacer con fallos parciales (ej: scrapeó 500 eventos, luego timeout en evento 501)
- Procedimiento de recovery cuando TODAS las fuentes fallan

**Impacto**: Sin estrategia clara, scraping puede ser frágil y datos inconsistentes.

**Acción Sugerida**: Agregar a US3.1 acceptance criteria:
```
- Retry strategy: 3 intentos con exponential backoff (2s, 4s, 8s)
- Fallos parciales: guardar eventos exitosos, loggear error con último índice procesado
- Si todas las fuentes fallan: enviar alerta, mantener eventos anteriores, reintentar en próximo cron
- Timeout por fuente: 30 segundos
```

**Referencia**: Líneas 240-260

---

### 🟡 Media Prioridad

**4. Conflicto de Prioridad: US3.0 vs Automatización**

**Problema**: US3.0 (scraping manual) es CRÍTICO, pero roadmap muestra automatización (GitHub Actions cron) en Fase 6 (Día 9), DESPUÉS de implementar UI (Fase 5). Esto crea confusión: ¿cómo buscan usuarios eventos si no hay scraping automático?

**Impacto**: Dependencia no clara puede causar retrasos o expectativas incorrectas.

**Acción Sugerida**: Clarificar en Roadmap Fase 2-4 que:
```
"Hasta Fase 6, scraping es manual vía endpoint /api/admin/scrape.
Ejecutar manualmente 1 vez antes de cada demo/test de UI."
```
O alternativamente: mover implementación de cron a Fase 3 (antes de UI).

**Referencia**: Líneas 186-238, 413-428

---

**5. US1.3 (Ordenamiento) Sin Acceptance Criteria**

**Problema**: US1.3 "Ordenamiento de resultados" aparece en Epic 1 pero no tiene user story dedicada con acceptance criteria. Falta especificar:
- Orden por defecto (¿fecha ascendente? ¿relevancia?)
- Opciones de ordenamiento disponibles (fecha, popularidad, precio)
- Si ordenamiento persiste en URL query params

**Impacto**: Implementación inconsistente o incompleta de funcionalidad básica.

**Acción Sugerida**:
- Opción A: Agregar US1.3 completa después de US1.2 (línea ~180) con AC detallados
- Opción B: Mover a "Post-MVP" si no es crítico para lanzamiento

**Referencia**: Línea 52

---

**6. Lógica de Persistencia de Preferencias Ambigua (US3.4/3.5)**

**Problema**: Cuando preferencias cambian y activan `needsRescraping=true`, no está claro:
- ¿Eventos existentes se re-evalúan contra nuevas reglas y se purgan si ya no cumplen?
- Nuevo scraping: ¿REEMPLAZA todos los eventos o AGREGA/MERGE con existentes?
- ¿Qué pasa si usuario amplía scope (más géneros) y luego lo reduce de nuevo?

**Impacto**: Comportamiento inesperado en datos, posible confusión de usuarios.

**Acción Sugerida**: En US3.5 acceptance criteria, especificar estrategia de migración:
```
Opción A (REPLACE): Purgar todos eventos, rescrape completo
Opción B (APPEND): Mantener eventos existentes, agregar nuevos que cumplan nuevas reglas
Opción C (MERGE): Re-evaluar existentes, purgar los que no cumplen, agregar nuevos
```
Recomendar Opción C para mejor UX.

**Referencia**: Líneas 304-357

---

### 🟢 Baja Prioridad

**7. Edge Cases Faltantes en Búsqueda (US1.1)**

**Problema**: Buena cobertura de AC pero faltan casos edge:
- Caracteres especiales en nombres de bandas (ej: "AC/DC", "C#", "Mötley Crüe")
- Stopwords en búsqueda ("The Rolling Stones" vs "Rolling Stones")
- Límite máximo de caracteres en query (prevención DoS)

**Impacto**: Búsquedas pueden fallar o ser vulnerables a abuso.

**Acción Sugerida**: Agregar 2-3 AC a US1.1:
```
- Búsqueda normaliza caracteres especiales (/ → espacio, acentos removidos)
- Stopwords ignorados en matching ("the", "a", "an", "los", "las")
- Max length de búsqueda: 100 caracteres (retornar 400 Bad Request si excede)
```

**Referencia**: Líneas 118-137

---

## Notas de Implementación

- **Prioridad de revisión**: Abordar items 🔴 Alta antes de Fase 2 de implementación
- **Items 🟡 Media**: Resolver antes de Fase 4 (UI)
- **Items 🟢 Baja**: Evaluar durante code review o post-MVP
- **Actualizar esta adenda**: Marcar items resueltos y agregar fecha de resolución

---

**Última actualización**: Noviembre 2025
