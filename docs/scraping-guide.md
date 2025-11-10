# Guía de Web Scraping - LivePass (Café Berlín)

## 🚀 Quick Start

### 1. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Espera a que el servidor esté listo en `http://localhost:3000`

### 2. Ejecutar el scraping

**Opción A: Con Node.js (Recomendado)**
```bash
node scripts/scrape-livepass.js
```

**Opción B: Con Bash + curl**
```bash
./scripts/scrape-livepass.sh
```

**Opción C: Manualmente con curl**
```bash
curl -X POST http://localhost:3000/api/admin/scrape \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json"
```

---

## 📊 Ejemplo de Output

```
🚀 Iniciando scraping de LivePass (Café Berlín)...

✅ Scraping completado exitosamente!

📊 Resultados:
   • Total eventos scrapeados: 48
   • Eventos procesados: 35
   • Duplicados detectados: 13
   • Errores: 0
   • Duración: 2847ms

📋 Detalle por fuente:
   ✅ livepass: 48 eventos (2654ms)
```

---

## 🔍 Verificar los Datos Scrapeados

### Opción 1: En la UI

1. Ve a `http://localhost:3000/events`
2. Filtra por ciudad: **Buenos Aires**
3. Deberías ver eventos de **Café Berlín**

### Opción 2: En la base de datos

```bash
# Usando Prisma Studio
npx prisma studio

# O con SQL directo
sqlite3 prisma/dev.db "SELECT title, venue, city, date FROM Event WHERE venue = 'Café Berlín' LIMIT 10;"
```

---

## 🛠️ Troubleshooting

### Error: "ADMIN_API_KEY no está configurado"

Verifica que `.env.local` tenga:
```env
ADMIN_API_KEY="tu-api-key-aqui"
```

> Ver [docs/ENV_SETUP.md](ENV_SETUP.md) para guía completa de configuración.

### Error: "No se puede conectar al servidor"

Asegúrate de que el servidor esté corriendo:
```bash
npm run dev
```

### Error: "Unauthorized" (401)

Verifica que el `ADMIN_API_KEY` en `.env.local` coincida con el que usas en la request.

### Error: "Failed to scrape livepass"

Posibles causas:
- El sitio LivePass está caído o cambió su estructura
- Problemas de red
- Rate limiting

Revisa los logs del servidor para más detalles.

---

## 📝 Qué hace el scraper

El scraper de LivePass (`livepass.config.ts`):

1. **Extrae** eventos de https://livepass.com.ar/taxons/cafe-berlin
2. **Parsea** información:
   - Título (limpia " en Café Berlín" del final)
   - Fecha (formato "09 NOV" → convierte a Date)
   - Imagen
   - Link al evento
3. **Asigna** valores hardcodeados:
   - Venue: "Café Berlín"
   - City: "Buenos Aires"
   - Country: "AR"
   - Category: "Concierto"
4. **Valida** con `EventBusinessRules`
5. **Deduplica** usando fuzzy matching
6. **Guarda** en la base de datos

---

## 🔄 Automatización (Futuro)

Para ejecutar el scraping automáticamente cada día:

### Opción 1: Cron Job (Linux/Mac)
```bash
# Editar crontab
crontab -e

# Agregar línea (ejecutar a las 2 AM cada día)
0 2 * * * cd /path/to/envivo && node scripts/scrape-livepass.js >> logs/scraping.log 2>&1
```

### Opción 2: GitHub Actions
Ver `docs/examples/cicd-example.yml` para workflow de scraping automático.

### Opción 3: Vercel Cron Jobs
Ver documentación en `docs/PRODUCT.md` (Fase 6: Deployment).

---

## 📖 Referencias

- **Configuración del scraper**: `/config/scrapers/livepass.config.ts`
- **Transformaciones custom**: `/src/features/events/data/sources/web/utils/transforms.ts`
  - `parseLivepassDate()`: Parsea "09 NOV" → Date
  - `cleanLivepassTitle()`: Remueve " en Café Berlín"
- **Generic Web Scraper**: `/src/features/events/data/sources/web/GenericWebScraper.ts`
- **Orchestrator**: `/src/features/events/data/orchestrator/DataSourceOrchestrator.ts`

---

## 🎯 Siguientes Pasos

1. ✅ **Scraper funcionando** (LivePass - Café Berlín)
2. ⏳ **Agregar más fuentes**:
   - Eventbrite Argentina
   - Passline
   - Otros venues locales
3. ⏳ **Automatizar** con cron jobs o Vercel Cron
4. ⏳ **Monitoring** y alertas si scraping falla

---

**Última actualización**: Noviembre 2025
