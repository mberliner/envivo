# Testing Manual - Fase 4: DataSourceOrchestrator

> **Nota**: Este testing es **opcional** ya que los tests unitarios (18 tests) ya validan el comportamiento del orchestrator. Solo necesitás hacer esto si querés ver el orchestrator funcionando con datos reales de Ticketmaster.

---

## ⚠️ Pre-requisitos

### API Keys Necesarias

1. **TICKETMASTER_API_KEY** - Para obtener eventos reales
   - Registro: https://developer.ticketmaster.com/
   - Gratis, requiere cuenta

2. **ADMIN_API_KEY** - Para autenticar el endpoint de scraping
   - Generar localmente (ver instrucciones abajo)

### Si NO tenés API keys
**Podés saltearte este testing**. El orchestrator ya está validado con:
- ✅ 18 tests unitarios passing
- ✅ Mocks de fuentes de datos
- ✅ TypeScript sin errores
- ✅ Integración con EventService testeada

---

## 📋 Setup (Solo si querés probar con datos reales)

### 1. Generar ADMIN_API_KEY

**En tu terminal local:**

```bash
# Opción 1: Con OpenSSL (Linux/Mac)
openssl rand -base64 32

# Opción 2: Con Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Configurar Variables de Entorno

Crear/editar `.env.local` en la raíz del proyecto:

```bash
# API Keys
TICKETMASTER_API_KEY="tu-key-de-ticketmaster-aqui"
ADMIN_API_KEY="tu-key-generada-arriba"

# Base de datos (ya debería estar)
DATABASE_URL="file:./dev.db"

# Opcional
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Iniciar el Servidor

```bash
npm run dev
```

Debería mostrar:
```
✓ Ready in 928ms
- Local: http://localhost:3000
```

---

## 🧪 Test 1: Scraping Manual con Orchestrator

Este test ejecuta el orchestrator con Ticketmaster y muestra las métricas detalladas.

### Ejecutar Scraping

**En una nueva terminal:**

```bash
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: TU_ADMIN_API_KEY_AQUI" \
  -H "Content-Type: application/json"
```

### Respuesta Esperada (Exitosa)

```json
{
  "success": true,
  "sources": [
    {
      "name": "ticketmaster",
      "success": true,
      "eventsCount": 50,
      "duration": 1234
    }
  ],
  "totalEvents": 50,
  "totalProcessed": 45,
  "totalDuplicates": 3,
  "totalErrors": 2,
  "duration": 1456,
  "timestamp": "2025-11-09T14:30:00.000Z"
}
```

### Qué Significa Cada Campo

| Campo | Descripción |
|-------|-------------|
| `sources[]` | Array de resultados por fuente |
| `sources[].name` | Nombre del data source (`ticketmaster`) |
| `sources[].success` | Si la fuente ejecutó exitosamente |
| `sources[].eventsCount` | Eventos obtenidos de esta fuente |
| `sources[].duration` | Tiempo en ms que tardó esta fuente |
| `totalEvents` | Total de eventos scrapeados de TODAS las fuentes |
| `totalProcessed` | Eventos aceptados y guardados (después de validación) |
| `totalDuplicates` | Eventos que ya existían (deduplicados) |
| `totalErrors` | Eventos que no pasaron validación |
| `duration` | Tiempo total de ejecución del orchestrator (ms) |

---

## 🧪 Test 2: Verificar Eventos en Base de Datos

Después del scraping, verificá que los eventos se guardaron:

### Opción A: Con Prisma Studio (Visual)

```bash
npm run db:studio
```

Abre http://localhost:5555 y navegá a la tabla `Event`.

**Deberías ver:**
- Eventos de Ticketmaster
- Campo `source` = "ticketmaster"
- Campo `externalId` con IDs de Ticketmaster
- Fechas, precios, ubicaciones, etc.

### Opción B: Con API (Programático)

```bash
curl http://localhost:3000/api/events | jq '.'
```

**Deberías ver:**
```json
{
  "success": true,
  "events": [
    {
      "id": "...",
      "title": "Metallica - World Tour",
      "date": "2025-12-01T21:00:00.000Z",
      "city": "Buenos Aires",
      "country": "AR",
      "category": "Concierto",
      "source": "ticketmaster",
      ...
    },
    ...
  ],
  "total": 45,
  "hasMore": false
}
```

---

## 🧪 Test 3: Validar Deduplicación

El orchestrator integra EventService que automáticamente deduplica eventos.

### Ejecutar Scraping 2 veces

```bash
# Primera vez
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: TU_ADMIN_API_KEY" \
  -H "Content-Type: application/json"

# Segunda vez (inmediatamente después)
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: TU_ADMIN_API_KEY" \
  -H "Content-Type: application/json"
```

### Respuesta Esperada (Segunda Ejecución)

