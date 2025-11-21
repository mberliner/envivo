# Flujo de Validación de Arquitectura

> **Validación automatizada de Clean Architecture en 3 capas: IDE → Pre-commit → CI**

---

## 📊 Resumen Ejecutivo

El proyecto implementa **validación automatizada de arquitectura** en 3 momentos del ciclo de desarrollo:

| Momento | Tool | Blocking | Config |
|---------|------|----------|--------|
| **Desarrollo** | ESLint IDE | ⚠️ Warning | `eslint.config.mjs` |
| **Pre-commit** | Husky + lint-staged | ✅ Bloquea | `.husky/pre-commit` |
| **CI/CD** | GitHub Actions | ✅ Bloquea | `.github/workflows/ci.yml` |

---

## 🔄 Flujo Completo por Momento

### 1️⃣ Durante Desarrollo (IDE)

```
┌────────────────────────────────────────┐
│  Desarrollador escribe código         │
│  archivo: EventService.ts              │
│                                        │
│  import { PrismaRepo } from '../../data'│
│         ❌ Error en tiempo real        │
└────────────────────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │   ESLint (VS Code)     │
    │   eslint-plugin-       │
    │   boundaries           │
    └────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  🔴 Domain layer CANNOT import from    │
│     Data or UI layers                  │
└────────────────────────────────────────┘
```

**Archivos:**
- `eslint.config.mjs` - Configuración de reglas
- `package.json` - Script `lint:arch`

**Comando manual:**
```bash
npm run lint:arch
```

---

### 2️⃣ Al hacer Commit (Pre-commit Hook)

```
┌────────────────────────────────────────┐
│  $ git commit -m "feat: new feature"   │
└────────────────────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │  Husky Pre-commit      │
    │  .husky/pre-commit     │
    └────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │  lint-staged           │
    │  package.json          │
    └────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  Ejecuta en archivos staged:          │
│  1. eslint --fix  (valida arquitectura)│
│  2. prettier --write                   │
└────────────────────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │  ✅ SI PASA: Commit OK │
    │  ❌ SI FALLA: BLOQUEADO│
    └────────────────────────┘
```

**Archivos:**
- `.husky/pre-commit` - Script del hook
- `package.json` - Config `lint-staged` + `prepare`
- `eslint.config.mjs` - Reglas aplicadas

**Bypass (emergencias):**
```bash
git commit --no-verify
```

---

### 3️⃣ Al hacer Push (Trigger CI)

```
┌────────────────────────────────────────┐
│  $ git push origin feature-branch     │
└────────────────────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │  Push to GitHub        │
    │  (no valida aquí)      │
    └────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │  🚨 TRIGGER CI         │
    │  GitHub Actions        │
    └────────────────────────┘
```

---

### 4️⃣ CI Pipeline (GitHub Actions)

```
┌──────────────────────────────────────────────────┐
│  CI Pipeline (.github/workflows/ci.yml)          │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│  JOB 1: Type Check                               │
│  • npm run type-check (tsc --noEmit)             │
│  • ❌ Falla → Pipeline termina (fail-fast)       │
│  • ✅ Pasa → Continúa                            │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│  JOB 2: Architecture Validation                  │
│  needs: typecheck (espera a type-check)          │
│                                                   │
│  STEPS:                                          │
│  1. npm ci                                       │
│  2. npm run lint:arch                            │
│     → ESLint boundaries                          │
│     → Config: eslint.config.mjs                  │
│                                                   │
│  3. npm run validate:deps                        │
│     → Dependency Cruiser                         │
│     → Config: .dependency-cruiser.cjs            │
│     → Detecta circular deps + violaciones        │
│                                                   │
│  4. sudo apt-get install graphviz                │
│                                                   │
│  5. npm run validate:deps:graph                  │
│     → Genera docs/architecture-graph.svg         │
│     → continue-on-error: true                    │
│                                                   │
│  6. Upload artifact                              │
│     → Sube architecture-graph.svg                │
│     → Retention: 30 días                         │
│                                                   │
│  • ❌ Falla → Pipeline FALLA                     │
│  • ✅ Pasa → Continúa con otros jobs             │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│  JOBS 3-9: En paralelo                           │
│  • lint, build, test (80% coverage)              │
│  • test-e2e, security-audit                      │
│  • dependency-check, best-practices              │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│  JOB 10: CI Status Check                         │
│  needs: [todos los jobs anteriores]              │
│                                                   │
│  Verifica:                                       │
│  • verify-architecture == success                │
│  • Todos los demás jobs == success               │
│                                                   │
│  ✅ Todos OK → Pipeline EXITOSO                  │
│  ❌ Alguno falla → Pipeline FALLA                │
└──────────────────────────────────────────────────┘
```

**Archivos:**
- `.github/workflows/ci.yml` - Pipeline completo
- `eslint.config.mjs` - ESLint boundaries
- `.dependency-cruiser.cjs` - Dependency rules
- `vitest.config.mts` - Test coverage (80%)

---

### 5️⃣ Pull Request

