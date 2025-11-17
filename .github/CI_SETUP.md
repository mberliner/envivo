# Configuración del Pipeline de CI/CD

Este documento describe el pipeline de CI/CD implementado para el proyecto EnVivo y las configuraciones necesarias en GitHub.

---

## 📋 Resumen del Pipeline

El pipeline de CI incluye **8 jobs de validación** que garantizan la calidad y seguridad del código:

| Job | Descripción | Comando | Criterio de Éxito |
|-----|-------------|---------|-------------------|
| **Type Check** | Validación de tipos TypeScript | `npm run type-check` | 0 errores de tipo |
| **Lint** | Validación de código y formato | `npm run lint` + `format:check` | 0 warnings/errors |
| **Build** | Compilación de Next.js | `npm run build` | Build exitoso |
| **Unit Tests** | Tests unitarios con cobertura | `npm run test:coverage` | 100% tests passing + cobertura ≥80% |
| **E2E Tests** | Tests end-to-end con Playwright | `npm run test:e2e:prod` | Todos los tests pasan |
| **Security Audit** | npm audit para vulnerabilidades | `npm audit --audit-level=high` | 0 vulnerabilidades High/Critical |
| **Dependency Check** | Revisión de dependencias en PRs | Dependency Review Action | 0 vulnerabilidades High/Critical |
| **Best Practices** | Checks de seguridad personalizados | Scripts custom | 0 secretos hardcodeados |

Además, un workflow separado ejecuta **CodeQL** para análisis estático de seguridad.

---

## 🚀 Triggers del Pipeline

### Workflow Principal (`ci.yml`)

**Se ejecuta en:**
- ✅ Push a `main` o branches `claude/**`
- ✅ Pull requests hacia `main`

**Se IGNORA en:**
- ❌ Cambios solo en archivos `.md`
- ❌ Cambios en `LICENSE`
- ❌ Cambios en `docs/**`
- ❌ Cambios en archivos de configuración (.gitignore, .prettierrc, etc.)

### Workflow de CodeQL (`codeql.yml`)

**Se ejecuta en:**
- ✅ Push a `main`
- ✅ Pull requests hacia `main`
- ✅ Schedule semanal (lunes 6 AM UTC)

---

## 🛡️ Configuración de Branch Protection Rules

Para garantizar que **ningún código sin validar llegue a `main`**, debes configurar Branch Protection Rules en GitHub:

### Paso 1: Acceder a la configuración

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Branches**
3. En "Branch protection rules", click en **Add rule**

### Paso 2: Configurar reglas para `main`

**Branch name pattern:** `main`

**Configuraciones requeridas:**

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1` (opcional, si trabajas en equipo)
  - ✅ Dismiss stale pull request approvals when new commits are pushed

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Status checks requeridos** (selecciona los siguientes):
    - `CI Status Check` (el job final que valida todos los demás)
    - `Type Check`
    - `Lint Code`
    - `Build Application`
    - `Unit Tests (Coverage 80%)`
    - `E2E Tests (Playwright)`
    - `Security Audit (npm audit)`
    - `Dependency Security Check`
    - `Security Best Practices`
    - `CodeQL Analysis`

- ✅ **Require conversation resolution before merging**

- ✅ **Do not allow bypassing the above settings**
  - ⚠️ Esto previene que incluso los admins hagan bypass (recomendado para producción)

### Paso 3: Guardar

Click en **Create** o **Save changes**.

---

## 📊 Cobertura de Tests

La cobertura mínima requerida es **80%** en:
- Lines
- Functions
- Branches
- Statements

### Configuración de Cobertura

El threshold está configurado en `vitest.config.mts`:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

### Ver Cobertura Localmente

```bash
npm run test:coverage
```

Los reportes se generan en `./coverage/`:
- `index.html` - Reporte visual navegable
- `coverage-final.json` - Reporte JSON para CI
- `lcov.info` - Formato LCOV para integraciones

---

## 🔒 Checks de Seguridad

### 1. npm audit

Ejecuta `npm audit` y falla si encuentra vulnerabilidades **High** o **Critical**.

**Resolver vulnerabilidades:**

```bash
# Ver vulnerabilidades
npm audit

# Intentar auto-fix
npm audit fix

