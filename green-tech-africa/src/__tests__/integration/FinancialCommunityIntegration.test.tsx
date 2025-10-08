import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import FinancialTools from '@/pages/FinancialTools';
import Community from '@/pages/Community';
import { api } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api');
const mockApi = api as any;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Financial Tools and Community Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Financial Tools Page', () => {
    it('renders all financial tool tabs', () => {
      mockApi.get = vi.fn().mockResolvedValue([]);
      
      renderWithProviders(<FinancialTools />);
      
      expect(screen.getByText('Financial Tools & Resources')).toBeInTheDocument();
      expect(screen.getByText('Financing Calculator')).toBeInTheDocument();
      expect(screen.getByText('Cost Savings')).toBeInTheDocument();
      expect(screen.getByText('Gov. Incentives')).toBeInTheDocument();
      expect(screen.getByText('Bank Partners')).toBeInTheDocument();
    });

    it('switches between tabs correctly', async () => {
      mockApi.get = vi.fn().mockResolvedValue([]);
      
      renderWithProviders(<FinancialTools />);
      
      // Click on Cost Savings tab
      fireEvent.click(screen.getByRole('tab', { name: /Cost Savings/ }));
      
      await waitFor(() => {
        expect(screen.getByText('Cost Savings & ROI Calculator')).toBeInTheDocument();
      });
    });

    it('displays government incentives when available', async () => {
      const mockIncentives = [
        {
          id: 1,
          name: 'Solar Panel Rebate',
          incentive_type: 'rebate',
          description: 'Government rebate for solar installations',
          amount: '2000.00',
          is_percentage: false,
          start_date: '2023-01-01',
          end_date: '2024-12-31',
        },
      ];
      
      mockApi.get = vi.fn().mockResolvedValue(mockIncentives);
      
      renderWithProviders(<FinancialTools />);
      
      // Click on Government Incentives tab
      fireEvent.click(screen.getByRole('tab', { name: /Gov. Incentives/ }));
      
      await waitFor(() => {
        expect(screen.getByText('Solar Panel Rebate')).toBeInTheDocument();
      });
    });
  });

  describe('Community Page', () => {
    it('renders all community tabs', () => {
      mockApi.get = vi.fn().mockResolvedValue([]);
      
      renderWithProviders(<Community />);
      
      expect(screen.getByText('Community & Knowledge Hub')).toBeInTheDocument();
      expect(screen.getByText('Case Studies')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Expert Consultation')).toBeInTheDocument();
    });

    it('displays case studies when available', async () => {
      const mockCaseStudies = [
        {
          id: 1,
          title: 'Solar Community Center',
          slug: 'solar-community-center',
          location: 'Accra, Ghana',
          project_type: 'community',
          overview: 'A sustainable community center',
          energy_savings: 85,
          water_savings: 60,
          cost_savings: 12000,
          co2_reduction: 2500,
          featured: true,
          created_at: '2023-06-15T10:00:00Z',
        },
      ];
      
      mockApi.get = vi.fn().mockResolvedValue(mockCaseStudies);
      
      renderWithProviders(<Community />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Community Center')).toBeInTheDocument();
      });
    });

    it('displays educational content when available', async () => {
      const mockEducationalContent = [
        {
          id: 1,
          title: 'Solar Panel Installation Guide',
          slug: 'solar-panel-guide',
          content_type: 'guide',
          category: 'energy',
          summary: 'Complete guide to installing solar panels in Ghana',
          published_date: '2023-06-15T10:00:00Z',
        },
      ];
      
      mockApi.get = vi.fn().mockResolvedValue(mockEducationalContent);
      
      renderWithProviders(<Community />);
      
      // Click on Education tab
      fireEvent.click(screen.getByRole('tab', { name: /Education/ }));
      
      await waitFor(() => {
        expect(screen.getByText('Solar Panel Installation Guide')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-feature Integration', () => {
    it('provides consistent Ghana-focused experience', () => {
      mockApi.get = vi.fn().mockResolvedValue([]);
      
      // Test Financial Tools Ghana focus
      const { unmount: unmountFinancial } = renderWithProviders(<FinancialTools />);
      expect(screen.getByText(/Ghana/)).toBeInTheDocument();
      unmountFinancial();
      
      // Test Community Ghana focus
      renderWithProviders(<Community />);
      expect(screen.getByText(/Ghana/)).toBeInTheDocument();
    });

    it('uses consistent currency formatting', async () => {
      const mockIncentives = [
        {
          id: 1,
          name: 'Test Incentive',
          incentive_type: 'rebate',
          description: 'Test description',
          amount: '5000.00',
          is_percentage: false,
          start_date: '2023-01-01',
        },
      ];
      
      mockApi.get = vi.fn().mockResolvedValue(mockIncentives);
      
      renderWithProviders(<FinancialTools />);
      
      // Click on Government Incentives tab
      fireEvent.click(screen.getByRole('tab', { name: /Gov. Incentives/ }));
      
      await waitFor(() => {
        // Should use Ghana Cedis formatting
        expect(screen.getByText(/GH₵5,000/)).toBeInTheDocument();
      });
    });
  });
});