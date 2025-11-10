/**
 * Test simple del scraper LivePass - Sin Prisma
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseLivepassDate, cleanLivepassTitle } from '../src/features/events/data/sources/web/utils/transforms';

async function testLivepassSimple() {
  console.log('🔍 Testing LivePass scraper (simple version)\n');

  try {
    console.log('1️⃣ Fetching HTML from LivePass...');
    const response = await axios.get('https://livepass.com.ar/taxons/cafe-berlin', {
      headers: {
        'User-Agent': 'EnVivoBot/1.0 (+https://envivo.ar/bot)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      timeout: 15000,
    });

    console.log('   ✅ HTML fetched successfully\n');

    const $ = cheerio.load(response.data);

    // Verificar estructura
    console.log('2️⃣ Checking HTML structure:');
    const container = $('.row.grid');
    const eventBoxes = $('.event-box');

    console.log(`   Container (.row.grid): ${container.length} found`);
    console.log(`   Event boxes (.event-box): ${eventBoxes.length} found\n`);

    if (eventBoxes.length === 0) {
      console.log('❌ No event boxes found! HTML structure may have changed.');
      return;
    }

    console.log('3️⃣ Extracting first 3 events:\n');

    eventBoxes.slice(0, 3).each((i, element) => {
      const $item = $(element);

      // Raw extraction
      const titleRaw = $item.find('h1.m-y-0').text().trim();
      const dateRaw = $item.find('.date-home').text().trim();
      const imageRaw = $item.find('img.img-home-count').attr('src');
      const linkRaw = $item.find('a').attr('href');

      // Transformations
      const titleClean = cleanLivepassTitle(titleRaw);
      const dateParsed = parseLivepassDate(dateRaw);

      // Defaults
      const venue = 'Café Berlín'; // hardcoded
      const city = 'Buenos Aires'; // hardcoded
      const country = 'AR'; // hardcoded

      console.log(`Event ${i + 1}:`);
      console.log(`   RAW DATA:`);
      console.log(`      title: "${titleRaw}"`);
      console.log(`      date: "${dateRaw}"`);
      console.log(`      image: "${imageRaw}"`);
      console.log(`      link: "${linkRaw}"`);
      console.log(`   TRANSFORMED:`);
      console.log(`      title: "${titleClean}"`);
      console.log(`      date: ${dateParsed?.toISOString()}`);
      console.log(`   DEFAULTS APPLIED:`);
      console.log(`      venue: "${venue}"`);
      console.log(`      city: "${city}"`);
      console.log(`      country: "${country}"`);
      console.log('');
    });

    console.log(`\n✅ Total events that would be scraped: ${eventBoxes.length}`);

  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to LivePass');
    } else if (error.response) {
      console.error(`❌ LivePass returned: ${error.response.status} ${error.response.statusText}`);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testLivepassSimple();
