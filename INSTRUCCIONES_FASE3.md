# Instrucciones Manuales - Fase 3 y 4 Completadas

> **Documento temporal** para verificar y usar las features implementadas
> **Fecha**: 9 de Noviembre de 2025
> **Estado**: Fase 3 y 4 completadas (Backend + Frontend + Orchestrator)

---

## ✅ Estado Actual

- **Tests**: 170/170 pasando ✅ (152 → 170 con orchestrator)
- **TypeScript**: 0 errores ✅
- **Backend**: SearchService + API Route + DataSourceOrchestrator completados
- **Frontend**: SearchBar + EventFilters + URL persistence completados
- **Orchestrator**: Scraping paralelo con Promise.allSettled implementado

---

## ⚠️ IMPORTANTE: Ejecutar en Tu Terminal Local

**TODOS los comandos de este documento deben ejecutarse en tu terminal local**, NO en Claude Code.

Claude Code no puede descargar binarios de Prisma por restricciones de red. Los tests automáticos usan mocks y pasan ✅, pero para desarrollo manual necesitás ejecutar en tu máquina.

---

## 📋 Pasos para Probar la Aplicación

### 0. Setup Inicial (Primera vez)

**En tu terminal local**, ejecutá:

```bash
# 1. Instalar dependencias
npm install

# 2. Generar Prisma Client
npx prisma generate

# 3. Crear base de datos SQLite
npx prisma db push
```

**Salida esperada:**
```
✅ Prisma Client generado
✅ Base de datos creada en prisma/dev.db
```

---

### 1. Poblar la Base de Datos con Datos de Prueba

La aplicación incluye un seed script con 15 eventos realistas de Argentina.

**En tu terminal local:**

```bash
# Desde la raíz del proyecto
npm run db:seed
```

**Salida esperada:**
```
🌱 Iniciando seed de base de datos...

🧹 Limpiando datos existentes...
   ✓ Eventos eliminados

📝 Creando eventos desde fixtures...
   ✓ Metallica - World Tour 2025
   ✓ Coldplay - Music of the Spheres Tour
   ✓ Taylor Swift - The Eras Tour
   ... (total 15 eventos)

✅ Seed completado: 15/15 eventos creados

📊 Resumen de la base de datos:
   Total de eventos: 15

   Eventos por ciudad:
   - Buenos Aires: 10 eventos
   - Córdoba: 3 eventos
   - Rosario: 2 eventos

   Eventos por categoría:
   - Concierto: 10 eventos
   - Festival: 3 eventos
   - Teatro: 2 eventos

🎉 Seed finalizado exitosamente
```

**Notas:**
- El seed **borra datos existentes** antes de insertar
- Si ya tenés datos scrapeados de Ticketmaster, se perderán
- Los eventos incluyen: Metallica, Coldplay, Fito Páez, Lollapalooza, etc.
- Precios en ARS reales (entre $8,000 y $80,000)

---

### 2. Iniciar el Servidor de Desarrollo

**En tu terminal local:**

```bash
npm run dev
```

**Salida esperada:**
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

---

### 3. Probar la Aplicación en el Navegador

#### 3.1 Home Page - Ver todos los eventos

1. Abrí tu navegador en: **http://localhost:3000**
2. Deberías ver:
   - Header "EnVivo."
   - Barra de búsqueda (SearchBar)
   - Panel de filtros (EventFilters)
   - Contador: "15 eventos encontrados"
   - Grid de 15 tarjetas de eventos

#### 3.2 Probar Búsqueda por Texto

**Test 1: Buscar "metallica"**
1. En la barra de búsqueda, escribí: `metallica`
2. Esperá 300ms (debouncing automático)
3. Resultado esperado:
   - URL actualizada: `http://localhost:3000/?q=metallica`
   - Contador: "1 evento encontrado"
   - Solo se muestra: "Metallica - World Tour 2025"

**Test 2: Buscar "rock"**
1. Escribí: `rock`
2. Resultado esperado:
   - Múltiples eventos con "rock" en título/descripción
   - URL: `http://localhost:3000/?q=rock`

**Test 3: Limpiar búsqueda**
1. Click en la "X" en la barra de búsqueda
2. Resultado: Vuelven a aparecer todos los 15 eventos

