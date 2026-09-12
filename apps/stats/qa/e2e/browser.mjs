// Shared Playwright bootstrap for the end-to-end testers. Chromium is preinstalled; the module
// lives outside the project's node_modules, hence the absolute import.
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
export const { chromium } = pw;
export const BASE = 'http://localhost:3010';

/** A page at a given width and colour scheme; the same context keeps localStorage between navigations. */
export async function open({ width = 1000, height = 1400, dark = true } = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  return { browser, context, page, errors, close: () => browser.close() };
}

/** Body text minus the site chrome, for quick assertions. */
export async function text(page) {
  return (await page.locator('body').innerText()).replace(/\s+\n/g, '\n').trim();
}
