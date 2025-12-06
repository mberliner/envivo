# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Seguridad

- Actualización de Next.js a 16.0.7 por razones de seguridad

### Agregado

- **Architecture Validation**: Sistema automático de validación de Clean Architecture en 3 capas
  - ESLint boundaries para feedback instantáneo en IDE
  - Pre-commit hook (Husky) que bloquea commits con violaciones
  - CI validation con Dependency Cruiser (exhaustivo + gráfico de dependencias)
  - Reglas aplicadas: Domain Isolation, No Circular Dependencies, Dependency Inversion
  - Documentación completa en ARCHITECTURE_VALIDATION_FLOW.md
  - Gráfico visual de arquitectura generado automáticamente: `docs/architecture-graph.svg`
- **AllAccess Scraper Improvements**:
  - Scraping de páginas de detalle para obtener información completa de eventos
  - Extracción de datos JSON embebidos en páginas AllAccess
  - Supresión de warnings de fecha cuando detail scraping está habilitado
- **Teatro Vorterix scraper**:
  - Nuevo scraper para Teatro Vorterix
  - Corrección de extracción de fechas y datos

### Cambiado

- **CI Pipeline Optimization**: Implementado fail-fast strategy con dependencias lógicas entre jobs
  - 87% más rápido en fallos comunes (typecheck/lint)
  - Feedback inmediato en 45s vs 7 min
  - Ahorro de ~10-13 min de CI por cada fallo temprano
  - E2E tests solo se ejecutan si todos los checks previos pasan
  - Eliminada redundancia en `ci-status`: solo depende de leaf jobs (test-e2e cubre dependencias transitivas)
  - Trade-off: +2 min cuando todos los jobs pasan (aceptable)
- **CodeQL Pipeline Optimization**: Eliminadas ejecuciones duplicadas en PRs
  - Removido trigger `pull_request` - CodeQL solo corre en push a master + schedule semanal
  - Agregado `.github/**` a `paths-ignore` - no corre al modificar workflows
  - Reducción de 40% en runs de CI por PR (de 5 a 3 runs)
  - Ahorro de 10-15 min por PR
  - Seguridad mantenida: npm audit + best-practices en PRs, CodeQL en código merged
- Ajuste de coverage thresholds a 77% después de formateo con Prettier
- Refactorización de arquitectura de capas (Domain/Data/UI)

### Arreglado

- Exclusión de archivos de configuración y definiciones de tipos de coverage
- Múltiples correcciones de CI para E2E tests:
  - Playwright webServer habilitado en CI
  - Tests E2E ahora independientes
  - Longitud correcta de ADMIN_API_KEY
  - Schema de base de datos E2E creado antes de inicialización
  - Resueltos fallos de build en entorno CI
- Corrección de warnings de lint y errores de TypeScript
- Triggers de CI corregidos

### Documentación

- Revisión exhaustiva y simplificación de documentación completa
- Eliminados archivos obsoletos (MIGRATION_INSTRUCCIONES, INSTRUCCIONES_PRISMA, MEJORAS)
- CLAUDE.md simplificado en 47% eliminando redundancias (SSOT consolidado)
- README reescrito con enfoque en usuario final (30% más conciso)
- Actualizadas todas las fechas a Diciembre 2025
- Mejoradas cross-references entre documentos
- Eliminadas referencias a documentos internos (roadmap_imple.md) de docs públicos
- Reducción total: ~2,300 líneas (-27%)

### Mantenimiento

- Formateo completo de código con Prettier
- Exclusión de docs/ de format checks
- Eliminación de docs/examples con errores de sintaxis

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
