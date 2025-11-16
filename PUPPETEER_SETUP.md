# Setup de Puppeteer para Movistar Arena

## ¿Por qué Puppeteer?

Movistar Arena usa **Blazor Server** (framework .NET) que renderiza TODO el contenido dinámicamente con JavaScript via WebSocket. Cheerio solo puede leer HTML estático, por lo que no encuentra ningún evento.

Puppeteer lanza un navegador headless (Chromium) que ejecuta JavaScript y espera a que el contenido se cargue, luego extrae el HTML ya renderizado.

---

## Instalación

```bash
npm install puppeteer
```

**Nota**: Puppeteer descargará Chromium (~170MB) automáticamente.

---

## Verificación

Después de instalar, ejecuta:

```bash
npx tsx scripts/debug-movistararena.ts
```

Deberías ver:
```
[movistararena] Loading Puppeteer...
[movistararena] Launching headless browser...
[movistararena] Scraping with Puppeteer: https://www.movistararena.com.ar/shows
[movistararena] Waiting for selector: .evento
[movistararena] ✅ Selector found: .evento
[movistararena] Found 40+ items with selector: .evento
```

---

## Cómo Funciona

1. **Auto-detección**: WebScraperFactory detecta `requiresJavaScript: true` en la config
2. **Puppeteer**: Lanza navegador headless Chromium
3. **Render**: Espera a que JavaScript cargue los eventos (selector `.evento`)
4. **Extracción**: Usa Cheerio para parsear el HTML renderizado
5. **Reutilización**: Usa los mismos selectores, transforms y lógica que GenericWebScraper

---

## Arquitectura

```
IDataSource (interface)
    ↑
    ├── GenericWebScraper (Cheerio - HTML estático)
    │   └── LivePass, Teatro Coliseo  ← Rápido (< 1 seg)
    │
    └── PuppeteerWebScraper (Puppeteer - JavaScript)
        └── Movistar Arena  ← Más lento (~5-10 seg)
```

**Ventajas:**
- ✅ Mismo `IDataSource` interface
- ✅ Misma configuración `ScraperConfig`
- ✅ Mismo orchestrator
- ✅ Selectores y transforms reutilizados
- ✅ Puppeteer solo se instala y usa si es necesario

---

## Futuros Scrapers con JavaScript

Para agregar otro sitio que requiera JavaScript:

```typescript
export const otroSitioConfig: ScraperConfig = {
  name: 'otrositi o',
  type: 'web',
  baseUrl: 'https://ejemplo.com',

  // Marcar que requiere JavaScript
  requiresJavaScript: true,
  waitForSelector: '.evento', // Selector que aparece cuando JS termina
  waitForTimeout: 30000, // 30 seg máximo

  // ... resto de config igual que siempre
  listing: { ... },
  selectors: { ... },
  // etc.
};
```

**El factory automáticamente usará PuppeteerWebScraper.**

---

## Performance

- **GenericWebScraper (Cheerio)**: ~500ms por página
- **PuppeteerWebScraper**: ~5-10 segundos por página

Por eso solo usamos Puppeteer cuando es absolutamente necesario.

---

## Troubleshooting

**Error: `Cannot find module 'puppeteer'`**
→ Ejecuta `npm install puppeteer`

**Error: `Failed to launch browser`**
→ En servidores sin GUI, instala dependencias:
```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# O usa puppeteer con bundled Chromium
npm install puppeteer  # (no puppeteer-core)
```

**Timeout esperando selector**
→ Aumenta `waitForTimeout` en la config o ajusta `waitForSelector`

---

**Última actualización**: Noviembre 2025
