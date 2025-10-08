/**
 * Global teardown for Playwright tests.
 * Cleans up test data and closes connections.
 */
import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Cleaning up test environment...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Login as admin for cleanup
    await page.request.post('http://localhost:8000/api/auth/login/', {
      data: {
        email: 'admin@test.com',
        password: 'testpassword'
      }
    });
    
    // Clean up test data
    await cleanupTestData(page);
    
    console.log('Test environment cleanup complete');
    
  } catch (error) {
    console.error('Failed to clean up test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page: any) {
  console.log('Cleaning up test data...');
  
  // Clean up in reverse order of creation to handle dependencies
  
  // Clean up notifications
  try {
    await page.request.delete('http://localhost:8000/api/notifications/cleanup-test-data/');
    console.log('Cleaned up test notifications');
  } catch (error) {
    console.warn('Error cleaning up notifications:', error);
  }
  
  // Clean up properties
  try {
    await page.request.delete('http://localhost:8000/api/properties/cleanup-test-data/');
    console.log('Cleaned up test properties');
  } catch (error) {
    console.warn('Error cleaning up properties:', error);
  }
  
  // Clean up eco-features
  try {
    await page.request.delete('http://localhost:8000/api/sustainability/eco-features/cleanup-test-data/');
    console.log('Cleaned up test eco-features');
  } catch (error) {
    console.warn('Error cleaning up eco-features:', error);
  }
  
  // Clean up Ghana regions
  try {
    await page.request.delete('http://localhost:8000/api/ghana/regions/cleanup-test-data/');
    console.log('Cleaned up test regions');
  } catch (error) {
    console.warn('Error cleaning up regions:', error);
  }
  
  // Clean up test users (keep this last)
  try {
    await page.request.delete('http://localhost:8000/api/auth/cleanup-test-users/');
    console.log('Cleaned up test users');
  } catch (error) {
    console.warn('Error cleaning up users:', error);
  }
}

export default globalTeardown;