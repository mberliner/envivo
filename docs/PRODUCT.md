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
| **Primera fuente de datos** | Integración con Ticketmaster API | 🔴 CRÍTICO | Fase 1 |
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

> **Nota**: Ver `roadmap_imple.md` para tracking detallado del estado actual de implementación.

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
- **Fase 1**: Ticketmaster → BD → UI básica → **Funciona end-to-end**
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
- Ticketmaster ya cubre ~60% de eventos en Argentina
- UX básica funcional es suficiente para validar MVP

**Conclusión**: Calidad de datos (Fase 2) antes que UX avanzada (Fase 3) = Menos problemas después.

---

## Roadmap de Implementación

Fases del MVP organizadas para entregar valor incremental a usuarios.

---

### Roadmap: Mapa de User Stories por Fase

| Fase | US Implementadas | Valor Entregado |
|------|------------------|-----------------|
| Fase 1 | US1.0 (Ticketmaster)<br>US2.0 (Info básica) | Ver eventos de Ticketmaster en UI |
| Fase 2 | US3.1 (Calidad datos) | Sin duplicados, eventos válidos |
| Fase 3 | US1.3 (Búsqueda)<br>US1.4 (Filtros) | Encontrar eventos específicos |
| Fase 4 | US1.1 (LivePass)<br>US1.2 (Sitios locales) | Más cobertura de eventos |
| Fase 5 | US3.2 (Ocultar eventos) | Curar contenido personalizado |
| Fase 6 | US2.1 (Info completa) | Detalles + compra de entradas |
| Fase 7 | US3.0 (Actualización auto) | Datos siempre frescos |
| Fase 8 | (Pulido y optimización) | Experiencia pulida |

---

### Fase 0: Setup & Configuración

**Objetivo**: Proyecto corriendo con infraestructura básica

**Entregable**: `npm run dev` funciona, estructura creada, Prisma configurado

---

### Fase 1: Ver Eventos de Ticketmaster (1-2 días)

**Objetivo**: Primera fuente de datos funcionando end-to-end

**User Stories a Implementar**:
- US1.0: Ver eventos de Ticketmaster
- US2.0: Ver información básica

**Valor Entregado**: Los usuarios podrán ver eventos de Ticketmaster Argentina en una UI responsive

**Tareas**:
- Integración con API de Ticketmaster
- Modelo de datos (Prisma schema)
- Repository para eventos
- UI básica con listado de eventos
- Tests unitarios de repositorio y mappers

---

### Fase 2: Calidad de Datos (1 día)

**Objetivo**: Solo eventos válidos y sin duplicados

**User Stories a Implementar**:
- US3.1: Eventos de calidad (sin duplicados, validados)

**Valor Entregado**: Usuarios ven eventos limpios, sin duplicados entre fuentes, solo información válida

**Tareas**:
- Implementar validación de datos (fechas, campos requeridos, países)
- Implementar deduplicación (fuzzy matching entre fuentes)
- Tests de business rules (>80% coverage)

---

### Fase 3: Búsqueda y Filtros (1-2 días)

**Objetivo**: Usuarios encuentran exactamente lo que buscan

**User Stories a Implementar**:
- US1.3: Buscar eventos por texto
- US1.4: Filtrar eventos

**Valor Entregado**: Encontrar eventos específicos en segundos, filtrar por ciudad/fecha/categoría

**Tareas**:
- Implementar búsqueda por texto (full-text search)
- Implementar filtros combinables (ciudad, fecha, categoría)
- Persistir filtros en URL
- Tests de búsqueda y filtros

---

### Fase 4: Más Fuentes de Datos (1-2 días)

**Objetivo**: Mayor cobertura de eventos

**User Stories a Implementar**:
- US1.1: Ver eventos de LivePass
- US1.2: Ver eventos de sitios locales

**Valor Entregado**: Acceso a eventos locales y de nicho que no están en Ticketmaster

**Tareas**:
- Implementar integración con LivePass API
- Implementar scraper de 1-2 sitios locales
- Verificar deduplicación entre todas las fuentes
- Tests de nuevas fuentes

