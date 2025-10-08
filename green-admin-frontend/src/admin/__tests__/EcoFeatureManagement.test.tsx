import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EcoFeatureManagement from '../components/EcoFeatureManagement';
import type { EcoFeature, Region } from '../types';

// Mock data
const mockEcoFeatures: EcoFeature[] = [
  {
    id: 1,
    name: 'Solar Panels',
    category: 'energy',
    description: 'Photovoltaic panels for renewable energy',
    base_cost: 15000,
    sustainability_points: 25,
    available_in_ghana: true,
    regional_availability: { 'GH-GA': true, 'GH-AS': true },
    regional_pricing: { 'GH-GA': 1.1, 'GH-AS': 1.0 },
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Rainwater Harvesting',
    category: 'water',
    description: 'System to collect and store rainwater',
    base_cost: 8000,
    sustainability_points: 20,
    available_in_ghana: true,
    regional_availability: { 'GH-GA': true, 'GH-AS': false },
    regional_pricing: { 'GH-GA': 1.0 },
    created_at: '2024-01-01T00:00:00Z'
  }
];

const mockRegions: Region[] = [
  { code: 'GH-GA', name: 'Greater Accra', currency: 'GHS', multiplier: 1.14 },
  { code: 'GH-AS', name: 'Ashanti', currency: 'GHS', multiplier: 1.25 }
];

vi.mock('../data/db', () => ({
  db: {
    listEcoFeatures: vi.fn(() => mockEcoFeatures),
    listRegions: vi.fn(() => mockRegions),
    createEcoFeature: vi.fn((feature) => ({ ...feature, id: 3, created_at: new Date().toISOString() })),
    updateEcoFeature: vi.fn((id, updates) => {
      const feature = mockEcoFeatures.find(f => f.id === id);
      return feature ? { ...feature, ...updates, updated_at: new Date().toISOString() } : undefined;
    }),
    deleteEcoFeature: vi.fn()
  }
}));

