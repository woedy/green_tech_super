/**
 * End-to-end tests for complete user journeys in the Green Tech Africa platform.
 * Tests the full flow from property discovery to project completion.
 */
import { test, expect, Page } from '@playwright/test';

// Test data for Ghana-specific scenarios
const GHANA_TEST_DATA = {
  regions: ['Greater Accra', 'Ashanti', 'Northern', 'Western'],
  cities: ['Accra', 'Kumasi', 'Tamale', 'Cape Coast'],
  currency: 'GHS',
  phoneFormat: '+233',
  languages: ['en', 'tw'], // English and Twi
};

// Helper functions
async function loginAsCustomer(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'customer@test.com');
  await page.fill('[data-testid="password"]', 'testpassword');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
}

async function loginAsAgent(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'agent@test.com');
  await page.fill('[data-testid="password"]', 'testpassword');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/agent/dashboard');
}

async function waitForNotification(page: Page, expectedText: string) {
  await expect(page.locator('[data-testid="notification-toast"]')).toContainText(expectedText);
}

test.describe('Complete User Journey - Property Discovery to Project Completion', () => {
  test('Customer discovers property, requests construction, receives quote, and tracks project', async ({ page, context }) => {
    // Step 1: Customer discovers properties
    await page.goto('/properties');
    
    // Test Ghana-specific filtering
    await page.click('[data-testid="region-filter"]');
    await page.click(`text=${GHANA_TEST_DATA.regions[0]}`);
    
    // Test eco-feature filtering
    await page.click('[data-testid="eco-features-filter"]');
    await page.check('[data-testid="solar-panels-filter"]');
    await page.check('[data-testid="rainwater-harvesting-filter"]');
    
    // Verify filtered results show Ghana properties
    await expect(page.locator('[data-testid="property-card"]').first()).toContainText(GHANA_TEST_DATA.regions[0]);
    await expect(page.locator('[data-testid="property-price"]').first()).toContainText(GHANA_TEST_DATA.currency);
    
    // Step 2: Customer views property details
    await page.click('[data-testid="property-card"]').first();
    await expect(page.locator('[data-testid="sustainability-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="eco-features-list"]')).toContainText('Solar Panels');
    
    // Step 3: Customer initiates construction request
    await page.click('[data-testid="request-construction-button"]');
    await expect(page).toHaveURL(/\/construction\/request/);
    
    // Fill construction request form with Ghana-specific data
    await page.fill('[data-testid="project-title"]', 'Eco-Friendly Home in Accra');
    await page.selectOption('[data-testid="region-select"]', GHANA_TEST_DATA.regions[0]);
    await page.selectOption('[data-testid="city-select"]', GHANA_TEST_DATA.cities[0]);
    
    // Step 4: Customize eco-features
    await page.click('[data-testid="next-step-button"]');
    
    // Energy features
    await page.check('[data-testid="solar-panels-checkbox"]');
    await page.check('[data-testid="battery-storage-checkbox"]');
    
    // Water features
    await page.check('[data-testid="rainwater-harvesting-checkbox"]');
    await page.check('[data-testid="greywater-recycling-checkbox"]');
    
    // Materials
    await page.check('[data-testid="eco-cement-checkbox"]');
    await page.check('[data-testid="locally-sourced-timber-checkbox"]');
    
    // Verify real-time cost calculation with Ghana pricing
    await expect(page.locator('[data-testid="estimated-cost"]')).toContainText(GHANA_TEST_DATA.currency);
    await expect(page.locator('[data-testid="sustainability-score"]')).toContainText(/\d+/);
    
    // Step 5: Submit construction request
    await page.click('[data-testid="submit-request-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Construction request submitted');
    
    // Step 6: Login as customer to track request
    await loginAsCustomer(page);
    
    // Verify request appears in dashboard
    await expect(page.locator('[data-testid="active-requests"]')).toContainText('Eco-Friendly Home in Accra');
    
    // Step 7: Simulate agent creating quote (open new tab)
    const agentPage = await context.newPage();
    await loginAsAgent(agentPage);
    
    // Agent views new request
    await agentPage.goto('/agent/leads');
    await expect(agentPage.locator('[data-testid="lead-item"]').first()).toContainText('Eco-Friendly Home in Accra');
    
    // Agent creates quote
    await agentPage.click('[data-testid="create-quote-button"]').first();
    
    // Fill quote details with Ghana-specific pricing
    await agentPage.fill('[data-testid="base-cost"]', '150000');
    await agentPage.fill('[data-testid="labor-cost"]', '50000');
    await agentPage.fill('[data-testid="materials-cost"]', '75000');
    
    // Add line items
    await agentPage.click('[data-testid="add-line-item"]');
    await agentPage.fill('[data-testid="item-description-0"]', 'Solar Panel Installation');
    await agentPage.fill('[data-testid="item-quantity-0"]', '1');
    await agentPage.fill('[data-testid="item-unit-cost-0"]', '25000');
    
    // Submit quote
    await agentPage.click('[data-testid="submit-quote-button"]');
    await expect(agentPage.locator('[data-testid="success-message"]')).toContainText('Quote created successfully');
    
    // Step 8: Customer receives notification and views quote
    await page.bringToFront();
    await waitForNotification(page, 'Your construction quote is ready');
    
    // Navigate to quotes
    await page.click('[data-testid="view-quotes-button"]');
    await expect(page.locator('[data-testid="quote-item"]').first()).toContainText('GHS 300,000');
    
    // View quote details
    await page.click('[data-testid="view-quote-button"]').first();
    await expect(page.locator('[data-testid="quote-total"]')).toContainText('GHS 300,000');
    await expect(page.locator('[data-testid="line-items"]')).toContainText('Solar Panel Installation');
    
    // Step 9: Customer accepts quote
    await page.click('[data-testid="accept-quote-button"]');
    await page.fill('[data-testid="signature-name"]', 'John Doe');
    await page.fill('[data-testid="signature-email"]', 'customer@test.com');
    await page.click('[data-testid="confirm-acceptance-button"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Quote accepted');
    
    // Step 10: Project is created and customer can track progress
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="active-projects"]')).toContainText('Eco-Friendly Home in Accra');
    
    // View project details
    await page.click('[data-testid="view-project-button"]').first();
    await expect(page.locator('[data-testid="project-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="milestone-list"]')).toContainText('Foundation');
    
    // Step 11: Agent updates project milestone
    await agentPage.bringToFront();
    await agentPage.goto('/agent/projects');
    await agentPage.click('[data-testid="project-item"]').first();
    
    // Update milestone
    await agentPage.click('[data-testid="update-milestone-button"]').first();
    await agentPage.selectOption('[data-testid="milestone-status"]', 'completed');
    await agentPage.fill('[data-testid="milestone-notes"]', 'Foundation completed successfully');
    await agentPage.click('[data-testid="save-milestone-button"]');
    
    // Step 12: Customer receives real-time notification
    await page.bringToFront();
    await waitForNotification(page, 'Project milestone completed');
    
    // Verify project progress updated
    await page.reload();
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', /[1-9]\d*/);
    
    await agentPage.close();
  });

  test('Agent manages multiple projects with real-time updates', async ({ page }) => {
    await loginAsAgent(page);
    
    // Test agent dashboard with Ghana market data
    await expect(page.locator('[data-testid="total-projects"]')).toContainText(/\d+/);
    await expect(page.locator('[data-testid="ghana-region-breakdown"]')).toBeVisible();
    
    // Test project filtering by Ghana regions
    await page.goto('/agent/projects');
    await page.selectOption('[data-testid="region-filter"]', GHANA_TEST_DATA.regions[0]);
    
    // Verify filtered projects
    const projectCards = page.locator('[data-testid="project-card"]');
    await expect(projectCards.first()).toContainText(GHANA_TEST_DATA.regions[0]);
    
    // Test bulk milestone updates
    await page.check('[data-testid="select-project-0"]');
    await page.check('[data-testid="select-project-1"]');
    await page.click('[data-testid="bulk-update-button"]');
    
    await page.selectOption('[data-testid="bulk-status"]', 'in_progress');
    await page.click('[data-testid="apply-bulk-update"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Projects updated');
  });

  test('Admin monitors system with Ghana market analytics', async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // Test admin dashboard with Ghana-specific metrics
    await expect(page.locator('[data-testid="ghana-market-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="regional-performance"]')).toContainText(GHANA_TEST_DATA.regions[0]);
    
    // Test notification monitoring
    await expect(page.locator('[data-testid="notification-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="failed-notifications"]')).toContainText(/\d+/);
    
    // Test system health monitoring
    await page.click('[data-testid="system-health-tab"]');
    await expect(page.locator('[data-testid="websocket-status"]')).toContainText('Connected');
    await expect(page.locator('[data-testid="database-status"]')).toContainText('Healthy');
  });
});

