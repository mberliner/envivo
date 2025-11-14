# 🗄️ Base de Datos E2E - Setup y Migración

## Resumen

Los tests E2E ahora usan una **base de datos completamente separada** de la base de datos de desarrollo. Esto garantiza que:

- ✅ Los tests E2E no contaminan datos de desarrollo
- ✅ Puedes ejecutar tests en paralelo sin conflictos
- ✅ Puedes resetear la BD E2E sin afectar desarrollo
- ✅ El mismo esquema que desarrollo, pero datos diferentes

---

## 📋 Configuración Inicial

### 1. Variables de Entorno

**⚠️ IMPORTANTE:** NO agregues `DATABASE_URL_E2E` a `.env.local`. Playwright la pasa automáticamente.

Tu `.env.local` solo necesita:

```bash
# Base de datos de desarrollo (existente)
DATABASE_URL="file:./dev.db"

# Admin API key (requerida para tests E2E)
ADMIN_API_KEY="tu-api-key-de-32-caracteres-aqui"

# ⚠️ NO descomentar esto - Playwright lo pasa automáticamente
# DATABASE_URL_E2E="file:./e2e.db"
```

**Por qué:** Si configuras `DATABASE_URL_E2E` en `.env.local`, TODA la aplicación (incluso `npm run dev`) usará la BD E2E, lo cual NO es lo que quieres.

### 2. Crear la Base de Datos E2E

La BD E2E debe tener el mismo esquema que la BD de desarrollo. Usa Prisma para crearla:

```bash
# Método 1: Usar Prisma directamente
DATABASE_URL="file:./e2e.db" npx prisma db push

# Método 2: Usar el script de inicialización (verifica que existe)
npm run db:e2e:init
```

**Resultado esperado:**
```
✅ Base de datos E2E está lista:
   📊 Eventos: 0
   🚫 Blacklist: 0
```

### 3. Verificar la Configuración

```bash
# Verificar que DATABASE_URL está configurada
echo $DATABASE_URL       # file:./dev.db

# ⚠️ DATABASE_URL_E2E NO debe estar en tu shell/env
# Solo Playwright la pasa cuando ejecuta tests

# Verificar que ambas BDs existen
ls -lah *.db
# Deberías ver: dev.db y e2e.db

# Abrir la BD E2E en Prisma Studio (opcional)
npm run db:e2e:studio
```

---

## 🧪 Ejecutar Tests E2E

Los tests ahora usan automáticamente la BD E2E:

```bash
# Modo desarrollo (usa servidor dev en puerto 3000)
npm run test:e2e

# Modo producción (build + servidor en puerto 3001)
npm run test:e2e:prod
```

**Cómo funciona internamente:**

1. **Playwright config** pasa `DATABASE_URL_E2E` al servidor
2. **Endpoints `/api/test/*`** usan `getE2EPrismaClient()` que:
   - Lee `DATABASE_URL_E2E` si está disponible
   - Fallback a `DATABASE_URL` si no está configurada (compatibilidad)
3. **Tests crean/limpian datos** solo en la BD E2E

---

## 📂 Archivos Modificados

### Nuevos Archivos

```
src/app/api/test/helpers/
└── e2e-db.ts                  # Helper para obtener PrismaClient con BD E2E

scripts/
└── init-e2e-db.ts             # Script de inicialización (opcional)

docs/
└── E2E_DATABASE_SETUP.md      # Esta guía
```

### Archivos Modificados

```
.env.example                   # Agregada DATABASE_URL_E2E
src/shared/infrastructure/config/env.ts  # Schema Zod con DATABASE_URL_E2E
src/app/api/test/seed/route.ts           # Usa getE2EPrismaClient()
src/app/api/test/cleanup/route.ts        # Usa getE2EPrismaClient()
playwright.config.ts           # Pasa DATABASE_URL_E2E al servidor dev
playwright.config.prod.ts      # Pasa DATABASE_URL_E2E al servidor prod
package.json                   # Agregados scripts db:e2e:*
e2e/README.md                  # Actualizada documentación
```

---

## 🔧 Comandos Útiles

### Gestión de BD E2E

```bash
# Inicializar BD E2E (primera vez)
DATABASE_URL="file:./e2e.db" npx prisma db push

# Ver contenido de BD E2E en Prisma Studio
npm run db:e2e:studio

# Resetear BD E2E (eliminar y recrear)
rm e2e.db e2e.db-journal
DATABASE_URL="file:./e2e.db" npx prisma db push
```

### Debugging