describe('EcoFeatureManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render eco features management interface', () => {
    render(<EcoFeatureManagement />);
    
    expect(screen.getByText('Eco Features (2)')).toBeInTheDocument();
    expect(screen.getByText('Add Feature')).toBeInTheDocument();
    expect(screen.getByText('Solar Panels')).toBeInTheDocument();
    expect(screen.getByText('Rainwater Harvesting')).toBeInTheDocument();
  });

  it('should filter features by search term', async () => {
    render(<EcoFeatureManagement />);
    
    const searchInput = screen.getByPlaceholderText('Search eco features...');
    fireEvent.change(searchInput, { target: { value: 'solar' } });

    await waitFor(() => {
      expect(screen.getByText('Solar Panels')).toBeInTheDocument();
      expect(screen.queryByText('Rainwater Harvesting')).not.toBeInTheDocument();
    });
  });

  it('should filter features by category', async () => {
    render(<EcoFeatureManagement />);
    
    const categoryFilter = screen.getByDisplayValue('All Categories');
    fireEvent.click(categoryFilter);
    
    const energyOption = screen.getByText('Energy');
    fireEvent.click(energyOption);

    await waitFor(() => {
      expect(screen.getByText('Solar Panels')).toBeInTheDocument();
      expect(screen.queryByText('Rainwater Harvesting')).not.toBeInTheDocument();
    });
  });

  it('should filter features by availability', async () => {
    render(<EcoFeatureManagement />);
    
    const availabilityFilter = screen.getByDisplayValue('All Features');
    fireEvent.click(availabilityFilter);
    
    const availableOption = screen.getByText('Available in Ghana');
    fireEvent.click(availableOption);

    await waitFor(() => {
      // Both features are available in Ghana
      expect(screen.getByText('Solar Panels')).toBeInTheDocument();
      expect(screen.getByText('Rainwater Harvesting')).toBeInTheDocument();
    });
  });

  it('should display feature information correctly', () => {
    render(<EcoFeatureManagement />);
    
    // Check if feature details are displayed
    expect(screen.getByText('15,000 GHS')).toBeInTheDocument();
    expect(screen.getByText('25 pts')).toBeInTheDocument();
    expect(screen.getByText('8,000 GHS')).toBeInTheDocument();
    expect(screen.getByText('20 pts')).toBeInTheDocument();
  });

  it('should show category badges with correct styling', () => {
    render(<EcoFeatureManagement />);
    
    // Check for category badges
    const energyBadges = screen.getAllByText('energy');
    const waterBadges = screen.getAllByText('water');
    
    expect(energyBadges.length).toBeGreaterThan(0);
    expect(waterBadges.length).toBeGreaterThan(0);
  });

  it('should display regional availability correctly', () => {
    render(<EcoFeatureManagement />);
    
    // Solar panels should show "All Regions" or "2/2 Regions"
    // Rainwater harvesting should show "1/2 Regions"
    expect(screen.getByText('All Regions')).toBeInTheDocument();
    expect(screen.getByText('1/2 Regions')).toBeInTheDocument();
  });

  it('should open add feature dialog', async () => {
    render(<EcoFeatureManagement />);
    
    const addButton = screen.getByText('Add Feature');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Eco Feature')).toBeInTheDocument();
      expect(screen.getByLabelText('Feature Name *')).toBeInTheDocument();
    });
  });

  it('should open edit feature dialog', async () => {
    render(<EcoFeatureManagement />);
    
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-label') === 'Edit'
    );
    
    if (editButton) {
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Eco Feature')).toBeInTheDocument();
      });
    }
  });

  it('should handle feature creation', async () => {
    render(<EcoFeatureManagement />);
    
    const addButton = screen.getByText('Add Feature');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Eco Feature')).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByLabelText('Feature Name *');
    const descriptionInput = screen.getByLabelText('Description *');
    const costInput = screen.getByLabelText('Base Cost (GHS) *');
    const pointsInput = screen.getByLabelText('Sustainability Points *');

    fireEvent.change(nameInput, { target: { value: 'Test Feature' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    fireEvent.change(costInput, { target: { value: '5000' } });
    fireEvent.change(pointsInput, { target: { value: '15' } });

    // Submit form
    const createButton = screen.getByText('Create Feature');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(vi.mocked(require('../data/db').db.createEcoFeature)).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Feature',
          description: 'Test description',
          base_cost: 5000,
          sustainability_points: 15
        })
      );
    });
  });

  it('should handle feature deletion', async () => {
    render(<EcoFeatureManagement />);
    
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('aria-label') === 'Delete'
    );
    
    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Eco Feature')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Delete Feature');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(vi.mocked(require('../data/db').db.deleteEcoFeature)).toHaveBeenCalled();
      });
    }
  });

  it('should validate required fields in form', async () => {
    render(<EcoFeatureManagement />);
    
    const addButton = screen.getByText('Add Feature');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Eco Feature')).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const createButton = screen.getByText('Create Feature');
    fireEvent.click(createButton);

    // Form should not submit due to HTML5 validation
    expect(vi.mocked(require('../data/db').db.createEcoFeature)).not.toHaveBeenCalled();
  });

  it('should handle regional availability settings', async () => {
    render(<EcoFeatureManagement />);
    
    const addButton = screen.getByText('Add Feature');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Eco Feature')).toBeInTheDocument();
    });

    // Check if regional settings are shown
    expect(screen.getByText('Regional Availability & Pricing')).toBeInTheDocument();
    expect(screen.getByText('Greater Accra')).toBeInTheDocument();
    expect(screen.getByText('Ashanti')).toBeInTheDocument();
  });

  it('should show empty state when no features match filters', async () => {
    render(<EcoFeatureManagement />);
    
    const searchInput = screen.getByPlaceholderText('Search eco features...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No eco features found matching your criteria.')).toBeInTheDocument();
    });
  });

  it('should handle category selection in form', async () => {
    render(<EcoFeatureManagement />);
    
    const addButton = screen.getByText('Add Feature');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Eco Feature')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('Energy');
    fireEvent.click(categorySelect);
    
    const waterOption = screen.getByText('Water');
    fireEvent.click(waterOption);

    // Verify category was selected
    expect(screen.getByDisplayValue('Water')).toBeInTheDocument();
  });

  it('should toggle Ghana availability', async () => {
    render(<EcoFeatureManagement />);
    
    const addButton = screen.getByText('Add Feature');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Eco Feature')).toBeInTheDocument();
    });

    const ghanaSwitch = screen.getByLabelText('Available in Ghana');
    fireEvent.click(ghanaSwitch);

    // Regional settings should be hidden when not available in Ghana
    await waitFor(() => {
      expect(screen.queryByText('Regional Availability & Pricing')).not.toBeInTheDocument();
    });
  });
});