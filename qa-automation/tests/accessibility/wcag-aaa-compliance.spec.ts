import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AAA Compliance Test Suite
 * Tests complets pour WCAG 2.1 niveau AAA avec métriques détaillées
 */

const pages = [
  { name: 'Homepage', url: '/', priority: 'critical' },
  { name: 'Login', url: '/login', priority: 'critical' },
  { name: 'Inventory', url: '/inventory', priority: 'high' },
  { name: 'Recipes', url: '/recipes', priority: 'high' },
  { name: 'Menu', url: '/menu', priority: 'medium' },
  { name: 'Shopping List', url: '/shopping-list', priority: 'medium' },
  { name: 'Analytics', url: '/analytics', priority: 'medium' },
  { name: 'Account', url: '/account', priority: 'high' },
];

const WCAG_AAA_THRESHOLDS = {
  colorContrast: {
    normal: 7.0, // AAA level
    large: 4.5,  // AAA level for large text
  },
  timing: {
    maxLoadTime: 3000, // 3 seconds max
    maxInteractionTime: 500, // 500ms max for interactions
  },
  cognitive: {
    maxTabStops: 15, // Maximum tab stops before reaching main content
    maxNestingLevel: 6, // Maximum DOM nesting level
  }
};

test.describe('WCAG 2.1 AAA Compliance Suite', () => {
  pages.forEach(({ name, url, priority }) => {
    test.describe(`${name} - Priority: ${priority}`, () => {
      
      test(`WCAG 2.1 AAA - Full Accessibility Scan`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Scan complet WCAG 2.1 AAA
        const accessibilityResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag21aaa'])
          .options({
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag21aaa']
            }
          })
          .analyze();

        // Vérification des violations critiques
        const criticalViolations = accessibilityResults.violations.filter(
          violation => violation.impact === 'critical'
        );
        expect(criticalViolations, `Critical violations found: ${criticalViolations.map(v => v.id).join(', ')}`).toHaveLength(0);

        // Vérification des violations sérieuses  
        const seriousViolations = accessibilityResults.violations.filter(
          violation => violation.impact === 'serious'
        );
        expect(seriousViolations, `Serious violations found: ${seriousViolations.map(v => v.id).join(', ')}`).toHaveLength(0);

        // Log des violations mineures pour amélioration continue
        const minorViolations = accessibilityResults.violations.filter(
          violation => violation.impact === 'minor' || violation.impact === 'moderate'
        );
        if (minorViolations.length > 0) {
          console.warn(`Minor/Moderate violations on ${name}:`, minorViolations.map(v => v.id));
        }

        // Score d'accessibilité minimum requis (90% pour AAA)
        const totalChecks = accessibilityResults.passes.length + accessibilityResults.violations.length;
        const passedChecks = accessibilityResults.passes.length;
        const accessibilityScore = (passedChecks / totalChecks) * 100;
        
        expect(accessibilityScore).toBeGreaterThanOrEqual(90);
      });

      test(`Color Contrast AAA Level`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Test de contraste spécifique niveau AAA
        const contrastResults = await new AxeBuilder({ page })
          .withRules(['color-contrast-enhanced'])
          .analyze();

        expect(contrastResults.violations).toHaveLength(0);

        // Vérification manuelle du contraste pour les éléments critiques
        const criticalElements = [
          'button', 'a', 'input', 'select', 'textarea',
          '[role="button"]', '[role="link"]', '[role="menuitem"]'
        ];

        for (const selector of criticalElements) {
          const elements = await page.locator(selector).all();
          
          for (const element of elements) {
            if (await element.isVisible()) {
              const styles = await element.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                return {
                  color: computed.color,
                  backgroundColor: computed.backgroundColor,
                  fontSize: computed.fontSize
                };
              });

              // Vérification que les éléments ont des couleurs définies
              expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
              expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
            }
          }
        }
      });

      test(`Keyboard Navigation AAA`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Test de navigation clavier avancée
        let tabStops = 0;
        let reachedMainContent = false;
        const focusedElements: string[] = [];

        // Navigation jusqu'au contenu principal
        while (tabStops < WCAG_AAA_THRESHOLDS.cognitive.maxTabStops && !reachedMainContent) {
          await page.keyboard.press('Tab');
          tabStops++;

          const focusedElement = page.locator(':focus').first();
          if (await focusedElement.count() > 0) {
            const tagName = await focusedElement.evaluate(el => el.tagName);
            const role = await focusedElement.getAttribute('role') || '';
            const ariaLabel = await focusedElement.getAttribute('aria-label') || '';
            
            focusedElements.push(`${tagName.toLowerCase()}${role ? `[role="${role}"]` : ''}${ariaLabel ? `[aria-label="${ariaLabel}"]` : ''}`);

            // Vérification que l'élément focusé est visible
            expect(await focusedElement.isVisible()).toBe(true);

            // Vérification du focus visible
            const focusOutline = await focusedElement.evaluate((el) => {
              const computed = window.getComputedStyle(el);
              return {
                outline: computed.outline,
                outlineWidth: computed.outlineWidth,
                outlineStyle: computed.outlineStyle,
                boxShadow: computed.boxShadow
              };
            });

            const hasFocusIndicator = 
              focusOutline.outline !== 'none' ||
              focusOutline.outlineWidth !== '0px' ||
              focusOutline.boxShadow !== 'none';

            expect(hasFocusIndicator, `Element without focus indicator: ${focusedElements[focusedElements.length - 1]}`).toBe(true);

            // Check si on a atteint le contenu principal
            const isMainContent = await focusedElement.evaluate((el) => {
              return el.closest('main') !== null || 
                     el.getAttribute('role') === 'main' ||
                     el.id === 'main-content' ||
                     el.getAttribute('aria-label')?.includes('main') === true;
            });

            if (isMainContent) {
              reachedMainContent = true;
            }
          }
        }

        // Vérification que le contenu principal est accessible rapidement
        expect(tabStops, `Too many tab stops (${tabStops}) to reach main content. Focused elements: ${focusedElements.join(' → ')}`).toBeLessThanOrEqual(WCAG_AAA_THRESHOLDS.cognitive.maxTabStops);

        // Test de navigation inverse (Shift+Tab)
        for (let i = 0; i < Math.min(5, tabStops); i++) {
          await page.keyboard.press('Shift+Tab');
          const focusedElement = page.locator(':focus').first();
          if (await focusedElement.count() > 0) {
            expect(await focusedElement.isVisible()).toBe(true);
          }
        }
      });

      test(`Screen Reader Compatibility`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Test des landmarks ARIA
        const landmarks = await page.locator('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer').all();
        expect(landmarks.length, 'Page should have semantic landmarks').toBeGreaterThan(0);

        // Vérification de la structure des headings
        const headings = await page.locator('h1, h2, h3, h4, h5, h6, [role="heading"]').all();
        const headingLevels: number[] = [];

        for (const heading of headings) {
          const tagName = await heading.evaluate(el => el.tagName);
          const ariaLevel = await heading.getAttribute('aria-level');
          
          let level: number;
          if (ariaLevel) {
            level = parseInt(ariaLevel);
          } else {
            level = parseInt(tagName.charAt(1));
          }
          
          headingLevels.push(level);
        }

        // Vérification de la hiérarchie des headings
        expect(headingLevels[0], 'First heading should be h1').toBe(1);
        
        for (let i = 1; i < headingLevels.length; i++) {
          const currentLevel = headingLevels[i];
          const previousLevel = headingLevels[i - 1];
          
          // Ne pas sauter plus d'un niveau
          expect(currentLevel - previousLevel, `Heading hierarchy skip detected: h${previousLevel} → h${currentLevel}`).toBeLessThanOrEqual(1);
        }

        // Test des descriptions d'images
        const images = await page.locator('img').all();
        for (const img of images) {
          const alt = await img.getAttribute('alt');
          const ariaLabel = await img.getAttribute('aria-label');
          const ariaLabelledBy = await img.getAttribute('aria-labelledby');
          const role = await img.getAttribute('role');
          
          const isDecorative = role === 'presentation' || role === 'none' || alt === '';
          const hasDescription = alt !== null || ariaLabel !== null || ariaLabelledBy !== null;
          
          expect(hasDescription || isDecorative, 'All images must have descriptions or be marked as decorative').toBe(true);
          
          // Si l'image a un alt, il ne doit pas être vide (sauf si décorative)
          if (alt !== null && !isDecorative) {
            expect(alt.trim().length, 'Alt text should not be empty for content images').toBeGreaterThan(0);
          }
        }

        // Test des formulaires
        const formControls = await page.locator('input:not([type="hidden"]), select, textarea').all();
        for (const control of formControls) {
          const id = await control.getAttribute('id');
          const ariaLabel = await control.getAttribute('aria-label');
          const ariaLabelledBy = await control.getAttribute('aria-labelledby');
          const ariaDescribedBy = await control.getAttribute('aria-describedby');
          
          let hasLabel = false;
          if (id) {
            const labelCount = await page.locator(`label[for="${id}"]`).count();
            hasLabel = labelCount > 0;
          }
          
          const hasAccessibleName = hasLabel || ariaLabel !== null || ariaLabelledBy !== null;
          expect(hasAccessibleName, `Form control without accessible name: ${await control.getAttribute('name') || 'unnamed'}`).toBe(true);

          // Vérification des instructions et erreurs
          if (ariaDescribedBy) {
            const describedByElements = await page.locator(`#${ariaDescribedBy.split(' ').join(', #')}`).count();
            expect(describedByElements, `aria-describedby references non-existent elements: ${ariaDescribedBy}`).toBeGreaterThan(0);
          }
        }
      });

      test(`Cognitive Load Assessment`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Analyse de la complexité cognitive
        const domDepth = await page.evaluate(() => {
          function getMaxDepth(element: Element, depth = 0): number {
            let maxDepth = depth;
            for (const child of element.children) {
              maxDepth = Math.max(maxDepth, getMaxDepth(child, depth + 1));
            }
            return maxDepth;
          }
          return getMaxDepth(document.body);
        });

        expect(domDepth, `DOM too deeply nested (${domDepth} levels). Consider simplifying structure.`).toBeLessThanOrEqual(WCAG_AAA_THRESHOLDS.cognitive.maxNestingLevel);

        // Analyse des liens et boutons
        const interactiveElements = await page.locator('a, button, input[type="button"], input[type="submit"], [role="button"], [role="link"]').all();
        
        for (const element of interactiveElements) {
          const text = await element.textContent();
          const ariaLabel = await element.getAttribute('aria-label');
          const title = await element.getAttribute('title');
          
          const accessibleText = text?.trim() || ariaLabel || title || '';
          
          // Vérification que le texte est suffisamment descriptif
          expect(accessibleText.length, `Interactive element with insufficient description: "${accessibleText}"`).toBeGreaterThan(2);
          
          // Éviter les textes ambigus
          const ambiguousTexts = ['click here', 'read more', 'more', 'here', 'link'];
          const isAmbiguous = ambiguousTexts.some(ambiguous => 
            accessibleText.toLowerCase().includes(ambiguous)
          );
          
          if (isAmbiguous) {
            console.warn(`Potentially ambiguous link text: "${accessibleText}" on ${name}`);
          }
        }

        // Vérification de la lisibilité des textes
        const textElements = await page.locator('p, li, td, th, span, div').all();
        const longTexts: string[] = [];
        
        for (const element of textElements.slice(0, 20)) { // Limite pour performance
          const text = await element.textContent();
          if (text && text.trim().length > 100) {
            longTexts.push(text.trim());
          }
        }

        // Analyse basique de la complexité du texte
        for (const text of longTexts) {
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const avgSentenceLength = sentences.reduce((sum, sentence) => 
            sum + sentence.split(' ').length, 0) / sentences.length;
          
          if (avgSentenceLength > 25) {
            console.warn(`Long average sentence length (${avgSentenceLength.toFixed(1)} words) on ${name}. Consider simplifying.`);
          }
        }
      });

      test(`Motion and Animation Accessibility`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Vérification du respect de prefers-reduced-motion
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Vérification que les animations respectent prefers-reduced-motion
        const animatedElements = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const animated: { tag: string; properties: string[] }[] = [];
          
          elements.forEach(el => {
            const computed = window.getComputedStyle(el);
            const hasAnimation = computed.animationName !== 'none' && computed.animationName !== '';
            const hasTransition = computed.transitionProperty !== 'none' && computed.transitionProperty !== '';
            const hasTransform = computed.transform !== 'none' && computed.transform !== '';
            
            if (hasAnimation || hasTransition || hasTransform) {
              const properties = [];
              if (hasAnimation) properties.push('animation');
              if (hasTransition) properties.push('transition');
              if (hasTransform) properties.push('transform');
              
              animated.push({
                tag: el.tagName.toLowerCase(),
                properties
              });
            }
          });
          
          return animated;
        });

        // Log des éléments animés pour vérification manuelle
        if (animatedElements.length > 0) {
          console.log(`Animated elements found on ${name}:`, animatedElements);
        }

        // Test de déclenchement automatique
        const autoplayElements = await page.locator('video[autoplay], audio[autoplay]').count();
        expect(autoplayElements, 'No autoplay media should be present').toBe(0);
      });

      test(`Timing and Session Management`, async ({ page }) => {
        await page.goto(url);
        const startTime = Date.now();
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        // Vérification du temps de chargement
        expect(loadTime, `Page load time too slow: ${loadTime}ms`).toBeLessThan(WCAG_AAA_THRESHOLDS.timing.maxLoadTime);

        // Test des timeouts et sessions
        const hasSessionTimeout = await page.evaluate(() => {
          // Recherche d'indices de timeout de session
          const textContent = document.body.textContent || '';
          return textContent.includes('session') && (
            textContent.includes('timeout') || 
            textContent.includes('expire') || 
            textContent.includes('minutes')
          );
        });

        if (hasSessionTimeout) {
          // Vérifier qu'il y a des moyens d'étendre la session
          const extendElements = await page.locator('button, a').all();
          let hasExtendOption = false;
          
          for (const element of extendElements) {
            const text = await element.textContent();
            if (text && (text.includes('extend') || text.includes('continue') || text.includes('stay'))) {
              hasExtendOption = true;
              break;
            }
          }
          
          expect(hasExtendOption, 'Pages with session timeouts should provide extension options').toBe(true);
        }
      });

      test(`Error Prevention and Recovery`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Test des formulaires pour la prévention d'erreurs
        const forms = await page.locator('form').all();
        
        for (const form of forms) {
          // Vérification des champs requis
          const requiredFields = await form.locator('input[required], select[required], textarea[required]').all();
          
          for (const field of requiredFields) {
            const label = await field.getAttribute('aria-label') || 
                         await field.getAttribute('aria-labelledby') || 
                         await field.getAttribute('placeholder') || '';
            
            // Les champs requis doivent indiquer leur caractère obligatoire
            const indicatesRequired = 
              label.includes('*') || 
              label.includes('required') || 
              await field.getAttribute('aria-required') === 'true';
            
            expect(indicatesRequired, `Required field should indicate its required status: ${await field.getAttribute('name') || 'unnamed'}`).toBe(true);
          }

          // Vérification des validations côté client
          const emailFields = await form.locator('input[type="email"]').all();
          for (const emailField of emailFields) {
            const hasValidation = await emailField.getAttribute('pattern') !== null ||
                                 await emailField.getAttribute('aria-describedby') !== null;
            
            if (!hasValidation) {
              console.warn(`Email field without client-side validation on ${name}`);
            }
          }
        }

        // Test des messages d'erreur
        const errorElements = await page.locator('[role="alert"], .error, .invalid, [aria-invalid="true"]').all();
        
        for (const errorElement of errorElements) {
          if (await errorElement.isVisible()) {
            const errorText = await errorElement.textContent();
            expect(errorText?.trim().length, 'Error messages should be descriptive').toBeGreaterThan(5);
          }
        }
      });

    });
  });

  test('Accessibility Performance Metrics', async ({ page }) => {
    const results: Array<{
      page: string;
      violations: number;
      score: number;
      loadTime: number;
      keyboardAccessible: boolean;
    }> = [];

    for (const { name, url } of pages) {
      const startTime = Date.now();
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag21aaa'])
        .analyze();

      const totalChecks = accessibilityResults.passes.length + accessibilityResults.violations.length;
      const score = (accessibilityResults.passes.length / totalChecks) * 100;

      // Test rapide de navigation clavier
      let keyboardAccessible = true;
      try {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus').first();
        keyboardAccessible = await focusedElement.count() > 0;
      } catch {
        keyboardAccessible = false;
      }

      results.push({
        page: name,
        violations: accessibilityResults.violations.length,
        score: Math.round(score),
        loadTime,
        keyboardAccessible
      });
    }

    // Rapport de synthèse
    console.table(results);

    // Vérifications globales
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
    const keyboardPages = results.filter(r => r.keyboardAccessible).length;

    expect(avgScore, `Average accessibility score too low: ${avgScore.toFixed(1)}%`).toBeGreaterThanOrEqual(90);
    expect(avgLoadTime, `Average load time too slow: ${avgLoadTime.toFixed(0)}ms`).toBeLessThan(WCAG_AAA_THRESHOLDS.timing.maxLoadTime);
    expect(keyboardPages, `Not all pages are keyboard accessible: ${keyboardPages}/${results.length}`).toBe(results.length);

    // Export des métriques pour monitoring
    await page.evaluate((metricsData) => {
      if (typeof window !== 'undefined') {
        (window as any).accessibilityMetrics = metricsData;
      }
    }, results);
  });
});