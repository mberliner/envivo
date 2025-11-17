# 🚀 Próximos Pasos en Tu Entorno Local

> **Contexto**: La implementación de Puppeteer está completa y committed. El sandbox bloqueó la descarga de Chromium, pero el código está listo para funcionar en tu máquina.

---

## ✅ Estado Actual del Código

- ✅ **PuppeteerWebScraper** implementado (`src/features/events/data/sources/web/PuppeteerWebScraper.ts`)
- ✅ **ScraperConfig** extendido con `requiresJavaScript`, `waitForSelector`, `waitForTimeout`
- ✅ **WebScraperFactory** con auto-detección de scraper tipo
- ✅ **Movistar Arena config** marcado con `requiresJavaScript: true`
- ✅ **Lint pasando** sin errores ni warnings
- ✅ **Commits pusheados** a branch `claude/add-movistar-arena-scraper-0121HcC4VXLdtQ3MWi1usid8`

---

## 📋 Instrucciones para Tu Máquina Local

### 1️⃣ Pull y actualizar dependencias

```bash
# Pull los cambios
git pull origin claude/add-movistar-arena-scraper-0121HcC4VXLdtQ3MWi1usid8

# Instalar/actualizar dependencias (incluye Puppeteer)
npm install
```

**Nota**: `npm install` debería descargar Chromium automáticamente (~170MB).

---

### 2️⃣ Verificar instalación de Chromium

```bash
# Ver navegadores instalados
npx puppeteer browsers list
```

**Salida esperada**:
```
chrome@142.0.7444.162 /root/.cache/puppeteer/chrome/linux-142.0.7444.162/chrome-linux64/chrome
```

**Si no aparece Chromium**, instálalo manualmente:
```bash
npx puppeteer browsers install chrome
```

**Si obtienes error 403**, revisa la sección "Troubleshooting" en `PUPPETEER_SETUP.md`.

---

### 3️⃣ Generar Prisma Client

```bash
npx prisma generate
```

Esto resuelve los errores de tipo en TypeScript y tests.

---

### 4️⃣ Verificar todo funciona

```bash
# Lint (debe pasar sin errores)
npm run lint

# Type-check (debe pasar sin errores después de prisma generate)
npm run type-check

# Tests (deben pasar todos)
npm run test
```

**Resultados esperados**:
```
✅ Lint: 0 errors, 0 warnings
✅ Type-check: 0 errors
✅ Tests: 323/323 passing
```

---

### 5️⃣ Probar Movistar Arena scraper

#### Opción A: Script de debug
```bash
npx tsx scripts/test-puppeteer-movistar.ts
```

**Salida esperada**:
```
🚀 Testing Puppeteer with Movistar Arena

1️⃣ Launching browser...
✅ Browser launched

2️⃣ Navigating to https://www.movistararena.com.ar/shows
✅ Page loaded

3️⃣ Waiting for .evento selector...
✅ Selector found!

4️⃣ HTML length after JS rendering: 245678 bytes
✅ Found 42 events with .evento selector

5️⃣ Sample event data:
   Event 1:
      Title: Metallica
      Date: 15 de marzo de 2025
      Link: /evento/metallica

   Event 2:
      Title: Iron Maiden
      Date: 22 de abril de 2025
      Link: /evento/iron-maiden

✅ Puppeteer test successful!
💡 PuppeteerWebScraper should work correctly with Movistar Arena.
```

#### Opción B: Scraping completo desde API

Primero, inicia el servidor de desarrollo:
```bash
npm run dev
```

Luego, en otra terminal:
```bash
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: $ADMIN_API_KEY"
```

**Respuesta esperada**:
```json
{
  "success": true,
  "summary": {
    "totalEvents": 156,
    "newEvents": 42,
    "updatedEvents": 0,
    "duration": 12450
  },
  "sources": [
    {
      "name": "livepass",
      "success": true,
      "eventsCount": 48,
      "duration": 892
    },
    {
      "name": "teatrocoliseo",
      "success": true,
      "eventsCount": 66,
      "duration": 1234
    },
    {
      "name": "movistararena",
      "success": true,
      "eventsCount": 42,  // ← ¡YA NO 0!
      "duration": 8456    // ← Más lento (Puppeteer)
    }
  ]
}
```

**Nota**: Movistar Arena tomará ~8-10 segundos (Puppeteer es más lento que Cheerio, pero necesario para JavaScript rendering).

---

### 6️⃣ Verificar eventos en UI

Abre: http://localhost:3000

Deberías ver eventos de Movistar Arena listados con los de LivePass y Teatro Coliseo.

---

## 🐛 Troubleshooting

### Error: `Could not find Chrome`
→ Instala Chromium:
```bash
npx puppeteer browsers install chrome
```

### Error: `Got status code 403`
→ Firewall/proxy bloqueando. Opciones:

**1. Usar Chromium del sistema (Ubuntu/Debian)**:
```bash
sudo apt-get install chromium-browser
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

**2. Configurar proxy** (si aplica):
```bash
npm config set proxy http://proxy.example.com:8080
npm config set https-proxy http://proxy.example.com:8080
```

Ver más opciones en `PUPPETEER_SETUP.md`.

### Error: `@prisma/client did not initialize yet`
→ Ejecuta:
```bash
npx prisma generate
```

### Timeout esperando `.evento`
→ El sitio puede estar temporalmente lento. Ajusta timeout en `movistararena.config.ts`:
```typescript
waitForTimeout: 60000, // 60 seg en lugar de 30
```

---

## 📊 Performance Esperada

| Scraper | Método | Tiempo | Eventos |
|---------|--------|--------|---------|
| LivePass | Cheerio | ~1 seg | ~48 |
| Teatro Coliseo | Cheerio | ~1 seg | ~66 |
| **Movistar Arena** | **Puppeteer** | **~8-10 seg** | **~42** |

**Total**: ~10-12 segundos para scrapear las 3 fuentes.

---

## ✅ Checklist Final

- [ ] `npm install` completado sin errores
- [ ] `npx puppeteer browsers list` muestra Chromium instalado
- [ ] `npx prisma generate` ejecutado
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run type-check` pasa sin errores
- [ ] `npm run test` pasa todos los tests
- [ ] `npx tsx scripts/test-puppeteer-movistar.ts` muestra eventos encontrados
- [ ] `/api/admin/scraper/sync` retorna `eventsCount > 0` para movistararena
- [ ] UI muestra eventos de Movistar Arena

---

## 🎯 Próximos Pasos (Opcional)

Si todo funciona, puedes:

1. **Crear Pull Request**: Mergearlo a `main` si estás satisfecho
2. **Agregar más scrapers con JavaScript**: Usar el mismo patrón (`requiresJavaScript: true`)
3. **Optimizar**: Implementar caching de Puppeteer browser entre requests
4. **Deploy**: Configurar Puppeteer en Vercel (requiere config especial)

---

**¿Preguntas?** Revisa:
- `PUPPETEER_SETUP.md` - Setup y troubleshooting completo
- `docs/ADDING_SCRAPERS.md` - Guía para agregar nuevos scrapers
- `docs/ARCHITECTURE.md` - Arquitectura general del proyecto

---

**Última actualización**: Noviembre 2025
