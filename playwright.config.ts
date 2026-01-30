import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './test/e2e',
    timeout: 60000,
    expect: {
        timeout: 10000
    },
    fullyParallel: false, // Electron tests should run sequentially
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker for Electron
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        actionTimeout: 10000,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure'
    }
});
