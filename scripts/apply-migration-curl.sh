#!/bin/bash

# Apply EventBlacklist migration via API endpoint
# Requires: Server running (npm run dev)

ADMIN_KEY=$(grep ADMIN_API_KEY .env.local | cut -d '=' -f2)

if [ -z "$ADMIN_KEY" ]; then
  echo "❌ Error: ADMIN_API_KEY not found in .env.local"
  exit 1
fi

echo "🔧 Applying EventBlacklist migration..."
echo ""

curl -X POST http://localhost:3000/api/admin/migrate-blacklist \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -s | jq .

echo ""
echo "✅ Done! Now restart the dev server for changes to take effect."