#### 3.3 Probar Filtros

**Test 1: Filtrar por ciudad**
1. En el dropdown "Ciudad", seleccioná: `Buenos Aires`
2. Resultado esperado:
   - URL: `http://localhost:3000/?city=Buenos%20Aires`
   - Contador: "10 eventos encontrados"
   - Solo eventos en Buenos Aires
   - Chip violeta: "Ciudad: Buenos Aires"

**Test 2: Filtrar por categoría**
1. En el dropdown "Categoría", seleccioná: `Festival`
2. Resultado esperado:
   - URL: `http://localhost:3000/?city=Buenos%20Aires&category=Festival`
   - Solo festivales en Buenos Aires (ej: Lollapalooza)
   - Chips violetas: "Ciudad: Buenos Aires" + "Categoría: Festival"

**Test 3: Filtrar por fecha**
1. En "Desde", seleccioná: `2025-03-01`
2. En "Hasta", seleccioná: `2025-04-30`
3. Resultado esperado:
   - URL con: `dateFrom=2025-03-01&dateTo=2025-04-30`
   - Solo eventos entre marzo y abril 2025
   - Chips: "Desde: 1/3/2025" + "Hasta: 30/4/2025"

**Test 4: Limpiar filtros**
1. Click en el botón "Limpiar filtros"
2. Resultado: Todos los filtros se resetean, vuelven los 15 eventos

#### 3.4 Probar Combinación de Filtros

**Scenario: "Buscar conciertos de rock en Buenos Aires"**
1. En la búsqueda, escribí: `tour`
2. En "Ciudad", seleccioná: `Buenos Aires`
3. En "Categoría", seleccioná: `Concierto`
4. Resultado esperado:
   - URL: `/?q=tour&city=Buenos%20Aires&category=Concierto`
   - Eventos que tengan "tour" en el título, sean conciertos, y en Buenos Aires
   - Ejemplo: "Metallica - World Tour 2025", "Coldplay - Music of the Spheres Tour"

#### 3.5 Probar URL Persistence (Compartir Links)

1. Aplicá algunos filtros (ej: ciudad + búsqueda)
2. Copiá la URL completa, ejemplo:
   ```
   http://localhost:3000/?q=metallica&city=Buenos%20Aires
   ```
3. Pegá esta URL en una nueva pestaña (o enviala por WhatsApp/email)
4. Resultado esperado:
   - La página carga con los filtros ya aplicados
   - Los eventos filtrados se muestran inmediatamente
   - La búsqueda y filtros están pre-llenados con los valores de la URL

---

### 4. Probar el API Endpoint Directamente

#### 4.1 GET /api/events (sin filtros)

```bash
curl http://localhost:3000/api/events
```

**Respuesta esperada:**
```json
{
  "events": [
    {
      "id": "evt-001",
      "title": "Metallica - World Tour 2025",
      "date": "2025-03-15T21:00:00.000Z",
      "city": "Buenos Aires",
      "country": "AR",
      "category": "Concierto",
      "price": 25000,
      "priceMax": 45000,
      "currency": "ARS",
      ...
    },
    ... (total 15 eventos)
  ],
  "total": 15,
  "hasMore": false,
  "limit": 50,
  "offset": 0
}
```

#### 4.2 GET /api/events?q=metallica

```bash
curl 'http://localhost:3000/api/events?q=metallica'
```

**Respuesta esperada:**
- `total: 1`
- Solo el evento de Metallica

#### 4.3 GET /api/events?city=Buenos Aires

```bash
curl 'http://localhost:3000/api/events?city=Buenos%20Aires'
```

**Respuesta esperada:**
- `total: 10`
- Solo eventos en Buenos Aires

#### 4.4 GET /api/events con múltiples filtros

```bash
curl 'http://localhost:3000/api/events?q=tour&city=Buenos%20Aires&category=Concierto&limit=5'
```

**Respuesta esperada:**
- Eventos filtrados por texto + ciudad + categoría
- Máximo 5 resultados (limit)
- `hasMore: true` si hay más de 5 resultados

#### 4.5 GET /api/events con paginación

```bash
# Primera página
curl 'http://localhost:3000/api/events?limit=5&offset=0'

# Segunda página
curl 'http://localhost:3000/api/events?limit=5&offset=5'
```

