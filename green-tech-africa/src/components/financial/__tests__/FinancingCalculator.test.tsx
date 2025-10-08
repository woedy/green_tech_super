import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { FinancingCalculator } from '../FinancingCalculator';
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

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('FinancingCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the financing calculator form', () => {
    mockApi.get = vi.fn().mockResolvedValue([]);
    
    renderWithQueryClient(<FinancingCalculator />);
    
    expect(screen.getByText('Financing Calculator')).toBeInTheDocument();
    expect(screen.getByLabelText(/Property Value/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Down Payment/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Interest Rate/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loan Term/)).toBeInTheDocument();
  });

  it('calculates payment when form is submitted', async () => {
    mockApi.get = vi.fn().mockResolvedValue([]);
    mockApi.post = vi.fn().mockResolvedValue({
      loan_amount: 80000,
      down_payment: 20000,
      payment_amount: 429.46,
      payment_frequency: 'monthly',
      total_interest: 74605.60,
      total_payment: 154605.60,
      term_months: 360,
    });

    renderWithQueryClient(<FinancingCalculator />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Property Value/), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText(/Down Payment/), { target: { value: '20000' } });
    fireEvent.change(screen.getByLabelText(/Interest Rate/), { target: { value: '5.0' } });
    fireEvent.change(screen.getByLabelText(/Loan Term/), { target: { value: '360' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Calculate Payment'));
    
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/finances/payment-plans/calculate/', {
        amount: 100000,
        down_payment: 20000,
        interest_rate: 5.0,
        term_months: 360,
        payment_frequency: 'monthly',
      });
    });
  });

  it('displays calculation results', async () => {
    mockApi.get = vi.fn().mockResolvedValue([]);
    mockApi.post = vi.fn().mockResolvedValue({
      loan_amount: 80000,
      down_payment: 20000,
      payment_amount: 429.46,
      payment_frequency: 'monthly',
      total_interest: 74605.60,
      total_payment: 154605.60,
      term_months: 360,
    });

    renderWithQueryClient(<FinancingCalculator />);
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Property Value/), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText(/Interest Rate/), { target: { value: '5.0' } });
    fireEvent.change(screen.getByLabelText(/Loan Term/), { target: { value: '360' } });
    fireEvent.click(screen.getByText('Calculate Payment'));
    
    await waitFor(() => {
      expect(screen.getByText(/GH₵429/)).toBeInTheDocument();
      expect(screen.getByText(/30 years/)).toBeInTheDocument();
    });
  });

  it('validates required fields', () => {
    mockApi.get = vi.fn().mockResolvedValue([]);
    
    renderWithQueryClient(<FinancingCalculator />);
    
    const calculateButton = screen.getByText('Calculate Payment');
    expect(calculateButton).toBeDisabled();
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Property Value/), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText(/Interest Rate/), { target: { value: '5.0' } });
    fireEvent.change(screen.getByLabelText(/Loan Term/), { target: { value: '360' } });
    
    expect(calculateButton).not.toBeDisabled();
  });
});