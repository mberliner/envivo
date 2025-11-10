# Verificación US3.2: Ocultar Eventos No Deseados

Guía completa para verificar que la funcionalidad de blacklist funciona correctamente.

---

## 📋 Checklist de Verificación

### ✅ Paso 1: Verificar Tabla en Base de Datos

**Qué verifica**: Que la tabla `event_blacklist` existe en SQLite

**Método 1 - Script Automático (RECOMENDADO)**:
```bash
node scripts/verify-us3.2.js
```

**Método 2 - Verificación Manual**:
```bash
node scripts/check-blacklist.js
```

**Resultado esperado**:
```
✅ Tabla "event_blacklist" existe
📊 Total de eventos blacklisted: 0
```

---

### ✅ Paso 2: Verificar Botón en UI

**Qué verifica**: Que el botón de eliminar aparece en cada evento

**Cómo verificar**:
1. Abrí http://localhost:3000
2. Deberías ver un botón rojo con "X" en la esquina superior izquierda de cada imagen de evento
3. Al hacer hover, debe decir "Ocultar este evento"

**Aspecto visual**:
```
┌─────────────────────────────────┐
│ [X]                   [Concierto]│ ← Botón rojo aquí
│                                   │
│        Imagen del evento          │
│                                   │
└─────────────────────────────────┘
```

**Resultado esperado**: ✅ Botón visible en todos los eventos con imagen

---

### ✅ Paso 3: Probar Eliminación de Evento

**Qué verifica**: Que al hacer click en "X", el evento desaparece

**Método 1 - Desde UI (RECOMENDADO)**:
1. Abrí http://localhost:3000
2. Hacé click en el botón rojo "X" de cualquier evento
3. Confirmá en el diálogo que aparece
4. El evento debe desaparecer INMEDIATAMENTE de la vista

**Método 2 - Script Automático**:
```bash
node scripts/verify-us3.2.js
```

Este script:
- ✅ Verifica que la tabla existe
- ✅ Obtiene un evento de prueba
- ✅ Lo elimina vía API
- ✅ Verifica que desapareció de la BD
- ✅ Te da los datos para la próxima verificación

**Resultado esperado**:
```
✅ VERIFICACIÓN EXITOSA - US3.2 funcionando correctamente!

📝 Próximos pasos para verificación completa:
   1. Ejecuta: node scripts/scrape-livepass.js
   2. Verifica que el evento eliminado NO regresa
```

---

### ✅ Paso 4: Verificar Blacklist en Base de Datos

**Qué verifica**: Que el evento se guardó en la tabla `event_blacklist`

**Cómo verificar**:
```bash
node scripts/check-blacklist.js
```

**Resultado esperado**:
```
✅ Tabla "event_blacklist" existe

📊 Total de eventos blacklisted: 1

📋 Eventos en Blacklist:
────────────────────────────────────────────────────────────────────────────────

1. livepass/santiago-molina-cafe-berlin
   ID: abc123xyz
   Razón: Usuario lo eliminó desde UI
   Fecha: 10/11/2025, 15:30:00

────────────────────────────────────────────────────────────────────────────────

✅ Total: 1 evento(s) en blacklist
```

---

### ✅ Paso 5: Verificar que NO Regresa en Scraping

**Qué verifica**: La funcionalidad completa - eventos blacklisted no regresan

**Cómo verificar**:

1. **Anotá los datos del evento eliminado** (del paso anterior):
   - Título del evento
   - Source (ej: "livepass")
   - External ID

2. **Ejecutá el scraping**:
   ```bash
   node scripts/scrape-livepass.js
   ```

3. **Verificá el resultado**:
   ```
   ✅ Scraping completado exitosamente!

   📊 Resultados:
      • Total eventos scrapeados: 61
      • Eventos procesados: 60  ← Uno menos!
      • Duplicados detectados: 0
      • Errores: 1              ← El evento blacklisted fue rechazado
      • Duración: 4523ms
   ```

4. **Verificá en el navegador**:
   - Abrí http://localhost:3000
   - Buscá el evento eliminado (por título)
   - **NO debe aparecer** en los resultados

**Resultado esperado**:
- ✅ El evento blacklisted NO regresa
- ✅ Total procesado = Total scrapeado - 1
- ✅ Error en logs: "Evento en blacklist (oculto por usuario)"

---

## 🔍 Verificación en Logs del Servidor

Si tenés el servidor corriendo (`npm run dev`), deberías ver esto en los logs cuando se rechaza un evento blacklisted:

```
[EventService] Checking blacklist for: livepass/santiago-molina-cafe-berlin
[EventService] ❌ Event rejected: Evento en blacklist (oculto por usuario)
```

---

## 🐛 Troubleshooting

### Problema: "Property 'eventBlacklist' does not exist"

**Causa**: El Prisma client no se regeneró después de agregar el modelo

**Solución**:
1. Verificá que la migración se aplicó: `node scripts/check-blacklist.js`
2. Reiniciá el servidor: `Ctrl+C` → `npm run dev`
3. Si persiste, chequeá que el schema tiene el modelo EventBlacklist

---

### Problema: El evento SÍ regresa después del scraping

**Causa**: La blacklist no se está consultando correctamente

**Diagnóstico**:
1. Verificá que el evento tiene `externalId`:
   ```bash
   node scripts/check-blacklist.js
   ```
2. Verificá que el source y externalId coinciden
3. Chequeá logs del servidor durante el scraping

**Solución**: El código tiene `@ts-ignore` porque el modelo eventBlacklist podría no estar en el tipo. Verificá que la migración se aplicó correctamente.

---

### Problema: El botón "X" no aparece en la UI

**Causa**: El componente EventCard no recibió el prop `onDelete`

**Solución**:
1. Verificá que EventsPage pasa `onDelete={handleEventDelete}` a EventCard
2. Chequeá que reiniciaste el servidor después de los cambios
3. Limpiá el caché del navegador (Ctrl+Shift+R)

---

## ✅ Resumen de Verificación Exitosa

Si todos los pasos pasaron, deberías tener:

| Verificación | Estado | Comando |
|--------------|--------|---------|
| Tabla creada | ✅ | `node scripts/check-blacklist.js` |
| Botón visible en UI | ✅ | Abrir http://localhost:3000 |
| Eliminación funciona | ✅ | Click en "X" → evento desaparece |
| Guardado en blacklist | ✅ | `node scripts/check-blacklist.js` |
| No regresa en scraping | ✅ | `node scripts/scrape-livepass.js` |

---

## 🎯 Comando de Verificación Rápida

Para verificar todo de una vez:

```bash
# 1. Verificar y crear tabla si no existe
node scripts/verify-us3.2.js

# 2. Ver contenido de blacklist
node scripts/check-blacklist.js

# 3. Ejecutar scraping y verificar que evento no regresa
node scripts/scrape-livepass.js

# 4. Abrir navegador y verificar que evento no aparece
start http://localhost:3000
```

---

**Última actualización**: 10 de Noviembre 2025