# Para vulnerabilidades que requieren breaking changes
npm audit fix --force  # ⚠️ usar con precaución
```

### 2. Dependency Review

En PRs, analiza cambios en dependencias y alerta sobre:
- Vulnerabilidades conocidas
- Licencias prohibidas (GPL-3.0, AGPL-3.0)
- Supply chain risks

### 3. CodeQL

Análisis estático de código que detecta:
- SQL Injection
- XSS (Cross-Site Scripting)
- Command Injection
- Path Traversal
- Uso inseguro de APIs
- Exposición de secretos

**Queries utilizadas:**
- `security-extended` - Queries de seguridad avanzadas
- `security-and-quality` - Queries de calidad y seguridad

### 4. Best Practices Checks

Scripts custom que verifican:

✅ **No secretos hardcodeados:**
- Busca patrones como `sk-`, `api_key=`, etc.
- Falla si encuentra keys fuera de `process.env`

✅ **No .env en repo:**
- Verifica que `.env` no esté committed

✅ **Security headers configurados:**
- Alerta si `next.config` no tiene headers de seguridad

---

## 🧪 Testing Localmente

### Prerrequisitos

```bash
# Instalar dependencias
npm ci

# Generar Prisma Client
npm run db:generate
```

### Ejecutar Tests Individualmente

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Unit tests
npm run test

# Unit tests con cobertura
npm run test:coverage

# E2E tests
npm run db:e2e:init
npm run test:e2e:prod

# Security audit
npm audit --audit-level=high
```

### Testing con act (Opcional)

[act](https://github.com/nektos/act) permite ejecutar GitHub Actions localmente:

```bash
# Instalar act
brew install act  # macOS
# o
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# Ejecutar workflow de CI
act push

# Ejecutar un job específico
act push -j typecheck

# Ejecutar con secretos
act push -s GITHUB_TOKEN=tu_token
```

**⚠️ Limitaciones de act:**
- No ejecuta actions propietarias de GitHub (CodeQL, Dependency Review)
- Puede tener diferencias con el ambiente real de GitHub Actions

---

## 📈 Monitoreo del Pipeline

### Ver el estado del pipeline

1. En tu repositorio, ve a la pestaña **Actions**
2. Verás todos los workflows ejecutados

### Status Badges

Puedes agregar badges al README:

```markdown
![CI Status](https://github.com/tu-usuario/envivo/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/tu-usuario/envivo/actions/workflows/codeql.yml/badge.svg)
```

### Integración con Codecov (Opcional)

Para reportes de cobertura más detallados:

1. Crea cuenta en [codecov.io](https://codecov.io)
2. Conecta tu repositorio
3. El pipeline ya está configurado para subir reportes

---

## 🔧 Troubleshooting

### ❌ Build falla en CI pero funciona localmente

**Causa común:** Variables de entorno faltantes

**Solución:**
- El pipeline usa variables dummy para build
- Verifica que no dependas de variables de entorno en tiempo de build
- Usa `process.env` con fallbacks seguros

### ❌ E2E tests fallan en CI

**Causa común:** Base de datos no inicializada

**Solución:**
- El pipeline ejecuta `db:e2e:init` antes de los tests
- Verifica que el script funciona localmente
- Revisa logs de Playwright en artifacts

### ❌ Coverage por debajo del 80%

**Solución:**
```bash
# Ver qué archivos tienen baja cobertura
npm run test:coverage

# Abrir reporte HTML
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

Escribe tests para los archivos con baja cobertura.

### ❌ npm audit falla

**Solución:**
```bash
# Ver detalles
npm audit

# Actualizar dependencias
npm update

# Si no hay fix disponible, considerar:
# 1. Esperar a que el paquete se actualice
# 2. Usar un paquete alternativo
# 3. Documentar el riesgo aceptado (solo si es Low/Medium)
```

### ❌ CodeQL reporta falsos positivos

**Solución:**
- Revisa el reporte en la pestaña "Security" → "Code scanning alerts"
- Si es un falso positivo, marca como "False positive" con justificación
- Considera refactorizar el código para hacerlo más seguro

---

## 📚 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [Playwright CI](https://playwright.dev/docs/ci)
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)

---

**Última actualización:** Diciembre 2024
