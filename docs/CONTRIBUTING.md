# Guía de Contribución - EnVivo

## Before Contributing

Antes de contribuir al proyecto, familiarízate con:

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Comprende la arquitectura Clean Architecture y principios SOLID
2. **[PRODUCT.md](PRODUCT.md)** - Revisa el roadmap y features planificadas
3. **[SECURITY.md](SECURITY.md)** - Conoce las prácticas de seguridad obligatorias
4. **[../CLAUDE.md](../CLAUDE.md)** - Naming conventions y estructuras de código

---

## Documentation as Code: Single Source of Truth (SSOT)

La documentación de EnVivo sigue el principio **"Single Source of Truth"** para garantizar consistencia y prevenir duplicaciones.

### Principio Core

- **Una ubicación** almacena la versión autoritativa de cada tema
- **Otras ubicaciones** referencian con resúmenes breves + links
- **NO copiar-pegar** explicaciones detalladas entre documentos
- **Cuando hay conflictos**, el SSOT es la fuente de verdad

### SSOT Registry (Qué Va Dónde)

| Topic | Primary Location (SSOT) | Secondary References |
|-------|-------------------------|----------------------|
| **Architecture & Clean Architecture** | `ARCHITECTURE.md` | `CLAUDE.md` (summary) |
| **SOLID Principles** | `ARCHITECTURE.md` | `CLAUDE.md` (reference) |
| **ADRs (Decisiones Arquitectónicas)** | `ARCHITECTURE.md` | - |
| **Scraping Asíncrono & Orchestrator** | `ARCHITECTURE.md` | - |
| **Data Mappers (patrón)** | `ARCHITECTURE.md` | `DEVELOPMENT.md` (naming) |
| **Interface Segregation (ISP)** | `ARCHITECTURE.md` | - |
| **Business Rules** | `ARCHITECTURE.md` | - |
| **Code Conventions & Naming** | `DEVELOPMENT.md` | `CLAUDE.md` (summary) |
| **ESLint & Code Quality** | `DEVELOPMENT.md` | `README.md` (commands only) |
| **Git Workflow & Commits** | `CONTRIBUTING.md` (this file) | `CLAUDE.md` (summary) |
| **Testing (stack, comandos, coverage)** | `DEVELOPMENT.md` | `CLAUDE.md` (table summary) |
| **Testing Best Practices (AAA, mocks)** | `DEVELOPMENT.md` | - |
| **Security Best Practices** | `SECURITY.md` | `CLAUDE.md` (refs) |
| **Attack Vectors & Defense in Depth** | `SECURITY.md` | - |
| **Product Features & Roadmap** | `PRODUCT.md` | `README.md` (link) |
| **User Stories** | `PRODUCT.md` | - |
| **Vertical Slices Strategy** | `PRODUCT.md` | `CLAUDE.md` (summary) |
| **Project Structure (folders)** | `DEVELOPMENT.md` | `README.md`, `CLAUDE.md` (summary) |
| **Development Setup & Install** | `README.md` Quick Start | `DEVELOPMENT.md` (reference) |
| **TypeScript Best Practices** | `DEVELOPMENT.md` | - |
| **React/Next.js Best Practices** | `DEVELOPMENT.md` | - |
| **CLI Commands** | `DEVELOPMENT.md` | - |
| **Environment Variables** | `DEVELOPMENT.md` | - |
| **Database Setup (Prisma)** | `DEVELOPMENT.md` | `ARCHITECTURE.md` (schema design) |
| **Debugging Guide** | `DEVELOPMENT.md` | - |
| **Performance Tips** | `DEVELOPMENT.md` | - |
| **Code Examples** | `docs/examples/` | `CLAUDE.md` (references) |
| **Implementation Tracking** | `roadmap_imple.md` | NO REFERENCIAR EN DOCS |

### Cómo Actualizar Documentación

**Al agregar un tema nuevo:**

1. Elige UNA ubicación como SSOT (consulta la tabla arriba)
2. Escribe la explicación detallada allí
3. En otros docs, agrega resumen de 1-2 frases + link al SSOT
4. Actualiza esta tabla SSOT Registry

**Al corregir un error:**

1. Corrige el SSOT primero (la versión más detallada)
2. Actualiza resúmenes en ubicaciones secundarias si es necesario
3. NUNCA corrijas solo el resumen - siempre rastrea hasta la fuente

**Ejemplo BUENO:**

```markdown
# En CLAUDE.md (referencia secundaria):
Ver [CONTRIBUTING.md#testing-requirements](CONTRIBUTING.md#testing-requirements)
para requisitos completos de testing y objetivos de cobertura.

# En CONTRIBUTING.md (SSOT):
## Testing Requirements
[30+ líneas detalladas de requisitos, herramientas, coverage, etc.]
```

**Ejemplo MALO:**

```markdown
# Documentar en múltiples lugares con detalles diferentes
# CLAUDE.md dice: ">80% coverage requerido"
# CONTRIBUTING.md dice: ">75% coverage requerido"
# DEVELOPMENT.md dice: "Testear exhaustivamente"
# → ¡CONFUSIÓN! Estos valores contradicen
```

### Beneficios del SSOT

- ✅ **Consistencia** - Una sola fuente de verdad previene información conflictiva
- ✅ **Mantenibilidad** - Actualizar una vez, correcto en todas partes
- ✅ **Claridad** - Los links ayudan a entender el panorama completo
- ✅ **Escalabilidad** - Fácil agregar nuevos docs sin romper existentes

