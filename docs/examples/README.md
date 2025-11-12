# Ejemplos de Código - EnVivo

> **Nota**: Estos archivos son temporales. Copiar el código durante la implementación y eliminar esta carpeta cuando el proyecto esté completo.

## Tabla de Contenidos

1. [scraper-example.ts](#scraper-example) - Implementar nuevo scraper completo
2. [business-rules-example.ts](#business-rules-example) - Reglas de validación y deduplicación
3. [testing-example.ts](#testing-example) - Tests unitarios, integration, E2E
4. [security-example.ts](#security-example) - Validación Zod, sanitización, rate limiting
5. [error-handling-example.ts](#error-handling-example) - AppError classes, logging
6. [env-example.ts](#env-example) - Validación de variables de entorno
7. [cicd-example.yml](#cicd-example) - GitHub Actions workflows

---

## Propósito

Estos archivos contienen implementaciones completas extraídas del PLAN_PROYECTO.md original. Son **referencias de código** para copiar y adaptar durante la implementación.

## Uso

1. **Durante desarrollo**: Copiar código de aquí a `/src`
2. **Adaptar** según necesidad específica
3. **Escribir tests** para código copiado
4. **Eliminar carpeta** `docs/examples/` cuando proyecto esté completo

## Lista de Ejemplos

### scraper-example.ts
- DataSourceOrchestrator completo
- ExternalApiSource con todas las capacidades
- LocalVenueScraper con Cheerio
- Type guards para capacidades opcionales
- ~400 líneas

### business-rules-example.ts
- EventBusinessRules completo
- Validación de fechas, ubicación, contenido
- Detección de duplicados con fuzzy matching
- Normalización de datos
- Configuración en JSON
- ~300 líneas

### testing-example.ts
- Tests unitarios con Vitest
- Tests de integración con mocks
- Tests E2E con Playwright
- MSW para mocking de APIs
- ~250 líneas

### security-example.ts
- Validación con Zod (EventInputSchema, SearchQuerySchema)
- Sanitización con DOMPurify
- Rate limiting (con y sin Redis)
- Headers de seguridad
- ~200 líneas

### error-handling-example.ts
- AppError classes (ValidationError, NotFoundError, etc.)
- Error handler global
- Logging con Pino
- Error boundaries React
- Integración con Sentry
- ~200 líneas

### env-example.ts
- EnvSchema con Zod
- Validación al inicio de app
- Type-safe env variables
- Feature flags
- ~100 líneas

### cicd-example.yml
- Workflow de tests (PR)
- Workflow de deploy (main)
- Workflow de scraping diario (cron)
- Security audit semanal
- ~150 líneas

---

## Cómo Referenciar desde Documentación

**En ARCHITECTURE.md**:
```markdown
Ver código completo: `docs/examples/scraper-example.ts`
```

**En CLAUDE.md**:
```markdown
**Ver ejemplos de código**: Todos los ejemplos de código largos (50+ líneas) están en `docs/examples/`
```

---

**Creado**: Enero 2025
