import type { 
  PlatformMetrics, 
  UserActivityMetrics, 
  FinancialMetrics, 
  SustainabilityMetrics, 
  SystemHealthMetrics, 
  RegionalPerformance 
} from '../types';
import { db } from './db';

// Generate realistic analytics data based on current database state
export class AnalyticsService {
  static getPlatformMetrics(): PlatformMetrics {
    const properties = db.listProperties();
    const users = db.listUsers();
    const regions = db.listRegions();
    
    const totalRevenue = properties.reduce((sum, prop) => sum + prop.price, 0);
    const avgSustainabilityScore = properties.reduce((sum, prop) => sum + (prop.sustainability_score || 0), 0) / properties.length;
    
    return {
      total_revenue: totalRevenue,
      active_properties: properties.filter(p => p.status === 'Live').length,
      total_users: users.length,
      avg_sustainability_score: Math.round(avgSustainabilityScore * 10) / 10,
      conversion_rate: 24.5, // Mock conversion rate
      monthly_growth: 15.3 // Mock growth rate
    };
  }

  static getUserActivityMetrics(): UserActivityMetrics[] {
    const users = db.listUsers();
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const roles: Array<'customer' | 'agent' | 'builder' | 'admin'> = ['customer', 'agent', 'builder', 'admin'];
    
    return roles.map(role => ({
      role,
      total_users: usersByRole[role] || 0,
      active_users: Math.floor((usersByRole[role] || 0) * 0.8), // 80% active rate
      new_users_this_month: Math.floor((usersByRole[role] || 0) * 0.2), // 20% new this month
      avg_session_duration: role === 'admin' ? 45 : role === 'agent' ? 32 : 18, // Minutes
      top_actions: this.getTopActionsByRole(role)
    }));
  }

  private static getTopActionsByRole(role: string): Array<{ action: string; count: number }> {
    const actionsByRole = {
      customer: [
        { action: 'Browse Properties', count: 1250 },
        { action: 'Save Search', count: 340 },
        { action: 'Request Quote', count: 180 },
        { action: 'View Project Status', count: 95 }
      ],
      agent: [
        { action: 'Create Quote', count: 85 },
        { action: 'Update Project', count: 120 },
        { action: 'Contact Customer', count: 200 },
        { action: 'Upload Documents', count: 65 }
      ],
      builder: [
        { action: 'Update Milestone', count: 45 },
        { action: 'Upload Progress Photos', count: 78 },
        { action: 'Submit Change Order', count: 23 },
        { action: 'Review Plans', count: 56 }
      ],
      admin: [
        { action: 'Manage Users', count: 35 },
        { action: 'Update Pricing', count: 12 },
        { action: 'Review Analytics', count: 89 },
        { action: 'Manage Content', count: 28 }
      ]
    };

    return actionsByRole[role as keyof typeof actionsByRole] || [];
  }

  static getFinancialMetrics(): FinancialMetrics {
    const properties = db.listProperties();
    const regions = db.listRegions();
    
    const totalRevenue = properties.reduce((sum, prop) => sum + prop.price, 0);
    const currentMonth = new Date().getMonth();
    const monthlyRevenue = totalRevenue * 0.15; // Assume 15% of total is this month
    
    const revenueByRegion = regions.map(region => {
      const regionProperties = properties.filter(p => p.region === region.code);
      const regionRevenue = regionProperties.reduce((sum, prop) => sum + prop.price, 0);
      return {
        region: region.name,
        revenue: regionRevenue,
        percentage: Math.round((regionRevenue / totalRevenue) * 100 * 10) / 10
      };
    });

    const propertyTypes = ['Apartment', 'House', 'Loft', 'Villa'];
    const revenueByPropertyType = propertyTypes.map(type => {
      const typeProperties = properties.filter(p => p.type === type);
      const typeRevenue = typeProperties.reduce((sum, prop) => sum + prop.price, 0);
      return {
        type,
        revenue: typeRevenue,
        count: typeProperties.length
      };
    });

    return {
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      revenue_by_region: revenueByRegion,
      revenue_by_property_type: revenueByPropertyType,
      average_property_value: Math.round(totalRevenue / properties.length),
      currency: 'GHS'
    };
  }