---

## Workflow: Híbrido (Trunk-Based + Feature Branches)

Usamos un **enfoque híbrido** que combina trunk-based development para cambios menores con feature branches para cambios mayores.

### Reglas Básicas

✅ **Commits pequeños y frecuentes** (directos a `main` cuando aplique)
✅ **Tests deben pasar** antes de commit
✅ **Revert rápido** si algo falla en producción
✅ **Feature flags** para features grandes incompletas

❌ **NO branches de larga duración** (>3 días sin merge)
❌ **NO commits sin tests** (capa de dominio requiere >80% coverage)

### Criterio de Decisión

**Commits directos a `main`** (cambios <100 líneas):
- Bug fixes pequeños
- Tests nuevos
- Refactoring menor
- Docs y configs
- Cambios de estilo/lint

**Feature branches + Pull Request** (cambios >100 líneas):
- Features nuevas complejas
- Cambios arquitectónicos mayores
- Nuevas integraciones externas (APIs, scrapers)
- Cambios en schema de BD
- Migración de tecnologías

---

## Testing Requirements

### ⛔ REGLA CRÍTICA: TESTS FALLANDO = INADMISIBLE

**TODOS los tests DEBEN pasar antes de hacer commit.**

```bash
# Estado REQUERIDO para commit
✅ TypeScript: 0 errors
✅ Tests: X/X passing (100%)
✅ Lint: 0 warnings
```

**❌ NUNCA commitear con:**
- Tests fallando (aunque sea 1)
- Errores de TypeScript
- Tests comentados o skipeados (`test.skip`, `it.skip`)
- Tests con `.only` (que ignoran otros tests)

**Si un test falla:**
1. ARREGLÁ el código hasta que pase
2. Si es un test viejo que ya no aplica, ELIMINALO (no lo skipees)
3. Si necesitás commitear urgente, ARREGLÁ el test primero

**No hay excepciones a esta regla.**

### Antes de CADA Commit

```bash
# 1. Type check (OBLIGATORIO)
npm run type-check
# Resultado esperado: 0 errors

# 2. Tests unitarios (OBLIGATORIO)
npm test
# Resultado esperado: X/X passing (100%)

# 3. Lint (OBLIGATORIO)
npm run lint
# Resultado esperado: 0 warnings

# 4. Tests E2E (si tocaste UI)
npm run test:e2e
```

**Si ANY de estos comandos falla, NO commitear.**

### Cobertura Mínima

| Capa | Coverage Requerido | Estado Actual |
|------|--------------------|--------------|
| Domain (business rules) | >80% | ✅ 83.3% |
| Data (repositories) | >70% | ✅ 100% (activos) |
| Data (scrapers) | >60% | ✅ 100% |
| UI (componentes) | >60% | ⏸️ Pendiente |

**Comando**: `npm run test:coverage`

### Git Hooks (Automático)

El proyecto puede configurar git hooks para prevenir commits con tests fallando:

```bash
# .git/hooks/pre-commit (opcional, recomendado)
#!/bin/bash
npm run type-check && npm test
```

Si el hook falla, el commit se bloquea automáticamente.

---

## Commit Guidelines

### Conventional Commits

```bash
feat: add fuzzy matching para duplicados
fix: corregir timeout en scraper de API externa
refactor: simplificar EventBusinessRules
test: agregar tests para deduplicación
docs: actualizar ARCHITECTURE.md con ISP
chore: actualizar dependencias
```

### Commits Atómicos

✅ **Hacer**: 1 commit = 1 cambio lógico
❌ **Evitar**: commits gigantes con múltiples features

**Ejemplo bueno**:
```bash
git commit -m "feat: add ExternalApiSource"
git commit -m "test: add tests for ExternalApiSource"
git commit -m "docs: document external API integration"
```

---

## Code Review Checklist

### Para Reviewer (cuando hay PR)

- [ ] TypeScript strict checks pasan (`npm run type-check`)
- [ ] Tests agregados/actualizados y pasando
- [ ] Coverage cumple mínimos por capa
- [ ] Código sigue naming conventions (ver CLAUDE.md)
- [ ] No hay `any` sin justificación
- [ ] Imports usan alias `@` (no relative profundos)
- [ ] Docs actualizadas si cambia arquitectura
- [ ] Performance considerada (lazy loading, memoization)
- [ ] Security: inputs validados con Zod, datos sanitizados

### Para Author

- [ ] PR descripción clara (qué, por qué, cómo)
- [ ] Screenshots si cambia UI
- [ ] Tests manuales realizados localmente
- [ ] No hay console.logs olvidados
- [ ] No hay TODOs sin issue asociado

---

## Revert Policy

Si un commit rompe producción:

```bash
# 1. Revert inmediato
git revert <commit-hash>
git push origin main

# 2. Investigar localmente
# 3. Fix con nuevo commit
```

**Prioridad**: Mantener `main` siempre deployable.

---

## Feature Flags (Para Features Grandes)

Si una feature toma >1 día:

```typescript
// config/features.ts
export const features = {
  newSearchAlgorithm: process.env.FEATURE_NEW_SEARCH === 'true'
};

// Uso en código
if (features.newSearchAlgorithm) {
  // Nueva implementación
} else {
  // Implementación actual
}
```

Permite commits incrementales sin romper producción.

---

**Última actualización**: Noviembre 2025
