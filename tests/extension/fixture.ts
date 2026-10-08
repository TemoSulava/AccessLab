import { test as base, chromium, expect, type BrowserContext, type Worker, type Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
export const test = base.extend<{ context: BrowserContext; worker: Worker; activate: (page: Page) => Promise<void> }>({
  context: async ({}, use) => {
    const profile = await mkdtemp(join(tmpdir(), 'accesslab-'));
    const extension = resolve('apps/extension/.output-test/chrome-mv3');
    const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', ...(process.env.ACCESSLAB_CHROMIUM ? { executablePath: process.env.ACCESSLAB_CHROMIUM } : {}), headless: true, ignoreDefaultArgs: ['--disable-extensions'], args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
    try { await use(context); } finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
  },
  worker: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker', { timeout: 10000 });
    expect(worker.url()).toMatch(/^chrome-extension:\/\//); await use(worker);
  },
  activate: async ({ worker }, use) => {
    await use(async page => {
      const result = await worker.evaluate(async url => {
        const api = globalThis as unknown as { chrome: { tabs: { query: (filter: object) => Promise<{id:number;url:string}[]> } }; __accesslabTestActivate: (id:number) => Promise<boolean> };
        const tab = (await api.chrome.tabs.query({})).find(tab => tab.url === url);
        if (!tab) throw new Error('Fixture tab not found');
        return api.__accesslabTestActivate(tab.id);
      }, page.url());
      expect(result).toBe(true);
    });
  },
});
export { expect };
