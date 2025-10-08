import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../data/db';
import type { Property, User, EcoFeature, Region } from '../types';

describe('Admin Database Operations', () => {
  beforeEach(() => {
    // Reset database to initial state before each test
    db.reset();
  });

  describe('Property Management', () => {
    it('should create a new property', () => {
      const propertyData: Omit<Property, 'id'> = {
        title: 'Test Property',
        price: 150000,
        status: 'Draft',
        location: 'Test Location',
        type: 'House',
        region: 'GH-GA',
        currency: 'GHS',
        bedrooms: 3,
        bathrooms: 2,
        area_sq_m: 120,
        sustainability_score: 80,
        eco_features: ['solar_panels', 'led_lighting']
      };

      const created = db.createProperty(propertyData);
      
      expect(created).toBeDefined();
      expect(created.id).toBeGreaterThan(0);
      expect(created.title).toBe(propertyData.title);
      expect(created.price).toBe(propertyData.price);
      expect(created.eco_features).toEqual(propertyData.eco_features);
    });

    it('should update an existing property', () => {
      const properties = db.listProperties();
      const firstProperty = properties[0];
      
      const updates = {
        title: 'Updated Property Title',
        price: 200000,
        sustainability_score: 90
      };

      const updated = db.updateProperty(firstProperty.id, updates);
      
      expect(updated).toBeDefined();
      expect(updated!.title).toBe(updates.title);
      expect(updated!.price).toBe(updates.price);
      expect(updated!.sustainability_score).toBe(updates.sustainability_score);
    });

    it('should delete a property', () => {
      const properties = db.listProperties();
      const initialCount = properties.length;
      const firstProperty = properties[0];

      db.deleteProperty(firstProperty.id);
      
      const updatedProperties = db.listProperties();
      expect(updatedProperties.length).toBe(initialCount - 1);
      expect(updatedProperties.find(p => p.id === firstProperty.id)).toBeUndefined();
    });

    it('should bulk create properties with validation', () => {
      const propertiesData: Omit<Property, 'id'>[] = [
        {
          title: 'Bulk Property 1',
          price: 100000,
          status: 'Live',
          location: 'Accra',
          type: 'Apartment',
          region: 'GH-GA',
          currency: 'GHS'
        },
        {
          title: 'Bulk Property 2',
          price: 120000,
          status: 'Draft',
          location: 'Kumasi',
          type: 'House',
          region: 'GH-AS',
          currency: 'GHS'
        },
        {
          title: '', // Invalid - missing title
          price: 0, // Invalid - missing price
          status: 'Live',
          location: 'Test',
          type: 'House'
        }
      ];

      const result = db.bulkCreateProperties(propertiesData);
      
      expect(result.success).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(2);
      expect(result.errors[0].error).toContain('Title and price are required');
    });
  });

  describe('User Management', () => {
    it('should create a new user', () => {
      const userData: Omit<User, 'id'> = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        active: true,
        phone: '+233123456789',
        location: 'Accra, Ghana',
        verified: false
      };

      const created = db.createUser(userData);
      
      expect(created).toBeDefined();
      expect(created.id).toBeGreaterThan(0);
      expect(created.name).toBe(userData.name);
      expect(created.email).toBe(userData.email);
      expect(created.role).toBe(userData.role);
    });

    it('should update user role and verification status', () => {
      const users = db.listUsers();
      const firstUser = users[0];
      
      const updates = {
        role: 'agent' as const,
        verified: true,
        active: false
      };

      const updated = db.updateUser(firstUser.id, updates);
      
      expect(updated).toBeDefined();
      expect(updated!.role).toBe(updates.role);
      expect(updated!.verified).toBe(updates.verified);
      expect(updated!.active).toBe(updates.active);
    });

    it('should bulk update users', () => {
      const users = db.listUsers();
      const updates = [
        { id: users[0].id, patch: { verified: true, active: true } },
        { id: users[1].id, patch: { role: 'builder' as const } },
        { id: 999, patch: { active: false } } // Non-existent user
      ];

      const result = db.bulkUpdateUsers(updates);
      
      expect(result.success).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].id).toBe(999);
      expect(result.errors[0].error).toBe('User not found');
    });

    it('should delete a user', () => {
      const users = db.listUsers();
      const initialCount = users.length;
      const firstUser = users[0];

      db.deleteUser(firstUser.id);
      
      const updatedUsers = db.listUsers();
      expect(updatedUsers.length).toBe(initialCount - 1);
      expect(updatedUsers.find(u => u.id === firstUser.id)).toBeUndefined();
    });
  });

  describe('Eco Feature Management', () => {
    it('should create a new eco feature', () => {
      const featureData: Omit<EcoFeature, 'id' | 'created_at' | 'updated_at'> = {
        name: 'Test Feature',
        category: 'energy',
        description: 'A test eco feature',
        base_cost: 5000,
        sustainability_points: 15,
        available_in_ghana: true,
        regional_availability: { 'GH-GA': true, 'GH-AS': false },
        regional_pricing: { 'GH-GA': 1.1, 'GH-AS': 0.9 }
      };

      const created = db.createEcoFeature(featureData);
      
      expect(created).toBeDefined();
      expect(created.id).toBeGreaterThan(0);
      expect(created.name).toBe(featureData.name);
      expect(created.category).toBe(featureData.category);
      expect(created.available_in_ghana).toBe(featureData.available_in_ghana);
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
    });

    it('should update an eco feature', () => {
      const features = db.listEcoFeatures();
      const firstFeature = features[0];
      
      const updates = {
        name: 'Updated Feature Name',
        base_cost: 8000,
        sustainability_points: 25,
        available_in_ghana: false
      };

      const updated = db.updateEcoFeature(firstFeature.id, updates);
      
      expect(updated).toBeDefined();
      expect(updated!.name).toBe(updates.name);
      expect(updated!.base_cost).toBe(updates.base_cost);
      expect(updated!.sustainability_points).toBe(updates.sustainability_points);
      expect(updated!.available_in_ghana).toBe(updates.available_in_ghana);
      expect(updated!.updated_at).not.toBe(firstFeature.updated_at);
    });

    it('should delete an eco feature', () => {
      const features = db.listEcoFeatures();
      const initialCount = features.length;
      const firstFeature = features[0];

      db.deleteEcoFeature(firstFeature.id);
      
      const updatedFeatures = db.listEcoFeatures();
      expect(updatedFeatures.length).toBe(initialCount - 1);
      expect(updatedFeatures.find(f => f.id === firstFeature.id)).toBeUndefined();
    });

    it('should validate eco feature categories', () => {
      const validCategories: EcoFeature['category'][] = [
        'energy', 'water', 'materials', 'waste', 'smart_tech', 'air_quality'
      ];

      validCategories.forEach(category => {
        const featureData: Omit<EcoFeature, 'id' | 'created_at' | 'updated_at'> = {
          name: `Test ${category} Feature`,
          category,
          description: `A test ${category} feature`,
          base_cost: 1000,
          sustainability_points: 10,
          available_in_ghana: true
        };

        const created = db.createEcoFeature(featureData);
        expect(created.category).toBe(category);
      });
    });
  });

  describe('Regional Management', () => {
    it('should create/update a region', () => {
      const regionData: Region = {
        code: 'GH-TV',
        name: 'Volta',
        currency: 'GHS',
        multiplier: 0.95,
        major_cities: ['Ho', 'Keta', 'Hohoe'],
        is_active: true
      };

      const created = db.upsertRegion(regionData);
      
      expect(created).toBeDefined();
      expect(created.code).toBe(regionData.code);
      expect(created.name).toBe(regionData.name);
      expect(created.multiplier).toBe(regionData.multiplier);
      expect(created.major_cities).toEqual(regionData.major_cities);
    });

    it('should update existing region', () => {
      const regions = db.listRegions();
      const firstRegion = regions[0];
      
      const updates: Region = {
        ...firstRegion,
        multiplier: 1.5,
        major_cities: ['Updated City 1', 'Updated City 2']
      };

      const updated = db.upsertRegion(updates);
      
      expect(updated.multiplier).toBe(1.5);
      expect(updated.major_cities).toEqual(['Updated City 1', 'Updated City 2']);
    });

    it('should delete a region', () => {
      const regions = db.listRegions();
      const initialCount = regions.length;
      const firstRegion = regions[0];

      db.deleteRegion(firstRegion.code);
      
      const updatedRegions = db.listRegions();
      expect(updatedRegions.length).toBe(initialCount - 1);
      expect(updatedRegions.find(r => r.code === firstRegion.code)).toBeUndefined();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency after operations', () => {
      const initialProperties = db.listProperties();
      const initialUsers = db.listUsers();
      const initialFeatures = db.listEcoFeatures();
      const initialRegions = db.listRegions();

      // Perform various operations
      db.createProperty({
        title: 'Integrity Test Property',
        price: 100000,
        status: 'Draft',
        location: 'Test Location',
        type: 'House'
      });

      db.createUser({
        name: 'Integrity Test User',
        email: 'integrity@test.com',
        role: 'customer',
        active: true
      });

      db.createEcoFeature({
        name: 'Integrity Test Feature',
        category: 'energy',
        description: 'Test feature for integrity',
        base_cost: 1000,
        sustainability_points: 5,
        available_in_ghana: true
      });

      // Verify counts increased correctly
      expect(db.listProperties().length).toBe(initialProperties.length + 1);
      expect(db.listUsers().length).toBe(initialUsers.length + 1);
      expect(db.listEcoFeatures().length).toBe(initialFeatures.length + 1);
      expect(db.listRegions().length).toBe(initialRegions.length);
    });

    it('should handle invalid operations gracefully', () => {
      // Test updating non-existent records
      expect(db.updateProperty(999, { title: 'Non-existent' })).toBeUndefined();
      expect(db.updateUser(999, { name: 'Non-existent' })).toBeUndefined();
      expect(db.updateEcoFeature(999, { name: 'Non-existent' })).toBeUndefined();

      // Test getting non-existent records
      expect(db.getProperty(999)).toBeUndefined();
      expect(db.getUser(999)).toBeUndefined();
      expect(db.getEcoFeature(999)).toBeUndefined();
      expect(db.getRegion('NON-EXISTENT')).toBeUndefined();
    });

    it('should preserve data types and structure', () => {
      const properties = db.listProperties();
      const users = db.listUsers();
      const features = db.listEcoFeatures();
      const regions = db.listRegions();

      // Verify property structure
      properties.forEach(property => {
        expect(typeof property.id).toBe('number');
        expect(typeof property.title).toBe('string');
        expect(typeof property.price).toBe('number');
        expect(['Draft', 'Live', 'Sold', 'Rented']).toContain(property.status);
      });

      // Verify user structure
      users.forEach(user => {
        expect(typeof user.id).toBe('number');
        expect(typeof user.name).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(['admin', 'agent', 'builder', 'customer']).toContain(user.role);
        expect(typeof user.active).toBe('boolean');
      });

      // Verify eco feature structure
      features.forEach(feature => {
        expect(typeof feature.id).toBe('number');
        expect(typeof feature.name).toBe('string');
        expect(['energy', 'water', 'materials', 'waste', 'smart_tech', 'air_quality']).toContain(feature.category);
        expect(typeof feature.base_cost).toBe('number');
        expect(typeof feature.sustainability_points).toBe('number');
        expect(typeof feature.available_in_ghana).toBe('boolean');
      });

      // Verify region structure
      regions.forEach(region => {
        expect(typeof region.code).toBe('string');
        expect(typeof region.name).toBe('string');
        expect(typeof region.currency).toBe('string');
        expect(typeof region.multiplier).toBe('number');
      });
    });
  });
});