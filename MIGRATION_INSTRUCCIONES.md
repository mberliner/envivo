# Instrucciones para Aplicar Migración de venueName

## Problema
El cliente de Prisma necesita regenerarse para reconocer el nuevo campo `venueName`.

## Pasos a Seguir

### 1. Aplicar la migración a la base de datos

```bash
npx prisma db push
```

O si preferís usar el sistema de migraciones con tracking:

```bash
npx prisma migrate dev
```

### 2. Regenerar el cliente de Prisma

```bash
npx prisma generate
```

### 3. Reiniciar el servidor de desarrollo

```bash
npm run dev
```

## ¿Qué hace esto?

1. **`prisma db push`** o **`prisma migrate dev`**: Agrega la columna `venueName` a la tabla `events` en la base de datos
2. **`prisma generate`**: Regenera los tipos de TypeScript para que Prisma reconozca el nuevo campo
3. **Reiniciar servidor**: Carga el nuevo cliente de Prisma con el campo actualizado

## Verificación

Después de completar los pasos, el scraping debería funcionar sin errores de "Unknown argument `venueName`".

Podés verificar que funcionó ejecutando el scraper de Teatro Coliseo:
```bash
curl -X POST http://localhost:3000/api/admin/scraper/sync -H "x-admin-api-key: YOUR_KEY"
```

Los eventos de Teatro Coliseo ahora mostrarán "Teatro Coliseo" en las tarjetas de la UI.
