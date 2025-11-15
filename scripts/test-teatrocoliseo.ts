/**
 * Test del scraper de Teatro Coliseo - Sin Prisma
 *
 * Script de validación para probar el scraper de Teatro Coliseo
 * sin necesidad de guardar en base de datos.
 *
 * IMPORTANTE:
 * - Los selectores CSS necesitan ser validados manualmente
 * - El sitio tiene protección contra bots (403)
 * - Ajustar selectores según la estructura real del HTML
 *
 * Para validar selectores:
 * 1. Abrir https://www.teatrocoliseo.org.ar en Chrome/Firefox
 * 2. Abrir DevTools (F12)
 * 3. Ir a la consola y probar: $$('.selector-aqui')
 * 4. Actualizar los selectores en src/config/scrapers/teatrocoliseo.config.ts
 *
 * Uso:
 *   ts-node scripts/test-teatrocoliseo.ts
 */

import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import {
  parseSpanishDate,
  extractPrice,
  cleanWhitespace,
} from '../src/features/events/data/sources/web/utils/transforms';

async function testTeatroColiseo() {
  console.log('🎭 Testing Teatro Coliseo scraper (simple version)\n');

  try {
    console.log('1️⃣ Fetching HTML from Teatro Coliseo...');
    console.log('   URL: https://www.teatrocoliseo.org.ar/cartelera\n');

    const response = await axios.get('https://www.teatrocoliseo.org.ar/cartelera', {
      headers: {
        'User-Agent': 'EnVivoBot/1.0 (+https://envivo.ar/bot)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      timeout: 15000,
    });

    console.log('   ✅ HTML fetched successfully\n');

    const $ = cheerio.load(response.data);

    // Verificar estructura
    console.log('2️⃣ Checking HTML structure:');

    // Probar diferentes selectores comunes
    const containerSelectors = [
      '.cartelera',
      '.eventos',
      '.programacion',
      '.events',
      '.shows',
    ];

    const itemSelectors = [
      '.evento',
      '.event-card',
      '.show',
      '.card',
      '.item',
      'article',
    ];

    console.log('   Testing container selectors:');
    containerSelectors.forEach((selector) => {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`      ✅ ${selector}: ${count} found`);
      }
    });

    console.log('\n   Testing item selectors:');
    let eventBoxes = $('');
    let bestSelector = '';
    itemSelectors.forEach((selector) => {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`      ✅ ${selector}: ${count} found`);
        if (count > eventBoxes.length) {
          eventBoxes = $(selector);
          bestSelector = selector;
        }
      }
    });

    console.log(`\n   Best selector: ${bestSelector} (${eventBoxes.length} items)\n`);

    if (eventBoxes.length === 0) {
      console.log('❌ No event boxes found!');
      console.log('   The HTML structure may be different than expected.');
      console.log('   Please inspect the page manually and update selectors.\n');
      console.log('   To inspect manually:');
      console.log('   1. Open https://www.teatrocoliseo.org.ar in browser');
      console.log('   2. Open DevTools (F12)');
      console.log('   3. Run in console: $$(".your-selector-here")');
      console.log('   4. Update selectors in src/config/scrapers/teatrocoliseo.config.ts\n');
      return;
    }

    console.log('3️⃣ Extracting first 3 events:\n');

    eventBoxes.slice(0, 3).each((i: number, element: any) => {
      const $item = $(element);

      // Probar diferentes selectores para cada campo
      const titleSelectors = ['h2', 'h3', '.title', '.event-title', '.nombre'];
      const dateSelectors = ['.fecha', '.date', 'time', '.when'];
      const imageSelectors = ['img', '.poster img', '.imagen img'];
      const linkSelectors = ['a', '.ver-mas', '.link'];
      const priceSelectors = ['.precio', '.price', '.valor'];

      // Encontrar el primer selector que funcione para cada campo
      const title =
        titleSelectors
          .map((s) => $item.find(s).first().text().trim())
          .find((t) => t) || 'N/A';
      const dateRaw =
        dateSelectors.map((s) => $item.find(s).first().text().trim()).find((t) => t) ||
        'N/A';
      const imageRaw =
        imageSelectors.map((s) => $item.find(s).first().attr('src')).find((t) => t) ||
        'N/A';
      const linkRaw =
        linkSelectors.map((s) => $item.find(s).first().attr('href')).find((t) => t) ||
        'N/A';
      const priceRaw =
        priceSelectors.map((s) => $item.find(s).first().text().trim()).find((t) => t) ||
        'N/A';

      // Transformations
      const titleClean = cleanWhitespace(title);
      const dateParsed = dateRaw !== 'N/A' ? parseSpanishDate(dateRaw) : undefined;
      const priceExtracted =
        priceRaw !== 'N/A' ? extractPrice(priceRaw) : undefined;

      // Defaults
      const venue = 'Teatro Coliseo'; // hardcoded
      const city = 'Buenos Aires'; // hardcoded
      const country = 'AR'; // hardcoded
      const address = 'Marcelo T. de Alvear 1125, C1058 CABA'; // hardcoded
      const category = 'Teatro'; // hardcoded (puede ser Teatro, Concierto o Festival)

      console.log(`Event ${i + 1}:`);
      console.log(`   RAW DATA:`);
      console.log(`      title: "${title}"`);
      console.log(`      date: "${dateRaw}"`);
      console.log(`      image: "${imageRaw}"`);
      console.log(`      link: "${linkRaw}"`);
      console.log(`      price: "${priceRaw}"`);
      console.log(`   TRANSFORMED:`);
      console.log(`      title: "${titleClean}"`);
      console.log(`      date: ${dateParsed?.toISOString() || 'N/A'}`);
      console.log(`      price: ${priceExtracted || 'N/A'}`);
      console.log(`   DEFAULTS APPLIED:`);
      console.log(`      venue: "${venue}"`);
      console.log(`      city: "${city}"`);
      console.log(`      country: "${country}"`);
      console.log(`      address: "${address}"`);
      console.log(`      category: "${category}"`);
      console.log('');
    });

    console.log(`\n✅ Total events that would be scraped: ${eventBoxes.length}`);

    // Instrucciones para actualizar la configuración
    console.log('\n4️⃣ Next steps:');
    console.log(
      '   1. Review the extracted data above and verify it looks correct'
    );
    console.log(
      '   2. Update selectors in src/config/scrapers/teatrocoliseo.config.ts'
    );
    console.log('   3. Update transforms if date/price formats are different');
    console.log('   4. Re-run this script to verify changes');
    console.log(
      '   5. Test via API: curl -X POST http://localhost:3000/api/admin/scraper/sync \\'
    );
    console.log('      -H "x-api-key: $ADMIN_API_KEY"');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to Teatro Coliseo');
        console.error('   Check your internet connection');
      } else if (axiosError.response) {
        console.error(
          `❌ Teatro Coliseo returned: ${axiosError.response.status} ${axiosError.response.statusText}`
        );

        if (axiosError.response.status === 403) {
          console.error('\n   ⚠️  403 Forbidden - Bot protection detected');
          console.error('   Possible solutions:');
          console.error('   1. The site may block automated requests');
          console.error('   2. Try adjusting User-Agent or headers');
          console.error('   3. Add delays between requests (rate limiting)');
          console.error('   4. Verify the site allows scraping (check robots.txt)');
          console.error('   5. Contact the site to request API access');
        } else if (axiosError.response.status === 404) {
          console.error('\n   ⚠️  404 Not Found - URL may be incorrect');
          console.error('   Try these alternative URLs:');
          console.error('   - https://www.teatrocoliseo.org.ar/eventos');
          console.error('   - https://www.teatrocoliseo.org.ar/programacion');
          console.error('   - https://www.teatrocoliseo.org.ar/agenda');
          console.error(
            '\n   Update listing.url in src/config/scrapers/teatrocoliseo.config.ts'
          );
        }
      } else if (axiosError.request) {
        console.error('❌ No response received from Teatro Coliseo');
        console.error(`   Error: ${axiosError.message}`);
      } else {
        console.error('❌ Error setting up request:', axiosError.message);
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error:', errorMessage);
    }

    console.error('\n💡 Manual validation required:');
    console.error('   1. Open https://www.teatrocoliseo.org.ar in browser');
    console.error('   2. Check if the /cartelera page exists');
    console.error('   3. Inspect HTML structure with DevTools');
    console.error('   4. Update selectors accordingly');
  }
}

testTeatroColiseo();
