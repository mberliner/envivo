/**
 * Script para analizar en detalle qué contiene cada elemento .descripcion
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function diagnosticDescription() {
  console.log('🔍 Detailed diagnostic for Movistar Arena description selectors\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Obtener un link de ejemplo
    await page.goto('https://www.movistararena.com.ar/shows', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForSelector('.evento', { timeout: 30000 });

    const sampleLink = await page.$eval('.evento .box-img a', (el) =>
      el.getAttribute('href')
    );

    const detailUrl = `https://www.movistararena.com.ar${sampleLink}`;
    console.log(`📄 Testing URL: ${detailUrl}\n`);

    // Navegar a detalles
    await page.goto(detailUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const html = await page.content();
    const $ = cheerio.load(html);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 ANALYZING ALL .descripcion ELEMENTS:\n');

    const descElements = $('.descripcion');
    console.log(`Found ${descElements.length} elements with class="descripcion"\n`);

    descElements.each((i, el) => {
      const $el = $(el);
      const tag = el.tagName;
      const text = $el.text().trim();
      const html = $el.html()?.trim();

      console.log(`\n[${i}] <${tag} class="descripcion">`);
      console.log(`    Text length: ${text.length} chars`);
      console.log(`    Text content:\n    "${text}"`);
      console.log(`    HTML content:\n    ${html?.substring(0, 300)}${(html?.length || 0) > 300 ? '...' : ''}`);
      console.log(`    ─────────────────────────────────────`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 TESTING ALTERNATIVE SELECTORS:\n');

    // Probar selectores alternativos
    const selectors = [
      'main .descripcion',
      'aside .descripcion',
      '.evento-row .descripcion',
      '.descripcion:first',
      '.descripcion:last',
      'p.descripcion',
      'div.descripcion',
    ];

    for (const selector of selectors) {
      const element = $(selector);
      const text = element.text().trim();
      console.log(`Selector: "${selector}"`);
      console.log(`  Found: ${element.length} elements`);
      console.log(`  Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
      console.log(`  Length: ${text.length} chars\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 SEARCHING FOR EVENT DESCRIPTION CONTAINERS:\n');

    // Buscar contenedores comunes de descripción
    const containers = [
      'main',
      'article',
      '.event-description',
      '.evento-details',
      '.evento-info',
      '#description',
      '[itemprop="description"]',
    ];

    for (const selector of containers) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        console.log(`Container: "${selector}"`);
        console.log(`  Found: ${element.length} elements`);
        console.log(`  Text preview: "${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"`);
        console.log(`  Total length: ${text.length} chars\n`);
      }
    }

    console.log('✅ Diagnostic complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

diagnosticDescription();
