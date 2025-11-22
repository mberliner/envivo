#!/bin/bash
# Delete Events by Venue
#
# Borra todos los eventos de un venue específico (independiente de la fuente)
# ⚠️  NO pide confirmación - borra inmediatamente
#
# Usage:
#   ./scripts/delete-venue-events.sh "Teatro Vorterix"
#   ./scripts/delete-venue-events.sh "Movistar Arena"
#   ./scripts/delete-venue-events.sh "Café Berlín"
#
# Ver docs/WEB_SCRAPING.md#borrado-de-eventos para más info

set -e

VENUE_NAME="$1"

if [ -z "$VENUE_NAME" ]; then
  echo "❌ Error: Debes especificar el nombre del venue"
  echo ""
  echo "Uso:"
  echo "  ./scripts/delete-venue-events.sh \"Teatro Vorterix\""
  echo "  ./scripts/delete-venue-events.sh \"Movistar Arena\""
  exit 1
fi

# Cargar variables de entorno
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
fi

echo "🔍 Buscando eventos de: $VENUE_NAME"
echo ""

# Contar eventos
COUNT=$(npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.event.count({ where: { venueName: '$VENUE_NAME' } })
  .then(count => { console.log(count); process.exit(0); })
  .catch(() => process.exit(1));
" || echo "0")

if [ "$COUNT" = "0" ]; then
  echo "ℹ️  No se encontraron eventos de '$VENUE_NAME'"
  exit 0
fi

echo "📊 Se encontraron $COUNT eventos de '$VENUE_NAME'"
echo ""

# Borrar directamente
echo "🗑️  Borrando eventos..."
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.event.deleteMany({ where: { venueName: '$VENUE_NAME' } })
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
" >/dev/null

echo "✅ Eventos borrados exitosamente"
