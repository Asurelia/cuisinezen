import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'Homepage', url: '/' },
  { name: 'Login', url: '/login' },
  { name: 'Inventory', url: '/inventory' },
  { name: 'Recipes', url: '/recipes' },
  { name: 'Menu', url: '/menu' },
  { name: 'Shopping List', url: '/shopping-list' },
  { name: 'Analytics', url: '/analytics' },
  { name: 'Account', url: '/account' },
];

test.describe('Accessibility Gates', () => {
  pages.forEach(({ name, url }) => {
    test(`${name} should be accessible`, async ({ page }) => {
      // Navigate to page
      await page.goto(url);
      
      // Wait for page to be ready
      await page.waitForLoadState('networkidle');
      
      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('#cookies-banner') // Exclude cookie banner if present
        .analyze();

      // Assert no accessibility violations
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test(`${name} should have proper heading structure`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Check for h1 element
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
      expect(h1Count).toBeLessThanOrEqual(1); // Only one h1 per page

      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      expect(headings.length).toBeGreaterThan(0);
    });

    test(`${name} should have proper color contrast`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const contrastResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze();

      expect(contrastResults.violations).toEqual([]);
    });

    test(`${name} should support keyboard navigation`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Test tab navigation
      const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
      
      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.locator(':focus').first();
        expect(await focusedElement.isVisible()).toBe(true);
      }
    });

    test(`${name} should have proper alt text for images`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const images = await page.locator('img').all();
      
      for (const img of images) {
        const altText = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const ariaLabelledBy = await img.getAttribute('aria-labelledby');
        const role = await img.getAttribute('role');
        
        // Images should have alt text, aria-label, aria-labelledby, or be decorative
        const hasAccessibleName = altText !== null || ariaLabel !== null || ariaLabelledBy !== null;
        const isDecorative = role === 'presentation' || role === 'none' || altText === '';
        
        expect(hasAccessibleName || isDecorative).toBe(true);
      }
    });

    test(`${name} should have proper form labels`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const formControls = await page.locator('input:not([type="hidden"]), select, textarea').all();
      
      for (const control of formControls) {
        const id = await control.getAttribute('id');
        const ariaLabel = await control.getAttribute('aria-label');
        const ariaLabelledBy = await control.getAttribute('aria-labelledby');
        
        // Check if there's a label associated
        let hasLabel = false;
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          hasLabel = label > 0;
        }
        
        const hasAccessibleName = hasLabel || ariaLabel !== null || ariaLabelledBy !== null;
        expect(hasAccessibleName).toBe(true);
      }
    });

    test(`${name} should have proper ARIA roles and properties`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const ariaResults = await new AxeBuilder({ page })
        .withTags(['best-practice'])
        .analyze();

      expect(ariaResults.violations).toEqual([]);
    });

    test(`${name} should be responsive and accessible on mobile`, async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Run accessibility scan on mobile viewport
      const mobileAccessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(mobileAccessibilityResults.violations).toEqual([]);

      // Check touch targets are large enough (44x44px minimum)
      const touchTargets = await page.locator('button, a, input[type="button"], input[type="submit"]').all();
      
      for (const target of touchTargets) {
        if (await target.isVisible()) {
          const box = await target.boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });

  test('Should have valid HTML structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for valid HTML structure
    const htmlResults = await new AxeBuilder({ page })
      .withTags(['structure'])
      .analyze();

    expect(htmlResults.violations).toEqual([]);
  });

  test('Should have proper focus management', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test focus indicators
    const focusResults = await new AxeBuilder({ page })
      .withTags(['keyboard'])
      .analyze();

    expect(focusResults.violations).toEqual([]);
  });

  test('Should support screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test screen reader compatibility
    const screenReaderResults = await new AxeBuilder({ page })
      .withTags(['screen-reader'])
      .analyze();

    expect(screenReaderResults.violations).toEqual([]);
  });
});