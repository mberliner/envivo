/**
 * Script para inspeccionar la estructura HTML del precio
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function inspectPriceHTML() {
  console.log('🔍 Inspecting price HTML structure\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.goto('https://www.movistararena.com.ar/shows', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForSelector('.evento', { timeout: 30000 });

    const sampleLink = await page.$eval('.evento .box-img a', (el) =>
      el.getAttribute('href')
    );

    const detailUrl = `https://www.movistararena.com.ar${sampleLink}`;
    console.log(`📄 URL: ${detailUrl}\n`);

    await page.goto(detailUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const html = await page.content();
    const $ = cheerio.load(html);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 ASIDE .CARD STRUCTURE:\n');

    const aside = $('aside .card');
    console.log(`HTML:\n${aside.html()}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 TESTING ALTERNATIVE SELECTORS:\n');

    const selectors = [
      'aside .card',
      'aside .card .top',
      'aside .card .top span',
      'aside .card span:contains("$")',
      'aside .top span',
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        console.log(`Selector: "${selector}"`);
        console.log(`  Found: ${element.length} elements`);
        console.log(`  Text: "${text}"`);
        console.log('');
      } else {
        console.log(`Selector: "${selector}"`);
        console.log(`  Found: 0 elements\n`);
      }
    }

    console.log('✅ Inspection complete!\n');

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

inspectPriceHTML();