test.describe('Ghana Market Simulation Tests', () => {
  test('Handles poor connectivity scenarios', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
      await route.continue();
    });
    
    await page.goto('/properties');
    
    // Test offline functionality
    await context.setOffline(true);
    
    // Should show cached data
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="cached-properties"]')).toBeVisible();
    
    // Test offline property search
    await page.fill('[data-testid="search-input"]', 'Accra');
    await expect(page.locator('[data-testid="search-results"]')).toContainText('Accra');
    
    // Restore connectivity
    await context.setOffline(false);
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
  });

  test('Regional pricing variations work correctly', async ({ page }) => {
    await page.goto('/construction/request');
    
    // Test different regions show different pricing
    const regions = GHANA_TEST_DATA.regions;
    const baseCost = 100000;
    
    for (const region of regions) {
      await page.selectOption('[data-testid="region-select"]', region);
      
      // Add a standard eco-feature
      await page.check('[data-testid="solar-panels-checkbox"]');
      
      const costElement = page.locator('[data-testid="estimated-cost"]');
      const costText = await costElement.textContent();
      const cost = parseFloat(costText?.replace(/[^\d.]/g, '') || '0');
      
      // Verify cost varies by region (should not be exactly the base cost)
      expect(cost).not.toBe(baseCost);
      expect(cost).toBeGreaterThan(baseCost * 0.8); // At least 80% of base
      expect(cost).toBeLessThan(baseCost * 1.5); // At most 150% of base
    }
  });

  test('Ghana-specific features and localization', async ({ page }) => {
    await page.goto('/properties');
    
    // Test currency formatting
    const priceElements = page.locator('[data-testid="property-price"]');
    const firstPrice = await priceElements.first().textContent();
    expect(firstPrice).toContain('GHS');
    expect(firstPrice).toMatch(/GHS\s[\d,]+/); // Format: GHS 123,456
    
    // Test phone number formatting
    await page.goto('/contact');
    await page.fill('[data-testid="phone-input"]', '0241234567');
    await expect(page.locator('[data-testid="phone-input"]')).toHaveValue('+233 24 123 4567');
    
    // Test date formatting (DD/MM/YYYY for Ghana)
    await page.goto('/dashboard');
    const dateElements = page.locator('[data-testid="project-date"]');
    if (await dateElements.count() > 0) {
      const dateText = await dateElements.first().textContent();
      expect(dateText).toMatch(/\d{2}\/\d{2}\/\d{4}/); // DD/MM/YYYY format
    }
  });
});

