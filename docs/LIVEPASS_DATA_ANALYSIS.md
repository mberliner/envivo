# Análisis: Vista de Detalle de LivePass - Datos Faltantes y Valor

**Fecha**: 11 de Noviembre de 2025
**Contexto**: Evaluación de qué datos adicionales extraer de LivePass y su valor

---

## 📊 Estado Actual: Datos Extraídos

### Datos que YA Tenemos en BD

| Campo | Fuente | Estado | Usado en UI |
|-------|--------|--------|-------------|
| **Título** | `h1` | ✅ Completo | ✅ EventCard, Lista |
| **Venue** | `p:contains("Recinto:")` | ✅ Completo | ✅ EventCard |
| **Fecha/Hora** | `meta[name="description"]` | ✅ Completo | ✅ EventCard, Filtros |
| **Precio** | `og:product:price:amount` | ✅ Completo | ✅ EventCard |
| **Descripción** | `.description-content` | ✅ Completo | ❌ NO (solo en listado) |
| **Imagen** | `og:image` | ✅ Completo | ✅ EventCard |
| **Link externo** | URL del evento | ✅ Completo | ❌ NO mostrado |
| **Ciudad** | Default config | ✅ Completo | ✅ Filtros |
| **País** | Default config | ✅ Completo | ✅ Filtros |
| **Categoría** | Default "Concierto" | ✅ Completo | ✅ Filtros |

**Cobertura actual**: ~70% de datos útiles

---

## 🔍 Datos DISPONIBLES en LivePass pero NO Extraídos

### 1. JSON-LD (Schema.org) - Disponible pero NO Usado

