# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Documentación

- Revisión exhaustiva y simplificación de documentación completa
- Eliminados archivos obsoletos (MIGRATION_INSTRUCCIONES, INSTRUCCIONES_PRISMA, MEJORAS)
- CLAUDE.md simplificado en 47% eliminando redundancias (SSOT consolidado)
- README reescrito con enfoque en usuario final (30% más conciso)
- Actualizadas todas las fechas a Diciembre 2025
- Mejoradas cross-references entre documentos
- Eliminadas referencias a documentos internos (roadmap_imple.md) de docs públicos
- Reducción total: ~2,300 líneas (-27%)

## [0.2.0] - 2025-11-17

### Agregado

- **Movistar Arena scraper**: Integración completa con web scraping de eventos
- **Teatro Coliseo scraper**: Soporte para teatro, conciertos y festivales en Buenos Aires
- Sistema de scraping genérico config-driven (GenericWebScraper)
- WebScraperFactory para crear scrapers por configuración
- Transformaciones reutilizables (parseSpanishDate, extractPrice, sanitizeHtml)
- Soporte para paginación en scrapers web
- Retry automático con exponential backoff
- Documentación completa de web scraping (WEB_SCRAPING.md, ADDING_SCRAPERS.md)

### Cambiado

- LivePass scraper migrado a arquitectura config-driven
- Mejorada extracción de descripción en sitios Blazor Server
- Actualizados selectores CSS de LivePass/Café Berlín

### Arreglado

- Corrección de extracción de descripción en Movistar Arena
- Warnings de ESLint en PuppeteerWebScraper

## [0.1.0] - 2025-11-09

### Agregado

- **Ticketmaster API**: Eliminada la Integración con API oficial de Ticketmaster porque no contiene espectaculos en argentina
- **LivePass scraper**: Web scraping de Café Berlín con soporte para páginas de detalle
- Clean Architecture con 3 capas (Domain, Data, UI)
- DataSourceOrchestrator para scraping asíncrono de múltiples fuentes
- EventBusinessRules con validación y deduplicación automática
- Global Preferences para filtrado por país y categorías
- Tests E2E con Playwright usando BD separada (e2e.db)
- Tests unitarios con Vitest (>80% coverage en Domain layer)
- UI básica con búsqueda y filtros (ciudad, fecha, categoría)
- Página de detalle de eventos
- Prisma + SQLite como base de datos
- Validación de inputs con Zod
- Sanitización de datos scrapeados con DOMPurify
- Rate limiting en endpoints públicos
- Headers de seguridad (CSP, HSTS, X-Frame-Options)

### Documentación

- ARCHITECTURE.md - Clean Architecture, SOLID, ADRs
- PRODUCT.md - Features, user stories, roadmap
- DEVELOPMENT.md - Setup, testing, debugging
- CONTRIBUTING.md - Git workflow, SSOT registry
- SECURITY.md - Security best practices
- E2E_TESTING.md - Guía de tests E2E con Playwright
- CLAUDE.md - Contexto completo para Claude Code
- VERCEL_MIGRATION.md - Guía de migración a Vercel + Turso (temporal)

## [0.0.1] - 2025-11-01

### Agregado

- Setup inicial del proyecto con Next.js 15 + TypeScript
- Configuración de Tailwind CSS
- Setup de Prisma ORM con SQLite
- Estructura de carpetas siguiendo Clean Architecture
- Configuración de ESLint y Prettier
- Setup de Vitest para testing
- Variables de entorno con validación Zod
- README inicial con quick start

---

## Tipos de Cambios

- **Agregado**: Nuevas features
- **Cambiado**: Cambios en funcionalidad existente
- **Deprecado**: Features que serán removidas en próximas versiones
- **Removido**: Features eliminadas
- **Arreglado**: Bug fixes
- **Seguridad**: Cambios relacionados con vulnerabilidades
- **Documentación**: Cambios solo en documentación

## Versionado

Este proyecto usa [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Nuevas features compatibles con versiones anteriores
- **PATCH** (0.0.X): Bug fixes compatibles con versiones anteriores

Durante la fase de MVP (0.x.x), pueden ocurrir cambios breaking entre versiones MINOR.

---

**Nota**: Este changelog se mantiene manualmente. Para ver todos los commits, consultar el [historial de Git](https://github.com/mberliner/envivo/commits).
