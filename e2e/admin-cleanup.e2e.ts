import { test, expect } from '@playwright/test';
import { teardownTestData, seedTestData } from './helpers/testFixtures';

test.describe.serial('Admin - Cleanup Past Events', () => {
  const PAST_PREFIX = 'CLEANUP-PAST';
  const FUTURE_PREFIX = 'CLEANUP-FUTURE';

  // Helper to get API key (matches one in helpers/testFixtures.ts)
  const getApiKey = () => process.env.ADMIN_API_KEY || 'LpQRWqhYkPyfKxBT9j0gZDmAXNFdeJrM';

  test.beforeAll(async () => {
    // Clean everything first
    await teardownTestData(PAST_PREFIX);
    await teardownTestData(FUTURE_PREFIX);

    // Seed past events (past=true)
    await seedTestData(3, PAST_PREFIX, true);

    // Seed future events (past=false)
    await seedTestData(3, FUTURE_PREFIX, false);
  });

  test.afterAll(async () => {
    await teardownTestData(PAST_PREFIX);
    await teardownTestData(FUTURE_PREFIX);
  });

  test('should delete past events and keep future events', async ({ request, page }) => {
    // 1. Call cleanup endpoint
    const response = await request.post('/api/admin/events/cleanup', {
      headers: {
        'x-api-key': getApiKey(),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should have deleted at least the 3 past events we created
    expect(data.success).toBe(true);
    expect(data.deletedCount).toBeGreaterThanOrEqual(3);

    // 2. Verify future events still exist in the UI
    await page.goto('/');

    // Check that at least one future event is visible
    // Note: This relies on the home page showing future events (which it should)
    // We search for the prefix
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    const futureEvents = page.locator(`[data-testid="event-card"]:has-text("[${FUTURE_PREFIX}]")`);

    // There might be pagination, but first page should have them since they are near future (tomorrow)
    await expect(futureEvents.first()).toBeVisible();

    // Verify count (should be 3)
    const count = await futureEvents.count();
    expect(count).toBe(3);
  });
});
