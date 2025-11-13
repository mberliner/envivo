# 🔬 Guía de Diagnóstico de Tests E2E

Esta guía documenta las herramientas de diagnóstico para investigar race conditions y fallos aleatorios en tests E2E.

## 🎯 Herramientas Disponibles

### 1. Script de Diagnóstico Automatizado

**Archivo**: `scripts/diagnose-e2e.js`

Ejecuta tests múltiples veces y genera reporte consolidado.

#### Uso Básico

```bash
# Ejecutar 5 veces en modo producción (default)
npm run diagnose:e2e

# Ejecutar 10 veces en modo producción
npm run diagnose:e2e -- --runs=10

# Ejecutar 5 veces en modo desarrollo
npm run diagnose:e2e:dev

# Ejecutar 20 veces en modo dev
npm run diagnose:e2e:dev -- --runs=20
```

#### ¿Qué Hace?

1. ✅ Ejecuta tests E2E N veces consecutivamente
2. ✅ Captura traces y screenshots de cada fallo
3. ✅ Analiza patrones de navegación
4. ✅ Calcula estadísticas de timing
5. ✅ Genera reporte Markdown con análisis

#### Output

```
diagnostic-output/
└── 2025-11-13T15-30-00/
    ├── REPORT.md                    # 📊 Reporte principal
    ├── run-1-trace.zip              # 🎬 Trace del run #1
    ├── run-1-screenshot.png         # 📸 Screenshot del run #1
    ├── run-3-trace.zip              # 🎬 Trace del run #3
    └── run-3-screenshot.png         # 📸 Screenshot del run #3
```

#### Ejemplo de Uso

```bash
# 1. Ejecutar diagnóstico
npm run diagnose:e2e

# 2. Ver reporte
cat diagnostic-output/2025-11-13T15-30-00/REPORT.md

# 3. Ver trace de un fallo específico
npx playwright show-trace diagnostic-output/2025-11-13T15-30-00/run-1-trace.zip
```

---

### 2. Tests Diagnósticos Especializados

**Archivo**: `e2e/diagnostic.e2e.ts`

Tests específicos para investigar race conditions.

#### Tests Disponibles

| Test | Propósito |
|------|-----------|
| **Page Stability** | Verifica si href cambia después de carga inicial |
| **Href Population Timing** | Mide tiempo hasta que href esté poblado |
| **Re-render Detection** | Detecta si EventCard se renderiza múltiples veces |
| **Network Timing** | Captura timing de `/api/events` |
| **Scenario Simulation** | Simula test real con logging detallado |

#### Uso

```bash
# Ejecutar todos los tests diagnósticos
npm run test:diagnostic

# Ejecutar un test específico
npx playwright test diagnostic.e2e.ts -g "page stability"

# Con UI interactiva
npx playwright test diagnostic.e2e.ts --ui

# Con debug
npx playwright test diagnostic.e2e.ts --debug
```

#### Interpretar Logs

Los tests diagnósticos generan logs detallados en consola:

```
[DIAG] Starting page stability test...
[DIAG] Page loaded
[DIAG] Event cards appeared
[DIAG] Initial href: /eventos/abc123 at 1699890000000
[DIAG] After 1s href: /eventos/abc123 at 1699890001000
[DIAG] After 3s href: /eventos/abc123 at 1699890003000
[DIAG] ✅ Href stable across 3 seconds
```

**Buscar estos patrones:**
- ⚠️ `HREF CHANGED between checks!` → Confirma re-render
- ⚠️ `Large gap between API response and cards visible` → Confirma timing issue
- ⚠️ `EventCard was added X times` → Confirma re-renders

---

## 📊 Interpretando el Reporte

### Sección: Resumen Ejecutivo

```markdown
| **Success Rate** | 60% |
```

- **>95%**: Tests estables, posible fix efectivo
- **80-95%**: Race condition ocasional
- **<80%**: Problema sistemático

### Sección: Timing Analysis

```markdown
| **Pasados** | 850ms |
| **Fallados** | 25100ms |
| **Δ (Failed - Passed)** | 24250ms |
```

⚠️ **ALERTA**: Si fallados > 2× pasados → timeout esperando condición que nunca se cumple

### Sección: Patrón de Fallos

