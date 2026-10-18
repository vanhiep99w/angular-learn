import { expect, test } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';

const httpPage = '/docs/http-api-auth/http-client';
const profilingPage = '/docs/testing-performance-deploy/profiling-performance';
const cliPage = '/docs/bat-dau/angular-cli';

test('every published lesson loads with its diagrams and without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const catalogRequests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('icons.d2lang.com')) catalogRequests.push(request.url()); });
  const files = (await readdir('content/docs', { recursive: true })).filter((f) => f.endsWith('.mdx'));
  let diagrams = 0;
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '').replace(/(?:^|\/)index$/, '');
    const response = await page.goto(`/docs/${slug}`);
    expect(response?.status(), file).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    const source = await readFile(`content/docs/${file}`, 'utf8');
    const count = [...source.matchAll(/^```d2\b/gm)].length;
    await expect(page.locator('figure.d2-diagram')).toHaveCount(count);
    diagrams += count;
  }
  expect(diagrams).toBe(242);
  expect(errors).toEqual([]);
  expect(catalogRequests).toEqual([]);
});

for (const theme of ['light', 'dark']) {
  for (const width of [1280, 390]) {
    test(`${theme}, ${width}px: diagrams and learning viewers stay readable`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((theme) => localStorage.setItem('theme', theme), theme);
      for (const url of [httpPage, profilingPage, cliPage, '/docs/component-template/styling-component', '/docs/cau-hoi-phong-van/code-splitting-lazy-loading-va-deferrable-views']) {
        await page.goto(url);
        const light = page.locator('.d2-diagram-light').first();
        const dark = page.locator('.d2-diagram-dark').first();
        await expect(theme === 'light' ? light : dark).toBeVisible();
        await expect(theme === 'light' ? dark : light).toBeHidden();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        for (const selector of ['.d2-diagram', '.code-walkthrough', '.code-diff', '.terminal-session', '.protocol-exchange', '.span-waterfall']) {
          for (const element of await page.locator(selector).all()) {
            const box = await element.boundingBox();
            expect(box!.width).toBeLessThanOrEqual(width);
          }
        }
      }
      await page.locator('figure.d2-diagram').first().screenshot({ path: `test-results/diagram-${theme}-${width}.png` });
      await page.screenshot({ path: `test-results/docs-${theme}-${width}.png`, fullPage: true });
    });
  }
}

test('walkthrough, diff, HTTP variants, D2 controls, terminal copy and span details work', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(httpPage);
  const walkthrough = page.locator('.code-walkthrough');
  await walkthrough.getByRole('button', { name: 'Bước sau', exact: true }).click();
  await expect(walkthrough.locator('.code-walkthrough-note')).toContainText('toTask');
  await expect(walkthrough.locator('[data-line="19"][data-highlighted]')).toBeVisible();
  await walkthrough.getByRole('button', { name: 'Sao chép code', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('export class TaskApi');
  const diff = page.locator('.code-diff');
  await diff.getByRole('button', { name: 'Inline', exact: true }).click();
  await expect(diff).toHaveAttribute('data-view', 'inline');
  await diff.getByRole('button', { name: 'Sao chép bản sau', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("let params = new HttpParams();\nparams = params.set('page', '1');");
  const invalid = page.locator('.protocol-exchange [data-variant="invalid"]');
  await invalid.locator('summary').click();
  await expect(invalid.locator('.protocol-exchange-status-code')).toHaveText('400');
  await expect(invalid.getByRole('region', { name: 'Body response — Thiếu title' })).toContainText('VALIDATION_ERROR');
  await invalid.getByRole('button', { name: 'Sao chép response — Thiếu title' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('VALIDATION_ERROR');
  await expect(page.locator('.d2-viewer')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.locator('.d2-viewer')).toBeVisible();
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto(cliPage);
  const terminal = page.locator('.terminal-session');
  await terminal.getByRole('button', { name: /Sao chép lệnh/ }).first().click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('npx --no-install ng version');
  await terminal.locator('summary').first().click();
  await expect(terminal).toContainText('Angular CLI, Angular và Node.js');
  await page.goto(profilingPage);
  const waterfall = page.locator('.span-waterfall');
  await waterfall.locator('.span-waterfall-label').filter({ hasText: 'filterProducts()' }).click();
  await expect(waterfall.getByLabel('Attributes: filterProducts()')).toBeVisible();
  await expect(waterfall.getByLabel('Attributes: filterProducts()')).toContainText('"measured": false');
});

test('without JavaScript: SVGs, all walkthrough steps, HTTP variants and timing tables survive', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:4173${httpPage}`);
  await expect(page.locator('.d2-diagram-light').first()).toBeVisible();
  await expect(page.locator('.code-walkthrough')).toContainText('Trả Observable cho consumer');
  await expect(page.locator('.code-diff')).toContainText("params = params.set");
  const invalid = page.locator('[data-variant="invalid"]');
  await invalid.locator('summary').click();
  await expect(invalid).toContainText('VALIDATION_ERROR');
  await page.goto(`http://127.0.0.1:4173${cliPage}`);
  await page.locator('.terminal-session summary').first().click();
  await expect(page.locator('.terminal-session')).toContainText('npx --no-install ng version');
  await page.goto(`http://127.0.0.1:4173${profilingPage}`);
  await page.locator('.span-waterfall-table-disclosure summary').click();
  await expect(page.locator('.span-waterfall table')).toBeVisible();
  await expect(page.locator('.span-waterfall table')).toContainText('filterProducts()');
  await context.close();
});
