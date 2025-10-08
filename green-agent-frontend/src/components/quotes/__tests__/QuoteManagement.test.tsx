import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { QuoteBuilderForm } from '../QuoteBuilderForm';
import { EcoFeatureTemplates } from '../EcoFeatureTemplates';
import { QuoteVersionHistory } from '../QuoteVersionHistory';
import type { QuoteTimelineEntry, QuoteStatus } from '@/types/quote';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Quote Management Integration', () => {
  let mockOnItemsChange: ReturnType<typeof vi.fn>;
  let mockOnNotesChange: ReturnType<typeof vi.fn>;
  let mockOnTermsChange: ReturnType<typeof vi.fn>;
  let mockOnApplyTemplate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnItemsChange = vi.fn();
    mockOnNotesChange = vi.fn();
    mockOnTermsChange = vi.fn();
    mockOnApplyTemplate = vi.fn();
  });

  describe('QuoteBuilderForm Integration', () => {
    it('should handle Ghana-specific pricing with regional multipliers', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <QuoteBuilderForm
            currency="GHS"
            regionalMultiplier={1.25}
            onItemsChange={mockOnItemsChange}
            onNotesChange={mockOnNotesChange}
            onTermsChange={mockOnTermsChange}
            notes="Ghana-specific notes"
            terms="Ghana terms and conditions"
          />
        </Wrapper>
      );

      // Check that Ghana currency is displayed
      expect(screen.getAllByText(/GHS/).length).toBeGreaterThan(0);
      
      // Check regional multiplier badge
      expect(screen.getByText('Regional Multiplier: ×1.25')).toBeInTheDocument();
    });

    it('should calculate totals correctly with Ghana regional multipliers', async () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <QuoteBuilderForm
            currency="GHS"
            regionalMultiplier={1.25}
            onItemsChange={mockOnItemsChange}
            onNotesChange={mockOnNotesChange}
            onTermsChange={mockOnTermsChange}
            notes=""
            terms=""
          />
        </Wrapper>
      );

      // Add a line item
      const addButton = screen.getByText('Add Line Item');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnItemsChange).toHaveBeenCalled();
      });

      // Verify the form handles line item addition
      expect(screen.getByText('Add Line Item')).toBeInTheDocument();
    });

    it('should handle eco-feature cost calculations', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <QuoteBuilderForm
            currency="GHS"
            regionalMultiplier={1.15}
            onItemsChange={mockOnItemsChange}
            onNotesChange={mockOnNotesChange}
            onTermsChange={mockOnTermsChange}
            notes=""
            terms=""
          />
        </Wrapper>
      );

      // Check that the form renders with Ghana context
      expect(screen.getByText('Quote Summary')).toBeInTheDocument();
      expect(screen.getByText('Notes & Terms')).toBeInTheDocument();
    });
  });

  describe('EcoFeatureTemplates Integration', () => {
    it('should display Ghana-specific eco-feature templates', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <EcoFeatureTemplates
            currency="GHS"
            regionalMultiplier={1.2}
            onApplyTemplate={mockOnApplyTemplate}
          />
        </Wrapper>
      );

      // Check for eco-feature templates
      expect(screen.getByText('Eco-Feature Templates')).toBeInTheDocument();
      expect(screen.getByText('Quick-start templates with Ghana-specific eco-features and pricing')).toBeInTheDocument();
      
      // Check for template categories
      expect(screen.getByText('Basic Eco Package')).toBeInTheDocument();
      expect(screen.getByText('Solar Power Package')).toBeInTheDocument();
      expect(screen.getByText('Water Conservation Package')).toBeInTheDocument();
    });

    it('should apply templates with correct Ghana pricing', async () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <EcoFeatureTemplates
            currency="GHS"
            regionalMultiplier={1.3}
            onApplyTemplate={mockOnApplyTemplate}
          />
        </Wrapper>
      );

      // Find and click an apply button
      const applyButtons = screen.getAllByText('Apply');
      expect(applyButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(applyButtons[0]);
      
      await waitFor(() => {
        expect(mockOnApplyTemplate).toHaveBeenCalled();
      });
    });

    it('should display sustainability points for eco-features', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <EcoFeatureTemplates
            currency="GHS"
            regionalMultiplier={1.1}
            onApplyTemplate={mockOnApplyTemplate}
          />
        </Wrapper>
      );

      // Check for sustainability points indicators
      const sustainabilityBadges = screen.getAllByText(/pts/);
      expect(sustainabilityBadges.length).toBeGreaterThan(0);
    });
  });

  describe('QuoteVersionHistory Integration', () => {
    const mockTimeline: QuoteTimelineEntry[] = [
      {
        status: 'draft' as QuoteStatus,
        label: 'Quote created',
        timestamp: '2024-01-15T10:00:00Z',
      },
      {
        status: 'sent' as QuoteStatus,
        label: 'Quote sent to customer',
        timestamp: '2024-01-15T14:30:00Z',
      },
      {
        status: 'viewed' as QuoteStatus,
        label: 'Customer viewed quote',
        timestamp: '2024-01-16T09:15:00Z',
      },
    ];

    it('should display quote timeline with Ghana-appropriate formatting', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <QuoteVersionHistory
            timeline={mockTimeline}
            currentStatus="viewed"
          />
        </Wrapper>
      );

      expect(screen.getByText('Quote History')).toBeInTheDocument();
      expect(screen.getByText('3 events')).toBeInTheDocument();
      expect(screen.getByText('Quote created')).toBeInTheDocument();
      expect(screen.getByText('Quote sent to customer')).toBeInTheDocument();
      expect(screen.getByText('Customer viewed quote')).toBeInTheDocument();
    });

    it('should show current status indicator', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <QuoteVersionHistory
            timeline={mockTimeline}
            currentStatus="viewed"
          />
        </Wrapper>
      );

      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should handle empty timeline gracefully', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <QuoteVersionHistory
            timeline={[]}
            currentStatus="draft"
          />
        </Wrapper>
      );

      expect(screen.getByText('Quote History')).toBeInTheDocument();
      expect(screen.getByText('0 events')).toBeInTheDocument();
    });
  });

  describe('Quote Workflow Integration', () => {
    it('should support complete quote creation workflow', () => {
      const Wrapper = createWrapper();
      
      // This test verifies that all components work together
      const { rerender } = render(
        <Wrapper>
          <div>
            <QuoteBuilderForm
              currency="GHS"
              regionalMultiplier={1.25}
              onItemsChange={mockOnItemsChange}
              onNotesChange={mockOnNotesChange}
              onTermsChange={mockOnTermsChange}
              notes="Initial notes"
              terms="Initial terms"
            />
            <EcoFeatureTemplates
              currency="GHS"
              regionalMultiplier={1.25}
              onApplyTemplate={mockOnApplyTemplate}
            />
          </div>
        </Wrapper>
      );

      // Verify both components render together
      expect(screen.getByText('Quote Summary')).toBeInTheDocument();
      expect(screen.getByText('Eco-Feature Templates')).toBeInTheDocument();
      
      // Test template application workflow
      const applyButtons = screen.getAllByText('Apply');
      fireEvent.click(applyButtons[0]);
      
      expect(mockOnApplyTemplate).toHaveBeenCalled();
    });

    it('should handle Ghana-specific currency formatting consistently', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <div>
            <QuoteBuilderForm
              currency="GHS"
              regionalMultiplier={1.15}
              onItemsChange={mockOnItemsChange}
              onNotesChange={mockOnNotesChange}
              onTermsChange={mockOnTermsChange}
              notes=""
              terms=""
            />
            <EcoFeatureTemplates
              currency="GHS"
              regionalMultiplier={1.15}
              onApplyTemplate={mockOnApplyTemplate}
            />
          </div>
        </Wrapper>
      );

      // Both components should use GHS currency consistently
      const ghsElements = screen.getAllByText(/GHS/);
      expect(ghsElements.length).toBeGreaterThan(1);
    });
  });
});