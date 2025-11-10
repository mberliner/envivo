/**
 * Script de debugging para LivePass scraper
 * Muestra exactamente qué datos se extraen y por qué fallan
 */

import { GenericWebScraper } from '@/features/events/data/sources/web/GenericWebScraper';
import { livepassConfig } from '@/config/scrapers/livepass.config';
import { EventBusinessRules, DEFAULT_BUSINESS_RULES } from '@/features/events/domain/services/EventBusinessRules';
import { PreferencesService } from '@/features/events/domain/services/PreferencesService';
import { PrismaPreferencesRepository } from '@/features/events/data/repositories/PrismaPreferencesRepository';
import { prisma } from '@/shared/infrastructure/database/prisma';
import type { RawEvent, Event } from '@/features/events/domain/entities/Event';

async function debugLivepass() {
  console.log('🔍 Debugging LivePass scraper...\n');

  // 1. Crear scraper
  console.log('1️⃣ Creating scraper with config:');
  console.log('   defaultValues:', livepassConfig.defaultValues);
  console.log('   selectors.country:', livepassConfig.selectors.country);
  console.log('   selectors.city:', livepassConfig.selectors.city);
  console.log('   selectors.venue:', livepassConfig.selectors.venue);
  console.log('');

  const scraper = new GenericWebScraper(livepassConfig);

  // 2. Scrapear eventos
  console.log('2️⃣ Fetching events from LivePass...');
  let rawEvents: RawEvent[] = [];

  try {
    rawEvents = await scraper.fetch({ maxPages: 1 });
    console.log(`   ✅ Extracted ${rawEvents.length} events\n`);
  } catch (error) {
    console.error('   ❌ Scraping failed:', error);
    return;
  }

  if (rawEvents.length === 0) {
    console.log('❌ No events found!');
    return;
  }

  // 3. Mostrar primeros 3 eventos (raw)
  console.log('3️⃣ First 3 raw events:\n');
  rawEvents.slice(0, 3).forEach((event, i) => {
    console.log(`Event ${i + 1}:`);
    console.log(`   title: ${event.title}`);
    console.log(`   date: ${event.date}`);
    console.log(`   venue: ${event.venue}`);
    console.log(`   city: ${event.city}`);
    console.log(`   country: ${event.country}`);
    console.log(`   category: ${event.category}`);
    console.log('');
  });

  // 4. Convertir a Event y validar
  console.log('4️⃣ Validating events with BusinessRules...\n');

  const preferencesRepository = new PrismaPreferencesRepository(prisma);
  const preferencesService = new PreferencesService(preferencesRepository);
  const businessRules = new EventBusinessRules(DEFAULT_BUSINESS_RULES, preferencesService);

  // Convertir RawEvent a Event (simulando lo que hace EventService)
  const convertRawToEvent = (rawEvent: RawEvent): Event => {
    const date = typeof rawEvent.date === 'string' ? new Date(rawEvent.date) : rawEvent.date;

    return {
      id: rawEvent.externalId || `temp-${Date.now()}`,
      title: rawEvent.title,
      description: rawEvent.description,
      date: date,
      endDate: undefined,
      venueName: rawEvent.venue,
      city: rawEvent.city || '', // ⚠️ Aquí puede estar el problema
      country: rawEvent.country || '', // ⚠️ Aquí puede estar el problema
      category: (rawEvent.category as Event['category']) || 'Otro',
      genre: rawEvent.genre,
      artists: rawEvent.artists,
      imageUrl: rawEvent.imageUrl,
      ticketUrl: rawEvent.ticketUrl,
      price: rawEvent.price,
      priceMax: rawEvent.priceMax,
      currency: rawEvent.currency || 'ARS',
      venueCapacity: rawEvent.venueCapacity,
      source: 'livepass',
      externalId: rawEvent.externalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  let validCount = 0;
  let invalidCount = 0;

  for (const rawEvent of rawEvents.slice(0, 5)) { // Solo primeros 5 para no saturar
    const event = convertRawToEvent(rawEvent);
    const validation = await businessRules.isAcceptable(event);

    if (validation.valid) {
      validCount++;
    } else {
      invalidCount++;
      console.log(`❌ Event rejected: "${event.title}"`);
      console.log(`   Reason: ${validation.reason}`);
      console.log(`   Field: ${validation.field}`);
      console.log(`   city: "${event.city}" (empty: ${event.city === ''})`);
      console.log(`   country: "${event.country}" (empty: ${event.country === ''})`);
      console.log('');
    }
  }

  console.log(`\n📊 Summary (first 5 events):`);
  console.log(`   Valid: ${validCount}`);
  console.log(`   Invalid: ${invalidCount}`);

  await prisma.$disconnect();
}

debugLivepass().catch(console.error);