LivePass incluye structured data completo:

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Franco Dezzutto en Café Berlín",
  "startDate": "2025-11-11T20:45",
  "location": {
    "@type": "Place",
    "name": "Café Berlín",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. Alberdi 378",
      "addressLocality": "Buenos Aires",
      "addressCountry": "AR"
    }
  },
  "offers": {
    "@type": "Offer",
    "price": "20160.0",
    "priceCurrency": "ARS"
  }
}
```

**Datos adicionales en JSON-LD**:
- ✅ Dirección completa (streetAddress) - **ÚTIL**
- ✅ Código postal potencial
- ✅ Coordenadas GPS (si las agregan)

### 2. Múltiples Precios - Disponible en Descripción

```
ENTRADA       PRECIO
Planta Baja   $18.000*
Palcos        $20.000*
VIP           $25.000*
```

**En BD tenemos**: Solo `$20.160` (precio con cargo de servicio, más alto)
**Falta**: Rango de precios mínimo/máximo, tipos de entrada

**Valor**: 🟢 MEDIO
- ✅ Usuario ve rango completo antes de comprar
- ⚠️ Complejidad: Parsear tabla de precios HTML

### 3. Información del Artista - NO Disponible en LivePass

LivePass **NO incluye**:
- ❌ Bio del artista
- ❌ Género musical específico
- ❌ Links a redes sociales
- ❌ Imagen del artista (solo del evento)

**Conclusión**: LivePass es venue-centric, NO artist-centric

### 4. Detalles del Venue - Parcialmente Disponible

**Tenemos**:
- ✅ Nombre: "Café Berlín"
- ✅ Ciudad: "Buenos Aires"

**Falta** (pero disponible en LivePass):
- ⏳ Dirección exacta: "Av. Alberdi 378" (en JSON-LD)
- ⏳ Capacidad del venue (no visible en HTML)
- ⏳ Mapa embebido (no hay en LivePass)

**Valor**: 🟡 BAJO-MEDIO
- Dirección útil para usuarios que van al evento
- Pero la mayoría compra online, no necesita dirección inmediata

### 5. Información de Accesibilidad - NO Disponible

LivePass NO muestra:
- ❌ Acceso para sillas de ruedas
- ❌ Edad mínima
- ❌ Restricciones de entrada

---

## 💰 Análisis de Valor: ¿Qué Vale la Pena Agregar?

### 🟢 ALTO VALOR (Implementar YA)

#### 1. **Vista de Detalle Completa** ⭐⭐⭐⭐⭐

**Qué**: Página `/eventos/[id]` que muestre TODA la info que ya tenemos

**Datos a mostrar**:
- Título (ya lo tenemos)
- Imagen grande (ya lo tenemos)
- Venue + ciudad (ya lo tenemos)
- Fecha y hora completa (ya lo tenemos)
- Precio (ya lo tenemos)
- **Descripción COMPLETA** (ya la tenemos en BD, NO en UI)
- Botón "Comprar entradas" → link externo (ya lo tenemos)

**Valor para usuario**:
- ✅ Más contexto antes de decidir
- ✅ Descripción completa del show
- ✅ Mejor experiencia que ir directo a LivePass

**Esfuerzo**: 4-6 horas
**ROI**: 🟢 MUY ALTO - usamos datos que YA tenemos

---

### 🟡 MEDIO VALOR (Considerar Futuro)

#### 2. **Dirección Completa del Venue**

**Qué**: Extraer "Av. Alberdi 378" desde JSON-LD

**Valor**:
- ✅ Útil para usuarios que quieren ir físicamente
- ⚠️ Pero LivePass ya tiene link "Cómo llegar" en su sitio

**Esfuerzo**: 2-3 horas (implementar parser JSON-LD)
**ROI**: 🟡 MEDIO - útil pero no crítico

#### 3. **Rango de Precios (min-max)**

**Qué**: Extraer múltiples precios de la tabla

```
Precio mínimo: $18.000 (Planta Baja)
Precio máximo: $25.000 (VIP)
```

**Valor**:
- ✅ Usuario ve rango antes de entrar a LivePass
- ✅ Mejor para comparación entre eventos
- ⚠️ Complejidad: parsear tabla HTML variable

**Esfuerzo**: 3-4 horas
**ROI**: 🟡 MEDIO - mejora experiencia pero no esencial

---

### 🔴 BAJO VALOR (NO Priorizar)

#### 4. **Extracción de JSON-LD Completo**

**Qué**: Reemplazar CSS selectors por JSON-LD parser

**Pros**:
- ✅ Más confiable que CSS selectors
- ✅ Menos propenso a romper si LivePass cambia HTML
- ✅ Datos estructurados oficiales

**Contras**:
- ❌ Esfuerzo alto (3-4 horas)
- ❌ No agrega NUEVOS datos, solo cambia fuente
- ❌ Los selectores actuales funcionan bien

**ROI**: 🔴 BAJO - mejora técnica sin valor visible para usuario

#### 5. **Información de Artistas**

**Qué**: Scraping adicional de bio, redes sociales, discografía

**Valor**:
- ✅ Sería genial para usuarios
- ❌ LivePass NO tiene esta info
- ❌ Requeriría scraping de OTRA fuente (Spotify, Last.fm, Wikipedia)

**Esfuerzo**: 10-15 horas (scraping multi-source + matching)
**ROI**: 🔴 MUY BAJO - fuera de scope de MVP

---

## 🎯 Recomendación: Plan de Acción

### Fase 1: Vista de Detalle con Datos Existentes (PRIORIDAD ALTA)

**Duración**: 4-6 horas
**Valor**: ⭐⭐⭐⭐⭐

**Implementación**:

1. **Crear ruta `/eventos/[id]/page.tsx`** (1h)
   ```typescript
   // app/eventos/[id]/page.tsx
   export default async function EventDetailPage({ params }: { params: { id: string } }) {
     const event = await prisma.event.findUnique({
       where: { id: params.id },
       include: { venue: true }
     });

     if (!event) notFound();

     return <EventDetail event={event} />;
   }
   ```

2. **Crear componente `EventDetail.tsx`** (3-4h)
   ```typescript
   interface EventDetailProps {
     event: Event & { venue: Venue | null };
   }

   export function EventDetail({ event }: EventDetailProps) {
     return (
       <div className="max-w-4xl mx-auto p-6">
         {/* Hero Image */}
         <img src={event.imageUrl} alt={event.title} className="w-full h-96 object-cover rounded-lg" />

         {/* Title & Basic Info */}
         <h1 className="text-4xl font-bold mt-6">{event.title}</h1>
         <div className="flex gap-4 text-gray-600 mt-2">
           <span>📍 {event.venue?.name || event.city}</span>
           <span>📅 {formatDateTime(event.date)}</span>
           <span>💵 ${event.price?.toLocaleString()}</span>
         </div>

         {/* Description (FULL - esto es NUEVO en UI) */}
         <div className="mt-8">
           <h2 className="text-2xl font-semibold mb-4">Descripción</h2>
           <div
             className="prose max-w-none"
             dangerouslySetInnerHTML={{ __html: event.description || '' }}
           />
         </div>

         {/* CTA Button */}
         <a
           href={event.ticketUrl}
           target="_blank"
           className="mt-8 block w-full bg-blue-600 text-white text-center py-4 rounded-lg font-semibold"
         >
           Comprar Entradas →
         </a>

         {/* Back Link */}
         <Link href="/" className="mt-4 block text-blue-600">
           ← Volver a resultados
         </Link>
       </div>
     );
   }
   ```

3. **Agregar link en `EventCard.tsx`** (30min)
   ```typescript
   <Link href={`/eventos/${event.id}`}>
     <div className="cursor-pointer hover:shadow-lg transition">
       {/* ... existing card content ... */}
     </div>
   </Link>
   ```

4. **SEO: Dynamic Meta Tags** (1h)
   ```typescript
   // app/eventos/[id]/page.tsx
   export async function generateMetadata({ params }: Props): Promise<Metadata> {
     const event = await getEvent(params.id);

     return {
       title: `${event.title} - EnVivo`,
       description: event.description?.substring(0, 160),
       openGraph: {
         images: [event.imageUrl],
       },
     };
   }
   ```

**Resultado**:
- ✅ Vista de detalle completa funcional
- ✅ Descripción completa visible (ya la tenemos en BD)
- ✅ SEO optimizado
- ✅ Link directo a compra
- ✅ Sin scraping adicional necesario

---

### Fase 2: Dirección del Venue (OPCIONAL)

**Duración**: 2-3 horas
**Valor**: ⭐⭐⭐

**Implementación**:

1. **Agregar campo `address` a schema de Venue** (si no existe)
2. **Extraer desde JSON-LD en lugar de meta description**
3. **Mostrar dirección en EventDetail**

**Código**:
```typescript
// En transforms.ts
export function extractJsonLD(html: string): any | undefined {
  const $ = cheerio.load(html);
  const jsonLdScript = $('script[type="application/ld+json"]').html();

  if (jsonLdScript) {
    try {
      return JSON.parse(jsonLdScript);
    } catch {
      return undefined;
    }
  }
}

