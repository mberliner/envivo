/**
 * Script para diagnosticar qué selectores están capturando en página de detalles
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function diagnosticDetailPage() {
  console.log('🔍 Diagnostic for Movistar Arena detail page selectors\n');

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

    // TEST 1: Descripción
    console.log('1️⃣  DESCRIPCIÓN TESTS:\n');

    console.log('   Test: div.descripcion');
    const desc1 = $('div.descripcion').text().trim();
    console.log(`   Result: "${desc1.substring(0, 100)}${desc1.length > 100 ? '...' : ''}"`);
    console.log(`   Length: ${desc1.length} chars\n`);

    console.log('   Test: .descripcion (any element)');
    const desc2 = $('.descripcion').text().trim();
    console.log(`   Result: "${desc2.substring(0, 100)}${desc2.length > 100 ? '...' : ''}"`);
    console.log(`   Length: ${desc2.length} chars\n`);

    console.log('   Counting .descripcion elements:');
    const descElements = $('.descripcion');
    console.log(`   Found ${descElements.length} elements with class="descripcion"\n`);

    descElements.each((i, el) => {
      const tag = el.tagName;
      const text = $(el).text().trim().substring(0, 60);
      console.log(`   [${i}] <${tag} class="descripcion"> → "${text}..."`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TEST 2: Hora
    console.log('2️⃣  HORA TESTS:\n');

    console.log('   Test: .hora (all)');
    const horaElements = $('.hora');
    console.log(`   Found ${horaElements.length} elements with class="hora"\n`);

    horaElements.each((i, el) => {
      const text = $(el).text().trim();
      console.log(`   [${i}] .hora → "${text}"`);
    });

    console.log('\n   Test: .hora:nth-of-type(2)');
    const hora2 = $('.hora:nth-of-type(2)').text().trim();
    console.log(`   Result: "${hora2}"\n`);

    console.log('   Test: .hora:last');
    const horaLast = $('.hora:last').text().trim();
    console.log(`   Result: "${horaLast}"\n`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TEST 3: Precio
    console.log('3️⃣  PRECIO TESTS:\n');

    console.log('   Full body text (first 500 chars):');
    const bodyText = $('body').text();
    console.log(`   "${bodyText.substring(0, 500)}..."\n`);

    console.log('   Searching for $ patterns in body text:');
    const priceMatches = bodyText.match(/\$\s*[\d.,]+/g);
    if (priceMatches) {
      console.log(`   Found ${priceMatches.length} $ patterns:\n`);
      priceMatches.slice(0, 10).forEach((match, i) => {
        console.log(`   [${i}] "${match}"`);
      });
    } else {
      console.log('   ❌ No $ patterns found!\n');
    }

    console.log('\n   Searching for "desde" keyword (common for prices):');
    const desdePattern = bodyText.match(/desde\s+\$?\s*[\d.,]+/gi);
    if (desdePattern) {
      desdePattern.slice(0, 5).forEach((match, i) => {
        console.log(`   [${i}] "${match}"`);
      });
    } else {
      console.log('   ❌ No "desde" patterns found\n');
    }

    console.log('\n   Testing main selector:');
    const mainText = $('main').text().trim();
    console.log(`   main length: ${mainText.length} chars`);
    const mainPrices = mainText.match(/\$\s*[\d.,]+/g);
    console.log(`   $ patterns in main: ${mainPrices?.length || 0}\n`);

    console.log('   All numbers in body (first 20):');
    const allNumbers = bodyText.match(/\b\d{4,}\b/g);
    if (allNumbers) {
      allNumbers.slice(0, 20).forEach((num, i) => {
        console.log(`   [${i}] ${num}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TEST 4: Verificar HTML crudo
    console.log('4️⃣  RAW HTML INSPECTION:\n');

    console.log('   Looking for div with "descripcion" class in HTML:');
    const descRegex = /<div[^>]*class="[^"]*descripcion[^"]*"[^>]*>/gi;
    const descMatches = html.match(descRegex);
    if (descMatches) {
      console.log(`   Found ${descMatches.length} div.descripcion in HTML:`);
      descMatches.slice(0, 3).forEach((match, i) => {
        console.log(`   [${i}] ${match.substring(0, 100)}...`);
      });
    } else {
      console.log('   ❌ No div.descripcion found in HTML!\n');
    }

    console.log('\n✅ Diagnostic complete!\n');

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

diagnosticDetailPage();
