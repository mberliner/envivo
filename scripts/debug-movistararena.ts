/**
 * Debug script para Movistar Arena
 *
 * Guarda el HTML recibido para inspección manual
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function debugMovistarArena() {
  console.log('🔍 Debugging Movistar Arena scraper\n');

  try {
    console.log('1️⃣ Fetching HTML from https://www.movistararena.com.ar/shows');

    const response = await axios.get('https://www.movistararena.com.ar/shows', {
      headers: {
        'User-Agent': 'EnVivoBot/1.0 (+https://envivo.ar/bot)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      timeout: 15000,
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    console.log(`   HTML length: ${response.data.length} bytes\n`);

    // Guardar HTML para inspección
    const htmlPath = join(process.cwd(), 'scripts', 'movistararena-debug.html');
    writeFileSync(htmlPath, response.data);
    console.log(`   ✅ HTML saved to: ${htmlPath}\n`);

    // Analizar con Cheerio
    const $ = cheerio.load(response.data);

    console.log('2️⃣ Analyzing HTML structure:\n');

    // Probar selector principal
    const eventos = $('.evento');
    console.log(`   Eventos found with '.evento': ${eventos.length}`);

    if (eventos.length === 0) {
      console.log('\n   ⚠️  No events found with .evento selector!');
      console.log('   This suggests the site loads events dynamically with JavaScript.\n');

      // Buscar indicios de JavaScript rendering
      const scripts = $('script[src]');
      console.log(`   Scripts found: ${scripts.length}`);

      scripts.slice(0, 5).each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
          console.log(`      - ${src}`);
        }
      });

      // Buscar root div de React/Vue
      const reactRoot = $('#root, #__next, #app, [data-reactroot]');
      if (reactRoot.length > 0) {
        console.log(`\n   🔴 React/Vue root div found: ${reactRoot.length}`);
        console.log('   The site uses client-side rendering.');
      }

      // Buscar divs vacíos que podrían llenarse con JS
      const emptyDivs = $('div').filter((_, el) => {
        const $el = $(el);
        return $el.text().trim().length === 0 && $el.children().length === 0;
      });
      console.log(`\n   Empty divs: ${emptyDivs.length} (potential JS injection points)`);
    } else {
      console.log('   ✅ Events found! Extracting sample...\n');

      eventos.slice(0, 3).each((i, el) => {
        const $item = $(el);
        console.log(`   Event ${i + 1}:`);
        console.log(`      title: ${$item.find('h5').text().trim()}`);
        console.log(`      date: ${$item.find('.descripcion span').text().trim()}`);
        console.log(`      image: ${$item.find('.box-img').attr('style')?.substring(0, 50)}...`);
        console.log(`      link: ${$item.find('.box-img a').attr('href')}`);
        console.log('');
      });
    }

    console.log('\n3️⃣ Recommendations:');
    if (eventos.length === 0) {
      console.log('   Option 1: Use a headless browser (Puppeteer/Playwright)');
      console.log('   Option 2: Find the API endpoint the JavaScript calls');
      console.log('   Option 3: Contact Movistar Arena for official API access\n');
      console.log('   💡 Check the HTML file to see if there\'s a JSON data blob we can parse');
    } else {
      console.log('   ✅ Static HTML scraping should work!');
      console.log('   Review the configuration in src/config/scrapers/movistararena.config.ts');
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ HTTP Error: ${error.response?.status} ${error.response?.statusText}`);
      console.error(`   URL: ${error.config?.url}`);
    } else {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

debugMovistarArena();
