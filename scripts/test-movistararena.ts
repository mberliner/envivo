/**
 * Test del scraper de Movistar Arena - Sin Prisma
 *
 * Script de validación para probar el scraper de Movistar Arena
 * sin necesidad de guardar en base de datos.
 *
 * Uso:
 *   ts-node scripts/test-movistararena.ts
 */

import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import {
  parseMovistarDate,
  extractBackgroundImage,
  cleanWhitespace,
  toAbsoluteUrl,
} from '../src/features/events/data/sources/web/utils/transforms';

async function testMovistarArena() {
  console.log('🎵 Testing Movistar Arena scraper\n');

  try {
    console.log('1️⃣ Fetching HTML from Movistar Arena...');
    console.log('   URL: https://www.movistararena.com.ar/shows\n');

    const response = await axios.get('https://www.movistararena.com.ar/shows', {
      headers: {
        'User-Agent': 'EnVivoBot/1.0 (+https://envivo.ar/bot)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      timeout: 15000,
    });

    console.log('   ✅ HTML fetched successfully\n');

    const $ = cheerio.load(response.data);

    // Verificar estructura usando los selectores exactos de la config
    console.log('2️⃣ Checking HTML structure with configured selectors:\n');

    const itemSelector = '.evento';
    const eventBoxes = $(itemSelector);

    console.log(`   Events found with "${itemSelector}": ${eventBoxes.length}`);

    if (eventBoxes.length === 0) {
      console.log('❌ No event boxes found!');
      console.log('   The HTML structure may be different than expected.');
      console.log('   Please inspect the page manually and update selectors.\n');
      return;
    }

    console.log('\n3️⃣ Extracting first 5 events:\n');

    eventBoxes.slice(0, 5).each((i: number, element) => {
      const $item = $(element);

      // Extraer datos usando los selectores exactos de la config
      const titleRaw = $item.find('h5').text().trim();
      const dateRaw = $item.find('.descripcion span').text().trim();
      const imageStyleRaw = $item.find('.box-img').attr('style') || '';
      const linkRaw = $item.find('.box-img a').attr('href') || '';

      // Aplicar transformaciones
      const titleClean = cleanWhitespace(titleRaw);
      const dateParsed = parseMovistarDate(dateRaw);
      const imageUrl = extractBackgroundImage(imageStyleRaw);
      const linkAbsolute = toAbsoluteUrl(linkRaw, 'https://www.movistararena.com.ar');
      const imageAbsolute = imageUrl ? toAbsoluteUrl(imageUrl, 'https://www.movistararena.com.ar') : undefined;

      // Defaults
      const venue = 'Movistar Arena';
      const city = 'Buenos Aires';
      const country = 'AR';
      const address = 'Humboldt 450, C1414CTL CABA';
      const category = 'Concierto';

      console.log(`Event ${i + 1}:`);
      console.log(`   RAW DATA:`);
      console.log(`      title: "${titleRaw}"`);
      console.log(`      date: "${dateRaw}"`);
      console.log(`      image (style): "${imageStyleRaw.substring(0, 80)}..."`);
      console.log(`      link: "${linkRaw}"`);
      console.log(`   TRANSFORMED:`);
      console.log(`      title: "${titleClean}"`);
      console.log(`      date: ${dateParsed?.toISOString() || 'N/A'}`);
      console.log(`      image: "${imageAbsolute?.substring(0, 80)}..." ${imageAbsolute ? '✅' : '❌'}`);
      console.log(`      link: "${linkAbsolute}"`);
      console.log(`   DEFAULTS APPLIED:`);
      console.log(`      venue: "${venue}"`);
      console.log(`      city: "${city}"`);
      console.log(`      country: "${country}"`);
      console.log(`      address: "${address}"`);
      console.log(`      category: "${category}"`);

      // Validation
      const isValid = titleClean && dateParsed && venue;
      console.log(`   VALID: ${isValid ? '✅' : '❌'} (required fields: title, date, venue)`);
      console.log('');
    });

    console.log(`\n✅ Total events that would be scraped: ${eventBoxes.length}`);

    // Contar eventos válidos
    let validCount = 0;
    eventBoxes.each((_: number, element) => {
      const $item = $(element);
      const titleRaw = $item.find('h5').text().trim();
      const dateRaw = $item.find('.descripcion span').text().trim();

      const titleClean = cleanWhitespace(titleRaw);
      const dateParsed = parseMovistarDate(dateRaw);

      if (titleClean && dateParsed) {
        validCount++;
      }
    });

    console.log(`✅ Valid events (with title + parseable date): ${validCount}/${eventBoxes.length}`);

    if (validCount < eventBoxes.length) {
      console.log(`⚠️  ${eventBoxes.length - validCount} events would be skipped (missing required fields)`);
    }

    // Instrucciones para siguiente paso
    console.log('\n4️⃣ Next steps:');
    console.log('   1. Review the extracted data above and verify it looks correct');
    console.log('   2. If everything looks good, test via the orchestrator:');
    console.log('      npm run dev');
    console.log('      curl -X POST http://localhost:3000/api/admin/scraper/sync \\');
    console.log('        -H "x-api-key: $ADMIN_API_KEY"');
    console.log('   3. Check the database to verify events were saved correctly');

  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to Movistar Arena');
        console.error('   Check your internet connection');
      } else if (axiosError.response) {
        console.error(
          `❌ Movistar Arena returned: ${axiosError.response.status} ${axiosError.response.statusText}`
        );

        if (axiosError.response.status === 403) {
          console.error('\n   ⚠️  403 Forbidden - Bot protection detected');
          console.error('   Possible solutions:');
          console.error('   1. The site may block automated requests');
          console.error('   2. Try adjusting User-Agent or headers');
          console.error('   3. Add delays between requests (rate limiting)');
          console.error('   4. Verify the site allows scraping (check robots.txt)');
        } else if (axiosError.response.status === 404) {
          console.error('\n   ⚠️  404 Not Found - URL may be incorrect');
          console.error('   Verify URL: https://www.movistararena.com.ar/shows');
        }
      } else if (axiosError.request) {
        console.error('❌ No response received from Movistar Arena');
        console.error(`   Error: ${axiosError.message}`);
      } else {
        console.error('❌ Error setting up request:', axiosError.message);
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error:', errorMessage);
    }
  }
}

testMovistarArena();
