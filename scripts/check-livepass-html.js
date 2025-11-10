#!/usr/bin/env node

const https = require('https');
const { load } = require('cheerio');

const url = 'https://livepass.com.ar/taxons/cafe-berlin';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let html = '';
  res.on('data', (chunk) => { html += chunk; });
  res.on('end', () => {
    const $ = load(html);

    console.log('Buscando información de precios en el listado de LivePass:\n');

    // Buscar el primer evento
    const firstEvent = $('.event-box').first();
    if (firstEvent.length > 0) {
      console.log('HTML del primer evento:');
      console.log(firstEvent.html());
      console.log('\n---\n');

      // Buscar cualquier mención de "precio", "$", "ARS", etc.
      const text = firstEvent.text();
      const hasPriceIndicator = /precio|gratis|\$|ars|usd/i.test(text);

      console.log('Texto del evento:', text.substring(0, 200));
      console.log('¿Contiene indicadores de precio?', hasPriceIndicator);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
