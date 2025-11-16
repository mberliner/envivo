/**
 * Script para analizar la página de detalles de Movistar Arena
 */

import puppeteer from 'puppeteer';

async function debugMovistarArenaDetail() {
  console.log('🔍 Debugging Movistar Arena detail page\n');

  let browser;
  try {
    // Lanzar navegador
    console.log('1️⃣ Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    console.log('✅ Browser launched\n');

    // Primero obtener un link de ejemplo desde la página principal
    console.log('2️⃣ Getting sample event link from listing page...');
    await page.goto('https://www.movistararena.com.ar/shows', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForSelector('.evento', { timeout: 30000 });

    const sampleLink = await page.$eval('.evento .box-img a', (el) =>
      el.getAttribute('href')
    );
    console.log(`✅ Sample event link: ${sampleLink}\n`);

    // Navegar a la página de detalles
    const detailUrl = `https://www.movistararena.com.ar${sampleLink}`;
    console.log(`3️⃣ Navigating to detail page: ${detailUrl}`);
    await page.goto(detailUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    console.log('✅ Detail page loaded\n');

    // Esperar un poco para que Blazor cargue todo
    await page.waitForTimeout(3000);

    // Obtener HTML
    const html = await page.content();
    console.log(`4️⃣ HTML length: ${html.length} bytes\n`);

    // Analizar estructura
    console.log('5️⃣ Analyzing page structure:\n');

    // Título
    const title = await page.$eval('h1, .event-title, .show-title', (el) =>
      el.textContent?.trim()
    ).catch(() => 'Not found');
    console.log(`   Title: ${title}`);

    // Fecha y hora
    const dateInfo = await page.$$eval('[class*="date"], [class*="fecha"], time, .event-date', (elements) =>
      elements.map((el) => ({
        class: el.className,
        text: el.textContent?.trim(),
      }))
    ).catch(() => []);
    console.log(`\n   Date/Time elements found: ${dateInfo.length}`);
    dateInfo.slice(0, 5).forEach((info, i) => {
      console.log(`      ${i + 1}. class="${info.class}" → "${info.text}"`);
    });

    // Precio
    const priceInfo = await page.$$eval('[class*="price"], [class*="precio"], .ticket-price, .buy-button', (elements) =>
      elements.map((el) => ({
        class: el.className,
        text: el.textContent?.trim(),
      }))
    ).catch(() => []);
    console.log(`\n   Price elements found: ${priceInfo.length}`);
    priceInfo.slice(0, 5).forEach((info, i) => {
      console.log(`      ${i + 1}. class="${info.class}" → "${info.text}"`);
    });

    // Descripción
    const descInfo = await page.$$eval('[class*="description"], [class*="descripcion"], .event-description, p', (elements) =>
      elements.map((el) => ({
        class: el.className,
        text: el.textContent?.trim()?.substring(0, 100),
      }))
    ).catch(() => []);
    console.log(`\n   Description elements found: ${descInfo.length}`);
    descInfo.slice(0, 5).forEach((info, i) => {
      console.log(`      ${i + 1}. class="${info.class}" → "${info.text}..."`);
    });

    // Imagen
    const imageInfo = await page.$$eval('img[src*="event"], img[src*="show"], .event-image img', (elements) =>
      elements.map((el) => ({
        alt: el.getAttribute('alt'),
        src: el.getAttribute('src'),
      }))
    ).catch(() => []);
    console.log(`\n   Image elements found: ${imageInfo.length}`);
    imageInfo.slice(0, 3).forEach((info, i) => {
      console.log(`      ${i + 1}. alt="${info.alt}" → ${info.src?.substring(0, 60)}...`);
    });

    // Información de venue
    const venueInfo = await page.$$eval('[class*="venue"], [class*="lugar"], .location', (elements) =>
      elements.map((el) => ({
        class: el.className,
        text: el.textContent?.trim(),
      }))
    ).catch(() => []);
    console.log(`\n   Venue elements found: ${venueInfo.length}`);
    venueInfo.slice(0, 3).forEach((info, i) => {
      console.log(`      ${i + 1}. class="${info.class}" → "${info.text}"`);
    });

    // Extraer todas las clases únicas en la página
    const uniqueClasses = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const classes = new Set<string>();
      elements.forEach((el) => {
        el.className.split(' ').forEach((cls) => {
          if (cls && !cls.startsWith('_') && cls.length > 2) {
            classes.add(cls);
          }
        });
      });
      return Array.from(classes).sort();
    });

    console.log(`\n6️⃣ All unique CSS classes (${uniqueClasses.length}):`);
    console.log('   ' + uniqueClasses.slice(0, 50).join(', '));
    if (uniqueClasses.length > 50) {
      console.log(`   ... and ${uniqueClasses.length - 50} more`);
    }

    console.log('\n✅ Analysis complete!');
    console.log('💡 Use this information to update movistararena.config.ts detail selectors\n');
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

debugMovistarArenaDetail();
