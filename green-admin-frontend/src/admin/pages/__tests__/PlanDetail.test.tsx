import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PlanForm } from '../PlanDetail';
import { adminApi } from '../../api';

vi.mock('../../api');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  };
});

describe('PlanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form with all required fields', () => {
    render(
      <BrowserRouter>
        <PlanForm />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/style/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bedrooms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bathrooms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/floors/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/area/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/base price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
  });

  it('should submit correct payload structure when creating a plan', async () => {
    const user = userEvent.setup();
    const mockCreatePlan = vi.fn().mockResolvedValue({ id: 1, name: 'Test Plan' });
    vi.mocked(adminApi.createPlan).mockImplementation(mockCreatePlan);

    render(
      <BrowserRouter>
        <PlanForm />
      </BrowserRouter>
    );

    // Fill in required fields
    await user.type(screen.getByLabelText(/name/i), 'Modern Villa');
    await user.type(screen.getByLabelText(/style/i), 'Contemporary');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockCreatePlan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Modern Villa',
          style: 'Contemporary',
          slug: expect.any(String),
          bedrooms: expect.any(Number),
          bathrooms: expect.any(Number),
          floors: expect.any(Number),
          area_sq_m: expect.any(String),
          base_price: expect.any(String),
          base_currency: expect.any(String),
          has_garage: expect.any(Boolean),
          energy_rating: expect.any(Number),
          water_rating: expect.any(Number),
          sustainability_score: expect.any(Number),
          is_published: expect.any(Boolean),
          images: expect.any(Array),
          features: expect.any(Array),
          options: expect.any(Array),
          pricing: expect.any(Array),
          specs: expect.any(Object),
          tags: expect.any(Array),
        })
      );
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <PlanForm />
      </BrowserRouter>
    );

    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/name and style are required/i)).toBeInTheDocument();
    });
  });
});
