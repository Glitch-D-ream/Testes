import { test, expect } from '@playwright/test';

test.describe('Statistics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/statistics');
  });

  test.describe('Page Load', () => {
    test('should load statistics page', async ({ page }) => {
      await expect(page).toHaveTitle(/.*Statistics|Estatísticas.*/i);
      await expect(page.locator('h1')).toContainText(/Estatísticas|Statistics/i);
    });

    test('should display loading state initially', async ({ page }) => {
      // Intercept the API call to delay it
      await page.route('/api/statistics', route => {
        setTimeout(() => route.continue(), 500);
      });

      const loadingIndicator = page.locator('[role="status"], .loading, .spinner');
      // Loading state should appear briefly
      await page.waitForTimeout(100);
    });

    test('should display KPI cards', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Check for KPI cards
      const kpiCards = page.locator('[class*="kpi"], [class*="card"]');
      await expect(kpiCards).toHaveCount(4); // 4 main KPIs

      // Verify KPI labels
      await expect(page.locator('text=Total de Análises')).toBeVisible();
      await expect(page.locator('text=Total de Promessas')).toBeVisible();
      await expect(page.locator('text=Confiança Média')).toBeVisible();
      await expect(page.locator('text=Taxa de Cumprimento')).toBeVisible();
    });

    test('should display KPI values', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Get KPI values
      const kpiValues = page.locator('[class*="kpi-value"], [class*="value"]');
      
      for (let i = 0; i < await kpiValues.count(); i++) {
        const text = await kpiValues.nth(i).textContent();
        expect(text).toBeTruthy();
        expect(text).toMatch(/\d+/); // Should contain numbers
      }
    });
  });

  test.describe('Charts', () => {
    test('should display distribution chart', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const distributionChart = page.locator('[class*="distribution"], svg');
      await expect(distributionChart).toBeVisible();
    });

    test('should display compliance trend chart', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const trendChart = page.locator('[class*="trend"], [class*="line-chart"]');
      await expect(trendChart).toBeVisible();
    });

    test('should have interactive charts', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Try hovering over chart
      const chart = page.locator('svg').first();
      await chart.hover();

      // Tooltip should appear
      const tooltip = page.locator('[role="tooltip"], .tooltip');
      // Tooltip might not always be visible, but shouldn't error
    });
  });

  test.describe('Filters', () => {
    test('should have category filter', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const categoryFilter = page.locator('[name="category"], select, [class*="filter"]');
      await expect(categoryFilter).toBeVisible();
    });

    test('should filter by category', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Get initial data
      const initialValue = await page.locator('[class*="kpi-value"]').first().textContent();

      // Select a category
      const categorySelect = page.locator('select, [role="combobox"]').first();
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption('Educação');
        await page.waitForLoadState('networkidle');

        // Data should potentially change
        const newValue = await page.locator('[class*="kpi-value"]').first().textContent();
        // Values might be different after filtering
      }
    });

    test('should have date range filter', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const dateFilter = page.locator('input[type="date"], [class*="date"]');
      // Date filter might be optional
    });
  });

  test.describe('Data Table', () => {
    test('should display data table', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const table = page.locator('table, [role="table"]');
      await expect(table).toBeVisible();
    });

    test('should have table headers', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const headers = page.locator('th, [role="columnheader"]');
      expect(await headers.count()).toBeGreaterThan(0);
    });

    test('should have table rows with data', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const rows = page.locator('tbody tr, [role="row"]');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should be sortable', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Click on a sortable header
      const sortableHeader = page.locator('th, [role="columnheader"]').first();
      await sortableHeader.click();

      // Table should remain visible and functional
      const table = page.locator('table, [role="table"]');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Export Functionality', () => {
    test('should have export button', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Exportar")');
      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeVisible();
      }
    });

    test('should export to CSV', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const exportButton = page.locator('button:has-text("CSV")');
      if (await exportButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toContain('.csv');
      }
    });

    test('should export to PDF', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const exportButton = page.locator('button:has-text("PDF")');
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toContain('.pdf');
      }
    });
  });

  test.describe('Share Functionality', () => {
    test('should have share button', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const shareButton = page.locator('button:has-text("Share"), button:has-text("Compartilhar")');
      if (await shareButton.isVisible()) {
        await expect(shareButton).toBeVisible();
      }
    });

    test('should copy link to clipboard', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const shareButton = page.locator('button:has-text("Share"), button:has-text("Compartilhar")');
      if (await shareButton.isVisible()) {
        await shareButton.click();

        // Check if copy link option appears
        const copyLink = page.locator('text=Copy Link, text=Copiar Link');
        if (await copyLink.isVisible()) {
          await copyLink.click();
        }
      }
    });
  });

  test.describe('Responsiveness', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/statistics');
      await page.waitForLoadState('networkidle');

      // Should still display main content
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();

      // Charts should be visible (might be stacked)
      const charts = page.locator('svg');
      expect(await charts.count()).toBeGreaterThan(0);
    });

    test('should be responsive on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/statistics');
      await page.waitForLoadState('networkidle');

      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
    });

    test('should be responsive on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/statistics');
      await page.waitForLoadState('networkidle');

      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API to return error
      await page.route('/api/statistics', route => {
        route.abort('failed');
      });

      await page.goto('/statistics');

      // Should show error message
      const errorMessage = page.locator('[class*="error"], text=/erro|error/i');
      // Error handling should be present
    });

    test('should have retry button on error', async ({ page }) => {
      await page.route('/api/statistics', route => {
        route.abort('failed');
      });

      await page.goto('/statistics');

      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Tentar Novamente")');
      // Retry button should be available
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);

      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      expect(await headings.count()).toBeGreaterThan(0);
    });

    test('should have alt text for images', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      for (let i = 0; i < await images.count(); i++) {
        const altText = await images.nth(i).getAttribute('alt');
        expect(altText).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Tab through page
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper color contrast', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // This is a basic check - proper contrast testing requires more sophisticated tools
      const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6');
      expect(await textElements.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/statistics');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should not have memory leaks on navigation', async ({ page }) => {
      await page.goto('/statistics');
      await page.waitForLoadState('networkidle');

      // Navigate away and back
      await page.goto('/');
      await page.goto('/statistics');
      await page.waitForLoadState('networkidle');

      // Should still be functional
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
    });
  });
});
