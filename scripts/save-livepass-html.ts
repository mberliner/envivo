/**
 * Guarda el HTML de una página de LivePass para inspección
 *
 * Uso: npx tsx scripts/save-livepass-html.ts
 */

import axios from 'axios';
import { writeFileSync } from 'fs';

async function saveLivepassHtml() {
  const url = 'https://livepass.com.ar/events/franco-dezzutto-en-cafe-berlin';

  console.log(`Descargando HTML de: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      timeout: 15000,
    });

    const filename = '/home/user/envivo/livepass-detail.html';
    writeFileSync(filename, response.data, 'utf-8');

    console.log(`✅ HTML guardado en: ${filename}`);
    console.log(`\nPuedes inspeccionarlo con:`);
    console.log(`  cat livepass-detail.html | grep -i "fecha\\|hora\\|precio\\|venue\\|lugar"`);
    console.log(`  cat livepass-detail.html | grep -i "class=" | head -50`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

saveLivepassHtml();
