import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FinancialReport } from '../FinancialReport';
import type { FinancialMetrics } from '../../../types';

const mockFinancialMetrics: FinancialMetrics = {
  total_revenue: 6570000,
  monthly_revenue: 985500,
  revenue_by_region: [
    { region: 'Greater Accra', revenue: 2850000, percentage: 43.4 },
    { region: 'Ashanti', revenue: 1920000, percentage: 29.2 },
    { region: 'Northern', revenue: 1080000, percentage: 16.4 },
    { region: 'Central', revenue: 720000, percentage: 11.0 }
  ],
  revenue_by_property_type: [
    { type: 'Apartment', revenue: 3000000, count: 45 },
    { type: 'House', revenue: 2500000, count: 35 },
    { type: 'Loft', revenue: 800000, count: 15 },
    { type: 'Villa', revenue: 270000, count: 12 }
  ],
  average_property_value: 61495,
  currency: 'GHS'
};

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}));

describe('FinancialReport', () => {
  it('should render financial summary cards', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    expect(screen.getByText('Avg Property Value')).toBeInTheDocument();
    expect(screen.getByText('Currency')).toBeInTheDocument();
  });

  it('should display formatted currency values', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    // Should display formatted GHS currency
    expect(screen.getByText(/6,570,000/)).toBeInTheDocument();
    expect(screen.getByText(/985,500/)).toBeInTheDocument();
    expect(screen.getByText(/61,495/)).toBeInTheDocument();
  });

  it('should display Ghana Cedis as currency', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    expect(screen.getByText('GHS')).toBeInTheDocument();
    expect(screen.getByText('Ghana Cedis')).toBeInTheDocument();
  });

  it('should render revenue trends chart', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    expect(screen.getByText('Revenue Trends (Last 6 Months)')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('should render regional revenue pie chart', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    expect(screen.getByText('Revenue by Ghana Region')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('should render property type performance chart', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    expect(screen.getByText('Revenue by Property Type')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should display regional performance table', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    expect(screen.getByText('Ghana Regional Financial Performance')).toBeInTheDocument();
    
    // Check that all regions are displayed
    mockFinancialMetrics.revenue_by_region.forEach(region => {
      expect(screen.getByText(region.region)).toBeInTheDocument();
      expect(screen.getByText(`${region.percentage.toFixed(1)}% of total revenue`)).toBeInTheDocument();
    });
  });

  it('should display property type performance details', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    expect(screen.getByText('Property Type Performance Details')).toBeInTheDocument();
    
    // Check that all property types are displayed
    mockFinancialMetrics.revenue_by_property_type.forEach(type => {
      expect(screen.getByText(type.type)).toBeInTheDocument();
      expect(screen.getByText(`${type.count} properties`)).toBeInTheDocument();
    });
  });

  it('should calculate and display growth percentages', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    // Should show positive growth indicators
    const growthElements = screen.getAllByText(/\+.*%/);
    expect(growthElements.length).toBeGreaterThan(0);
  });

  it('should handle zero revenue gracefully', () => {
    const zeroMetrics: FinancialMetrics = {
      ...mockFinancialMetrics,
      total_revenue: 0,
      monthly_revenue: 0,
      average_property_value: 0,
      revenue_by_region: [],
      revenue_by_property_type: []
    };

    render(<FinancialReport metrics={zeroMetrics} />);
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    // Should handle empty arrays without crashing
  });

  it('should display appropriate badges for regions', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    // Greater Accra should be marked as "Highest"
    expect(screen.getByText('Highest')).toBeInTheDocument();
    
    // Northern should be marked as "Growth Potential"
    expect(screen.getByText('Growth Potential')).toBeInTheDocument();
    
    // Others should be marked as "Stable"
    expect(screen.getAllByText('Stable')).toHaveLength(2);
  });

  it('should calculate average property values correctly', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    // Should display calculated averages for each property type
    mockFinancialMetrics.revenue_by_property_type.forEach(type => {
      const expectedAvg = type.count > 0 ? type.revenue / type.count : 0;
      if (expectedAvg > 0) {
        // The formatted average should be displayed somewhere
        expect(screen.getByText(new RegExp(Math.round(expectedAvg).toLocaleString()))).toBeInTheDocument();
      }
    });
  });

  it('should show target achievement indicators', () => {
    render(<FinancialReport metrics={mockFinancialMetrics} />);
    
    // Should show percentage of annual target
    expect(screen.getByText(/% of annual target/)).toBeInTheDocument();
  });

  it('should handle different currency formats', () => {
    const usdMetrics: FinancialMetrics = {
      ...mockFinancialMetrics,
      currency: 'USD'
    };

    render(<FinancialReport metrics={usdMetrics} />);
    
    expect(screen.getByText('USD')).toBeInTheDocument();
  });
});