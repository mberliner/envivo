/**
 * Script de Debug para LivePass - Inspecciona página de detalles
 *
 * Uso: npx tsx scripts/debug-livepass-detail.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugLivepassDetail() {
  console.log('🔍 Debug LivePass - Inspección de página de detalles\n');

  try {
    // 1. Primero obtener un link del listado
    console.log('1️⃣ Obteniendo listado de eventos...');
    const listResponse = await axios.get('https://livepass.com.ar/taxons/cafe-berlin', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      timeout: 15000,
    });

    const $list = cheerio.load(listResponse.data);
    const firstEventLink = $list('.event-box').first().find('a').attr('href');

    if (!firstEventLink) {
      console.error('❌ No se encontró ningún link de evento en el listado');
      return;
    }

    const detailUrl = `https://livepass.com.ar${firstEventLink}`;
    console.log(`✅ Primer evento encontrado: ${detailUrl}\n`);

    // 2. Scrapear página de detalles
    console.log('2️⃣ Scrapeando página de detalles...');
    const detailResponse = await axios.get(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(detailResponse.data);

    console.log('📄 HTML de la página de detalles cargado\n');
    console.log('=' .repeat(80));

    // 3. Buscar diferentes selectores para FECHA/HORA
    console.log('\n🕐 FECHA Y HORA:');
    console.log('-'.repeat(80));

    const dateSelectors = [
      'time',
      'time[datetime]',
      '[itemprop="startDate"]',
      '.event-date',
      '.date',
      '.fecha',
      '.datetime',
      '.date-time',
      'h2',
      'h3',
      'p:contains("hs")',
      'span:contains(":")',
    ];

    dateSelectors.forEach(selector => {
      try {
        const element = $(selector);
        if (element.length > 0) {
          const text = element.text().trim();
          const datetime = element.attr('datetime');
          if (text || datetime) {
            console.log(`✅ "${selector}":`);
            if (datetime) console.log(`   datetime attr: ${datetime}`);
            if (text) console.log(`   text: ${text.substring(0, 100)}`);
          }
        }
      } catch (e) {
        // Ignorar errores de selectores inválidos
      }
    });

    // 4. Buscar VENUE
    console.log('\n📍 VENUE/LUGAR:');
    console.log('-'.repeat(80));

    const venueSelectors = [
      '[itemprop="location"]',
      '.venue',
      '.venue-name',
      '.location',
      '.location-name',
      '.lugar',
      'p:contains("Café")',
      'span:contains("Café")',
    ];

    venueSelectors.forEach(selector => {
      try {
        const element = $(selector);
        if (element.length > 0) {
          const text = element.text().trim();
          if (text) {
            console.log(`✅ "${selector}": ${text.substring(0, 100)}`);
          }
        }
      } catch (e) {
        // Ignorar
      }
    });

    // 5. Buscar DIRECCIÓN
    console.log('\n🗺️  DIRECCIÓN:');
    console.log('-'.repeat(80));

    const addressSelectors = [
      '[itemprop="address"]',
      '.address',
      '.direccion',
      '.venue-address',
      'p:contains("Av.")',
      'p:contains("Calle")',
    ];

    addressSelectors.forEach(selector => {
      try {
        const element = $(selector);
        if (element.length > 0) {
          const text = element.text().trim();
          if (text) {
            console.log(`✅ "${selector}": ${text.substring(0, 100)}`);
          }
        }
      } catch (e) {
        // Ignorar
      }
    });

    // 6. Buscar PRECIO
    console.log('\n💰 PRECIO:');
    console.log('-'.repeat(80));

    const priceSelectors = [
      '[itemprop="price"]',
      '.price',
      '.precio',
      '.ticket-price',
      'p:contains("$")',
      'span:contains("$")',
      'div:contains("$")',
    ];

    priceSelectors.forEach(selector => {
      try {
        const element = $(selector);
        if (element.length > 0) {
          const text = element.text().trim();
          if (text && text.includes('$')) {
            console.log(`✅ "${selector}": ${text.substring(0, 100)}`);
          }
        }
      } catch (e) {
        // Ignorar
      }
    });

    // 7. Buscar DESCRIPCIÓN
    console.log('\n📝 DESCRIPCIÓN:');
    console.log('-'.repeat(80));

    const descSelectors = [
      '[itemprop="description"]',
      '.description',
      '.descripcion',
      '.event-description',
      'article',
      '.content',
      '.evento-info',
    ];

    descSelectors.forEach(selector => {
      try {
        const element = $(selector);
        if (element.length > 0) {
          const text = element.text().trim();
          if (text && text.length > 20) {
            console.log(`✅ "${selector}": ${text.substring(0, 150)}...`);
          }
        }
      } catch (e) {
        // Ignorar
      }
    });

    // 8. Inspeccionar estructura general
    console.log('\n🏗️  ESTRUCTURA GENERAL (primeros 5 h1, h2, div con clase):');
    console.log('-'.repeat(80));

    $('h1, h2').slice(0, 5).each((i, el) => {
      const tag = el.tagName;
      const text = $(el).text().trim().substring(0, 80);
      const classes = $(el).attr('class') || '';
      console.log(`<${tag} class="${classes}">${text}`);
    });

    console.log('\n🔖 CLASES COMUNES (primeras 10 divs con clase):');
    $('div[class]').slice(0, 10).each((i, el) => {
      const classes = $(el).attr('class');
      const text = $(el).text().trim().substring(0, 50);
      console.log(`  .${classes}: ${text}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Debug completado\n');

  } catch (error: any) {
    console.error('❌ Error durante debug:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   StatusText: ${error.response.statusText}`);
    }
  }
}

// Ejecutar
debugLivepassDetail();