```bash
# Ver qué BD está usando el servidor
# (revisa los logs del servidor cuando ejecutas tests)
npm run test:e2e
# Busca en la salida: "[E2E DB] Using E2E database: file:./e2e.db"

# Limpiar datos de test manualmente
curl -X DELETE http://localhost:3000/api/test/cleanup \
  -H "x-api-key: $ADMIN_API_KEY"

# Crear datos de test manualmente
curl -X POST http://localhost:3000/api/test/seed \
  -H "x-api-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"count": 5, "prefix": "DEBUG"}'
```

---

## 🔄 Migración desde Setup Anterior

Si ya tenías tests E2E funcionando:

### Antes (BD única)
- Tests modificaban `dev.db`
- Datos de test mezclados con datos de desarrollo
- Necesitabas limpiar manualmente después de tests

### Después (BD separada)
- Tests modifican `e2e.db`
- Datos de test completamente aislados
- Limpieza automática en `afterAll()`

### Pasos de Migración

1. **Agregar variable de entorno:**
   ```bash
   echo 'DATABASE_URL_E2E="file:./e2e.db"' >> .env.local
   ```

2. **Crear BD E2E:**
   ```bash
   DATABASE_URL="file:./e2e.db" npx prisma db push
   ```

3. **Ejecutar tests:**
   ```bash
   npm run test:e2e
   ```

4. **Limpiar BD desarrollo (opcional):**
   ```bash
   # Si tu BD de desarrollo tiene datos de test viejos
   curl -X DELETE http://localhost:3000/api/test/cleanup \
     -H "x-api-key: $ADMIN_API_KEY"
   ```

---

## ❓ Troubleshooting

### Error: "DATABASE_URL_E2E not set"

**Causa:** Variable de entorno no configurada.

**Solución:**
```bash
# Agregar a .env.local
echo 'DATABASE_URL_E2E="file:./e2e.db"' >> .env.local

# Reiniciar servidor/tests
```

### Error: "Table 'Event' does not exist"

**Causa:** BD E2E no fue creada o el esquema no fue aplicado.

**Solución:**
```bash
DATABASE_URL="file:./e2e.db" npx prisma db push
```

### Tests fallan con "ENOENT: no such file or directory"

**Causa:** BD E2E no existe.

**Solución:**
```bash
DATABASE_URL="file:./e2e.db" npx prisma db push
```

### BD E2E se llenó de datos de test

**Causa:** `afterAll()` no se ejecutó (test terminó con error).

**Solución:**
```bash
# Opción 1: Limpiar manualmente
curl -X DELETE http://localhost:3000/api/test/cleanup?prefix=E2E-TEST \
  -H "x-api-key: $ADMIN_API_KEY"

# Opción 2: Resetear completamente
rm e2e.db e2e.db-journal
DATABASE_URL="file:./e2e.db" npx prisma db push
```

### No veo logs de "[E2E DB] Using..."

**Causa:** Estás en modo producción (`NODE_ENV=production`).

**Explicación:** Los logs de debug solo se muestran en desarrollo. Esto es normal.

---

## 🏗️ Arquitectura Técnica

### Helper: `getE2EPrismaClient()`

```typescript
// src/app/api/test/helpers/e2e-db.ts
export function getE2EPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL_E2E || process.env.DATABASE_URL;

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,  // ← Usa BD E2E si está configurada
      },
    },
  });
}
```

### Endpoints de Test

Los endpoints `/api/test/seed` y `/api/test/cleanup` usan este helper:

```typescript
import { getE2EPrismaClient } from '../helpers/e2e-db';

const prisma = getE2EPrismaClient();  // ← Usa BD E2E

// Los métodos prisma.event.* ahora operan en e2e.db
```

### Playwright Configs

Pasan `DATABASE_URL_E2E` al servidor:

```typescript
// playwright.config.ts
webServer: {
  command: 'npm run dev',
  env: {
    DATABASE_URL_E2E: process.env.DATABASE_URL_E2E || 'file:./e2e.db',
  },
}
```

---

## ✅ Checklist de Setup Completo

- [ ] `DATABASE_URL_E2E` agregada a `.env.local`
- [ ] BD E2E creada con `npx prisma db push`
- [ ] `ADMIN_API_KEY` configurada en `.env.local`
- [ ] Tests E2E ejecutan correctamente: `npm run test:e2e`
- [ ] Logs muestran: `[E2E DB] Using E2E database: file:./e2e.db`
- [ ] BD de desarrollo (`dev.db`) no es modificada por tests

---

## 📚 Referencias

- [e2e/README.md](../e2e/README.md) - Guía completa de tests E2E
- [CLAUDE.md](../CLAUDE.md#variables-de-entorno) - Variables de entorno del proyecto
- [docs/DEVELOPMENT.md](./DEVELOPMENT.md#testing-requirements) - Testing requirements

---

**Última actualización:** Noviembre 2025
