# GitHub Workflows

Este directorio contiene los workflows de CI/CD para el proyecto EnVivo.

## 📁 Estructura

```
.github/
├── workflows/
│   ├── ci.yml           # Pipeline principal de CI
│   └── codeql.yml       # Análisis de seguridad CodeQL
├── CI_SETUP.md          # Guía completa de configuración
└── README.md            # Este archivo
```

## 🚀 Workflows Disponibles

### CI Pipeline (`ci.yml`)

Pipeline completo de integración continua con 8 validaciones:

- ✅ Type Check (TypeScript)
- ✅ Lint (ESLint + Prettier)
- ✅ Build (Next.js)
- ✅ Unit Tests (Vitest + Coverage ≥80%)
- ✅ E2E Tests (Playwright)
- ✅ Security Audit (npm audit)
- ✅ Dependency Check (Dependency Review)
- ✅ Best Practices (Custom checks)

**Triggers:**
- Push a `main` o `claude/**`
- Pull requests hacia `main`
- Ignora cambios en archivos de documentación (*.md, docs/, etc.)

### CodeQL Analysis (`codeql.yml`)

Análisis estático de seguridad que detecta vulnerabilidades como:
- SQL Injection
- XSS
- Command Injection
- Path Traversal
- Exposición de secretos

**Triggers:**
- Push a `main`
- Pull requests hacia `main`
- Schedule semanal (lunes 6 AM UTC)

## 📚 Documentación Completa

**Ver [CI_SETUP.md](CI_SETUP.md) para:**
- Configuración de Branch Protection Rules
- Detalles de cada check de calidad
- Troubleshooting
- Testing local con `act`

## 🔒 Calidad de Código

Todos los checks deben pasar para permitir el merge a `main`. Esto garantiza:

- 🎯 Código sin errores de tipo
- 🧹 Estilo consistente
- ✅ 100% de tests passing
- 📊 Cobertura mínima del 80%
- 🛡️ 0 vulnerabilidades High/Critical
- 🔐 Sin secretos hardcodeados

## ⚡ Quick Start

```bash
# Ejecutar todos los checks localmente
npm run type-check
npm run lint
npm run build
npm run test:coverage
npm run test:e2e:prod
npm audit --audit-level=high
```

## 🔗 Enlaces Útiles

- [Configuración Completa](CI_SETUP.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
