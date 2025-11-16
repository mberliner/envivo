/**
 * Script de diagnóstico para Movistar Arena
 * - Verifica conversión de timezone Argentina → UTC
 * - Busca selector correcto para precio
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function diagnosePage(url: string) {
  console.log(`\n🔍 Analyzing: ${url}\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });

    // Esperar 5s para Blazor
    console.log('⏳ Waiting 5s for Blazor initialization...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Esperar selector
    try {
      await page.waitForSelector('.evento-titulo', { timeout: 30000 });
      console.log('✅ Blazor loaded\n');
    } catch {
      console.log('⚠️  Timeout waiting for .evento-titulo\n');
    }

    const html = await page.content();
    const $ = cheerio.load(html);

    console.log('📊 HTML size:', html.length, 'bytes');
    console.log('\n--- TIME ANALYSIS ---');

    // Hora
    const timeText = $('.horarios .hora:nth-child(2)').text().trim();
    console.log('Time selector (.horarios .hora:nth-child(2)):', timeText);

    if (timeText) {
      const match = timeText.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        console.log('  Parsed:', `${hours}:${String(minutes).padStart(2, '0')}`);
        console.log('  Argentina time (UTC-3):', `${hours}:${String(minutes).padStart(2, '0')}`);

        // Convertir a UTC
        const utcHours = (hours + 3) % 24;
        const dayOffset = hours + 3 >= 24 ? 1 : 0;
        console.log('  UTC time:', `${utcHours}:${String(minutes).padStart(2, '0')}${dayOffset ? ' (next day)' : ''}`);
      }
    }

    console.log('\n--- PRICE ANALYSIS ---');

    // Buscar patrones de precio en el HTML
    const pricePatterns = [
      /\$\s*([\d]{1,3}(?:[.,]\d{3})*(?:,\d{1,2})?)/g,
      /precio[^>]*>([^<]*\$[^<]+)</gi,
      /price[^>]*>([^<]*\$[^<]+)</gi,
    ];

    const matches = new Set<string>();

    pricePatterns.forEach(pattern => {
      const found = [...html.matchAll(pattern)];
      found.forEach(m => matches.add(m[0].substring(0, 100)));
    });

    console.log(`Found ${matches.size} potential price patterns:\n`);
    Array.from(matches).slice(0, 10).forEach((match, i) => {
      console.log(`${i + 1}. ${match}`);
    });

    // Intentar selectores específicos
    console.log('\n--- TESTING SELECTORS ---');

    const selectorsToTest = [
      '.precio',
      '.price',
      '.evento-precio',
      'span.precio',
      'div.precio',
      '.info-precio',
      '.evento-info .precio',
      'main .precio',
      '.content .precio',
    ];

    selectorsToTest.forEach(selector => {
      const text = $(selector).first().text().trim();
      if (text && text.length > 0 && text.length < 200) {
        console.log(`✅ ${selector}: "${text.substring(0, 80)}"`);
      }
    });

    // Buscar en todos los spans
    console.log('\n--- ALL SPANS WITH $ ---');
    $('span').each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes('$') && text.length < 50) {
        const className = $(el).attr('class') || '(no class)';
        console.log(`span.${className}: "${text}"`);
      }
    });

    console.log('\n--- PRICE CONTAINER STRUCTURE ---');
    // Encontrar el span con el precio y mostrar su jerarquía
    $('span').each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes('$') && text.length < 50) {
        const $el = $(el);
        console.log('\nFound price span:', text);

        // Mostrar padres
        console.log('Parent chain:');
        let $parent = $el.parent();
        let depth = 0;
        while ($parent.length > 0 && depth < 5) {
          const tagName = $parent.get(0)?.tagName?.toLowerCase() || 'unknown';
          const className = $parent.attr('class') || '(no class)';
          const id = $parent.attr('id') || '(no id)';
          console.log(`  ${depth + 1}. <${tagName}> class="${className}" id="${id}"`);
          $parent = $parent.parent();
          depth++;
        }
      }
    });

  } finally {
    await page.close();
    await browser.close();
  }
}

// Test con evento específico
const testUrl = 'https://www.movistararena.com.ar/show/59efb1a5-e06e-4dfa-8af6-50770bc80d90';
diagnosePage(testUrl).catch(console.error);