  static getSustainabilityMetrics(): SustainabilityMetrics {
    const properties = db.listProperties();
    const ecoFeatures = db.listEcoFeatures();
    
    const avgGreenScore = properties.reduce((sum, prop) => sum + (prop.sustainability_score || 0), 0) / properties.length;
    
    const ecoFeatureAdoption = ecoFeatures.map(feature => {
      const propertiesWithFeature = properties.filter(p => 
        p.eco_features?.includes(feature.name.toLowerCase().replace(/\s+/g, '_'))
      ).length;
      
      return {
        feature: feature.name,
        adoption_rate: Math.round((propertiesWithFeature / properties.length) * 100 * 10) / 10,
        total_installations: propertiesWithFeature
      };
    });

    const sustainabilityTrends = [
      { month: 'Jan', solar: 45, water: 32, materials: 28, smart_tech: 15 },
      { month: 'Feb', solar: 52, water: 38, materials: 35, smart_tech: 18 },
      { month: 'Mar', solar: 58, water: 42, materials: 40, smart_tech: 22 },
      { month: 'Apr', solar: 68, water: 48, materials: 45, smart_tech: 28 },
      { month: 'May', solar: 75, water: 55, materials: 52, smart_tech: 35 },
      { month: 'Jun', solar: 82, water: 62, materials: 58, smart_tech: 42 }
    ];

    return {
      avg_green_score: Math.round(avgGreenScore * 10) / 10,
      eco_feature_adoption: ecoFeatureAdoption,
      sustainability_trends: sustainabilityTrends,
      carbon_savings_estimate: Math.round(avgGreenScore * properties.length * 2.5) // Mock calculation
    };
  }

  static getSystemHealthMetrics(): SystemHealthMetrics {
    return {
      api_response_time: 145, // milliseconds
      uptime_percentage: 99.8,
      error_rate: 0.2, // percentage
      active_sessions: 1247,
      database_performance: {
        query_time: 23, // milliseconds
        connection_pool: 85 // percentage used
      },
      storage_usage: {
        used_gb: 127.5,
        total_gb: 500,
        percentage: 25.5
      }
    };
  }

  static getRegionalPerformance(): RegionalPerformance[] {
    const regions = db.listRegions();
    const properties = db.listProperties();
    const colors = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];
    
    return regions.map((region, index) => {
      const regionProperties = properties.filter(p => p.region === region.code);
      const revenue = regionProperties.reduce((sum, prop) => sum + prop.price, 0);
      const avgSustainabilityScore = regionProperties.length > 0 
        ? regionProperties.reduce((sum, prop) => sum + (prop.sustainability_score || 0), 0) / regionProperties.length 
        : 0;
      
      return {
        region: region.name,
        region_code: region.code,
        properties_count: regionProperties.length,
        revenue,
        avg_property_value: regionProperties.length > 0 ? Math.round(revenue / regionProperties.length) : 0,
        sustainability_score: Math.round(avgSustainabilityScore * 10) / 10,
        growth_rate: Math.round((Math.random() * 20 + 5) * 10) / 10, // Mock growth rate 5-25%
        color: colors[index % colors.length]
      };
    });
  }

  // Time series data generators
  static getRevenueTimeSeries(months: number = 12): Array<{ month: string; revenue: number; target: number }> {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return Array.from({ length: months }, (_, i) => {
      const monthIndex = (currentMonth - months + 1 + i + 12) % 12;
      const baseRevenue = 450000 + (i * 25000); // Growing trend
      const variance = (Math.random() - 0.5) * 100000; // Add some variance
      
      return {
        month: monthNames[monthIndex],
        revenue: Math.max(0, Math.round(baseRevenue + variance)),
        target: Math.round(baseRevenue * 1.1) // Target is 10% higher
      };
    });
  }

  static getUserGrowthTimeSeries(months: number = 12): Array<{ month: string; customers: number; agents: number; builders: number }> {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return Array.from({ length: months }, (_, i) => {
      const monthIndex = (currentMonth - months + 1 + i + 12) % 12;
      const baseCustomers = 50 + (i * 8);
      const baseAgents = 5 + (i * 1);
      const baseBuilders = 3 + Math.floor(i * 0.5);
      
      return {
        month: monthNames[monthIndex],
        customers: baseCustomers + Math.floor(Math.random() * 10),
        agents: baseAgents + Math.floor(Math.random() * 3),
        builders: baseBuilders + Math.floor(Math.random() * 2)
      };
    });
  }

  // Utility functions for formatting
  static formatCurrency(amount: number, currency: string = 'GHS'): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  static formatNumber(value: number): string {
    return new Intl.NumberFormat('en-GH').format(value);
  }
}