**Respuesta esperada:**
- Primera llamada: primeros 5 eventos, `hasMore: true`
- Segunda llamada: siguientes 5 eventos

---

## 🔄 Probar Scraping Manual con Orchestrator (Opcional)

> **Nota**: Esto requiere tener `TICKETMASTER_API_KEY` y `ADMIN_API_KEY` en `.env.local`

El orchestrator ejecuta múltiples fuentes de datos en paralelo. Actualmente solo Ticketmaster está configurado.

### Generar ADMIN_API_KEY (si no tenés)

```bash
# Generar clave segura
openssl rand -base64 32

# Agregar a .env.local
echo "ADMIN_API_KEY=tu-clave-generada-aqui" >> .env.local
```

### Ejecutar Scraping

**En tu terminal local:**

```bash
# 1. Asegurate de tener el servidor corriendo
npm run dev

# 2. En otra terminal, ejecutar scraping
curl -X POST http://localhost:3000/api/admin/scraper/sync \
  -H "x-api-key: tu-ADMIN_API_KEY-aqui" \
  -H "Content-Type: application/json"
```

### Respuesta Esperada (con Orchestrator)

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
  "timestamp": "2025-11-09T01:23:45.678Z"
}
```

**Qué significa cada campo:**
- `sources[]`: Resultados por cada fuente de datos
- `totalEvents`: Total de eventos scrapeados de todas las fuentes
- `totalProcessed`: Eventos aceptados y guardados en BD (después de validación)
- `totalDuplicates`: Eventos que ya existían (deduplicados)
- `totalErrors`: Eventos que no pasaron validación
- `duration`: Tiempo total de ejecución en ms

### Verificar que se guardaron

**En tu terminal local:**

```bash
# Ver en Prisma Studio
npm run db:studio

# O con curl
curl http://localhost:3000/api/events | jq '.data | length'
```

---

## 🧪 Verificar que Tests Pasen

**En tu terminal local:**

```bash
# Correr todos los tests
npm test