```json
{
  "success": true,
  "sources": [
    {
      "name": "ticketmaster",
      "success": true,
      "eventsCount": 50,  // Misma cantidad scrapeada
      "duration": 1200
    }
  ],
  "totalEvents": 50,
  "totalProcessed": 0,     // ✅ 0 porque ya existían todos
  "totalDuplicates": 50,   // ✅ 50 duplicados detectados
  "totalErrors": 0,
  "duration": 1300
}
```

**Esto valida que:**
- ✅ Orchestrator ejecuta correctamente múltiples veces
- ✅ EventService deduplica por `source` + `externalId`
- ✅ No se crean registros duplicados en BD

---

## 🧪 Test 4: Verificar Validación Automática

El orchestrator integra EventService que valida eventos con business rules.

### Verificar en Logs del Servidor

En la terminal donde corre `npm run dev`, deberías ver:

```
GET /api/admin/scraper/sync 200 in 1.5s
```

**Sin errores de validación** (porque Ticketmaster retorna eventos válidos).

### Para Forzar Eventos Inválidos (Opcional)

Esto requeriría modificar temporalmente `TicketmasterMapper` para retornar eventos sin `city` o `date`, pero NO es necesario porque:
- ✅ EventBusinessRules.test.ts ya valida 39 casos
- ✅ EventService.test.ts ya valida integración

---

## 🧪 Test 5: Verificar en UI

Después del scraping, abrí el navegador:

```
http://localhost:3000
```

**Deberías ver:**
- Grid de eventos de Ticketmaster
- Títulos, fechas, ubicaciones, precios
- Imágenes (si Ticketmaster las provee)
- Botones "Ver Entradas" que apuntan a Ticketmaster

**Probar filtros:**
- Filtrar por ciudad → Debería funcionar
- Buscar por texto (ej: "Metallica") → Debería encontrar eventos
- Filtrar por categoría → Debería funcionar

---

## ⚠️ Troubleshooting

### Error: "Invalid or missing API key"

**Causa**: `x-api-key` header incorrecto o faltante

**Solución**:
```bash
# Verificar que estés usando la misma key que en .env.local
cat .env.local | grep ADMIN_API_KEY
```

### Error: "Ticketmaster API key is required"

**Causa**: `TICKETMASTER_API_KEY` no está en `.env.local`

**Solución**:
1. Verificar que `.env.local` tiene la key
2. Reiniciar el servidor: `Ctrl+C` y `npm run dev`

### Error: 401 Unauthorized (Ticketmaster)

**Causa**: API key de Ticketmaster inválida o expirada

**Solución**:
1. Verificar en https://developer.ticketmaster.com/
2. Regenerar la key si es necesario
3. Actualizar `.env.local`

### Error: 429 Rate Limit Exceeded

**Causa**: Demasiadas requests a Ticketmaster

**Solución**:
- Esperar 1 minuto
- Ticketmaster tiene rate limit: 5000 requests/día

### No se scrapea nada (totalEvents: 0)

**Posibles causas:**
1. No hay eventos en Argentina (`countryCode: 'AR'` default)
2. No hay eventos de música (`classificationName: 'Music'` default)

**Solución**:
```bash
# Probar con otro país
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: TU_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country": "US"}'
```

---

## 📊 Métricas de Éxito

Si ejecutaste los tests manualmente, deberías haber visto:

### ✅ Orchestrator Funciona
- [x] Endpoint `/api/admin/scraper/sync` responde 200
- [x] Response incluye `sources[]` con métricas
- [x] `totalEvents` > 0 (si hay eventos en Ticketmaster)
- [x] `duration` < 5000ms (ejecución rápida)

### ✅ EventService Integrado
- [x] `totalProcessed` incluye eventos validados
- [x] `totalDuplicates` detecta duplicados
- [x] `totalErrors` captura eventos inválidos
- [x] Segunda ejecución deduplica correctamente

### ✅ Datos en BD
- [x] Eventos visibles en Prisma Studio
- [x] Eventos visibles en `/api/events`
- [x] Eventos visibles en UI (http://localhost:3000)
- [x] Filtros funcionan en UI

---

## 🎉 Conclusión

**Si NO tenés API keys:**
- El orchestrator ya está validado con 18 tests unitarios ✅
- No necesitás hacer testing manual

**Si ejecutaste el testing manual:**
- Ahora viste el orchestrator funcionando con datos reales ✅
- Validaste la integración con EventService ✅
- Validaste la deduplicación automática ✅
- Viste los eventos en la UI ✅

**El orchestrator está listo para escalar** a múltiples fuentes. En Fase 5 solo hay que:
1. Crear nueva fuente (ej: `EventbriteSource`)
2. Registrar en orchestrator: `orchestrator.registerSource(new EventbriteSource())`
3. Done! Se ejecutará en paralelo con Ticketmaster

---

**Última actualización**: 9 de Noviembre de 2025
