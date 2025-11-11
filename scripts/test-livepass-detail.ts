/**
 * Test LivePass Detail Page Scraping
 *
 * Uso: npm run dev (en otra terminal)
 *      node --loader tsx scripts/test-livepass-detail.ts
 */

import { GenericWebScraper } from '../src/features/events/data/sources/web/GenericWebScraper';
import { livepassConfig } from '../src/config/scrapers/livepass.config';

async function testLivepassDetailScraping() {
  console.log('🔍 Testing LivePass Detail Page Scraping\n');
  console.log('Config:', JSON.stringify(livepassConfig, null, 2));

  try {
    const scraper = new GenericWebScraper(livepassConfig);

    console.log('\n📡 Fetching events from LivePass...');
    const events = await scraper.fetch({ maxPages: 1 });

    console.log(`\n✅ Fetched ${events.length} events\n`);

    // Mostrar detalles de los primeros 3 eventos
    events.slice(0, 3).forEach((event, index) => {
      console.log(`Event ${index + 1}:`);
      console.log(`  Title: ${event.title}`);
      console.log(`  Date: ${event.date}`);
      console.log(`  Venue: ${event.venue}`);
      console.log(`  Address: ${event.address || 'N/A'}`);
      console.log(`  Price: ${event.price || 'N/A'}`);
      console.log(`  Description: ${event.description ? event.description.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`  ExternalURL: ${event.externalUrl || 'N/A'}`);
      console.log('');
    });

    // Análisis de datos
    const withTime = events.filter(e => {
      const date = new Date(e.date);
      return date.getHours() !== 0 || date.getMinutes() !== 0;
    });

    const withPrice = events.filter(e => e.price !== undefined);
    const withDescription = events.filter(e => e.description);
    const withAddress = events.filter(e => e.address);

    console.log('📊 Statistics:');
    console.log(`  Total events: ${events.length}`);
    console.log(`  With time (not 00:00): ${withTime.length} (${Math.round(withTime.length / events.length * 100)}%)`);
    console.log(`  With price: ${withPrice.length} (${Math.round(withPrice.length / events.length * 100)}%)`);
    console.log(`  With description: ${withDescription.length} (${Math.round(withDescription.length / events.length * 100)}%)`);
    console.log(`  With address: ${withAddress.length} (${Math.round(withAddress.length / events.length * 100)}%)`);

    if (withTime.length === 0) {
      console.log('\n⚠️  WARNING: No events have time information!');
      console.log('   This suggests detail page scraping is not working.');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testLivepassDetailScraping();
