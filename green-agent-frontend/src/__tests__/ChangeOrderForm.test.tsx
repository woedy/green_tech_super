import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangeOrderForm from '@/components/projects/ChangeOrderForm';

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

const defaultProps = {
  projectId: 'PRJ-001',
  originalBudget: 100000,
  currency: 'GHS',
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
};

describe('ChangeOrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('renders change order form', () => {
    render(<ChangeOrderForm {...defaultProps} />);

    expect(screen.getByText('Create Change Order')).toBeInTheDocument();
    expect(screen.getByText('Project: PRJ-001 • Original Budget: GHS 100,000')).toBeInTheDocument();
  });

  it('displays form fields correctly', () => {
    render(<ChangeOrderForm {...defaultProps} />);

    expect(screen.getByLabelText('Change Order Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Reason for Change')).toBeInTheDocument();
    expect(screen.getByLabelText('Estimated Additional Days')).toBeInTheDocument();
  });

  it('shows initial change item', () => {
    render(<ChangeOrderForm {...defaultProps} />);

    expect(screen.getByText('Change Items')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Unit Cost (GHS)')).toBeInTheDocument();
  });

  it('adds new change items', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);

    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('removes change items', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    // Add a second item first
    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);

    // Now remove it
    const removeButtons = screen.getAllByRole('button', { name: '' }); // Trash icon buttons
    const removeButton = removeButtons.find(btn => btn.querySelector('svg'));
    if (removeButton) {
      await user.click(removeButton);
    }

    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
  });

  it('calculates cost impact correctly for additions', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    // Fill in item details
    const quantityInput = screen.getByLabelText('Quantity');
    const unitCostInput = screen.getByLabelText('Unit Cost (GHS)');

    await user.clear(quantityInput);
    await user.type(quantityInput, '2');
    await user.clear(unitCostInput);
    await user.type(unitCostInput, '5000');

    await waitFor(() => {
      expect(screen.getByText('Item Cost: GHS 10,000')).toBeInTheDocument();
    });

    // Check cost impact summary
    expect(screen.getByText('+GHS 10,000')).toBeInTheDocument();
    expect(screen.getByText('GHS 110,000')).toBeInTheDocument(); // New budget
  });

  it('calculates cost impact correctly for removals', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    // Change type to removal
    const typeSelect = screen.getByDisplayValue('addition');
    await user.click(typeSelect);
    const removalOption = screen.getByText('Removal');
    await user.click(removalOption);

    // Fill in item details
    const quantityInput = screen.getByLabelText('Quantity');
    const unitCostInput = screen.getByLabelText('Unit Cost (GHS)');

    await user.clear(quantityInput);
    await user.type(quantityInput, '1');
    await user.clear(unitCostInput);
    await user.type(unitCostInput, '3000');

    await waitFor(() => {
      expect(screen.getByText('Item Cost: GHS -3,000')).toBeInTheDocument();
    });

    // Check cost impact summary
    expect(screen.getByText('-GHS 3,000')).toBeInTheDocument();
    expect(screen.getByText('GHS 97,000')).toBeInTheDocument(); // New budget
  });

  it('includes labor and material costs in calculations', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    // Fill in all cost fields
    const quantityInput = screen.getByLabelText('Quantity');
    const unitCostInput = screen.getByLabelText('Unit Cost (GHS)');
    const laborHoursInput = screen.getByLabelText('Labor Hours (Optional)');
    const materialCostInput = screen.getByLabelText('Material Cost (GHS)');

    await user.clear(quantityInput);
    await user.type(quantityInput, '1');
    await user.clear(unitCostInput);
    await user.type(unitCostInput, '1000');
    await user.clear(laborHoursInput);
    await user.type(laborHoursInput, '10'); // 10 hours * $50/hour = $500
    await user.clear(materialCostInput);
    await user.type(materialCostInput, '500');

    await waitFor(() => {
      // Total: 1000 + (10 * 50) + 500 = 2000
      expect(screen.getByText('Item Cost: GHS 2,000')).toBeInTheDocument();
    });
  });

  it('shows budget change percentage', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    const quantityInput = screen.getByLabelText('Quantity');
    const unitCostInput = screen.getByLabelText('Unit Cost (GHS)');

    await user.clear(quantityInput);
    await user.type(quantityInput, '1');
    await user.clear(unitCostInput);
    await user.type(unitCostInput, '10000'); // 10% of original budget

    await waitFor(() => {
      expect(screen.getByText('+10.0% from original budget')).toBeInTheDocument();
    });
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    // Fill in form
    await user.type(screen.getByLabelText('Change Order Title'), 'Additional Bathroom');
    const descriptions = screen.getAllByLabelText('Description');
    await user.type(descriptions[0], 'Add a second bathroom to the ground floor'); // Main description
    await user.type(screen.getByLabelText('Reason for Change'), 'Client requested additional bathroom');
    await user.type(screen.getByLabelText('Estimated Additional Days'), '5');

    // Fill in item details
    const itemDescriptions = screen.getAllByLabelText('Description');
    await user.type(itemDescriptions[1], 'Bathroom installation'); // Use the item description field
    const quantityInput = screen.getByLabelText('Quantity');
    const unitCostInput = screen.getByLabelText('Unit Cost (GHS)');
    await user.clear(quantityInput);
    await user.type(quantityInput, '1');
    await user.clear(unitCostInput);
    await user.type(unitCostInput, '15000');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create change order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Additional Bathroom',
          description: 'Add a second bathroom to the ground floor',
          reason: 'Client requested additional bathroom',
          estimatedDays: 5,
          totalCostImpact: 15000,
          items: expect.arrayContaining([
            expect.objectContaining({
              description: 'Bathroom installation',
              type: 'addition',
              quantity: 1,
              unitCost: 15000,
            })
          ])
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows/hides cost breakdown', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    const breakdownButton = screen.getByRole('button', { name: /show breakdown/i });
    await user.click(breakdownButton);

    expect(screen.getByText('Item Breakdown')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide breakdown/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /create change order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getAllByText('Description is required')).toHaveLength(2); // Form and item description
      expect(screen.getByText('Reason is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows loading state when submitting', async () => {
    const user = userEvent.setup();
    render(<ChangeOrderForm {...defaultProps} isSubmitting={true} />);

    const submitButton = screen.getByRole('button', { name: /creating.../i });
    expect(submitButton).toBeDisabled();
  });
});