# Product Documentation - EnVivo

## Tabla de Contenidos

1. [Features del MVP](#features-del-mvp)
2. [Estrategia: Vertical Slices](#estrategia-vertical-slices)
3. [Roadmap de Implementación](#roadmap-de-implementación)
4. [Épicas y User Stories](#épicas-y-user-stories)
5. [Definición de Terminado (General)](#definición-de-terminado-general)
6. [Métricas de Éxito](#métricas-de-éxito)
7. [Checklist Pre-Launch](#checklist-pre-launch)

---

## Features del MVP

### Core Features (Must-Have)

Ordenadas por criticidad desde perspectiva de **Vertical Slices** - fundamentos técnicos primero, UX después. La columna "Fase Planificada" indica el orden lógico de implementación en roadmap, NO el estado actual de desarrollo.

| Feature | Descripción | Prioridad | Fase Planificada |
|---------|-------------|-----------|------------------|
| **Primera fuente de datos** | Integración con APIs argentinas (AllAccess, EventBrite) | 🔴 CRÍTICO | Fase 1 |
| **UI básica de eventos** | Listado de eventos con información esencial (título, fecha, venue, ciudad, imagen) | 🔴 CRÍTICO | Fase 1 |
| **Validación de datos** | Reglas de negocio para calidad (fechas válidas, ubicación, campos requeridos) | 🔴 CRÍTICO | Fase 2 |
| **Deduplicación inteligente** | Detectar duplicados con fuzzy matching entre todas las fuentes | 🔴 CRÍTICO | Fase 2 |
| **Búsqueda por texto** | Buscar eventos por título, artista o venue | 🔴 CRÍTICO | Fase 3 |
| **Filtros combinables** | Filtrar por ciudad, fecha, categoría (combinables y persistentes en URL) | 🔴 CRÍTICO | Fase 3 |
| **Múltiples fuentes** | LivePass + mínimo 2 sitios locales scrapeados | 🟡 IMPORTANTE | Fase 4 |
| **Ocultar eventos** | Usuarios pueden eliminar eventos no deseados (no regresan en scrapings) | 🟡 IMPORTANTE | Fase 5 |
| **Detalle de evento** | Página con información completa + link directo a compra de entradas | 🔴 CRÍTICO | Fase 6 |
| **Actualización automática** | Scraping diario automático con cron job | 🔴 CRÍTICO | Fase 7 |
| **Deploy en producción** | Vercel con CI/CD automático desde GitHub | 🔴 CRÍTICO | Fase 7 |
| **Experiencia pulida** | Tests E2E, responsive design, loading states, optimización de performance | 🟡 IMPORTANTE | Fase 8 |

### 🚫 NO Incluir en MVP (Post-MVP)

#### Features de Usuario

| Feature | Por qué NO en MVP | Cuándo Agregar |
|---------|-------------------|----------------|
| Cuentas de usuario | No es necesario para búsqueda básica | Fase 2 (Mes 2) |
| Favoritos/guardados | Requiere autenticación | Fase 2 |
| Notificaciones | Requiere usuarios + infraestructura | Fase 3 |
| Recomendaciones personalizadas | Requiere ML + historial | Fase 3 |
| Integración Spotify | Nice-to-have, no core | Fase 2-3 |
| Compra de entradas directa | Complejidad legal/financiera | Nunca (links externos OK) |

#### Features Técnicas (Schema Extensions)

| Feature Técnica | Tablas DB | Por qué NO en MVP | Cuándo Agregar |
|-----------------|-----------|-------------------|----------------|
| Normalización de venues | `Venue`, `VenueMetadata` | Eventos con string simple funcionan para MVP | Cuando necesites búsqueda por venue o mapas |
| Extracción de artistas | `Artist`, `EventArtist` | Complejidad de parsing, no crítico para búsqueda por título | Cuando necesites "seguir artista" o filtro por artista |
| Filtro por capacidad de venue | `Venue.capacity` | APIs no siempre proveen capacidad | Junto con normalización de venues |
| Geolocalización | `Venue.latitude/longitude` | Requiere geocoding API (costos adicionales) | Para feature de mapa de eventos |

> **Estado Actual**: Tablas `Venue`, `VenueMetadata`, `Artist`, `EventArtist` existen en schema pero están **vacías** - `PrismaEventRepository` guarda eventos con datos planos (sin normalización). Ver `src/features/events/data/repositories/PrismaEventRepository.ts:176-181` (TODOs).

---

## Estrategia: Vertical Slices

### Enfoque: Features End-to-End con Valor Inmediato

En lugar de implementar horizontalmente por capas (toda la capa de datos, luego lógica, luego UI), seguimos **vertical slices** - implementar features completas end-to-end que proveen valor inmediato a los usuarios.

**Ventajas**:
- ✅ **Valor inmediato**: algo funcional en 1-2 días (no 10 días)
- ✅ **Feedback rápido**: UI con datos reales desde la primera fase
- ✅ **Menos overhead**: no implementar infraestructura compleja hasta que sea necesaria
- ✅ **Deployable**: cada fase puede ir a producción
- ✅ **Testeable**: cada slice incluye sus tests

**Ejemplo**: En lugar de implementar TODOS los scrapers, luego TODA la UI, luego TODOS los filtros...
- **Fase 1**: Fuente API → BD → UI básica → **Funciona end-to-end**
- **Fase 2**: Agregar calidad de datos → **Funciona mejor**
- **Fase 3**: Agregar búsqueda → **Funciona con búsqueda**

Cada fase entrega **valor real** que se puede mostrar a usuarios.

---

### Criticidad desde Enfoque Vertical

En **vertical slices**, la criticidad no solo viene del valor inmediato al usuario, sino de **construir fundamentos sólidos** que permitan escalar sin reescribir todo.

**Orden de Criticidad**:

**🔴 Fase 1-2 (Fundamentos Técnicos - CRÍTICO)**
- Primera fuente de datos + UI básica
- Validación y deduplicación de datos

**¿Por qué son críticas?**
- ❌ **Sin validación**: Basura en BD (fechas inválidas, ubicaciones vacías, eventos sin información)
- ❌ **Sin deduplicación**: Cuando agregues LivePass (Fase 4), usuarios verán duplicados
- ✅ **Fundamentos primero**: Construir sobre base sólida = menos refactoring después

**🔴 Fase 3, 6-7 (UX y Producción - CRÍTICO)**
- Búsqueda + Filtros (encontrar eventos)
- Detalle de evento (información completa)
- Deploy + Scraping automático (MVP en producción)

**¿Por qué son críticas?**
- Sin búsqueda/filtros → MVP no usable (scroll infinito)
- Sin deploy → No hay producto
- Sin scraping automático → Datos obsoletos en días

**🟡 Fase 4, 5 y 8 (Mejoras - IMPORTANTE)**
- Múltiples fuentes (más eventos)
- Ocultar eventos (curación personalizada)
- Pulido final (responsive, tests E2E, optimización)

**¿Por qué importantes pero no críticas?**
- AllAccess y EventBrite cubren ~60% de eventos en Argentina
- UX básica funcional es suficiente para validar MVP

**Conclusión**: Calidad de datos (Fase 2) antes que UX avanzada (Fase 3) = Menos problemas después.

---

## Roadmap de Implementación

> **Estado Actual**: MVP funcional (90% completado). Fases 0-7 completadas, Fase 8 (Producción) en progreso.

Fases del MVP organizadas para entregar valor incremental a usuarios.

---

### Roadmap: Mapa de User Stories por Fase

| Fase | US Implementadas | Valor Entregado | Estado |
|------|------------------|-----------------|--------|
| Fase 0 | Setup | Proyecto corriendo | ✅ Completada |
| Fase 1 | US1.0, US2.0 | Ver eventos en UI | ✅ Completada |
| Fase 2 | US3.1 | Sin duplicados, eventos válidos | ✅ Completada |
| Fase 3 | US1.3, US1.4 | Búsqueda y filtros | ✅ Completada |
| Fase 4 | US1.1, US1.2 | 5 fuentes activas | ✅ Completada |
| Fase 5 | US3.2 | Ocultar eventos (blacklist) | ✅ Completada |
| Fase 6 | US2.1 | Detalle + compra | ✅ Completada |
| Fase 7 | Tests | 278+ tests, >80% coverage | ✅ Completada |
| Fase 8 | US3.0 | Deploy + scraping automático | 🚧 En progreso |
| Fase 9 | Pulido | Lighthouse >90, UX polish | ⏳ Pendiente |

---

### Fase 0: Setup & Configuración ✅

**Objetivo**: Proyecto corriendo con infraestructura básica

**Entregable**: `npm run dev` funciona, estructura creada, Prisma configurado

**Estado**: ✅ COMPLETADA

---

### Fase 1: Ver Eventos de APIs Argentinas ✅

**Objetivo**: Primera fuente de datos funcionando end-to-end

**User Stories Implementadas**:
- US1.0: Ver eventos de fuentes argentinas ✅
- US2.0: Ver información básica ✅

**Valor Entregado**: Los usuarios pueden ver eventos de APIs argentinas en una UI responsive

**Estado**: ✅ COMPLETADA

---

### Fase 2: Calidad de Datos ✅

**Objetivo**: Solo eventos válidos y sin duplicados

**User Stories Implementadas**:
- US3.1: Eventos de calidad (sin duplicados, validados) ✅

**Valor Entregado**: Usuarios ven eventos limpios, sin duplicados entre fuentes, solo información válida

**Implementado**:
- Validación multi-capa (campos + fechas + ubicación + preferencias globales)
- Deduplicación con fuzzy matching + `shouldUpdate()` inteligente
- Tests de business rules (>80% coverage)

**Estado**: ✅ COMPLETADA

---

### Fase 3: Búsqueda y Filtros ✅

**Objetivo**: Usuarios encuentran exactamente lo que buscan

**User Stories Implementadas**:
- US1.3: Buscar eventos por texto ✅
- US1.4: Filtrar eventos ✅

**Valor Entregado**: Encontrar eventos específicos en segundos, filtrar por ciudad/fecha/categoría

**Estado**: ✅ COMPLETADA

---

### Fase 4: Más Fuentes de Datos ✅

**Objetivo**: Mayor cobertura de eventos

**User Stories Implementadas**:
- US1.1: Ver eventos de LivePass ✅
- US1.2: Ver eventos de sitios locales ✅

**Valor Entregado**: 5 fuentes de datos activas:
1. **AllAccess** - Ticketera principal (JSON scraping + detalles)
2. **LivePass** - Café Berlín y venues locales
3. **Movistar Arena** - Eventos grandes (Puppeteer)
4. **Teatro Coliseo** - Teatro y conciertos
5. **Teatro Vorterix** - Rock y música alternativa

**Estado**: ✅ COMPLETADA

---

### Fase 5: Curación de Contenido ✅

**Objetivo**: Usuarios pueden ocultar eventos no deseados

**User Stories Implementadas**:
- US3.2: Ocultar eventos no deseados ✅

**Valor Entregado**: Usuarios pueden personalizar su feed eliminando eventos que no les interesan

**Implementado**:
- Tabla `EventBlacklist` (source + externalId)
- `AdminService.deleteEventAndBlacklist()`
- Filtrado en scraping contra blacklist

**Estado**: ✅ COMPLETADA

---

### Fase 6: Información Completa ✅

**Objetivo**: Toda la información para decidir asistir

**User Stories Implementadas**:
- US2.1: Ver información completa y comprar entradas ✅

**Valor Entregado**: Página de detalle con SEO dinámico + link a compra

**Implementado**:
- `src/app/eventos/[id]/page.tsx`
- Metadata dinámico para SEO
- Link externo a compra

**Estado**: ✅ COMPLETADA

---

### Fase 7: Testing ✅

**Objetivo**: Cobertura de tests adecuada

**Valor Entregado**: Suite de tests robusta

**Implementado**:
- 278+ tests passing (Vitest + Playwright)
- >80% coverage en Domain layer
- Tests E2E de flujos críticos
- CI pipeline con fail-fast

**Estado**: ✅ COMPLETADA

---

### Fase 8: Producción 🚧

**Objetivo**: MVP en producción con actualización automática

**User Stories a Implementar**:
- US3.0: Eventos se actualizan automáticamente

**Pendiente**:
- [ ] Deploy a Vercel
- [ ] Configurar BD remota (Turso)
- [ ] GitHub Action para scraping diario (cron 2 AM)
- [ ] Logging estructurado (Pino)

**En progreso**:
- Migración documentada (VERCEL_MIGRATION.md)
- BD compatible con Turso (libsql)

**Estado**: 🚧 EN PROGRESO (30% completado)

---

### Fase 9: Pulido Final ⏳

**Objetivo**: Experiencia pulida y optimizada

**Valor Entregado**: MVP listo para usuarios reales

**Pendiente**:
- [ ] Lighthouse audit + optimizaciones (>90)
- [ ] UI polish (loading states, animaciones)
- [ ] Error boundaries completos
- [ ] PWA support (opcional)

**Estado**: ⏳ PENDIENTE

---

## Épicas y User Stories

Organizadas por valor entregado a usuarios. Cada fuente de datos es una user story independiente que agrega eventos al catálogo.

---

### Epic 1: Descubrir Eventos Musicales

**Objetivo**: Los usuarios pueden descubrir eventos musicales de múltiples fuentes y encontrar exactamente lo que buscan.

#### US1.0: Ver Eventos de Múltiples Fuentes (Fase 1)

**Como** usuario
**Quiero** ver eventos de conciertos y festivales de múltiples fuentes (APIs y scrapers)
**Para** descubrir shows internacionales, locales y eventos en venues grandes

**Valor**: Acceso a catálogo amplio de eventos musicales en Argentina (ver fuentes en [../README.md](../README.md#fuentes-de-datos-activas))

**Criterios de Aceptación**:
- [ ] Puedo ver lista de eventos de APIs argentinas en la página principal
- [ ] Cada evento muestra: título, fecha, venue, ciudad, imagen
- [ ] Los eventos están ordenados por fecha (próximos primero)
- [ ] Si hay imagen disponible, se muestra correctamente
- [ ] Puedo hacer clic en un evento para ver más detalles

**Prioridad**: 🔴 CRÍTICO

---

#### US1.1: Ver Eventos de LivePass (Fase 4) ✅

**Como** usuario
**Quiero** ver eventos de LivePass
**Para** descubrir shows locales, eventos pequeños e independientes que no están en APIs principales

**Valor**: Acceso a eventos locales y de nicho que no aparecen en plataformas grandes

**Criterios de Aceptación**:
- [x] Puedo ver eventos de LivePass mezclados con eventos de otras fuentes ✅
- [x] No veo eventos duplicados entre LivePass y otras APIs ✅
- [x] Los eventos de LivePass tienen la misma calidad de información ✅
- [x] El sistema actualiza eventos de LivePass automáticamente ✅

**Prioridad**: 🟡 IMPORTANTE | **Estado**: ✅ COMPLETADA

---

#### US1.2: Ver Eventos de Sitios Locales (Fase 4) ✅

**Como** usuario
**Quiero** ver eventos de venues locales (ej: Movistar Arena, Teatro Coliseo, Teatro Vorterix)
**Para** descubrir shows exclusivos que solo se anuncian en sitios de los venues

**Valor**: Cobertura completa incluyendo eventos que solo se promocionan localmente

**Criterios de Aceptación**:
- [x] Puedo ver eventos de mínimo 2 sitios locales ✅ (actualmente 4: LivePass, Movistar Arena, Coliseo, Vorterix)
- [x] Los eventos locales se mezclan con otras fuentes sin duplicarse ✅
- [x] La información es consistente (fecha, hora, venue validados) ✅

**Prioridad**: 🟡 IMPORTANTE | **Estado**: ✅ COMPLETADA

---

#### US1.3: Buscar Eventos por Texto (Fase 3)

**Como** usuario
**Quiero** buscar eventos por nombre de artista o título
**Para** encontrar rápidamente shows específicos que me interesan

**Valor**: Encontrar eventos específicos en segundos sin scroll manual

**Criterios de Aceptación**:
- [ ] Puedo escribir texto en barra de búsqueda (artista, título, venue)
- [ ] Los resultados se actualizan al presionar Enter o botón "Buscar"
- [ ] Búsqueda funciona con y sin acentos (ej: "Metallica" = "Metállica")
- [ ] Búsqueda es case-insensitive
- [ ] Si escribo menos de 2 caracteres, se muestra mensaje de ayuda
- [ ] Se muestra conteo total de resultados encontrados

**Prioridad**: 🔴 CRÍTICO

---

#### US1.4: Filtrar Eventos (Fase 3)

**Como** usuario
**Quiero** filtrar eventos por ciudad, fecha y categoría
**Para** ver solo eventos relevantes a mis preferencias

**Valor**: Reducir ruido y enfocarse en eventos de interés personal

**Criterios de Aceptación**:
- [ ] Puedo seleccionar ciudad desde un dropdown
- [ ] Puedo seleccionar rango de fechas con date picker
- [ ] Puedo filtrar por tipo (Concierto, Festival, Teatro, etc.)
- [ ] Los filtros se pueden combinar (ej: Buenos Aires + Conciertos + Este mes)
- [ ] Puedo limpiar todos los filtros con un botón
- [ ] Los filtros persisten en URL (puedo compartir link con filtros aplicados)

**Prioridad**: 🔴 CRÍTICO

---

### Epic 2: Ver Información de Eventos

**Objetivo**: Los usuarios pueden acceder a toda la información necesaria para decidir asistir a un evento.

#### US2.0: Ver Información Básica (Fase 1)

**Como** usuario
**Quiero** ver información esencial de cada evento en el listado
**Para** identificar rápidamente eventos que me interesan

**Valor**: Vista rápida de eventos sin navegar a detalles

**Criterios de Aceptación**:
- [ ] Cada evento muestra: título, fecha, venue, ciudad
- [ ] Se muestra imagen del evento (o placeholder si no disponible)
- [ ] Puedo ver la lista completa de eventos disponibles
- [ ] Los eventos están ordenados por fecha (próximos primero)

**Prioridad**: 🔴 CRÍTICO

---

#### US2.1: Ver Información Completa y Comprar Entradas (Fase 6) ✅

**Como** usuario
**Quiero** ver todos los detalles de un evento y poder comprar entradas
**Para** tener toda la información necesaria y acceder a la compra en un solo lugar

**Valor**: Información completa + acceso directo a compra de entradas

**Criterios de Aceptación**:
- [x] Puedo hacer clic en un evento para ver página de detalle completa ✅
- [x] Veo: título, fecha completa (día/hora), venue, dirección, descripción ✅
- [x] Veo precio de entradas (si disponible) ✅
- [x] Veo artistas participantes (si disponible) ✅
- [x] Hay botón "Comprar Entradas" que abre link externo en nueva pestaña ✅
- [x] Si el evento no existe, veo página 404 clara ✅
- [x] Puedo volver al listado desde el detalle ✅

**Prioridad**: 🔴 CRÍTICO | **Estado**: ✅ COMPLETADA

---

### Epic 3: Datos Siempre Actualizados y de Calidad

**Objetivo**: Los usuarios siempre ven información actualizada, sin eventos pasados ni duplicados.

#### US3.0: Eventos se Actualizan Automáticamente (Fase 6)

**Como** usuario
**Quiero** que los eventos se actualicen automáticamente cada día
**Para** siempre ver información fresca sin eventos pasados

**Valor**: Información confiable sin intervención manual

**Criterios de Aceptación**:
- [ ] Los eventos nuevos aparecen automáticamente cada día
- [ ] Los eventos pasados desaparecen de la lista principal
- [ ] No veo eventos cancelados o con información desactualizada
- [ ] La actualización ocurre sin interrumpir el servicio

**Prioridad**: 🔴 CRÍTICO

---

#### US3.1: Eventos de Calidad (Sin Duplicados, Validados) (Fase 2)

**Como** usuario
**Quiero** ver solo eventos válidos y sin duplicados
**Para** no confundirme con información repetida o incorrecta

**Valor**: Experiencia limpia y confiable

**Criterios de Aceptación**:
- [ ] No veo el mismo evento repetido de diferentes fuentes
- [ ] No veo eventos sin información básica (título, fecha, venue)
- [ ] No veo eventos en países fuera de alcance (solo Argentina en MVP)
- [ ] La información mostrada es consistente y completa

**Prioridad**: 🔴 CRÍTICO

---

#### US3.2: Ocultar Eventos No Deseados (Fase 5) ✅

**Como** usuario
**Quiero** poder ocultar eventos que no me interesan
**Para** personalizar mi feed y no volver a verlos en futuros scrapings

**Valor**: Curación personalizada del contenido sin intervención manual

**Criterios de Aceptación**:
- [x] Cada evento tiene un botón "Ocultar" o ícono de eliminar ✅
- [x] Al hacer clic en "Ocultar", el evento desaparece inmediatamente de la lista ✅
- [x] El evento no vuelve a aparecer en el siguiente scraping automático ✅
- [x] Si cambio de filtros o hago búsquedas, los eventos ocultos permanecen ocultos ✅
- [x] La acción es permanente hasta que decida restaurarlo (post-MVP) ✅
- [x] Recibo confirmación visual cuando oculto un evento ✅

**Prioridad**: 🟡 IMPORTANTE | **Estado**: ✅ COMPLETADA

**Implementación Técnica** (Blacklist):
- Tabla `EventBlacklist` con `source + externalId` de eventos eliminados
- Hard delete del evento en tabla `Event`
- Filtrado contra blacklist en scraping
- `AdminService.deleteEventAndBlacklist()`
- Endpoint `POST /api/admin/events/cleanup` para limpieza masiva

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

## Métricas de Éxito

### Objetivos Técnicos (Estado Actual)

| Métrica | Objetivo | Estado Actual |
|---------|----------|---------------|
| **Tests passing** | 100% | ✅ 278+ tests passing |
| **Coverage Domain** | >80% | ✅ ~85% |
| **TypeScript errors** | 0 | ✅ 0 |
| **Lint warnings** | 0 | ✅ 0 |
| **Fuentes activas** | 3+ | ✅ 5 fuentes |
| **Búsqueda latencia** | <500ms | ✅ ~200ms |

### Objetivos de Producción (Pendientes)

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| **Disponibilidad** | >99% uptime | ⏳ No en producción |
| **Scraping** | Diario automático | ⏳ Manual |
| **Catálogo** | >500 eventos activos | ⏳ Variable |

### KPIs de Negocio (Post-MVP)

| KPI | Objetivo (Mes 1) |
|-----|------------------|
| Búsquedas realizadas | 50+ por día |
| Eventos visualizados | 200+ por día |
| Usuarios únicos | 100+ por mes |

---

## Checklist Pre-Launch

### Funcionalidad para Usuarios

- [x] Puedo ver eventos de 5 fuentes argentinas en la página principal ✅
- [x] Puedo buscar eventos por texto ✅
- [x] Puedo filtrar por ciudad, fecha y categoría ✅
- [x] Puedo ver detalle completo de un evento ✅
- [x] Puedo acceder a compra de entradas (link externo) ✅
- [x] No veo eventos duplicados ✅
- [x] Puedo ocultar eventos no deseados ✅
- [x] No veo eventos pasados (endpoint cleanup disponible) ✅
- [ ] Los eventos se actualizan automáticamente cada día (pendiente cron)

### Experiencia de Usuario

- [x] El sitio funciona en desktop, tablet y mobile ✅
- [x] Las imágenes cargan rápido ✅
- [x] La búsqueda responde en menos de 1 segundo ✅
- [x] Puedo navegar el sitio completamente con teclado ✅
- [x] Los colores y textos son legibles ✅

### Infraestructura (Pendientes para Producción)

- [ ] Deploy a Vercel
- [ ] BD remota configurada (Turso)
- [ ] GitHub Action con cron diario
- [ ] Logging estructurado (Pino)

---

## Features Post-MVP (Roadmap Futuro)

### Mes 2-3

- **Autenticación y Cuentas**: Registrarse para guardar favoritos
- **Favoritos**: Guardar eventos para revisar después
- **Notificaciones**: Recibir email cuando hay eventos nuevos de interés
- **Más Fuentes**: Agregar 5-10 sitios locales adicionales
- **Recomendaciones**: Sugerencias personalizadas basadas en historial

### Mes 4+

- **Integración Spotify**: Ver eventos de artistas que sigo en Spotify
- **Compartir en Redes**: Compartir eventos en Instagram, Twitter
- **API Pública**: Permitir a terceros acceder a los datos
- **App Móvil**: Versión nativa para iOS/Android

---

**Última actualización**: Diciembre 2025