```
┌────────────────────────────────────────┐
│  Crear PR: feature → master           │
└────────────────────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │  GitHub PR Checks      │
    │  (mismo CI que push)   │
    └────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  Status Checks en PR:                  │
│  ✅ Type Check                         │
│  ✅ Verify Architecture ← CLAVE        │
│  ✅ Lint Code                          │
│  ✅ Build Application                  │
│  ✅ Unit Tests (Coverage 80%)          │
│  ✅ E2E Tests                          │
│  ✅ Security Audit                     │
│  ✅ Dependency Security Check          │
│  ✅ Security Best Practices            │
│  ✅ CI Status Check                    │
└────────────────────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │  ✅ ALL PASS           │
    │  → Merge HABILITADO    │
    │                        │
    │  ❌ ALGUNO FALLA       │
    │  → Merge BLOQUEADO     │
    └────────────────────────┘
```

**Checks adicionales en PR:**
- `dependency-check` ejecuta `dependency-review-action` (solo en PRs)
- Análisis de cambios en dependencias

---

### 6️⃣ Merge a Master

```
┌────────────────────────────────────────┐
│  Precondición:                         │
│  ✅ Verify Architecture PASSED         │
│  ✅ Todos los checks PASSED            │
└────────────────────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │  MERGE feature→master  │
    └────────────────────────┘
                 ↓
    ┌────────────────────────┐
    │  🚨 TRIGGER CI         │
    │  en branch master      │
    └────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│  Re-ejecuta pipeline completo          │
│  • Verificación adicional              │
│  • Sube artifact actualizado           │
│  • Protege integridad de master        │
└────────────────────────────────────────┘
```

---

## 📁 Archivos de Configuración

### Validación Local

```
eslint.config.mjs
├─ import eslint-plugin-boundaries
├─ import eslint-plugin-import
└─ rules:
   └─ boundaries/element-types: error
      ├─ domain → CANNOT import → [data, ui]
      └─ data → CANNOT import → [ui]

.husky/pre-commit
└─ npx lint-staged

package.json
├─ scripts:
│  ├─ lint:arch
│  ├─ validate:deps
│  └─ validate:deps:graph
├─ prepare: husky
└─ lint-staged:
   ├─ *.{ts,tsx}: [eslint --fix, prettier --write]
   └─ *.{js,jsx,mjs,json,md}: [prettier --write]
```

### Validación CI

```
.github/workflows/ci.yml
└─ verify-architecture job:
   ├─ needs: typecheck
   ├─ steps:
   │  ├─ npm run lint:arch
   │  ├─ npm run validate:deps
   │  └─ npm run validate:deps:graph
   └─ upload-artifact: architecture-graph.svg

.dependency-cruiser.cjs
├─ forbidden:
│  ├─ no-circular (circular deps)
│  ├─ domain-isolation (domain → data/ui)
│  └─ data-to-ui-forbidden (data → ui)
└─ reporter: dot (graph SVG)

vitest.config.mts
└─ coverage:
   ├─ thresholds: 77% (actual: 80%)
   └─ exclude: config files, type defs
```

---

## 🎯 Tabla de Validaciones por Momento

| Momento | ESLint Boundaries | Dependency Cruiser | Graph SVG | Blocking |
|---------|-------------------|-------------------|-----------|----------|
| **IDE** | ✅ Real-time | ❌ | ❌ | ⚠️ Warning |
| **Pre-commit** | ✅ En staged | ❌ | ❌ | ✅ Sí |
| **CI (push)** | ✅ Full repo | ✅ Full + circular | ✅ Generado | ✅ Sí |
| **PR** | ✅ Full repo | ✅ Full + circular | ✅ Generado | ✅ Sí |
| **Merge master** | ✅ Full repo | ✅ Full + circular | ✅ Generado | ✅ Sí |

---

## 🛠️ Comandos Manuales

### Validación de Arquitectura

```bash
# ESLint boundaries (rápido)
npm run lint:arch

# Dependency Cruiser (exhaustivo)
npm run validate:deps

# Generar gráfico (requiere Graphviz)
npm run validate:deps:graph

# Ver gráfico
open docs/architecture-graph.svg  # macOS
xdg-open docs/architecture-graph.svg  # Linux
```

### Instalar Graphviz (para generar gráfico)

```bash
# macOS
brew install graphviz

# Linux
sudo apt-get install graphviz

# Verificar instalación
dot -V
```

---

## 🔍 Descargar Gráfico desde CI

1. Ve a **Actions** → Workflow run específico
2. Scroll hasta **Artifacts**
3. Descarga `architecture-dependency-graph`
4. Extrae y abre `architecture-graph.svg`

**Leyenda del gráfico:**
- 🟢 **Verde**: Domain layer (business logic)
- 🔵 **Azul**: Data layer (I/O)
- 🟣 **Rosa**: UI layer (componentes)
- 🟡 **Amarillo**: Shared utilities

---

## ⚠️ Bypass de Validaciones

### Pre-commit Hook

```bash
# ⚠️ Solo en emergencias
git commit --no-verify -m "..."
```

### CI

No es posible hacer bypass. Si falla:
1. Ver logs del job `verify-architecture`
2. Ejecutar localmente: `npm run validate:deps`
3. Corregir violaciones
4. Push nuevamente

---

## 📚 Referencias

- **Clean Architecture**: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- **Desarrollo**: [docs/DEVELOPMENT.md#architecture-validation](DEVELOPMENT.md#architecture-validation)
- **ESLint Boundaries**: https://github.com/javierbrea/eslint-plugin-boundaries
- **Dependency Cruiser**: https://github.com/sverweij/dependency-cruiser

---

**Última actualización**: Noviembre 2025