---

### Fase 5: Curación de Contenido (1 día)

**Objetivo**: Usuarios pueden ocultar eventos no deseados y evitar que regresen

**User Stories a Implementar**:
- US3.2: Ocultar eventos no deseados

**Valor Entregado**: Los usuarios pueden personalizar su feed eliminando eventos que no les interesan

**Tareas**:
- Crear tabla `EventBlacklist` en Prisma schema
- Implementar API DELETE `/api/events/:id`
- Agregar botón de eliminación en EventCard UI
- Modificar lógica de scraping para filtrar eventos bloqueados
- Tests de eliminación y persistencia

---

### Fase 6: Información Completa (1 día)

**Objetivo**: Toda la información para decidir asistir

**User Stories a Implementar**:
- US2.1: Ver información completa y comprar entradas

**Valor Entregado**: Detalles completos del evento + acceso directo a compra

**Tareas**:
- Página de detalle de evento
- Botón de compra (link externo)
- Link "Volver a resultados"
- Tests E2E básicos (navegación)

---

### Fase 7: Actualización Automática (1 día)

**Objetivo**: Datos siempre frescos sin intervención manual

**User Stories a Implementar**:
- US3.0: Eventos se actualizan automáticamente

**Valor Entregado**: Usuarios siempre ven información actualizada

**Tareas**:
- GitHub Action con cron diario (2 AM UTC)
- Deploy a Vercel
- Verificar scraping automático funciona
- Logs estructurados

---

### Fase 8: Pulido Final (1 día)

**Objetivo**: Experiencia pulida y optimizada

**Valor Entregado**: MVP listo para usuarios reales

**Tareas**:
- Tests E2E de flujos críticos
- Error boundaries y loading states
- Responsive design (mobile/tablet)
- Optimización de imágenes
- Performance audit (Lighthouse >90)

---

## Épicas y User Stories

Organizadas por valor entregado a usuarios. Cada fuente de datos es una user story independiente que agrega eventos al catálogo.

---

### Epic 1: Descubrir Eventos Musicales

**Objetivo**: Los usuarios pueden descubrir eventos musicales de múltiples fuentes y encontrar exactamente lo que buscan.

#### US1.0: Ver Eventos de Ticketmaster (Fase 1)

**Como** usuario
**Quiero** ver eventos de conciertos y festivales de Ticketmaster Argentina
**Para** descubrir shows internacionales y eventos en venues grandes

**Valor**: Acceso a catálogo internacional de eventos musicales en Argentina

**Criterios de Aceptación**:
- [ ] Puedo ver lista de eventos de Ticketmaster en la página principal
- [ ] Cada evento muestra: título, fecha, venue, ciudad, imagen
- [ ] Los eventos están ordenados por fecha (próximos primero)
- [ ] Si hay imagen disponible, se muestra correctamente
- [ ] Puedo hacer clic en un evento para ver más detalles

**Prioridad**: 🔴 CRÍTICO

---

#### US1.1: Ver Eventos de LivePass (Fase 4)

**Como** usuario
**Quiero** ver eventos de LivePass
**Para** descubrir shows locales, eventos pequeños e independientes que no están en Ticketmaster

**Valor**: Acceso a eventos locales y de nicho que no aparecen en plataformas grandes

**Criterios de Aceptación**:
- [ ] Puedo ver eventos de LivePass mezclados con eventos de otras fuentes
- [ ] No veo eventos duplicados entre LivePass y Ticketmaster
- [ ] Los eventos de LivePass tienen la misma calidad de información
- [ ] El sistema actualiza eventos de LivePass automáticamente

**Prioridad**: 🟡 IMPORTANTE

---

#### US1.2: Ver Eventos de Sitios Locales (Fase 4)

**Como** usuario
**Quiero** ver eventos de venues locales (ej: Niceto Club, C Complejo Art Media)
**Para** descubrir shows exclusivos que solo se anuncian en sitios de los venues

**Valor**: Cobertura completa incluyendo eventos que solo se promocionan localmente

