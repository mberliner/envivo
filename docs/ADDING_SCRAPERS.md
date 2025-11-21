# Guía: Prompt para agregar nuevo Sitio Web para Scraping

**Prompt-oriented**: Esta guía se enfoca en el prompt, no en código que puede quedar obsoleto.

> **Ver también**: [WEB_SCRAPING.md](WEB_SCRAPING.md) para documentación técnica completa del sistema de scraping (arquitectura, configuración avanzada, transformaciones, testing).

---

## Prompt Template

Usa este prompt con Claude Code para agregar un nuevo sitio:

```
Agregar scraping del sitio [NOMBRE_SITIO] ([URL]) al proyecto EnVivo.

**Información del Sitio:**
- URL base: [URL_BASE]
- Página de eventos: [URL_LISTADO]
- Ciudad/País: [CIUDAD], AR
- Categoría principal: [Teatro/Concierto/Festival/etc]

**Selectores CSS** (inspeccionar con DevTools):
- Contenedor de eventos: [SELECTOR_CONTAINER]
- Cada evento: [SELECTOR_ITEM]
- Título: [SELECTOR_TITULO]
- Fecha: [SELECTOR_FECHA]
- Imagen: [SELECTOR_IMAGEN]
- Link: [SELECTOR_LINK]
- Venue: [SELECTOR_VENUE o "usar defaultValue: [NOMBRE_VENUE]"]
- Precio: [SELECTOR_PRECIO o "omitir si no disponible"]

**Formato de Datos:**
- Fecha aparece como: [ejemplo: "Sábado 15 de Noviembre", "15/11/2025"]
- Precio aparece como: [ejemplo: "Desde $8.500", "Gratis"]
- Paginación: [none/numbered/nextButton]

**Scraping de Detalle:**
¿Requiere scraping de páginas de detalle? [SÍ/NO]

Si SÍ, proveer:
- Selectores adicionales para detalle: [venue, precio, descripción, etc]
- Delay recomendado: 500ms

**Arquitectura y Seguridad (OBLIGATORIO):**
- Seguir Clean Architecture (ver CLAUDE.md, ARCHITECTURE.md)
- Usar GenericWebScraper como base (ver src/features/events/data/sources/web/GenericWebScraper.ts)
- Rate limit: 1 req/seg, timeout: 15s
- Sanitizar HTML con DOMPurify (ver SECURITY.md)
- Validar URLs con isSafeURL()
- Tests unitarios con coverage >60%
- Registrar en DataSourceOrchestrator (ver src/app/api/admin/scraper/sync/route.ts)

**Archivos de Referencia:**
- Config ejemplo: src/config/scrapers/livepass.config.ts
- Transforms disponibles: src/features/events/data/sources/web/utils/transforms.ts
- Types: src/features/events/data/sources/web/types/ScraperConfig.ts

**Estructura Esperada:**
1. src/config/scrapers/[nombre].config.ts
2. src/features/events/data/sources/[nombre]/[Nombre]Source.ts
3. Registro en src/app/api/admin/scraper/sync/route.ts
4. Script validación: scripts/test-[nombre].ts

**Documentación (CRÍTICO):**
Actualizar estos archivos:
- README.md (si es fuente principal)
- docs/DEVELOPMENT.md (si requiere API key o setup especial)
- .env.example (si requiere secrets)

**Commits (Conventional Commits):**
1. feat: add [NombreSitio] web scraper
2. docs: update docs for [NombreSitio] integration
3. test: add validation script for [NombreSitio]

**Testing Manual:**
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: $ADMIN_API_KEY"
```

---

## Ejemplo Concreto