test.describe('Cross-Portal Functionality Tests', () => {
  test('Data consistency across customer, agent, and admin portals', async ({ browser }) => {
    // Create contexts for different user types
    const customerContext = await browser.newContext();
    const agentContext = await browser.newContext();
    const adminContext = await browser.newContext();
    
    const customerPage = await customerContext.newPage();
    const agentPage = await agentContext.newPage();
    const adminPage = await adminContext.newPage();
    
    // Customer creates a construction request
    await loginAsCustomer(customerPage);
    await customerPage.goto('/construction/request');
    await customerPage.fill('[data-testid="project-title"]', 'Cross-Portal Test Project');
    await customerPage.selectOption('[data-testid="region-select"]', GHANA_TEST_DATA.regions[0]);
    await customerPage.click('[data-testid="submit-request-button"]');
    
    // Agent should see the request
    await loginAsAgent(agentPage);
    await agentPage.goto('/agent/leads');
    await expect(agentPage.locator('[data-testid="lead-item"]')).toContainText('Cross-Portal Test Project');
    
    // Admin should see the request in analytics
    await adminPage.goto('/admin/login');
    await adminPage.fill('[data-testid="email"]', 'admin@test.com');
    await adminPage.fill('[data-testid="password"]', 'testpassword');
    await adminPage.click('[data-testid="login-button"]');
    
    await adminPage.goto('/admin/analytics');
    await expect(adminPage.locator('[data-testid="recent-requests"]')).toContainText('Cross-Portal Test Project');
    
    // Clean up
    await customerContext.close();
    await agentContext.close();
    await adminContext.close();
  });

  test('Real-time notifications work across all portals', async ({ browser }) => {
    const customerContext = await browser.newContext();
    const agentContext = await browser.newContext();
    
    const customerPage = await customerContext.newPage();
    const agentPage = await agentContext.newPage();
    
    // Set up WebSocket connections
    await loginAsCustomer(customerPage);
    await loginAsAgent(agentPage);
    
    // Agent sends a message
    await agentPage.goto('/agent/projects/1/chat');
    await agentPage.fill('[data-testid="message-input"]', 'Project update from agent');
    await agentPage.click('[data-testid="send-message-button"]');
    
    // Customer should receive notification
    await customerPage.bringToFront();
    await waitForNotification(customerPage, 'New message');
    
    // Clean up
    await customerContext.close();
    await agentContext.close();
  });
});

test.describe('Performance and Load Tests', () => {
  test('Page load times are acceptable for Ghana internet speeds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds on slow connections
    expect(loadTime).toBeLessThan(5000);
    
    // Test critical resources are loaded
    await expect(page.locator('[data-testid="property-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-filters"]')).toBeVisible();
  });

  test('WebSocket connections handle reconnection gracefully', async ({ page }) => {
    await loginAsCustomer(page);
    
    // Wait for WebSocket connection
    await page.waitForFunction(() => {
      return (window as any).websocketConnected === true;
    });
    
    // Simulate network interruption
    await page.evaluate(() => {
      // Close WebSocket connection
      if ((window as any).notificationSocket) {
        (window as any).notificationSocket.close();
      }
    });
    
    // Should reconnect automatically
    await page.waitForFunction(() => {
      return (window as any).websocketConnected === true;
    }, { timeout: 10000 });
    
    // Verify notifications still work
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
  });
});