**Criterios de Aceptación**:
- [ ] Puedo ver eventos de mínimo 2 sitios locales
- [ ] Los eventos locales se mezclan con otras fuentes sin duplicarse
- [ ] La información es consistente (fecha, hora, venue validados)

**Prioridad**: 🟡 IMPORTANTE

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

#### US2.1: Ver Información Completa y Comprar Entradas (Fase 5)

**Como** usuario
**Quiero** ver todos los detalles de un evento y poder comprar entradas
**Para** tener toda la información necesaria y acceder a la compra en un solo lugar

**Valor**: Información completa + acceso directo a compra de entradas

**Criterios de Aceptación**:
- [ ] Puedo hacer clic en un evento para ver página de detalle completa
- [ ] Veo: título, fecha completa (día/hora), venue, dirección, descripción
- [ ] Veo precio de entradas (si disponible)
- [ ] Veo artistas participantes (si disponible)
- [ ] Hay botón "Comprar Entradas" que abre link externo en nueva pestaña
- [ ] Si el evento no existe, veo página 404 clara
- [ ] Puedo volver al listado desde el detalle

**Prioridad**: 🔴 CRÍTICO

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

#### US3.2: Ocultar Eventos No Deseados (Fase 5)

**Como** usuario
**Quiero** poder ocultar eventos que no me interesan
**Para** personalizar mi feed y no volver a verlos en futuros scrapings

**Valor**: Curación personalizada del contenido sin intervención manual

**Criterios de Aceptación**:
- [ ] Cada evento tiene un botón "Ocultar" o ícono de eliminar
- [ ] Al hacer clic en "Ocultar", el evento desaparece inmediatamente de la lista
- [ ] El evento no vuelve a aparecer en el siguiente scraping automático
- [ ] Si cambio de filtros o hago búsquedas, los eventos ocultos permanecen ocultos
- [ ] La acción es permanente hasta que decida restaurarlo (post-MVP)
- [ ] Recibo confirmación visual cuando oculto un evento

**Prioridad**: 🟡 IMPORTANTE

**Implementación Técnica** (Opción 3 - Blacklist):
- Tabla `EventBlacklist` que guarda `source + externalId` de eventos eliminados
- Hard delete del evento en tabla `Event`
- Antes de procesar eventos en scraping, filtrar contra blacklist
- API endpoint DELETE `/api/events/:id` para eliminar desde UI

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

### Objetivos del MVP

| Métrica | Objetivo | Propósito |
|---------|----------|-----------|
| **Performance** | Búsqueda <500ms | Experiencia rápida y fluida |
| **Disponibilidad** | >99% uptime | Servicio siempre accesible |
| **Catálogo** | >500 eventos activos | Oferta amplia de eventos |
| **Actualización** | Diaria automática | Información siempre fresca |
| **Calidad** | Sin duplicados visibles | Experiencia limpia |

###KPIs de Negocio (Post-MVP)

| KPI | Objetivo (Mes 1) |
|-----|------------------|
| Búsquedas realizadas | 50+ por día |
| Eventos visualizados | 200+ por día |
| Usuarios únicos | 100+ por mes |

---

## Checklist Pre-Launch

### Funcionalidad para Usuarios

- [x] Puedo ver eventos de Ticketmaster en la página principal ✅
- [x] Puedo buscar eventos por texto ✅
- [x] Puedo filtrar por ciudad, fecha y categoría ✅
- [x] Puedo ver detalle completo de un evento ✅
- [x] Puedo acceder a compra de entradas (link externo) ✅
- [ ] Los eventos se actualizan automáticamente cada día
- [x] No veo eventos duplicados ✅
- [ ] No veo eventos pasados en el listado principal

### Experiencia de Usuario

- [x] El sitio funciona en desktop, tablet y mobile ✅
- [x] Las imágenes cargan rápido ✅
- [x] La búsqueda responde en menos de 1 segundo ✅
- [x] Puedo navegar el sitio completamente con teclado ✅
- [x] Los colores y textos son legibles ✅

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

**Última actualización**: 10 de Noviembre de 2025
