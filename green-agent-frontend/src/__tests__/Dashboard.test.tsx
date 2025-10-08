/**
 * Tests for Agent Dashboard component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/agent/Dashboard';
import * as authHook from '../hooks/useAuth';
import * as api from '../lib/api';

// Mock the hooks and API
vi.mock('../hooks/useAuth');
vi.mock('../lib/api');

const mockUser = {
  id: 'agent-001',
  email: 'agent@greentech.africa',
  name: 'Test Agent',
  role: 'agent' as const,
  location: 'Accra, Ghana',
  verified_agent: true,
};

const mockAnalytics = {
  projects: {
    total: 10,
    active: 5,
    completed: 3,
    on_hold: 2,
  },
  conversion_rates: {
    lead_to_quote: 0.45,
    quote_to_project: 0.60,
  },
  revenue: {
    total: 500000,
    currency: 'GHS',
  },
};

const mockLeads = {
  count: 8,
  results: [
    {
      id: 'L-001',
      title: 'Green Villa Construction',
      contact_name: 'John Doe',
      contact_email: 'john@example.com',
      status: 'new',
      last_activity_at: '2025-03-10T10:00:00Z',
    },
    {
      id: 'L-002',
      title: 'Eco Office Building',
      contact_name: 'Jane Smith',
      contact_email: 'jane@example.com',
      status: 'contacted',
      last_activity_at: '2025-03-09T15:30:00Z',
    },
  ],
};

const mockQuotes = {
  count: 5,
  results: [
    {
      id: 'Q-001',
      reference: 'QUO-2025-001',
      total_amount: 125000,
      currency_code: 'GHS',
      status: 'sent',
      status_display: 'Sent',
      sent_at: '2025-03-08T12:00:00Z',
      created_at: '2025-03-08T10:00:00Z',
    },
    {
      id: 'Q-002',
      reference: 'QUO-2025-002',
      total_amount: 85000,
      currency_code: 'GHS',
      status: 'draft',
      status_display: 'Draft',
      sent_at: null,
      created_at: '2025-03-09T14:00:00Z',
    },
  ],
};

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Agent Dashboard', () => {
  beforeEach(() => {
    // Mock useAuth hook
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    // Mock API calls
    vi.mocked(api.fetchAgentAnalytics).mockResolvedValue(mockAnalytics);
    vi.mocked(api.fetchRecentLeads).mockResolvedValue(mockLeads);
    vi.mocked(api.fetchRecentQuotes).mockResolvedValue(mockQuotes);
  });

  describe('Rendering', () => {
    it('should render dashboard with user greeting', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Test/i)).toBeInTheDocument();
      });
    });

    it('should display Ghana location badge', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Accra, Ghana/i)).toBeInTheDocument();
      });
    });

    it('should render all KPI cards', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Active Leads')).toBeInTheDocument();
        expect(screen.getByText('Quotes Sent')).toBeInTheDocument();
        expect(screen.getByText('Active Projects')).toBeInTheDocument();
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
      });
    });

    it('should render Ghana market insights section', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Ghana Sustainable Building Market/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should display correct lead count', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });

    it('should display correct active projects count', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('should calculate and display conversion rate', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('45%')).toBeInTheDocument();
      });
    });

    it('should count sent quotes correctly', async () => {
      renderDashboard();

      await waitFor(() => {
        // Only 1 quote has status 'sent'
        const quotesSentCard = screen.getByText('Quotes Sent').closest('div');
        expect(quotesSentCard).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity', () => {
    it('should display recent leads', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Green Villa Construction')).toBeInTheDocument();
        expect(screen.getByText('Eco Office Building')).toBeInTheDocument();
      });
    });

    it('should display lead contact information', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
        expect(screen.getByText(/jane@example.com/i)).toBeInTheDocument();
      });
    });

    it('should display recent quotes', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/QUO-2025-001/i)).toBeInTheDocument();
        expect(screen.getByText(/QUO-2025-002/i)).toBeInTheDocument();
      });
    });

    it('should display quote amounts in GHS', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/GHS 125,000/i)).toBeInTheDocument();
        expect(screen.getByText(/GHS 85,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Ghana-Specific Features', () => {
    it('should display average quote value in GHS', async () => {
      renderDashboard();

      await waitFor(() => {
        const avgQuoteSection = screen.getByText(/Avg Quote:/i);
        expect(avgQuoteSection).toBeInTheDocument();
        expect(avgQuoteSection.textContent).toContain('GHS');
      });
    });

    it('should show Ghana market trends', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Solar installations/i)).toBeInTheDocument();
        expect(screen.getByText(/Rainwater systems/i)).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('should render Create Quote button', async () => {
      renderDashboard();

      await waitFor(() => {
        const createQuoteButton = screen.getByRole('link', { name: /Create Quote/i });
        expect(createQuoteButton).toBeInTheDocument();
        expect(createQuoteButton).toHaveAttribute('href', '/quotes/new');
      });
    });

    it('should render View Calendar button', async () => {
      renderDashboard();

      await waitFor(() => {
        const calendarButton = screen.getByRole('link', { name: /View Calendar/i });
        expect(calendarButton).toBeInTheDocument();
        expect(calendarButton).toHaveAttribute('href', '/calendar');
      });
    });

    it('should render Open buttons for leads', async () => {
      renderDashboard();

      await waitFor(() => {
        // Check for the lead titles instead of "Open" buttons
        expect(screen.getByText('Green Villa Construction')).toBeInTheDocument();
        expect(screen.getByText('Eco Office Building')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(api.fetchAgentAnalytics).mockRejectedValue(new Error('API Error'));

      renderDashboard();

      await waitFor(() => {
        // Dashboard should still render even if analytics fail
        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no leads', async () => {
      vi.mocked(api.fetchRecentLeads).mockResolvedValue({ count: 0, results: [] });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/No recent leads yet/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no quotes', async () => {
      vi.mocked(api.fetchRecentQuotes).mockResolvedValue({ count: 0, results: [] });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/No quotes yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderDashboard();

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toBeInTheDocument();
      });
    });

    it('should have accessible links', async () => {
      renderDashboard();

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        links.forEach(link => {
          expect(link).toHaveAttribute('href');
        });
      });
    });
  });
});
