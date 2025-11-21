#!/usr/bin/env tsx
/**
 * Script de validación para Teatro Vorterix scraper
 *
 * Prueba el scraper de Teatro Vorterix sin necesidad de levantar el servidor.
 * Útil para desarrollo y debugging.
 *
 * Uso:
 *   npx tsx scripts/test-teatrovorterix.ts
 *
 * Requisitos:
 *   - tsx instalado: npm install -D tsx
 *   - Variables de entorno configuradas en .env.local
 */

import { WebScraperFactory } from '../src/features/events/data/sources/web/WebScraperFactory';

async function main() {
  console.log('🎭 Testing Teatro Vorterix scraper...\n');

  try {
    // 1. Crear scraper
    console.log('📦 Creating scraper instance...');
    const scraper = await WebScraperFactory.create('teatrovorterix');
    console.log(`✅ Scraper created: ${scraper.name}\n`);

    // 2. Ejecutar scraping
    console.log('🔍 Fetching events from Teatro Vorterix...');
    console.log('URL: https://www.allaccess.com.ar/venue/teatro-vorterix\n');

    const startTime = Date.now();
    const events = await scraper.fetch();
    const duration = Date.now() - startTime;

    // 3. Mostrar resultados
    console.log(`\n✅ Scraping completed in ${duration}ms`);
    console.log(`📊 Found ${events.length} events\n`);

    if (events.length === 0) {
      console.warn('⚠️  No events found. This might indicate:');
      console.warn('   - The venue has no upcoming events');
      console.warn('   - Selectors need adjustment');
      console.warn('   - The site structure has changed');
      console.warn('   - Rate limiting or blocking by the site\n');
      return;
    }

    // 4. Mostrar primeros eventos
    console.log('📋 Sample events (first 5):\n');
    events.slice(0, 5).forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Date: ${event.date ? event.date.toISOString() : 'N/A'}`);
      console.log(`   Venue: ${event.venue}`);
      console.log(`   City: ${event.city}, ${event.country}`);
      console.log(`   Category: ${event.category || 'N/A'}`);
      console.log(`   Price: ${event.price !== undefined ? `$${event.price}` : 'N/A'}`);
      console.log(`   Image: ${event.imageUrl ? 'Yes' : 'No'}`);
      console.log(`   URL: ${event.externalUrl || 'N/A'}`);
      console.log();
    });

    // 5. Validaciones básicas
    console.log('🔍 Validating scraped data...\n');

    const validations = {
      titlesPresent: events.every((e) => e.title && e.title.length > 0),
      datesPresent: events.every((e) => e.date !== undefined),
      venuesCorrect: events.every((e) => e.venue === 'Teatro Vorterix'),
      cityCorrect: events.every((e) => e.city === 'Buenos Aires'),
      countryCorrect: events.every((e) => e.country === 'AR'),
      categoriesPresent: events.every((e) => e.category && e.category.length > 0),
      imagesPresent: events.filter((e) => e.imageUrl).length / events.length,
      urlsPresent: events.every((e) => e.externalUrl && e.externalUrl.length > 0),
    };

    console.log('Validation Results:');
    console.log(`  ✓ All titles present: ${validations.titlesPresent ? '✅' : '❌'}`);
    console.log(`  ✓ All dates present: ${validations.datesPresent ? '✅' : '⚠️'}`);
    console.log(`  ✓ All venues correct: ${validations.venuesCorrect ? '✅' : '❌'}`);
    console.log(`  ✓ All cities correct: ${validations.cityCorrect ? '✅' : '❌'}`);
    console.log(`  ✓ All countries correct: ${validations.countryCorrect ? '✅' : '❌'}`);
    console.log(`  ✓ All categories present: ${validations.categoriesPresent ? '✅' : '⚠️'}`);
    console.log(
      `  ✓ Images present: ${(validations.imagesPresent * 100).toFixed(0)}% ${validations.imagesPresent > 0.9 ? '✅' : '⚠️'}`
    );
    console.log(`  ✓ All URLs present: ${validations.urlsPresent ? '✅' : '❌'}`);
    console.log();

    // 6. Warnings
    const warnings: string[] = [];
    if (!validations.datesPresent) {
      warnings.push('Some events have missing dates - check date parsing logic');
    }
    if (!validations.categoriesPresent) {
      warnings.push('Some events have missing categories');
    }
    if (validations.imagesPresent < 0.9) {
      warnings.push('More than 10% of events are missing images');
    }

    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach((w) => console.log(`   - ${w}`));
      console.log();
    }

    // 7. Resumen final
    if (
      validations.titlesPresent &&
      validations.venuesCorrect &&
      validations.cityCorrect &&
      validations.countryCorrect &&
      validations.urlsPresent
    ) {
      console.log('✅ Teatro Vorterix scraper is working correctly!\n');
      console.log('Next steps:');
      console.log('  1. Run the full scraping: npm run dev, then:');
      console.log('     curl -X POST http://localhost:3000/api/admin/scraper/sync \\');
      console.log('       -H "x-api-key: YOUR_API_KEY"');
      console.log('  2. Check events in UI: http://localhost:3000');
      console.log('  3. Verify deduplication is working');
    } else {
      console.log('❌ Some validations failed. Please review the scraper configuration.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during scraping:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
