import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsService } from '../../../data/analytics';
import { db } from '../../../data/db';

describe('AnalyticsService', () => {
  beforeEach(() => {
    // Reset database to ensure consistent test state
    db.reset();
  });

  describe('getPlatformMetrics', () => {
    it('should calculate platform metrics correctly', () => {
      const metrics = AnalyticsService.getPlatformMetrics();
      
      expect(metrics).toHaveProperty('total_revenue');
      expect(metrics).toHaveProperty('active_properties');
      expect(metrics).toHaveProperty('total_users');
      expect(metrics).toHaveProperty('avg_sustainability_score');
      expect(metrics).toHaveProperty('conversion_rate');
      expect(metrics).toHaveProperty('monthly_growth');
      
      expect(typeof metrics.total_revenue).toBe('number');
      expect(typeof metrics.active_properties).toBe('number');
      expect(typeof metrics.total_users).toBe('number');
      expect(typeof metrics.avg_sustainability_score).toBe('number');
      expect(metrics.avg_sustainability_score).toBeGreaterThanOrEqual(0);
      expect(metrics.avg_sustainability_score).toBeLessThanOrEqual(10);
    });

    it('should calculate total revenue from all properties', () => {
      const properties = db.listProperties();
      const expectedRevenue = properties.reduce((sum, prop) => sum + prop.price, 0);
      const metrics = AnalyticsService.getPlatformMetrics();
      
      expect(metrics.total_revenue).toBe(expectedRevenue);
    });

    it('should count only live properties as active', () => {
      const properties = db.listProperties();
      const expectedActiveProperties = properties.filter(p => p.status === 'Live').length;
      const metrics = AnalyticsService.getPlatformMetrics();
      
      expect(metrics.active_properties).toBe(expectedActiveProperties);
    });
  });

  describe('getUserActivityMetrics', () => {
    it('should return metrics for all user roles', () => {
      const metrics = AnalyticsService.getUserActivityMetrics();
      
      expect(metrics).toHaveLength(4);
      expect(metrics.map(m => m.role)).toEqual(['customer', 'agent', 'builder', 'admin']);
      
      metrics.forEach(roleMetric => {
        expect(roleMetric).toHaveProperty('total_users');
        expect(roleMetric).toHaveProperty('active_users');
        expect(roleMetric).toHaveProperty('new_users_this_month');
        expect(roleMetric).toHaveProperty('avg_session_duration');
        expect(roleMetric).toHaveProperty('top_actions');
        expect(Array.isArray(roleMetric.top_actions)).toBe(true);
      });
    });

    it('should calculate user counts correctly by role', () => {
      const users = db.listUsers();
      const usersByRole = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const metrics = AnalyticsService.getUserActivityMetrics();
      
      metrics.forEach(roleMetric => {
        const expectedCount = usersByRole[roleMetric.role] || 0;
        expect(roleMetric.total_users).toBe(expectedCount);
      });
    });

    it('should provide role-specific top actions', () => {
      const metrics = AnalyticsService.getUserActivityMetrics();
      
      const customerMetrics = metrics.find(m => m.role === 'customer');
      const agentMetrics = metrics.find(m => m.role === 'agent');
      
      expect(customerMetrics?.top_actions.some(action => 
        action.action.includes('Browse') || action.action.includes('Search')
      )).toBe(true);
      
      expect(agentMetrics?.top_actions.some(action => 
        action.action.includes('Quote') || action.action.includes('Project')
      )).toBe(true);
    });
  });

  describe('getFinancialMetrics', () => {
    it('should calculate financial metrics correctly', () => {
      const metrics = AnalyticsService.getFinancialMetrics();
      
      expect(metrics).toHaveProperty('total_revenue');
      expect(metrics).toHaveProperty('monthly_revenue');
      expect(metrics).toHaveProperty('revenue_by_region');
      expect(metrics).toHaveProperty('revenue_by_property_type');
      expect(metrics).toHaveProperty('average_property_value');
      expect(metrics.currency).toBe('GHS');
      
      expect(Array.isArray(metrics.revenue_by_region)).toBe(true);
      expect(Array.isArray(metrics.revenue_by_property_type)).toBe(true);
    });

    it('should calculate regional revenue distribution', () => {
      const metrics = AnalyticsService.getFinancialMetrics();
      const totalRegionalRevenue = metrics.revenue_by_region.reduce((sum, region) => sum + region.revenue, 0);
      
      expect(totalRegionalRevenue).toBe(metrics.total_revenue);
      
      metrics.revenue_by_region.forEach(region => {
        expect(region).toHaveProperty('region');
        expect(region).toHaveProperty('revenue');
        expect(region).toHaveProperty('percentage');
        expect(region.percentage).toBeGreaterThanOrEqual(0);
        expect(region.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate average property value correctly', () => {
      const properties = db.listProperties();
      const totalRevenue = properties.reduce((sum, prop) => sum + prop.price, 0);
      const expectedAverage = Math.round(totalRevenue / properties.length);
      
      const metrics = AnalyticsService.getFinancialMetrics();
      expect(metrics.average_property_value).toBe(expectedAverage);
    });
  });

  describe('getSustainabilityMetrics', () => {
    it('should calculate sustainability metrics correctly', () => {
      const metrics = AnalyticsService.getSustainabilityMetrics();
      
      expect(metrics).toHaveProperty('avg_green_score');
      expect(metrics).toHaveProperty('eco_feature_adoption');
      expect(metrics).toHaveProperty('sustainability_trends');
      expect(metrics).toHaveProperty('carbon_savings_estimate');
      
      expect(Array.isArray(metrics.eco_feature_adoption)).toBe(true);
      expect(Array.isArray(metrics.sustainability_trends)).toBe(true);
      expect(metrics.avg_green_score).toBeGreaterThanOrEqual(0);
      expect(metrics.avg_green_score).toBeLessThanOrEqual(10);
    });

    it('should calculate eco feature adoption rates', () => {
      const metrics = AnalyticsService.getSustainabilityMetrics();
      
      metrics.eco_feature_adoption.forEach(feature => {
        expect(feature).toHaveProperty('feature');
        expect(feature).toHaveProperty('adoption_rate');
        expect(feature).toHaveProperty('total_installations');
        expect(feature.adoption_rate).toBeGreaterThanOrEqual(0);
        expect(feature.adoption_rate).toBeLessThanOrEqual(100);
        expect(feature.total_installations).toBeGreaterThanOrEqual(0);
      });
    });

    it('should provide sustainability trends data', () => {
      const metrics = AnalyticsService.getSustainabilityMetrics();
      
      expect(metrics.sustainability_trends.length).toBeGreaterThan(0);
      metrics.sustainability_trends.forEach(trend => {
        expect(trend).toHaveProperty('month');
        expect(trend).toHaveProperty('solar');
        expect(trend).toHaveProperty('water');
        expect(trend).toHaveProperty('materials');
        expect(trend).toHaveProperty('smart_tech');
      });
    });
  });

  describe('getSystemHealthMetrics', () => {
    it('should return system health metrics', () => {
      const metrics = AnalyticsService.getSystemHealthMetrics();
      
      expect(metrics).toHaveProperty('api_response_time');
      expect(metrics).toHaveProperty('uptime_percentage');
      expect(metrics).toHaveProperty('error_rate');
      expect(metrics).toHaveProperty('active_sessions');
      expect(metrics).toHaveProperty('database_performance');
      expect(metrics).toHaveProperty('storage_usage');
      
      expect(metrics.uptime_percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.uptime_percentage).toBeLessThanOrEqual(100);
      expect(metrics.error_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.api_response_time).toBeGreaterThan(0);
    });

    it('should provide database performance metrics', () => {
      const metrics = AnalyticsService.getSystemHealthMetrics();
      
      expect(metrics.database_performance).toHaveProperty('query_time');
      expect(metrics.database_performance).toHaveProperty('connection_pool');
      expect(metrics.database_performance.query_time).toBeGreaterThan(0);
      expect(metrics.database_performance.connection_pool).toBeGreaterThanOrEqual(0);
      expect(metrics.database_performance.connection_pool).toBeLessThanOrEqual(100);
    });

    it('should provide storage usage metrics', () => {
      const metrics = AnalyticsService.getSystemHealthMetrics();
      
      expect(metrics.storage_usage).toHaveProperty('used_gb');
      expect(metrics.storage_usage).toHaveProperty('total_gb');
      expect(metrics.storage_usage).toHaveProperty('percentage');
      expect(metrics.storage_usage.used_gb).toBeLessThanOrEqual(metrics.storage_usage.total_gb);
      expect(metrics.storage_usage.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.storage_usage.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('getRegionalPerformance', () => {
    it('should return regional performance data', () => {
      const metrics = AnalyticsService.getRegionalPerformance();
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      metrics.forEach(region => {
        expect(region).toHaveProperty('region');
        expect(region).toHaveProperty('region_code');
        expect(region).toHaveProperty('properties_count');
        expect(region).toHaveProperty('revenue');
        expect(region).toHaveProperty('avg_property_value');
        expect(region).toHaveProperty('sustainability_score');
        expect(region).toHaveProperty('growth_rate');
        expect(region).toHaveProperty('color');
        
        expect(region.properties_count).toBeGreaterThanOrEqual(0);
        expect(region.revenue).toBeGreaterThanOrEqual(0);
        expect(region.sustainability_score).toBeGreaterThanOrEqual(0);
        expect(region.sustainability_score).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('utility functions', () => {
    describe('formatCurrency', () => {
      it('should format currency correctly for GHS', () => {
        const formatted = AnalyticsService.formatCurrency(1234567, 'GHS');
        expect(formatted).toMatch(/GHS|₵/); // Should contain GHS or Ghana Cedis symbol
        expect(formatted).toContain('1,234,567');
      });

      it('should handle zero and negative values', () => {
        expect(AnalyticsService.formatCurrency(0)).toBeDefined();
        expect(AnalyticsService.formatCurrency(-1000)).toBeDefined();
      });
    });

    describe('formatPercentage', () => {
      it('should format percentages correctly', () => {
        expect(AnalyticsService.formatPercentage(25.5)).toBe('25.5%');
        expect(AnalyticsService.formatPercentage(100)).toBe('100.0%');
        expect(AnalyticsService.formatPercentage(0)).toBe('0.0%');
      });

      it('should respect decimal places parameter', () => {
        expect(AnalyticsService.formatPercentage(25.567, 2)).toBe('25.57%');
        expect(AnalyticsService.formatPercentage(25.567, 0)).toBe('26%');
      });
    });

    describe('formatNumber', () => {
      it('should format numbers with proper separators', () => {
        expect(AnalyticsService.formatNumber(1234567)).toBe('1,234,567');
        expect(AnalyticsService.formatNumber(1000)).toBe('1,000');
        expect(AnalyticsService.formatNumber(999)).toBe('999');
      });
    });
  });

  describe('time series data generators', () => {
    describe('getRevenueTimeSeries', () => {
      it('should generate revenue time series data', () => {
        const data = AnalyticsService.getRevenueTimeSeries(6);
        
        expect(data).toHaveLength(6);
        data.forEach(point => {
          expect(point).toHaveProperty('month');
          expect(point).toHaveProperty('revenue');
          expect(point).toHaveProperty('target');
          expect(point.revenue).toBeGreaterThanOrEqual(0);
          expect(point.target).toBeGreaterThanOrEqual(0);
        });
      });

      it('should default to 12 months if no parameter provided', () => {
        const data = AnalyticsService.getRevenueTimeSeries();
        expect(data).toHaveLength(12);
      });
    });

    describe('getUserGrowthTimeSeries', () => {
      it('should generate user growth time series data', () => {
        const data = AnalyticsService.getUserGrowthTimeSeries(6);
        
        expect(data).toHaveLength(6);
        data.forEach(point => {
          expect(point).toHaveProperty('month');
          expect(point).toHaveProperty('customers');
          expect(point).toHaveProperty('agents');
          expect(point).toHaveProperty('builders');
          expect(point.customers).toBeGreaterThanOrEqual(0);
          expect(point.agents).toBeGreaterThanOrEqual(0);
          expect(point.builders).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
});