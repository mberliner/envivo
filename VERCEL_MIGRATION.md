# Migración a Vercel + Turso

> **⚠️ DOCUMENTO TEMPORAL - ELIMINAR DESPUÉS DE COMPLETAR IMPLEMENTACIÓN**
>
> **Fecha creación**: 12 Diciembre 2025
> **Propósito**: Guía de migración de SQLite local a Turso para deploy en Vercel
> **Estado**: Documento de trabajo
> **Acción post-implementación**: Eliminar este archivo + referencia en CLAUDE.md

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [El Problema: SQLite en Vercel](#el-problema-sqlite-en-vercel)
3. [La Solución: Turso](#la-solución-turso)
4. [Arquitectura Comparada](#arquitectura-comparada)
5. [Fases de Migración](#fases-de-migración)
6. [Checklist de Verificación](#checklist-de-verificación)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Strategy](#rollback-strategy)

---

## Resumen Ejecutivo

**Problema**: SQLite local usa filesystem, Vercel tiene filesystem read-only → datos no persisten

**Solución**: Migrar a Turso (SQLite remoto vía HTTP/WebSocket) → datos persisten en servidor

**Tiempo estimado**: 1.5 horas

**Dependencias ya instaladas**: ✅ `@prisma/adapter-libsql`, `libsql` (líneas 26-27 de package.json)

**Archivos a modificar**: 4 archivos de código + configuración Vercel

---

## El Problema: SQLite en Vercel

### Arquitectura Actual (No Funciona en Vercel)

```
┌─────────────────────────────────┐
│   Vercel Container (Read-Only)  │
│                                  │
│  ┌──────────────┐                │
│  │  Next.js App │                │
│  │              │                │
│  │  ┌────────┐  │                │
│  │  │ Prisma │──┼────┐           │
│  │  └────────┘  │    │           │
│  └──────────────┘    │           │
│                      │           │
│                      ▼           │
│              ┌──────────────┐    │
│              │ dev.db FILE  │ ❌ │ ← Requiere WRITE al filesystem
│              │ (Read-Only)  │    │ ← Vercel NO permite escritura
│              └──────────────┘    │
└─────────────────────────────────┘
```

### Por Qué Falla

1. **SQLite escribe a archivo local** (`dev.db`)
2. **Vercel tiene filesystem read-only** en contenedores
3. **Filesystem es efímero** → se pierde entre deployments
4. **Resultado**: Base de datos vacía en cada deploy

### Evidencia en Código Actual

```typescript
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // Espera: file:./dev.db
}

// .env.example
DATABASE_URL="file:./dev.db"  // ❌ No funciona en Vercel
```

---

## La Solución: Turso

### ¿Qué es Turso?

- **SQLite remoto** en la nube (libSQL protocol)
- Compatible con sintaxis SQLite (mínimos cambios)
- Se conecta vía **HTTP/WebSocket** (no filesystem)
- **Plan gratuito**: 500 DBs, 9GB storage, 1B row reads/mes
- **Edge replicas**: Baja latencia global

### Arquitectura con Turso (Funciona en Vercel)

```
┌─────────────────────────────────┐         ┌─────────────────────────┐
│   Vercel Container (Read-Only)  │         │   Turso Cloud           │
│                                  │         │   (Servicio Remoto)     │
│  ┌──────────────┐                │         │                         │
│  │  Next.js App │                │         │  ┌──────────────────┐   │
│  │              │                │         │  │  SQLite Database │   │
│  │  ┌────────┐  │                │         │  │  (en memoria RAM │   │
│  │  │ Prisma │──┼────┐           │         │  │   + disk storage)│   │
│  │  └────────┘  │    │           │         │  └──────────────────┘   │
│  └──────────────┘    │           │         │           ▲             │
│                      │           │         │           │             │
│                      ▼           │         │           │             │
│              ┌──────────────┐    │   HTTP  │  ┌────────┴─────────┐   │
│              │ libsql       │────┼─────────┼─>│ libSQL Server    │   │
│              │ client       │◄───┼─────────┼──│ (Puerto 443/WSS) │   │
│              │ (en memoria) │    │   HTTPS │  └──────────────────┘   │
│              └──────────────┘    │         │                         │
└─────────────────────────────────┘         └─────────────────────────┘
          NO TOCA FILESYSTEM                    ESCRIBE EN SERVIDOR
```

### Cómo Funciona

1. App en Vercel **no toca filesystem local**
2. Cliente `libsql` abre conexión HTTP/WebSocket a `turso.io`
3. Queries viajan por red (como PostgreSQL/MySQL)
4. Turso escribe al disco en **sus servidores** (no en Vercel)
5. Datos **persisten** en infraestructura de Turso

### Ventajas vs SQLite Local

| Aspecto           | SQLite Local                       | Turso                      |
| ----------------- | ---------------------------------- | -------------------------- |
| **Storage**       | Archivo local `.db`                | Servidor remoto en cloud   |
| **I/O**           | Filesystem API (fs.open, fs.write) | HTTP/WebSocket API         |
| **Vercel**        | ❌ Read-only filesystem            | ✅ Solo network requests   |
| **Persistencia**  | ❌ Se pierde en redeploy           | ✅ Persiste en servidor    |
| **Latencia**      | ~1ms (local)                       | ~50-200ms (HTTP roundtrip) |
| **Escalabilidad** | ❌ Single-process                  | ✅ Múltiples connections   |
| **Costo**         | Gratis                             | Gratis (plan starter)      |

---

## Arquitectura Comparada

### Protocolo de Comunicación: Turso (libSQL)

```
Cliente (Vercel)                    Servidor (Turso)
─────────────────                   ─────────────────

1. CONNECT
   ├─> HTTPS handshake
   ├─> Auth: Bearer eyJhbGc...
   └─> Response: Session ID

2. EXECUTE QUERY
   ├─> POST /v1/execute
   ├─> Body: { "sql": "SELECT * FROM Event" }
   └─> Response: { "rows": [...] }

3. WRITE DATA
   ├─> POST /v1/execute
   ├─> Body: { "sql": "INSERT INTO Event ..." }
   └─> Response: { "affected_rows": 1 }

4. CLOSE
   └─> WebSocket close
```

### Infraestructura de Turso

```
┌─────────────────────────────────────────────────────┐
│              Turso Infrastructure                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Primary Replica (Write)                     │   │
│  │  ┌────────────────────────────────────────┐  │   │
│  │  │  SQLite Database File                  │  │   │
│  │  │  (en disco persistente en Turso Cloud) │  │   │
│  │  └────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                       │                              │
│                       │ Replica Sync                 │
│                       ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │  Edge Replicas (Read) - Global CDN           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │   │
│  │  │ US East │  │ EU West │  │ Asia    │      │   │
│  │  └─────────┘  └─────────┘  └─────────┘      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Tu app en Vercel se conecta a la replica más       │
│  cercana vía HTTP/WebSocket (baja latencia)         │
└─────────────────────────────────────────────────────┘
```

---

## Fases de Migración

### FASE 1: Setup de Turso (Externo, Manual) - 15 minutos

**Requisitos**: Terminal local, cuenta Turso

#### 1.1 Instalar Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm https://get.tur.so/install.ps1 | iex
```

#### 1.2 Autenticarse

```bash
# Crear cuenta o login
turso auth signup
# O si ya tienes cuenta:
turso auth login
```

#### 1.3 Crear Base de Datos

```bash
# Crear DB para producción
turso db create envivo-production

# Verificar creación
turso db list
```

**Output esperado:**

```
Name                 URL
envivo-production    libsql://envivo-production-[tu-org].turso.io
```

#### 1.4 Obtener Credenciales

```bash
# 1. URL de conexión
turso db show envivo-production --url

# Output: libsql://envivo-production-[tu-org].turso.io
# COPIAR este valor → será TURSO_DATABASE_URL

# 2. Auth Token
turso db tokens create envivo-production

# Output: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
# COPIAR este valor → será TURSO_AUTH_TOKEN
```

#### 1.5 Guardar Credenciales

Crear archivo temporal (NO commitear):

```bash
# En la raíz del proyecto, crear archivo temporal
nano turso-credentials.txt
```

Contenido:

```
TURSO_DATABASE_URL=libsql://envivo-production-[tu-org].turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**: Este archivo es temporal, NO agregarlo a git.

---

### FASE 2: Cambios en Código - 30 minutos

#### 2.1 Actualizar `prisma/schema.prisma`

**Ubicación**: `prisma/schema.prisma`

**Cambio**:

```diff
 datasource db {
   provider = "sqlite"
-  url      = env("DATABASE_URL")
+  url      = env("TURSO_DATABASE_URL")
 }
```

**Nota**: El provider sigue siendo `"sqlite"` porque Turso es compatible con SQLite.

---

#### 2.2 Actualizar `.env.example`

**Ubicación**: `.env.example`

**Cambio**:

```diff
 # Database
-DATABASE_URL="file:./dev.db"
+# Local development (SQLite)
+DATABASE_URL="file:./dev.db"
+
+# Production (Turso - solo en Vercel)
+TURSO_DATABASE_URL="libsql://envivo-production-xxx.turso.io"
+TURSO_AUTH_TOKEN="eyJhbGc..."
```

---

#### 2.3 Actualizar `src/shared/infrastructure/config/env.ts`

**Ubicación**: `src/shared/infrastructure/config/env.ts`

**Cambio**:

```diff
 export const env = createEnv({
   server: {
     DATABASE_URL: z.string().url(),
+    TURSO_DATABASE_URL: z.string().url().optional(),
+    TURSO_AUTH_TOKEN: z.string().optional(),
     ADMIN_API_KEY: z.string().min(32).optional(),
     TICKETMASTER_API_KEY: z.string().optional(),
     // ... resto de variables
   },
```

---

#### 2.4 Actualizar `src/shared/infrastructure/database/prisma.ts`

**Ubicación**: `src/shared/infrastructure/database/prisma.ts`

**Reemplazo completo del archivo**:

```typescript
/**
 * Prisma Client Singleton
 *
 * Soporta dual-mode:
 * - Desarrollo: SQLite local (file:./dev.db)
 * - Producción: Turso remoto (libsql://...)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Detectar si estamos usando Turso (producción)
const isTurso = !!process.env.TURSO_DATABASE_URL;

let prisma: PrismaClient;

if (isTurso) {
  // PRODUCCIÓN: Usar Turso (libSQL remoto)
  console.log('[Prisma] Connecting to Turso (remote SQLite)');

  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const adapter = new PrismaLibSQL(libsql);

  prisma = new PrismaClient({
    adapter,
    log: ['error'], // Solo errores en producción
  });
} else {
  // DESARROLLO: Usar SQLite local
  console.log('[Prisma] Connecting to local SQLite (dev.db)');

  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Singleton pattern para Next.js (evita múltiples instancias en hot reload)
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma };
```

**Cambios clave**:

1. Import de `PrismaLibSQL` y `createClient`
2. Detección de modo (Turso vs local)
3. Creación condicional de cliente Prisma
4. Logging diferenciado por entorno

---

### FASE 3: Testing Local - 15 minutos

#### 3.1 Crear `.env.local` con Credenciales de Turso

```bash
# Copiar credenciales del archivo temporal
cp turso-credentials.txt .env.local

# O agregar manualmente:
echo 'TURSO_DATABASE_URL="libsql://envivo-production-xxx.turso.io"' >> .env.local
echo 'TURSO_AUTH_TOKEN="eyJhbGc..."' >> .env.local

# Agregar otras variables necesarias
echo 'ADMIN_API_KEY="tu-admin-api-key"' >> .env.local
echo 'NEXT_PUBLIC_APP_URL="http://localhost:3000"' >> .env.local
```

#### 3.2 Regenerar Prisma Client

```bash
npm run db:generate
```

**Output esperado:**

```
✔ Generated Prisma Client (...)
```

#### 3.3 Push Schema a Turso

```bash
npx prisma db push
```

**Output esperado:**

```
Your database is now in sync with your schema.
✔ Generated Prisma Client (...)
```

**⚠️ IMPORTANTE**: Esto crea las tablas en Turso, NO en `dev.db` local.

#### 3.4 Verificar Conexión

```bash
# Iniciar servidor
npm run dev

# Debería mostrar en consola:
# [Prisma] Connecting to Turso (remote SQLite)
```

Si ves este mensaje, la conexión es exitosa.

#### 3.5 Verificar con Turso Shell

```bash
# Abrir shell de Turso
turso db shell envivo-production

# Dentro del shell, listar tablas:
.tables

# Output esperado:
# Event  EventBlacklist  GlobalPreferences  Venue  Artist  EventArtist  VenueMetadata

# Salir:
.quit
```

#### 3.6 Correr Tests

```bash
# TypeScript
npm run type-check

# Tests unitarios
npm run test

# Linter
npm run lint
```

**Todos deben pasar sin errores.**

---

### FASE 4: Configurar Vercel - 10 minutos

#### 4.1 Crear Proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Click en "Add New..." → "Project"
3. Importar repositorio GitHub
4. Seleccionar branch `master` (o el que uses)

#### 4.2 Configurar Variables de Entorno

**En Vercel Dashboard** → Settings → Environment Variables

Agregar las siguientes variables (para **Production**):

| Variable               | Valor                                     | Environment |
| ---------------------- | ----------------------------------------- | ----------- |
| `TURSO_DATABASE_URL`   | `libsql://envivo-production-xxx.turso.io` | Production  |
| `TURSO_AUTH_TOKEN`     | `eyJhbGc...` (marcar como Secret)         | Production  |
| `ADMIN_API_KEY`        | Tu API key (32+ chars)                    | Production  |
| `NEXT_PUBLIC_APP_URL`  | `https://envivo.vercel.app`               | Production  |
| `NEXT_PUBLIC_APP_NAME` | `EnVivo`                                  | Production  |

**⚠️ CRÍTICO**:

- `TURSO_AUTH_TOKEN` debe marcarse como **Secret** (oculto en logs)
- `ADMIN_API_KEY` debe ser el mismo que usas localmente

#### 4.3 Configurar Build Settings (Opcional)

Por defecto Vercel detecta Next.js automáticamente. Si necesitas override:

- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

---

### FASE 5: Deploy - 5 minutos

#### 5.1 Commit y Push

```bash
# Revisar cambios
git status

# Debería mostrar:
# modified:   prisma/schema.prisma
# modified:   .env.example
# modified:   src/shared/infrastructure/config/env.ts
# modified:   src/shared/infrastructure/database/prisma.ts

# Agregar cambios
git add prisma/schema.prisma .env.example src/shared/infrastructure/config/env.ts src/shared/infrastructure/database/prisma.ts

# Commit
git commit -m "feat: migrate to Turso for Vercel deployment"

# Push
git push origin master
```

#### 5.2 Deploy Automático

Vercel detecta el push y **automáticamente**:

1. Clona el repositorio
2. Instala dependencias (`npm install`)
3. Ejecuta build (`npm run build`)
   - Incluye `prisma generate` automáticamente
4. Deploya la aplicación

**Tiempo estimado**: 2-3 minutos

#### 5.3 Monitorear Deploy

En Vercel Dashboard → Deployments → Ver build logs

Buscar mensajes clave:

```
✓ Compiled successfully
✓ Generated Prisma Client
✓ Linting and checking validity of types
```

---

### FASE 6: Post-Deploy - 10 minutos

#### 6.1 Verificar Schema en Turso

```bash
# Ya debería estar (se hizo en FASE 3.3)
# Pero verificar:
turso db shell envivo-production
.tables
.quit
```

#### 6.2 Seed Inicial de Datos

**Opción A: Via API Endpoint (RECOMENDADO)**

```bash
# Ejecutar scraper de LivePass
curl -X POST https://envivo.vercel.app/api/admin/scrape \
  -H "Authorization: Bearer tu-admin-api-key"
```

**Output esperado:**

```json
{
  "success": true,
  "result": {
    "totalEvents": 15,
    "totalProcessed": 12,
    "totalDuplicates": 0
  }
}
```

**Opción B: Usar Prisma Seed (requiere configuración adicional)**

Crear script de seed que se conecte a Turso.

#### 6.3 Verificar App en Producción

```bash
# Abrir en navegador
open https://envivo.vercel.app

# O con curl
curl https://envivo.vercel.app/api/events
```

**Deberías ver**:

- Home page con eventos
- Búsqueda funcional
- Filtros funcionando
- Detalles de eventos

#### 6.4 Verificar Datos en Turso

```bash
# Ver datos reales
turso db shell envivo-production

# En el shell:
SELECT COUNT(*) FROM Event;

# Output esperado: > 0 eventos

.quit
```

---

## Checklist de Verificación

### Pre-Deploy

- [ ] Turso CLI instalado y autenticado
- [ ] Base de datos `envivo-production` creada
- [ ] `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` obtenidos
- [ ] 4 archivos de código actualizados:
  - [ ] `prisma/schema.prisma`
  - [ ] `.env.example`
  - [ ] `src/shared/infrastructure/config/env.ts`
  - [ ] `src/shared/infrastructure/database/prisma.ts`
- [ ] Schema pusheado a Turso (`npx prisma db push`)
- [ ] Tests locales pasando (`npm run test && npm run type-check`)
- [ ] Conexión local a Turso verificada

### Deploy

- [ ] Variables de entorno configuradas en Vercel
- [ ] Cambios commiteados y pusheados a GitHub
- [ ] Deploy exitoso en Vercel (sin errores de build)
- [ ] Logs de build muestran `Generated Prisma Client`

### Post-Deploy

- [ ] App accesible en `https://envivo.vercel.app`
- [ ] Datos seeded exitosamente (scraper ejecutado)
- [ ] Home page muestra eventos
- [ ] Búsqueda funcional
- [ ] Detalle de evento funciona
- [ ] API endpoints responden correctamente
- [ ] No hay errores en Vercel logs

---

## Troubleshooting

### Error: "Cannot find module '@prisma/adapter-libsql'"

**Causa**: Dependencia no instalada

**Solución**:

```bash
npm install @prisma/adapter-libsql @libsql/client
```

---

### Error: "Invalid `prisma.event.findMany()` invocation"

**Causa**: Prisma client no regenerado después de cambiar schema

**Solución**:

```bash
npm run db:generate
npx prisma db push
```

---

### Error: "TURSO_DATABASE_URL is not defined"

**Causa**: Variable de entorno faltante

**Solución**:

**Local**:

```bash
# Verificar .env.local
cat .env.local | grep TURSO

# Agregar si falta
echo 'TURSO_DATABASE_URL="libsql://..."' >> .env.local
```

**Vercel**:

- Ir a Settings → Environment Variables
- Agregar `TURSO_DATABASE_URL`
- Redeploy

---

### Error: "Authentication failed" en Turso

**Causa**: Token inválido o expirado

**Solución**:

```bash
# Regenerar token
turso db tokens create envivo-production

# Actualizar en .env.local y Vercel
```

---

### Error: "Table 'Event' does not exist"

**Causa**: Schema no pusheado a Turso

**Solución**:

```bash
# Push schema
npx prisma db push

# Verificar en Turso shell
turso db shell envivo-production
.tables
```

---

### Build falla en Vercel: "Prisma schema not found"

**Causa**: `prisma/schema.prisma` no commiteado

**Solución**:

```bash
git add prisma/schema.prisma
git commit -m "fix: add prisma schema"
git push
```

---

### App funciona local pero no en Vercel

**Checklist**:

1. **Verificar variables de entorno en Vercel**
   - Todas las variables necesarias configuradas
   - `TURSO_DATABASE_URL` apunta a Turso (no `file:./dev.db`)

2. **Verificar logs de Vercel**
   - Buscar errores específicos
   - Verificar que Prisma genera cliente correctamente

3. **Verificar schema en Turso**

   ```bash
   turso db shell envivo-production
   .tables
   ```

4. **Redeploy forzado**
   - En Vercel Dashboard → Deployments → Latest → "Redeploy"

---

### Datos desaparecen después de deploy

**Causa**: Usando SQLite local en lugar de Turso

**Diagnóstico**:

```bash
# Ver logs de Vercel
# Buscar: "[Prisma] Connecting to..."

# Debería decir: "Connecting to Turso (remote SQLite)"
# NO debería decir: "Connecting to local SQLite (dev.db)"
```

**Solución**:

- Verificar que `TURSO_DATABASE_URL` esté configurado en Vercel
- Verificar que `prisma.ts` detecta correctamente Turso

---

## Rollback Strategy

### Si algo falla en producción

#### Opción 1: Rollback de Deploy en Vercel

1. Ir a Vercel Dashboard → Deployments
2. Seleccionar deploy anterior (antes de migración)
3. Click en "..." → "Promote to Production"
4. Deploy anterior se restaura (usando SQLite local)

**⚠️ ADVERTENCIA**: Perderás datos nuevos (Turso → SQLite)

---

#### Opción 2: Revertir Cambios en Git

```bash
# Ver commits recientes
git log --oneline -5

# Revertir commit de migración
git revert <commit-hash>

# Push
git push origin master
```

Vercel redeploya automáticamente con código anterior.

---

#### Opción 3: Fix Forward (RECOMENDADO)

En lugar de revertir, arreglar el problema:

1. Identificar error en logs de Vercel
2. Aplicar fix
3. Commit y push
4. Vercel redeploya automáticamente

**Ventaja**: No pierdes datos de Turso

---

### Backup de Datos de Turso

**Antes de migración, exportar datos**:

```bash
# Desde SQLite local (pre-migración)
sqlite3 dev.db .dump > backup-pre-migration.sql

# Después de migración exitosa, desde Turso
turso db shell envivo-production < backup-pre-migration.sql
```

---

### Restaurar desde Backup

```bash
# Crear nueva DB temporal
turso db create envivo-restore

# Restaurar dump
turso db shell envivo-restore < backup-pre-migration.sql

# Swap databases (cambiar URL en Vercel)
turso db show envivo-restore --url
# Actualizar TURSO_DATABASE_URL en Vercel con nueva URL
```

---

## Resumen de Tiempos

| Fase       | Actividad                         | Tiempo Estimado | Dificultad |
| ---------- | --------------------------------- | --------------- | ---------- |
| **FASE 1** | Setup Turso CLI + crear DB        | 15 min          | Fácil      |
| **FASE 2** | Cambios en código (4 archivos)    | 30 min          | Media      |
| **FASE 3** | Testing local con Turso           | 15 min          | Fácil      |
| **FASE 4** | Configurar Vercel                 | 10 min          | Fácil      |
| **FASE 5** | Deploy (commit + push)            | 5 min           | Fácil      |
| **FASE 6** | Post-deploy (seed + verificación) | 10 min          | Media      |
| **TOTAL**  |                                   | **1.5 horas**   | Media      |

---

## Próximos Pasos Después de Deploy

### Completar Fase 6 del Roadmap

Según `roadmap_imple.md`, faltan:

1. **GitHub Action para scraping automático** (Fase 6, componente 3)
   - Crear `.github/workflows/scrape.yml`
   - Cron diario (2 AM UTC)
   - Usar `ADMIN_API_KEY` de GitHub Secrets

2. **Logging estructurado** (Fase 6, componente 3)
   - Implementar Pino
   - Redacción de secretos
   - Endpoint `/api/scraper/status`

3. **Tests E2E** (Fase 7)
   - Setup Playwright
   - Tests de flujos críticos

---

## Limpieza Post-Implementación

### Archivos Temporales a Eliminar

```bash
# 1. Este documento
rm VERCEL_MIGRATION.md

# 2. Archivo de credenciales temporal (si existe)
rm turso-credentials.txt

# 3. Referencia en CLAUDE.md
# Editar manualmente y eliminar sección de referencia
```

### Commit de Limpieza

```bash
git add CLAUDE.md
git commit -m "docs: remove temporary Vercel migration reference"
git push
```

---

## Referencias

- **Turso Docs**: https://docs.turso.tech/
- **Prisma libSQL Adapter**: https://www.prisma.io/docs/orm/overview/databases/turso
- **Vercel Environment Variables**: https://vercel.com/docs/projects/environment-variables
- **ADR-003** (en `docs/ARCHITECTURE.md`): Decisión de SQLite → PostgreSQL

---

**Última actualización**: 12 Diciembre 2025
**Versión**: 1.0
**Estado**: Documento temporal - eliminar post-implementación
