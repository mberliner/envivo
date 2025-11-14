# 🔧 Solución: Regenerar Prisma Client

## Problema

Error: `Cannot read properties of undefined (reading 'deleteMany')`

**Causa:** El Prisma client no tiene el modelo `eventBlacklist` porque no se ha regenerado después de los cambios en el código.

## Solución (Ejecutar en tu ambiente local)

```bash
# 1. Regenerar Prisma client
npm run db:generate

# Deberías ver:
# ✔ Generated Prisma Client (x.x.x) to ./node_modules/@prisma/client in XXms

# 2. Verificar que se generó correctamente
# Deberías poder hacer import de:
# - prisma.event
# - prisma.eventBlacklist
# - prisma.globalPreferences

# 3. Ejecutar tests nuevamente
npm run test:e2e

# 4. Si sigue fallando, limpiar y regenerar todo
npm run db:push       # Actualiza schema en BD
npm run db:generate   # Regenera client
npm run test:e2e      # Probar de nuevo
```

## Verificación

Después de regenerar, este código debería funcionar:

```typescript
await prisma.eventBlacklist.deleteMany({
  where: {
    AND: [
      { source: 'E2E-TEST' },
      { externalId: { in: testExternalIds } },
    ],
  },
});
```

## Si aún falla

1. Verificar que el schema tiene el modelo:
   ```bash
   grep "model EventBlacklist" prisma/schema.prisma
   ```

2. Borrar node_modules y reinstalar:
   ```bash
   rm -rf node_modules
   npm install
   npm run db:generate
   ```

3. Verificar que .env.local tiene las variables:
   ```bash
   cat .env.local | grep -E "(DATABASE_URL|ADMIN_API_KEY)"
   ```