```
Agregar scraping del sitio Teatro Coliseo (https://teatrocoliseo.org.ar).

**Información del Sitio:**
- URL base: https://teatrocoliseo.org.ar
- Página de eventos: /cartelera
- Ciudad/País: Buenos Aires, AR
- Categoría principal: Teatro

**Selectores CSS:**
- Contenedor: .cartelera-grid
- Cada evento: .evento-card
- Título: h3.titulo
- Fecha: .fecha-evento
- Imagen: img.poster@src
- Link: a.ver-mas@href
- Venue: usar defaultValue: "Teatro Coliseo"
- Precio: .precio-desde

**Formato de Datos:**
- Fecha: "Sábado 15 de Noviembre de 2025"
- Precio: "Desde $8.500"
- Paginación: none

**Scraping de Detalle:**
NO requiere scraping de detalle

**Arquitectura y Seguridad:**
- Seguir Clean Architecture (CLAUDE.md, ARCHITECTURE.md)
- Usar GenericWebScraper
- Sanitizar HTML, validar URLs
- Rate limit: 1/seg
- Tests >60% coverage
- Registrar en DataSourceOrchestrator

**Archivos de Referencia:**
- src/config/scrapers/livepass.config.ts (ejemplo completo)
- src/features/events/data/sources/web/utils/transforms.ts (transforms)

**Documentación:**
Actualizar: README.md

**Commits:**
1. feat: add Teatro Coliseo web scraper
2. docs: update docs for Teatro Coliseo
3. test: add validation script
```

---

## Checklist de Implementación

**Antes de empezar:**
- [ ] Inspeccionar sitio con DevTools (Chrome/Firefox)
- [ ] Identificar selectores CSS correctos
- [ ] Probar selectores en consola: `$$('.selector')`
- [ ] Verificar formato de fechas/precios
- [ ] Determinar si necesita scraping de detalle

**Durante implementación:**
- [ ] Config creado en `src/config/scrapers/`
- [ ] Source creado en `src/features/events/data/sources/`
- [ ] Registrado en orchestrator
- [ ] Script de validación creado
- [ ] Transforms reutilizados o creados
- [ ] HTML sanitizado con DOMPurify
- [ ] URLs validadas con isSafeURL()
- [ ] Rate limiting configurado

**Testing:**
- [ ] Script de validación ejecutado: `ts-node scripts/test-[nombre].ts`
- [ ] Scraping manual via API funciona
- [ ] Eventos aparecen en UI
- [ ] No hay duplicados (verificar deduplicación)
- [ ] Tests unitarios >60% coverage

**Documentación:**
- [ ] README.md actualizado (si aplica)
- [ ] docs/DEVELOPMENT.md actualizado (si requiere setup)
- [ ] .env.example actualizado (si requiere secrets)
- [ ] Commits pusheados con mensajes convencionales

**Verificación final:**
- [ ] `npm run type-check` → 0 errores
- [ ] `npm run lint` → 0 errores
- [ ] `npm run test` → todos pasan
- [ ] Scraping funciona end-to-end

---

## Cómo Inspeccionar un Sitio

### 1. Abrir DevTools
```
Chrome: F12 o Ctrl+Shift+I
Firefox: F12 o Ctrl+Shift+I
```

### 2. Identificar Selectores
```javascript
// En consola del navegador:

// 1. Encontrar contenedor principal
$$('.eventos')  // probar diferentes selectores

// 2. Verificar selector de cada evento
$$('.evento-card').length  // debe coincidir con eventos visibles

// 3. Extraer datos de prueba
$$('.evento-card').map(el => ({
  title: el.querySelector('h3')?.textContent,
  date: el.querySelector('.fecha')?.textContent,
  image: el.querySelector('img')?.src
}))
```

### 3. Probar Transforms
Ver transforms disponibles en: `src/features/events/data/sources/web/utils/transforms.ts`

---

## Troubleshooting

**Problema**: Selectores no encuentran eventos
- Verificar que el sitio no use JavaScript para cargar contenido
- Probar selectores en consola: `$$('.selector')`
- Usar DevTools para copiar selector exacto

**Problema**: Fechas no se parsean
- Verificar formato exacto en HTML
- Revisar transforms disponibles en `transforms.ts`
- Crear transform custom si es necesario

**Problema**: Duplicados en BD
- Verificar que `source` y `externalId` sean únicos
- Revisar deduplicación en EventBusinessRules

**Problema**: Scraping falla por rate limit
- Ajustar `requestsPerSecond` en config
- Aumentar `timeout` si respuestas son lentas

---

## Referencias

- **Arquitectura**: docs/ARCHITECTURE.md
- **Seguridad**: docs/SECURITY.md
- **Desarrollo**: docs/DEVELOPMENT.md
- **Convenciones**: CLAUDE.md
- **Ejemplo completo**: src/config/scrapers/livepass.config.ts
- **Transforms**: src/features/events/data/sources/web/utils/transforms.ts
- **Types**: src/features/events/data/sources/web/types/ScraperConfig.ts

---

**Última actualización**: Noviembre 2025
