# Setup de Puppeteer para Movistar Arena

## ¿Por qué Puppeteer?

Movistar Arena usa **Blazor Server** (framework .NET) que renderiza TODO el contenido dinámicamente con JavaScript via WebSocket. Cheerio solo puede leer HTML estático, por lo que no encuentra ningún evento.

Puppeteer lanza un navegador headless (Chromium) que ejecuta JavaScript y espera a que el contenido se cargue, luego extrae el HTML ya renderizado.

---

## Instalación

### Opción 1: Instalación Automática (Recomendada)

```bash
npm install puppeteer
```

**Nota**: Puppeteer descargará Chromium (~170MB) automáticamente.

### Opción 2: Si la instalación automática falla

Si obtienes error 403 o problemas de red:

```bash
# Instalar Chromium manualmente
npx puppeteer browsers install chrome

# O especificar versión
npx puppeteer browsers install chrome@stable
```

### Verificar instalación

```bash
# Ver navegadores instalados
npx puppeteer browsers list

# Debería mostrar algo como:
# chrome@142.0.7444.162 /root/.cache/puppeteer/chrome/linux-142.0.7444.162/chrome-linux64/chrome
```

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

### Error: `Cannot find module 'puppeteer'`
→ Ejecuta `npm install puppeteer`

### Error: `Could not find Chrome (ver. 142.0.7444.162)`
→ Chromium no está instalado. Ejecuta:
```bash
npx puppeteer browsers install chrome
```

### Error: `Got status code 403` durante instalación
→ El firewall/proxy está bloqueando la descarga. Opciones:
1. **Configurar proxy** (si aplica):
   ```bash
   npm config set proxy http://proxy.example.com:8080
   npm config set https-proxy http://proxy.example.com:8080
   ```
2. **Usar Chromium del sistema** (Ubuntu/Debian):
   ```bash
   sudo apt-get install chromium-browser
   # Luego configurar PUPPETEER_EXECUTABLE_PATH
   export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   ```
3. **Descargar Chromium manualmente**:
   - Descargar desde: https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html
   - Extraer en `~/.cache/puppeteer/chrome/`
   - Configurar `PUPPETEER_EXECUTABLE_PATH`

### Error: `Failed to launch browser`
→ En servidores sin GUI, instala dependencias:
```bash
# Ubuntu/Debian
sudo apt-get install -y \
  chromium-browser \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

### Timeout esperando selector
→ Aumenta `waitForTimeout` en la config o ajusta `waitForSelector`

### Sandbox restrictions (Docker/CI)
→ Agrega flags al launch de Puppeteer:
```typescript
await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ],
});
```
**Nota**: `PuppeteerWebScraper` ya incluye estos flags por defecto.

---

**Última actualización**: Noviembre 2025
