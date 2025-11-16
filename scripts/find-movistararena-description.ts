/**
 * Script para encontrar dónde está la descripción real del evento
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function findDescription() {
  console.log('🔍 Finding event description in Movistar Arena page\n');

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
    console.log('🔎 STRATEGY 1: Find all <p> tags with substantial content\n');

    const paragraphs = $('main p');
    console.log(`Found ${paragraphs.length} <p> tags in main\n`);

    paragraphs.each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const classes = $el.attr('class') || '(no class)';

      // Solo mostrar párrafos con contenido sustancial (más de 50 chars)
      if (text.length > 50) {
        console.log(`[${i}] <p class="${classes}">`);
        console.log(`    Length: ${text.length} chars`);
        console.log(`    Content: "${text.substring(0, 150)}${text.length > 150 ? '...' : ''}"`);
        console.log(`    ─────────────────────────────────────\n`);
      }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 STRATEGY 2: Find all div/section with substantial text\n');

    const divs = $('main div, main section, main article');
    const candidates: Array<{selector: string, text: string, length: number}> = [];

    divs.each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const classes = $el.attr('class') || '';
      const id = $el.attr('id') || '';

      // Solo elementos con texto sustancial y no demasiado largo (no es todo el main)
      if (text.length > 100 && text.length < 2000) {
        const selector = id ? `#${id}` : classes ? `.${classes.split(' ')[0]}` : el.tagName;
        candidates.push({ selector, text, length: text.length });
      }
    });

    // Ordenar por longitud (los más cortos probablemente sean más específicos)
    candidates.sort((a, b) => a.length - b.length);

    console.log(`Found ${candidates.length} potential description containers\n`);

    candidates.slice(0, 10).forEach((candidate, i) => {
      console.log(`[${i}] ${candidate.selector}`);
      console.log(`    Length: ${candidate.length} chars`);
      console.log(`    Content: "${candidate.text.substring(0, 150)}${candidate.text.length > 150 ? '...' : ''}"`);
      console.log(`    ─────────────────────────────────────\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 STRATEGY 3: Look for semantic HTML attributes\n');

    const semanticSelectors = [
      '[itemprop="description"]',
      '[itemtype*="Event"]',
      'meta[property="og:description"]',
      'meta[name="description"]',
    ];

    for (const selector of semanticSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const content = element.attr('content') || element.text().trim();
        console.log(`${selector}: ${element.length} found`);
        console.log(`  Content: "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"`);
        console.log('');
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 STRATEGY 4: Check evento-row structure\n');

    const eventoRows = $('.evento-row');
    console.log(`Found ${eventoRows.length} .evento-row elements\n`);

    eventoRows.slice(0, 5).each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      console.log(`[${i}] .evento-row`);
      console.log(`    Length: ${text.length} chars`);
      console.log(`    Content: "${text.substring(0, 150)}${text.length > 150 ? '...' : ''}"`);
      console.log(`    HTML: ${$el.html()?.substring(0, 200)}...`);
      console.log(`    ─────────────────────────────────────\n`);
    });

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

findDescription();
