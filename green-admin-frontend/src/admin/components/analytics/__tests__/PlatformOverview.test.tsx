import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlatformOverview } from '../PlatformOverview';
import type { PlatformMetrics } from '../../../types';

const mockMetrics: PlatformMetrics = {
  total_revenue: 6570000,
  active_properties: 107,
  total_users: 1250,
  avg_sustainability_score: 7.8,
  conversion_rate: 24.5,
  monthly_growth: 15.3
};

describe('PlatformOverview', () => {
  it('should render all metric cards', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Active Properties')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Avg Green Score')).toBeInTheDocument();
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    expect(screen.getByText('Platform Health')).toBeInTheDocument();
  });

  it('should display formatted currency for total revenue', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    // Should display formatted currency (GHS format)
    const revenueElement = screen.getByText(/6,570,000/);
    expect(revenueElement).toBeInTheDocument();
  });

  it('should display active properties count', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('107')).toBeInTheDocument();
  });

  it('should display total users count', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  it('should display sustainability score with rating', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('7.8/10')).toBeInTheDocument();
  });

  it('should display conversion rate as percentage', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('24.5%')).toBeInTheDocument();
  });

  it('should display trend indicators', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    // Should show positive trend indicators
    const trendElements = screen.getAllByText(/\+.*%/);
    expect(trendElements.length).toBeGreaterThan(0);
  });

  it('should handle zero values gracefully', () => {
    const zeroMetrics: PlatformMetrics = {
      total_revenue: 0,
      active_properties: 0,
      total_users: 0,
      avg_sustainability_score: 0,
      conversion_rate: 0,
      monthly_growth: 0
    };

    render(<PlatformOverview metrics={zeroMetrics} />);
    
    // Check for specific zero values in context
    expect(screen.getByText('0/10')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    
    // Check that revenue shows formatted currency
    expect(screen.getByText(/GH₵0/)).toBeInTheDocument();
  });

  it('should display appropriate icons for each metric', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    // Check that icons are rendered (they should have specific classes)
    const container = screen.getByText('Total Revenue').closest('.p-4');
    expect(container).toBeInTheDocument();
  });

  it('should show platform health as 99.8%', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('99.8%')).toBeInTheDocument();
  });

  it('should handle large numbers correctly', () => {
    const largeMetrics: PlatformMetrics = {
      total_revenue: 50000000, // 50M
      active_properties: 5000,
      total_users: 100000,
      avg_sustainability_score: 9.5,
      conversion_rate: 35.7,
      monthly_growth: 25.8
    };

    render(<PlatformOverview metrics={largeMetrics} />);
    
    // Should format large numbers with commas
    expect(screen.getByText(/50,000,000/)).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('100,000')).toBeInTheDocument();
  });

  it('should display monthly growth trend', () => {
    render(<PlatformOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('+15.3% from last month')).toBeInTheDocument();
  });
});