/**
 * Script para verificar el selector exacto de la descripción del evento
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function verifySelector() {
  console.log('🔍 Verifying exact selector for event description\n');

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
    console.log('🔎 FINDING PARENT CONTAINERS OF DESCRIPTION PARAGRAPHS\n');

    // Buscar los <p> sin clase que contienen texto sustancial
    const descParagraphs = $('main p:not([class])').filter((i, el) => {
      const text = $(el).text().trim();
      // Filtrar: más de 50 chars y no contiene info de transporte/estacionamiento
      return text.length > 50 &&
             !text.includes('Colectivos') &&
             !text.includes('estacionamiento') &&
             !text.includes('registres de nuevo');
    });

    console.log(`Found ${descParagraphs.length} description paragraphs\n`);

    // Analizar el primer párrafo de descripción para encontrar su contenedor
    if (descParagraphs.length > 0) {
      const firstParagraph = descParagraphs.first();
      const text = firstParagraph.text().trim();

      console.log(`First description paragraph:`);
      console.log(`  Text: "${text}"`);
      console.log(`  Length: ${text.length} chars\n`);

      // Encontrar el contenedor padre
      let parent = firstParagraph.parent();
      console.log(`Analyzing parent containers:\n`);

      for (let i = 0; i < 5; i++) {
        const tag = parent.prop('tagName')?.toLowerCase();
        const classes = parent.attr('class') || '(no class)';
        const id = parent.attr('id') || '';
        const childrenCount = parent.children().length;

        console.log(`  Level ${i}: <${tag}${id ? ` id="${id}"` : ''}${classes !== '(no class)' ? ` class="${classes}"` : ''}>`);
        console.log(`    Children count: ${childrenCount}`);

        if (parent.is('main') || parent.is('body')) {
          break;
        }

        parent = parent.parent();
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 TESTING CANDIDATE SELECTORS\n');

    const selectors = [
      'main p:not([class])',
      'main > div > p:not([class])',
      'main > div:first-of-type p:not([class])',
      '.mud-container p:not([class])',
      'main .mud-grid-item p:not([class])',
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      const filtered = elements.filter((i, el) => {
        const text = $(el).text().trim();
        return text.length > 50 &&
               !text.includes('Colectivos') &&
               !text.includes('estacionamiento') &&
               !text.includes('registres de nuevo');
      });

      const combinedText = filtered.map((i, el) => $(el).text().trim()).get().join('\n\n');

      console.log(`Selector: "${selector}"`);
      console.log(`  Matched elements: ${elements.length}`);
      console.log(`  Filtered (description only): ${filtered.length}`);
      console.log(`  Combined text length: ${combinedText.length} chars`);
      console.log(`  Preview: "${combinedText.substring(0, 200)}${combinedText.length > 200 ? '...' : ''}"`);
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 RECOMMENDED SOLUTION\n');

    // Probar obtener todo el texto del contenedor principal de la descripción
    const mainContent = $('main > div:first-of-type');
    const allParagraphs = mainContent.find('p:not([class])');
    const descriptionParagraphs = allParagraphs.filter((i, el) => {
      const text = $(el).text().trim();
      return text.length > 50 &&
             !text.includes('Colectivos') &&
             !text.includes('estacionamiento') &&
             !text.includes('registres de nuevo');
    });

    const fullDescription = descriptionParagraphs.map((i, el) => $(el).text().trim()).get().join('\n\n');

    console.log(`Full event description (${fullDescription.length} chars):\n`);
    console.log(fullDescription);
    console.log('\n');

    console.log('✅ Recommended selector: "main > div:first-of-type p:not([class])"');
    console.log('   (with filtering in transform to remove transport/parking info)\n');

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

verifySelector();
