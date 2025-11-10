/**
 * Script de debugging para LivePass scraper
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function testLivepassScraper() {
  console.log('🔍 Fetching LivePass HTML...\n');

  try {
    const response = await axios.get('https://livepass.com.ar/taxons/cafe-berlin', {
      headers: {
        'User-Agent': 'EnVivoBot/1.0 (+https://envivo.ar/bot)',
      },
    });

    const $ = cheerio.load(response.data);
    const events = [];

    $('.event-box').each((i, element) => {
      const $item = $(element);

      const title = $item.find('h1.m-y-0').text().trim();
      const dateText = $item.find('.date-home').text().trim();
      const image = $item.find('img.img-home-count').attr('src');
      const link = $item.find('a').attr('href');

      events.push({
        title,
        dateText,
        image,
        link,
      });
    });

    console.log(`📊 Found ${events.length} events\n`);

    if (events.length > 0) {
      console.log('📋 First 3 events (raw data):\n');
      events.slice(0, 3).forEach((event, i) => {
        console.log(`Event ${i + 1}:`);
        console.log(`  Title: ${event.title}`);
        console.log(`  Date: ${event.dateText}`);
        console.log(`  Image: ${event.image}`);
        console.log(`  Link: ${event.link}`);
        console.log('');
      });
    } else {
      console.log('❌ No events found! Selectors may be wrong.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLivepassScraper();