// En GenericWebScraper
const jsonLd = extractJsonLD(html);
if (jsonLd?.location?.address) {
  detailData.address = jsonLd.location.address.streetAddress;
}
```

---

## 📊 Tabla de Priorización

| Feature | Valor Usuario | Esfuerzo | ROI | Prioridad |
|---------|---------------|----------|-----|-----------|
| **Vista Detalle (datos actuales)** | ⭐⭐⭐⭐⭐ | 4-6h | 🟢 MUY ALTO | **1** |
| Dirección del venue | ⭐⭐⭐ | 2-3h | 🟡 MEDIO | 2 |
| Rango de precios (min-max) | ⭐⭐⭐ | 3-4h | 🟡 MEDIO | 3 |
| JSON-LD parser (refactor) | ⭐⭐ | 3-4h | 🔴 BAJO | 4 |
| Info de artistas | ⭐⭐⭐⭐⭐ | 10-15h | 🔴 MUY BAJO | 5 (Post-MVP) |

---

## ✅ Conclusión

### Respuesta a tu Pregunta

**¿Qué datos le faltarían?**
- Realmente NO faltan datos críticos
- La descripción completa YA está en BD, solo falta mostrarla en UI
- Dirección del venue sería un nice-to-have

**¿Cómo se implementaría?**
- Vista de detalle: 4-6 horas (ruta + componente + SEO)
- No requiere scraping adicional, usamos lo que ya tenemos
- 90% del trabajo es UI/Frontend, no backend

**¿Tiene valor?**
- ✅ **SÍ, MUCHO VALOR**: Vista de detalle es esencial para MVP
- ✅ Mejora significativa de UX sin costo adicional de scraping
- ✅ Permite mostrar descripción completa (ya disponible)
- ✅ Mejor conversión a compra (más contexto → más confianza)

### Recomendación Final

**Implementar YA**: Vista de detalle con datos existentes
**Considerar después**: Dirección del venue desde JSON-LD
**Omitir por ahora**: Información de artistas (fuera de scope MVP)

---

**Impacto en Roadmap**:
- Agregaría ~6 horas a Fase 6
- Pero es un **must-have** para MVP según PRODUCT.md:
  > "US2.1: Como usuario quiero ver detalle completo de un evento para decidir si compro entradas"

**Conclusión**: Vale totalmente la pena implementar la vista de detalle.