```markdown
| `http://localhost:3001/` | 3/5 (60%) |
```

⚠️ **CONFIRMADO**: Navegación a "/" confirma race condition en hidratación

### Sección: Recomendaciones

El reporte incluye recomendaciones específicas basadas en los patrones detectados.

---

## 🎬 Usando Trace Viewer

Playwright trace es la herramienta MÁS PODEROSA para debugging:

```bash
npx playwright show-trace diagnostic-output/[timestamp]/run-1-trace.zip
```

### Qué Buscar en el Trace

#### 1. Timeline Tab
- Ver cuándo ocurre el click exactamente
- Ver cambios en el DOM antes/después del click
- Identificar re-renders visuales

#### 2. Network Tab
- Ver cuándo completa `/api/events`
- Verificar timing entre fetch y click
- Buscar requests inesperados

#### 3. Snapshots Tab
- Ver estado exacto del DOM en cada paso
- Inspeccionar el elemento en el momento del click
- Ver valor de `href` atributo

#### 4. Source Tab
- Ver exactamente qué línea de código falló
- Contexto del error con variables

---

## 🔍 Workflow de Diagnóstico Recomendado

### Paso 1: Ejecutar Diagnóstico Automatizado

```bash
npm run diagnose:e2e -- --runs=10
```

**Objetivo**: Confirmar que el problema existe y es reproducible.

**Buscar**:
- Success rate < 100%
- Patrón consistente de navegación a "/"

### Paso 2: Ver Reporte

```bash
cat diagnostic-output/[timestamp]/REPORT.md
```

**Objetivo**: Entender patrones y frecuencia.

**Buscar**:
- Timing delta entre pasados/fallados
- Patrón de navegación
- Consecutividad de fallos

### Paso 3: Analizar Trace

```bash
npx playwright show-trace diagnostic-output/[timestamp]/run-X-trace.zip
```

**Objetivo**: Ver exactamente qué pasó en el navegador.

**Buscar**:
- Timing entre API response y click
- Valor de href antes del click
- Cambios en DOM

### Paso 4: Tests Diagnósticos

```bash
npm run test:diagnostic
```

**Objetivo**: Confirmar hipótesis específicas.

**Buscar en logs**:
- `HREF CHANGED between checks`
- Gap entre API y cards visible
- Render counts

### Paso 5: Implementar Fix

Basado en evidencia recopilada, implementar una de estas soluciones:

#### Solución A: Esperar Estabilidad del DOM
```typescript
await page.waitForFunction(
  () => {
    const link = document.querySelector('[data-testid="event-card"] a[href*="/eventos/"]');
    return link && link.getAttribute('href')?.match(/\/eventos\/.+/);
  },
  { timeout: 5000 }
);
```

#### Solución B: Re-query Antes de Click
```typescript
// No guardar referencia
await page.locator('[data-testid="event-card"]')
  .first()
  .getByRole('link', { name: 'Ver Detalles' })
  .click();
```

#### Solución C: Data Attribute Más Robusto
```tsx
<Link href={`/eventos/${event.id}`} data-testid="event-details-link">
  Ver Detalles
</Link>
```

### Paso 6: Validar Fix

```bash
# Ejecutar diagnóstico con más runs
npm run diagnose:e2e -- --runs=20

# Debe tener success rate = 100%
```

---

## 🚨 Troubleshooting

### "Script no encuentra los tests"

```bash
# Verificar que el build existe
npm run build

# O ejecutar en modo dev
npm run diagnose:e2e:dev
```

### "No se generan traces"

Los traces solo se generan cuando hay fallos. Si todos pasan, no habrá traces.

```bash
# Forzar captura de traces siempre
npx playwright test --trace on
```

### "Timeout muy largo"

El script tiene timeout de 2 minutos por run. Si tarda más:

```bash
# Reducir número de runs
npm run diagnose:e2e -- --runs=3
```

---

## 📚 Referencias

- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Debugging E2E Tests](https://playwright.dev/docs/debug)
- [Race Conditions in E2E](https://playwright.dev/docs/test-assertions#auto-waiting)
- [docs/E2E_TESTING.md](../docs/E2E_TESTING.md) - Guía general de E2E testing

---

**Última actualización**: Noviembre 2025