# Verificar TypeScript
npm run type-check
```

> **Nota**: Los tests ya pasaron en Claude Code (170/170 ✅). Esta verificación es opcional para confirmar en tu máquina local.

**Salida esperada:**
```
✓ 170 tests passing (170)
✅ TypeScript: 0 errors
```

---

## 📊 Datos de los Fixtures

Los 15 eventos seeded incluyen:

### Conciertos Internacionales (5)
- Metallica - World Tour 2025 (Buenos Aires, $25k-$45k)
- Coldplay - Music of the Spheres Tour (Buenos Aires, $30k-$60k)
- Taylor Swift - The Eras Tour (Buenos Aires, $35k-$80k)
- Iron Maiden - Legacy Tour (Córdoba, $20k-$40k)
- Red Hot Chili Peppers (Rosario, $22k-$50k)

### Artistas Nacionales (5)
- Fito Páez - Euforia Tour (Buenos Aires, $15k-$25k)
- Los Fabulosos Cadillacs (Buenos Aires, $12k-$22k)
- Divididos en Vivo (Buenos Aires, $10k-$18k)
- Charly García - Piano Bar (Buenos Aires, $20k-$35k)
- Andrés Calamaro (Córdoba, $18k-$30k)

### Festivales (3)
- Lollapalooza Argentina 2025 (Buenos Aires, $45k-$120k)
- Cosquín Rock (Córdoba, $15k-$35k)
- Personal Fest (Buenos Aires, $25k-$55k)

### Teatro/Comedia (2)
- Les Luthiers - Viejos Hazmerreíres (Buenos Aires, $18k-$35k)
- Dalia Gutmann Stand Up (Buenos Aires, $8k-$12k)

---

## 🔍 Verificar que Todo Funciona

### Checklist de Funcionalidad

**Frontend (Fase 3):**
- [ ] Seed pobla BD con 15 eventos
- [ ] Home page muestra los 15 eventos en grid
- [ ] SearchBar con debouncing (espera 300ms antes de buscar)
- [ ] Botón limpiar búsqueda funciona
- [ ] Filtro por ciudad funciona
- [ ] Filtro por categoría funciona
- [ ] Filtro por rango de fechas funciona
- [ ] Chips de filtros activos se muestran
- [ ] Click en "X" en chip elimina ese filtro individual
- [ ] Botón "Limpiar filtros" elimina todos los filtros
- [ ] URL se actualiza con query params al filtrar
- [ ] Compartir URL con filtros funciona (copiar/pegar)
- [ ] Loading state se muestra mientras busca
- [ ] Empty state se muestra si no hay resultados
- [ ] API /api/events retorna JSON correcto

**Backend (Fase 4):**
- [ ] DataSourceOrchestrator ejecuta sources en paralelo
- [ ] /api/admin/scraper/sync usa orchestrator
- [ ] Scraping manual funciona (si tenés TICKETMASTER_API_KEY)
- [ ] EventService integrado automáticamente (validación + deduplicación)

**Quality Assurance:**
- [ ] Todos los tests pasan (170/170) ✅
- [ ] TypeScript sin errores ✅

---

## 🚀 Próximos Pasos (Post-Fase 4)

### ✅ Fase 4 - Orchestrator Asíncrono - **COMPLETADA**

**Lo que se implementó:**
- ✅ `DataSourceOrchestrator` con `Promise.allSettled`
- ✅ EventService integrado automáticamente
- ✅ Endpoint `/api/admin/scraper/sync` actualizado
- ✅ 18 tests del orchestrator
- ✅ Manejo graceful de errores (un source falla, los demás continúan)

**Beneficio logrado**: La arquitectura está lista para escalar a múltiples fuentes. Solo hay que crear nuevos sources y registrarlos.

---

### Opción A: Fase 5 - Segunda Fuente (Eventbrite)
**Propósito**: Agregar más eventos de otra fuente

**Tareas:**
1. Crear `EventbriteSource` (similar a TicketmasterSource)
2. Crear `EventbriteMapper`
3. Registrar en orchestrator
4. Tests de Eventbrite
5. Página de detalle de evento (`/eventos/[id]`)

**Beneficio**: Más eventos disponibles, deduplicación cross-source funciona

---

### Opción B: Fase 6 - Deploy + Scraping Automático
**Propósito**: Llevar a producción con datos frescos

**Tareas:**
1. Deploy a Vercel (gratis)
2. Configurar scraping automático (GitHub Actions)
3. Cron job diario (2 AM UTC)
4. Environment variables en producción
5. Testing en staging

**Beneficio**: MVP en producción, usuarios pueden usarlo

---

## ⚠️ Problemas Conocidos y Soluciones

### Problema: "No hay eventos disponibles"
**Causa**: Base de datos vacía
**Solución**: Correr `npm run db:seed`

### Problema: Búsqueda no filtra
**Causa**: El servidor de desarrollo no está corriendo
**Solución**: Correr `npm run dev`

### Problema: TypeScript errors en tests
**Causa**: Ya arreglados en commit `14fbfd8`
**Solución**: Pull latest changes

### Problema: Tests fallan
**Causa**: Datos en BD interfieren con tests
**Solución**: Los tests usan mocks, no deberían verse afectados. Si persiste, eliminar `prisma/dev.db` y regenerar con `npm run db:push`

---

## 📝 Comandos Útiles

**Ejecutar en tu terminal local:**

```bash
# Setup inicial (primera vez)
npm install
npx prisma generate   # Generar Prisma Client
npm run db:push       # Crear schema en SQLite
npm run db:seed       # Poblar con datos de prueba

# Desarrollo
npm run dev           # Servidor en localhost:3000
npm test              # Correr tests
npm run type-check    # Verificar TypeScript

# Base de datos
npm run db:studio     # Abrir Prisma Studio (GUI para ver BD)
npm run db:seed       # Re-poblar datos de prueba

# Git
git status
git add -A
git commit -m "mensaje"
git push
```

---

## 📞 Siguientes Acciones Recomendadas

1. **Probar todo manualmente** (usa este documento)
2. **Decidir próxima fase** (Fase 5 o Fase 6)
3. **Borrar este documento** cuando ya no lo necesites (es temporal)

---

**Última actualización**: 9 de Noviembre de 2025
**Autor**: Claude Code (Fases 3 y 4 completadas)
**Estado**: ✅ Listo para usar (170 tests passing)

