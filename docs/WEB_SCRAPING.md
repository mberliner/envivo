# Web Scraping - Guía Completa

> Sistema config-driven para scrapear eventos de sitios web sin APIs públicas

---

## 📋 Tabla de Contenidos

- [Overview](#overview)
- [Arquitectura](#arquitectura)
- [Quick Start](#quick-start)
- [Agregar un Nuevo Sitio](#agregar-un-nuevo-sitio)
- [Configuración Avanzada](#configuración-avanzada)
- [Transformaciones](#transformaciones)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Buenas Prácticas](#buenas-prácticas)

---

## Overview

El sistema de web scraping permite extraer eventos de sitios web HTML usando **configuraciones declarativas**. No requiere escribir código nuevo para cada sitio, solo definir selectores CSS y transformaciones.

### Características

✅ **Config-driven** - Define selectores CSS en archivos de configuración
✅ **Rate limiting** - Respeta límites de requests por segundo
✅ **Retry automático** - Exponential backoff (1s, 2s, 4s)
✅ **Paginación** - Soporte para múltiples páginas
✅ **Transformaciones** - Parseo de fechas en español, precios, sanitización HTML
✅ **Error handling graceful** - Continúa scraping aunque eventos individuales fallen
✅ **Integración con Orchestrator** - Compatible con DataSourceOrchestrator
✅ **Tests comprehensivos** - Tests unitarios con fixtures HTML reales

### Sitios Configurados

| Sitio | Estado | Config |
|-------|--------|--------|
| LivePass.com.ar | 🟡 Template (requiere actualizar selectores) | `src/config/scrapers/livepass.config.ts` |
| _Agregar más aquí_ | - | - |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                   DataSourceOrchestrator                     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Ticketmaster │  │   LivePass   │  │  Alternativa │      │
│  │   (API)      │  │  (Scraper)   │  │   (Scraper)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                   │                  │             │
│         └───────────────────┴──────────────────┘             │
│                             │                                │
│                             ▼                                │
│                      EventService                            │
│                  (Validación + Dedup)                        │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

1. **GenericWebScraper** (`src/features/events/data/sources/web/GenericWebScraper.ts`)
   - Motor principal que ejecuta el scraping
   - Usa Cheerio para parsear HTML
   - Aplica transformaciones configuradas
   - Maneja paginación, retry, rate limiting

2. **WebScraperFactory** (`src/features/events/data/sources/web/WebScraperFactory.ts`)
   - Crea scrapers por nombre
   - Registry de configuraciones
   - Permite crear múltiples scrapers a la vez

3. **ScraperConfig** (`src/features/events/data/sources/web/types/ScraperConfig.ts`)
   - Tipos TypeScript para configuraciones
   - Define estructura de selectores, paginación, error handling

4. **Transform Utils** (`src/features/events/data/sources/web/utils/transforms.ts`)
   - Funciones de transformación reutilizables
   - `parseSpanishDate`, `extractPrice`, `sanitizeHtml`, etc.

---

## Quick Start

### 1. Usar un Scraper Existente

```typescript
import { WebScraperFactory } from '@/features/events/data/sources/web/WebScraperFactory';

// Crear scraper de LivePass
const livepassScraper = await WebScraperFactory.create('livepass');

// Ejecutar scraping
const events = await livepassScraper.fetch();

console.log(`Scrapeados ${events.length} eventos`);
```

### 2. Integrar con Orchestrator

```typescript
import { DataSourceOrchestrator } from '@/features/events/data/orchestrator/DataSourceOrchestrator';
import { WebScraperFactory } from '@/features/events/data/sources/web/WebScraperFactory';
import { TicketmasterSource } from '@/features/events/data/sources/ticketmaster/TicketmasterSource';

// Crear orchestrator
const repository = new PrismaEventRepository();
const orchestrator = new DataSourceOrchestrator(repository);

// Registrar fuentes (API + Web Scrapers)
orchestrator.registerSource(new TicketmasterSource());
orchestrator.registerSource(await WebScraperFactory.create('livepass'));

// Ejecutar TODO en paralelo
const result = await orchestrator.fetchAll();

console.log(`Total eventos: ${result.totalEvents}`);
console.log(`Procesados: ${result.totalProcessed}`);
console.log(`Duplicados: ${result.totalDuplicates}`);
```

### 3. Crear Múltiples Scrapers

```typescript
// Crear todos los scrapers disponibles
const allScrapers = await WebScraperFactory.createAll();

// O específicos
const scrapers = await WebScraperFactory.createMany(['livepass', 'alternativa']);

// Registrar todos
scrapers.forEach(scraper => orchestrator.registerSource(scraper));
```

---

## Agregar un Nuevo Sitio

### Paso 1: Inspeccionar HTML

1. Abrir el sitio en navegador (ej: `https://example.com/eventos`)
2. F12 → Tab "Elements" o "Inspector"
3. Encontrar el HTML de los eventos

**Ejemplo de HTML típico:**

```html
<div class="events-container">
  <div class="event-card">
    <img src="/images/evento1.jpg" class="event-img" />
    <h3 class="event-title">Metallica en vivo</h3>
    <p class="event-date">Viernes 15 de marzo, 21:00hs</p>
    <p class="event-venue">Café Berlín</p>
    <p class="event-location">Palermo, Buenos Aires</p>
    <span class="event-price">$5.000</span>
    <a href="/eventos/metallica-123" class="event-link">Ver más</a>
  </div>
  <!-- más eventos... -->
</div>
```

### Paso 2: Identificar Selectores

| Campo | Selector CSS | Notas |
|-------|--------------|-------|
| Contenedor | `.events-container` | Opcional, contiene todos los eventos |
| Item (cada evento) | `.event-card` | **Requerido**, elemento que se repite |
| Título | `.event-title` | **Requerido** |
| Fecha | `.event-date` | **Requerido** |
| Venue | `.event-venue` | **Requerido** |
| Ciudad | `.event-location` | Opcional |
| Precio | `.event-price` | Opcional |
| Imagen | `.event-img@src` | Atributo `src` con `@` |
| Link | `.event-link@href` | Atributo `href` con `@` |

### Paso 3: Crear Configuración

Crear archivo `src/config/scrapers/mi-sitio.config.ts`:

```typescript
import { ScraperConfig } from '@/features/events/data/sources/web/types/ScraperConfig';

export const miSitioConfig: ScraperConfig = {
  name: 'mi-sitio',
  type: 'web',
  baseUrl: 'https://example.com',

  listing: {
    url: '/eventos',
    containerSelector: '.events-container', // Opcional
    itemSelector: '.event-card', // Requerido

    pagination: {
      type: 'url',
      pattern: '/eventos?page={page}', // {page} será reemplazado por 1, 2, 3...
      maxPages: 5,
      delayBetweenPages: 1500, // 1.5 segundos entre páginas
    },
  },

  selectors: {
    title: '.event-title',
    date: '.event-date',
    venue: '.event-venue',
    city: '.event-location',
    price: '.event-price',
    image: '.event-img@src', // @ indica atributo
    link: '.event-link@href',
    description: '.event-description',
  },

  transforms: {
    date: 'parseSpanishDate', // Parsear "15 de marzo de 2025"
    price: 'extractPrice', // Extraer número de "$5.000"
    description: 'sanitizeHtml', // Limpiar HTML peligroso
    image: 'toAbsoluteUrl', // /images/foo.jpg → https://example.com/images/foo.jpg
    link: 'toAbsoluteUrl',
  },

  rateLimit: {
    requestsPerSecond: 1, // Conservador
    timeout: 15000,
  },

  errorHandling: {
    skipFailedEvents: true, // Continuar si un evento falla
    skipFailedPages: false, // Fallar si una página completa falla
    retry: {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2, // 1s, 2s, 4s
    },
  },

  userAgent: 'EnVivoBot/1.0 (+https://envivo.ar/bot)',

  headers: {
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'es-AR,es;q=0.9',
  },
};
```

### Paso 4: Registrar en Factory

Editar `src/features/events/data/sources/web/WebScraperFactory.ts`:

```typescript
const SCRAPER_CONFIGS: Record<string, () => Promise<ScraperConfig>> = {
  livepass: async () => {
    const { livepassConfig } = await import('@/config/scrapers/livepass.config');
    return livepassConfig;
  },
  // ✅ AGREGAR AQUÍ
  'mi-sitio': async () => {
    const { miSitioConfig } = await import('@/config/scrapers/mi-sitio.config');
    return miSitioConfig;
  },
};
```

### Paso 5: Usar el Scraper

```typescript
const miScraper = await WebScraperFactory.create('mi-sitio');
const events = await miScraper.fetch();
```

---

## Configuración Avanzada

### Paginación

#### Opción 1: URL Pattern

```typescript
pagination: {
  type: 'url',
  pattern: '/eventos/page/{page}', // /eventos/page/1, /eventos/page/2...
  maxPages: 10,
  delayBetweenPages: 2000, // 2 segundos
}
```

#### Opción 2: Query Parameter (default)

```typescript
pagination: {
  type: 'url',
  maxPages: 5,
  // Generará: /eventos?page=1, /eventos?page=2...
}
```

#### Opción 3: Sin Paginación

```typescript
pagination: {
  type: 'none',
}
// O simplemente omitir el campo
```

### Selectores con Atributos

Para extraer **atributos HTML** (src, href, data-*, etc.) usar sintaxis `@`:

```typescript
selectors: {
  image: '.event-img@src', // <img class="event-img" src="/foo.jpg">
  link: 'a.event-link@href', // <a class="event-link" href="/evento/123">
  videoId: '.video@data-id', // <div class="video" data-id="abc123">
}
```

### Rate Limiting

```typescript
rateLimit: {
  requestsPerSecond: 2, // Máximo 2 requests por segundo
  timeout: 20000, // 20 segundos timeout por request
}
```

**Recomendaciones:**
- Sitios pequeños: 1-2 req/s
- Sitios grandes (Ticketmaster-like): 5 req/s
- **NUNCA** más de 10 req/s

### Error Handling

```typescript
errorHandling: {
  skipFailedEvents: true, // ✅ Recomendado: continuar si evento falla
  skipFailedPages: false, // ❌ Fallar si página completa falla
  retry: {
    maxRetries: 3, // Intentar 3 veces
    initialDelay: 1000, // Primer retry después de 1s
    backoffMultiplier: 2, // 1s, 2s, 4s
  },
  timeout: 15000, // 15 segundos
}
```

---

## Transformaciones

### Funciones Disponibles

| Función | Descripción | Ejemplo Input | Output |
|---------|-------------|---------------|--------|
| `parseSpanishDate` | Parsea fechas en español | "15 de marzo de 2025" | `Date` object |
| `extractPrice` | Extrae precio numérico | "$5.000", "Gratis" | `5000`, `0` |
| `sanitizeHtml` | Limpia HTML peligroso | `<script>alert()</script><p>Ok</p>` | `<p>Ok</p>` |
| `cleanWhitespace` | Normaliza espacios | `"  text   with    spaces  "` | `"text with spaces"` |
| `toAbsoluteUrl` | Convierte URL relativa a absoluta | `/images/foo.jpg` | `https://example.com/images/foo.jpg` |

### parseSpanishDate - Formatos Soportados

```typescript
parseSpanishDate("15 de marzo de 2025") // ✅ Fecha completa
parseSpanishDate("15 mar 2025") // ✅ Mes abreviado
parseSpanishDate("15/03/2025") // ✅ Numérico con /
parseSpanishDate("15-03-2025") // ✅ Numérico con -
parseSpanishDate("2025-03-15") // ✅ ISO format
parseSpanishDate("Sábado 15 de marzo") // ✅ Con día de semana
```

### extractPrice - Formatos Soportados

```typescript
extractPrice("$5.000") // → 5000
extractPrice("$10.500,50") // → 10501 (redondeado)
extractPrice("ARS 1500") // → 1500
extractPrice("Desde $2000") // → 2000
extractPrice("Gratis") // → 0
extractPrice("Free") // → 0
```

### Crear Transformación Custom

Si necesitás una transformación especial:

1. Agregar función en `src/features/events/data/sources/web/utils/transforms.ts`:

```typescript
export function parseCustomDate(dateString: string): Date | undefined {
  // Tu lógica custom
  return new Date(dateString);
}

// Agregar al registry
export const TRANSFORM_FUNCTIONS: Record<string, Function> = {
  // ... existentes
  parseCustomDate: (value: string) => parseCustomDate(value),
};
```

2. Usar en config:

```typescript
transforms: {
  date: 'parseCustomDate',
}
```

---

## Testing

### Ejecutar Tests

```bash
# Todos los tests de web scraping
npm test -- web

# Solo transforms
npm test -- transforms.test.ts

# Solo GenericWebScraper
npm test -- GenericWebScraper.test.ts
```

### Crear Test para Nuevo Sitio

Crear `src/features/events/data/sources/web/fixtures/mi-sitio.html`:

```html
<!DOCTYPE html>
<html>
<body>
  <div class="events-container">
    <div class="event-card">
      <h3 class="event-title">Test Event</h3>
      <p class="event-date">15 de marzo de 2025</p>
      <p class="event-venue">Test Venue</p>
    </div>
  </div>
</body>
</html>
```

Crear test `src/features/events/data/sources/web/scrapers/MiSitioScraper.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GenericWebScraper } from '../GenericWebScraper';
import { miSitioConfig } from '@/config/scrapers/mi-sitio.config';
import { readFileSync } from 'fs';

const MOCK_HTML = readFileSync('./fixtures/mi-sitio.html', 'utf-8');

describe('MiSitio Scraper', () => {
  it('should extract events correctly', async () => {
    // Mock axios
    vi.mock('axios');

    const scraper = new GenericWebScraper(miSitioConfig);
    const events = await scraper.fetch();

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Test Event');
  });
});
```

---

## Troubleshooting

### Error: "Cannot find module 'isomorphic-dompurify'"

**Solución:**
```bash
npm install
```

### Error: 403 Forbidden

**Causa**: El sitio bloquea requests automatizados.

**Soluciones:**
1. Cambiar User-Agent:
```typescript
userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
```

2. Agregar headers realistas:
```typescript
headers: {
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'es-AR,es;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
}
```

3. Reducir rate limit:
```typescript
rateLimit: {
  requestsPerSecond: 0.5, // 1 request cada 2 segundos
}
```

### Error: Selector no encuentra elementos

**Debug:**
```typescript
// Agregar logs temporales en GenericWebScraper
console.log('HTML:', html.substring(0, 500)); // Ver HTML recibido
console.log('Items found:', $items.length); // Ver cuántos items se encuentran
```

**Soluciones:**
1. Verificar selector con DevTools:
   - F12 → Console
   - `document.querySelectorAll('.event-card')` debe retornar elementos

2. HTML puede ser dinámico (JS):
   - Si el sitio usa React/Vue, el HTML se genera con JS
   - Cheerio solo ve HTML estático
   - **Solución**: Usar Playwright (más lento pero renderiza JS)

### Eventos con campos faltantes

**Debug:** Ver logs en console:
```
[livepass] Skipping event with missing required fields: title=undefined, date=2025-03-15, venue=Café Berlín
```

**Solución:** Ajustar selectores CSS

---

## Buenas Prácticas

### ✅ DO

- **Respetar robots.txt** del sitio
- **Rate limiting conservador**: Empezar con 1 req/s
- **User-Agent honesto**: Identificarse como bot
- **Caché**: No scrapear mismo contenido repetidamente
- **Logs**: Loggear eventos fallidos con contexto
- **Tests con fixtures**: Usar HTML fixtures, no requests reales
- **Sanitizar HTML**: Siempre usar `sanitizeHtml` en descripciones

### ❌ DON'T

- **No hacer más de 10 req/s** (saturar servidor)
- **No scrapear datos privados** (requieren login)
- **No ignorar errores 403/429** (indica que estás bloqueado)
- **No hardcodear datos** en scrapers (usar config)
- **No commitear HTML fixtures grandes** (>100 KB)
- **No scrapear si hay API disponible** (siempre preferir API)

### Ética del Web Scraping

1. **Verificar Términos de Servicio**: Algunos sitios prohíben scraping
2. **Contactar al sitio**: Preguntar si tienen API o permiten scraping
3. **Atribución**: Dar crédito al sitio origen
4. **No competir directamente**: No clonar el sitio
5. **Rate limiting**: No afectar performance del sitio

---

## Recursos

### Documentación

- [Cheerio](https://cheerio.js.org/) - jQuery-like HTML parsing
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [DOMPurify](https://github.com/cure53/DOMPurify) - Sanitización HTML

### Tools

- **Chrome DevTools**: F12 → Elements → Inspeccionar HTML
- **CSS Selector Tester**: `document.querySelectorAll('.selector')` en Console
- **Postman/Insomnia**: Testear headers y responses

### Próximos Pasos

1. ✅ Completado: Arquitectura base
2. 🔄 En progreso: Actualizar selectores de LivePass
3. ⏳ Pendiente: Integrar en `/api/admin/scraper/sync`
4. ⏳ Pendiente: Agregar más sitios (Alternativa Teatral, PassLine)
5. ⏳ Pendiente: Implementar Playwright para sitios JS-heavy

---

**Última actualización**: 9 de Noviembre de 2025
