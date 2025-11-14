# 🎉 Resumen: Migración a BD E2E Separada

## ✅ Implementación Completada

Se ha implementado exitosamente una **base de datos completamente separada** para tests E2E.

### 📦 Commits Realizados

1. **`0a1df67`** - feat: implementar base de datos separada para tests E2E
2. **`0bc6efc`** - fix: modificar PrismaClient principal para usar DATABASE_URL_E2E
3. **`0a0b073`** - docs: aclarar que DATABASE_URL_E2E NO debe estar en .env.local

---

## 🔧 Setup en Tu Ambiente Local

### Paso 1: Pull de los cambios

```bash
git pull origin claude/separate-e2e-database-01Dy7cAqqhEqqJSo3Wcq1KBc
```

### Paso 2: Verificar .env.local

Tu `.env.local` debe tener:

```bash
# Database
DATABASE_URL="file:./dev.db"

# E2E Testing Database
# ⚠️ NO descomentar - Playwright la pasa automáticamente
# DATABASE_URL_E2E="file:./e2e.db"

# Admin API key (requerida)
ADMIN_API_KEY="tu-api-key-de-32-caracteres"
```

**CRÍTICO:** `DATABASE_URL_E2E` debe estar comentada.

### Paso 3: Generar Prisma Client

```bash
npx prisma generate
```

### Paso 4: Crear ambas BDs

```bash
# BD de desarrollo
DATABASE_URL="file:./dev.db" npx prisma db push

# BD E2E
DATABASE_URL="file:./e2e.db" npx prisma db push
```

### Paso 5: Verificar archivos

```bash
ls -lah *.db
```

Deberías ver:
```
dev.db      # Para desarrollo
e2e.db      # Para tests E2E
```

---

## 🧪 Probar la Implementación

### Test 1: Desarrollo Normal

```bash
npm run dev
```

**Resultado esperado:**
- ✅ Servidor arranca en `http://localhost:3000`
- ✅ NO debe mostrar `[Prisma] Using E2E database`
- ✅ Usa `dev.db`

### Test 2: Tests E2E

```bash
npm run test:e2e
```

**Resultado esperado:**
```
[WebServer] [Prisma] Using E2E database: file:./e2e.db
[TEST FIXTURES] ✅ Seeded 10 test events
...
✓ 12 passed
```

- ✅ Muestra `[Prisma] Using E2E database: file:./e2e.db`
- ✅ Tests crean datos en `e2e.db`
- ✅ Tests NO tocan `dev.db`

---

## 🎯 Cómo Funciona

### Desarrollo Normal (`npm run dev`)

```
Usuario ejecuta: npm run dev
    ↓
Next.js lee .env.local
    ↓
DATABASE_URL="file:./dev.db"
DATABASE_URL_E2E NO está seteada
    ↓
prisma.ts usa DATABASE_URL
    ↓
✅ Aplicación usa dev.db
```

### Tests E2E (`npm run test:e2e`)

```
Usuario ejecuta: npm run test:e2e
    ↓
Playwright lee playwright.config.ts
    ↓
Playwright inyecta:
  env: {
    DATABASE_URL_E2E: 'file:./e2e.db'
  }
    ↓
Playwright ejecuta: npm run dev (con DATABASE_URL_E2E)
    ↓
prisma.ts detecta DATABASE_URL_E2E
    ↓
✅ Aplicación usa e2e.db
```

---

## 🔍 Archivos Modificados

### Código Principal

```
✅ src/shared/infrastructure/database/prisma.ts
   - Detecta DATABASE_URL_E2E y la usa si existe
   - Fallback a DATABASE_URL para desarrollo normal

✅ src/app/api/test/helpers/e2e-db.ts (nuevo)
   - Helper getE2EPrismaClient() para endpoints de test

✅ src/app/api/test/seed/route.ts
   - Usa getE2EPrismaClient()

✅ src/app/api/test/cleanup/route.ts
   - Usa getE2EPrismaClient()
```

### Configuración

```
✅ .env.example
   - Documentada DATABASE_URL_E2E con advertencia

✅ playwright.config.ts
   - Pasa DATABASE_URL_E2E al servidor dev

✅ playwright.config.prod.ts
   - Pasa DATABASE_URL_E2E al servidor prod

✅ package.json
   - Scripts db:e2e:init y db:e2e:studio
```

### Documentación

```
✅ docs/E2E_DATABASE_SETUP.md
   - Guía completa de setup y troubleshooting

✅ e2e/README.md
   - Actualizada con instrucciones de BD E2E
```

### Scripts

```
✅ scripts/init-e2e-db.ts
   - Script de verificación de BD E2E

✅ scripts/create-dbs.ts
   - Helper para crear archivos de BD vacíos
```

---

## 🚨 Problemas Comunes

### "npm run dev muestra [Prisma] Using E2E database"

**Causa:** `DATABASE_URL_E2E` está en `.env.local`

**Solución:**
```bash
# Editar .env.local y comentar la línea:
# DATABASE_URL_E2E="file:./e2e.db"
```

### "Tests E2E no encuentran eventos"

**Causa:** La BD E2E no tiene el esquema

**Solución:**
```bash
DATABASE_URL="file:./e2e.db" npx prisma db push
```

### "Error: @prisma/client did not initialize"

**Causa:** Prisma Client no generado

**Solución:**
```bash
npx prisma generate
```

---

## 📊 Beneficios de la Implementación

✅ **Aislamiento Total**
- Tests E2E no contaminan datos de desarrollo
- Puedes borrar `e2e.db` sin afectar desarrollo

✅ **Paralelización Segura**
- Tests pueden ejecutarse en paralelo sin conflictos
- Cada test suite puede tener su propio prefix

✅ **Desarrollo Limpio**
- `npm run dev` funciona exactamente igual que antes
- No hay cambios en el workflow de desarrollo

✅ **CI/CD Ready**
- Fácil de integrar en pipelines de CI
- Playwright maneja todo automáticamente

✅ **Mismo Esquema**
- BD E2E tiene exactamente el mismo esquema que desarrollo
- Garantía de consistencia

---

## 🔄 Resetear BD E2E

Si la BD E2E se corrompe o quieres empezar de cero:

```bash
# Opción 1: Eliminar y recrear
rm e2e.db e2e.db-journal
DATABASE_URL="file:./e2e.db" npx prisma db push

# Opción 2: Limpiar datos de test
curl -X DELETE http://localhost:3000/api/test/cleanup \
  -H "x-api-key: $ADMIN_API_KEY"
```

---

## 📚 Referencias

- [docs/E2E_DATABASE_SETUP.md](./E2E_DATABASE_SETUP.md) - Guía completa
- [e2e/README.md](../e2e/README.md) - Test fixtures
- [playwright.config.ts](../playwright.config.ts) - Configuración Playwright

---

## ✅ Checklist Post-Pull

- [ ] `git pull` completado
- [ ] `.env.local` verificado (DATABASE_URL_E2E comentada)
- [ ] `npx prisma generate` ejecutado
- [ ] `dev.db` creada con esquema
- [ ] `e2e.db` creada con esquema
- [ ] `npm run dev` funciona (sin mensajes de E2E)
- [ ] `npm run test:e2e` funciona (con mensajes de E2E)

---

**Última actualización:** Noviembre 2025
**Branch:** `claude/separate-e2e-database-01Dy7cAqqhEqqJSo3Wcq1KBc`
