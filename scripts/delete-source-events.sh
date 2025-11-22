#!/bin/bash
# Delete Events by Source
#
# Borra todos los eventos de una fuente específica (teatrovorterix, allaccess, etc.)
# ⚠️  NO pide confirmación - borra inmediatamente
#
# Usage:
#   ./scripts/delete-source-events.sh teatrovorterix
#   ./scripts/delete-source-events.sh allaccess
#   ./scripts/delete-source-events.sh movistararena
#
# Ver docs/WEB_SCRAPING.md#borrado-de-eventos para más info

set -e

SOURCE_NAME="$1"

if [ -z "$SOURCE_NAME" ]; then
  echo "❌ Error: Debes especificar el nombre de la fuente"
  echo ""
  echo "Uso:"
  echo "  ./scripts/delete-source-events.sh teatrovorterix"
  echo "  ./scripts/delete-source-events.sh allaccess"
  echo "  ./scripts/delete-source-events.sh movistararena"
  exit 1
fi

# Cargar variables de entorno
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
fi

echo "🔍 Buscando eventos de la fuente: $SOURCE_NAME"
echo ""

# Contar eventos
COUNT=$(npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.event.count({ where: { source: '$SOURCE_NAME' } })
  .then(count => { console.log(count); process.exit(0); })
  .catch(() => process.exit(1));
" || echo "0")

if [ "$COUNT" = "0" ]; then
  echo "ℹ️  No se encontraron eventos de '$SOURCE_NAME'"
  exit 0
fi

echo "📊 Se encontraron $COUNT eventos de '$SOURCE_NAME'"
echo ""

# Borrar directamente
echo "🗑️  Borrando eventos..."
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.event.deleteMany({ where: { source: '$SOURCE_NAME' } })
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
" >/dev/null

echo "✅ Eventos borrados exitosamente"
