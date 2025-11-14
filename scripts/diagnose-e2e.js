#!/usr/bin/env node
/**
 * Diagnóstico automatizado de race conditions en tests E2E
 *
 * Este script:
 * 1. Ejecuta tests E2E múltiples veces
 * 2. Captura traces, screenshots, y logs
 * 3. Analiza patrones de fallos
 * 4. Genera reporte consolidado
 *
 * Uso:
 *   node scripts/diagnose-e2e.js [--runs=5] [--mode=prod]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const config = {
  runs: parseInt(process.argv.find(arg => arg.startsWith('--runs='))?.split('=')[1] || '5'),
  mode: process.argv.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'prod',
  outputDir: path.join(process.cwd(), 'diagnostic-output'),
  timestamp: new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5),
};

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'cyan');
  log('='.repeat(60), 'cyan');
}

// Crear directorio de salida
function setupOutputDir() {
  const runDir = path.join(config.outputDir, config.timestamp);
  if (!fs.existsSync(runDir)) {
    fs.mkdirSync(runDir, { recursive: true });
  }
  return runDir;
}

// Ejecutar tests y capturar resultados
function runTests(runNumber, runDir) {
  log(`\n▶ Run #${runNumber}/${config.runs}`, 'blue');

  const testCmd = config.mode === 'prod' ? 'npm run test:e2e:prod' : 'npm run test:e2e';
  const startTime = Date.now();

  try {
    const output = execSync(testCmd, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 120000, // 2 minutos max
    });

    const duration = Date.now() - startTime;
    log(`  ✓ Passed (${duration}ms)`, 'green');

    return {
      run: runNumber,
      success: true,
      duration,
      output,
      error: null,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const output = error.stdout || '';
    const errorOutput = error.stderr || '';

    // Parsear información del fallo
    const failedTest = output.match(/\[chromium\] › (.+?) \(.*?\)/)?.[1] || 'unknown';
    const timeoutMatch = output.match(/Timeout (\d+)ms exceeded/);
    const navigatedTo = output.match(/navigated to "(.+?)"/)?.[1];

    log(`  ✗ Failed (${duration}ms)`, 'red');
    log(`    Test: ${failedTest}`, 'yellow');
    if (timeoutMatch) log(`    Timeout: ${timeoutMatch[1]}ms`, 'yellow');
    if (navigatedTo) log(`    Navigated to: ${navigatedTo}`, 'yellow');

    // Copiar artifacts
    copyArtifacts(runNumber, runDir);

    return {
      run: runNumber,
      success: false,
      duration,
      output,
      error: errorOutput,
      failedTest,
      timeout: timeoutMatch ? parseInt(timeoutMatch[1]) : null,
      navigatedTo,
    };
  }
}

// Copiar traces y screenshots del fallo
function copyArtifacts(runNumber, runDir) {
  const testResultsDir = path.join(process.cwd(), 'test-results');

  if (!fs.existsSync(testResultsDir)) {
    return;
  }

  const artifacts = fs.readdirSync(testResultsDir);

  artifacts.forEach(artifact => {
    const artifactPath = path.join(testResultsDir, artifact);
    const stat = fs.statSync(artifactPath);

    if (stat.isDirectory()) {
      // Copiar trace.zip y screenshots
      const tracePath = path.join(artifactPath, 'trace.zip');
      const screenshotPath = path.join(artifactPath, 'test-failed-1.png');

      if (fs.existsSync(tracePath)) {
        const destTrace = path.join(runDir, `run-${runNumber}-trace.zip`);
        fs.copyFileSync(tracePath, destTrace);
        log(`    📦 Trace: ${destTrace}`, 'magenta');
      }

      if (fs.existsSync(screenshotPath)) {
        const destScreenshot = path.join(runDir, `run-${runNumber}-screenshot.png`);
        fs.copyFileSync(screenshotPath, destScreenshot);
        log(`    📸 Screenshot: ${destScreenshot}`, 'magenta');
      }
    }
  });
}

// Generar estadísticas
function generateStats(results) {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = ((passed / total) * 100).toFixed(1);

  const avgDuration = (results.reduce((sum, r) => sum + r.duration, 0) / total).toFixed(0);
  const avgPassedDuration = passed > 0
    ? (results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / passed).toFixed(0)
    : 0;
  const avgFailedDuration = failed > 0
    ? (results.filter(r => !r.success).reduce((sum, r) => sum + r.duration, 0) / failed).toFixed(0)
    : 0;

  // Patrones de fallos
  const failedTests = results.filter(r => !r.success);
  const navigatedToPattern = failedTests
    .map(r => r.navigatedTo)
    .filter(Boolean)
    .reduce((acc, url) => {
      acc[url] = (acc[url] || 0) + 1;
      return acc;
    }, {});

  return {
    total,
    passed,
    failed,
    successRate,
    avgDuration,
    avgPassedDuration,
    avgFailedDuration,
    navigatedToPattern,
    failedOnFirstRun: !results[0]?.success,
    consecutiveFails: calculateConsecutiveFails(results),
  };
}

function calculateConsecutiveFails(results) {
  let maxConsecutive = 0;
  let current = 0;

  results.forEach(r => {
    if (!r.success) {
      current++;
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 0;
    }
  });

  return maxConsecutive;
}

// Generar reporte Markdown
function generateReport(results, stats, runDir) {
  const reportPath = path.join(runDir, 'REPORT.md');

  const report = `# 🔬 Diagnóstico E2E - ${config.timestamp}

## 📊 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Total Runs** | ${stats.total} |
| **Pasados** | ${stats.passed} ✅ |
| **Fallados** | ${stats.failed} ❌ |
| **Success Rate** | ${stats.successRate}% |
| **Modo** | ${config.mode} |

## ⏱️ Timing Analysis

| Tipo | Duración Promedio |
|------|-------------------|
| **General** | ${stats.avgDuration}ms |
| **Pasados** | ${stats.avgPassedDuration}ms |
| **Fallados** | ${stats.avgFailedDuration}ms |
| **Δ (Failed - Passed)** | ${stats.avgFailedDuration - stats.avgPassedDuration}ms |

${stats.avgFailedDuration > stats.avgPassedDuration * 2 ? `
⚠️ **ALERTA**: Los tests fallados tardan significativamente más (${((stats.avgFailedDuration / stats.avgPassedDuration) * 100).toFixed(0)}% más).
Esto sugiere **timeout esperando condición que nunca se cumple**.
` : ''}

## 🎯 Patrón de Fallos

${stats.failed > 0 ? `
### Navegación Observada en Fallos

| URL Destino | Frecuencia |
|-------------|------------|
${Object.entries(stats.navigatedToPattern).map(([url, count]) => `| \`${url}\` | ${count}/${stats.failed} (${((count/stats.failed)*100).toFixed(0)}%) |`).join('\n')}

${stats.navigatedToPattern['http://localhost:3001/'] || stats.navigatedToPattern['http://localhost:3000/'] ? `
⚠️ **CONFIRMADO**: Tests navegan a homepage ("/") en lugar de detalle de evento.
Esto confirma la hipótesis de **race condition en hidratación/re-render**.
` : ''}

### Consecutividad

- **Máximo fallos consecutivos**: ${stats.consecutiveFails}
- **Falló en primera corrida**: ${stats.failedOnFirstRun ? 'SÍ ⚠️' : 'NO ✅'}

${stats.consecutiveFails > 1 ? `
⚠️ **ALERTA**: Múltiples fallos consecutivos sugieren problema sistemático, no solo race condition aleatoria.
` : ''}
` : `
✅ **Todos los tests pasaron** en ${stats.total} corridas.
El problema puede haberse resuelto o no se reprodujo en estas condiciones.
`}

## 📝 Detalle de Corridas

| Run | Estado | Duración | Test Fallado | Navegó a |
|-----|--------|----------|--------------|----------|
${results.map(r => `| #${r.run} | ${r.success ? '✅' : '❌'} | ${r.duration}ms | ${r.failedTest || '-'} | ${r.navigatedTo ? `\`${r.navigatedTo}\`` : '-'} |`).join('\n')}

## 🔍 Análisis de Hipótesis

### ✅ Hipótesis Confirmadas

${stats.navigatedToPattern['http://localhost:3001/'] || stats.navigatedToPattern['http://localhost:3000/'] ? `
- ✅ **Re-render Post-Fetch**: Navegación a "/" confirma que el \`href\` cambia después del check
- ✅ **Race Condition**: Timing inconsistente entre corridas
- ✅ **Problema de Hidratación**: Click ocurre antes de que React complete el re-render con datos del fetch
` : ''}

${stats.failed === 0 ? `
- ✅ **Tests Estables**: ${stats.total} corridas exitosas sugieren que el fix actual es efectivo
` : ''}

### ❌ Hipótesis Descartadas

${stats.avgFailedDuration < 10000 ? `
- ❌ **Timeout por red lenta**: Fallos ocurren rápido (<10s), no por timeout de red
` : ''}

## 🎬 Artifacts Capturados

${results.filter(r => !r.success).map(r => `
### Run #${r.run}

- **Trace**: \`run-${r.run}-trace.zip\`
  \`\`\`bash
  npx playwright show-trace ${runDir}/run-${r.run}-trace.zip
  \`\`\`

- **Screenshot**: \`run-${r.run}-screenshot.png\`
`).join('\n')}

${results.filter(r => !r.success).length === 0 ? '_No hay artifacts (todos los tests pasaron)_' : ''}

## 💡 Recomendaciones

${stats.failed > 0 && stats.navigatedToPattern['http://localhost:3001/'] ? `
### Inmediatas

1. **Esperar estabilidad del DOM** antes de interactuar:
   \`\`\`typescript
   // Esperar que el fetch complete y el DOM se estabilice
   await page.waitForFunction(
     () => {
       const link = document.querySelector('[data-testid="event-card"] a[href*="/eventos/"]');
       return link && link.getAttribute('href')?.match(/\\/eventos\\/.+/);
     },
     { timeout: 5000 }
   );
   \`\`\`

2. **Re-query el elemento** justo antes de click (no usar referencia cached):
   \`\`\`typescript
   // ❌ MALO: referencia puede quedar stale
   const link = page.locator('a');
   await link.click();

   // ✅ BUENO: re-query antes de cada acción
   await page.locator('a').click();
   \`\`\`

3. **Agregar data-testid al Link** para selector más robusto:
   \`\`\`typescript
   <Link href={\`/eventos/\${event.id}\`} data-testid="event-details-link">
   \`\`\`
` : ''}

${stats.failed === 0 ? `
### Validación Adicional

Aunque todos los tests pasaron:

1. Ejecutar más corridas para confirmar estabilidad (--runs=20)
2. Probar en CI/CD con diferentes condiciones de red
3. Agregar tests de carga (múltiples tabs simultáneos)
` : ''}

## 🔗 Referencias

- Trace viewer: \`npx playwright show-trace <trace.zip>\`
- Test file: \`e2e/event-detail.e2e.ts:41\`
- Component: \`src/features/events/ui/components/EventCard.tsx\`
- Page: \`src/features/events/ui/components/EventsPage.tsx\`

---

**Generado**: ${new Date().toISOString()}
**Modo**: ${config.mode}
**Runs**: ${config.total}
`;

  fs.writeFileSync(reportPath, report);
  return reportPath;
}

// Main
async function main() {
  logSection('🔬 E2E Diagnostic Tool');

  log(`Configuration:`, 'cyan');
  log(`  Runs: ${config.runs}`);
  log(`  Mode: ${config.mode}`);
  log(`  Output: ${config.outputDir}`);

  const runDir = setupOutputDir();
  log(`  Run dir: ${runDir}`, 'green');

  logSection('🏃 Running Tests');

  const results = [];
  for (let i = 1; i <= config.runs; i++) {
    const result = runTests(i, runDir);
    results.push(result);

    // Pequeña pausa entre runs
    if (i < config.runs) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  logSection('📊 Generating Statistics');

  const stats = generateStats(results);

  log(`\nSuccess Rate: ${stats.successRate}%`, stats.failed === 0 ? 'green' : 'yellow');
  log(`Passed: ${stats.passed}/${stats.total}`, 'green');
  log(`Failed: ${stats.failed}/${stats.total}`, stats.failed > 0 ? 'red' : 'green');
  log(`Avg Duration: ${stats.avgDuration}ms`);

  if (stats.failed > 0) {
    log(`\nFailure Patterns:`, 'yellow');
    Object.entries(stats.navigatedToPattern).forEach(([url, count]) => {
      log(`  ${url}: ${count} times`, 'yellow');
    });
  }

  logSection('📄 Generating Report');

  const reportPath = generateReport(results, stats, runDir);
  log(`\n✅ Report generated: ${reportPath}`, 'green');

  log(`\nView report:`, 'cyan');
  log(`  cat ${reportPath}`, 'blue');

  if (results.some(r => !r.success)) {
    log(`\nView traces:`, 'cyan');
    results.filter(r => !r.success).forEach(r => {
      log(`  npx playwright show-trace ${runDir}/run-${r.run}-trace.zip`, 'blue');
    });
  }

  logSection('🎉 Diagnosis Complete');

  // Exit code
  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
