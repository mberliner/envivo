/**
 * Script para probar el scraping completo de Movistar Arena
 * Incluye precio y descripción
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { extractMovistarPrice, extractMovistarTime, extractMovistarDescription } from '../src/features/events/data/sources/web/utils/transforms';

async function testFullScrape() {
  console.log('🎵 Testing Movistar Arena full scraping (price + description)\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // 1. Obtener un link de ejemplo
    console.log('1️⃣  Fetching event list...');
    await page.goto('https://www.movistararena.com.ar/shows', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForSelector('.evento', { timeout: 30000 });

    const sampleLink = await page.$eval('.evento .box-img a', (el) =>
      el.getAttribute('href')
    );

    const detailUrl = `https://www.movistararena.com.ar${sampleLink}`;
    console.log(`   ✅ Found event: ${detailUrl}\n`);

    // 2. Navegar a detalles
    console.log('2️⃣  Fetching event detail page...');
    await page.goto(detailUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const html = await page.content();
    const $ = cheerio.load(html);

    console.log('   ✅ Detail page loaded\n');

    // 3. Extraer título
    console.log('3️⃣  Extracting title...');
    const title = $('.evento-titulo').text().trim();
    console.log(`   Title: "${title}"\n`);

    // 4. Extraer precio
    console.log('4️⃣  Extracting price...');
    const priceSelector = 'aside .card .top span';
    const priceElement = $(priceSelector);
    const priceText = priceElement.text().trim();
    console.log(`   Raw text from "${priceSelector}": "${priceText}"`);

    const price = extractMovistarPrice(priceText);
    console.log(`   Extracted price: ${price ? `$${price}` : 'undefined'}`);
    console.log(`   ${price ? '✅' : '❌'} Price extraction ${price ? 'SUCCESSFUL' : 'FAILED'}\n`);

    // 5. Extraer hora
    console.log('5️⃣  Extracting time...');
    const timeSelector = '.horarios .hora:nth-child(2)';
    const timeElement = $(timeSelector);
    const timeText = timeElement.text().trim();
    console.log(`   Raw text from "${timeSelector}": "${timeText}"`);

    const time = extractMovistarTime(timeText);
    console.log(`   Extracted time: ${time || 'undefined'}`);
    console.log(`   ${time ? '✅' : '❌'} Time extraction ${time ? 'SUCCESSFUL' : 'FAILED'}\n`);

    // 6. Extraer descripción
    console.log('6️⃣  Extracting description...');
    const descSelector = '.box-descipcion p:not([class])';
    const descElements = $(descSelector);
    console.log(`   Found ${descElements.length} paragraph elements`);

    const rawDescParagraphs = descElements.map((i, el) => $(el).text().trim()).get();
    const rawDescription = rawDescParagraphs.join('\n\n');
    console.log(`   Raw description (${rawDescription.length} chars):\n   "${rawDescription.substring(0, 300)}..."\n`);

    const cleanDescription = extractMovistarDescription(rawDescription);
    console.log(`   Clean description (${cleanDescription.length} chars):\n   "${cleanDescription.substring(0, 300)}..."\n`);
    console.log(`   ${cleanDescription.length > 0 ? '✅' : '❌'} Description extraction ${cleanDescription.length > 0 ? 'SUCCESSFUL' : 'FAILED'}\n`);

    // 7. Resumen
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:\n');
    console.log(`   Title: ${title ? '✅' : '❌'}`);
    console.log(`   Price: ${price ? '✅' : '❌'} ${price ? `($${price})` : ''}`);
    console.log(`   Time:  ${time ? '✅' : '❌'} ${time ? `(${time})` : ''}`);
    console.log(`   Description: ${cleanDescription.length > 0 ? '✅' : '❌'} (${cleanDescription.length} chars)`);
    console.log('');

    const allSuccess = title && price && time && cleanDescription.length > 0;
    if (allSuccess) {
      console.log('✅ ALL EXTRACTIONS SUCCESSFUL!\n');
    } else {
      console.log('❌ SOME EXTRACTIONS FAILED\n');
      process.exit(1);
    }

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

testFullScrape();
