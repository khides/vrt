import { test, expect } from '@playwright/test';

// Story IDs for VRT testing
const stories = [
  // Button variants
  { id: 'ui-button--primary', name: 'Button Primary' },
  { id: 'ui-button--secondary', name: 'Button Secondary' },
  { id: 'ui-button--snapshot', name: 'Button Snapshot' },
  // Hero variants
  { id: 'layout-hero--snapshot-light', name: 'Hero Light' },
  { id: 'layout-hero--snapshot-dark', name: 'Hero Dark' },
  // Navigation
  { id: 'layout-navigation--snapshot', name: 'Navigation' },
];

for (const story of stories) {
  test(`VRT: ${story.name}`, async ({ page }) => {
    // Navigate to the story iframe
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);

    // Wait for any animations to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Extra wait for Framer Motion animations

    // Take screenshot and compare
    await expect(page).toHaveScreenshot(`${story.id}.png`);
  });
}

// Test responsive behavior for Hero
test.describe('Responsive VRT', () => {
  test('Hero responds to viewport changes', async ({ page }) => {
    await page.goto('/iframe.html?id=layout-hero--default&viewMode=story');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('hero-responsive.png');
  });
});
