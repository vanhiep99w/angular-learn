import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 120_000,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', reducedMotion: 'reduce' },
  webServer: { command: 'node scripts/serve-export.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
});
