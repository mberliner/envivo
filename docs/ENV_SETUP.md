# Variables de Entorno - Guía Completa

> **Convención del proyecto**: Usar SOLO `.env.local` para desarrollo local

---

## 📋 Archivos de Configuración

### ✅ Archivos que DEBEN existir

| Archivo | Propósito | Git | Prioridad Next.js |
|---------|-----------|-----|-------------------|
| **`.env.example`** | Template con variables de ejemplo | ✅ Commiteado | - |
| **`.env.local`** | Valores reales para desarrollo local | ❌ Gitignored | **Alta** |

### ❌ Archivos que NO usamos

| Archivo | Por qué NO |
|---------|------------|
| `.env` | Puede causar confusión entre dev y production. Usamos solo `.env.local` |
| `.env.development` | Redundante con `.env.local` |
| `.env.production` | Las variables de producción se configuran en Vercel dashboard |

---

## 🚀 Setup Inicial (Primera Vez)

### 1. Copiar template

```bash
cp .env.example .env.local
```

### 2. Editar `.env.local` con valores reales

```bash
# .env.local
DATABASE_URL="file:./dev.db"

# API Keys (obtener en https://developer.ticketmaster.com/)
TICKETMASTER_API_KEY="tu-api-key-real-aqui"
EVENTBRITE_API_KEY=""  # Opcional

# Admin Key (generar una clave segura)
ADMIN_API_KEY="clave-segura-de-32-caracteres-minimo"

# Environment
NODE_ENV="development"

# Public Variables (expuestas al cliente)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="EnVivo"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""  # Opcional
```

### 3. Generar ADMIN_API_KEY seguro

**Opción A - OpenSSL (Linux/Mac)**:
```bash
openssl rand -base64 32
```

**Opción B - Node.js (cualquier OS)**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Opción C - PowerShell (Windows)**:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copiar el resultado y pegarlo en `.env.local`:
```bash
ADMIN_API_KEY="el-valor-generado-aqui"
```

---

## 🔐 Seguridad y Buenas Prácticas

### ✅ HACER

- ✅ Usar `.env.local` para desarrollo local
- ✅ Agregar `.env.local` a `.gitignore` (ya está)
- ✅ Usar `NEXT_PUBLIC_*` SOLO para variables que DEBEN ser públicas
- ✅ Validar env vars con Zod en `src/shared/infrastructure/config/env.ts`
- ✅ Mantener `.env.example` actualizado con TODAS las variables necesarias

### ❌ NUNCA

- ❌ Commitear `.env.local` a Git
- ❌ Usar `NEXT_PUBLIC_*` para secretos o API keys
- ❌ Hardcodear valores en código
- ❌ Compartir `.env.local` por email/Slack
- ❌ Usar `.env` base (para evitar confusión)

---

## 📦 Variables por Categoría

### Variables de Base de Datos

```bash
DATABASE_URL="file:./dev.db"  # SQLite local
# DATABASE_URL="postgresql://..." # PostgreSQL en producción
```

### API Keys Privadas (NUNCA `NEXT_PUBLIC_*`)

```bash
TICKETMASTER_API_KEY="tu-key-aqui"
EVENTBRITE_API_KEY="tu-key-aqui"  # Opcional
ADMIN_API_KEY="clave-de-32-caracteres-minimo"
```

### Variables Públicas (Expuestas al Cliente)

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="EnVivo"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""  # Solo si es necesario en el frontend
```

> ⚠️ **Importante**: Todo lo que empiece con `NEXT_PUBLIC_` será accesible desde el navegador del usuario. NUNCA uses este prefijo para secretos.

---

## 🔧 Cómo usa Next.js las variables

### Server Side (API Routes, Server Components)

```typescript
// Acceso a TODAS las variables
const apiKey = process.env.TICKETMASTER_API_KEY; // ✅ Funciona
const appUrl = process.env.NEXT_PUBLIC_APP_URL;   // ✅ Funciona
```

### Client Side (Componentes React en navegador)

```typescript
// SOLO acceso a variables NEXT_PUBLIC_*
const apiKey = process.env.TICKETMASTER_API_KEY; // ❌ undefined
const appUrl = process.env.NEXT_PUBLIC_APP_URL;   // ✅ Funciona
```

### Scripts Node.js (fuera de Next.js)

```javascript
// Necesitan cargar dotenv explícitamente
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.ADMIN_API_KEY; // ✅ Funciona
```

---

## 🎯 Prioridad de Carga (Next.js)

Next.js carga archivos en este orden (último tiene prioridad):

1. `.env` (si existe - no lo usamos)
2. `.env.local` ⭐ **Nuestro archivo principal**
3. `.env.development` / `.env.production` (según NODE_ENV - no los usamos)
4. `.env.development.local` / `.env.production.local` (no los usamos)

**En nuestro proyecto**: Solo usamos `.env.local` → Simple y claro.

---

## 🚀 Producción (Vercel)

### NO usar archivos `.env` en producción

En Vercel, configurar variables en el dashboard:

1. Ir a **Project Settings** → **Environment Variables**
2. Agregar variables una por una:
   - `DATABASE_URL` → URL de PostgreSQL (Vercel Postgres o externa)
   - `TICKETMASTER_API_KEY` → Tu API key real
   - `ADMIN_API_KEY` → Clave segura (diferente a dev)
   - `NEXT_PUBLIC_APP_URL` → `https://tu-dominio.vercel.app`

3. Especificar el **Environment**: Production, Preview, Development

> 💡 **Tip**: Usa diferentes API keys para desarrollo y producción

---

## 🔍 Verificación

### Verificar que `.env.local` está en `.gitignore`

```bash
cat .gitignore | grep "\.env"
```

Debe mostrar:
```
.env*
!.env.example
```

### Verificar que las variables se cargan correctamente

```bash
# En Next.js dev server
npm run dev
# Abrir http://localhost:3000/api/health (si existe)

# En scripts Node.js
node scripts/test-env.js
```

### Ver qué variables están definidas

```bash
# Mostrar variables (ocultar valores por seguridad)
cat .env.local | grep -v "^#" | grep -v "^$" | sed 's/=.*/=***/'
```

Output esperado:
```
DATABASE_URL=***
TICKETMASTER_API_KEY=***
ADMIN_API_KEY=***
NEXT_PUBLIC_APP_URL=***
```

---

## ❓ FAQ

### ¿Por qué no usar `.env` base?

Puede causar confusión entre desarrollo y producción. Es más simple tener:
- `.env.local` → desarrollo
- Vercel dashboard → producción

### ¿Puedo tener múltiples archivos `.env.local.*`?

Técnicamente sí, pero lo evitamos por simplicidad. Un solo `.env.local` es suficiente.

### ¿Qué pasa si accidentalmente committeo `.env.local`?

1. **Inmediatamente** rotar TODAS las API keys (generar nuevas)
2. Eliminar el archivo del historial de Git:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push (⚠️ cuidado en equipos):
   ```bash
   git push origin --force --all
   ```

### ¿Cómo comparto configuración con el equipo?

- ❌ NUNCA compartir `.env.local`
- ✅ Documentar en `.env.example`
- ✅ Compartir API keys por canal seguro (1Password, LastPass, etc.)

---

## 📚 Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [dotenv documentation](https://github.com/motdotla/dotenv)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

**Última actualización**: Noviembre 2025
