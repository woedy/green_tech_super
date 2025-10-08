import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for end-to-end testing of Green Tech Africa platform.
 * Includes Ghana market simulation and cross-portal testing.
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each test */
    actionTimeout: 10000,
    
    /* Simulate Ghana internet conditions */
    launchOptions: {
      slowMo: process.env.GHANA_SIMULATION ? 1000 : 0,
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports (common in Ghana) */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Ghana market simulation with slow network */
    {
      name: 'Ghana Slow Network',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--simulate-outdated-platforms'],
        },
        contextOptions: {
          // Simulate 2G network conditions common in rural Ghana
          offline: false,
          // These would be set in the test itself
        }
      },
    },

    /* Cross-portal testing */
    {
      name: 'Customer Portal',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173', // Customer frontend
      },
    },
    {
      name: 'Agent Portal',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5174', // Agent frontend
      },
    },
    {
      name: 'Admin Portal',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5175', // Admin frontend
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../green-agent-frontend && npm run dev',
      port: 5174,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../green-admin-frontend && npm run dev',
      port: 5175,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../green_tech_backend && python manage.py runserver 8000',
      port: 8000,
      reuseExistingServer: !process.env.CI,
    }
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./src/tests/global-setup.ts'),
  globalTeardown: require.resolve('./src/tests/global-teardown.ts'),

  /* Test timeout */
  timeout: 30000,
  
  /* Expect timeout */
  expect: {
    timeout: 5000,
  },
});