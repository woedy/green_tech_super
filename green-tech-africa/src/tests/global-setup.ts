/**
 * Global setup for Playwright tests.
 * Sets up test database, creates test users, and prepares Ghana-specific test data.
 */
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Setting up test environment...');
  
  // Start browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for backend to be ready
    await page.goto('http://localhost:8000/api/health/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Create test users via API
    await createTestUsers(page);
    
    // Create Ghana-specific test data
    await createGhanaTestData(page);
    
    // Set up WebSocket test environment
    await setupWebSocketTests(page);
    
    console.log('Test environment setup complete');
    
  } catch (error) {
    console.error('Failed to set up test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function createTestUsers(page: any) {
  console.log('Creating test users...');
  
  const users = [
    {
      username: 'customer',
      email: 'customer@test.com',
      password: 'testpassword',
      user_type: 'customer',
      phone_number: '+233241234567',
      location: 'Greater Accra',
      preferred_language: 'en'
    },
    {
      username: 'agent',
      email: 'agent@test.com',
      password: 'testpassword',
      user_type: 'agent',
      phone_number: '+233241234568',
      location: 'Greater Accra',
      verified_agent: true
    },
    {
      username: 'admin',
      email: 'admin@test.com',
      password: 'testpassword',
      user_type: 'admin',
      is_staff: true,
      is_superuser: true
    }
  ];
  
  for (const userData of users) {
    try {
      const response = await page.request.post('http://localhost:8000/api/auth/register/', {
        data: userData
      });
      
      if (!response.ok()) {
        console.warn(`Failed to create user ${userData.username}:`, await response.text());
      } else {
        console.log(`Created test user: ${userData.username}`);
      }
    } catch (error) {
      console.warn(`Error creating user ${userData.username}:`, error);
    }
  }
}

async function createGhanaTestData(page: any) {
  console.log('Creating Ghana-specific test data...');
  
  // Login as admin to create test data
  await page.request.post('http://localhost:8000/api/auth/login/', {
    data: {
      email: 'admin@test.com',
      password: 'testpassword'
    }
  });
  
  // Create Ghana regions
  const regions = [
    {
      name: 'Greater Accra',
      code: 'GA',
      major_cities: ['Accra', 'Tema', 'Kasoa'],
      cost_multiplier: 1.2
    },
    {
      name: 'Ashanti',
      code: 'AS',
      major_cities: ['Kumasi', 'Obuasi', 'Ejisu'],
      cost_multiplier: 1.0
    },
    {
      name: 'Northern',
      code: 'NR',
      major_cities: ['Tamale', 'Yendi', 'Savelugu'],
      cost_multiplier: 0.8
    },
    {
      name: 'Western',
      code: 'WR',
      major_cities: ['Takoradi', 'Tarkwa', 'Axim'],
      cost_multiplier: 0.9
    }
  ];
  
  for (const region of regions) {
    try {
      await page.request.post('http://localhost:8000/api/ghana/regions/', {
        data: region
      });
      console.log(`Created region: ${region.name}`);
    } catch (error) {
      console.warn(`Error creating region ${region.name}:`, error);
    }
  }
  
  // Create eco-features
  const ecoFeatures = [
    {
      name: 'Solar Panels',
      category: 'energy',
      description: 'Photovoltaic solar panels for renewable energy',
      base_cost: 25000,
      sustainability_points: 50,
      available_in_ghana: true,
      regional_multiplier: {
        'Greater Accra': 1.1,
        'Ashanti': 1.0,
        'Northern': 0.9,
        'Western': 1.0
      }
    },
    {
      name: 'Rainwater Harvesting',
      category: 'water',
      description: 'System to collect and store rainwater',
      base_cost: 15000,
      sustainability_points: 40,
      available_in_ghana: true,
      regional_multiplier: {
        'Greater Accra': 1.0,
        'Ashanti': 0.9,
        'Northern': 1.2,
        'Western': 0.8
      }
    },
    {
      name: 'Eco-Cement',
      category: 'materials',
      description: 'Environmentally friendly cement alternative',
      base_cost: 5000,
      sustainability_points: 30,
      available_in_ghana: true
    }
  ];
  
  for (const feature of ecoFeatures) {
    try {
      await page.request.post('http://localhost:8000/api/sustainability/eco-features/', {
        data: feature
      });
      console.log(`Created eco-feature: ${feature.name}`);
    } catch (error) {
      console.warn(`Error creating eco-feature ${feature.name}:`, error);
    }
  }
  
  // Create sample properties
  const properties = [
    {
      title: 'Eco-Friendly Villa in East Legon',
      description: 'Modern sustainable home with solar panels and rainwater harvesting',
      property_type: 'house',
      location: 'East Legon, Accra',
      coordinates: { lat: 5.6037, lng: -0.1870 },
      price: 450000,
      currency: 'GHS',
      sustainability_score: 85,
      eco_features: ['Solar Panels', 'Rainwater Harvesting', 'LED Lighting'],
      energy_rating: 'A+',
      water_efficiency: 'High',
      status: 'available'
    },
    {
      title: 'Green Apartment in Kumasi',
      description: 'Sustainable apartment with eco-friendly materials',
      property_type: 'apartment',
      location: 'Adum, Kumasi',
      coordinates: { lat: 6.6885, lng: -1.6244 },
      price: 180000,
      currency: 'GHS',
      sustainability_score: 70,
      eco_features: ['Eco-Cement', 'Natural Ventilation'],
      energy_rating: 'B+',
      water_efficiency: 'Medium',
      status: 'available'
    }
  ];
  
  for (const property of properties) {
    try {
      await page.request.post('http://localhost:8000/api/properties/', {
        data: property
      });
      console.log(`Created property: ${property.title}`);
    } catch (error) {
      console.warn(`Error creating property ${property.title}:`, error);
    }
  }
}

async function setupWebSocketTests(page: any) {
  console.log('Setting up WebSocket test environment...');
  
  // Create notification templates for testing
  const templates = [
    {
      name: 'project_milestone_test',
      subject: 'Project Milestone: {{ milestone_name }}',
      template: 'Your {{ project_name }} project has reached: {{ milestone_name }}. Progress: {{ progress }}%',
      notification_type: 'in_app',
      is_active: true
    },
    {
      name: 'quote_ready_test',
      subject: 'Your Quote is Ready',
      template: 'Your construction quote for {{ project_name }} is ready. Total: GHS {{ total_amount }}',
      notification_type: 'email',
      is_active: true
    }
  ];
  
  for (const template of templates) {
    try {
      await page.request.post('http://localhost:8000/api/notifications/templates/', {
        data: template
      });
      console.log(`Created notification template: ${template.name}`);
    } catch (error) {
      console.warn(`Error creating template ${template.name}:`, error);
    }
  }
  
  // Set up test notification preferences
  const preferences = [
    {
      user_email: 'customer@test.com',
      email_notifications: true,
      sms_notifications: true,
      push_notifications: true,
      in_app_notifications: true,
      project_updates: true,
      quote_updates: true,
      payment_reminders: true
    },
    {
      user_email: 'agent@test.com',
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      in_app_notifications: true,
      project_updates: true,
      quote_updates: true
    }
  ];
  
  for (const pref of preferences) {
    try {
      // Get user ID first
      const userResponse = await page.request.get(`http://localhost:8000/api/auth/users/?email=${pref.user_email}`);
      if (userResponse.ok()) {
        const userData = await userResponse.json();
        if (userData.results && userData.results.length > 0) {
          const userId = userData.results[0].id;
          
          await page.request.post(`http://localhost:8000/api/notifications/preferences/${userId}/`, {
            data: pref
          });
          console.log(`Set notification preferences for: ${pref.user_email}`);
        }
      }
    } catch (error) {
      console.warn(`Error setting preferences for ${pref.user_email}:`, error);
    }
  }
}

export default globalSetup;