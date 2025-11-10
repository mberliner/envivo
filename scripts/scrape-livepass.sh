#!/bin/bash
#
# Script para ejecutar el scraping de LivePass (Café Berlín)
# Uso: ./scripts/scrape-livepass.sh
#

set -e

# Cargar variables de entorno
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ Error: No se encontró archivo .env o .env.local"
  exit 1
fi

# Verificar que el servidor esté corriendo
echo "🔍 Verificando servidor en http://localhost:3000..."
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Error: El servidor no está corriendo en http://localhost:3000"
  echo "   Ejecuta 'npm run dev' en otra terminal primero"
  exit 1
fi

echo "✅ Servidor detectado"
echo ""
echo "🚀 Iniciando scraping de LivePass (Café Berlín)..."
echo ""

# Ejecutar scraping
curl -X POST http://localhost:3000/api/admin/scrape \
  -H "Authorization: Bearer ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.' || cat

echo ""
echo "✅ Scraping completado!"
