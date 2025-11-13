# Tests E2E - Guía de Uso

Este documento describe los dos modos configurados para ejecutar tests E2E con Playwright.

---

## 📋 Resumen de Modos

| Modo | Comando | Servidor | Workers | Navegador | Uso Principal | Tiempo |
|------|---------|----------|---------|-----------|---------------|--------|
| **Development** | `npm run test:e2e` | Dev (`npm run dev`) | 1 (secuencial) | Chromium | Desarrollo e iteración rápida | ~15s |
| **Production** | `npm run test:e2e:prod` | Build + Start (puerto 3001) | 4 (paralelo) | Chromium | Validación pre-deploy / CI | ~75s (primera vez)<br>~8s (subsecuente) |

---

## 🔧 Modo 1: Development (Actual)

### Características
- ✅ Ejecuta tests **secuencialmente** (1 worker)
- ✅ Usa servidor de desarrollo (`npm run dev`)
- ✅ Rápido para iterar durante desarrollo
- ✅ Hot reload si cambias código

### Comando
```bash
npm run test:e2e
```

### Configuración
- **Archivo**: `playwright.config.ts`
- **Puerto**: 3000
- **Workers**: 1
- **Paralelismo**: Desactivado (`fullyParallel: false`)
- **Navegador**: Chromium (Desktop Chrome)
- **Reporter**: Lista en consola + HTML (no se abre automáticamente)

### Cuándo usar
- ✅ Durante desarrollo de nuevos tests
- ✅ Debugging de tests fallando
- ✅ Iteración rápida sobre cambios

### Ejemplo
```bash
# Desarrollo normal
npm run test:e2e

# Con UI para debugging
npm run test:e2e:ui

# Modo debug (paso a paso)
npm run test:e2e:debug
```

---

## 🚀 Modo 2: Production (Nuevo)

### Características
- ✅ Ejecuta tests **en paralelo** (4 workers)
- ✅ Usa build de producción (`npm run build` + `npm start`)
- ✅ Valida comportamiento real de producción
- ✅ Optimizado para CI/CD

### Comando
```bash
npm run test:e2e:prod
```

### Configuración
- **Archivo**: `playwright.config.prod.ts`
- **Puerto**: 3001 (para no conflictuar con dev)
- **Workers**: 4
- **Paralelismo**: Activado (`fullyParallel: true`)
- **Navegador**: Chromium (Desktop Chrome)
- **Retries**: 1 en local, 2 en CI
- **Reporter**: Lista en consola + HTML (no se abre automáticamente)

### Cuándo usar
- ✅ Antes de hacer push/deploy
- ✅ En pipelines de CI/CD
- ✅ Validación final de features
- ✅ Testing de rendimiento

### ⚡ Performance
**Primera ejecución** (~75s):
```bash
npm run build       # ~60s
npm start           # ~2s (startup)
playwright test     # ~13-15s (paralelo con 4 workers)
```

**Ejecuciones subsecuentes** (~15s):
```bash
# Si no cambió el código, reutiliza el build anterior
playwright test     # ~13-15s
```

### Ejemplo
```bash
# Validación completa (hace build automáticamente)
npm run test:e2e:prod

# Solo tests (si ya tienes el build)
E2E_BASE_URL=http://localhost:3001 playwright test --config=playwright.config.prod.ts
```

---

## 🔀 Comparación Técnica

### Development Mode
```typescript
// playwright.config.ts
{
  workers: 1,                    // Secuencial
  fullyParallel: false,          // Sin paralelismo
  reporter: [
    ['list'],                    // Progreso en consola
    ['html', { open: 'never' }]  // HTML sin abrir automáticamente
  ],
  webServer: {
    command: 'npm run dev',      // Servidor dev
    url: 'http://localhost:3000'
  }
}
```

### Production Mode
```typescript
// playwright.config.prod.ts
{
  workers: 4,                    // 4 workers paralelos
  fullyParallel: true,           // Paralelismo completo
  reporter: [
    ['list'],                    // Progreso en consola
    ['html', { open: 'never' }]  // HTML sin abrir automáticamente
  ],
  webServer: {
    command: 'npm run start:test', // Servidor prod (puerto 3001)
    url: 'http://localhost:3001'
  }
}
```

---

## 📊 Benchmarks

### Tiempos Esperados

