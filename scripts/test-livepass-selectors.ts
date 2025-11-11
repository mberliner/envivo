/**
 * Test LivePass Detail Page Selectors
 *
 * Tests the selectors configured in livepass.config.ts against a sample HTML structure
 * to verify they extract the correct data.
 */

import * as cheerio from 'cheerio';

// Sample LivePass HTML based on actual structure
const SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="description" content="Ven y disfruta de Franco Dezzutto en Café Berlín. Martes 11 NOV - 20:45 hrs">
  <meta property="og:image" content="https://livepass.com.ar/images/event.jpg">
  <meta property="og:product:price:amount" content="20160.0">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "Franco Dezzutto en Café Berlín",
    "startDate": "2025-11-11T20:45",
    "location": {
      "@type": "Place",
      "name": "Café Berlín",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Av. Alberdi 378",
        "addressLocality": "Buenos Aires",
        "addressCountry": "AR"
      }
    },
    "offers": {
      "@type": "Offer",
      "price": "20160.0",
      "priceCurrency": "ARS"
    }
  }
  </script>
</head>
<body>
  <h1>Franco Dezzutto en Café Berlín</h1>

  <div class="event-info">
    <p>Recinto: Café Berlín</p>
    <p>Dirección: Av. Alberdi 378, Buenos Aires</p>
  </div>

  <div class="description-content">
    <p>Franco Dezzutto regresa a Café Berlín con un show imperdible.</p>
    <p>No te pierdas esta oportunidad única de ver al artista en vivo.</p>
  </div>
</body>
</html>
`;

interface SelectorTest {
  name: string;
  selector: string;
  expected: string;
  extractType?: 'text' | 'attr';
}

const SELECTOR_TESTS: SelectorTest[] = [
  {
    name: 'Date from meta description',
    selector: 'meta[name="description"]',
    expected: 'Martes 11 NOV - 20:45',
    extractType: 'attr',
  },
  {
    name: 'Venue from paragraph',
    selector: 'p:contains("Recinto:")',
    expected: 'Café Berlín',
    extractType: 'text',
  },
  {
    name: 'Price from OpenGraph',
    selector: 'meta[property="og:product:price:amount"]',
    expected: '20160.0',
    extractType: 'attr',
  },
  {
    name: 'Description content',
    selector: '.description-content',
    expected: 'Franco Dezzutto',
    extractType: 'text',
  },
  {
    name: 'Title',
    selector: 'h1',
    expected: 'Franco Dezzutto',
    extractType: 'text',
  },
  {
    name: 'Image from OpenGraph',
    selector: 'meta[property="og:image"]',
    expected: 'event.jpg',
    extractType: 'attr',
  },
];

function testSelector(
  $: cheerio.CheerioAPI,
  test: SelectorTest
): { success: boolean; value: string | undefined; error?: string } {
  try {
    let value: string | undefined;

    if (test.selector.includes('@')) {
      // Attribute selector (e.g., "meta[...]@content")
      const [cssSelector, attrName] = test.selector.split('@');
      value = $(cssSelector).attr(attrName);
    } else if (test.extractType === 'attr') {
      // Attribute specified by test config
      value = $(test.selector).attr('content');
    } else {
      // Text content
      value = $(test.selector).text().trim();
    }

    const success = value ? value.includes(test.expected) : false;

    return {
      success,
      value,
      error: success ? undefined : `Expected to contain "${test.expected}", got "${value}"`,
    };
  } catch (error: any) {
    return {
      success: false,
      value: undefined,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🧪 Testing LivePass Detail Page Selectors\n');
  console.log('=' .repeat(80));

  const $ = cheerio.load(SAMPLE_HTML);

  let passedTests = 0;
  let failedTests = 0;

  for (const test of SELECTOR_TESTS) {
    const result = testSelector($, test);

    if (result.success) {
      console.log(`✅ ${test.name}`);
      console.log(`   Selector: "${test.selector}"`);
      console.log(`   Value: "${result.value}"\n`);
      passedTests++;
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   Selector: "${test.selector}"`);
      console.log(`   Error: ${result.error}\n`);
      failedTests++;
    }
  }

  console.log('=' .repeat(80));
  console.log(`\n📊 Results: ${passedTests}/${SELECTOR_TESTS.length} tests passed\n`);

  if (failedTests > 0) {
    console.log('⚠️  Some selectors may need adjustment in livepass.config.ts');
    process.exit(1);
  } else {
    console.log('✅ All selectors working correctly!');
  }

  // Bonus: Test JSON-LD extraction
  console.log('\n' + '=' .repeat(80));
  console.log('🔍 Bonus: JSON-LD Structured Data\n');

  const jsonLdScript = $('script[type="application/ld+json"]').html();
  if (jsonLdScript) {
    try {
      const jsonLd = JSON.parse(jsonLdScript);
      console.log('✅ JSON-LD found and parsed successfully!');
      console.log('\nExtracted data:');
      console.log(`   Event name: ${jsonLd.name}`);
      console.log(`   Start date: ${jsonLd.startDate}`);
      console.log(`   Venue: ${jsonLd.location?.name}`);
      console.log(`   Address: ${jsonLd.location?.address?.streetAddress}`);
      console.log(`   Price: ${jsonLd.offers?.price} ${jsonLd.offers?.priceCurrency}`);
      console.log('\n💡 Note: JSON-LD provides more reliable data than CSS selectors.');
      console.log('   Consider adding JSON-LD parsing support in the future.');
    } catch (error: any) {
      console.log('❌ Failed to parse JSON-LD:', error.message);
    }
  } else {
    console.log('❌ No JSON-LD script found');
  }
}

main().catch(console.error);
