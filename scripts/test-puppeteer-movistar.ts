/**
 * Script de prueba para verificar que Puppeteer funciona con Movistar Arena
 */

import puppeteer from 'puppeteer';

async function testMovistarArenaPuppeteer() {
  console.log('🚀 Testing Puppeteer with Movistar Arena\n');

  let browser;
  try {
    // Lanzar navegador
    console.log('1️⃣ Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Crear página
    const page = await browser.newPage();
    console.log('✅ Browser launched\n');

    // Navegar a Movistar Arena
    console.log('2️⃣ Navigating to https://www.movistararena.com.ar/shows');
    await page.goto('https://www.movistararena.com.ar/shows', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    console.log('✅ Page loaded\n');

    // Esperar a que los eventos se carguen
    console.log('3️⃣ Waiting for .evento selector...');
    await page.waitForSelector('.evento', { timeout: 30000 });
    console.log('✅ Selector found!\n');

    // Obtener HTML renderizado
    const html = await page.content();
    console.log(`4️⃣ HTML length after JS rendering: ${html.length} bytes`);

    // Contar eventos encontrados
    const eventCount = await page.$$eval('.evento', (elements) => elements.length);
    console.log(`✅ Found ${eventCount} events with .evento selector\n`);

    // Extraer algunos datos de muestra
    console.log('5️⃣ Sample event data:');
    const sampleEvents = await page.$$eval('.evento', (elements) => {
      return elements.slice(0, 3).map((el) => {
        const title = el.querySelector('h5')?.textContent?.trim();
        const date = el.querySelector('.descripcion span')?.textContent?.trim();
        const link = el.querySelector('.box-img a')?.getAttribute('href');
        return { title, date, link };
      });
    });

    sampleEvents.forEach((event, i) => {
      console.log(`   Event ${i + 1}:`);
      console.log(`      Title: ${event.title}`);
      console.log(`      Date: ${event.date}`);
      console.log(`      Link: ${event.link}`);
      console.log('');
    });

    console.log('✅ Puppeteer test successful!');
    console.log(
      '💡 PuppeteerWebScraper should work correctly with Movistar Arena.\n'
    );
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

testMovistarArenaPuppeteer();