#### Development Mode (Secuencial)
```
Running 4 tests using 1 worker

✓ [chromium] › home.e2e.ts:homepage     (3s)
✓ [chromium] › search.e2e.ts:search     (4s)
✓ [chromium] › detail.e2e.ts:navigation (4s)
✓ [chromium] › detail.e2e.ts:blacklist  (4s)

4 passed (15s)
```

#### Production Mode (Paralelo)
```
Running 4 tests using 4 workers

✓ [chromium] › home.e2e.ts:homepage     (3s)
✓ [chromium] › search.e2e.ts:search     (4s)
✓ [chromium] › detail.e2e.ts:navigation (4s)
✓ [chromium] › detail.e2e.ts:blacklist  (4s)

4 passed (8s)  ← Todos ejecutados en paralelo
```

**Ganancia**: ~50% más rápido en tests (pero requiere build inicial)

---

## 🛠️ Configuración de CI/CD

### GitHub Actions (Ejemplo)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-prod:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Instalar dependencias
      - run: npm ci

      # Instalar navegadores de Playwright
      - run: npx playwright install --with-deps

      # Ejecutar tests en modo producción (paralelo)
      - run: npm run test:e2e:prod
        env:
          CI: true

      # Subir reportes si fallan
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🐛 Troubleshooting

### ¿Cómo habilitar testing en mobile?

Por defecto, los tests solo se ejecutan en Chromium (desktop) para ser más rápidos.

**Para habilitar mobile:**
1. Descomenta la línea en `playwright.config.ts` (línea 23):
   ```typescript
   { name: 'mobile', use: { ...devices['iPhone 13'] } },
   ```
2. Ejecuta: `npm run test:e2e`

Ahora ejecutará 8 tests (4 en chromium + 4 en mobile)

### Tests fallan solo en production mode

**Causa**: Diferencias entre dev y producción (ej: optimizaciones, code splitting)

**Solución**:
```bash
# Revisar logs del servidor de producción
npm run build
npm run start:test  # Puerto 3001

# En otra terminal, ejecutar solo los tests
E2E_BASE_URL=http://localhost:3001 playwright test --config=playwright.config.prod.ts
```

### Puerto 3001 ocupado

**Causa**: Servidor de producción anterior no se cerró

**Solución**:
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Build muy lento

**Causa**: Primera ejecución o cambios en muchos archivos

**Optimización**:
```bash
# Usar Turbopack (más rápido)
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 npm run build

# O ejecutar build solo una vez y reutilizarlo
npm run build
npm run start:test &  # Background
sleep 5               # Esperar que inicie
playwright test --config=playwright.config.prod.ts
```

---

## 📝 Scripts Disponibles

```json
{
  "test:e2e": "playwright test",
  "test:e2e:prod": "npm run build && E2E_BASE_URL=http://localhost:3001 playwright test --config=playwright.config.prod.ts",
  "test:e2e:vercel": "E2E_BASE_URL=https://envivo.vercel.app playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug"
}
```

### Otros comandos útiles

```bash
# Ver reporte HTML del último test (se genera automáticamente pero no se abre)
npx playwright show-report

# Ejecutar solo un archivo
npm run test:e2e -- home.e2e.ts

# Ejecutar en mobile (deshabilitado por defecto)
# Primero descomentar línea 23 en playwright.config.ts
npm run test:e2e -- --project=mobile

# Actualizar snapshots
npm run test:e2e -- --update-snapshots
```

---

## ✅ Checklist Pre-Deploy

Antes de hacer deploy a producción, ejecuta:

```bash
# 1. Verificar tipos
npm run type-check

# 2. Verificar linting
npm run lint

# 3. Ejecutar tests unitarios
npm test

# 4. Ejecutar tests E2E en modo PRODUCCIÓN
npm run test:e2e:prod

# 5. Si todo pasa, hacer commit y push
git add .
git commit -m "feat: nueva funcionalidad con tests E2E"
git push origin main
```

---

## 🎯 Recomendaciones

1. **Durante desarrollo**: Usa `npm run test:e2e` (modo dev, secuencial)
   - Más rápido para iterar
   - Feedback inmediato

2. **Antes de commit**: Usa `npm run test:e2e:prod` (modo prod, paralelo)
   - Valida comportamiento de producción
   - Detecta issues de optimización

3. **En CI/CD**: Usa `npm run test:e2e:prod` con `CI=true`
   - Aprovecha paralelismo
   - Retries automáticos

4. **Para debugging**: Usa `npm run test:e2e:ui` o `npm run test:e2e:debug`
   - Interfaz visual
   - Paso a paso

---

**Última actualización**: Noviembre 2025
